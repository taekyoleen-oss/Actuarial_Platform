# /datalab 팝업 "창으로 고정" — Document Picture-in-Picture 설계

- 날짜: 2026-07-20
- 대상: `components/feature/datalab/usePinnableDialog.tsx` (주) + `DistCodeDialog.tsx`·`MethodCloud.tsx`(MethodDialog)·`ExcelFunctionCloud.tsx`(FunctionDialog) + `types/document-picture-in-picture.d.ts`(신규)
- 트리거: 사용자 요청 — "팝업의 앞면 고정이 해당 웹페이지뿐 아니라 다른 앱(엑셀 등)에서도 이 팝업만 앞면에 오고 자유롭게 이동할 수 있도록 개선"

## 배경 / 문제

현재 `usePinnableDialog`의 "앞면 고정"은 `position: fixed`로 **브라우저 뷰포트 내부에서만** 맨 앞에 둔다. 브라우저 밖(엑셀 등 다른 앱) 위로는 나갈 수 없다 — 브라우저 보안 샌드박스의 원천적 제약이다.

표준 웹에서 브라우저 콘텐츠를 **다른 앱 위에 항상 표시**할 수 있는 유일한 무설치 수단은 **Document Picture-in-Picture API**(`window.documentPictureInPicture.requestWindow()`)다. 브라우저가 띄우는 별도 OS 창이라 always-on-top이며 OS가 이동·크기조절을 담당한다. 크롬·엣지(Chromium 116+) 지원, Firefox·Safari 미지원.

사용자 결정:
- 방식 = **A. Document PiP** (무설치·웹앱 유지).
- 버튼 = **단일 버튼으로 통합** — 지원 브라우저는 PiP 창, 미지원 브라우저는 기존 브라우저-내 고정으로 자동 폴백.

## 목표

1. 크롬·엣지에서 팝업을 별도 OS 창으로 분리해 **엑셀 등 다른 앱 위에도 항상 표시**하고 자유 이동.
2. 분리된 창에서도 **탭 전환·코드 복사·글자 확대/축소·수식(KaTeX)·스크롤** 등 상호작용이 완전히 동작.
3. 상태(현재 탭·글자배율·스크롤 위치)를 유지한 채 모달 ↔ PiP 전환.
4. 미지원 브라우저는 기존 브라우저-내 고정(inline) 동작 그대로 폴백.

## 비목표 (YAGNI)

- PiP 창을 동시에 여러 개: 브라우저 정책상 Document PiP 창은 전역 1개. 다른 팝업을 PiP로 열면 이전 창이 닫히는 것은 네이티브 동작으로 수용.
- PiP 창 안에서의 드래그·모퉁이 리사이즈: OS 창이 담당하므로 미사용(inline 폴백 전용으로 보존).
- 데스크톱 앱(Electron/Tauri) 전환: 범위 밖.

## 3-모드 모델

`usePinnableDialog`은 내부 `mode: "modal" | "inline" | "pip"` 를 가진다. `pinned = mode !== "modal"`.

| mode | 조건 | 표현 | 이동/크기 |
|------|------|------|-----------|
| `modal` | 고정 안 함 | 가운데 모달(오버레이) | — |
| `pip` | 고정 + PiP 지원(크롬·엣지) | 별도 OS 창(다른 앱 위) | OS 창 |
| `inline` | 고정 + PiP 미지원(Firefox·Safari) 또는 PiP 실패 | 뷰포트 내 fixed 축소창 | 헤더 드래그 + 4모퉁이 |

버튼(단일): `modal`에서 누르면 지원 시 `pip`, 미지원 시 `inline`. 고정 상태에서 누르면 `modal`로 복귀.

## 핵심 기술

### 1) 별도 React 루트 (이벤트 보장)

