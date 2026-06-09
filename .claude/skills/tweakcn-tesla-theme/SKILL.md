---
name: tweakcn-tesla-theme
description: "Tesla 미니멀 디자인 토큰을 globals.css CSS 변수와 shadcn/TweakCN 테마 변수로 생성·매핑하는 스킬. 그림자 0, 강조색 1개(#3E6AE1), 색상 트랜지션만 0.33s, Pretendard/Inter 400·500 폰트 규칙을 강제한다. 테마 초기화, 색상/토큰 변경, globals.css 작성, shadcn 컴포넌트 커스터마이징, Tesla 톤 적용 시 반드시 사용. 디자인 토큰 수정·보완 요청 시에도 사용."
---

# tweakcn-tesla-theme — Tesla 토큰 → globals.css / shadcn

Insurance Insights Board의 디자인 토큰을 생성하고 shadcn 변수에 매핑한다. "자료가 곧 주인공" — 여백과 타이포만으로 위계를 만든다.

## 비협상 규칙 (Why)

- **그림자·그라데이션·세만틱 색상 없음**. 시각적 무게를 장식이 아닌 콘텐츠와 여백이 진다. 강조는 오직 `--primary`.
- **트랜지션은 색상(color/background/border)만 0.33s cubic-bezier**. scale/translate는 콘텐츠 중심 톤을 깨므로 금지.
- **weight 400/500만**. 700/300은 Tesla의 절제된 위계를 무너뜨린다. 위계는 크기·여백으로 만든다.
- 폰트: Pretendard(한글/UI) + Inter(라틴 폴백). letter-spacing normal, 대문자 변환 없음.

## 토큰 → CSS 변수 (globals.css)

```css
:root {
  --primary: #3E6AE1;
  --background: #FFFFFF;
  --surface-alt: #F4F4F4;
  --foreground: #171A20;
  --text-body: #393C41;
  --text-tertiary: #5C5E62;
  --placeholder: #8E8E8E;
  --border: #EEEEEE;
  --dark-surface: #171A20;
  --radius: 4px;        /* 버튼/입력 */
  --radius-cover: 12px; /* 이미지 커버 카드 */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dur: 0.33s;
}
* { transition: color var(--dur) var(--ease), background-color var(--dur) var(--ease), border-color var(--dur) var(--ease); }
```

## shadcn 변수 매핑

shadcn은 HSL 토큰을 기대한다. 위 HEX를 shadcn `--primary`, `--background`, `--foreground`, `--muted`(=surface-alt), `--border`, `--input`, `--ring`(=primary)에 매핑한다. `--radius: 0.25rem`(4px). 다크모드는 v1.0 범위 밖(라이트 고정).

## 컴포넌트 커스터마이징 방향

| 컴포넌트 | 규칙 |
|---------|------|
| Button | radius 4px, weight 500, primary `#3E6AE1`/secondary white, **그림자 제거**, 트랜지션 색상만 |
| Card | 그림자·테두리 제거, 클린 화이트. 커버형은 radius 12px + overflow hidden |
| Input/Textarea | 투명 배경, placeholder `#8E8E8E`, 최소 테두리 |
| Tabs/Badge | 모노크롬 (카테고리 필터·라벨) |
| Dialog/Sheet | 오버레이 `rgba(128,128,128,0.65)` |
| Skeleton | 카드/요약 로딩 |

## 생성 스크립트

토큰을 일관되게 주입하려면 `scripts/gen-theme.mjs`를 실행한다(HEX→HSL 변환 + globals.css 블록 출력). 토큰 값이 바뀌면 이 스크립트만 수정해 단일 출처를 유지한다.

## 폰트·전체 토큰 표

폰트 로딩(Pretendard CDN/local), 타이포 스케일(히어로 40/제목 28–32/카드 17/본문 14–16), 전체 토큰 표는 `references/tesla-tokens.md`를 필요 시 Read 한다.
