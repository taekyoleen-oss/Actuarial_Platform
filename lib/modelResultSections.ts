/**
 * 모델 결과를 '표·수식'으로 산출하는 공통 섹션 생성기 (사용자 요청 2026-07-30).
 *
 * 문제: statsmodels `summary()`·`print(...)`는 Python in Excel(=PY())에서 셀에 제대로
 * 표시되지 않는다(진단 창으로 가거나 객체 한 덩어리로 반환). 브라우저 실행기에서도
 * 계수·통계량을 골라 쓰기 어렵다.
 *
 * 해결: 방법(id)마다 아래를 `# %%` 셀로 나눈 한 섹션을 자동 생성해 파이썬·엑셀 두 탭에 함께 붙인다.
 *   ① 데이터 로드 + **열 자동 선택**(목표변수만 정하면 설명변수·범주형을 자동 분류)
 *   ② 적합 — 파이썬은 `summary()`를 그대로 출력(요약 유지), 엑셀은 식 문자열 반환
 *   ③ 계수·통계량 표(계수·표준오차·t/z·p값·95% CI) → 셀에 표로 스필
 *   ④ 적합도·검정통계량 표(R²·F·AIC·RMSE·AUC 등) → 별도 셀
 *   ⑤ (해당 모형만) 추정된 **수식** 문자열 — y = b0 + b1·x1 + …
 *
 * 셀이 나뉘어 있으므로 사용자가 필요한 것만 선택 실행할 수 있다.
 * 코드는 numpy·pandas·scipy·statsmodels·scikit-learn만 사용 → 브라우저(Pyodide)·엑셀 공통 실행.
 */

import type { MethodCodeSection } from "./statMethods";
import type { ExcelCodeSection } from "./methodExcelCode";

type Env = "py" | "xl";

type ResultKind =
  | "ols"
  | "logit"
  | "glm"
  | "sk-reg"
  | "sk-clf"
  | "cluster"
  | "pca"
  | "cv"
  | "outlier"
  | "km"
  | "arima"
  | "test";

interface ResultSpec {
  kind: ResultKind;
  /** 브라우저 실행기 샘플 파일 — public/datalab/samples/ */
  file: string;
  /** 엑셀 xl() 참조 예시 */
  table: string;
  /** 목표변수 기본값(없으면 마지막 수치형 열을 자동 선택) */
  target?: string;
  /** 설명변수에서 뺄 열(식별자 등) */
  drop?: string[];
  /** sklearn 추정기 dict 본문 — 여러 모델을 한 표에서 비교 */
  models?: string;
  /** 추정기 import 줄 */
  imports?: string[];
  /** 군집·이상탐지 등 단일 추정기 */
  est?: string;
}

const ID_DROP = ["policy_id", "customer_id"];
// 샘플의 premium_ratio = premium / income — 목표가 premium일 때는 목표에서 파생된 누출 열이라 제외
const PREM_DROP = [...ID_DROP, "premium_ratio"];

/** 방법 id → 결과 표 사양. 여기에 한 줄 추가하면 파이썬·엑셀 두 탭에 섹션이 함께 생긴다. */
export const MODEL_RESULT_SPECS: Record<string, ResultSpec> = {
  /* ── 회귀·통계모형 ── */
  // 전통 회귀 2종(stepwise-*)은 자체 섹션에 열 자동 선택·계수 표·비교 표가 이미 있어 제외
  "linear-regression": { kind: "ols", file: "policy.xlsx", table: "policy[#All]", target: "premium", drop: PREM_DROP },
  "logistic-regression": { kind: "logit", file: "policy.xlsx", table: "policy[#All]", target: "lapsed", drop: ID_DROP },
  glm: { kind: "glm", file: "claims.xlsx", table: "claims[#All]", target: "claim_cnt", drop: ID_DROP },
  regularized: {
    kind: "sk-reg",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "premium",
    drop: PREM_DROP,
    imports: ["from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet"],
    models: `"최소제곱": LinearRegression(),
    "Ridge(alpha=1)": Ridge(alpha=1.0),
    "Lasso(alpha=0.1)": Lasso(alpha=0.1, max_iter=10000),
    "ElasticNet(0.5)": ElasticNet(alpha=0.1, l1_ratio=0.5, max_iter=10000),`,
  },
  "loss-functions": {
    kind: "sk-reg",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "premium",
    drop: PREM_DROP,
    imports: [
      "from sklearn.linear_model import LinearRegression, HuberRegressor, QuantileRegressor",
    ],
    models: `"제곱손실(MSE)": LinearRegression(),
    "Huber(이상치 완화)": HuberRegressor(epsilon=1.35, max_iter=500),
    "분위수 0.9(VaR 개념)": QuantileRegressor(quantile=0.9, alpha=0.0, solver="highs"),`,
  },
  "time-series": { kind: "arima", file: "policy.xlsx", table: "series[#All]" },
  survival: { kind: "km", file: "experience.xlsx", table: "experience[#All]", target: "duration_years" },

  /* ── 머신러닝 ── */
  "decision-tree": {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: ["from sklearn.tree import DecisionTreeClassifier"],
    models: `"의사결정나무(depth=4)": DecisionTreeClassifier(max_depth=4, random_state=42),
    "의사결정나무(depth=None)": DecisionTreeClassifier(random_state=42),`,
  },
  "random-forest": {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: ["from sklearn.ensemble import RandomForestClassifier"],
    models: `"랜덤포레스트(300)": RandomForestClassifier(n_estimators=300, random_state=42),
    "랜덤포레스트(균형가중)": RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=42),`,
  },
  "gradient-boosting": {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: ["from sklearn.ensemble import HistGradientBoostingClassifier"],
    models: `"HistGB(기본)": HistGradientBoostingClassifier(random_state=42),
    "HistGB(lr=0.05)": HistGradientBoostingClassifier(learning_rate=0.05, max_iter=200, random_state=42),`,
  },
  svm: {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: [
      "from sklearn.svm import SVC",
      "from sklearn.pipeline import make_pipeline",
      "from sklearn.preprocessing import StandardScaler",
    ],
    models: `"SVM(rbf)": make_pipeline(StandardScaler(), SVC(kernel="rbf", probability=True, random_state=42)),
    "SVM(linear)": make_pipeline(StandardScaler(), SVC(kernel="linear", probability=True, random_state=42)),`,
  },
  knn: {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: [
      "from sklearn.neighbors import KNeighborsClassifier",
      "from sklearn.pipeline import make_pipeline",
      "from sklearn.preprocessing import StandardScaler",
    ],
    models: `"KNN(k=5)": make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=5)),
    "KNN(k=25)": make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=25)),`,
  },
  "naive-bayes": {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: ["from sklearn.naive_bayes import GaussianNB"],
    models: `"가우시안 NB": GaussianNB(),`,
  },
  "model-eval": {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: [
      "from sklearn.linear_model import LogisticRegression",
      "from sklearn.ensemble import RandomForestClassifier",
      "from sklearn.pipeline import make_pipeline",
      "from sklearn.preprocessing import StandardScaler",
    ],
    models: `"로지스틱": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
    "랜덤포레스트": RandomForestClassifier(n_estimators=300, random_state=42),`,
  },
  imbalanced: {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: [
      "from sklearn.linear_model import LogisticRegression",
      "from sklearn.pipeline import make_pipeline",
      "from sklearn.preprocessing import StandardScaler",
    ],
    models: `"가중 없음": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)),
    "class_weight=balanced": make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000, class_weight="balanced")),`,
  },
  calibration: {
    kind: "sk-clf",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: [
      "from sklearn.ensemble import RandomForestClassifier",
      "from sklearn.calibration import CalibratedClassifierCV",
    ],
    models: `"원본(미보정)": RandomForestClassifier(n_estimators=200, random_state=42),
    "isotonic 보정": CalibratedClassifierCV(RandomForestClassifier(n_estimators=200, random_state=42), method="isotonic", cv=3),
    "sigmoid 보정": CalibratedClassifierCV(RandomForestClassifier(n_estimators=200, random_state=42), method="sigmoid", cv=3),`,
  },
  kmeans: {
    kind: "cluster",
    file: "policy.xlsx",
    table: "policy[#All]",
    drop: ID_DROP,
    imports: ["from sklearn.cluster import KMeans"],
    est: `KMeans(n_clusters=3, n_init=10, random_state=42)`,
  },
  hierarchical: {
    kind: "cluster",
    file: "policy.xlsx",
    table: "policy[#All]",
    drop: ID_DROP,
    imports: ["from sklearn.cluster import AgglomerativeClustering"],
    est: `AgglomerativeClustering(n_clusters=3, linkage="ward")`,
  },
  pca: { kind: "pca", file: "policy.xlsx", table: "policy[#All]", drop: ID_DROP },
  "cross-validation": {
    kind: "cv",
    file: "policy.xlsx",
    table: "policy[#All]",
    target: "lapsed",
    drop: ID_DROP,
    imports: [
      "from sklearn.linear_model import LogisticRegression",
      "from sklearn.pipeline import make_pipeline",
      "from sklearn.preprocessing import StandardScaler",
    ],
    est: `make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))`,
  },
  anomaly: {
    kind: "outlier",
    file: "claims.xlsx",
    table: "claims[#All]",
    drop: ID_DROP,
    imports: ["from sklearn.ensemble import IsolationForest"],
    est: `IsolationForest(contamination=0.02, random_state=42)`,
  },

  /* ── 기초 통계(검정) ── */
  "t-test": { kind: "test", file: "claims.xlsx", table: "claims[#All]", target: "claim_amt", drop: ID_DROP },
  anova: { kind: "test", file: "claims.xlsx", table: "claims[#All]", target: "claim_amt", drop: ID_DROP },
  "chi-square": { kind: "test", file: "claims.xlsx", table: "claims[#All]", target: "claim_amt", drop: ID_DROP },
  correlation: { kind: "test", file: "policy.xlsx", table: "policy[#All]", target: "premium", drop: ID_DROP },
  normality: { kind: "test", file: "claims.xlsx", table: "claims[#All]", target: "claim_amt", drop: ID_DROP },
  nonparametric: { kind: "test", file: "claims.xlsx", table: "claims[#All]", target: "claim_amt", drop: ID_DROP },
};

