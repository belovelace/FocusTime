# REQUIREMENTS.md — 포커스타임 (FocusTime)
> Focusmate 한국화 클론 프로젝트 · 요구사항 정의서  
> Version: 1.1 | 작성일: 2026-04-19 | 수정일: 2026-04-19 | 대상: 개발자 / AI 에이전트

> **v1.1 변경 내역**  
> - 기술 스택: 결제 수단에 포트원(아임포트) 대안 추가  
> - #28~#36 섹션 순서 재편: 관리자(#28~#31) → 커뮤니티 안전(#32~#33) → 구독/결제(#34~#36) 순으로 XLSX 기준에 맞게 통일  
> - #31 유료 구독 결제: 포트원(아임포트) 대안 명시  
> - #28 관리자 대시보드: 차트 라이브러리 권장 사항 추가  
> - 섹션 7 우선순위 요약 집계 수치 수정 (P1 20→19, P2 15→18, P3 4→2)

---

## 0. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 포커스타임 (FocusTime) |
| 참고 원본 | https://www.focusmate.com |
| 핵심 컨셉 | 가상 코워킹(Virtual Co-working) — 낯선 파트너와 1:1로 집중 세션을 예약하고 함께 작업 |
| 타겟 사용자 | 국내 학생·직장인·프리랜서 |
| 핵심 차별화 | 1:1 화상통화 대신 **유튜브 영상 임베드**로 집중 분위기 조성 (클라우드 비용 절감) |
| 플랫폼 | Web (반응형) + 추후 모바일 앱 |
| 언어 | 한국어 기본, 코드베이스는 영어 |

---

## 1. 기술 스택 가정 (AI 코드 생성 기준)

> 확정 스택이 아닌 경우 이 섹션을 수정하세요.

```
Frontend  : Next.js 14 (App Router) + TypeScript + Tailwind CSS
Backend   : Node.js + Express (또는 Next.js API Routes)
DB        : PostgreSQL (ORM: Prisma)
Auth      : JWT (Access 15min / Refresh 7days) + 카카오 OAuth 2.0
Realtime  : Socket.io (세션 대기실, 채팅)
Storage   : AWS S3 (프로필 이미지)
Email     : AWS SES (알림 메일)
Payment   : 토스페이먼츠 (TossPayments) 또는 포트원 (PortOne / 구 아임포트)
Scheduler : node-cron (리마인드 메일)
Video     : YouTube IFrame API (화상통화 대체)
```

---

## 2. 컬럼 정의

요구사항 테이블의 각 컬럼 의미는 다음과 같습니다.

| 컬럼 | 설명 |
|------|------|
| `구분` | 기능 카테고리 |
| `내용` | 기능명 (짧고 명확한 레이블) |
| `요청` | 사용자 스토리 또는 기능 상세 설명 |
| `타입` | `API` / `UI` / `API+UI` / `Background` / `UI+WS`(WebSocket) |
| `DB 테이블` | 관련 DB 테이블명 (섹션 4 스키마 참조) |
| `설명` | 구현 시 주의사항, 기술 참고, 제약 조건 |
| `우선순위` | `P1`=MVP 필수 / `P2`=권장 / `P3`=선택 |

---

## 3. 요구사항 전체 목록

