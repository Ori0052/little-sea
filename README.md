# 나의 작은 바다

파도 소리를 들으며 쉬고, 섬을 탐험하고, 함께 낚시하는 온라인 바다입니다.

- 웹: https://little-sea.rhfenrdltkfk.chatgpt.site
- 앱인토스 appName: `little-sea`
- 6개 섬, 최대 6인 나무배, 낚시와 모닥불 요리, 텐트 휴식
- 보물 6종과 각각의 왕관, 종이 카드 부적 10종
- 서버 세션 인증과 방문자·네트워크별 접속/점유 제한

## 로컬 개발

Node.js 24 LTS를 권장합니다. 웹은 Cloudflare Workers/Vinext, 토스는 게임 화면을 공유하는 Vite SPA입니다.

```sh
npm ci
npm ci --prefix apps-in-toss
npm run dev
```

웹 서버가 켜진 뒤 토스 브라우저 미리보기가 필요하면 별도 터미널에서 `npm run dev --prefix apps-in-toss`를 실행합니다. 실제 토스 네이티브 저장·공유·뒤로가기는 콘솔 QR 테스트가 필요합니다.

## 검사와 빌드

```sh
npx tsc --noEmit
node tests/sea-session.test.mjs
npm run build
npm run build --prefix apps-in-toss
node apps-in-toss/tests/platform.test.mjs
```

GitHub Actions의 **Build Little Sea**가 main 업데이트·PR·수동 실행 시 이 과정을 검사하고 웹 `dist/`와 `little-sea.ait`를 빌드 아티팩트로 보관합니다. GitHub에 소스·그래픽·마이그레이션만 저장하며, 빌드 결과·실행 DB·비밀값은 커밋하지 않습니다.

빌드는 공개 배포나 토스 심사 요청을 자동 실행하지 않습니다. 웹 백엔드는 D1과 보안 세션을 사용하므로 GitHub Pages에 정적 파일만 올려서는 전체 기능이 동작하지 않습니다. 토스 콘솔에는 새 `.ait`와 등록 이미지를 별도로 업로드해야 합니다.

## 그래픽

보물·왕관은 승인된 진주빛 입체 시안을 투명 PNG로 제작했습니다. `public/treasure-art/`의 원본과 프레임 메타데이터를 수집함·착용 캐릭터가 공유합니다. 수집품 ID를 바꾸지 않으므로 기존 획득 기록과 왕관 선택을 유지합니다. 아직 획득하지 않은 보물과 왕관은 수집함에서 숨깁니다.

로고·부적·보물 및 왕관 일러스트에는 생성형 AI로 제작한 그래픽이 포함되어 있습니다. 이 저장소의 공개 여부가 제3자 의존성이나 에셋의 별도 라이선스를 바꾸지는 않습니다.

## 운영 안내

보안 세션과 네트워크 한도, 토스 연결·등록·실기기 점검은 [토스 안내](apps-in-toss/README.md)를 확인하세요. 새 백엔드를 배포할 때 `drizzle/` 마이그레이션을 함께 적용해야 합니다. 토큰·복구 비밀·네트워크 해시·이용자 저장값은 이 저장소에 포함하지 않습니다.

저장소에는 원래 프로젝트의 Sites 설정과 Worker 빌드 구성이 유지되어 있습니다. 개발 템플릿 안내는 [docs/STARTER.md](docs/STARTER.md)에 보관합니다.
