---
name: theory-publisher
description: "보험이론 사전(/theory) 자료 게시 자동화 스킬. public/theory/<topic>/에 추가된 .html·.pdf를 확인하고, 내용에서 모티프를 추출해 플랫 카툰 SVG 커버(자료명.svg)를 스타일 시스템 규칙대로 생성한 뒤, 빌드 검증·커밋·푸시까지 수행한다. '보험이론 사전에 자료 게시/추가/올려줘', '이론 자료 푸시', '커버(그림) 만들어/다시 만들어', '이론 사전 게시' 요청 시 반드시 사용. 커버 재생성·스타일 보완 요청 시에도 사용."
---

# theory-publisher — 보험이론 사전 게시 + 커버 일러스트

`public/theory/<topic>/` 폴더 기반 자료실에 자료를 게시하고, **모든 자료에 일관된 플랫 카툰 SVG 커버**를 자동 생성한다.
커버 스타일은 2026-06-11 사용자가 3개 후보(플랫 카툰/라인/픽셀) 중 **A. 플랫 카툰**으로 확정했다.

## 워크플로우

1. **대상 파악**: `git status`로 `public/theory/*/` 의 새 `.html`/`.pdf` 확인 (또는 사용자가 지정한 파일).
   - 페어링 규칙: 같은 파일명(확장자 제외) = 한 항목. 숫자 접두사(`01_`)는 정렬용.
2. **내용 분석**: 각 `.html`의 `<title>`·`<h1>`·도입부를 읽고(전체를 읽을 필요 없음, 너무 크면 Grep)
   자료의 **핵심 개념 1개**를 모티프로 도출한다 (아래 모티프 가이드).
3. **커버 생성**: `public/theory/<topic>/<자료명>.svg` 를 아래 스타일 시스템 스펙으로 작성.
   `lib/theory.ts`가 같은 base명 `.svg`를 자동으로 카드 커버로 매칭한다.
4. **빌드 검증**: `npm run build` → `/theory/[topic]` 목록과 `/theory/[topic]/v/[name]` 뷰어가 항목 수만큼 생성되는지 확인.
5. **커밋·푸시**: `git add public/theory/<topic>` → 커밋(예: `docs: 보험이론 사전 <주제> 자료 N종 게시 (+커버)`) → push.
   다른 무관한 untracked 파일은 스테이징 금지.
6. **보고**: 커밋 해시·푸시 결과·게시 항목·재배포 후 확인 안내.

새 주제 추가 요청 시: `lib/theory.ts`의 `THEORY_TOPICS`에 slug·name 추가 + `public/theory/<slug>/README.md` 생성.

## 커버 스타일 시스템 — 플랫 카툰 v1 (비협상)

### 캔버스·공통 요소
- `viewBox="0 0 480 300"` (16:10), `xmlns` 필수 (img로 로드되는 독립 SVG 파일).
- 배경: cream `#FAFAF7` + 보험수리 격자점 패턴(아래 스켈레톤 그대로).
- 우하단 tkLeen 픽셀 시그니처(스카이 8px 계단 3칸) **항상 고정**.
- 첫 줄에 주석: `<!-- tkLeen 이론 사전 커버 · 플랫 카툰 v1 — <자료명>: <모티프 한 줄> -->`

### 팔레트 (이 5색 외 사용 금지. 캐릭터 보조 파스텔만 예외)
| 색 | HEX | 용도 |
|----|-----|------|
| Ink | `#171A20` | 선·구조·축·눈/입 |
| Sky | `#4A90C2` | 핵심 개념 요소(곡선·우산 등) — 로고 블루, 그림당 1~2곳 |
| Sky Pastel | `#EAF2F9` | 면 보조(곡선 아래 영역 등) |
| Cream | `#FAFAF7` | 배경 |
| White | `#FFFFFF` | 캐릭터 얼굴 기본 |
- 캐릭터 얼굴 보조 파스텔(여러 명 등장 시): `#EEF4FF` `#ECFDF5` `#FFF7ED` `#F5F3FF` (lib/utils CARD_PASTELS 계열)

### 드로잉 규칙
- 선: Ink, `stroke-width` 굵은 구조 3 / 디테일 2~2.5, `stroke-linecap="round"` `stroke-linejoin="round"`.
- 핵심 개념 선(곡선 등): Sky, `stroke-width 5`.
- 그라데이션·그림자·필터 금지. 면은 플랫 단색만.
- 텍스트는 수식 기호 수준만(`l(x)`, `ω`, `E[X]` 등), `font-family="ui-monospace,Consolas,monospace"` size 12, Ink opacity .55. 제목 텍스트 금지(카드가 표시).
- 요소 3~5개로 제한. 모티프 1개 중심, 과밀 금지.