### 3-1. 회원 / 인증

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 1 | 회원가입 | 이메일 + 비밀번호로 신규 계정 생성. 이메일 인증 메일 발송 후 인증 완료 시 계정 활성화. | API | `users` | bcrypt 해싱, JWT 발급. 카카오/네이버 소셜 로그인은 P2로 분리. | **P1** |
| 2 | 소셜 로그인 | 카카오 OAuth 2.0 연동. 최초 로그인 시 닉네임·시간대 입력 온보딩 진행. | API | `users`, `oauth_tokens` | 카카오 디벨로퍼스 앱 등록 필요. 네이버는 P3. | P2 |
| 3 | 로그인 / 로그아웃 | 이메일+비밀번호 또는 소셜 토큰으로 인증. Refresh Token 발급 및 자동 갱신. | API | `users`, `refresh_tokens` | Access Token 만료 15분, Refresh Token 7일. | **P1** |
| 4 | 비밀번호 재설정 | 등록 이메일로 재설정 링크 발송. 링크 유효시간 1시간. | API | `users`, `password_resets` | 토큰은 1회성 (사용 후 무효화). | **P1** |
| 5 | 회원 탈퇴 | 탈퇴 요청 시 soft-delete 처리. 세션 이력은 익명화 후 30일 보관. | API | `users` | 개인정보보호법 준수. 탈퇴 후 동일 이메일 재가입 90일 제한. | P2 |

### 3-2. 프로필

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 6 | 프로필 조회/수정 | 닉네임, 프로필 이미지, 한 줄 소개, 관심 카테고리(최대 5개), 시간대 설정. | API+UI | `users`, `user_categories` | 이미지는 클라이언트 리사이즈 후 업로드 (최대 1MB, WebP 변환). | **P1** |
| 7 | 누적 집중 통계 표시 | 총 완료 세션 수, 총 집중 시간(분), 이번 주 달성률을 프로필에 표시. | UI | `sessions` | 프론트 집계 쿼리. 주 단위 리셋은 월요일 00:00 KST. | P2 |
| 8 | 즐겨찾기(단골) 파트너 목록 | 즐겨찾기 추가/삭제, 목록 조회. 세션 예약 시 즐겨찾기 우선 필터 제공. | API+UI | `favorites` | user_id + partner_id 복합 유니크. 최대 50명. | P2 |

### 3-3. 세션 예약

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 9 | 세션 생성 | 날짜·시간·길이(25/50/75분) 선택 후 공개 세션 등록. 최대 7일 전 예약 가능. | API | `sessions` | KST 기준 입력, UTC 변환 저장. 30분 단위 시작시간 제한(UX 단순화). | **P1** |
| 10 | 세션 목록 조회 | 본인이 등록한 예정 세션 및 매칭된 세션 목록. 필터: 날짜, 길이, 상태. | API+UI | `sessions`, `session_participants` | 페이지네이션(page size 20). 캐시 TTL 30초. | **P1** |
| 11 | 세션 참가(매칭) | 공개 슬롯에 참가 신청. 먼저 신청한 사용자와 1:1 매칭. 정원 초과 시 대기. | API | `sessions`, `session_participants` | 트랜잭션 처리 필수(동시 신청 방지). 매칭 성사 시 양측 알림 발송. | **P1** |
| 12 | 세션 취소 | 세션 시작 10분 전까지 취소 가능. 취소 시 상대방 알림 발송. 무단 취소 3회 시 1주 이용 제한. | API | `sessions`, `session_participants` | 취소 사유 선택(드롭다운). 이력 보관. | **P1** |
| 13 | 즐겨찾기 파트너와 세션 예약 | 즐겨찾기 목록에서 파트너를 선택해 특정 슬롯에 직접 초대. | API+UI | `sessions`, `favorites`, `notifications` | 초대받은 사용자 수락/거절. 24시간 내 미응답 시 자동 취소. | P2 |
| 14 | 매칭 선호 설정 | 성별 매칭 선호(동성/무관), 집중 모드(데스크/이동/무관) 기본값 설정. | API+UI | `user_preferences` | 매칭 알고리즘에서 선호도 가중치 반영. 완전 일치 없을 경우 무관 우선. | P2 |

### 3-4. 세션 실행

