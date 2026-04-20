# FocusTime — AI 네이티브 매칭 추천 (OpenAI 임베딩)

## 스택
- Backend: Node.js + Express + Prisma (MySQL)
- Frontend: Next.js 14 App Router + TypeScript + Tailwind CSS
- Auth: JWT Bearer Token
- AI: OpenAI text-embedding-3-small — 목표 텍스트 벡터 유사도

## 핵심 아이디어
유저가 입력한 목표 텍스트(`session_goals.goal_text`)를 OpenAI 임베딩 벡터로 변환해
DB에 저장해두고, 매칭 시 코사인 유사도로 비슷한 목표의 파트너를 우선 추천한다.
규칙 기반 점수(80점) + 임베딩 유사도 점수(20점) = 총 100점

---

## STEP 1 — 환경변수 추가
`.env`에 추가:
```
OPENAI_API_KEY=sk-...
```

패키지 설치:
```bash
npm install openai
```

---

## STEP 2 — 백엔드

### 2-1. 임베딩 서비스
파일: `server/services/embeddingService.js`

```
기능 1. generateEmbedding(text)
  - OpenAI text-embedding-3-small 모델로 텍스트 → 벡터(float[]) 변환
  - 반환: number[] (1536차원)

기능 2. cosineSimilarity(vecA, vecB)
  - 두 벡터의 코사인 유사도 계산
  - 반환: -1 ~ 1 사이 float

기능 3. saveGoalEmbedding(goalId, text)
  - generateEmbedding(text) 호출
  - session_goals.goal_embedding 컬럼에 JSON.stringify(vector) 저장
  - Prisma: prisma.sessionGoal.update({ where: { id: goalId }, data: { goalEmbedding: vector } })

기능 4. getUserRecentEmbedding(userId)
  - 해당 유저의 goal_embedding이 있는 최근 목표 3개 조회
  - 벡터 평균 내서 대표 벡터 1개 반환 (없으면 null)
```

### 2-2. 목표 저장 시 임베딩 자동 생성
파일: `server/routes/sessions.js` (기존 파일 수정)

`POST /api/sessions/:id/goals` 핸들러에서 goal 저장 후:
```js
// goal 저장 직후 비동기로 임베딩 생성 (응답 블로킹 없이)
if (goalText) {
  embeddingService.saveGoalEmbedding(newGoal.id, goalText).catch(console.error);
}
```

### 2-3. 기존 goal_text 일괄 임베딩 스크립트
파일: `scripts/backfill-embeddings.js`

```
- session_goals에서 goal_text IS NOT NULL AND goal_embedding IS NULL 인 행 전체 조회
- 100ms 간격으로 순차 처리 (OpenAI rate limit 방지)
- 진행상황 콘솔 출력: "임베딩 완료: 45/312"
```

실행:
```bash
node scripts/backfill-embeddings.js
```

### 2-4. 매칭 라우트
파일: `server/routes/matching.js`

**GET /api/matching/candidates**
JWT 인증 필수. 쿼리 파라미터: `focusMode`, `duration` (선택)

처리 순서:
```
1. v_user_session_stats 뷰로 후보 목록 조회 (차단 유저 제외)
2. 요청 유저의 대표 임베딩 벡터 조회 (getUserRecentEmbedding)
3. 후보 유저들의 대표 임베딩 벡터 조회
4. 코사인 유사도 계산 → 0~20점으로 정규화
   - 유사도 1.0 → 20점, 0.0 → 0점, 임베딩 없는 유저 → 10점(기본값)
5. 규칙 기반 점수 + 유사도 점수 합산
6. favorites 유저 최상단, match_score 내림차순 정렬
7. 최대 20명 반환
```

점수 계산:
```
규칙 기반 (80점):
  - 완료율         24점
  - 취소율 페널티  12점
  - 평균 평점      20점
  - 집중 모드      16점 (완전일치 16 / any포함 12 / 불일치 4)
  - 피크 시간       8점 (2시간이내 8 / 4시간이내 4 / 초과 0)

AI 임베딩 유사도 (20점):
  - cosineSimilarity 결과를 0~20점으로 정규화
```

규칙:
- `blocks` 양방향 차단 유저 제외
- `favorites` 유저 최상단 정렬
- cold start (세션 0건): completion_rate=50, avg_rating=3.0, cancellation_rate=10
- BigInt → Number() 변환 필수

응답:
```json
{
  "candidates": [
    {
      "userId": 5,
      "nickname": "코딩닌자5",
      "matchScore": 88.5,
      "goalSimilarityScore": 17.2,
      "isFavorite": false,
      "completionRate": 91.0,
      "avgRating": 4.5,
      "preferredFocusMode": "desk",
      "recentGoals": ["코딩 테스트 준비", "알고리즘 복습"]
    }
  ],
  "aiPowered": true
}
```

`server/index.js`에 라우트 등록:
```js
app.use('/api/matching', require('./routes/matching'));
```

---

## STEP 3 — 프론트엔드

### CandidateCard.tsx
파일: `components/matching/CandidateCard.tsx`

카드 구성:
- 닉네임, 아바타, 즐겨찾기 ★
- 매칭 점수 배지 (80+ 초록 `#2F9E44` / 60~79 인디고 `#3B5BDB` / 60미만 회색)
- 최근 목표 태그 최대 2개 (회색 pill, 12px)
- **"✦ AI 매칭"** 배지 — `aiPowered: true`일 때 표시 (`bg-[#EDF2FF] text-[#3B5BDB]`)
- "세션 초대하기" 버튼 → `POST /api/sessions` 호출 후 토스트 알림

### browse 페이지
파일: `app/sessions/browse/page.tsx` 상단에 섹션 추가

- 섹션 타이틀: "✦ AI 추천 파트너" (bold, 인디고)
- 필터 pill: 세션 길이(25/50/75분) + 집중 모드(데스크/이동/무관)
- 로딩: skeleton 카드 3개 (pulse 애니메이션)
- 빈 결과: "추천할 파트너가 없습니다. 필터를 바꿔보세요"

### useMatchingCandidates.ts
파일: `hooks/useMatchingCandidates.ts`
- 필터 변경 시 자동 재요청
- `isLoading`, `candidates`, `error`, `refetch` 반환

---

## ⚠️ 주의사항
- `goal_embedding` 컬럼은 이미 `ALTER TABLE session_goals ADD COLUMN goal_embedding JSON NULL` 적용 완료
- 임베딩 생성은 goal 저장 응답을 블로킹하지 않도록 **비동기 fire-and-forget** 처리
- backfill 스크립트는 seed 데이터 적용 후 **한 번만** 실행하면 됨
- `focus_mode` ENUM: `desk` | `moving` | `any`
- KST 피크 시간: `HOUR(CONVERT_TZ(starts_at, '+00:00', '+09:00'))`
