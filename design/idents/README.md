# tkLeen 아이덴트 모션 시안 보관소

브랜드 애니메이션의 **원본 HTML 시안**을 이 폴더에서 관리한다.
새 모션 시안이 생기면 여기에 추가하고, 앱에는 React 클라이언트 컴포넌트로 이식한다.

## 변환 규칙

1. 픽셀 맵·타이밍·이징은 시안 원본 그대로 유지한다.
2. 색상만 브랜드 토큰으로 매핑한다: Ink → `--foreground`, Sky → `--brand-sky`, Cream → `--page-bg`, Navy → `--brand-navy`.
3. `prefers-reduced-motion` 사용자는 정지 상태(수렴 완료 화면)로 표시한다.
4. 언마운트 시 타이머·rAF를 반드시 정리한다.
5. 시안 문서의 사용 규칙(허용/금지)을 컴포넌트 주석에 옮겨 적는다.

## 시안 ↔ 컴포넌트 매핑

| 시안 | 컴포넌트 | 사용처 |
|------|----------|--------|
| `tkleen-hero-animation.html` (Risk Pooling Ident — TK 픽셀 리거처) | `components/feature/HeroIdent.tsx` | 홈 히어로 우측(PC), 모바일 헤더 마크 |
| `tkleen-theory-dictionary-animation.html` (무질서→질서 풀링 모션) | `components/feature/PoolIdent.tsx` | 보험이론 사전 페이지 헤더 우측(PC), 상시 루프 |
