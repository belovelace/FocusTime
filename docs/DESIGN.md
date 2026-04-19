# DESIGN.md — 포커스타임 (FocusTime)
> UI/UX 디자인 시스템 & Google Stitch 프롬프트 가이드  
> Version: 1.0 | 작성일: 2026-04-19 | 대상: 디자이너 / 프론트엔드 개발자 / AI 에이전트

---

## 0. 디자인 철학

포커스타임은 **집중(Focus)** 이 핵심 가치입니다.  
UI는 사용자의 주의를 빼앗지 않아야 합니다.

```
원칙 1. Low Distraction  — 불필요한 장식, 애니메이션, 색상 제거
원칙 2. Trust & Calm     — 파란색 계열로 신뢰감과 집중력 유도
원칙 3. Progress Clarity — 타이머·통계를 항상 명확하게 표시
원칙 4. Korean-First     — 한국어 가독성 최적화 (Pretendard 폰트)
원칙 5. Accessible       — WCAG 2.1 AA 대비율 준수
```

> **색상 심리학 근거:**  
> 파란색(Blue)은 집중력·정신적 명료함을 높이고 장시간 화면 작업에 유리합니다.  
> 초록색(Green)은 눈의 피로를 줄이고 불안을 낮춰 고압적 환경에 이상적입니다.  
> 두 색상 조합은 코어 집중 앱(Linear, Notion)에서도 검증된 패턴입니다.

---

## 1. 디자인 토큰 (Design Tokens)

### 1-1. 색상 팔레트

```css
/* ── Primary (집중·신뢰) ── */
--color-primary-50:   #EDF2FF;
--color-primary-100:  #DBE4FF;
--color-primary-300:  #74C0FC;   /* Accent / Interactive */
--color-primary-500:  #4C6EF5;   /* Hover */
--color-primary-600:  #3B5BDB;   /* Primary (메인 CTA, 타이머) */
--color-primary-800:  #1E3A8A;   /* Dark / emphasis */

/* ── Secondary (균형·안정) ── */
--color-secondary-50:  #EBFBEE;
--color-secondary-100: #D3F9D8;
--color-secondary-500: #40C057;
--color-secondary-600: #2F9E44;  /* Secondary (완료 상태, 성공) */

/* ── Neutral ── */
--color-bg:        #F8F9FA;   /* 페이지 배경 (눈부심 방지 off-white) */
--color-surface:   #FFFFFF;   /* 카드·모달 배경 */
--color-border:    #DEE2E6;
--color-text-primary:   #212529;
--color-text-secondary: #6C757D;
--color-text-disabled:  #ADB5BD;

/* ── Semantic ── */
--color-danger:  #FA5252;   /* 취소·삭제·경고 */
--color-warning: #FCC419;   /* 주의 (무료 한도 임박 등) */
--color-info:    #74C0FC;
```

### 1-2. 타이포그래피

```css
/* 폰트: Pretendard (한국어 최적화, Variable 버전 권장) */
/* CDN: https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css */

--font-family: 'Pretendard Variable', 'Pretendard', -apple-system,
               BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Scale */
--text-xs:   12px / 1.5;
--text-sm:   14px / 1.5;
--text-base: 16px / 1.6;   /* 본문 기본 */
--text-lg:   18px / 1.5;
--text-xl:   20px / 1.4;
--text-2xl:  24px / 1.3;
--text-3xl:  30px / 1.2;
--text-4xl:  36px / 1.2;
--text-5xl:  48px / 1.1;   /* 세션 타이머 전용 */

/* Weight */
--font-regular:   400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

### 1-3. 간격 / 크기 시스템

```
Base unit: 4px

