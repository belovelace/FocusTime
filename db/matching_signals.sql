-- ============================================================
-- FocusTime — AI 매칭 추천용 시그널 집계 쿼리
-- 목적: 유저별 매칭 적합도 피처를 추출하여 추천 알고리즘에 활용
-- ============================================================
USE focustime;
-- ── 1. 유저별 세션 통계 뷰 (핵심 시그널) ──────────────────────
CREATE OR REPLACE VIEW v_user_session_stats AS
SELECT
    u.id                                                      AS user_id,
    u.nickname,
    u.timezone,

    -- 세션 이력
    COUNT(sp.session_id)                                      AS total_sessions,
    SUM(CASE WHEN sp.status = 'done'      THEN 1 ELSE 0 END) AS done_sessions,
    SUM(CASE WHEN sp.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_sessions,

    -- 완료율 / 취소율 (매칭 신뢰도 시그널)
    ROUND(
        SUM(CASE WHEN sp.status = 'done' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(sp.session_id), 0) * 100, 1
    )                                                         AS completion_rate,

    ROUND(
        SUM(CASE WHEN sp.status = 'cancelled' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(sp.session_id), 0) * 100, 1
    )                                                         AS cancellation_rate,

    -- 평균 평점 (파트너 만족도)
    ROUND(AVG(sg.rating), 2)                                  AS avg_rating,

    -- 선호 세션 길이 (최빈값)
    (
        SELECT s2.duration_min
        FROM sessions s2
        JOIN session_participants sp2
          ON sp2.session_id = s2.id AND sp2.user_id = u.id
        GROUP BY s2.duration_min
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )                                                         AS preferred_duration,

    -- 선호 집중 모드 (최빈값)
    (
        SELECT s3.focus_mode
        FROM sessions s3
        JOIN session_participants sp3
          ON sp3.session_id = s3.id AND sp3.user_id = u.id
        GROUP BY s3.focus_mode
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )                                                         AS preferred_focus_mode,

    -- 주로 활동하는 시간대 (시 기준 최빈값)
    (
        SELECT HOUR(s4.starts_at)
        FROM sessions s4
        JOIN session_participants sp4
          ON sp4.session_id = s4.id AND sp4.user_id = u.id
        WHERE sp4.status = 'done'
        GROUP BY HOUR(s4.starts_at)
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )                                                         AS peak_hour,

    -- 구독 플랜
    sub.plan                                                  AS subscription_plan,

    -- 즐겨찾기 수 (사회적 신호)
    (SELECT COUNT(*) FROM favorites f WHERE f.user_id = u.id) AS favorites_count,
    (SELECT COUNT(*) FROM favorites f WHERE f.partner_id = u.id) AS favorited_by_count

FROM users u
LEFT JOIN session_participants sp ON sp.user_id = u.id
LEFT JOIN session_goals sg        ON sg.user_id = u.id AND sg.session_id = sp.session_id
LEFT JOIN subscriptions sub       ON sub.user_id = u.id
WHERE u.status = 'active'
GROUP BY u.id, u.nickname, u.timezone, sub.plan;


-- ── 2. 특정 유저에 대한 매칭 후보 점수 계산 쿼리 ──────────────
-- :target_user_id 자리에 추천 대상 유저 ID를 바인딩
-- 높은 score 순으로 추천

PREPARE matching_candidates FROM '
SELECT
    c.user_id                                                  AS candidate_id,
    c.nickname,
    c.completion_rate,
    c.cancellation_rate,
    c.avg_rating,
    c.preferred_focus_mode,
    c.peak_hour,
    c.subscription_plan,

    -- ── 점수 계산 (100점 만점) ──────────────────────────────
    ROUND(
        -- ① 완료율 (30점): 완료율 높을수록 신뢰 가능한 파트너
        (COALESCE(c.completion_rate, 50) / 100.0 * 30)

        -- ② 취소율 페널티 (−15점): 취소율 높으면 감점
        + (1 - COALESCE(c.cancellation_rate, 10) / 100.0) * 15

        -- ③ 평균 평점 (25점): 5점 만점 기준
        + (COALESCE(c.avg_rating, 3.0) / 5.0 * 25)

        -- ④ 집중 모드 일치 (20점): 동일 모드 또는 any이면 만점
        + CASE
            WHEN t.preferred_focus_mode = c.preferred_focus_mode THEN 20
            WHEN c.preferred_focus_mode = ''any'' OR t.preferred_focus_mode = ''any'' THEN 15
            ELSE 5
          END

        -- ⑤ 피크 시간 유사도 (10점): 2시간 이내 차이
        + CASE
            WHEN ABS(COALESCE(t.peak_hour,12) - COALESCE(c.peak_hour,12)) <= 2 THEN 10
            WHEN ABS(COALESCE(t.peak_hour,12) - COALESCE(c.peak_hour,12)) <= 4 THEN 5
            ELSE 0
          END
    , 1)                                                       AS match_score,

    -- 차단 여부 체크용
    EXISTS (
        SELECT 1 FROM blocks b
        WHERE (b.blocker_id = ? AND b.blocked_id = c.user_id)
           OR (b.blocker_id = c.user_id AND b.blocked_id = ?)
    )                                                          AS is_blocked,

    -- 즐겨찾기 여부
    EXISTS (
        SELECT 1 FROM favorites fv
        WHERE fv.user_id = ? AND fv.partner_id = c.user_id
    )                                                          AS is_favorite

FROM v_user_session_stats c
-- 대상 유저 정보 join
JOIN v_user_session_stats t ON t.user_id = ?

WHERE c.user_id != ?

HAVING is_blocked = 0   -- 차단 유저 제외

ORDER BY
    is_favorite DESC,   -- 즐겨찾기 우선
    match_score DESC    -- 그 다음 점수순
LIMIT 20
';


-- ── 3. 이번 주 세션 제한 체크 쿼리 (무료 플랜용) ──────────────
-- :check_user_id 에 유저 ID 바인딩
-- 무료 플랜: 주 3회 초과 여부 확인

SELECT
    u.id,
    sub.plan,
    COUNT(sp.session_id)                         AS sessions_this_week,
    CASE
        WHEN sub.plan != 'free' THEN FALSE
        WHEN COUNT(sp.session_id) >= 3 THEN TRUE
        ELSE FALSE
    END                                          AS is_limit_reached
FROM users u
JOIN subscriptions sub ON sub.user_id = u.id
LEFT JOIN session_participants sp
    ON sp.user_id = u.id
    AND sp.status IN ('done', 'joined')
LEFT JOIN sessions s ON s.id = sp.session_id
    AND s.starts_at >= DATE_SUB(
            DATE_FORMAT(NOW(), '%Y-%m-%d 00:00:00')
            - INTERVAL WEEKDAY(NOW()) DAY,
            INTERVAL 0 DAY
        )  -- 이번 주 월요일 00:00 KST
    AND s.starts_at < NOW()
WHERE u.id = 1  -- 여기에 체크할 유저 ID
GROUP BY u.id, sub.plan;


-- ── 4. 매칭 품질 모니터링 쿼리 ────────────────────────────────
-- 알고리즘 성능 검증용: 매칭된 세션의 완료율/평점 추이
SELECT
    DATE_FORMAT(s.starts_at, '%Y-%m') AS month,
    COUNT(*)                          AS total_matched,
    SUM(CASE WHEN s.status = 'done'      THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
    ROUND(AVG(sg.rating), 2)          AS avg_partner_rating
FROM sessions s
LEFT JOIN session_goals sg ON sg.session_id = s.id
WHERE s.partner_id IS NOT NULL
  AND s.starts_at < NOW()
GROUP BY month
ORDER BY month DESC
LIMIT 12;

commit;