React 19의 `createPortal`로 **다른 document(PiP 창)** 에 넣으면, 이벤트 위임 리스너가 메인 문서 루트 컨테이너에 붙어 있어 PiP 창 내부 클릭이 핸들러에 도달하지 못한다(크로스-도큐먼트 이벤트 미발화). 따라서 **PiP 창 body에 `createRoot`로 별도 React 루트**를 만들어 팝업 내용을 렌더한다. 이 루트가 PiP document에 자체 리스너를 붙이므로 클릭·복사·탭 전환이 정상 동작한다.

- 상태는 여전히 **메인 트리의 팝업 컴포넌트**가 소유. 넘기는 `children`(헤더·본문·푸터 JSX)의 onClick은 메인 컴포넌트의 setState 클로저 → PiP에서 클릭 시 setState 호출 → 메인 재렌더 → 새 `children`을 두 번째 루트에 다시 `render`. 상태 공유는 클로저라 루트 경계와 무관.
- 컨텍스트 안전성(정적 감사 완료): 넘기는 children은 React 컨텍스트·Next 전용 훅(useRouter/next-link/next-image 등)을 **소비하지 않는다**(`useRunner`·`useDatalabOverrides`는 팝업 컴포넌트 본체=메인 트리에서만 호출, `useDatalabOverrides`는 컨텍스트가 아니라 모듈 스토어 훅). 따라서 두 번째 루트에서 Provider 부재로 인한 문제 없음.

`PipMount` 컴포넌트(모듈 스코프): `win` prop으로 창을 받아 마운트 시 스타일 주입 + 컨테이너 div + `createRoot`, `children` 변경마다 `root.render(children)`, 언마운트 시 `root.unmount()`.

### 2) 스타일 복제

PiP 창 document는 비어 있어 CSS가 하나도 없다. 창을 열 때 메인 문서의 `style, link[rel="stylesheet"]` 노드를 **모두 `cloneNode(true)`로 복제**해 PiP head에 넣는다.
- `<link>`는 href·media 보존(정확한 base로 로드 → KaTeX 폰트 URL 안전).
- `<style>`는 textContent 복제(즉시 스타일 적용 → 무플래시).
- 두 종류 모두 복제해 dev(주로 `<style>`)·prod(주로 `<link>`) 모두 커버. 중복 규칙은 무해.
- `documentElement`/`body`의 className·lang, `:root` 인라인 커스텀 프로퍼티 복사 → Tailwind·globals.css 토큰(`--primary` 등)·폰트 상속.
- PiP body: `margin:0; height:100vh; overflow:hidden`, 컨테이너 `flex h-full w-full flex-col overflow-hidden bg-white` → 본문 `flex-1 overflow-y-auto`가 창 안에서 스크롤.

### 3) 창 닫기 구분

- 버튼 "고정 해제"(pip) → 내부 플래그 `closingRef=true` 세팅 후 `pipWindow.close()` → `pagehide` 핸들러가 `mode=modal` 복귀(플래그로 인해 `onClose` 미호출).
- OS 창 X로 닫음 → `pagehide`가 플래그 없이 발화 → 팝업 전체 닫기(`onClose`).
- 컴포넌트 언마운트 시 열려 있던 PiP 창 정리(`closingRef=true` 후 close).

### 4) 지원 감지 / 사용자 제스처

- `pipSupported = "documentPictureInPicture" in window` (마운트 후 state로 세팅 → SSR mismatch 회피).
- `requestWindow()`는 사용자 제스처 필요 → 버튼 onClick에서 동기 호출(첫 await 이전). 실패(차단·거부) 시 `inline` 폴백.

## API 리팩터 (훅 중심화)

```ts
const pin = usePinnableDialog({ onClose, ariaLabel, panelClassName, pipTitle? });
return pin.render(
  <>
    <header {...pin.dragHandleProps}> … {pin.PinButton()} … </header>
    … 기존 본문·탭·푸터 그대로 …
  </>
);
```

