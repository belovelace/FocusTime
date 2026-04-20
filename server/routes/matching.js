// server/routes/matching.js
const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { getUserRecentEmbedding, cosineSimilarity, similarityToScore } = require('../services/embeddingService');

// 규칙 기반 점수 계산 (80점 만점)
function calcRuleScore(candidate, target) {
  const completionRate  = candidate.completion_rate  ?? 50;
  const cancellationRate = candidate.cancellation_rate ?? 10;
  const avgRating       = candidate.avg_rating        ?? 3.0;
  const candidateMode   = candidate.preferred_focus_mode;
  const targetMode      = target.preferred_focus_mode;
  const candidateHour   = candidate.peak_hour ?? 12;
  const targetHour      = target.peak_hour    ?? 12;

  // ① 완료율 24점
  const completionScore = (completionRate / 100) * 24;

  // ② 취소율 페널티 12점
  const cancellationScore = (1 - cancellationRate / 100) * 12;

  // ③ 평균 평점 20점
  const ratingScore = (avgRating / 5) * 20;

  // ④ 집중 모드 일치 16점
  let modeScore = 4;
  if (candidateMode === targetMode) modeScore = 16;
  else if (candidateMode === 'any' || targetMode === 'any') modeScore = 12;

  // ⑤ 피크 시간 유사도 8점
  const hourDiff = Math.abs(candidateHour - targetHour);
  let hourScore = 0;
  if (hourDiff <= 2) hourScore = 8;
  else if (hourDiff <= 4) hourScore = 4;

  return completionScore + cancellationScore + ratingScore + modeScore + hourScore;
}

// GET /api/matching/candidates
router.get('/candidates', auth, async (req, res) => {
  try {
    const userId = req.userId; // auth 미들웨어에서 주입
    const { focusMode, duration } = req.query;

    // 1. 대상 유저 시그널 조회
    const [targetStats] = await prisma.$queryRaw`
      SELECT * FROM v_user_session_stats WHERE user_id = ${userId}
    `;

    if (!targetStats) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    // 2. 차단 유저 ID 목록 조회 (양방향)
    const blocks = await prisma.$queryRaw`
      SELECT blocked_id AS id FROM blocks WHERE blocker_id = ${userId}
      UNION
      SELECT blocker_id AS id FROM blocks WHERE blocked_id = ${userId}
    `;
    const blockedIds = blocks.map((b) => Number(b.id));

    // 3. 후보 유저 목록 조회
    const candidates = await prisma.$queryRaw`
      SELECT * FROM v_user_session_stats WHERE user_id != ${userId}
    `;

    // 4. 즐겨찾기 목록 조회
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { partnerId: true },
    });
    const favoriteIds = new Set(favorites.map((f) => Number(f.partnerId)));

    // 5. 대상 유저 임베딩 벡터 조회
    const targetEmbedding = await getUserRecentEmbedding(userId);

    // 6. 각 후보 점수 계산
    const scored = await Promise.all(
      candidates
        .filter((c) => !blockedIds.includes(Number(c.user_id))) // 차단 제외
        .map(async (c) => {
          const candidateId = Number(c.user_id);

          // 규칙 기반 점수 (80점)
          const ruleScore = calcRuleScore(c, targetStats);

          // AI 임베딩 유사도 점수 (20점)
          let aiScore = 10; // 기본값
          if (targetEmbedding) {
            const candidateEmbedding = await getUserRecentEmbedding(candidateId);
            if (candidateEmbedding) {
              const similarity = cosineSimilarity(targetEmbedding, candidateEmbedding);
              aiScore = similarityToScore(similarity);
            }
          }

          const matchScore = Math.round((ruleScore + aiScore) * 10) / 10;
          const isFavorite = favoriteIds.has(candidateId);

          return {
            userId: candidateId,
            nickname: c.nickname,
            timezone: c.timezone,
            completionRate: c.completion_rate ?? 50,
            avgRating: c.avg_rating ?? 3.0,
            preferredFocusMode: c.preferred_focus_mode ?? 'any',
            preferredDuration: c.preferred_duration ?? null,
            goalSimilarityScore: Math.round(aiScore * 10) / 10,
            matchScore,
            isFavorite,
            subscriptionPlan: c.subscription_plan ?? 'free',
          };
        })
    );

    // 7. focusMode / duration 필터 적용
    let filtered = scored;
    if (focusMode && focusMode !== 'any') {
      filtered = filtered.filter(
        (c) => c.preferredFocusMode === focusMode || c.preferredFocusMode === 'any'
      );
    }
    if (duration) {
      filtered = filtered.filter(
        (c) => c.preferredDuration === Number(duration) || c.preferredDuration === null
      );
    }

    // 8. 즐겨찾기 우선 → 점수 내림차순 정렬 → 최대 20명
    const result = filtered
      .sort((a, b) => {
        if (b.isFavorite !== a.isFavorite) return b.isFavorite - a.isFavorite;
        return b.matchScore - a.matchScore;
      })
      .slice(0, 20);

    return res.json({ candidates: result, aiPowered: true });
  } catch (err) {
    console.error('[matching] error:', err);
    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