4px   — xs  (아이콘 간격)
8px   — sm  (인라인 패딩)
12px  — md
16px  — lg  (카드 내부 패딩)
24px  — xl  (섹션 간 간격)
32px  — 2xl
48px  — 3xl (히어로 섹션)
64px  — 4xl
```

### 1-4. 모서리 반경 (Border Radius)

```
4px   — 태그, 배지, 소형 요소
8px   — 버튼, 입력 필드
12px  — 카드
16px  — 모달, 바텀 시트
full  — 아바타, 파브 버튼
```

### 1-5. 그림자

```css
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
--shadow-md: 0 4px 12px rgba(0,0,0,0.10);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
```

---

## 2. 컴포넌트 사양

### Button

| 변형 | 배경 | 텍스트 | 테두리 | 사용처 |
|------|------|--------|--------|--------|
| Primary (filled) | `--color-primary-600` | white | none | 메인 CTA |
| Secondary (ghost) | transparent | `--color-primary-600` | 1px primary | 보조 액션 |
| Danger | `--color-danger` | white | none | 취소·삭제 |
| Kakao | `#FEE500` | `#191919` | none | 카카오 로그인 |

```
높이:  44px (모바일) / 40px (데스크탑)
패딩:  0 20px
폰트:  16px / semibold
반경:  8px
비활성: opacity 0.5, cursor not-allowed
```

### Input Field

```
높이:    56px
패딩:    0 16px
폰트:    16px / regular
반경:    8px
테두리:  1px solid --color-border
포커스:  2px solid --color-primary-300, outline none
에러:    1px solid --color-danger + 에러 메시지 (red, sm)
```

### Card

```
배경:    --color-surface
패딩:    16px
반경:    12px
그림자:  --shadow-sm
호버:    --shadow-md, transform translateY(-2px) (선택적)
```

### Badge / Tag

```
상태 뱃지:
  매칭 완료 → bg: --color-secondary-100, text: --color-secondary-600
  대기 중   → bg: --color-primary-50,    text: --color-primary-600
  취소됨    → bg: #FFF5F5,               text: --color-danger
  조용한 모드 → bg: #F1F3F5,             text: --color-text-secondary

세션 길이 뱃지:
  25분 → bg: --color-primary-50,    text: --color-primary-600
  50분 → bg: --color-primary-100,   text: --color-primary-800
  75분 → bg: --color-primary-600,   text: white
```

### Timer (세션 진행 핵심 컴포넌트)

```
폰트:    48px / bold / --color-primary-600
정렬:    center
포맷:    MM:SS  (예: 38:24)
서브텍스트: 14px / regular / --color-text-secondary
           (예: "남은 시간")
종료 5분 전: 색상 → --color-warning 으로 전환
```

---

## 3. 화면별 레이아웃 사양

### 화면 크기 기준

```
모바일:  390×844px (iPhone 14 기준)
태블릿: 768px+
데스크탑: 1280px+ (max-width: 1200px, centered)
```

---

### Screen 01 — 랜딩 페이지 (`/`)

```
[Navigation]
  ├─ Logo (left): "포커스타임" wordmark, primary color
  ├─ Nav links (center): 서비스 소개 / 요금제 / 이용 후기
  └─ CTA button (right): "무료로 시작하기" — Primary filled

[Hero Section]  height: 100vh, bg: --color-bg
  ├─ Headline: "함께 집중할 때, 더 잘 됩니다"  (3xl~4xl, bold)
  ├─ Sub:      "파트너와 함께 25분, 지금 바로 시작하세요"  (lg, secondary)
  ├─ CTA row:  [무료로 시작하기] [데모 보기 ▶]
  └─ Illustration (right): 2명이 집중하는 일러스트 또는 앱 목업

[How It Works]  bg: white, padding: 80px 0
  ├─ Section title: "이렇게 사용해요"  (2xl, bold, center)
  └─ 3-column cards:
       ① 세션 예약  (캘린더 아이콘)
       ② 목표 입력  (메모 아이콘)
       ③ 함께 집중  (타이머 아이콘)

[Stats Bar]  bg: --color-primary-600, text: white
  ├─ "완료된 세션 12만+"
  ├─ "총 집중 시간 500만 분+"
  └─ "가입 회원 5만+"

[Testimonials]  3 quote cards, horizontal scroll on mobile

[Pricing Teaser]
  ├─ Free card:  "무료 플랜 — 주 3회"
  └─ Plus card:  "플러스 플랜 — 무제한" (indigo border highlight)

[Footer]  bg: #212529, text: white
```

