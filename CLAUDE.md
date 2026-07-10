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
| 2026-06-11 | 이론 사전 카드 단순화(제목↑커버↓) + PDF 노출 제거 | theory 목록/뷰어, lib/theory, README×2, theory-publisher 스킬 | 사용자 결정: 제목·그림 클릭=본문 진입 단일 동선, 보조 링크 없음, pdf는 폴더 보관만(html 필수). 스킬에 비협상으로 반영 |
| 2026-06-11 | "만든이"(/about) 추가 — AI4Insurance 소개 이식 | app/(public)/about, SiteNav | AI4Insurance 프로젝트의 about(소개·신뢰지표·경력·성과·논문 8편·전문분야·철학)만 이식, 메뉴는 관리자 왼쪽. 나머지 섹션은 미이식 |
| 2026-06-11 | 이론 사전 표시 제목 정리 규칙 | lib/theory.ts(displayTitle), README×2, theory-publisher 스킬 | 사용자 결정: '해설서' 단어 제거, `_`→띄어쓰기 (URL·파일명은 유지) |
| 2026-06-11 | 이론 사전 제목 영문 병기 + '보험통계' 주제 추가 | lib/theory.ts(titleFromHtml, THEORY_TOPICS), public/theory/statistics, README×3, theory-publisher 스킬 | 제목은 html <title> "한글명 (영문명)" 자동 추출(폴백: 파일명 규칙). 주제 탭 3개: 생명/손해/보험통계 |
| 2026-06-11 | "모델분석/업무지원앱"(/apps) 추가 — App Collecter 카드 7종 이식 | app/(public)/apps, SiteNav | 모델분석 2종(보험료 자동산출·머신러닝 자동 플로우) + 업무지원 5종(강의 지원·PDF Master·Actuary Pro Calc·보험수리 화이트보드·이미지 수식변환기). 메뉴 8개 → 데스크톱 풀 메뉴 xl부터(미만 햄버거) |
| 2026-06-11 | 모델선택 아이덴트(ModelSelectIdent) — /apps 헤더 하단 | components/feature/ModelSelectIdent.tsx, globals.css, app/(public)/apps, design/idents | tkleen-model-selection-animation.html 이식(노드 등장→펄스 3웨이브→AUC 카운트업→GBM 승자 강조→분포 출력→최적 경로 루프). PC(lg+) 전용 |
| 2026-06-11 | 이론 사전 '재보험' 주제 추가 + 제목 추출 버그 수정 | lib/theory.ts(THEORY_TOPICS, titleFromHtml), public/theory/reinsurance, theory-publisher 스킬 | 주제 탭 4개: 생명/손해/재보험/통계. titleFromHtml은 "— 학습 해설서" 꼬리만 제거(제목 내 대시 보존) |
| 2026-06-11 | 전 자료(41종) '한국보험시장 현황' 섹션 추가 + 스킬 필수 규칙화 | public/theory/**/*.html, theory-publisher 스킬 | 30년차 계리사 페르소나, 이론↔한국 시장 일치/차이 중심. 상품=국내 판매상품, 계리·통계=IFRS17·K-ICS, 재보험=국내 방식·공동재보험. 웹서치 앵커(5세대 실손 2026.5, K-ICS 130%/기본자본 2027, 10회 생명표 등) 스킬에 수록 |
| 2026-06-13 | 디자인 v2(입체화) + 해외 자료 iframe→네이티브 전환 + 일본 FSA 심사사례 지식베이스화 | globals.css·tailwind, app/(public)/global/**, components/feature/{fsa,global}/**, data/japan-fsa·japan-life·japan-life-trends, lib/{japanFsa,global}, 홈·about·apps·theory, 테마 스킬 | 사용자 디자인 리뷰 반영: 벤토 그리드·스탯 카운트업·글래스 필터바·워터마크·칩 8색·헤딩 600/700(디자인 비협상 v2 완화). FSA 135건(15호) cases.html→cases.json 무손실 추출 후 테마 13종·용어집 91·한국KB 26항목·사례별 인리치먼트(tldr/keyPhrase/한국 맥락) 부가 레이어로 파셋 탐색기 구현. 동향2025(42도표·22표)·변천 가이드 네이티브화. 레거시 /global/[slug]는 redirect 보존 |
| 2026-06-14 | /posts 헤더를 카테고리명+서브타이틀로, 카테고리별 "항목(subsection)" 그룹핑 + 국내 '상품 정보' 정적 자료 12종 추가 | app/(public)/posts/page.tsx, app/(public)/domestic/products/[name], lib/{postSections,domesticProducts}, components/feature/ResourceCard, public/domestic/products/*.html | 사용자 결정: H1 '자료실'→선택 메뉴 이름+설명(서브타이틀). 배타권→질병관련/기타(비용등), 국내→보험사 매각정보(매각 2)/상품 정보(실손+신규 12). 항목 분류는 ib_posts 스키마 미변경, lib/postSections.ts 제목 키워드 코드매핑. 신규 12 HTML은 보험이론 패턴(iframe 임베드)로 원본 무수정 표시 |
| 2026-06-14 | /posts 필터: 카테고리 선택 시 카테고리 탭→항목 탭 전환 + 실손 카드 파일 대체 | components/feature/PostFilters.tsx, app/(public)/posts/page.tsx, lib/domesticProducts.ts, public/domestic/products/silson-insurance-generations.html | 사용자 요청: 카테고리는 상단 내비로 이동하므로 카테고리 선택 후엔 중복 카테고리 탭 대신 해당 항목(서브) 탭 노출(`sub` 쿼리 필터). 기존 실손 DB글(id 4b1a2284…)은 is_published=false 처리하고 정적 파일로 대체 |
| 2026-06-14 | /apps 모델분석 섹션 지그재그 배치 + Life Matrix 파이프라인 아이덴트 임베드 | app/(public)/apps/page.tsx, public/idents/tkleen-lifematrix-pipeline-theme.html | 사용자 요청: 보험료카드↔파이프라인 / 파이프라인↔ML카드 지그재그(2×2, md+). 애니메이션 위주(iframe h440)+하단 간단 설명 캡션. 같은 파일 2회 사용(사용자 명시). 임베드 파일의 progress rect width 음수 버그만 Math.max(0,…)로 최소 수정(콘솔 189에러→0) |
| 2026-06-14 | /apps 헤더 아이덴트 교체: ModelSelectIdent → 모듈러 빌드 애니메이션 | app/(public)/apps/page.tsx, public/idents/tkleen-modular-build-animation.html | 사용자 요청: 제목 바로 아래 아이덴트를 tkleen-modular-build-animation.html로 변경. iframe 임베드(흰 카드로 감싸 크림 캔버스에 자연스럽게), PC(lg+) 전용 유지. ModelSelectIdent import/사용 제거(컴포넌트 파일은 보존). 콘솔 에러 0 |
| 2026-06-14 | /apps ML카드 좌측 애니메이션 교체 + 아이덴트 배경 정리 | app/(public)/apps/page.tsx, public/idents/tkleen-ml-training-pipeline.html | 머신러닝 자동분석 카드 왼쪽을 tkleen-ml-training-pipeline.html(데이터 적재→평가)로 교체. PipelineIdentCell에 src/title/heightClass prop화(와이드형은 h-340). ml-training progress rect width 음수 버그 Math.max(0,…) 클램프 |
| 2026-06-14 | /theory·/apps 카드+아이덴트 파란 파스텔 배경 | lib/utils.ts(bluePastelFor), app/(public)/theory/[topic]·apps/page.tsx, public/idents/*.html(3종) | 사용자 요청: 카드마다 파란 계통 파스텔(6음영) 자동배정. 아이덴트는 body background:transparent로 바꿔 감싼 카드의 파란 배경이 비치게(흰 모듈 타일이 대비로 돋보임). 이론 카드·앱 카드·공공DB 카드·헤더/파이프라인 아이덴트 일괄 적용 |
| 2026-06-14 | /apps 아이덴트 3종 페이지 배경(크림) 일치 + 상단 아이덴트 텍스트 제거 | app/(public)/apps/page.tsx, public/idents/tkleen-modular-build-animation.html | 사용자 요청: 아이덴트 카드 테두리·그림자·파란배경 제거→투명(페이지 cream 비침), 그래픽만 페이지에 녹아듦(콘텐츠 카드는 파란 파스텔 유지). 상단 모듈빌드 아이덴트는 .head/.caption/.concept-note/버튼 display:none으로 위·아래 텍스트 제거(그래픽만). 헤더 높이 420 |
| 2026-06-29 | 홈 전용 대형 tkLeen 브랜드 배경 워터마크(BrandBackdrop) + 홈 카드 반투명(글래스)화 | lib/tkleenMark.ts, components/feature/BrandBackdrop.tsx, app/globals.css, app/(public)/page.tsx | 사용자 요청: 메인에서만 카드를 반투명 프로스티드로 바꿔 뒤의 대형 브랜드 마크가 비치게. 마크는 흩어짐↔결집 무한 루프 + 38s 드리프트(fixed -z-10, pointer-events:none). 픽셀맵은 HeroIdent와 공유(lib/tkleenMark). 투명도: 스탯 스트립·최신 자료 34%, 콘텐츠 한눈에 벤토 22%. 다른 페이지는 .home-glass 스코프로 영향 없음(불투명 유지). 위치/크기: width min(510px,49vw)·중심 고정(padding-top=388−높이/2 보정). 작은 HeroIdent는 유지. 디자인 비협상 '워터마크 ≤5%' 규칙은 본 배경에 한해 사용자 승인으로 완화 |
| 2026-07-10 | 홈 워터마크를 회전 지구본(GlobeBackdrop)으로 교체 + tkLeen 마크(BrandBackdrop)는 배타적 사용권 목록으로 이전 | components/feature/GlobeBackdrop.tsx, public/data/land-110m.json, app/globals.css, app/(public)/page.tsx, app/(public)/posts/page.tsx, BrandBackdrop 주석 | 사용자 요청: '지구본 워터마크 데모.html'(standalone JS) 이식 — 보험료 규모 Top10 국가·흐름 아크·대륙 점묘(world-atlas land-110m 로컬 번들). 색상은 토큰 매핑(#5C67F2→--primary, 오렌지→--chip-amber-fg), 구체 그라데이션은 비협상 준수로 플랫 화이트, 폰트 800→700. 뷰포트 중앙 고정 72vmin·불투명도 0.15(데모 기본). /posts?category=exclusive-rights에서만 BrandBackdrop+.home-glass(카드 34%/22% 기존 컨벤션) 적용, 다른 카테고리는 불투명 유지. reduced-motion은 정적 1프레임 |
| 2026-07-10 | 지구본 워터마크 가시성 강화 + 홈 글래스 카드 투명도 상향 (2차) + 중앙 문구 앰버 | app/globals.css, app/(public)/page.tsx, GlobeBackdrop | 사용자 요청 2회: 워터마크 0.15→0.28→0.42, --card-glass-bg 0.34→0.2→0.1, 벤토 0.22→0.12→0.06, 관련링크 0.35→0.2→0.1, hover 0.52→0.4→0.28, blur 7→4→2px. 중앙 '보험료 규모' 문구는 블루와 구분되는 앰버(--chip-amber-fg, α0.85)로 강조. .home-glass 공유라 배타권 목록 카드도 동일 |

## 프로젝트 필수사항 (모든 에이전트 공통)

- **DB 공존**: 기존 보험 뉴스 Supabase 프로젝트(`hkrxnkntapcychtbxpmv`)에 `ib_` 프리픽스로 additive 추가. 기존 객체 DROP/ALTER 금지. 합산 운영은 `output/integration_bridge_view.draft.sql`(분리+브리지 뷰) 참조 — 현재는 미연결.
- **시크릿은 서버 전용**: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`는 Route Handler/Server Action에서만 사용. 클라이언트 노출 금지. `.env`는 커밋 금지.
- **테이블 프리픽스** `ib_`. 익명에게 테이블 UPDATE 권한 금지(조회수는 RPC `ib_increment_view`).
- **디자인 비협상 (v2, 2026-06-13 사용자 승인 완화)**: 단일 주 강조색 `--primary`(#3E6AE1)+`--brand-sky` 유지, **그라데이션 금지**, 크림 캔버스(`--page-bg`)·카드 화이트, 그림자는 카드 엘리베이션(`--shadow-card`/`-hover`)+스티키 한정 `--shadow-float`. 색상 트랜지션 0.33s + 카드 hover lift 예외. **추가 허용**: ① 헤딩 600/700 무게 대비(본문은 400/500, 300 금지), ② 글래스 패널(`.glass-panel`, 스티키 필터바·내비 한정), ③ 데이터 워터마크(`.bg-watermark-curve`, ≤5% 불투명도, 히어로·섹션 헤더 한정), ④ 칩 뮤트 팔레트 8색(`--chip-*`, FSA 테마칩·차트·강조 한정 스코프), ⑤ 카운트업·리빌 마이크로모션(reduced-motion 존중). 상세는 `tweakcn-tesla-theme` 스킬.
- **산출물 컨벤션**: 구조화 산출물(스키마·계약·리포트)은 `output/*.sql|json|md`, 중간물은 `_workspace/`. `output/*.sql`은 Supabase SQL Editor에서 실행하거나 자격증명 확보 시 `supabase-sync` 스킬로 적용.
- TypeScript는 `async/await`.
