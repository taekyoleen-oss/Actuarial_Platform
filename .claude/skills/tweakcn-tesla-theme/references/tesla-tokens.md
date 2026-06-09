# Tesla 토큰 전체 표 & 타이포

## 컬러 토큰
| 토큰 | HEX | 역할 |
|------|-----|------|
| --primary | #3E6AE1 | 유일한 강조색·주요 CTA |
| --background | #FFFFFF | 기본 배경 |
| --surface-alt | #F4F4F4 | 섹션 구분 보조 표면 |
| --foreground | #171A20 | 제목·내비 (Carbon Dark) |
| --text-body | #393C41 | 본문 (Graphite) |
| --text-tertiary | #5C5E62 | 보조·메타 (Pewter) |
| --placeholder | #8E8E8E | 입력 placeholder (Silver Fog) |
| --border | #EEEEEE | 구분선 (Cloud Gray) |
| --dark-surface | #171A20 | 다크 오버레이/히어로 텍스트 영역 |

## 타이포그래피 스케일
| 역할 | 크기 | weight | 비고 |
|------|------|--------|------|
| 히어로 타이틀 | 40px | 500 | Display |
| 게시물 제목(상세) | 28–32px | 500 | |
| 카드 제목 | 17px | 500 | |
| 내비/버튼 | 14px | 500 | |
| 본문 | 14–16px | 400 | line-height 1.43 |
| 메타·보조 | 14px | 400 | Pewter |

## 폰트 로딩
- Pretendard: `pretendard` 패키지 또는 CDN. `font-family: Pretendard, Inter, -apple-system, sans-serif;`
- Inter: 라틴 폴백.
- weight 400/500만 임포트. 300/700 임포트 금지.

## HEX → HSL (shadcn용)
shadcn 변수는 `H S% L%` 형식(괄호·hsl() 없이). `scripts/gen-theme.mjs`가 변환을 담당한다. 예: `#3E6AE1` ≈ `222 73% 56%`.

## 반응형 (참고)
| 구간 | 폭 | 카드 그리드 |
|------|----|-----------|
| Mobile | <768 | 1열 |
| Tablet | 768–1024 | 2열 |
| Desktop | 1024–1440 | 3열 |
| Large | >1440 | 3열 + max-width 컨테이너 |