/* ────────────────────────── 공통 코드 조각 ────────────────────────── */

const loadLine = (s: ResultSpec, env: Env) =>
  env === "py"
    ? `df = pd.read_excel("${s.file}")   # 실행기: '샘플 데이터' 또는 내 파일 업로드(파일명만 바꾸면 됩니다)`
    : `df = xl("${s.table}", headers=True)   # 시트의 표/범위를 참조(파일 경로 로드는 불가)`;

/**
 * ① 데이터 로드 + 열 자동 선택 셀 — 모든 kind 공통.
 * 목표변수(TARGET) 하나만 정하면 수치형·범주형 설명변수를 자동으로 분류하고 '열 역할 표'를 반환한다.
 */
function autoSelectCell(s: ResultSpec, env: Env, opts?: { noTarget?: boolean }): string {
  const dropList = (s.drop ?? []).map((c) => `"${c}"`).join(", ");
  const targetLine = opts?.noTarget
    ? `TARGET = None                            # 목표변수 없음(비지도) — 수치형 전체를 설명변수로`
    : `TARGET = "${s.target ?? ""}"${" ".repeat(Math.max(1, 22 - (s.target ?? "").length))}# ← 목표변수(y). 실제 데이터의 열 이름으로 바꾸세요`;
  return `# %%
# ① 데이터 로드 · 열 자동 선택 — 목표변수만 정하면 설명변수는 자동으로 골라 줍니다
import pandas as pd
import numpy as np

${loadLine(s, env)}

${targetLine}
DROP = [${dropList}]${dropList ? "" : "                              "}  # 식별자처럼 모형에서 뺄 열
MAX_LEVELS = 10                          # 범주형은 고유값이 이 수 이하일 때만 설명변수로 사용

num_all = [c for c in df.select_dtypes("number").columns if c not in DROP]
cat_all = [c for c in df.select_dtypes(["object", "category", "bool"]).columns if c not in DROP]
if TARGET is not None and TARGET not in df.columns:
    TARGET = num_all[-1]                 # 지정이 없거나 틀렸으면 마지막 수치형 열을 y로
NUMX = [c for c in num_all if c != TARGET]                                   # 수치형 설명변수
CATX = [c for c in cat_all if c != TARGET and 2 <= df[c].nunique() <= MAX_LEVELS]  # 범주형 설명변수

def role(c):
    if c == TARGET: return "목표(y)"
    if c in NUMX: return "설명(수치)"
    if c in CATX: return "설명(범주)"
    return "제외"

roles = pd.DataFrame({
    "열": df.columns,
    "자료형": df.dtypes.astype(str).values,
    "결측": df.isna().sum().values,
    "고유값": df.nunique().values,
    "역할": [role(c) for c in df.columns],
})
roles   # 셀에 '열 역할 표'가 표시됩니다 — 표를 보고 TARGET·DROP·MAX_LEVELS를 조정하세요`;
}

/**
 * (연결) 가드 — 앞 셀 변수가 없어도 이 셀만 단독 실행되도록 즉석 재구성한다(사용자 요청 2026-07-30).
 * 모형을 만드는 '본체' 코드는 셀에 그대로 두고, 부수적인 준비(데이터·열 선택·적합)만 가드로 감싼다.
 */
export function guard(probe: string, body: string, errs = "NameError"): string {
  const ind = body
    .trim()
    .split("\n")
    .map((l) => (l.trim() ? `    ${l}` : ""))
    .join("\n");
  const clause = errs.includes(",") ? `(${errs})` : errs;
  return `# (연결) 이 셀만 단독 실행해도 되도록 — 앞 셀 변수가 없으면 여기서 즉석 재구성합니다
try:
    ${probe}
except ${clause}:
${ind}
`;
}

/** 데이터 로드 + 열 자동 선택의 압축판 — 가드 본문용('열 역할 표'는 생략) */
function dataPrepBody(s: ResultSpec, env: Env, noTarget = false): string {
  const dropList = (s.drop ?? []).map((c) => `"${c}"`).join(", ");
  return `import pandas as pd
import numpy as np
${loadLine(s, env).replace(/ {2,}#.*$/, "")}
TARGET = ${noTarget ? "None" : `"${s.target ?? ""}"`}
DROP = [${dropList}]
num_all = [c for c in df.select_dtypes("number").columns if c not in DROP]
cat_all = [c for c in df.select_dtypes(["object", "category", "bool"]).columns if c not in DROP]
if TARGET is not None and TARGET not in df.columns:
    TARGET = num_all[-1]
NUMX = [c for c in num_all if c != TARGET]
CATX = [c for c in cat_all if c != TARGET and 2 <= df[c].nunique() <= 10]`;
}

/** 계수 → 사람이 읽는 수식 문자열(공통 헬퍼 정의 줄) */
const EQ_HELPER = `def eq_text(names, coefs, intercept, lhs, digits=4):
    """계수를 수식 문자열로 — lhs = b0 + b1·x1 + b2·x2 …"""
    out = f"{intercept:,.{digits}f}"
    for n, v in zip(names, coefs):
        out += f" {'+' if v >= 0 else '-'} {abs(v):,.{digits}f}·{n}"
    return f"{lhs} = " + out`;

/** ②의 마지막 줄 — 파이썬은 summary()를 그대로 출력, 엑셀은 식 문자열을 셀에 반환 */
const summaryTail = (env: Env) =>
  env === "py"
    ? `print("사용된 식:", FORMULA)
print(model.summary())   # 파이썬: 요약표를 그대로 확인(엑셀에서는 아래 표 셀로 나눠 봅니다)`
    : `# summary()는 =PY() 셀에 제대로 표시되지 않으므로 아래 ③·④ 셀의 '표'로 나눠 봅니다
FORMULA   # 셀에는 사용된 식 문자열이 표시됩니다`;

/** 유의성 별표 열 — 계수 표 공통 */
const STAR = `tbl["유의성"] = np.where(tbl["p값"] < 0.001, "***",
                np.where(tbl["p값"] < 0.01, "**",
                np.where(tbl["p값"] < 0.05, "*", "")))`;

/* ────────────────────────── kind별 코드 ────────────────────────── */

