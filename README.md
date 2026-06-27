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

## 라이브 데모 배포

> ⚠️ **이 앱은 정적 사이트가 아닙니다.** SSR(서버 렌더링) + `node:sqlite` 파일 DB를 쓰므로
> 배포 대상은 아래 두 조건을 만족해야 합니다.
>
> 1. **Node.js 22.5 이상 런타임** (`node:sqlite` 내장 모듈 사용, Node 24+ 권장)
> 2. **영구 디스크(persistent volume)** — `data/app.sqlite` 가 유지되어야 함.
>    Vercel·Netlify·Cloudflare 같은 **서버리스/정적 호스팅은 파일이 매 요청마다 사라져 계정이 초기화**되므로 부적합합니다.
>
> 따라서 컨테이너/디스크를 제공하는 **Railway · Render · Fly.io · VPS** 를 권장합니다.

배포 시 공통으로 필요한 명령:

```bash
npm install
npm run build
npm start         # node ./dist/server/entry.mjs, 기본 0.0.0.0:4321
```

호스트가 지정한 포트를 쓰려면 `HOST`/`PORT` 환경변수를 설정하세요 (standalone 어댑터가 자동 인식).

### 1) Railway (가장 간단)

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** → `dimplejuno/EnglishEdu` 선택
2. Build/Start 명령은 자동 감지됩니다 (필요 시 Build: `npm run build`, Start: `npm start`)
3. **Settings → Volumes** 에서 볼륨을 추가하고 마운트 경로를 `/app/data` 로 지정 → SQLite 영구 보존
4. 발급된 도메인으로 접속하면 라이브 데모 완성

### 2) Render

1. [render.com](https://render.com) → **New → Web Service** → GitHub 저장소 연결
2. Runtime: **Node**, Build Command: `npm run build`, Start Command: `npm start`
3. Environment에 `NODE_VERSION = 24` 추가
4. **Disks** 에서 디스크를 추가하고 Mount Path 를 `/opt/render/project/src/data` 로 지정
5. Create Web Service → 배포 완료 후 `.onrender.com` 주소로 접속

### 3) Fly.io (Docker + 볼륨)

저장소에 포함된 [`Dockerfile`](./Dockerfile) 을 사용합니다.

```bash
fly launch --no-deploy          # fly.toml 생성 (앱 이름 지정)
fly volumes create data --size 1   # 1GB 영구 볼륨
# fly.toml 에 아래 마운트 추가:
#   [mounts]
#     source = "data"
#     destination = "/app/data"
fly deploy
```

### 4) 직접 서버(VPS) / Docker

```bash
# 저장소에 포함된 Dockerfile 로 이미지 빌드
docker build -t englishedu .

# data 디렉터리를 호스트에 마운트해 SQLite 영구 보존
docker run -d -p 4321:4321 -v $(pwd)/data:/app/data --name englishedu englishedu
```

또는 PM2 등으로 직접 실행:

```bash
npm ci && npm run build
pm2 start "node ./dist/server/entry.mjs" --name englishedu
```

> 🔒 **공개 배포 전 권장 사항**: 현재 대시보드는 데모 목적으로 전체 사용자 목록을 노출합니다.
> 실제 서비스라면 해당 부분을 제거하고, HTTPS(역방향 프록시) 뒤에서 운영하세요.

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