---

### Screen 02 — 로그인 / 회원가입 (`/login`, `/signup`)

```
[Layout]  centered column, max-width: 400px, full-height

[Top]     Back arrow (←) + 화면명 (center) + 빈 공간 (right)

[Avatar]  (회원가입 전용) 원형 96px + edit pencil overlay

[Fields]
  이메일 주소      → Input (type: email)
  비밀번호 (8자+)  → Input (type: password, show/hide toggle)
  비밀번호 확인    → Input (회원가입 전용)

[CTA]     Primary button, full-width ("로그인" or "시작하기")

[Divider] "또는"  (horizontal line + center text)

[Kakao]   Kakao yellow button, full-width

[Footer link]
  로그인: "아직 계정이 없으신가요? 회원가입"
  회원가입: "이미 계정이 있으신가요? 로그인"
```

---

### Screen 03 — 대시보드 (`/dashboard`)

```
[Top Bar]
  ├─ Avatar (left, 40px circle)
  ├─ Greeting (left): "안녕하세요, {nickname}님 👋"  (lg, bold)
  └─ Bell icon with badge (right)

[Weekly Stats Card]  bg: --color-primary-600, text: white, radius: 12px
  ├─ Label: "이번 주 집중 시간"
  ├─ Value: "2시간 30분 / 목표 5시간"
  └─ Progress bar (sky blue on indigo bg, 50% filled)

[Section: 예정된 세션]
  └─ Session Card (per item):
       ├─ Date chip (left):    "4월 20일 오후 3:00"
       ├─ Duration badge (right): "25분"
       ├─ Partner row:         Avatar + Nickname + "매칭 완료" badge
       └─ Goal text (gray):    "논문 2장 작성"

[Section: 빠른 예약]
  ├─ Duration pills: [25분] [50분] [75분]  (selected: filled primary)
  ├─ Date/time strip: horizontal scroll, today highlighted
  └─ "세션 만들기" button — Primary, full-width

[Bottom Tab Bar]
  홈(active) | 탐색 | 이력 | 프로필
```

---

### Screen 04 — 세션 진행 화면 (`/sessions/:id/room`)  ⭐ 핵심

```
DESIGN CONSTRAINT: 이 화면은 최대한 단순해야 합니다.
사용자의 시선은 타이머와 목표 텍스트에만 집중되어야 합니다.

[Top Bar]  height: 56px
  ├─ "집중 세션" + "50분" badge (left)
  └─ X button — ghost, small (right)

[Partner Strip]  height: 48px, bg: --color-surface, border-bottom
  ├─ Partner avatar (36px) + Nickname
  └─ "🤫 조용한 모드" badge (if active)

[YouTube Embed Area]  full-width, aspect-ratio: 16/9, radius: 12px
  ├─ iframe (YouTube IFrame API)
  ├─ Placeholder: "집중 음악 재생 중 🎵" + YouTube icon
  └─ "영상 변경" ghost button (below embed)

[Focus Center]  padding: 32px 0, text-align: center
  ├─ Timer:      "38:24"  (48px, bold, --color-primary-600)
  ├─ Timer sub:  "남은 시간"  (sm, secondary)
  └─ Goal text:  "나의 목표: 논문 2장 작성"  (base, secondary)

[Chat Area]  flex-grow: 1, overflow-y: auto
  ├─ Message bubbles (3 visible, scroll for more)
  └─ Input bar: "메시지 입력..." + Send icon button

[Footer]
  └─ "세션 종료" — ghost danger button, small, centered

SPACING: 위 요소들 사이 여백 충분히 유지. 답답하지 않게.
```