const OLS_FIT = `import statsmodels.formula.api as smf
FORMULA = f"{TARGET} ~ " + " + ".join(NUMX + [f"C({c})" for c in CATX])
model = smf.ols(FORMULA, data=df).fit()`;

function olsCode(s: ResultSpec, env: Env): string {
  // ③ 이후 셀은 model(OLS 적합)이 필요 — 없으면 데이터·열 선택·적합까지 가드에서 재구성
  const g = guard(
    "model.rsquared",
    `${dataPrepBody(s, env)}\n${OLS_FIT}`,
    "NameError, AttributeError"
  );
  return `${autoSelectCell(s, env)}

# %%
# ② 회귀식 자동 구성 · 적합 — 범주형은 C()로 감싸 자동 처리
${guard("NUMX, CATX", dataPrepBody(s, env))}
import statsmodels.formula.api as smf

FORMULA = f"{TARGET} ~ " + " + ".join(NUMX + [f"C({c})" for c in CATX])
model = smf.ols(FORMULA, data=df).fit()
${summaryTail(env)}

# %%
# ③ 계수 표 — 변수·계수·표준오차·t값·p값·95% 신뢰구간(셀에 표로 반환)
${g}
ci = model.conf_int()
tbl = pd.DataFrame({
    "변수": model.params.index,
    "계수": model.params.values,
    "표준오차": model.bse.values,
    "t값": model.tvalues.values,
    "p값": model.pvalues.values,
    "하한95%": ci[0].values,
    "상한95%": ci[1].values,
})
${STAR}
tbl.round(4)   # p값 < 0.05(*)면 해당 변수의 효과가 통계적으로 유의

# %%
# ④ 적합도·검정통계량 표 — R²·F검정·AIC·RMSE를 한 표로(셀에 표로 반환)
${g}
resid = model.resid
mape = (resid.abs() / df[TARGET].replace(0, np.nan)).mean() * 100
fit_stats = pd.DataFrame({
    "항목": ["관측치 수 (n)", "독립변수 수 (k)", "잔차 자유도", "R-squared", "Adj. R-squared",
             "F-통계량", "F p값", "잔차 표준오차", "로그우도", "AIC", "BIC",
             "RMSE", "MAE", "MAPE(%)"],
    "값": [model.nobs, int(model.df_model), int(model.df_resid), model.rsquared, model.rsquared_adj,
           model.fvalue, model.f_pvalue, np.sqrt(model.scale), model.llf, model.aic, model.bic,
           np.sqrt((resid ** 2).mean()), resid.abs().mean(), mape],
})
fit_stats.round(4)   # R²=설명력, F검정 p<0.05면 모형 전체가 유의, RMSE=예측 오차 크기

# %%
# ⑤ 추정된 회귀식 — 보고서·셀에 그대로 쓰는 수식 문자열
${g}
${EQ_HELPER}

p = model.params
b0 = float(p.get("Intercept", 0.0))
names = [n for n in p.index if n != "Intercept"]
EQ = eq_text(names, [p[n] for n in names], b0, TARGET)
EQ   # 예) premium = 12,345.6789 + 1,234.5678·age - 987.6543·bmi`;
}

const LOGIT_FIT = `import statsmodels.formula.api as smf
yraw = df[TARGET]
ybin = (yraw.astype(int) if yraw.dtype != object
        else (yraw == sorted(yraw.dropna().unique())[-1]).astype(int))
d = df.assign(**{TARGET: ybin})
FORMULA = f"{TARGET} ~ " + " + ".join(NUMX + [f"C({c})" for c in CATX])
model = smf.logit(FORMULA, data=d).fit(disp=0)`;

/** 적합에 실제 쓰인 행의 실제값·예측확률 — ④⑤ 공통 */
const LOGIT_PRED = `y = pd.Series(np.asarray(model.model.endog), name=TARGET)
p_hat = pd.Series(np.asarray(model.predict()), name="예측확률")`;

function logitCode(s: ResultSpec, env: Env): string {
  const g = guard(
    "model.prsquared",
    `${dataPrepBody(s, env)}\n${LOGIT_FIT}`,
    "NameError, AttributeError"
  );
  return `${autoSelectCell(s, env)}

# %%
# ② 로짓식 자동 구성 · 적합 — 목표변수를 0/1로 변환(불리언·문자 라벨 모두 대응)
${guard("NUMX, CATX", dataPrepBody(s, env))}
import statsmodels.formula.api as smf

yraw = df[TARGET]
ybin = (yraw.astype(int) if yraw.dtype != object
        else (yraw == sorted(yraw.dropna().unique())[-1]).astype(int))
d = df.assign(**{TARGET: ybin})

FORMULA = f"{TARGET} ~ " + " + ".join(NUMX + [f"C({c})" for c in CATX])
model = smf.logit(FORMULA, data=d).fit(disp=0)
${summaryTail(env)}

# %%
# ③ 계수·오즈비 표 — 계수(log-odds)·표준오차·z값·p값·오즈비와 95% 구간(셀에 표로 반환)
${g}
ci = model.conf_int()
tbl = pd.DataFrame({
    "변수": model.params.index,
    "계수(log-odds)": model.params.values,
    "표준오차": model.bse.values,
    "z값": model.tvalues.values,
    "p값": model.pvalues.values,
    "오즈비 exp(b)": np.exp(model.params.values),
    "OR 하한95%": np.exp(ci[0].values),
    "OR 상한95%": np.exp(ci[1].values),
})
${STAR}
tbl.round(4)   # 오즈비 > 1 이면 사건(=1) 발생 위험을 높이는 요인

# %%
# ④ 적합도·분류 성능 표 — 우도비 검정·pseudo R²·AIC·AUC를 한 표로(셀에 표로 반환)
${g}
from sklearn.metrics import roc_auc_score, average_precision_score, accuracy_score, brier_score_loss

# 적합에 실제 사용된 행만(결측이 있던 행은 statsmodels가 자동 제외)
${LOGIT_PRED}
pred = (p_hat >= 0.5).astype(int)
perf = pd.DataFrame({
    "지표": ["관측수 n", "사건수", "사건률(%)", "McFadden pseudo R²", "로그우도", "영모형 로그우도",
             "우도비 LR χ²", "LR 검정 p값", "AIC", "BIC",
             "정확도(0.5)", "ROC-AUC", "PR-AUC", "Brier 점수"],
    "값": [model.nobs, y.sum(), y.mean() * 100, model.prsquared, model.llf, model.llnull,
           model.llr, model.llr_pvalue, model.aic, model.bic,
           accuracy_score(y, pred), roc_auc_score(y, p_hat),
           average_precision_score(y, p_hat), brier_score_loss(y, p_hat)],
})
perf.round(4)   # LR 검정 p<0.05면 모형이 영모형보다 유의, AUC 0.7↑이면 실무적으로 쓸 만함

# %%
# ⑤ 혼동행렬 표 — 임계값을 바꿔 가며 실제/예측 교차표 확인(셀에 표로 반환)
${g}${guard("p_hat", LOGIT_PRED)}
CUTOFF = 0.5   # ← 업무 비용에 맞춰 조정(놓치면 손해가 크면 낮춘다)
cm = pd.crosstab(y, (p_hat >= CUTOFF).astype(int),
                 rownames=["실제"], colnames=["예측"]).reindex(index=[0, 1], columns=[0, 1], fill_value=0)
cm

# %%
# ⑥ 추정된 로짓식 — 확률식까지 함께(보고서·셀에 그대로 사용)
${g}
${EQ_HELPER}

p = model.params
b0 = float(p.get("Intercept", 0.0))
names = [n for n in p.index if n != "Intercept"]
Z = eq_text(names, [p[n] for n in names], b0, "z")
EQ = Z + "   →   p = 1 / (1 + exp(-z))"
EQ   # 예) z = -2.1234 + 0.0456·age … → p = 1 / (1 + exp(-z))`;
}

const GLM_FIT = `import statsmodels.api as sm
import statsmodels.formula.api as smf
EXPOSURE = "exposure" if "exposure" in df.columns else None
offset = np.log(df[EXPOSURE]) if EXPOSURE else None
FEATS = [c for c in NUMX if c != EXPOSURE]
FORMULA = f"{TARGET} ~ " + " + ".join(FEATS + [f"C({c})" for c in CATX])
model = smf.glm(FORMULA, data=df, family=sm.families.Poisson(), offset=offset).fit()`;

