---
name: tweakcn-tesla-theme
description: "Tesla 미니멀 디자인 토큰을 globals.css CSS 변수와 shadcn/TweakCN 테마 변수로 생성·매핑하는 스킬. 강조색 1개(#3E6AE1)+브랜드 마크 한정 sky/navy, 그림자는 카드 엘리베이션(--shadow-card)만, 색상 트랜지션 0.33s+카드 lift 한정 예외, Pretendard/Inter 400·500+카드 타이틀 Noto Serif KR 600 규칙을 강제한다. 테마 초기화, 색상/토큰 변경, globals.css 작성, shadcn 컴포넌트 커스터마이징, Tesla 톤 적용 시 반드시 사용. 디자인 토큰 수정·보완 요청 시에도 사용."
---

# tweakcn-tesla-theme — Tesla 토큰 → globals.css / shadcn

Insurance Insights Board의 디자인 토큰을 생성하고 shadcn 변수에 매핑한다. "자료가 곧 주인공" — 여백과 타이포만으로 위계를 만든다.

## 비협상 규칙 (Why)

- **그라데이션·세만틱 색상 없음**. 시각적 무게를 장식이 아닌 콘텐츠와 여백이 진다. 강조는 오직 `--primary`(브랜드 마크·액센트 한정 `--brand-sky`/`--brand-navy`).
- **그림자는 카드 엘리베이션만** — `--shadow-card`/`--shadow-card-hover` 2단 소프트 섀도. 버튼·입력 등 컨트롤은 그림자 0. (2026-06-11 입체감 개선, 사용자 결정)
- **트랜지션은 색상(color/background/border)만 0.33s cubic-bezier**. 단, **카드 hover lift**(`-translate-y-1` + box-shadow 전환, 동일 0.33s/이징)는 카드 표면 한정 예외.
- **본문·UI는 weight 400/500만**. 위계는 크기·여백으로 만든다. 단, **카드 타이틀은 Noto Serif KR 600 + `--brand-navy`** — 설명 텍스트와 서체·색으로 구별.
- 폰트: Pretendard(한글/UI) + Inter(라틴 폴백) + Noto Serif KR(카드 타이틀 전용, next/font `--font-serif`). letter-spacing normal, 대문자 변환 없음.
- 페이지 캔버스는 `--page-bg`(#FAFAF7, 브랜드 cream), 카드 표면은 화이트 — 엘리베이션이 읽히는 바탕.

## 토큰 → CSS 변수 (globals.css)

```css
:root {
  --primary: #3E6AE1;
  --background: #FFFFFF;
  --page-bg: #FAFAF7;    /* 페이지 캔버스 (브랜드 cream) — body 배경 */
  --surface-alt: #F4F4F4;
  --foreground: #171A20;
  --text-body: #393C41;
  --text-tertiary: #5C5E62;
  --placeholder: #8E8E8E;
  --border: #EEEEEE;
  --dark-surface: #171A20;
  --brand-sky: #4A90C2;  /* tkLeen 시그니처 (public/brand/*.svg 동일) */
  --brand-navy: #1B2845; /* 카드 타이틀 색 */
  --shadow-card: 0 1px 2px rgba(23,26,32,0.04), 0 6px 20px rgba(23,26,32,0.06);
  --shadow-card-hover: 0 2px 4px rgba(23,26,32,0.05), 0 14px 36px rgba(23,26,32,0.10);
  --radius: 4px;        /* 버튼/입력 */
  --radius-cover: 12px; /* 이미지 커버 카드 */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dur: 0.33s;
}
* { transition: color var(--dur) var(--ease), background-color var(--dur) var(--ease), border-color var(--dur) var(--ease); }
```

카드 lift는 Tailwind 유틸을 카드 표면에만 적용한다:
`shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover`

```css
```

## shadcn 변수 매핑

shadcn은 HSL 토큰을 기대한다. 위 HEX를 shadcn `--primary`, `--background`, `--foreground`, `--muted`(=surface-alt), `--border`, `--input`, `--ring`(=primary)에 매핑한다. `--radius: 0.25rem`(4px). 다크모드는 v1.0 범위 밖(라이트 고정).

## 컴포넌트 커스터마이징 방향

| 컴포넌트 | 규칙 |
|---------|------|
| Button | radius 4px, weight 500, primary `#3E6AE1`/secondary white, **그림자 제거**, 트랜지션 색상만 |
| Card | 화이트 + `--shadow-card` 엘리베이션, hover lift(-4px)+`--shadow-card-hover`. 타이틀은 Noto Serif KR 600·`--brand-navy`. 커버형은 radius 12px + overflow hidden |
| Input/Textarea | 투명 배경, placeholder `#8E8E8E`, 최소 테두리 |
| Tabs/Badge | 모노크롬 (카테고리 필터·라벨) |
| Dialog/Sheet | 오버레이 `rgba(128,128,128,0.65)` |
| Skeleton | 카드/요약 로딩 |

## 생성 스크립트

토큰을 일관되게 주입하려면 `scripts/gen-theme.mjs`를 실행한다(HEX→HSL 변환 + globals.css 블록 출력). 토큰 값이 바뀌면 이 스크립트만 수정해 단일 출처를 유지한다.

## 폰트·전체 토큰 표

폰트 로딩(Pretendard CDN/local), 타이포 스케일(히어로 40/제목 28–32/카드 17/본문 14–16), 전체 토큰 표는 `references/tesla-tokens.md`를 필요 시 Read 한다.
