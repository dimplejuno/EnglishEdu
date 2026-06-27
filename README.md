# EnglishEdu

Astro로 만든 간단한 웹사이트 + **로컬 사용자 계정 관리** 데모.
회원가입 / 로그인 / 세션 / 계정 관리(이름·비밀번호 변경, 탈퇴)를 모두 로컬에서 처리합니다.

## 기술 스택

- **Astro 5** (SSR, `output: 'server'` + `@astrojs/node` 어댑터)
- **node:sqlite** — Node.js 내장 SQLite (별도 네이티브 의존성 없음)
- **node:crypto** scrypt + salt 비밀번호 해싱
- 쿠키 기반 세션 (HttpOnly, SameSite=Lax, 7일)

## 실행

```bash
npm install      # astro 만 설치됩니다
npm run dev      # http://localhost:4321
```

프로덕션:

```bash
npm run build
npm start        # node ./dist/server/entry.mjs
```

## 데이터 저장 위치

모든 계정·세션은 로컬 파일 **`data/app.sqlite`** 에 저장됩니다.
(`.gitignore`에 포함되어 커밋되지 않습니다. 초기화하려면 `data/` 폴더를 삭제하세요.)

## 구조

```
src/
├── lib/
│   ├── db.ts          # SQLite 연결 + 스키마(users, sessions)
│   └── auth.ts        # 해싱·사용자·세션 헬퍼
├── middleware.ts      # 세션 → Astro.locals.user, 보호 경로 처리
├── layouts/Layout.astro
└── pages/
    ├── index.astro    # 홈
    ├── register.astro # 회원가입
    ├── login.astro    # 로그인
    ├── dashboard.astro# 대시보드(보호됨)
    ├── account.astro  # 계정 관리(보호됨)
    └── api/logout.ts  # 로그아웃 엔드포인트
```

## 주요 기능

| 기능 | 경로 |
|------|------|
| 회원가입 (이메일 중복·형식·비밀번호 검증) | `/register` |
| 로그인 / 로그아웃 | `/login`, `/api/logout` |
| 대시보드 (내 정보 + 사용자 목록) | `/dashboard` |
| 이름 변경 · 비밀번호 변경 · 계정 삭제 | `/account` |

비밀번호는 평문으로 저장되지 않으며 `salt:hash` 형태로만 보관됩니다.