function glmCode(s: ResultSpec, env: Env): string {
  const g = guard(
    "model.deviance",
    `${dataPrepBody(s, env)}\n${GLM_FIT}`,
    "NameError, AttributeError"
  );
  return `${autoSelectCell(s, env)}

# %%
# ② GLM 적합 — 건수(포아송) + 노출(exposure) 열이 있으면 offset으로 자동 반영
${guard("NUMX, CATX", dataPrepBody(s, env))}
import statsmodels.api as sm
import statsmodels.formula.api as smf

EXPOSURE = "exposure" if "exposure" in df.columns else None   # ← 노출 열 이름(없으면 None)
offset = np.log(df[EXPOSURE]) if EXPOSURE else None
FEATS = [c for c in NUMX if c != EXPOSURE]

FORMULA = f"{TARGET} ~ " + " + ".join(FEATS + [f"C({c})" for c in CATX])
model = smf.glm(FORMULA, data=df, family=sm.families.Poisson(), offset=offset).fit()
${summaryTail(env)}

# %%
# ③ 계수·요율 상대도 표 — exp(계수)가 기준 대비 배수(relativity)입니다
${g}
ci = model.conf_int()
tbl = pd.DataFrame({
    "변수": model.params.index,
    "계수": model.params.values,
    "표준오차": model.bse.values,
    "z값": model.tvalues.values,
    "p값": model.pvalues.values,
    "상대도 exp(b)": np.exp(model.params.values),
    "하한95%": np.exp(ci[0].values),
    "상한95%": np.exp(ci[1].values),
})
${STAR}
tbl.round(4)   # 상대도 1.20 → 기준 수준보다 20% 높은 빈도

# %%
# ④ 적합도·과산포 진단 표 — deviance·Pearson χ²·AIC를 한 표로(셀에 표로 반환)
${g}
dev_df = model.deviance / model.df_resid
pear_df = float(model.pearson_chi2) / model.df_resid
fit_stats = pd.DataFrame({
    "지표": ["관측수 n", "잔차 자유도", "Deviance", "Deviance/df", "Pearson χ²", "Pearson χ²/df",
             "AIC", "BIC", "로그우도", "영모형 deviance", "pseudo R²(1-D/D0)", "RMSE"],
    "값": [model.nobs, model.df_resid, model.deviance, dev_df, float(model.pearson_chi2), pear_df,
           model.aic, model.bic, model.llf, model.null_deviance,
           1 - model.deviance / model.null_deviance,
           float(np.sqrt(np.mean((model.resid_response) ** 2)))],
})
fit_stats.round(4)   # Pearson χ²/df 가 1보다 크게 벗어나면 과산포(→ 음이항·quasi 고려)

# %%
# ⑤ 추정된 GLM 식 — 로그연결함수 기준(선형예측자 → 기대값)
${g}
${EQ_HELPER}

p = model.params
b0 = float(p.get("Intercept", 0.0))
names = [n for n in p.index if n != "Intercept"]
EQ = eq_text(names, [p[n] for n in names], b0, f"log(E[{TARGET}])")
EQ = EQ + ("   (+ log(exposure))" if EXPOSURE else "") + f"   →   E[{TARGET}] = exp(위 식)"
EQ`;
}

/** sklearn 모델 공통 — X·y 구성(원-핫)·분할·학습 본문(셀 본문 겸 가드 본문) */
function skBody(s: ResultSpec, kind: "reg" | "clf"): string {
  const imports = (s.imports ?? []).join("\n");
  const yLine =
    kind === "clf"
      ? `yraw = df[TARGET]
y = (yraw.astype(int) if yraw.dtype != object
     else (yraw == sorted(yraw.dropna().unique())[-1]).astype(int))`
      : `y = df[TARGET].astype(float)`;
  const split =
    kind === "clf"
      ? `X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)`
      : `X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)`;
  return `from sklearn.model_selection import train_test_split
${imports}

X = pd.get_dummies(df[NUMX + CATX], columns=CATX, drop_first=True).astype(float)
${yLine}
keep = X.notna().all(axis=1) & y.notna()
X, y = X[keep], y[keep]
${split}

MODELS = {
    ${s.models ?? ""}
}
fits = {name: est.fit(X_tr, y_tr) for name, est in MODELS.items()}`;
}

/** ② 학습 셀 = 본문 + 요약 표 */
function skFitCell(s: ResultSpec, env: Env, kind: "reg" | "clf"): string {
  return `# %%
# ② 학습 데이터 구성(범주형 자동 원-핫) · 모델 학습
${guard("NUMX, CATX", dataPrepBody(s, env))}
${skBody(s, kind)}
pd.DataFrame({"학습된 모델": list(fits), "학습 표본": len(X_tr), "검증 표본": len(X_te),
              "설명변수 수": X.shape[1]})`;
}

/** 계수·중요도 표 — coef_ / feature_importances_ / 순열중요도를 자동 판별 */
const importanceCell = (g: string) => `# %%
# ③ 변수 영향력 표 — 계수 또는 중요도를 자동으로 골라 표로(셀에 표로 반환)
${g}
PICK = list(fits)[0]        # ← 표를 볼 모델 이름(위 표의 이름 중 하나로 바꾸세요)
m = fits[PICK]
inner = m[-1] if hasattr(m, "steps") else m       # 파이프라인이면 마지막 추정기
if hasattr(inner, "feature_importances_"):
    val, lab = inner.feature_importances_, "중요도"
elif hasattr(inner, "coef_"):
    val, lab = np.ravel(inner.coef_), "계수"
else:                                              # KNN·NB 등 — 순열 중요도로 대체
    from sklearn.inspection import permutation_importance
    val = permutation_importance(m, X_te, y_te, n_repeats=5, random_state=0).importances_mean
    lab = "순열 중요도"
imp = pd.DataFrame({"변수": X.columns, lab: val})
imp = (imp.assign(_a=imp[lab].abs()).sort_values("_a", ascending=False)
          .drop(columns="_a").reset_index(drop=True))
imp.round(4)   # 계수는 부호(+/-)까지, 중요도는 크기만 의미가 있습니다`;

function skRegCode(s: ResultSpec, env: Env): string {
  // ③ 이후 셀은 fits(학습된 모델)가 필요 — 없으면 데이터·분할·학습까지 가드에서 재구성
  const g = guard("fits", `${dataPrepBody(s, env)}
${skBody(s, "reg")}`);
  return `${autoSelectCell(s, env)}

${skFitCell(s, env, "reg")}

${importanceCell(g)}

# %%
# ④ 검정통계량·성능 표 — 모델×(학습/검증)별 RMSE·MAE·MAPE·R²(셀에 표로 반환)
${g}
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

rows = []
for name, m in fits.items():
    for split, Xs, ys in [("학습", X_tr, y_tr), ("검증", X_te, y_te)]:
        pr = m.predict(Xs)
        rows.append({
            "모델": name, "구분": split, "n": len(ys),
            "RMSE": np.sqrt(mean_squared_error(ys, pr)),
            "MAE": mean_absolute_error(ys, pr),
            "MAPE(%)": (np.abs((ys - pr) / ys.replace(0, np.nan))).mean() * 100,
            "R²": r2_score(ys, pr),
        })
metrics = pd.DataFrame(rows).round(4)
metrics   # 학습 대비 검증 RMSE가 크게 나쁘면 과적합 — 규제를 키우거나 변수를 줄이세요

# %%
# ⑤ 추정된 예측식 — 선형 모델일 때 수식으로(트리·부스팅은 수식이 없어 생략)
${g}${guard("PICK", "PICK = list(fits)[0]")}
${EQ_HELPER}

m = fits[PICK]
inner = m[-1] if hasattr(m, "steps") else m
if hasattr(inner, "coef_"):
    EQ = eq_text(X.columns, np.ravel(inner.coef_), float(np.ravel(inner.intercept_)[0]), TARGET)
else:
    EQ = f"{PICK}: 트리·부스팅 계열은 계수 수식이 없습니다 — ③의 중요도 표로 해석하세요"
EQ`;
}

