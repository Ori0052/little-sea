# 3D 시제품 제작과 검증 결과

2026년 11월 9일. /3d-lab에서 배 단독·탑승·바다·섬을 단계별로 확인하는 첫 시제품이다. 기존 / 본편과 서버 권한은 변경하지 않았다.

## 제작물

- scripts/blender/build_sea_boat.py: Blender 4.3에서 모델·재질·좌석·노 피벗·섬을 생성하고 GLB 내보내기.
- scripts/blender/sea-boat.blend: 편집 가능한 압축 Blender 원본.
- public/models/sea-boat.glb: 약 702 KiB, 외부 텍스처 없는 웹 자산.
- components/boat-3d-rig.ts: 기존 BoatSnapshot·boatSeatPosition 규칙과 연결되는 표현 어댑터.
- /3d-lab: 4단계, 1~6명, 노 젓기·정지, 낮·밤, 드래그·확대·시점 초기화.

팔과 노는 Three.js에서 같은 주기로 구동한다. 손잡이의 완전한 IK, 구운 애니메이션 클립, 실제 다중 사용자 동기화는 이번 완료 범위가 아니다. 선장 고리는 테스트의 첫 좌석에 표시하며 실제 선장 권한은 기존 서버 기준을 유지한다.

## 검증

실제 GLB를 읽는 단위 검사 3개로 Blender 생성자·필수 노드·1 MiB 자산 한도·6개 좌석·한 사람당 노 하나·정지·움직임 줄이기를 확인했다. 기존 26개 검사와 웹·토스 빌드를 함께 실행한다.

Chromium의 실제 WebGL을 SwiftShader로 구동해 모델 로딩, 인원 1~6명, 4단계, 낮·밤, 정지, 390px 모바일 화면을 확인했다. WebGL 비활성·GLB 로딩 실패·재시도도 별도 점검한다. 이 결과를 토스의 물리 기기 성능으로 일반화하지 않는다.

첫 렌더에서 물결의 격자 무늬·수면 아래 섬·과한 조명·많은 그리기 호출을 발견했다. 수면 셰이더와 섬 높이·조명을 조정하고 부모·재질별 메시 병합으로 수정했다. 6명과 섬을 표시하는 장면의 draw call은 346에서 69로 줄었다. 소프트웨어 렌더러의 프레임은 약 10~14 FPS로, 실제 모바일 GPU 성능의 측정값이 아니다.

노 젓기를 정지하거나 움직임 줄이기를 설정하면 화면 변경 시에만 다시 그린다. 화면 숨김 동안 렌더링을 건너뛰고 이탈 시 geometry·material·renderer·controls 자원을 정리한다.

## 재현

`blender --background --python scripts/blender/build_sea_boat.py -- public/models/sea-boat.glb`

`node tests/boat-3d.test.mjs`

개발 서버 실행 후 `PLAYWRIGHT_MODULE=/path/to/playwright node tests/browser/sea-3d-flow.cjs`. 출력 폴더는 SEA_TEST_OUTPUT, 주소는 SEA_TEST_URL, Chromium 경로는 CHROMIUM_PATH로 지정한다.

## 본편 교체 전 남은 작업

1. 사용자의 배·캐릭터·섬 그래픽 검토와 아트 수정.
2. 실시간 BoatSnapshot을 Three.js 카메라·장면·충돌·정박과 연결.
3. 손·노 접점과 실제 이동 중 노 동작 정교화, 캐릭터 외형·왕관 연결.
4. 토스 실제 기기의 로딩·메모리·발열·배터리·프레임 검증.
5. 기존 바다 셰이더 이식 또는 새 수면 선택, 나머지 섬·잠수·수집물의 점진적 이식.

기존 게임을 전부 3D로 전환했거나 토스 실기기 검증이 끝났다고 표시하지 않는다.
