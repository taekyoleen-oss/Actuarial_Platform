# Actuarial Platform — Insurance Insights Board

보험 정보 공개 게시판 (Next.js 15 App Router · TweakCN/shadcn · Supabase · Anthropic Claude API). 설계서: `insurance-insights-board-design-v1.0.md`(v1.1).

## 하네스: Insurance Insights Board

**목표:** 설계서 v1.1 기반으로 게시판(DB/API/UI/요약)을 에이전트 팀으로 빌드.

**트리거:** 게시판 빌드/DB·RLS/API/UI·페이지/요약 구현, 또는 결과 수정·부분 재실행·업데이트 요청 시 `insurance-board-builder` 스킬을 사용하라. 보험이론 사전(/theory) 자료 게시·커버 생성·재생성은 `theory-publisher` 스킬을 사용하라. 단순 질문은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-09 | 초기 구성 (에이전트 5 + 스킬 3 + 오케스트레이터 1) | 전체 | 설계서 §5 하네스 적용, 서브에이전트→에이전트 팀 전환 |
| 2026-06-09 | 앱 빌드(기반/API/UI/요약) + DB/RLS 산출 | app/, lib/, components/, output/ | 설계서 v1.1 구현, build·typecheck 통과 |
| 2026-06-09 | 기존 뉴스 프로젝트 공존 + 브리지 뷰 초안 | .env, output/integration_bridge_view.draft.sql, docs/domain | 동일 Supabase에 additive(ib_ 격리), 향후 합산은 분리+브리지 뷰(B) |
| 2026-06-09 | "보험 뉴스" 섹션(/news) 추가 | app/(public)/news, lib/news.ts, components/feature/News* , SiteNav | ins_news_articles(읽기 공개) 직접 연동. 뉴스 앱 배포 유지, 보드는 읽기. build 통과(13 라우트) |
| 2026-06-11 | tkLeen 아이덴트 애니메이션 (HeroIdent) | components/feature/HeroIdent·HeroSection·SiteNav, globals.css, tailwind | 히어로 우측(PC)+모바일 헤더 마크. 픽셀 맵·타이밍은 tkleen-hero-animation.html 원본 유지 |
| 2026-06-11 | 카드 입체화 + 카드 타이틀 구별 + 홈 개선 | globals.css, tailwind, layout, PostCard·HeroSection·SummaryPanel·PdfViewer·ui/card, 홈, tweakcn-tesla-theme 스킬 | 사용자 결정: 카드 엘리베이션(2단 섀도+lift) 허용, 타이틀 Noto Serif KR 600·navy, 페이지 캔버스 cream·격자점 히어로·섹션 픽셀 액센트 |
| 2026-06-11 | "보험이론 사전" 섹션(/theory) — 폴더 기반 정적 자료실 | app/(public)/theory, lib/theory.ts, public/theory/{life,general}, SiteNav | public/theory/<주제>/에 .html·.pdf 추가→빌드 시 자동 목록화(주제: 생명/손해, 추가는 THEORY_TOPICS 배열). HTML 임베드 열람+PDF 병행, 같은 파일명은 한 항목 |
| 2026-06-11 | 카드 타이틀 고딕 600·로고 블루(--brand-sky)로 변경 | PostCard, 홈, theory 페이지, layout, tailwind, globals, 테마 스킬 | 사용자 결정: 세리프(Noto Serif KR)·네이비 안 철회, 세리프 폰트 로딩 제거 |
| 2026-06-11 | 풀링 아이덴트(PoolIdent) + 아이덴트 시안 폴더 design/idents/ | components/feature/PoolIdent.tsx, app/(public)/theory/[topic], design/idents/ | 이론 사전 헤더 우측(PC) 무질서→질서 루프. 모션 시안 HTML은 design/idents/에서 관리(README에 변환 규칙·매핑) |
| 2026-06-11 | 이론 사전 커버 일러스트(플랫 카툰 SVG) + 뷰어 PDF 하단 다운로드 + theory-publisher 스킬 | lib/theory.ts, theory 목록/뷰어, public/theory/life/*.svg, .claude/skills/theory-publisher | 커버 스타일 A(플랫 카툰) 사용자 확정. 자료명.svg 자동 매칭, 게시+커버 생성은 theory-publisher 스킬로 자동화 |

## 프로젝트 필수사항 (모든 에이전트 공통)

- **DB 공존**: 기존 보험 뉴스 Supabase 프로젝트(`hkrxnkntapcychtbxpmv`)에 `ib_` 프리픽스로 additive 추가. 기존 객체 DROP/ALTER 금지. 합산 운영은 `output/integration_bridge_view.draft.sql`(분리+브리지 뷰) 참조 — 현재는 미연결.
- **시크릿은 서버 전용**: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`는 Route Handler/Server Action에서만 사용. 클라이언트 노출 금지. `.env`는 커밋 금지.
- **테이블 프리픽스** `ib_`. 익명에게 테이블 UPDATE 권한 금지(조회수는 RPC `ib_increment_view`).
- **디자인 비협상**: 그라데이션·세만틱 색상 없음, 강조는 `--primary`(#3E6AE1)만(브랜드 마크·카드 타이틀 한정 `--brand-sky`), 그림자는 카드 엘리베이션(`--shadow-card`/`-hover`)만, 트랜지션 색상 0.33s + 카드 hover lift 한정 예외, 폰트 Pretendard/Inter 400·500 + 카드 타이틀 고딕 600·`--brand-sky`. 페이지 캔버스 `--page-bg`(cream)·카드 화이트. 상세는 `tweakcn-tesla-theme` 스킬.
- **산출물 컨벤션**: 구조화 산출물(스키마·계약·리포트)은 `output/*.sql|json|md`, 중간물은 `_workspace/`. `output/*.sql`은 Supabase SQL Editor에서 실행하거나 자격증명 확보 시 `supabase-sync` 스킬로 적용.
- TypeScript는 `async/await`.