function skClfCode(s: ResultSpec, env: Env): string {
  const g = guard("fits", `${dataPrepBody(s, env)}
${skBody(s, "clf")}`);
  return `${autoSelectCell(s, env)}

${skFitCell(s, env, "clf")}

${importanceCell(g)}

# %%
# ④ 검정통계량·분류 성능 표 — 모델별 정확도·정밀도·재현율·F1·AUC(셀에 표로 반환)
${g}
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score,
                             roc_auc_score, average_precision_score, brier_score_loss)

CUTOFF = 0.5   # ← 확률을 1로 판정하는 임계값(업무 비용에 맞춰 조정)
rows = []
for name, m in fits.items():
    prob = m.predict_proba(X_te)[:, 1] if hasattr(m, "predict_proba") else m.decision_function(X_te)
    pred = (prob >= CUTOFF).astype(int) if hasattr(m, "predict_proba") else m.predict(X_te)
    rows.append({
        "모델": name, "n": len(y_te),
        "정확도": accuracy_score(y_te, pred),
        "정밀도": precision_score(y_te, pred, zero_division=0),
        "재현율": recall_score(y_te, pred, zero_division=0),
        "F1": f1_score(y_te, pred, zero_division=0),
        "ROC-AUC": roc_auc_score(y_te, prob),
        "PR-AUC": average_precision_score(y_te, prob),
        "Brier": (brier_score_loss(y_te, prob) if hasattr(m, "predict_proba") else np.nan),
    })
metrics = pd.DataFrame(rows).round(4)
metrics   # 사건이 드물면 정확도보다 PR-AUC·재현율을 먼저 보세요

# %%
# ⑤ 혼동행렬 표 — 임계값을 바꿔 실제/예측 교차표 확인(셀에 표로 반환)
${g}${guard("PICK, CUTOFF", ["PICK = list(fits)[0]", "CUTOFF = 0.5"].join("\n"))}
m = fits[PICK]
prob = m.predict_proba(X_te)[:, 1] if hasattr(m, "predict_proba") else m.decision_function(X_te)
pred = (prob >= CUTOFF).astype(int) if hasattr(m, "predict_proba") else m.predict(X_te)
cm = pd.crosstab(pd.Series(np.asarray(y_te), name="실제"),
                 pd.Series(np.asarray(pred), name="예측")).reindex(index=[0, 1], columns=[0, 1], fill_value=0)
cm`;
}

function clusterCode(s: ResultSpec, env: Env): string {
  const imports = (s.imports ?? []).join("\n");
  const body = `from sklearn.preprocessing import StandardScaler
${imports}
base = df[NUMX].dropna()
Z = StandardScaler().fit_transform(base)
model = ${s.est}
labels = model.fit_predict(Z)`;
  // ③ 이후 셀은 base·Z·labels가 필요 — 없으면 데이터·표준화·적합까지 가드에서 재구성
  const g = guard("labels", `${dataPrepBody(s, env, true)}\n${body}`);
  return `${autoSelectCell(s, env, { noTarget: true })}

# %%
# ② 표준화 · 군집 적합 — 수치형 설명변수를 자동으로 사용(척도 차이는 표준화로 제거)
${guard("NUMX", dataPrepBody(s, env, true))}
${body}
pd.DataFrame({"사용 변수": NUMX, "관측수": len(base)})

# %%
# ③ 군집 크기·프로파일 표 — 군집별 평균을 원래 단위로(셀에 표로 반환)
${g}
prof = base.assign(군집=labels).groupby("군집").agg(["mean"])
prof.columns = [c[0] for c in prof.columns]
size = pd.Series(labels).value_counts().sort_index()
prof.insert(0, "건수", size.values)
prof.insert(1, "비율(%)", (size.values / len(base) * 100))
prof.round(3)   # 군집별로 어떤 변수가 높고 낮은지 = 군집의 성격

# %%
# ④ 군집 품질 지표 표 — 실루엣·CH·DB를 한 표로(셀에 표로 반환)
${g}
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score

quality = pd.DataFrame({
    "지표": ["군집 수", "관측수", "실루엣(높을수록 좋음)", "Calinski-Harabasz(높을수록)",
             "Davies-Bouldin(낮을수록)"],
    "값": [len(np.unique(labels)), len(base), silhouette_score(Z, labels),
           calinski_harabasz_score(Z, labels), davies_bouldin_score(Z, labels)],
})
quality.round(4)   # 실루엣 0.5↑ 양호 · 0.2 미만이면 군집 구조가 약함`;
}

function pcaCode(s: ResultSpec, env: Env): string {
  const body = `from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
base = df[NUMX].dropna()
Z = StandardScaler().fit_transform(base)
model = PCA().fit(Z)
scores = model.transform(Z)`;
  const g = guard(
    "model.components_",
    `${dataPrepBody(s, env, true)}\n${body}`,
    "NameError, AttributeError"
  );
  return `${autoSelectCell(s, env, { noTarget: true })}

# %%
# ② 표준화 · 주성분 적합 — 수치형 설명변수를 자동으로 사용
${guard("NUMX", dataPrepBody(s, env, true))}
${body}
pd.DataFrame({"사용 변수": NUMX, "관측수": len(base)})

# %%
# ③ 설명분산 표 — 성분별 고유값·설명비율·누적비율(셀에 표로 반환)
${g}
ev = model.explained_variance_
ratio = model.explained_variance_ratio_
var_tbl = pd.DataFrame({
    "성분": [f"PC{i+1}" for i in range(len(ev))],
    "고유값": ev,
    "설명비율(%)": ratio * 100,
    "누적비율(%)": np.cumsum(ratio) * 100,
})
var_tbl.round(4)   # 고유값 1 이상 또는 누적 70~80%까지를 성분 수로 택하는 것이 관례

# %%
# ④ 로딩(적재량) 표 — 각 성분이 어떤 변수로 이뤄졌는지(셀에 표로 반환)
${g}
K = min(3, model.n_components_)   # ← 볼 성분 수
load = pd.DataFrame(model.components_[:K].T, index=NUMX,
                    columns=[f"PC{i+1}" for i in range(K)])
load.round(4)   # 절대값이 큰 변수가 그 성분의 의미를 결정합니다

# %%
# ⑤ 주성분 식 — PC1 = w1·x1 + w2·x2 + … (표준화된 변수 기준)
${g}
${EQ_HELPER}

EQ = eq_text(NUMX, model.components_[0], 0.0, "PC1").replace("= 0.0000 + ", "= ")
EQ`;
}