---

### Screen 05 — 세션 종료 / 체크인 (`/sessions/:id/done`)

```
[Top]  Subtle confetti (indigo + green dots, 짧은 fade-in 애니메이션)

[Hero]
  ├─ Checkmark icon: 80px circle, bg: --color-primary-600, icon: white ✓
  ├─ Headline: "집중 완료! 🎉"  (2xl, bold, center)
  └─ Sub:      "50분 세션을 완료했습니다"  (base, secondary)

[Achievement Input]
  ├─ Label: "오늘의 성취를 적어보세요"
  ├─ Textarea: placeholder "논문 2장 초안 완성!"
  └─ Counter: "0 / 100"  (right-aligned, sm, secondary)

[Partner Rating]
  ├─ Label: "파트너는 어땠나요?"
  └─ 5 star icons (tappable, filled → --color-primary-600)

[Partner Card]
  ├─ Avatar + Nickname
  └─ "즐겨찾기 추가 ☆" button — ghost, small

[CTAs]  stacked, full-width
  ├─ Primary: "다음 세션 바로 예약하기"
  └─ Ghost:   "대시보드로 돌아가기"
```

---

### Screen 06 — 프로필 (`/my/profile`)

```
[Top Bar]
  ├─ "프로필" (center, bold)
  └─ "편집" text button (right, primary color)

[Profile Hero]  center-aligned
  ├─ Avatar: 96px circle + edit pencil overlay
  ├─ Nickname: 22px, bold
  ├─ Bio: 14px, secondary
  └─ Interest tags: pill chips (예: "공부", "글쓰기", "코딩")

[Stats Row]  3 equal-width cards, bg: --color-primary-50
  ├─ "완료 세션 | 128회"
  ├─ "총 집중 | 106시간"
  └─ "이번 주 | 3/5회"

[Section: 단골 파트너]
  └─ Horizontal scroll: Avatar + Nickname chips (최대 10명 표시)

[Section: 설정]  list-style rows with right chevrons
  ├─ 알림 설정
  ├─ 매칭 선호도
  ├─ 구독 관리
  ├─ 개인정보처리방침
  └─ 로그아웃  (--color-danger text)
```

---

## 4. Google Stitch 입력 프롬프트

> **사용 방법**
> 1. https://stitch.withgoogle.com 접속
> 2. `App` 모드 선택
> 3. `Gemini 2.5 Pro` (Experimental) 선택 — 품질 우선
> 4. 아래 **공통 디자인 시스템 프롬프트**를 먼저 복사
> 5. 이어서 원하는 화면의 **화면별 프롬프트**를 붙여넣기
> 6. 생성 후 follow-up 프롬프트로 세부 조정

---

### [공통] 디자인 시스템 — 모든 프롬프트에 앞부분에 붙여쓰기

```
Design system to apply throughout:
- Primary color: #3B5BDB (Indigo Blue — focus & trust)
- Secondary color: #2F9E44 (Forest Green — calm, success states)
- Accent: #74C0FC (Sky Blue — interactive highlights)
- Background: #F8F9FA (off-white, reduces eye strain)
- Surface: #FFFFFF (cards, modals)
- Text primary: #212529
- Text secondary: #6C757D
- Danger: #FA5252
- Font: "Pretendard" (Korean-optimized), fallback: system sans-serif
- Border radius: 12px for cards, 8px for buttons/inputs
- Spacing: 8px grid system
- Overall style: minimal, low-distraction, calm — inspired by Linear and Notion
- Language: Korean UI text throughout
```

---

### [P01] 랜딩 페이지

