# 나의 작은 바다

바다를 산책하고 다른 방문자들과 쉬어가는 웹사이트입니다.

- 운영 사이트: https://your-little-sea-k29.rhfenrdltkfk.chatgpt.site/
- 배포 소스 기준: `eb3b5826b747c7b0c47c7b75ed8dba6529529549` (Sites v34)
- 달빛 수평선과 파도 해변은 같은 월드 좌표를 공유합니다.
- 바위섬, 10인 불멍 자리, 장작·오로라 가루·군고구마, 먼 캠핑 섬을 포함합니다.
- WebGL 실패 시 두 섬을 Canvas 2D로 표시하고 실패 단계를 세션에 기록합니다.

## 개발

Node.js 22.13.0 이상이 필요합니다.

```sh
npm ci
npm run dev
```

터미널에 표시되는 로컬 주소로 접속합니다. 상세 실행·저장소 설정은 [기존 프로젝트 안내](docs/STARTER.md)를 참고하세요.

```sh
npx tsc --noEmit
npm run build
```

React 19, Vinext/Vite, Cloudflare Workers와 D1을 사용합니다. `db/schema.ts`와 `drizzle/`는 실시간 방문자·자리·모닥불 상태의 스키마와 마이그레이션입니다. 별도 호스팅으로 옮길 때는 D1 `DB` 바인딩과 마이그레이션 적용이 필요합니다. 정적 파일만으로 모든 실시간 기능을 실행할 수는 없습니다.

## 소스 구조

- `app/`: 화면, 스타일과 API
- `components/`: 바다·섬·캐릭터 렌더링과 상호작용
- `hooks/`: 실시간 상태와 오디오
- `db/`, `drizzle/`: 데이터베이스 스키마와 마이그레이션
- `public/`: 실행에 사용하는 이미지·글꼴 등 에셋
- `.openai/hosting.json`: 기존 Sites 배포 대상 설정

이 복사본은 소스와 실행 에셋을 포함합니다. 비밀키, 로컬 환경 설정, 방문자 데이터베이스, 설치 패키지와 임시 빌드는 포함하지 않습니다. GitHub 업로드만으로 운영 사이트의 배포나 공개 범위가 변경되지는 않습니다.