function cvCode(s: ResultSpec, env: Env): string {
  const imports = (s.imports ?? []).join("\n");
  const body = `from sklearn.model_selection import StratifiedKFold, cross_validate
${imports}
X = pd.get_dummies(df[NUMX + CATX], columns=CATX, drop_first=True).astype(float)
yraw = df[TARGET]
y = (yraw.astype(int) if yraw.dtype != object
     else (yraw == sorted(yraw.dropna().unique())[-1]).astype(int))
keep = X.notna().all(axis=1) & y.notna()
X, y = X[keep], y[keep]
est = ${s.est}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
res = cross_validate(est, X, y, cv=cv, scoring=["accuracy", "roc_auc", "average_precision", "f1"],
                     return_train_score=True)`;
  // ③④는 res(교차검증 결과)가 필요 — 없으면 가드에서 교차검증을 다시 수행
  const g = guard(
    'res["test_roc_auc"]',
    `${dataPrepBody(s, env)}\n${body}`,
    "NameError, KeyError, TypeError"
  );
  return `${autoSelectCell(s, env)}

# %%
# ② 교차검증 실행 — 열 자동 선택 결과로 X·y 구성(범주형 원-핫)
${guard("NUMX, CATX", dataPrepBody(s, env))}
from sklearn.model_selection import StratifiedKFold, cross_validate
${imports}

X = pd.get_dummies(df[NUMX + CATX], columns=CATX, drop_first=True).astype(float)
yraw = df[TARGET]
y = (yraw.astype(int) if yraw.dtype != object
     else (yraw == sorted(yraw.dropna().unique())[-1]).astype(int))
keep = X.notna().all(axis=1) & y.notna()
X, y = X[keep], y[keep]

est = ${s.est}
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
res = cross_validate(est, X, y, cv=cv, scoring=["accuracy", "roc_auc", "average_precision", "f1"],
                     return_train_score=True)
pd.DataFrame({"설정": ["분할 수", "표본", "설명변수", "지표"],
              "값": [cv.get_n_splits(), len(X), X.shape[1], "정확도·ROC-AUC·PR-AUC·F1"]})

# %%
# ③ 폴드별 점수 표 — 각 분할의 검증 점수(셀에 표로 반환)
${g}
folds = pd.DataFrame({
    "폴드": [f"{i+1}겹" for i in range(len(res["test_accuracy"]))],
    "정확도": res["test_accuracy"],
    "ROC-AUC": res["test_roc_auc"],
    "PR-AUC": res["test_average_precision"],
    "F1": res["test_f1"],
    "학습 ROC-AUC": res["train_roc_auc"],
    "적합 시간(초)": res["fit_time"],
})
folds.round(4)   # 폴드 간 점수가 크게 흔들리면 표본이 적거나 불안정한 모형입니다

# %%
# ④ 검정통계량 요약 표 — 평균±표준편차와 95% 신뢰구간(셀에 표로 반환)
${g}
rows = []
for key, name in [("test_accuracy", "정확도"), ("test_roc_auc", "ROC-AUC"),
                  ("test_average_precision", "PR-AUC"), ("test_f1", "F1")]:
    v = res[key]
    se = v.std(ddof=1) / np.sqrt(len(v))
    rows.append({"지표": name, "평균": v.mean(), "표준편차": v.std(ddof=1),
                 "하한95%": v.mean() - 1.96 * se, "상한95%": v.mean() + 1.96 * se,
                 "최소": v.min(), "최대": v.max()})
summary = pd.DataFrame(rows).round(4)
summary   # 보고는 '평균 ± 표준편차'로 — 단일 분할 점수보다 신뢰할 수 있습니다`;
}

function outlierCode(s: ResultSpec, env: Env): string {
  const imports = (s.imports ?? []).join("\n");
  const body = `from sklearn.preprocessing import StandardScaler
${imports}
base = df[NUMX].dropna()
Z = StandardScaler().fit_transform(base)
model = ${s.est}
flag = model.fit_predict(Z)
score = -model.score_samples(Z)`;
  const g = guard("flag", `${dataPrepBody(s, env, true)}\n${body}`);
  return `${autoSelectCell(s, env, { noTarget: true })}

# %%
# ② 이상치 점수 산출 — 수치형 설명변수를 자동으로 사용
${guard("NUMX", dataPrepBody(s, env, true))}
from sklearn.preprocessing import StandardScaler
${imports}

base = df[NUMX].dropna()
Z = StandardScaler().fit_transform(base)
model = ${s.est}
flag = model.fit_predict(Z)              # -1 = 이상치, 1 = 정상
score = -model.score_samples(Z)          # 클수록 이상(부호를 뒤집어 직관적으로)
pd.DataFrame({"사용 변수": NUMX, "관측수": len(base), "이상 판정": int((flag == -1).sum())})

# %%
# ③ 상위 이상치 표 — 점수가 높은 관측을 원래 값과 함께(셀에 표로 반환)
${g}
TOPN = 10   # ← 보고 싶은 건수
top = (base.assign(이상점수=score, 판정=np.where(flag == -1, "이상", "정상"))
           .sort_values("이상점수", ascending=False).head(TOPN))
top.round(4)   # 통계적 이례일 뿐 곧 '사기'는 아닙니다 — 심사 검토가 필요합니다

# %%
# ④ 임계값별 건수·검정통계량 표 — 점수 분위수 컷오프별 적출 건수(셀에 표로 반환)
${g}
rows = []
for q in [0.90, 0.95, 0.98, 0.99, 0.995]:
    thr = np.quantile(score, q)
    rows.append({"분위수": f"{q*100:.1f}%", "임계 점수": thr,
                 "적출 건수": int((score >= thr).sum()),
                 "적출 비율(%)": (score >= thr).mean() * 100,
                 "적출군 평균점수": score[score >= thr].mean()})
cut = pd.DataFrame(rows).round(4)
cut   # 심사 가능 건수(리소스)에 맞는 임계값을 고르는 표입니다`;
}

const KM_TABLE_DEF = `def km_table(t, e):
    """중도절단(censoring)을 반영한 KM 추정 — numpy만 사용(브라우저·엑셀 공통 실행)"""
    t = np.asarray(t, float); e = np.asarray(e, int)
    times = np.unique(t[e == 1])
    S, var, out = 1.0, 0.0, []
    for ti in times:
        n = int((t >= ti).sum())          # 위험집합
        d = int(((t == ti) & (e == 1)).sum())
        S *= 1 - d / n
        var += d / (n * (n - d)) if n > d else 0.0   # Greenwood
        se = S * np.sqrt(var)
        out.append({"시점 t": ti, "위험집합 n": n, "사건 d": d, "S(t)": S,
                    "표준오차": se, "하한95%": max(0.0, S - 1.96 * se),
                    "상한95%": min(1.0, S + 1.96 * se)})
    return pd.DataFrame(out)`;

function kmCode(s: ResultSpec, env: Env): string {
  // 기간·사건·그룹 열 지정과 KM 함수는 '부수적 준비' — 뒤 셀에서도 가드로 재구성한다
  const survBody = `DUR = next((c for c in NUMX if c in ("duration_years", "duration", "tenure_months", "time")), NUMX[0])
EVT = next((c for c in df.columns if c in ("event", "died", "lapsed", "status")), None)
GRP = CATX[0] if CATX else None
surv = df[[c for c in [DUR, EVT, GRP] if c]].dropna()
surv[EVT] = surv[EVT].astype(int)`;
  const gSurv = guard("surv", `${dataPrepBody(s, env, true)}\n${survBody}`);
  const gKm = guard("km_table, surv", `${dataPrepBody(s, env, true)}\n${survBody}\n${KM_TABLE_DEF}`);
  return `${autoSelectCell(s, env, { noTarget: true })}

# %%
# ② 생존분석 열 자동 지정 — 기간·사건 열을 이름으로 추정(없으면 직접 지정)
${guard("NUMX, CATX", dataPrepBody(s, env, true))}
DUR = next((c for c in NUMX if c in ("duration_years", "duration", "tenure_months", "time")), NUMX[0])
EVT = next((c for c in df.columns if c in ("event", "died", "lapsed", "status")), None)
GRP = CATX[0] if CATX else None          # 비교할 그룹(예: 성별) — 없으면 전체 한 곡선

surv = df[[c for c in [DUR, EVT, GRP] if c]].dropna()
surv[EVT] = surv[EVT].astype(int)
pd.DataFrame({"역할": ["기간(duration)", "사건(event 1=발생)", "그룹"],
              "열": [DUR, EVT, GRP if GRP else "(없음)"],
              "관측수": [len(surv), int(surv[EVT].sum()), surv[GRP].nunique() if GRP else 1]})

# %%
# ③ Kaplan-Meier 생존표 — S(t)=Π(1−dᵢ/nᵢ)와 Greenwood 95% CI(셀에 표로 반환)
${gSurv}
${KM_TABLE_DEF}

km = km_table(surv[DUR], surv[EVT])
km.round(4)   # S(t)=t시점까지 사건이 없을 확률(중도절단은 위험집합에서 빠짐)

# %%
# ④ 그룹 비교·log-rank 검정 표 — 중위생존시간과 검정통계량(셀에 표로 반환)
${gKm}
rows = []
if GRP:
    for g, sub in surv.groupby(GRP):
        k = km_table(sub[DUR], sub[EVT])
        med = k.loc[k["S(t)"] <= 0.5, "시점 t"]
        rows.append({"그룹": g, "관측수": len(sub), "사건수": int(sub[EVT].sum()),
                     "중위생존시간": (med.iloc[0] if len(med) else np.nan),
                     "최종 S(t)": k["S(t)"].iloc[-1] if len(k) else np.nan})
    # log-rank χ²(1) — 관측 사건수 vs 기대 사건수
    lv = sorted(surv[GRP].unique())[:2]
    a, b = [surv[surv[GRP] == v] for v in lv]
    O = E = V = 0.0
    for ti in np.unique(surv.loc[surv[EVT] == 1, DUR]):
        n1 = (a[DUR] >= ti).sum(); n2 = (b[DUR] >= ti).sum(); n = n1 + n2
        d1 = ((a[DUR] == ti) & (a[EVT] == 1)).sum(); d = d1 + ((b[DUR] == ti) & (b[EVT] == 1)).sum()
        if n < 2 or d == 0: continue
        O += d1; E += d * n1 / n
        V += d * (n1 / n) * (1 - n1 / n) * (n - d) / (n - 1)
    from scipy import stats
    chi2 = (O - E) ** 2 / V if V > 0 else np.nan
    rows.append({"그룹": f"log-rank({lv[0]} vs {lv[1]})", "관측수": len(surv),
                 "사건수": f"O={O:.1f}, E={E:.1f}", "중위생존시간": f"χ²={chi2:.4f}",
                 "최종 S(t)": f"p={1 - stats.chi2.cdf(chi2, 1):.4f}"})
else:
    rows.append({"그룹": "(그룹 열 없음)", "관측수": len(surv),
                 "사건수": int(surv[EVT].sum()), "중위생존시간": np.nan, "최종 S(t)": np.nan})
pd.DataFrame(rows)   # log-rank p<0.05면 두 그룹의 생존곡선이 유의하게 다릅니다`;
}