```
[DESIGN SYSTEM — 위 공통 블록 붙여넣기]

Build a Korean web landing page for "포커스타임" — a virtual co-working 
productivity app. Users book 25/50/75-minute focus sessions with matched 
partners online. No video call — users share YouTube ambient videos instead.

Layout top to bottom:
1. Sticky nav: logo "포커스타임" (left), links "서비스 소개 / 요금제 / 이용 후기" 
   (center), CTA button "무료로 시작하기" filled indigo (right).
2. Hero: headline "함께 집중할 때, 더 잘 됩니다" (bold 48px), sub "파트너와 
   함께 25분, 지금 바로 시작하세요" (18px gray), two CTAs side by side 
   ("무료로 시작하기" filled + "데모 보기" ghost). Right: app mockup illustration.
3. How it works: section title "이렇게 사용해요", 3 horizontal icon cards —
   ① 세션 예약 (calendar icon) / ② 목표 입력 (memo icon) / ③ 함께 집중 (timer icon).
4. Stats bar: full-width indigo background, white text — 
   "완료된 세션 12만+" | "총 집중 시간 500만 분+" | "가입 회원 5만+".
5. Testimonials: 3 quote cards with avatar, Korean name, session count badge.
6. Pricing: 2 cards — 무료 (outline) vs 플러스 (indigo border, "추천" badge).
7. Final CTA banner: indigo bg, "지금 바로 집중을 시작하세요" + button.
8. Footer: dark bg (#212529), white text, links in 3 columns.

Mood: calm, trustworthy, focused. Generous whitespace. No loud colors.
```

---

### [P02] 로그인 / 회원가입

```
[DESIGN SYSTEM — 위 공통 블록 붙여넣기]

Design a Korean mobile app screen pair: Sign Up and Login for "포커스타임".
Screen size: 390×844px (iPhone 14). Single-column centered layout.

=== Screen A: 회원가입 ===
- Top: back arrow (←) left + "회원가입" title centered
- Profile avatar placeholder (96px circle, dashed border, edit pencil icon overlay)
- Three input fields (56px height, 8px radius):
  "이메일 주소" / "비밀번호 (8자 이상)" / "비밀번호 확인"
  Password fields have show/hide eye icon on right
- Primary CTA button full-width: "시작하기"
- Divider line with "또는" centered
- Kakao login button: #FEE500 background, black text, Kakao logo icon left, 
  "카카오로 시작하기"
- Bottom small text: "이미 계정이 있으신가요? 로그인" (login link underlined)

=== Screen B: 로그인 ===
- Same layout structure but only 2 fields: 이메일 / 비밀번호
- "비밀번호를 잊으셨나요?" small link below password field
- Primary CTA: "로그인"
- Kakao button same as above
- Bottom: "아직 계정이 없으신가요? 회원가입"

Style: generous padding (24px sides), clean, no decorative elements.
```

---

### [P03] 대시보드

```
[DESIGN SYSTEM — 위 공통 블록 붙여넣기]

Design a Korean mobile app dashboard screen for "포커스타임".
Screen size: 390×844px.

Layout top to bottom:
1. Top bar (56px): circular avatar 40px left + greeting "안녕하세요, 은지님 👋" 
   bold 18px + bell icon with red badge right.
2. Weekly stats card (full-width, indigo #3B5BDB bg, white text, 12px radius, 16px padding):
   - Label "이번 주 집중 시간" (14px)
   - Value "2시간 30분" large bold + "/ 목표 5시간" secondary
   - Progress bar: sky blue (#74C0FC) on semi-transparent white, 50% filled, 8px height
3. Section header "예정된 세션" bold + "전체보기 >" link right
   Session card (white, shadow-sm, 12px radius):
   - Date chip "4월 20일 오후 3:00" left | "25분" indigo badge right
   - Partner row: 36px avatar + "김민준" + "매칭 완료" green badge
   - Goal text "목표: 논문 2장 작성" gray 14px
4. Section header "빠른 예약" bold
   - Duration pills row: [25분] [50분✓selected] [75분] — selected: filled indigo
   - Date strip: horizontal scroll, today "오늘" highlighted with indigo dot
   - "세션 만들기" full-width primary button
5. Bottom tab bar (64px): 홈(active, indigo) | 탐색 | 이력 | 프로필

Background: #F8F9FA. Cards have subtle shadow. Breathing room between sections.
```

