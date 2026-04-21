# FocusTime

혼자 집중하기 어려운 사람들을 위한 **온라인 집중 파트너 매칭 서비스**

세션을 개설하면 AI가 목표 텍스트 유사도를 분석해 적합한 파트너를 매칭하고, 함께 집중하는 시간을 가집니다. 세션이 끝나면 목표 달성 여부를 기록하고 주간 통계로 집중 습관을 확인할 수 있습니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | Node.js, Express.js |
| 데이터베이스 | MySQL, Prisma ORM |
| 인증 | JWT (Access Token + Refresh Token) |
| 프론트엔드 | HTML, Vanilla JS, Tailwind CSS |
| AI | OpenAI `text-embedding-3-small` |
| 결제 | 토스페이먼츠 웹훅 |
| 테스트 | Jest, Supertest |

---

## 주요 기능

- 집중 세션 개설 · 참여 · 취소
- AI 목표 임베딩 기반 파트너 매칭 (규칙 기반 80점 + AI 유사도 20점)
- 세션 중 유튜브 영상 공유 · 채팅
- 주간 집중 통계 및 목표 설정
- 즐겨찾기 · 알림 · 차단 · 신고
- 무료 / 유료 구독 플랜

---

## 프로젝트 구조

```
FocusTime/
├── server/
│   ├── index.js              # Express 앱 진입점 (port 4000)
│   ├── middleware/
│   │   └── auth.js           # JWT 인증 미들웨어
│   ├── routes/
│   │   ├── auth.js           # 회원가입 · 로그인 · 토큰 갱신
│   │   ├── sessions.js       # 세션 CRUD · 매칭 · 채팅 · 목표 · 영상
│   │   ├── users.js          # 프로필 · 통계 · 환경설정 · 즐겨찾기
│   │   ├── notifications.js  # 알림 조회 · 읽음 처리
│   │   ├── matching.js       # AI 기반 파트너 매칭
│   │   ├── subscriptions.js  # 구독 플랜 관리
│   │   ├── privacy.js        # 차단 · 신고
│   │   └── webhooks.js       # 토스페이먼츠 결제 웹훅
│   ├── services/
│   │   └── embeddingService.js  # OpenAI 임베딩 · 코사인 유사도
│   └── lib/
│       └── prisma.js         # Prisma 클라이언트 (test 환경 mock 분기)
├── db/
│   └── schema.prisma         # DB 스키마 (18개 테이블)
├── frontWorkspace/           # 정적 프론트엔드 (/app/* 으로 서빙)
│   ├── login.html
│   ├── signup.html
│   ├── home.html
│   ├── home_dashboard.html
│   ├── session.html
│   ├── complete.html
│   ├── history.html
│   ├── profile.html
│   ├── privacy.html
│   ├── sessions/browse.html
│   └── settings/prefs.html
└── package.json
```

---

## 시작하기

### 요구사항

- Node.js 18+
- MySQL 8+

### 설치

```bash
git clone https://github.com/belovelace/FocusTime.git
cd FocusTime
npm install
```

### 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/focustime"
JWT_SECRET="your_jwt_secret"
OPENAI_API_KEY="your_openai_api_key"
PORT=4000
```

### DB 마이그레이션

```bash
npx prisma migrate dev
npx prisma generate
```

### 실행

```bash
# 개발 서버 (nodemon 자동 재시작)
npm run dev

# 프로덕션
npm start
```

서버 실행 후 http://localhost:4000/app/home.html 에서 확인

---

## API 구조

모든 `/api/*` 경로에 JWT 인증 미들웨어 일괄 적용

| 경로 | 설명 |
|------|------|
| `POST /api/auth/signup` | 회원가입 |
| `POST /api/auth/login` | 로그인 |
| `POST /api/auth/refresh` | 토큰 갱신 |
| `GET /api/sessions` | 세션 목록 (`upcoming=1`, `participant=me` 등 필터) |
| `POST /api/sessions` | 세션 개설 |
| `POST /api/sessions/:id/join` | 세션 참여 |
| `POST /api/sessions/:id/complete` | 세션 완료 |
| `DELETE /api/sessions/:id` | 세션 취소 (시작 15분 전까지) |
| `GET /api/matching/candidates` | AI 파트너 매칭 후보 조회 |
| `GET /api/users/me/stats` | 주간 집중 통계 |
| `PATCH /api/users/me/prefs` | 환경설정 저장 |
| `GET /api/notifications` | 알림 목록 |
| `POST /api/webhooks/toss` | 토스페이먼츠 웹훅 |

---

## AI 매칭 알고리즘

파트너 매칭 점수는 **100점 만점**으로 산출됩니다.

| 항목 | 배점 | 기준 |
|------|------|------|
| 완료율 | 24점 | 세션 완료 이력 |
| 취소율 페널티 | 12점 | 취소 이력 반비례 |
| 평균 평점 | 20점 | 세션 후 별점 |
| 집중 모드 일치 | 16점 | desk / moving / any 매칭 |
| 피크 시간 유사도 | 8점 | 활동 시간대 차이 ±2h |
| AI 목표 유사도 | 20점 | OpenAI 임베딩 코사인 유사도 |

목표 텍스트 입력 시 `text-embedding-3-small`로 벡터화하여 `session_goals` 테이블에 저장하고, 매칭 요청 시 최근 목표 3개의 평균 벡터로 후보와 코사인 유사도를 비교합니다.

---

## 테스트

```bash
npm test
```

- **Jest + Supertest** 통합 테스트
- 실제 HTTP 요청으로 API 엔드포인트 전체 검증
- `NODE_ENV=test` 시 Prisma mock 클라이언트 자동 주입 (DB 없이 실행 가능)

---

## 데이터베이스 스키마

주요 테이블 18개 (MySQL + Prisma)

| 도메인 | 테이블 |
|--------|--------|
| 사용자 | `users`, `refresh_tokens`, `password_resets`, `oauth_tokens` |
| 세션 | `sessions`, `session_participants`, `session_goals`, `session_messages`, `session_videos` |
| 소셜 | `favorites`, `notifications`, `notification_settings`, `blocks`, `reports` |
| 비즈니스 | `subscriptions`, `payments`, `announcements`, `faqs` |

세션 상태 흐름: `open` → `matched` → `active` → `done` / `cancelled`