function arimaCode(s: ResultSpec, env: Env): string {
  const load =
    env === "py"
      ? `# 시계열 파일이 있으면 읽고, 없으면 합성 월별 시계열로 바로 실행됩니다
try:
    df = pd.read_excel("series.xlsx")
except Exception:
    idx = pd.date_range("2020-01-01", periods=60, freq="MS")
    rng = np.random.default_rng(0)
    df = pd.DataFrame({"month": idx,
                       "claim_amt": 100 + np.arange(60) * 0.8
                                    + 8 * np.sin(np.arange(60) / 12 * 2 * np.pi)
                                    + rng.normal(0, 3, 60)})`
      : `df = xl("${s.table}", headers=True)   # 날짜 열 + 값 열이 있는 표를 참조`;
  // 시계열 로드·열 지정은 '부수적 준비' — 뒤 셀에서도 가드로 재구성한다
  const serBody = `import pandas as pd
import numpy as np
${load}
DATE = next((c for c in df.columns
             if "date" in str(c).lower() or "month" in str(c).lower()
             or str(df[c].dtype).startswith("datetime")), None)
VALUE = df.select_dtypes("number").columns[-1]
ser = df.set_index(pd.to_datetime(df[DATE])) [VALUE] if DATE else df[VALUE]
ser = ser.astype(float).dropna()`;
  const gFit = guard(
    "model.aic",
    `${serBody}\nfrom statsmodels.tsa.arima.model import ARIMA\nORDER = (1, 1, 1)\nmodel = ARIMA(ser, order=ORDER).fit()`,
    "NameError, AttributeError"
  );
  return `# %%
# ① 데이터 로드 · 날짜·값 열 자동 선택 — 이름·자료형으로 추정합니다
import pandas as pd
import numpy as np

${load}

DATE = next((c for c in df.columns
             if "date" in str(c).lower() or "month" in str(c).lower()
             or str(df[c].dtype).startswith("datetime")), None)
VALUE = df.select_dtypes("number").columns[-1]   # ← 값 열(기본: 마지막 수치형)

ser = df.set_index(pd.to_datetime(df[DATE])) [VALUE] if DATE else df[VALUE]
ser = ser.astype(float).dropna()
pd.DataFrame({"항목": ["날짜 열", "값 열", "관측수", "시작", "끝"],
              "값": [DATE if DATE else "(없음 — 순번 사용)", VALUE, len(ser),
                     str(ser.index[0]), str(ser.index[-1])]})

# %%
# ② ARIMA 적합 — 차수(p,d,q)를 지정해 적합
${guard("ser", serBody)}
from statsmodels.tsa.arima.model import ARIMA

ORDER = (1, 1, 1)   # ← (p,d,q): p=자기회귀, d=차분, q=이동평균
model = ARIMA(ser, order=ORDER).fit()
${
  env === "py"
    ? `print(model.summary())   # 파이썬: 요약표를 그대로 확인`
    : `# summary()는 =PY() 셀에 제대로 표시되지 않으므로 아래 표 셀로 나눠 봅니다
f"ARIMA{ORDER} 적합 완료 — 관측 {len(ser)}개"`
}

# %%
# ③ 계수 표 — 항목·계수·표준오차·z값·p값·95% 신뢰구간(셀에 표로 반환)
${gFit}
ci = model.conf_int()
tbl = pd.DataFrame({
    "항목": model.params.index,
    "계수": model.params.values,
    "표준오차": model.bse.values,
    "z값": model.tvalues.values,
    "p값": model.pvalues.values,
    "하한95%": ci.iloc[:, 0].values,
    "상한95%": ci.iloc[:, 1].values,
})
${STAR}
tbl.round(4)   # ar.L1=자기회귀 계수, ma.L1=이동평균 계수, sigma2=오차분산

# %%
# ④ 적합도·검정통계량 표 — AIC·BIC·RMSE·Ljung-Box(잔차 백색잡음 검정)
${gFit}
import statsmodels.api as sm

