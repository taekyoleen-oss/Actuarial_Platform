# /datalab 보험·계리 업그레이드 1단계 — 설계

날짜: 2026-07-17 · 승인: 사용자("workflows로 진행") · 실행: Workflow 멀티에이전트 + 하네스(qa-integrator) 검토

## 범위 (1단계)

1. **분석 방법 사전에 다섯 번째 카테고리 `actuarial`(보험·계리) 신설 — 방법 8종**
2. **모델 적합 탭(FitLab)에 면책(deductible)·한도(limit) 반영 적합** (좌측 절단·우측 검열 우도)
3. **샘플 데이터 3종 추가** (경험데이터·런오프 삼각형·생명표)

2단계(ML 보완: 손실함수·그래프 콤보·PCA 결과투영)와 3단계(분포 추가·재보험 몬테카를로 확장)는 별도 사이클.

## 결정 사항

- **사분면 배치**: 데이터 핸들링(wrangle)은 이미 셀 콤보박스로 이동했으므로 사분면에서 wrangle 자리를 `actuarial`로 교체. wrangle 용어는 사분면 아래 **컴팩트 칩 스트립**('데이터 핸들링')으로 유지(팝업 동작 보존). 모바일 클러스터 클라우드는 5개 카테고리 모두 표시.
- **새 방법 8종은 별도 파일** `lib/actuarialMethods.ts` (statMethods.ts 2,400줄 비대화 방지). `import type`으로 타입만 가져와 런타임 순환 없음. statMethods.ts는 카테고리 추가 + 배열 스프레드만.
- **모든 코드는 Pyodide 실행 가능해야 함**: numpy·scipy·pandas·sklearn·statsmodels만. lifelines·chainladder 등 외부 패키지 대신 **numpy 직접 구현**(KM·Nelson-Aalen·Whittaker-Henderson·Bühlmann·chain-ladder·Mack·계산기수). 각 섹션은 인라인 합성 데이터(고정 시드)로 자체 완결 실행.
- **검증**: 생성된 모든 파이썬 섹션을 로컬 python(MPLBACKEND=Agg)으로 실제 실행해 통과시킨 후 통합.

## 방법 8종 사양

| id | 이름 | 핵심 내용 | 난이도/빈도 |
|----|------|----------|------------|
| exposure-rates | 위험률 산출 | 노출(중앙/초기) 계산, 조발생률, 포아송 정확 신뢰구간, A/E 분석 | 2/4 |
| graduation | 위험률 보정 | Whittaker-Henderson(행렬 직접 구현), 이동평균, 스플라인, 전후 비교 | 4/2 |
| kaplan-meier | 생존분석(웹 실행) | KM·Nelson-Aalen numpy 직접 구현, Greenwood CI, log-rank. 기존 survival(lifelines·웹 미지원)의 웹 실행판 | 3/3 |
| credibility | 신뢰도 이론 | 제한변동(완전/부분 신뢰도), Bühlmann, Bühlmann-Straub | 4/3 |
| chain-ladder | 지급준비금 | 런오프 삼각형, 개발계수, chain-ladder·BF, Mack 표준오차 | 4/4 |
| pure-premium | 순보험료·요율산정 | 빈도×심도 vs Tweedie 직접 비교, LEV(면책·한도 반영 순보험료), 상대도·오프밸런스 | 3/4 |
| life-premium | 보험료 산출 기초 | 생명표→lx·dx, 계산기수 Dx·Nx·Cx·Mx, 정기/종신/연금 순보험료, 영업보험료 | 3/3 |
| reinsurance | 재보험 분석 | XL 레이어·비례 분출, 몬테카를로 순보유 분포 VaR/TVaR | 4/2 |

## FitLab 면책·한도 적합 수리 사양

- 대상: 개별 값(1열)·연도+값(2열)의 **심도** 데이터. 그룹(3열)은 미지원(사유 표시).
- 관측 규약: 값은 원손해액. d 미만은 관측 불가(**좌측 절단**), u 이상은 u로 기록(**우측 검열**).
- 우도: 비검열(d<x<u): `f(x)/S(d)` · 검열(x≥u): `S(u)/S(d)`, `S=1−F`. d 미입력=0, u 미입력=∞.
- 통계량: logL·AIC·BIC. KS는 조건부 CDF `F*(x)=(F(x)−F(d))/(1−F(d))`로 비검열 관측만. A²·χ²는 '—'.
- QQ: 조건부 분위수, 검열점 제외 표기. 재현 코드 팝업·몬테카를로(원손해→d·u 적용 지급액)도 동일 규약.