### 캐릭터 스펙 (동글 캐릭터 — 그대로 복사해 변형)
```svg
<g transform="translate(X Y)">
  <circle r="13" fill="#FFFFFF" stroke="#171A20" stroke-width="3"/>
  <circle cx="-4.5" cy="-2" r="1.8" fill="#171A20"/><circle cx="4.5" cy="-2" r="1.8" fill="#171A20"/>
  <path d="M -5 4 Q 0 8.5 5 4" fill="none" stroke="#171A20" stroke-width="2.2" stroke-linecap="round"/>
</g>
```
- 표정 변형: 일자 입 `M -4.5 5 L 4.5 5` / 활짝 `M -5 3 Q 0 9.5 5 3 Z` fill Ink / 감은 눈·웃는 눈은 작은 Q 아크 / 윙크는 한쪽 눈을 짧은 가로선.
- 소품: 지팡이 `M 15 14 L 15 0 Q 15 -6 10 -6` / 땀방울(Sky) `M 17 -11 q 3.5 4.5 0 7 q -3.5 -2.5 0 -7` / 속도선(Ink opacity .3 짧은 선 2개).
- 회전 금지(똑바로). 크기 고정 r=13.

### SVG 스켈레톤 (시작점)
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 300">
  <!-- tkLeen 이론 사전 커버 · 플랫 카툰 v1 — ... -->
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="14" cy="14" r="1.3" fill="#171A20" fill-opacity=".05"/>
    </pattern>
  </defs>
  <rect width="480" height="300" fill="#FAFAF7"/>
  <rect width="480" height="300" fill="url(#dots)"/>
  <!-- (모티프) -->
  <g fill="#4A90C2"><rect x="446" y="272" width="8" height="8"/><rect x="454" y="264" width="8" height="8"/><rect x="462" y="256" width="8" height="8"/></g>
</svg>
```

### 모티프 가이드
- 원칙: **자료의 정의(定義)를 그림 한 장면으로** — 그래프·도구·은유 중 내용에 가장 가까운 것 1개.
- 그래프형(사망법칙·금리·준비금 등): 좌표축(Ink) + 핵심 곡선(Sky 5px) + 곡선 아래 Sky Pastel 면 + 캐릭터 1~3명을 곡선 위에 배치. 축 라벨은 기호만.
- 제도·구조형(단체보험·재보험 등): 핵심 사물 은유(우산=보장, 층=재보험 레이어 등) Sky + 캐릭터 여러 명(보조 파스텔 얼굴).
- 기존 예시(public/theory/life/*.svg 참조):
  | 자료 | 모티프 |
  |------|--------|
  | 곰페르츠_해설서 | 지수적으로 가팔라지는 생존곡선 위의 세 사람(청년 미소→중년 땀→노년 지팡이) |
  | 단체생명보험_해설서 | 하나의 우산(Sky) 아래 파스텔 구성원 4명, 비(Sky 사선)는 우산 밖에만 |
  | 드무아브르_해설서 | 직선 생존함수 + 균등 간격 눈금 + 한계연령 ω 깃발, 미끄러지는 캐릭터 |

## 뷰어·카드 동작 (참고 — 수정 시 함께 점검)
- 카드: 커버(16:10) 상단 + 제목(고딕 600 `--brand-sky`) + "HTML 열람 / PDF ↓" — `app/(public)/theory/[topic]/page.tsx`
- 뷰어: HTML iframe 본문 + **하단 PDF 다운로드 바** — `app/(public)/theory/[topic]/v/[name]/page.tsx`
- 자동 매칭: `lib/theory.ts` `listTheoryItems()` (svg만 있는 항목은 목록 제외)

## 에러 핸들링
| 상황 | 대응 |
|------|------|
| html 없이 pdf만 게시 | 커버는 동일하게 생성(제목·pdf 도입부로 모티프 추정), 뷰어는 PdfViewer 폴백 |
| 파일명에 `%` 포함 | 게시 전 사용자에게 파일명 변경 요청 |
| 모티프 판단 곤란 | 책+해당 기호(예: E[X])를 든 캐릭터 1명의 기본 구도로 생성 후 보고에 명시 |
| 빌드 실패 | 원인 수정 전 커밋 금지 |