resid = model.resid[ORDER[1]:]          # 차분으로 생긴 앞부분 제외
lb = sm.stats.acorr_ljungbox(resid, lags=[min(10, max(1, len(resid) // 5))], return_df=True)
fit_stats = pd.DataFrame({
    "지표": ["관측수", "AIC", "BIC", "로그우도", "RMSE", "MAE",
             "Ljung-Box Q", "Ljung-Box p값"],
    "값": [len(ser), model.aic, model.bic, model.llf,
           float(np.sqrt((resid ** 2).mean())), float(resid.abs().mean()),
           float(lb["lb_stat"].iloc[0]), float(lb["lb_pvalue"].iloc[0])],
})
fit_stats.round(4)   # Ljung-Box p>0.05면 잔차에 남은 패턴이 없다(적합 양호)

# %%
# ⑤ 추정된 모형식 · 예측 표 — 수식과 향후 예측을 함께(셀에 표로 반환)
${gFit}
p = model.params
ar = " ".join([f"{'+' if p[n] >= 0 else '-'} {abs(p[n]):.4f}·y(t-{i+1})"
               for i, n in enumerate([x for x in p.index if x.startswith("ar.")])])
ma = " ".join([f"{'+' if p[n] >= 0 else '-'} {abs(p[n]):.4f}·e(t-{i+1})"
               for i, n in enumerate([x for x in p.index if x.startswith("ma.")])])
d_txt = "Δ" * ORDER[1]
EQ = f"{d_txt}y(t) = {ar} {ma} + e(t)".replace("  ", " ")

fc = model.get_forecast(6)
pred = pd.DataFrame({"예측 시점": range(1, 7), "예측값": fc.predicted_mean.values,
                     "하한95%": fc.conf_int().iloc[:, 0].values,
                     "상한95%": fc.conf_int().iloc[:, 1].values})
print(EQ)
pred.round(4)`;
}

function testCode(s: ResultSpec, env: Env): string {
  return `${autoSelectCell(s, env)}

# %%
# ② 기술통계 표 — 검정 전에 그룹별 n·평균·표준편차·중위수 확인(셀에 표로 반환)
${guard("NUMX, CATX", dataPrepBody(s, env))}
GROUP = CATX[0] if CATX else None   # ← 비교할 범주형 열(없으면 전체 요약)
if GROUP:
    desc = df.groupby(GROUP)[TARGET].agg(건수="count", 평균="mean", 표준편차="std",
                                         중위수="median", 최소="min", 최대="max")
else:
    desc = df[TARGET].describe().to_frame(TARGET).T
desc.round(3)   # 평균 차이가 커 보여도 표준편차·건수를 함께 봐야 검정 결과를 해석할 수 있습니다

# %%
# ③ 검정 결과 표 — 정규성·등분산·평균차·상관·독립성을 한 표로(셀에 표로 반환)
${guard("NUMX, CATX", dataPrepBody(s, env))}
from scipy import stats

rows = []
def add(name, target, stat, dof, p, eff=""):
    rows.append({"검정": name, "대상": target, "통계량": stat, "자유도": dof,
                 "p값": p, "판정": ("유의(p<0.05)" if p < 0.05 else "유의하지 않음"), "효과크기": eff})

y = df[TARGET].dropna()
# ① 정규성(Shapiro-Wilk) — p<0.05면 정규 아님(→ 비모수 검정 고려)
sw = stats.shapiro(y.sample(min(len(y), 5000), random_state=0))
add("정규성(Shapiro-Wilk)", TARGET, sw.statistic, "", sw.pvalue, f"왜도 {y.skew():.3f}")

for g in CATX:
    lv = [v for v in df[g].dropna().unique()]
    groups = [df.loc[df[g] == v, TARGET].dropna() for v in lv]
    groups = [x for x in groups if len(x) >= 3]
    if len(groups) < 2:
        continue
    lev = stats.levene(*groups)
    add("등분산성(Levene)", g, lev.statistic, f"{len(groups)-1}, {sum(map(len, groups))-len(groups)}",
        lev.pvalue)
    if len(groups) == 2:
        a, b = groups
        tt = stats.ttest_ind(a, b, equal_var=False)          # Welch — 등분산 가정 불필요
        sp = np.sqrt(((len(a)-1)*a.var(ddof=1) + (len(b)-1)*b.var(ddof=1)) / (len(a)+len(b)-2))
        add("평균차(Welch t)", g, tt.statistic, f"{tt.df:.1f}", tt.pvalue,
            f"Cohen's d {abs(a.mean()-b.mean())/sp:.3f}")
        mw = stats.mannwhitneyu(a, b)
        add("중위수차(Mann-Whitney U)", g, mw.statistic, "", mw.pvalue)
    else:
        f = stats.f_oneway(*groups)
        n = sum(map(len, groups))
        ss_b = sum(len(x) * (x.mean() - y.mean())**2 for x in groups)
        ss_t = sum(((x - y.mean())**2).sum() for x in groups)
        add("평균차(일원 ANOVA F)", g, f.statistic, f"{len(groups)-1}, {n-len(groups)}", f.pvalue,
            f"η² {ss_b/ss_t:.3f}")
        kw = stats.kruskal(*groups)
        add("중위수차(Kruskal-Wallis)", g, kw.statistic, len(groups)-1, kw.pvalue)

for c in NUMX:                                              # ② 상관 — 목표와 수치형 변수
    d2 = df[[c, TARGET]].dropna()
    if len(d2) < 3:
        continue
    pr = stats.pearsonr(d2[c], d2[TARGET])
    add("상관(Pearson r)", f"{c} ~ {TARGET}", pr.statistic, len(d2)-2, pr.pvalue,
        f"r² {pr.statistic**2:.3f}")
    sr = stats.spearmanr(d2[c], d2[TARGET])
    add("순위상관(Spearman ρ)", f"{c} ~ {TARGET}", sr.statistic, "", sr.pvalue)

if len(CATX) >= 2:                                          # ③ 독립성(카이제곱)
    ct = pd.crosstab(df[CATX[0]], df[CATX[1]])
    chi2, p, dof, _ = stats.chi2_contingency(ct)
    n = ct.values.sum()
    add("독립성(χ² 교차표)", f"{CATX[0]} × {CATX[1]}", chi2, dof, p,
        f"Cramér's V {np.sqrt(chi2/(n*(min(ct.shape)-1))):.3f}")

tests = pd.DataFrame(rows).round(4)
tests   # 한 표에서 필요한 행만 보면 됩니다(t검정·ANOVA·상관·카이제곱을 한 번에 산출)`;
}

const BUILDERS: Record<ResultKind, (s: ResultSpec, env: Env) => string> = {
  ols: olsCode,
  logit: logitCode,
  glm: glmCode,
  "sk-reg": skRegCode,
  "sk-clf": skClfCode,
  cluster: clusterCode,
  pca: pcaCode,
  cv: cvCode,
  outlier: outlierCode,
  km: kmCode,
  arima: arimaCode,
  test: testCode,
};

const TITLE: Record<ResultKind, string> = {
  ols: "결과를 표·수식으로 — 열 자동 선택 · 계수 표 · 적합도 지표 · 회귀식",
  logit: "결과를 표·수식으로 — 열 자동 선택 · 계수·오즈비 표 · 성능 지표 · 로짓식",
  glm: "결과를 표·수식으로 — 열 자동 선택 · 계수·상대도 표 · 적합도 · GLM식",
  "sk-reg": "결과를 표·수식으로 — 열 자동 선택 · 계수/중요도 표 · 성능 지표 · 예측식",
  "sk-clf": "결과를 표로 — 열 자동 선택 · 중요도 표 · 분류 성능 지표 · 혼동행렬",
  cluster: "결과를 표로 — 열 자동 선택 · 군집 프로파일 표 · 품질 지표",
  pca: "결과를 표·수식으로 — 열 자동 선택 · 설명분산·로딩 표 · 주성분식",
  cv: "결과를 표로 — 열 자동 선택 · 폴드별 점수 표 · 요약 통계량",
  outlier: "결과를 표로 — 열 자동 선택 · 상위 이상치 표 · 임계값별 건수",
  km: "결과를 표로 — 열 자동 선택 · KM 생존표 · log-rank 검정",
  arima: "결과를 표·수식으로 — 열 자동 선택 · 계수 표 · 적합도 지표 · 모형식",
  test: "결과를 표로 — 열 자동 선택 · 기술통계 표 · 검정 결과 한 표",
};

const DESC =
  "엑셀(=PY())에서는 summary()·print가 셀에 제대로 표시되지 않습니다 — 계수·통계량을 " +
  "DataFrame 표로 만들어 셀에 그대로 스필시키고, 열 선택·적합·계수 표·적합도 지표를 " +
  "셀마다 나눠 필요한 것만 골라 실행할 수 있게 했습니다. 열 이름은 데이터에서 자동으로 " +
  "고르므로 예제 열 이름(premium·age 등)을 손으로 바꾸지 않아도 됩니다.";

/** 일부 kind에만 붙는 보충 안내 */
const DESC_EXTRA: Partial<Record<ResultKind, string>> = {
  km: " 이 섹션은 lifelines 없이 numpy만으로 KM·log-rank를 계산하므로 브라우저 실행기에서도 그대로 실행됩니다.",
  arima: " 시계열 파일이 없으면 합성 월별 시계열로 바로 실행됩니다.",
};

/** 파이썬 탭용 섹션 — 없으면 null */
export function resultSection(id: string): MethodCodeSection | null {
  const spec = MODEL_RESULT_SPECS[id];
  if (!spec) return null;
  return {
    title: TITLE[spec.kind],
    desc: DESC + (DESC_EXTRA[spec.kind] ?? ""),
    level: "basic",
    code: BUILDERS[spec.kind](spec, "py"),
  };
}

/** 엑셀(=PY()) 탭용 섹션 — 없으면 null */
export function excelResultSection(id: string): ExcelCodeSection | null {
  const spec = MODEL_RESULT_SPECS[id];
  if (!spec) return null;
  return {
    title: TITLE[spec.kind],
    level: "basic",
    sameAsOriginal: false,
    code: BUILDERS[spec.kind](spec, "xl"),
  };
}

/** 방법 목록에 결과 표 섹션을 붙인 사본 — STAT_METHODS 최종 조립에 사용 */
export function withResultSections<
  T extends { id: string; sections: MethodCodeSection[] }
>(methods: T[]): T[] {
  return methods.map((m) => {
    const extra = resultSection(m.id);
    return extra ? { ...m, sections: insertAfterBasic(m.sections, extra) } : m;
  });
}

/** 기본(basic) 섹션들 뒤에 삽입 — 섹션 순서 규약(기본 → 고급) 유지 */
export function insertAfterBasic<T extends { level?: "basic" | "advanced" }>(
  sections: T[],
  extra: T
): T[] {
  let at = sections.length;
  for (let i = sections.length - 1; i >= 0; i--) {
    if ((sections[i].level ?? "basic") === "basic") {
      at = i + 1;
      break;
    }
    at = i;
  }
  return [...sections.slice(0, at), extra, ...sections.slice(at)];
}