---

### [P04] 세션 진행 화면 ⭐

```
[DESIGN SYSTEM — 위 공통 블록 붙여넣기]

Design a Korean mobile focus session room screen for "포커스타임".
Screen size: 390×844px.

CRITICAL DESIGN RULE: This is the most important screen. 
Minimize ALL visual noise. The timer must dominate. Lots of whitespace.

Layout:
1. Top bar (56px, white, bottom border):
   - Left: "집중 세션" 16px bold + "50분" indigo badge
   - Right: X close button (ghost, 24px icon)
2. Partner strip (48px, bg: #F8F9FA, bottom border):
   - 36px partner avatar + "김민준" 14px + "🤫 조용한 모드" small gray badge (if active)
3. YouTube embed area (full-width, 16:9 ratio, 12px radius, mx:16px):
   - YouTube iframe player
   - Below: "영상 변경" ghost button small (14px, underlined, secondary color)
4. Focus center (padding: 40px 24px, center-aligned):
   - Timer: "38:24" — 52px, bold, #3B5BDB, letter-spacing: -1px
   - Timer label: "남은 시간" — 13px, #6C757D, margin-top: 4px
   - Divider line (thin, 40px wide, centered)
   - Goal text: "나의 목표: 논문 2장 작성" — 15px, #6C757D
5. Chat area (flex-grow, scroll):
   - 3 visible message bubbles (alternate left/right by sender)
   - Input bar bottom: placeholder "메시지 입력..." + send arrow button
6. Footer: "세션 종료" — ghost red button, small, centered, 16px from bottom

Colors: white background everywhere. Indigo ONLY for timer. 
Green for success states. Everything else gray.
```

---

### [P05] 세션 종료 / 체크인

```
[DESIGN SYSTEM — 위 공통 블록 붙여넣기]

Design a Korean mobile session completion screen for "포커스타임".
Screen size: 390×844px. Single-column centered layout.

This screen celebrates the user's focus session completion. Warm but calm.

Layout:
1. Top area (subtle): small confetti dots scattered (indigo + green, faded)
2. Hero icon: 80px circle, bg: #3B5BDB, white checkmark ✓ inside (center)
3. Headline: "집중 완료! 🎉" — 28px bold center
   Sub: "50분 세션을 완료했습니다" — 16px secondary center
4. Achievement card (white, shadow, 12px radius, 16px padding):
   Label: "오늘의 성취를 적어보세요" 14px semibold
   Multiline textarea: placeholder "논문 2장 초안 완성!", height 100px
   Character counter: "0 / 100" right-aligned 12px gray
5. Rating row (inside same card or separate):
   Label: "파트너는 어땠나요?" 14px semibold
   5 star icons (☆☆☆☆☆) tappable, filled: #3B5BDB
6. Partner info row:
   36px avatar + "김민준" + "즐겨찾기 추가 ☆" ghost button right
7. CTA stack (bottom, 24px side padding):
   - Primary (indigo, full-width): "다음 세션 바로 예약하기"
   - Ghost (full-width): "대시보드로 돌아가기"

Background: #F8F9FA. No harsh dividers. Let spacing do the work.
```

---

### [P06] 프로필 화면