## 샘플 데이터 계약 (public/datalab/samples/)

- `experience.xlsx`: policy_id, product, sex(M/F), entry_age, duration_years, event(1=사망·0=중도해지/관찰종료), ~800행
- `triangle.xlsx`: accident_year(2016–2023) × dev(1–8) **누적** 지급보험금, 우하단 미관측
- `mortality_table.xlsx`: age(0–100), qx_male, qx_female (Gompertz-Makeham 근사, 단조)
- 생성: scripts/gen-datalab-samples.mjs 확장(결정적 시드). PyRunner 호스팅 샘플 목록에 등록. 방법 8종 코드는 이 파일들에 **의존하지 않음**(인라인 데이터 자체 완결, 파일 활용은 주석 안내만).

## 추가 요청 2건 (2026-07-17, 사용자)

### A. 상단 메뉴(SiteNav) 항목 구분 — 모던 스타일
메뉴 9개가 나열만 되어 구분이 안 됨 → 항목별 hover 필(연블루 틴트)·현재 경로 활성 표시(usePathname, primary 저채도 필 또는 언더라인). **제약**: lg(1024px) 한 줄 유지 필수(패딩 추가는 gap 축소로 상쇄, 글자 크기 유지), 디자인 비협상 v2(그라데이션 금지·토큰 사용·트랜지션 0.33s·reduced-motion 존중).

### B. 분석 방법 사전 팝업 2탭화 — [정의 및 방법 | 코드 적용]
- **탭1 "정의 및 방법"**: 통계적 정의·가정 → 산출식(KaTeX, 기존 Tex 컴포넌트) → 활용 방법(보험 실무) → 결과 해석·의미. 초보자 친화 톤.
- **탭2 "코드 적용"**: 현재 팝업 본문 그대로(params·코드 섹션·실행기 연동).
- **점진 확대 설계**: 이론 콘텐츠는 별도 레지스트리 `lib/methodTheory.ts`의 `METHOD_THEORY: Record<string, MethodTheory>` — statMethods.ts 수정 없이 id 키만 추가하면 확대됨. 이론이 없는 항목은 탭1에 기존 intro+tips 폴백.
- `MethodTheory = { definition, formulas: {label, tex, note?}[], usage, interpretation }` (tex는 TS 문자열 — 백슬래시 이중 이스케이프).
- 1차 수록: 기존 34종 전부(wrangle 10종은 산출식 없이 개념·사용 중심의 경량) + 신규 계리 8종(작성 에이전트가 함께 산출).

### C. 코드 섹션 기본/고급 수준 구분 (2026-07-17 사용자 요청)

문제 제기(사용자): K-평균 코드가 엘보·실루엣으로 **K 최적화부터** 시작한다. 최적화도 중요하지만 **기초 분석은 특정 K를 지정해 모델을 돌려보는 것이 먼저**여야 한다. 이를 다른 분석 코드에도 반영해 전체 최적화와 함께 **정해진 하이퍼파라미터·변수를 지정해 결과를 산출하는 방법**도 넣고, 방법마다 **기본 수준과 고급 수준을 같이 표시**한다.

- `MethodSection`에 `level?: "basic" | "advanced"` 추가(미지정=기본으로 취급).
- **기본(basic)**: 하이퍼파라미터·변수를 명시적으로 지정해 탐색 없이 바로 결과 산출 — 초보자의 첫 실행 경로. 예: K-평균 `KMeans(n_clusters=3, n_init=10, random_state=42)` → 군집 크기·중심·프로파일 해석 + PCA 2D 산점도.
- **고급(advanced)**: 최적화·튜닝(엘보·실루엣·GridSearch), 교차검증, 진단, 규제 경로, 시뮬레이션.
- 섹션 **순서: 기본 → 고급**(코드 내용 보존, 순서만 재배열). 기본 섹션이 없는 방법은 신설.
- 팝업 [코드 적용] 탭: 섹션 헤더에 기본/고급 칩 + 상단 [전체 | 기본 | 고급] 필터.
- wrangle 10종은 전부 기본(고급 없음). 계리 8종도 동일 규칙 적용(예: chain-ladder CL=기본, BF·Mack=고급).