- `render(children)`: 3-모드를 캡슐화 — modal/inline은 오버레이+패널(+inline 시 ResizeHandles) 렌더, pip는 `<PipMount>` 렌더(메인 DOM엔 null).
- `dragHandleProps`: inline에서만 비어있지 않음(pip·modal은 `{}`).
- `PinButton`: 라벨/동작 mode·pipSupported에 따라 자동 — modal+지원 "창으로 고정", modal+미지원 "앞면 고정", 고정 상태 "고정 해제".
- 공개 API에서 `overlayClass`·`panelStyle`·`ResizeHandles` 제거(내부화). `pinned` 유지(각 팝업의 Esc·스크롤락 effect가 사용).

세 팝업 변경: `usePinnableDialog()` 인자 추가 + `return`의 바깥 두 div(오버레이·패널)와 `{pin.ResizeHandles()}`·`onClick stopPropagation`를 `pin.render(<>…</>)`로 대체. **헤더·탭·본문·푸터 내부 JSX는 무변경.**

## 타입

`types/document-picture-in-picture.d.ts` — 아직 lib.dom 표준이 아니라 앰비언트 최소 선언(`DocumentPictureInPicture`, `requestWindow`, `window.documentPictureInPicture?`).

## 검증

- `tsc --noEmit`·`next build` 통과.
- Playwright 실측(크롬):
  - 데이터랩에서 팝업 열기 → "창으로 고정" → 별도 창 분리, 메인 페이지 오버레이 사라짐(배경 상호작용 가능).
  - PiP 창에서 탭 전환·전체/블록 복사·글자 가+/가−·스크롤 동작, 콘솔 에러 0.
  - "고정 해제" → 가운데 모달 복귀 / OS 창 X → 팝업 전체 닫힘.
  - (헤드리스에서 Document PiP 미지원일 수 있음 — 그 경우 미지원 분기가 기존 inline 고정으로 폴백되는지 확인하고, 실제 크롬 수동 확인을 병기.)
- 회귀: 기존 inline 고정(드래그·모퉁이 리사이즈)·모달 열고닫기·Esc·오버레이 클릭 닫기 정상.

## 변경 파일 요약

- `types/document-picture-in-picture.d.ts` (신규) — 앰비언트 타입.
- `components/feature/datalab/usePinnableDialog.tsx` — 3-모드·PiP·별도 루트·스타일 복제·render() (주 작업).
- `components/feature/datalab/DistCodeDialog.tsx` — return을 `pin.render(...)`로.
- `components/feature/datalab/MethodCloud.tsx` (MethodDialog) — 동일.
- `components/feature/datalab/ExcelFunctionCloud.tsx` (FunctionDialog) — 동일.

## 추가 요청 — 숨기기/보이기(제목만 접기) (2026-07-20, 구현 완료)

사용자 후속 요청: 고정 상태에서 '숨기기' 버튼으로 **제목만 남기고 접고**, '보이기'로 원래대로 복원.

- 고정(pip·inline) 상태에서만 헤더에 `숨기기` 버튼 노출(`CollapseButton`, modal·접힘 상태에선 null). 각 팝업 헤더에 `{pin.CollapseButton()}`를 `{pin.PinButton()}` 앞에 추가.
- 접히면 본문 전체를 `CollapsedBar`(제목 + '보이기' + × 닫기, 높이 44px)로 대체:
  - **pip**: `pipWindow.resizeTo(outerW, 44 + chrome)`로 창을 제목 바 높이로 축소(펼치면 접기 전 크기로 복원, prevSize ref). `resizeTo`가 Document PiP 창에서 동작함을 실측 확인.
  - **inline**: 패널 `height`를 44px로(펼치면 rect.h 복원). 바는 드래그로 이동 가능(dragProps).
- `modal`로 복귀하면 접힘 상태 자동 해제(effect).
- 검증: pip 접기(280→44px, 본문 dl/pre/h3 제거)·펼치기(복원), inline 접기(477→44px)·펼치기·고정해제 모달복귀, 콘솔 0.
