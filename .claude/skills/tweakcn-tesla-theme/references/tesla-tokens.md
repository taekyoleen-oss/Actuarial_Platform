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
| --page-bg | #FAFAF7 | 페이지 캔버스 (브랜드 cream, body 배경) |
| --brand-sky | #4A90C2 | tkLeen 시그니처 (브랜드 마크·픽셀 액센트) |
| --brand-navy | #1B2845 | 카드 타이틀 색 |

## 엘리베이션 토큰 (카드 한정)
| 토큰 | 값 | 역할 |
|------|-----|------|
| --shadow-card | 0 1px 2px rgba(23,26,32,.04), 0 6px 20px rgba(23,26,32,.06) | 카드 기본 입체감 |
| --shadow-card-hover | 0 2px 4px rgba(23,26,32,.05), 0 14px 36px rgba(23,26,32,.10) | hover lift(-4px)와 함께 |

## 타이포그래피 스케일
| 역할 | 크기 | weight | 비고 |
|------|------|--------|------|
| 히어로 타이틀 | 40px | 500 | Display |
| 게시물 제목(상세) | 28–32px | 500 | |
| 카드 제목 | 17–18px | 600 | Noto Serif KR · --brand-navy (설명과 구별) |
| 내비/버튼 | 14px | 500 | |
| 본문 | 14–16px | 400 | line-height 1.43 |
| 메타·보조 | 14px | 400 | Pewter |

## 폰트 로딩
- Pretendard: `pretendard` 패키지 또는 CDN. `font-family: Pretendard, Inter, -apple-system, sans-serif;`
- Inter: 라틴 폴백.
- weight 400/500만 임포트. 300/700 임포트 금지.
- Noto Serif KR: next/font/google, weight 600만, `variable: "--font-serif"`, 카드 타이틀 전용 (`font-serif` 유틸).

## HEX → HSL (shadcn용)
shadcn 변수는 `H S% L%` 형식(괄호·hsl() 없이). `scripts/gen-theme.mjs`가 변환을 담당한다. 예: `#3E6AE1` ≈ `222 73% 56%`.

## 반응형 (참고)
| 구간 | 폭 | 카드 그리드 |
|------|----|-----------|
| Mobile | <768 | 1열 |
| Tablet | 768–1024 | 2열 |
| Desktop | 1024–1440 | 3열 |
| Large | >1440 | 3열 + max-width 컨테이너 |
