# CCC 순 Profile — 프로젝트 구조 문서

## 1. 프로젝트 개요

동아리(CCC) 선배들의 프로필을 열람하고, 가능한 시간대에 1:1 만남을 신청할 수 있는 **싱글 페이지 웹 애플리케이션(SPA)**.

> **배포**: GitHub Pages (정적 호스팅) — 별도 서버/빌드 없이 push만으로 배포

### 핵심 흐름
```
[신청자 정보 입력] → [선배 프로필 Grid] → [선배 선택 + 캘린더 예약] → [Master Page: 전체 신청 현황]
```

---

## 2. 페이지 구성

| # | 페이지 (View) | 설명 |
|---|---|---|
| 1 | **ApplicantForm** | 학번, 나이, 성별, 간단 소개 입력 |
| 2 | **ProfileGrid** | 선배 프로필 카드 그리드 |
| 3 | **CalendarView** | 선택한 선배의 프로필(좌상단) + 가능 시간 캘린더 |
| 4 | **MasterPage** | 전체 신청 결과 대시보드 |

---

## 3. 데이터 구조

### 3.1 선배 프로필 (`seniorProfiles`)
```js
{
  id: "senior_01",
  name: "홍길동",
  photo: "assets/seniors/hong.jpg",
  role: "부회장",
  introduction: "반갑습니다!",
  availableSlots: [
    { date: "2026-02-22", times: ["10:00", "11:00", "14:00"] },
    { date: "2026-02-23", times: ["13:00", "15:00"] },
    // ... 2월 22일 ~ 3월 7일
  ]
}
```

### 3.2 신청자 정보 (`applicantInfo`)
```js
{
  studentId: "2024001",
  age: 20,
  gender: "남",
  introduction: "안녕하세요, 새내기입니다!"
}
```

### 3.3 예약 기록 (`reservations`)
```js
{
  applicant: { /* applicantInfo */ },
  seniorId: "senior_01",
  date: "2026-02-25",
  time: "14:00",
  createdAt: "2026-02-10T11:00:00"
}
```

---

## 4. 디렉토리 구조

```
CCC_순_Profile/          ← GitHub repo root
├── index.html              # 진입점 (GitHub Pages entry)
├── .nojekyll               # Jekyll 처리 비활성화
├── Project.md              # 이 문서
├── css/
│   ├── reset.css           # CSS 리셋
│   ├── variables.css       # 디자인 토큰 (색상, 폰트, 간격)
│   ├── layout.css          # 레이아웃 & 반응형
│   ├── components.css      # 컴포넌트별 스타일
│   └── animations.css      # 전환 & 애니메이션
├── js/
│   ├── app.js              # 앱 초기화 & 라우팅 (ES Module)
│   ├── state.js            # 상태 관리 (applicantInfo, reservations)
│   ├── data.js             # 선배 프로필 데이터
│   ├── views/
│   │   ├── applicantForm.js    # 신청자 폼 렌더링 & 유효성 검사
│   │   ├── profileGrid.js      # 프로필 그리드 렌더링
│   │   ├── calendarView.js     # 캘린더 렌더링 & 예약 로직
│   │   └── masterPage.js       # 전체 신청 현황 렌더링
│   └── utils/
│       ├── dom.js              # DOM 헬퍼 함수
│       ├── date.js             # 날짜 유틸리티
│       └── animation.js        # 애니메이션 유틸리티
└── assets/
    └── seniors/            # 선배 프로필 사진
```

---

## 5. 기술 스택

| 항목 | 선택 | 이유 |
|---|---|---|
| 마크업 | HTML5 | 시맨틱 구조 |
| 스타일 | Vanilla CSS | 최대 유연성, 별도 빌드 불필요 |
| 로직 | Vanilla JS (ES Module) | `<script type="module">`로 로드, 번들러 불필요 |
| 상태 저장 | localStorage | 서버 없이도 데이터 유지 (도메인별 격리) |
| 폰트 | Google Fonts (Pretendard / Noto Sans KR) | 한글 가독성 |
| 배포 | GitHub Pages | push만으로 자동 배포, HTTPS 기본 제공 |

---

## 6. 배포 (GitHub Pages)

### 설정
1. GitHub 저장소 생성 (`CCC_순_Profile` 또는 영문 이름)
2. Settings → Pages → Source: **main branch** / root (`/`)
3. `.nojekyll` 파일 추가 (빈 파일 — Jekyll 빌드 방지)

### 주의사항
- **모든 경로는 상대 경로** 사용 (`./css/`, `./js/`, `./assets/`)
- JS는 `<script type="module" src="./js/app.js">` 로 로드
- `localStorage`는 GitHub Pages 도메인(`{user}.github.io`)에 바인딩됨
  - 다른 기기/브라우저에서는 데이터가 공유되지 않음
- 이미지 용량 주의: 각 프로필 사진은 **200KB 이하**로 최적화 권장

---

## 7. 핵심 인터랙션

### 7.1 그리드 → 캘린더 전환 애니메이션
1. 클릭한 카드의 현재 위치·크기를 `getBoundingClientRect()`로 캡처
2. 카드를 `position: fixed`로 전환
3. 좌상단 목표 위치·크기로 `transform` 애니메이션 (약 400ms ease-out)
4. 애니메이션 완료 후 캘린더 영역 페이드인

### 7.2 캘린더 — 가능 시간 표현
- **가능한 시간만 컬러 버튼으로 표시**, 불가능한 시간은 렌더링하지 않음
- 날짜 행 + 시간 버튼 리스트 구조
- 선택 시 즉시 시각적 피드백 (색 변경 + 체크 아이콘)