> ⚠️ **핵심 결정사항**: 1:1 화상통화는 구현하지 않음. 대신 **유튜브 영상 임베드**로 집중 분위기를 조성. 영상은 각 사용자가 독립적으로 선택·재생하며 상대방과 공유되지 않음.

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 15 | 세션 입장 대기실 | 세션 시작 5분 전부터 입장 가능. 상대방 입장 여부 실시간 표시(WebSocket). | UI+WS | `sessions`, `session_participants` | Socket.io 또는 SSE 활용. 미입장 시 1분 단위 리마인드 알림. | **P1** |
| 16 | 집중 목표 입력 | 세션 시작 시 오늘의 목표 텍스트 입력(최대 100자). 상대방 목표도 함께 표시. | UI+API | `session_goals` | 선택 입력(빈 칸 허용). 이전 세션 목표 불러오기 버튼 제공. | **P1** |
| 17 | 유튜브 영상 공유 (화상 대체) | 세션 중 유튜브 URL 입력 → iframe 임베드로 배경 집중 영상 재생. 로파이/백색소음 플레이리스트 추천 제공. | UI | `session_videos` | YouTube IFrame API 사용. 영상은 상대에게 공유되지 않음(각자 독립 재생). 자동재생 `muted` 기본값 필수. | **P1** |
| 18 | 세션 채팅 | 세션 중 텍스트 채팅. 목표 공유, 진행 상황 업데이트 용도. | UI+WS | `session_messages` | 채팅 이력 세션 종료 후 24시간 보관. 최대 200자/메시지. | **P1** |
| 19 | 조용한 모드 (Quiet Mode) | 마이크 없이 참여 가능. 조용한 모드 배지 표시. 채팅으로만 소통. | UI | `session_participants` | 참가 시 체크박스 선택. 상대방에게 아이콘으로 표시. | P2 |
| 20 | 세션 타이머 | 카운트다운 타이머 화면 중앙 표시. 종료 5분 전 알림. | UI | — | 프론트 자체 타이머(서버 시작시간 기준 동기화). 브라우저 탭 비활성 시에도 동작(Web Worker 권장). | **P1** |
| 21 | 세션 종료 & 체크인 | 타이머 종료 시 완료 화면 표시. 오늘의 성취 한 줄 입력 및 별점(1-5) 평가. | UI+API | `session_reviews` | 평가는 선택. 별점은 파트너 신뢰 점수에 반영(표시 안 함). | P2 |

### 3-5. 알림

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 22 | 이메일 알림 — 예약 확인 | 세션 예약 완료 시 일정 정보 포함 이메일 발송. | Background | `notifications`, `sessions` | SMTP(AWS SES 권장). 발송 실패 시 3회 재시도. | **P1** |
| 23 | 이메일 알림 — 리마인드 | 세션 시작 1시간 전 / 15분 전 리마인드 이메일 발송. | Background | `notifications`, `sessions` | Cron Job(매 5분 체크). 사용자 알림 설정에서 ON/OFF 가능. | **P1** |
| 24 | 이메일 알림 — 취소 통보 | 파트너 취소 시 즉시 알림 이메일 발송. | Background | `notifications` | 취소 사유 포함. 빠른 재예약 링크 버튼 포함. | **P1** |
| 25 | 인앱 알림 (Bell Icon) | 매칭 성사, 취소, 초대, 시스템 공지 등 인앱 알림 센터 제공. | UI+WS | `notifications` | 읽음/미읽음 상태 관리. 최대 100개 보관 후 오래된 순 삭제. | P2 |
| 26 | 알림 설정 관리 | 이메일/인앱별 알림 유형(예약확인, 리마인드, 취소) ON/OFF 설정. | UI+API | `notification_settings` | 기본값: 모두 ON. | P2 |
| 27 | 캘린더 초대 (ICS) | 세션 예약 시 구글/애플/아웃룩 캘린더 추가 가능한 .ics 파일 링크 제공. | API | — | iCalendar RFC 5545 표준. ics 파일 서버 동적 생성. | P2 |