```
[DESIGN SYSTEM — 위 공통 블록 붙여넣기]

Design a Korean mobile user profile screen for "포커스타임".
Screen size: 390×844px.

Layout:
1. Top bar: "프로필" center bold + "편집" indigo text button right
2. Profile hero (center-aligned, padding: 32px 0 24px):
   - Avatar: 96px circle, border 2px indigo, edit pencil overlay bottom-right
   - Nickname: "이은지" 22px bold
   - Bio: "매일 조금씩 성장 중 🌱" 14px secondary
   - Interest tags (pill chips, bg: #EDF2FF, text: #3B5BDB): "공부" "글쓰기" "코딩"
3. Stats row (3 equal cards, bg: #EDF2FF, 12px radius):
   - "완료 세션" / "128회" bold
   - "총 집중" / "106시간" bold
   - "이번 주" / "3 / 5회" bold
4. Section "단골 파트너":
   Horizontal scroll row: circular avatar (48px) + nickname below, 4-5 visible
5. Section "설정" (list rows, 56px height each, divider between):
   - 알림 설정  →
   - 매칭 선호도  →
   - 구독 관리  →
   - 개인정보처리방침  →
   - 로그아웃  (text: #FA5252, no chevron)
6. Bottom tab bar: 홈 | 탐색 | 이력 | 프로필(active, indigo)
```

---

## 5. Follow-up Refinement 프롬프트 (Stitch 추가 조정용)

생성 후 Stitch chat에서 아래 프롬프트로 세부 조정하세요.

```
# 타이포그래피 조정
"Make all Korean text use Pretendard font, increase line-height to 1.6 for body text"

# 간격 조정
"Add more vertical padding between sections, minimum 24px between each block"

# 타이머 강조
"Make the timer text larger (56px) and bolder, with more surrounding whitespace"

# 배경색 적용
"Change the page background to #F8F9FA and card backgrounds to pure white #FFFFFF"

# 입력 필드 수정
"Increase input field height to 56px, add 2px indigo focus ring"

# 버튼 수정
"Make the primary button full-width, height 52px, border-radius 8px"

# 하단 탭바 수정
"Add a top border to the bottom tab bar, active icon and label in #3B5BDB"

# 다크 요소 제거
"Remove all dark backgrounds except the stats bar. Keep everything light and airy"

# 색상 팔레트 일관성
"Apply indigo #3B5BDB only to: primary buttons, active states, timer, and badges.
Use green #2F9E44 only for success/completion states."
```

---

## 6. 화면 흐름 (User Flow)

```
비회원
  └─ 랜딩(/) ──[CTA]──► 회원가입(/signup)
                              │
                         이메일 인증
                              │
                         온보딩(/onboarding)
                              │
                         대시보드(/dashboard)

회원 — 세션 예약 흐름
  대시보드 ──[빠른 예약]──► 세션 슬롯 탐색(/sessions/browse)
                                   │
                              세션 생성 or 참가
                                   │
                              세션 상세(/sessions/:id)
                                   │ (시작 5분 전)
                              대기실(/sessions/:id/lobby)
                                   │ (시작)
                              세션 진행(/sessions/:id/room)
                                   │ (타이머 종료)
                              체크인(/sessions/:id/done)
                                   │
                              대시보드

회원 — 구독 흐름
  대시보드 ──[주 3회 초과]──► 업그레이드 모달
                                    │
                              요금제(/pricing)
                                    │
                              결제(/checkout)
                                    │
                              구독 활성화 → 대시보드
```

---

## 7. 접근성 체크리스트

```
□ 모든 interactive 요소에 aria-label 한국어 작성
  예: <button aria-label="세션 취소">X</button>
□ 색상만으로 상태 구분 금지 → 아이콘 또는 텍스트 병기
□ 입력 필드에 <label> 연결 또는 aria-label 필수
□ 포커스 링: outline none 사용 시 custom focus ring 대체 필수
□ 이미지에 alt 텍스트 (한국어)
□ 대비율: 텍스트 최소 4.5:1, 대형 텍스트 3:1 (WCAG 2.1 AA)
□ 타이머: aria-live="polite" 로 스크린리더 읽힘 설정
□ 모달 열릴 때 focus trap 구현
```

---

*이 문서는 AI 에이전트가 프론트엔드 코드 생성·리뷰 시 참조하는 디자인 명세서입니다.*  
*Stitch 생성물과 실제 구현 사이의 간극은 이 문서 기준으로 판단하세요.*  
*변경 시 버전 번호와 변경 일자를 상단에 반드시 업데이트하세요.*