## 2단계 (2026-07-18 사용자 승인) — 손실함수·그래프 콤보박스·PCA 결과투영

원 제안서의 A1·A3·A4. Workflow 구현 후 하네스 검토.

### A1. 손실함수 사전 항목 (신규 방법 1종, `model` 카테고리)
- id `loss-functions`, 이름 "손실함수·비용민감 학습", weight 3·difficulty 3. 별도 `_workspace/phase2/loss.entry.ts`로 작성 후 statMethods.ts에 통합(pca-projection과 파일 충돌 회피).
- 섹션: [basic] MSE·MAE·RMSE 계산과 의미(이상치 1개가 MSE를 키우는 시연) / [advanced] Huber·분위수(pinball)→QuantileRegressor 90% 분위수(=VaR 개념) / [advanced] 포아송·감마·Tweedie deviance→순보험료 부스팅(HistGradientBoostingRegressor loss="poisson", d2_tweedie_score) / [advanced] 분류 log loss vs hinge + 비대칭 비용 임계값 최적화(언더라이팅).
- 이론(methodTheory 키 추가): 정의(손실=예측오차를 한 수로, 모델이 최소화하는 대상) / 산출식(MSE·MAE·Huber·pinball·deviance·log loss·hinge) / 활용 / 해석.

### A3. 그래프 셀 콤보박스 (신규 `lib/plotSnippets.ts` + PyRunner)
- `데이터 핸들링 ▾` 콤보박스와 동일 패턴: `PLOT_SNIPPET_GROUPS`(id/label/desc/code) + `plotInsertCode()`, PyRunner 셀에 `그래프 ▾` `<select>` 하나 추가(wrangle 콤보 바로 옆).
- 그룹: **탐색**(히스토그램+KDE·box/violin 집단비교·산점도+회귀선·상관 히트맵·산점도 행렬) / **모델 진단**(잔차 플롯·학습곡선 learning_curve·검증곡선·ROC·PR·캘리브레이션·리프트/게인) / **해석**(변수 중요도·순열 중요도·PDP·ICE).
- 모델 진단·해석 스니펫은 자체 완결(인라인으로 빠른 모델 적합, "이미 model·X_te가 있으면 그 줄만 지우세요" 주석). 전 스니펫 로컬 실행 검증(matplotlib Agg). matplotlib·sklearn 내장만(SHAP 제외).

### A4. PCA 2차원 결과 투영 확산 (기존 statMethods.ts 항목에 [advanced] 섹션 추가)
- kmeans·pca는 이미 2D 산점도 보유 → **추가 안 함**.
- hierarchical: "군집 라벨을 PCA 2차원에 투영"(산점도+중심).
- decision-tree·svm·knn: "PCA 2축 결정경계 시각화"(2 PCA 성분에 적합 후 DecisionBoundaryDisplay — 직관용 2D 투영 모델임을 명시).
- pca: "t-SNE — 비선형 2차원 임베딩 대안"(sklearn TSNE, 웹 실행 가능).
- 전부 [advanced] level, 기본→고급 순서 유지. 로컬 실행 검증.

### 파일 충돌 설계
- 콘텐츠(병렬, 서로소 파일): loss-author(_workspace) · plot-snippets(lib/plotSnippets.ts + PyRunner.tsx) · pca-projection(lib/statMethods.ts 기존 항목). 동시 tsc는 읽기 전용이라 안전(권위 검증은 빌드 단계).
- 통합(순차): integrate-loss가 statMethods.ts에 loss 항목 추가 + methodTheory.ts 키 추가(pca-projection 완료 후).
- MethodCloud.tsx **무변경**(신규 항목·섹션은 기존 렌더·필터가 자동 처리, 사분면 겹침만 리뷰).

## 검증·리뷰 계획

1. 파이썬 전 섹션 로컬 실행(에이전트별) → 2. `tsc --noEmit`·`next build` 통과까지 수정 → 3. 3렌즈 적대 리뷰(계리·통계 정확성 / Pyodide 호환 / 프로젝트 컨벤션·디자인 비협상) 후 수정 → 4. 하네스 qa-integrator 경계면 검토 → 5. 커밋·푸시·드래프트 PR.