### 3-6. 관리자

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 28 | 대시보드 | DAU/MAU, 신규 가입, 세션 완료 수, 취소율 등 핵심 지표 실시간 집계. | UI+API | `users`, `sessions` | 관리자 전용 역할(role=admin). Chart.js 또는 Recharts 활용. | P2 |
| 29 | 회원 관리 | 회원 목록 조회, 검색(이메일/닉네임), 계정 정지/복구, 강제 탈퇴. | UI+API | `users` | 정지 사유 기록 필수. 정지된 사용자 로그인 시 안내 메시지 표시. | P2 |
| 30 | 신고 처리 | 신고 접수 목록 확인, 처리 상태(접수/검토/완료) 업데이트. | UI+API | `reports` | 신고 접수 시 관리자 이메일 알림. 반복 신고자 자동 플래그. | P2 |
| 31 | 공지사항 관리 | 공지사항 CRUD. 등록 시 메인 배너 및 인앱 알림 자동 발송. | UI+API | `announcements` | Rich Text 에디터(Quill 또는 TipTap). 예약 발행 기능. | P3 |

### 3-7. 커뮤니티 안전

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 32 | 사용자 신고 | 세션 중 또는 종료 후 파트너를 부적절한 행동으로 신고. 신고 유형: 스팸/부적절 콘텐츠/기타. | API+UI | `reports` | 신고된 사용자는 검토 전까지 매칭 제한 없음(관리자 확인 후 조치). | P2 |
| 33 | 사용자 차단 | 특정 사용자 차단 시 서로 매칭 불가. 차단 목록 조회/해제. | API+UI | `blocks` | 양방향 차단(A→B 차단 시 B도 A 매칭 안 됨). | P2 |

### 3-8. 구독 / 결제

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 34 | 무료 플랜 제한 | 무료 사용자: 주 3회 세션 제한. 초과 시 업그레이드 유도 모달 표시. | API+UI | `users`, `subscriptions` | 주 기준: 월요일 00:00 KST 리셋. | **P1** |
| 35 | 유료 구독 결제 | 월정액(₩14,900/월) 또는 연정액(₩9,900/월×12) 결제. 토스페이먼츠 또는 포트원(아임포트) 연동. | API | `subscriptions`, `payments` | 웹훅으로 결제 상태 동기화. 구독 만료 3일 전 갱신 안내 이메일. | P2 |
| 36 | 구독 관리 (해지/변경) | 구독 해지 시 현재 기간 만료까지 유료 기능 유지. 플랜 변경(월→연) 즉시 적용. | API+UI | `subscriptions` | 해지 사유 선택 저장(이탈 분석 목적). | P2 |

### 3-9. 정적 페이지

| # | 내용 | 요청 | 타입 | DB 테이블 | 설명 | 우선순위 |
|---|------|------|------|-----------|------|----------|
| 37 | 랜딩 페이지 | 서비스 소개, 작동 방식(3단계), 이용 후기, 가격, CTA 버튼. | UI | — | SEO 메타태그·OG 태그 필수. Core Web Vitals LCP < 2.5초 목표. | **P1** |
| 38 | 이용약관 / 개인정보처리방침 | 한국 개인정보보호법 기준 개인정보처리방침 게시. | UI | — | 마지막 수정일 표시. 약관 변경 시 사용자 재동의 팝업 필요. | **P1** |
| 39 | FAQ 페이지 | 자주 묻는 질문 아코디언 형식. 관리자 CMS에서 편집 가능. | UI+API | `faqs` | 초기 10건 이상 하드코딩 후 CMS 전환. | P3 |

---

## 4. DB 스키마

> PostgreSQL 기준. 모든 시간 컬럼은 UTC 저장, KST 변환은 애플리케이션 레이어에서 처리.

### users
```sql
CREATE TABLE users (
  id             BIGSERIAL PRIMARY KEY,
  email          VARCHAR(255) UNIQUE NOT NULL,
  password_hash  VARCHAR(255),                        -- 소셜 로그인 시 NULL
  nickname       VARCHAR(50)  NOT NULL,
  avatar_url     TEXT,
  bio            VARCHAR(200),
  timezone       VARCHAR(50)  NOT NULL DEFAULT 'Asia/Seoul',
  role           VARCHAR(20)  NOT NULL DEFAULT 'user', -- user | admin
  status         VARCHAR(20)  NOT NULL DEFAULT 'active', -- active | suspended | deleted
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
```

### sessions
```sql
CREATE TABLE sessions (
  id            BIGSERIAL PRIMARY KEY,
  host_id       BIGINT NOT NULL REFERENCES users(id),
  partner_id    BIGINT REFERENCES users(id),           -- NULL = 미매칭
  starts_at     TIMESTAMPTZ NOT NULL,
  duration_min  SMALLINT NOT NULL CHECK (duration_min IN (25, 50, 75)),
  focus_mode    VARCHAR(20) NOT NULL DEFAULT 'any',    -- desk | moving | any
  status        VARCHAR(20) NOT NULL DEFAULT 'open',   -- open | matched | active | done | cancelled
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### session_goals
```sql
CREATE TABLE session_goals (
  id           BIGSERIAL PRIMARY KEY,
  session_id   BIGINT NOT NULL REFERENCES sessions(id),
  user_id      BIGINT NOT NULL REFERENCES users(id),
  goal_text    VARCHAR(100),
  result_text  VARCHAR(200),
  rating       SMALLINT CHECK (rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### session_messages
```sql
CREATE TABLE session_messages (
  id          BIGSERIAL PRIMARY KEY,
  session_id  BIGINT NOT NULL REFERENCES sessions(id),
  user_id     BIGINT NOT NULL REFERENCES users(id),
  body        VARCHAR(200) NOT NULL,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### session_videos
```sql
-- 화상통화 대체: 각 사용자가 독립적으로 유튜브 영상 선택
CREATE TABLE session_videos (
  id           BIGSERIAL PRIMARY KEY,
  session_id   BIGINT NOT NULL REFERENCES sessions(id),
  user_id      BIGINT NOT NULL REFERENCES users(id),
  youtube_url  TEXT NOT NULL,
  set_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### favorites
```sql
CREATE TABLE favorites (
  user_id     BIGINT NOT NULL REFERENCES users(id),
  partner_id  BIGINT NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, partner_id)
);
```

### notifications
```sql
CREATE TABLE notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  type        VARCHAR(50) NOT NULL,   -- matched | cancelled | reminder | invite | system
  payload     JSONB,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL UNIQUE REFERENCES users(id),
  plan         VARCHAR(30) NOT NULL DEFAULT 'free',  -- free | plus_monthly | plus_yearly
  starts_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ,                          -- NULL = 무료(무기한)
  payment_key  VARCHAR(100),                         -- 토스페이먼츠 결제 키
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### blocks / reports
```sql
CREATE TABLE blocks (
  blocker_id  BIGINT NOT NULL REFERENCES users(id),
  blocked_id  BIGINT NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE reports (
  id           BIGSERIAL PRIMARY KEY,
  reporter_id  BIGINT NOT NULL REFERENCES users(id),
  target_id    BIGINT NOT NULL REFERENCES users(id),
  reason       VARCHAR(50) NOT NULL,  -- spam | inappropriate | other
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | reviewed | resolved
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. API 엔드포인트 목록 (주요)

```
# Auth
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/verify-email?token=

# Users / Profile
GET    /api/users/me
PATCH  /api/users/me
DELETE /api/users/me
GET    /api/users/:id
GET    /api/users/me/favorites
POST   /api/users/me/favorites/:partnerId
DELETE /api/users/me/favorites/:partnerId

# Sessions
GET    /api/sessions              # 공개 슬롯 탐색 (필터: date, duration, mode)
POST   /api/sessions              # 세션 생성
GET    /api/sessions/my           # 내 세션 목록
GET    /api/sessions/:id
POST   /api/sessions/:id/join     # 참가(매칭)
DELETE /api/sessions/:id          # 취소
PATCH  /api/sessions/:id/status   # 상태 변경 (active → done)

# Session Sub-resources
POST   /api/sessions/:id/goals
GET    /api/sessions/:id/goals
POST   /api/sessions/:id/messages
GET    /api/sessions/:id/messages
POST   /api/sessions/:id/video    # 유튜브 URL 저장

# Notifications
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
GET    /api/notifications/settings
PATCH  /api/notifications/settings

# Subscriptions
GET    /api/subscriptions/me
POST   /api/subscriptions/checkout
DELETE /api/subscriptions/me      # 해지
POST   /api/webhooks/toss         # 토스페이먼츠 웹훅

# Admin (role=admin 전용)
GET    /api/admin/stats
GET    /api/admin/users
PATCH  /api/admin/users/:id/status
GET    /api/admin/reports
PATCH  /api/admin/reports/:id

# Calendar
GET    /api/sessions/:id/ics      # .ics 파일 다운로드
```

---

## 6. 화면 목록

| # | 화면명 | URL 경로 | 접근 권한 | 주요 기능 | 우선순위 |
|---|--------|----------|-----------|-----------|----------|
| 1 | 랜딩 페이지 | `/` | 전체 | 서비스 소개, CTA, 이용 후기, 요금제 | **P1** |
| 2 | 회원가입 | `/signup` | 비회원 | 이메일·비밀번호 입력, 이메일 인증 안내 | **P1** |
| 3 | 이메일 인증 완료 | `/verify-email` | 비회원 | 토큰 검증 후 완료 안내 | **P1** |
| 4 | 로그인 | `/login` | 비회원 | 이메일+비밀번호, 카카오 로그인 | **P1** |
| 5 | 비밀번호 재설정 요청 | `/forgot-password` | 비회원 | 이메일 입력 → 재설정 링크 발송 | **P1** |
| 6 | 비밀번호 재설정 | `/reset-password?token=` | 비회원 | 새 비밀번호 입력 | **P1** |
| 7 | 온보딩 | `/onboarding` | 신규회원 | 닉네임, 시간대, 관심 카테고리 설정 | **P1** |
| 8 | 대시보드 (세션 예약) | `/dashboard` | 회원 | 오늘/이번 주 예정 세션, 빠른 세션 만들기, 추천 슬롯 | **P1** |
| 9 | 세션 예약 슬롯 탐색 | `/sessions/browse` | 회원 | 날짜·시간·길이 필터, 공개 슬롯 목록, 참가 버튼 | **P1** |
| 10 | 세션 상세 | `/sessions/:id` | 회원 | 세션 정보, 파트너 프로필, 취소 버튼 | **P1** |
| 11 | 세션 대기실 | `/sessions/:id/lobby` | 회원 | 상대방 입장 확인, 목표 입력, 조용한 모드 선택 | **P1** |
| 12 | 세션 진행 화면 | `/sessions/:id/room` | 회원 | 타이머, 목표 표시, 채팅, 유튜브 임베드, 파트너 상태 | **P1** |
| 13 | 세션 종료/체크인 | `/sessions/:id/done` | 회원 | 성취 입력, 별점, 다음 세션 바로 예약 CTA | **P1** |
| 14 | 내 세션 이력 | `/my/sessions` | 회원 | 완료·취소·예정 세션 목록, 총 통계 | P2 |
| 15 | 프로필 (본인) | `/my/profile` | 회원 | 정보 수정, 통계, 즐겨찾기 목록, 알림 설정 | **P1** |
| 16 | 프로필 (타인) | `/users/:id` | 회원 | 상대 프로필 조회, 즐겨찾기 추가, 신고/차단 | P2 |
| 17 | 구독/요금제 | `/pricing` | 전체 | 무료·유료 비교, 결제 버튼, 현재 구독 상태 | P2 |
| 18 | 결제 | `/checkout` | 회원 | 토스페이먼츠 위젯 임베드, 결제 완료 처리 | P2 |
| 19 | 알림 센터 | `/notifications` | 회원 | 인앱 알림 목록, 읽음 처리, 전체 삭제 | P2 |
| 20 | 알림 설정 | `/my/notification-settings` | 회원 | 이메일·인앱 알림 유형별 ON/OFF | P2 |
| 21 | FAQ | `/faq` | 전체 | 아코디언 FAQ | P3 |
| 22 | 이용약관 | `/terms` | 전체 | 약관 전문 | **P1** |
| 23 | 개인정보처리방침 | `/privacy` | 전체 | 개인정보처리방침 전문 | **P1** |
| 24 | 관리자 대시보드 | `/admin` | admin | 지표 차트, 빠른 링크 | P2 |
| 25 | 관리자 회원 관리 | `/admin/users` | admin | 검색, 정지/복구 | P2 |
| 26 | 관리자 신고 관리 | `/admin/reports` | admin | 신고 목록, 처리 상태 | P2 |
| 27 | 관리자 공지 관리 | `/admin/announcements` | admin | 공지 CRUD, 예약 발행 | P3 |

---

## 7. 우선순위 요약

| 우선순위 | 항목 수 | 기준 |
|----------|---------|------|
| **P1** (MVP 필수) | 19 | 미구현 시 서비스 불가. 첫 배포 전 완료 필수. |
| P2 (권장) | 18 | MVP 이후 1~2 스프린트 내 구현. 사용자 경험 핵심. |
| P3 (선택) | 2 | 안정화 이후 구현. 없어도 서비스 운영 가능. |
| **합계** | **39** | |

---

## 8. 비기능 요구사항

```
Performance  : 페이지 초기 로딩 LCP < 2.5초 (Core Web Vitals)
               API 응답 p95 < 300ms
Security     : HTTPS 필수, CORS 화이트리스트, Rate Limiting (100 req/min/IP)
               SQL Injection 방지 (Parameterized Query / ORM 사용)
               XSS 방지 (입력값 sanitize)
Scalability  : 세션 매칭 로직은 트랜잭션 격리 레벨 SERIALIZABLE 또는 SELECT FOR UPDATE
Compliance   : 개인정보보호법 (PIPA) 준수
               서비스 이용약관, 개인정보처리방침 게시 필수
Accessibility: WCAG 2.1 AA 수준 목표
               한국어 스크린리더 지원 (aria-label 한국어 작성)
```

---

## 9. 주요 비즈니스 규칙

```
[세션 매칭]
- 1 세션 = 최대 2명 (host + partner)
- 매칭은 선착순 (먼저 join 한 사용자)
- 동시 요청 방지: DB 트랜잭션 또는 Redis 분산 락 사용

[세션 제한]
- 무료 플랜: 주 3회 (월요일 00:00 KST 리셋)
- 유료 플랜: 무제한

[취소 패널티]
- 무단 취소 3회 누적 시 1주일 이용 제한
- 취소 가능 시간: 세션 시작 10분 전까지

[유튜브 임베드]
- 각 사용자 독립 재생 (서로 영상 공유 안 함)
- 자동재생 시 muted=1 파라미터 필수 (브라우저 정책)
- 추천 플레이리스트 20개 이상 큐레이션 하드코딩

[구독]
- 해지 시 즉시 중단 아님 — 현재 구독 기간 만료까지 유료 기능 유지
- 동일 이메일 탈퇴 후 재가입: 90일 제한
```

---

*이 문서는 AI 에이전트가 코드 생성·리뷰·테스트 작성 시 참조하는 단일 진실 소스(Single Source of Truth)입니다.*  
*변경 시 버전 번호와 변경 일자를 상단에 반드시 업데이트하세요.*