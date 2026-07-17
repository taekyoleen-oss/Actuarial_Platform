// 통계·머신러닝 파이썬 사전 — /datalab 상단 워드클라우드(MethodCloud) 데이터.
// weight(1~5)는 실무 사용 빈도 → 클라우드 글자 크기. 같은 카테고리는 같은 클러스터에 모인다.
// 코드는 pandas·numpy·scipy·statsmodels·scikit-learn 기준, 예제는 보험 실무 데이터 흐름.
// 보험·계리(actuarial) 8종은 파일 비대화를 막기 위해 lib/actuarialMethods.ts로 분리해 스프레드로 합류한다.

import { ACTUARIAL_METHODS } from "./actuarialMethods";

export type MethodCategoryId = "basic" | "model" | "ml" | "actuarial" | "wrangle";

/** 칩 뮤트 팔레트(--chip-*) 한정 스코프 — 카테고리 고정색 */
export type MethodChipColor = "blue" | "violet" | "teal" | "rose" | "amber";

export interface MethodCategory {
  id: MethodCategoryId;
  label: string;
  color: MethodChipColor;
  hint: string;
}

export interface MethodCodeSection {
  /** 코드 블록 제목 — 블록 단위 부분 복사의 기준 */
  title: string;
  /** 블록 앞 설명(선택) */
  desc?: string;
  /**
   * 코드 수준 — 미지정 시 "basic"으로 취급한다.
   * "basic": 하이퍼파라미터·변수를 명시적으로 지정해 탐색 없이 바로 결과를 산출(초보자의 첫 실행 경로).
   * "advanced": 최적화·튜닝(엘보·실루엣·GridSearch)·교차검증·진단·규제 경로·시뮬레이션.
   * 섹션 배열은 기본 → 고급 순으로 둔다.
   */
  level?: "basic" | "advanced";
  code: string;
}

/** 주요 파라미터·옵션 해설 한 줄 — 팝업 '주요 파라미터·옵션' 섹션 */
export interface MethodParam {
  name: string;
  desc: string;
}

export interface StatMethod {
  id: string;
  /** 클라우드에 표시되는 한글 이름 */
  name: string;
  en: string;
  category: MethodCategoryId;
  /** 실무 사용 빈도 1~5 — 클수록 글자가 크고 사분면 중심에 가깝다(가로축) */
  weight: 1 | 2 | 3 | 4 | 5;
  /** 체감 난이도 1~5 — 사분면 세로축: 중심선에서 멀수록 어렵다 */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** 주요 파라미터·옵션 해설 — 팝업 '주요 파라미터·옵션' 섹션 */
  params: MethodParam[];
  /**
   * 웹 실행기(Pyodide) 지원 수준 — 미지정 시 "full".
   * "none": 필요한 패키지가 브라우저에 없어 실행 불가.
   * "partial": 일부 블록만 실행 가능(대체 코드로 우회).
   */
  webSupport?: "full" | "partial" | "none";
  /** 웹 제한 안내 문구(webSupport가 none/partial일 때) */
  webNote?: string;
  /** 한 줄 요약 (툴팁·팝업 서브타이틀) */
  summary: string;
  /** 개념·용도 설명 — "\n\n"으로 문단 구분 */
  intro: string;
  /** 해석·주의 포인트(선택) */
  tips?: string;
  sections: MethodCodeSection[];
}

/** 전체 코드 결합 — 블록 제목을 주석으로 달아 이어붙임(복사·실행기 로드 공용) */
export function methodFullCode(m: StatMethod): string {
  return m.sections
    .map((s) => `# ── ${s.title} ──\n${s.code.trim()}`)
    .join("\n\n\n");
}

export const STAT_CATEGORIES: MethodCategory[] = [
  {
    id: "basic",
    label: "기초 통계",
    color: "blue",
    hint: "분포 요약과 가설검정 — 분석의 출발점",
  },
  {
    id: "model",
    label: "회귀·통계모형",
    color: "violet",
    hint: "관계를 수식으로 — 설명과 예측",
  },
  {
    id: "ml",
    label: "머신러닝",
    color: "teal",
    hint: "전통 ML — 지도·비지도 학습과 검증",
  },
  {
    id: "actuarial",
    label: "보험·계리",
    color: "rose",
    hint: "위험률·준비금·요율 — 보험 고유의 계산",
  },
  {
    id: "wrangle",
    label: "데이터 핸들링",
    color: "amber",
    hint: "pandas 기본기 — 선택·결합·집계·변형",
  },
];

export const STAT_METHODS: StatMethod[] = [
  /* ───────────────────────── 기초 통계 (basic) ───────────────────────── */
  {
    id: "desc-stats",
    name: "기술통계량",
    en: "Descriptive Statistics",
    category: "basic",
    weight: 5,
    difficulty: 1,
    params: [
      { name: "describe(percentiles=[...])", desc: "기본 25·50·75% 외에 원하는 분위수를 지정합니다. 예: percentiles=[0.1, 0.9, 0.99] — 보험 손해액이면 99% 꼬리 확인에 유용." },
      { name: "describe(include=...)", desc: "기본은 수치형만 요약. 'object'면 문자 열만(고유값·최빈값), 'all'이면 전체 열을 한 표로 요약합니다." },
      { name: "mean(skipna=...) 등 공통 옵션", desc: "통계 메서드 공통으로 결측 제외 여부를 정합니다(기본 True). False면 결측이 하나라도 있으면 결과가 NaN." },
      { name: "quantile(q, interpolation=...)", desc: "분위수 위치가 관측값 사이일 때의 보간 방식 — 'linear'(기본)·'nearest'·'lower'·'higher'. 규제 보고 기준에 따라 맞춥니다." },
      { name: "value_counts(normalize=, dropna=)", desc: "normalize=True면 빈도 대신 비율, dropna=False면 결측도 하나의 범주로 셉니다." },
    ],
    summary: "평균·중앙값·표준편차·분위수로 데이터 분포를 한눈에 요약",
    intro:
      "데이터를 받으면 가장 먼저 수행하는 작업입니다. 평균·중앙값 같은 중심 경향, 표준편차·분위수 같은 산포, 왜도·첨도 같은 분포 모양을 숫자로 요약해 데이터의 전체 그림과 이상치 존재 여부를 파악합니다.\n\n보험 손해액처럼 오른쪽 꼬리가 긴 분포에서는 평균이 소수의 대형 사고에 끌려 올라가므로, 반드시 중앙값·분위수와 함께 봐야 왜곡 없이 해석할 수 있습니다.",
    tips: "평균과 중앙값의 차이가 크면 분포가 비대칭(왜도)이라는 신호입니다. describe()의 count가 열마다 다르면 결측치가 있다는 뜻이므로 결측치 처리로 이어가세요.",
    sections: [
      {
        title: "기본 요약 — describe()와 개별 통계량",
        desc: "describe() 한 줄로 수치형 열 전체를 요약하고, 필요한 통계량은 개별 메서드로 뽑습니다.",
        level: "basic",
        code: `import pandas as pd

df = pd.read_excel("claims.xlsx")   # 보험금 청구 데이터 예시

# 수치형 전체 요약: 개수·평균·표준편차·최소·사분위수·최대
print(df.describe())
# 범주형(문자) 열 요약: 고유값 수·최빈값
print(df.describe(include="object"))

# 개별 통계량
print(df["claim_amt"].mean())      # 평균
print(df["claim_amt"].median())    # 중앙값 — 꼬리가 긴 분포에서 더 대표적
print(df["claim_amt"].std())       # 표준편차
print(df["claim_amt"].quantile([0.25, 0.5, 0.75, 0.99]))  # 분위수(99% 등 임의 지정)
print(df["claim_amt"].skew())      # 왜도 > 0 이면 오른쪽 꼬리
print(df["claim_amt"].kurt())      # 첨도 — 꼬리의 두꺼움
print(df["product"].value_counts())  # 범주별 빈도`,
      },
      {
        title: "그룹별 요약 — 한 번에 여러 통계량",
        desc: "groupby와 agg를 결합하면 상품군·성별 등 그룹 단위 요약표가 바로 나옵니다.",
        level: "basic",
        code: `# 상품군별 손해액 요약표
summary = df.groupby("product")["claim_amt"].agg(
    건수="count",
    평균="mean",
    중앙값="median",
    표준편차="std",
    최대="max",
)
print(summary.round(1))`,
      },
    ],
  },
  {
    id: "correlation",
    name: "상관분석",
    en: "Correlation",
    category: "basic",
    weight: 4,
    difficulty: 2,
    params: [
      { name: "corr(method=...)", desc: "'pearson'(선형, 기본)·'spearman'(순위 — 비선형 단조·이상치 강건)·'kendall'(순위, 소표본에서 안정). 이상치가 의심되면 spearman으로 교차 확인." },
      { name: "corr(min_periods=...)", desc: "상관 계산에 필요한 최소 관측쌍 수. 결측이 많은 열에서 관측 몇 개로 계산된 미덥지 않은 상관을 걸러냅니다." },
      { name: "corr(numeric_only=True)", desc: "문자 열이 섞인 DataFrame에서 수치형만 골라 계산합니다." },
      { name: "stats.pearsonr / spearmanr", desc: "p-value가 필요하면 scipy를 씁니다. spearmanr는 nan_policy='omit'으로 결측 제외를 지원합니다." },
    ],
    summary: "두 연속형 변수의 선형(피어슨)·순위(스피어만) 관계 강도를 -1~+1로 측정",
    intro:
      "두 변수가 함께 움직이는 정도를 -1(완전 음의 관계)부터 +1(완전 양의 관계) 사이 계수로 요약합니다. 피어슨 상관은 선형 관계를 재고, 스피어만 상관은 순위 기반이라 비선형 단조 관계와 이상치에 강건합니다.\n\n모델링 전 변수 간 관계를 훑어보거나, 설명변수끼리 지나치게 상관이 높은지(다중공선성) 점검할 때 기본 도구가 됩니다.",
    tips: "상관은 인과가 아닙니다. 또 피어슨 상관은 이상치 몇 개에 크게 흔들리므로 산점도를 함께 확인하고, 의심되면 스피어만으로 교차 검증하세요.",
    sections: [
      {
        title: "상관계수와 상관행렬",
        level: "basic",
        code: `import pandas as pd

df = pd.read_excel("policy.xlsx")

# 두 변수의 상관계수
print(df["age"].corr(df["premium"]))                 # 피어슨(기본)
print(df["age"].corr(df["premium"], method="spearman"))  # 스피어만(순위)

# 수치형 전체 상관행렬
corr = df.select_dtypes("number").corr()
print(corr.round(2))`,
      },
      {
        title: "유의성 검정과 히트맵",
        desc: "scipy로 p-value까지 확인하고, 행렬은 히트맵으로 보면 빠르게 읽힙니다.",
        level: "advanced",
        code: `from scipy import stats
import matplotlib.pyplot as plt

r, p = stats.pearsonr(df["age"], df["premium"])
print(f"r={r:.3f}, p-value={p:.4f}")   # p < 0.05 이면 상관이 0이라는 가설 기각

plt.figure(figsize=(7, 6))
plt.imshow(corr, cmap="Blues", vmin=-1, vmax=1)
plt.xticks(range(len(corr)), corr.columns, rotation=45)
plt.yticks(range(len(corr)), corr.columns)
plt.colorbar(label="correlation")
plt.tight_layout()
plt.show()`,
      },
    ],
  },
  {
    id: "t-test",
    name: "t-검정",
    en: "t-test",
    category: "basic",
    weight: 4,
    difficulty: 2,
    params: [
      { name: "equal_var (ttest_ind)", desc: "True면 등분산 가정(Student t), False면 Welch t — 두 집단 분산이 같다는 가정이 불필요해 False를 기본으로 권장합니다." },
      { name: "alternative", desc: "'two-sided'(기본, 다르다)·'greater'·'less'(단측 — 방향 가설이 명확할 때). 세 함수(1samp·ind·rel) 공통." },
      { name: "nan_policy", desc: "'propagate'(기본 — 결측 있으면 결과 NaN)·'omit'(결측 제외 후 계산)." },
      { name: "popmean (ttest_1samp)", desc: "일표본 검정의 비교 기준값 — 예: 가정 평균 100만 원." },
      { name: "trim (ttest_ind)", desc: "0~0.5 비율만큼 양끝을 잘라낸 절사 t-검정(Yuen) — 이상치 영향을 완화합니다." },
    ],
    summary: "두 집단(또는 한 집단과 기준값)의 평균 차이가 우연인지 검정",
    intro:
      "평균 차이가 표본의 우연한 흔들림인지, 실제 차이인지 판단하는 가장 기본적인 가설검정입니다. 한 집단의 평균을 기준값과 비교하는 일표본, 서로 다른 두 집단을 비교하는 독립표본, 같은 대상의 전후를 비교하는 대응표본 세 가지가 있습니다.\n\n예컨대 남녀 가입자의 평균 청구액 차이, 제도 개정 전후의 평균 손해율 변화 같은 질문에 바로 적용됩니다.",
    tips: "독립 이표본에서는 equal_var=False(Welch 검정)를 기본으로 쓰는 것이 안전합니다 — 두 집단의 분산이 같다는 가정을 요구하지 않습니다. p-value와 함께 평균 차이의 크기(효과 크기)도 반드시 같이 보고하세요.",
    sections: [
      {
        title: "일표본·독립 이표본·대응표본",
        level: "basic",
        code: `from scipy import stats
import pandas as pd

df = pd.read_excel("claims.xlsx")

# ① 일표본: 평균 청구액이 100만 원과 다른가?
t, p = stats.ttest_1samp(df["claim_amt"], popmean=1_000_000)
print(f"일표본  t={t:.3f}, p={p:.4f}")

# ② 독립 이표본: 남녀의 평균 청구액이 다른가? (Welch — 등분산 가정 불필요)
male = df.loc[df["sex"] == "M", "claim_amt"]
female = df.loc[df["sex"] == "F", "claim_amt"]
t, p = stats.ttest_ind(male, female, equal_var=False)
print(f"이표본  t={t:.3f}, p={p:.4f}")

# ③ 대응표본: 같은 계약의 개정 전/후 보험료 비교
t, p = stats.ttest_rel(df["prem_before"], df["prem_after"])
print(f"대응    t={t:.3f}, p={p:.4f}")

# p < 0.05 → 유의수준 5%에서 '차이가 없다'는 귀무가설 기각`,
      },
      {
        title: "가정 점검·효과크기 — 정규성·등분산·Cohen's d",
        desc: "t-검정 전 가정을 확인하고, p-value와 함께 효과 크기를 보고합니다.",
        level: "advanced",
        code: `from scipy import stats
import numpy as np

# ① 정규성(집단별 Shapiro) — p < 0.05 이면 정규 위배(→ Mann-Whitney 대체 고려)
for name, g in [("남", male), ("여", female)]:
    s = g.dropna()
    p = stats.shapiro(s.sample(min(len(s), 5000), random_state=0))[1]
    print(f"{name} 정규성 p = {p:.4f}")

# ② 등분산성(Levene) — p < 0.05 이면 분산이 다름(Welch t가 안전)
lev_p = stats.levene(male.dropna(), female.dropna())[1]
print(f"Levene 등분산 p = {lev_p:.4f}  ({'분산 다름' if lev_p < 0.05 else '등분산 양호'})")

# ③ 효과 크기(Cohen's d) — 0.2 작음·0.5 중간·0.8 큼 (유의성과 별개로 크기 보고)
a, b = male.dropna(), female.dropna()
sp = np.sqrt(((len(a)-1)*a.var(ddof=1) + (len(b)-1)*b.var(ddof=1)) / (len(a)+len(b)-2))
d = (a.mean() - b.mean()) / sp
print(f"Cohen's d = {d:.3f}")`,
      },
    ],
  },
  {
    id: "chi-square",
    name: "카이제곱 검정",
    en: "Chi-square Test",
    category: "basic",
    weight: 3,
    difficulty: 2,
    params: [
      { name: "chi2_contingency(correction=...)", desc: "2×2 표의 Yates 연속성 보정(기본 True). 표본이 충분히 크면 False로 원래 통계량을 씁니다." },
      { name: "chi2_contingency(lambda_=...)", desc: "통계량 계열 선택 — 'log-likelihood'면 G-검정으로 계산합니다." },
      { name: "crosstab(normalize=...)", desc: "'index'(행 기준 %)·'columns'(열 기준 %)·'all'(전체 %) — 해석용 비율표." },
      { name: "crosstab(margins=True)", desc: "행·열 합계(All)를 붙입니다. margins_name으로 이름 변경." },
      { name: "stats.fisher_exact(table)", desc: "기대빈도가 작은 2×2 표의 대안(정확검정) — 카이제곱 근사가 불안할 때." },
    ],
    summary: "두 범주형 변수의 독립성(연관성) 여부를 교차표로 검정",
    intro:
      "성별과 상품 선택, 연령대와 해지 여부처럼 범주형 변수 두 개가 서로 관련이 있는지 검정합니다. 교차표(crosstab)를 만들고, '두 변수가 독립'이라는 가정 하의 기대빈도와 실제 관측빈도의 차이를 카이제곱 통계량으로 잽니다.\n\n관측빈도가 기대빈도에서 멀수록 통계량이 커지고 p-value가 작아져, 두 변수가 독립이 아니라고(연관이 있다고) 결론 내립니다.",
    tips: "기대빈도가 5 미만인 칸이 많으면(전체의 20% 이상) 검정이 부정확해집니다 — 범주를 합치거나 fisher_exact(2×2)를 쓰세요. 유의하더라도 '어떤 칸이' 기여했는지는 기대빈도와의 잔차를 봐야 압니다.",
    sections: [
      {
        title: "교차표 + 독립성 검정",
        level: "basic",
        code: `import pandas as pd
from scipy import stats

df = pd.read_excel("policy.xlsx")

# 연령대 × 해지여부 교차표
table = pd.crosstab(df["age_band"], df["lapsed"])
print(table)

chi2, p, dof, expected = stats.chi2_contingency(table)
print(f"chi2={chi2:.2f}, p={p:.4f}, 자유도={dof}")

# 기대빈도 확인 — 5 미만 칸이 많으면 검정 신뢰도 저하
print(pd.DataFrame(expected, index=table.index, columns=table.columns).round(1))

# 비율로 보면 해석이 쉬움 (행 기준 %)
print(pd.crosstab(df["age_band"], df["lapsed"], normalize="index").round(3))`,
      },
      {
        title: "효과크기 — Cramér's V·조정된 잔차",
        desc: "유의성(p)과 별개로 연관의 '세기'와 어느 칸이 기여했는지를 봅니다. 칸별 판정은 Pearson 잔차가 아니라 조정된 잔차로 해야 합니다 — 이유를 아래에서 확인합니다.",
        level: "advanced",
        code: `import numpy as np

# ① Cramér's V — 0(무관)~1(완전연관). 0.1 약함·0.3 중간·0.5 강함
n = table.values.sum()
k = min(table.shape) - 1
cramers_v = np.sqrt(chi2 / (n * k)) if k > 0 else np.nan
print(f"Cramér's V = {cramers_v:.3f}")

# ② Pearson 잔차 — 각 칸의 χ² 기여도(Σ r² = χ²). '진단용'이지 판정 기준이 아니다.
#    귀무가설에서 Var(r_ij) = (1−p_i·)(1−p_·j) < 1 이라 ±2로 판정하면 지나치게
#    보수적이다(실제 발화율이 명목 4.55%보다 훨씬 낮아 주도 칸을 놓친다).
pear_resid = (table.values - expected) / np.sqrt(expected)
print("Pearson 잔차 (χ² 기여도 — 상대 비교용):")
print(pd.DataFrame(pear_resid, index=table.index, columns=table.columns).round(2))

# ③ 조정된 잔차(adjusted residual) — 귀무가설에서 근사적으로 N(0,1).
#    |값| > 2 판정은 '이' 잔차에 적용한다(≈ 유의수준 5%).
row_p = table.values.sum(axis=1, keepdims=True) / n     # 행 비율 p_i·
col_p = table.values.sum(axis=0, keepdims=True) / n     # 열 비율 p_·j
adj_resid = (table.values - expected) / np.sqrt(expected * (1 - row_p) * (1 - col_p))
print("\\n조정된 잔차 (|값| > 2 = 연관을 주도하는 칸):")
print(pd.DataFrame(adj_resid, index=table.index, columns=table.columns).round(2))

# ④ 두 잔차의 배율 확인 — 같은 칸인데 판정이 갈릴 수 있다
print("\\n조정/Pearson 배율:")
print(pd.DataFrame(adj_resid / pear_resid, index=table.index,
                   columns=table.columns).round(2))`,
      },
    ],
  },
  {
    id: "anova",
    name: "분산분석(ANOVA)",
    en: "ANOVA",
    category: "basic",
    weight: 3,
    difficulty: 3,
    params: [
      { name: "anova_lm(typ=...)", desc: "제곱합 방식 1·2·3. 집단 크기가 불균형하거나 요인이 여러 개면 typ=2(또는 3)를 씁니다." },
      { name: "C(변수) — formula 범주 선언", desc: "C(product)처럼 범주형임을 명시. C(x, Treatment(reference='A'))로 기준 범주를 바꿀 수 있습니다." },
      { name: "pairwise_tukeyhsd(alpha=...)", desc: "사후검정 유의수준(기본 0.05). 결과의 reject 열이 True인 쌍이 유의하게 다른 집단." },
      { name: "등분산 깨졌을 때", desc: "anova_oneway(use_var='unequal')(Welch ANOVA) 또는 비모수 Kruskal-Wallis로 대체합니다." },
    ],
    summary: "세 개 이상 집단의 평균이 모두 같은지 한 번에 검정",
    intro:
      "집단이 3개 이상일 때 t-검정을 반복하면 1종 오류(우연한 유의)가 누적됩니다. 분산분석은 '모든 집단의 평균이 같다'는 가설을 한 번에 검정해 이 문제를 피합니다. 집단 간 분산과 집단 내 분산의 비(F 통계량)가 클수록 평균 차이가 실재한다고 봅니다.\n\n예컨대 상품군 A·B·C·D의 평균 손해액이 같은지, 판매 채널별 평균 계약 유지 기간이 같은지 검정할 때 사용합니다.",
    tips: "ANOVA가 유의해도 '어느 집단끼리' 다른지는 알 수 없습니다 — 사후검정(Tukey HSD)으로 쌍별 비교를 이어가세요. 집단별 분산이 크게 다르면 Welch ANOVA나 비모수(Kruskal-Wallis)를 고려합니다.",
    sections: [
      {
        title: "일원 분산분석 — scipy",
        level: "basic",
        code: `from scipy import stats
import pandas as pd

df = pd.read_excel("claims.xlsx")

groups = [g["claim_amt"].values for _, g in df.groupby("product")]
f, p = stats.f_oneway(*groups)
print(f"F={f:.2f}, p={p:.4f}")   # p < 0.05 → 적어도 한 집단의 평균이 다름`,
      },
      {
        title: "분산분석표 + 사후검정(Tukey HSD)",
        desc: "statsmodels로 분산분석표를 만들고, 유의하면 어느 쌍이 다른지 Tukey로 확인합니다.",
        level: "advanced",
        code: `import statsmodels.api as sm
import statsmodels.formula.api as smf
from statsmodels.stats.multicomp import pairwise_tukeyhsd

model = smf.ols("claim_amt ~ C(product)", data=df).fit()
print(sm.stats.anova_lm(model, typ=2))   # 분산분석표

tukey = pairwise_tukeyhsd(df["claim_amt"], df["product"], alpha=0.05)
print(tukey.summary())   # reject=True 인 쌍이 유의하게 다른 집단`,
      },
      {
        title: "가정 점검·효과크기 — 등분산(Levene)·잔차 정규성·eta²",
        desc: "분산분석의 등분산·정규성 가정을 확인하고 효과 크기를 보고합니다.",
        level: "advanced",
        code: `from scipy import stats
import statsmodels.api as sm

# ① 등분산성(Levene) — p < 0.05 이면 분산이 달라 비모수(Kruskal) 대안 권장
lev_p = stats.levene(*groups)[1]
print(f"Levene 등분산 p = {lev_p:.4f}  ({'분산 다름' if lev_p < 0.05 else '등분산 양호'})")
if lev_p < 0.05:
    print(f"→ 등분산 위배: Kruskal-Wallis p = {stats.kruskal(*groups)[1]:.4f} (비모수 대안)")

# ② 잔차 정규성(Shapiro) — model은 위 ols 적합
r = model.resid
print(f"잔차 Shapiro p = {stats.shapiro(r.sample(min(len(r), 5000), random_state=0))[1]:.4f}")

# ③ 효과 크기(eta²) — 전체 분산 중 집단이 설명하는 비율. 0.01 작음·0.06 중간·0.14 큼
tbl = sm.stats.anova_lm(model, typ=2)
eta_sq = tbl["sum_sq"].iloc[0] / tbl["sum_sq"].sum()
print(f"eta² = {eta_sq:.3f}")`,
      },
    ],
  },
  {
    id: "normality",
    name: "정규성 검정",
    en: "Normality Test",
    category: "basic",
    weight: 2,
    difficulty: 2,
    params: [
      { name: "shapiro(x)", desc: "소표본(수십~수천)에 적합. 5,000건 초과면 근사 경고가 나므로 표본 추출 후 검정하거나 시각 판단을 병행합니다." },
      { name: "kstest(x, 'norm', args=(m, s))", desc: "Kolmogorov-Smirnov — 비교 분포와 모수(평균·표준편차)를 직접 지정해야 합니다. 지정 없이 표준정규와 비교하는 실수 주의." },
      { name: "anderson(x, dist='norm')", desc: "Anderson-Darling — p-value 대신 유의수준별 임계값 표로 판정하며 꼬리에 민감합니다." },
      { name: "probplot(x, dist=...)", desc: "Q-Q 플롯의 비교 분포 변경 — 'lognorm' 등으로 바꿔 로그정규 적합 여부도 확인할 수 있습니다." },
    ],
    summary: "데이터가 정규분포를 따르는지 검정·시각 확인 — 모수 검정의 전제 점검",
    intro:
      "t-검정·ANOVA·선형회귀의 잔차 등 많은 전통 기법이 정규분포를 가정합니다. Shapiro-Wilk 검정(소표본에 적합)과 Q-Q 플롯(시각 확인)으로 이 가정을 점검합니다.\n\n정규성이 크게 깨져 있으면 로그 변환을 하거나 비모수 검정으로 우회합니다. 보험 손해액은 대개 정규가 아니므로 로그 변환 후 분석하는 경우가 많습니다.",
    tips: "표본이 수천 건 이상이면 사소한 편차에도 p-value가 유의하게 나옵니다 — 대표본에서는 검정보다 Q-Q 플롯·히스토그램 같은 시각 판단이 더 실용적입니다.",
    sections: [
      {
        title: "Shapiro-Wilk + Q-Q 플롯",
        level: "basic",
        code: `from scipy import stats
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_excel("claims.xlsx")
x = df["claim_amt"].dropna()

stat, p = stats.shapiro(x.sample(min(len(x), 5000), random_state=0))
print(f"Shapiro-Wilk p={p:.4f}")   # p < 0.05 → 정규 아님

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].hist(x, bins=50)
axes[0].set_title("histogram")
stats.probplot(x, dist="norm", plot=axes[1])   # 점들이 직선 위면 정규에 가까움
plt.tight_layout()
plt.show()

# 오른쪽 꼬리가 길면 로그 변환 후 재확인
stat, p = stats.shapiro(np.log1p(x).sample(min(len(x), 5000), random_state=0))
print(f"log 변환 후 p={p:.4f}")`,
      },
    ],
  },
  {
    id: "nonparametric",
    name: "비모수 검정",
    en: "Mann-Whitney · Wilcoxon · Kruskal",
    category: "basic",
    weight: 2,
    difficulty: 3,
    params: [
      { name: "alternative", desc: "세 검정 공통 — 'two-sided'(기본)·'greater'·'less' 단측 지정." },
      { name: "mannwhitneyu(method=...)", desc: "p-value 계산 방식 — 'auto'(기본)·'exact'(소표본 정확)·'asymptotic'(대표본 근사)." },
      { name: "wilcoxon(zero_method=...)", desc: "전후 차이가 0인 쌍의 처리 — 'wilcox'(기본, 제외)·'pratt'(순위에 포함) — 동점이 많으면 결과가 달라집니다." },
      { name: "kruskal(nan_policy='omit')", desc: "결측을 제외하고 검정합니다." },
    ],
    summary: "정규성 가정 없이 순위로 집단 차이를 검정 — t-검정·ANOVA의 대체재",
    intro:
      "데이터가 정규분포에서 크게 벗어나거나 표본이 작을 때, 원자료 대신 순위(rank)를 사용해 집단 차이를 검정합니다. 독립 두 집단은 Mann-Whitney U(t-검정 대체), 대응 표본은 Wilcoxon 부호순위(대응 t-검정 대체), 세 집단 이상은 Kruskal-Wallis(ANOVA 대체)를 씁니다.\n\n이상치와 꼬리가 긴 분포에 강건해, 손해액처럼 치우친 데이터의 집단 비교에 실무적으로 유용합니다.",
    tips: "비모수 검정은 '평균'이 아니라 '분포(중앙값) 위치'의 차이를 검정합니다. 결과 보고 시 평균 대신 집단별 중앙값을 함께 제시하는 것이 일관됩니다.",
    sections: [
      {
        title: "Mann-Whitney · Wilcoxon · Kruskal-Wallis",
        level: "basic",
        code: `from scipy import stats
import pandas as pd

df = pd.read_excel("claims.xlsx")

# ① 독립 두 집단 (t-검정의 비모수 대체)
male_amt = df.loc[df["sex"] == "M", "claim_amt"]
female_amt = df.loc[df["sex"] == "F", "claim_amt"]
u, p = stats.mannwhitneyu(male_amt, female_amt, alternative="two-sided")
print(f"Mann-Whitney p={p:.4f}")

# ② 대응 표본 (대응 t-검정의 비모수 대체)
w, p = stats.wilcoxon(df["prem_before"], df["prem_after"])
print(f"Wilcoxon p={p:.4f}")

# ③ 세 집단 이상 (ANOVA의 비모수 대체)
groups = [g["claim_amt"].values for _, g in df.groupby("product")]
h, p = stats.kruskal(*groups)
print(f"Kruskal-Wallis p={p:.4f}")

# 보고용: 집단별 중앙값
print(df.groupby("product")["claim_amt"].median())`,
      },
    ],
  },
  {
    id: "distributions",
    name: "분포 적합·난수 생성",
    en: "Distributions · Fitting · Simulation",
    category: "basic",
    weight: 3,
    difficulty: 3,
    params: [
      { name: "stats.<dist>.fit(data, floc=0)", desc: "MLE로 분포 모수 추정 — 반환은 (shape…, loc, scale). floc=0으로 위치를 0에 고정하면 손해액 같은 양의 분포가 안정적으로 적합됩니다." },
      { name: "pdf·cdf·ppf·rvs", desc: "확률밀도·누적확률·분위수(역함수)·난수 생성. ppf(0.995)는 99.5% 분위(꼬리 위험), rvs(size=, random_state=)는 재현 가능한 표본." },
      { name: "stats.kstest(x, '<dist>', args=params)", desc: "적합 분포와의 Kolmogorov–Smirnov 적합도 검정 — p가 크면 그 분포로 볼 만합니다(대표본에서는 사소한 차이도 기각)." },
      { name: "np.random.default_rng(seed)", desc: "권장 난수 생성기(Generator) — normal·lognormal·gamma·poisson·negative_binomial 등 메서드. seed로 재현성 확보." },
      { name: "rng.choice(a, size, replace=)", desc: "범주 추출·부트스트랩 — replace=True로 복원추출(부트스트랩), p=로 확률 지정." },
    ],
    summary: "주요 분포의 모양·적합(MLE)·적합도와 재현 가능한 난수 생성 — 손해액·건수 모형화의 기초",
    intro:
      "확률분포는 손해액·사고건수 같은 보험 데이터를 요약하고 시뮬레이션하는 언어입니다. 데이터가 어떤 이론 분포에 가까운지 눈과 검정으로 확인하고(적합), 그 분포에서 난수를 생성해 미래 시나리오·꼬리 위험을 실험합니다(시뮬레이션).\n\n손해심도는 오른쪽 꼬리가 길어 로그정규·감마·와이블이, 사고 건수는 포아송·음이항이 자주 쓰입니다. 적합한 분포는 요율 산출·준비금·재보험 설계의 출발점이 됩니다.",
    tips: "양의 분포(로그정규·감마)는 floc=0으로 위치를 고정해야 안정적으로 적합됩니다. 대표본에서는 KS 검정이 사소한 차이도 기각하니 AIC 비교·Q-Q 플롯을 함께 보고 고르세요. 난수는 default_rng(seed)로 재현성을 확보합니다.",
    sections: [
      {
        title: "주요 분포의 모양 — pdf·pmf 그리기",
        desc: "연속(심도 후보)·이산(건수 후보) 분포의 형태를 눈으로 익힙니다.",
        level: "basic",
        code: `import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

fig, ax = plt.subplots(1, 2, figsize=(11, 4))

# 연속 분포 — 손해심도 후보(오른쪽 꼬리). matplotlib 한글 폰트가 없어 라벨은 영문.
x = np.linspace(0.01, 20, 400)
ax[0].plot(x, stats.norm(8, 2).pdf(x), label="normal(8,2)")
ax[0].plot(x, stats.lognorm(s=0.6, scale=np.exp(2)).pdf(x), label="lognormal")
ax[0].plot(x, stats.gamma(a=2, scale=2).pdf(x), label="gamma(2,2)")
ax[0].plot(x, stats.expon(scale=4).pdf(x), label="expon(scale=4)")
ax[0].set_title("continuous pdf (severity)"); ax[0].legend()

# 이산 분포 — 사고건수 후보
k = np.arange(0, 12)
ax[1].vlines(k, 0, stats.poisson(2).pmf(k), color="C0", label="poisson(2)")
ax[1].vlines(k + 0.25, 0, stats.nbinom(n=3, p=0.5).pmf(k), color="C1", label="nbinom(3,0.5)")
ax[1].set_title("discrete pmf (counts)"); ax[1].legend()
plt.tight_layout(); plt.show()`,
      },
      {
        title: "지정 분포로 적합·난수 생성 — 분포 하나를 골라 바로 산출",
        desc: "후보를 비교하기 전에, 분포를 하나(로그정규) 지정해 MLE로 적합하고 평균·분위수·난수까지 한 번에 뽑아 봅니다.",
        level: "basic",
        code: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

df = pd.read_excel("claims.xlsx")
x = df["claim_amt"].dropna()
x = x[x > 0]                         # 양수만 — 로그정규의 정의역

# ① 분포를 하나 지정한다: 손해심도의 표준 후보인 로그정규.
#    바꿔볼 만한 값: stats.gamma · stats.weibull_min · stats.expon (아래 코드는 그대로 동작)
DIST = stats.lognorm

# ② MLE(최대가능도추정 — 관측된 데이터가 가장 그럴듯해지는 모수를 찾는 방법)로 적합.
#    floc=0 은 위치를 0에 고정 — 손해액은 0 미만이 없으므로 양의 분포에서 권장.
params = DIST.fit(x, floc=0)
print("추정 모수 (shape…, loc, scale):", np.round(params, 4))

# ③ frozen 분포 = 모수를 고정해 둔 객체. pdf·cdf·ppf·sf·rvs를 바로 쓸 수 있다.
fitted = DIST(*params)
print(f"이론 평균 {fitted.mean():,.0f} · 실제 평균 {x.mean():,.0f}")
print(f"이론 중앙값 {fitted.median():,.0f} · 실제 중앙값 {x.median():,.0f}")
print(f"99.5% 분위(VaR) {fitted.ppf(0.995):,.0f}")

# ④ 적합이 그럴듯한지 간단 확인 — 상위 10% 기준 초과확률을 이론↔실제로 대조
thr = x.quantile(0.9)
print(f"{thr:,.0f}원 초과확률: 이론 {fitted.sf(thr):.3f} · 실제 {(x > thr).mean():.3f}")

# ⑤ 적합 분포에서 난수 생성 — random_state 고정으로 재현 가능
sample = fitted.rvs(size=10_000, random_state=42)
print(f"난수 평균 {sample.mean():,.0f} · 난수 99.5% {np.quantile(sample, 0.995):,.0f}")

# ⑥ 히스토그램 위에 적합 pdf 겹쳐 그리기(한글 폰트가 없어 라벨은 영문)
grid = np.linspace(x.min(), x.quantile(0.99), 300)
plt.figure(figsize=(7, 4))
plt.hist(x, bins=40, density=True, alpha=0.45, label="observed")
plt.plot(grid, fitted.pdf(grid), lw=2, label="fitted lognormal")
plt.xlabel("claim amount"); plt.ylabel("density"); plt.legend()
plt.tight_layout(); plt.show()`,
      },
      {
        title: "데이터에 분포 적합(MLE) + 적합도 비교",
        desc: "여러 후보를 MLE로 적합하고 AIC·KS로 최적 분포를 고릅니다.",
        level: "advanced",
        code: `import numpy as np
import pandas as pd
from scipy import stats

df = pd.read_excel("claims.xlsx")
x = df["claim_amt"].dropna()
x = x[x > 0]                        # 양수만(로그정규·감마 전제)

candidates = ["lognorm", "gamma", "expon", "weibull_min"]
rows = []
for name in candidates:
    dist = getattr(stats, name)
    params = dist.fit(x, floc=0)             # 위치 0 고정
    ll = np.sum(dist.logpdf(x, *params))     # 로그우도
    aic = 2 * len(params) - 2 * ll
    ks_p = stats.kstest(x, name, args=params).pvalue
    rows.append({"분포": name, "AIC": aic, "KS_p": ks_p})

result = pd.DataFrame(rows).sort_values("AIC")   # AIC 작을수록 우수
print(result.to_string(index=False))
print("최적 분포(AIC 최소):", result.iloc[0]["분포"])`,
      },
      {
        title: "난수 생성·시뮬레이션 — 집합손해·부트스트랩",
        desc: "적합 모수로 미래를 시뮬레이션하고, 부트스트랩으로 평균의 불확실성을 잽니다.",
        level: "advanced",
        code: `import numpy as np
import pandas as pd

rng = np.random.default_rng(42)     # 재현 가능한 생성기

# 심도(로그정규)·건수(포아송) → 집합손해 몬테카를로
n_claims = rng.poisson(0.8, size=10_000)
total = np.array([rng.lognormal(13.2, 0.9, k).sum() if k else 0.0
                  for k in n_claims])
print(f"총손해 평균 {total.mean():,.0f} · 99.5%(VaR) {np.quantile(total, 0.995):,.0f}")

# 부트스트랩 — 평균 손해액의 95% 신뢰구간(분포 가정 없이)
df = pd.read_excel("claims.xlsx")
x = df["claim_amt"].dropna().to_numpy()
boot = np.array([rng.choice(x, size=len(x), replace=True).mean()
                 for _ in range(2000)])
lo, hi = np.quantile(boot, [0.025, 0.975])
print(f"평균 95% 부트스트랩 CI = [{lo:,.0f}, {hi:,.0f}]")`,
      },
    ],
  },
  /* ─────────────────────── 회귀·통계모형 (model) ─────────────────────── */
  {
    id: "linear-regression",
    name: "선형회귀",
    en: "Linear Regression",
    category: "model",
    weight: 5,
    difficulty: 2,
    params: [
      { name: "ols(formula) — 식 문법", desc: "C(x) 범주형, np.log(y) 변환, x1:x2(상호작용만)·x1*x2(주효과+상호작용), - 1(절편 제거)까지 식으로 표현합니다." },
      { name: "fit(cov_type='HC3')", desc: "이분산(잔차 깔때기 모양)일 때 강건 표준오차로 p-value를 보정합니다." },
      { name: "conf_int(alpha=...)", desc: "계수 신뢰구간 수준 — 기본 0.05(95%). 보고서 기준에 맞춰 조정." },
      { name: "LinearRegression(fit_intercept=...)", desc: "절편 포함 여부(기본 True). 원점 통과가 이론적으로 맞을 때만 False." },
      { name: "LinearRegression(positive=True)", desc: "계수를 비음수로 제약 — 요율 인자처럼 음수가 비논리적인 경우." },
    ],
    summary: "연속형 목표변수를 설명변수의 선형 결합으로 설명·예측하는 기본 모형",
    intro:
      "y = b0 + b1·x1 + b2·x2 + … 형태로, 설명변수가 한 단위 변할 때 목표변수가 얼마나 변하는지(계수)를 추정합니다. 예측뿐 아니라 '무엇이 얼마나 영향을 주는가'를 계수·p-value·신뢰구간으로 설명할 수 있어 통계 모델링의 출발점입니다.\n\n설명이 목적이면 statsmodels(요약표가 풍부), 예측 파이프라인이 목적이면 scikit-learn을 쓰는 것이 관례입니다.",
    tips: "R²는 설명력이지 인과가 아닙니다. 계수 해석 전에 잔차 플롯(등분산·선형성)과 다중공선성(VIF > 10 주의)을 점검하세요. 변수 척도가 다르면 표준화해야 계수 크기를 서로 비교할 수 있습니다.",
    sections: [
      {
        title: "statsmodels — 회귀 요약표 (설명 중심)",
        level: "basic",
        code: `import pandas as pd
import statsmodels.formula.api as smf

df = pd.read_excel("policy.xlsx")

# 보험료 ~ 나이 + 성별(범주) + BMI
model = smf.ols("premium ~ age + C(sex) + bmi", data=df).fit()
print(model.summary())
# 읽는 법:
#  coef      — 다른 변수가 고정일 때 해당 변수 1단위 증가의 효과
#  P>|t|     — 0.05 미만이면 유의
#  [0.025, 0.975] — 계수의 95% 신뢰구간
#  R-squared — 모형이 설명하는 분산 비율`,
      },
      {
        title: "scikit-learn — 학습·예측 (예측 중심)",
        level: "basic",
        code: `from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

X = df[["age", "bmi", "dependents"]]
y = df["premium"]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

reg = LinearRegression().fit(X_tr, y_tr)
pred = reg.predict(X_te)

print(dict(zip(X.columns, reg.coef_.round(2))))       # 계수
print(f"RMSE = {np.sqrt(mean_squared_error(y_te, pred)):,.0f}")
print(f"R2   = {r2_score(y_te, pred):.3f}")`,
      },
      {
        title: "잔차 진단",
        desc: "잔차가 0 주위에 무작위로 흩어져 있어야 선형·등분산 가정이 성립합니다.",
        level: "advanced",
        code: `import matplotlib.pyplot as plt

resid = y_te - pred
plt.scatter(pred, resid, s=8, alpha=0.5)
plt.axhline(0, color="gray", lw=1)
plt.xlabel("predicted")
plt.ylabel("residual")
plt.show()
# 깔때기 모양(분산 증가) → 로그 변환·가중회귀 고려
# 곡선 패턴 → 비선형 항(다항·구간화) 고려`,
      },
      {
        title: "회귀 가정 진단 — 다중공선성·등분산성·자기상관·정규성",
        desc: "계수 해석 전에 반드시 점검. statsmodels model(=ols 적합)과 df가 필요합니다.",
        level: "advanced",
        code: `import numpy as np
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.stats.stattools import durbin_watson
from scipy import stats

# ① 다중공선성(VIF) — 보통 VIF > 10 이면 공선성 우려(계수·부호 불안정)
num_cols = ["age", "bmi", "dependents"]
Xc = sm.add_constant(df[num_cols].dropna())
vif = pd.DataFrame({
    "변수": Xc.columns,
    "VIF": [variance_inflation_factor(Xc.values, i) for i in range(Xc.shape[1])],
})
print("[VIF]\\n", vif.round(2), "\\n")

# ② 등분산성(Breusch-Pagan) — p < 0.05 이면 이분산(등분산 위배 → 강건 표준오차)
bp_stat, bp_p, _, _ = het_breuschpagan(model.resid, model.model.exog)
print(f"Breusch-Pagan p = {bp_p:.4f}  ({'이분산 의심' if bp_p < 0.05 else '등분산 양호'})")

# ③ 자기상관(Durbin-Watson) — 2 근처면 무자기상관(1.5~2.5 양호)
print(f"Durbin-Watson  = {durbin_watson(model.resid):.3f}")

# ④ 잔차 정규성(Shapiro) — p < 0.05 이면 정규 위배
r = model.resid
sh_p = stats.shapiro(r.sample(min(len(r), 5000), random_state=0))[1]
print(f"잔차 Shapiro p = {sh_p:.4f}  ({'정규 아님' if sh_p < 0.05 else '정규 양호'})")`,
      },
      {
        title: "규제·제약 옵션 — Ridge/Lasso(특정 alpha)·비음수·절편",
        desc: "선형회귀에 조건(제약)을 걸어 산출합니다. 규제는 특정 alpha를 직접 지정할 수 있습니다.",
        level: "advanced",
        code: `from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.model_selection import train_test_split
import pandas as pd

X = df[["age", "bmi", "dependents"]]
y = df["premium"]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

# ① 규제(penalty) — 계수 크기에 벌점. alpha↑ 이면 계수를 더 강하게 수축(과적합·공선성 완화)
ridge = Ridge(alpha=5.0).fit(X_tr, y_tr)     # L2: 고르게 축소
lasso = Lasso(alpha=0.1).fit(X_tr, y_tr)     # L1: 일부 계수 0(변수 선택)

# ② 비음수 제약 — 계수 ≥ 0 (요율 인자처럼 음수가 비논리적일 때)
nonneg = LinearRegression(positive=True).fit(X_tr, y_tr)

# ③ 절편 제거 — 원점 통과가 이론적으로 맞을 때만
no_int = LinearRegression(fit_intercept=False).fit(X_tr, y_tr)

for name, m in [("Ridge(5)", ridge), ("Lasso(0.1)", lasso), ("비음수", nonneg)]:
    print(name, dict(zip(X.columns, m.coef_.round(2))))
# 규제 강도(alpha)는 값에 민감하니 척도가 다르면 StandardScaler로 표준화 후 비교하세요.`,
      },
      {
        title: "시뮬레이션(난수 생성) — 합성데이터·부트스트랩·몬테카를로",
        desc: "알려진 계수로 데이터를 만들어 추정 절차를 검증하고, 재표집으로 불확실성을 잽니다. (샘플 없이 바로 실행)",
        level: "advanced",
        code: `import numpy as np
import pandas as pd
import statsmodels.formula.api as smf

rng = np.random.default_rng(0)
n = 500

# ① 참 계수(β=100, 2, -5)로 합성 데이터 생성 → 추정이 계수를 복원하는지 검증
sim = pd.DataFrame({"x1": rng.normal(50, 10, n), "x2": rng.normal(0, 1, n)})
sim["y"] = 100 + 2.0 * sim["x1"] - 5.0 * sim["x2"] + rng.normal(0, 8, n)
fit = smf.ols("y ~ x1 + x2", data=sim).fit()
print("추정 계수:", fit.params.round(2).to_dict())   # 100·2·-5 근처면 절차가 건전

# ② 부트스트랩 — 계수의 95% 신뢰구간(분포 가정 없이 재표집)
coefs = np.array([
    smf.ols("y ~ x1 + x2", data=sim.sample(n, replace=True)).fit().params.values
    for _ in range(500)
])
print("x1 계수 95% CI =", np.round(np.quantile(coefs[:, 1], [0.025, 0.975]), 3))

# ③ 몬테카를로 예측구간 — 잔차를 재표집해 예측 불확실성 반영
mu = fit.predict(pd.DataFrame({"x1": [55], "x2": [0.5]})).iloc[0]
draws = mu + rng.choice(fit.resid.to_numpy(), 10_000, replace=True)
print(f"예측 {mu:,.1f} · 90% 구간 [{np.quantile(draws, 0.05):,.1f}, {np.quantile(draws, 0.95):,.1f}]")`,
      },
    ],
  },
  {
    id: "logistic-regression",
    name: "로지스틱 회귀",
    en: "Logistic Regression",
    category: "model",
    weight: 5,
    difficulty: 3,
    params: [
      { name: "C", desc: "규제 강도의 역수(기본 1.0) — 작을수록 규제가 강해 계수가 줄어듭니다. 과적합이면 낮추고, 과소적합이면 높입니다." },
      { name: "penalty", desc: "'l2'(기본)·'l1'(계수 일부를 0으로 — 변수 선택)·'elasticnet'·None. solver와 짝이 맞아야 합니다('l1'은 liblinear/saga)." },
      { name: "class_weight", desc: "'balanced'면 클래스 빈도 역수로 가중 — 해지 5%처럼 불균형할 때 소수 클래스를 놓치지 않게 합니다." },
      { name: "solver / max_iter", desc: "'lbfgs'(기본)·'liblinear'(소규모)·'saga'(대규모·L1). 수렴 경고가 나면 max_iter를 1000 이상으로." },
      { name: "statsmodels .fit(disp=0)", desc: "최적화 로그 출력을 숨깁니다. 요약표는 summary()로." },
    ],
    summary: "이진 결과(해지/유지, 사고/무사고)의 확률을 모형화 — 오즈비로 해석",
    intro:
      "목표가 0/1일 때 사건이 일어날 확률을 모형화합니다. 계수를 지수변환한 오즈비(odds ratio)가 '이 변수가 1단위 커지면 사건의 오즈가 몇 배가 되는가'를 말해 주어, 해지 예측·사고 발생·언더라이팅 승인 같은 분류 문제에서 설명력과 예측력을 동시에 제공합니다.\n\n출력이 확률이므로 임계값(기본 0.5)을 업무 비용에 맞게 조정할 수 있다는 점도 실무에서 중요한 장점입니다.",
    tips: "클래스가 불균형하면(해지 5% 등) accuracy는 무의미합니다 — ROC-AUC·재현율로 평가하고 class_weight='balanced'를 고려하세요. 오즈비 해석은 '확률이 몇 배'가 아니라 '오즈가 몇 배'임에 주의합니다.",
    sections: [
      {
        title: "statsmodels — 오즈비 해석",
        level: "basic",
        code: `import numpy as np
import statsmodels.formula.api as smf

# 목표변수는 0/1 이어야 합니다(불리언이면 변환 — statsmodels formula 요구).
# 원본 df는 건드리지 않고 사본에서 변환.
d = df.assign(lapsed=df["lapsed"].astype(int))

model = smf.logit("lapsed ~ age + premium_ratio + C(channel)", data=d).fit()
print(model.summary())

# 오즈비: exp(coef) — 1보다 크면 해지 위험 증가 요인
odds = np.exp(model.params)
conf = np.exp(model.conf_int())
print(pd.concat([odds.rename("OR"), conf], axis=1).round(3))`,
      },
      {
        title: "scikit-learn — 학습·확률 예측·평가",
        level: "basic",
        code: `from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report

X = df[["age", "premium_ratio", "tenure_months"]]
y = df["lapsed"]
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

clf = LogisticRegression(max_iter=1000, class_weight="balanced")
clf.fit(X_tr, y_tr)

proba = clf.predict_proba(X_te)[:, 1]        # 해지 확률
print(f"ROC-AUC = {roc_auc_score(y_te, proba):.3f}")

# 업무 비용에 맞춰 임계값 조정 (기본 0.5 대신 0.3 등)
pred = (proba >= 0.3).astype(int)
print(classification_report(y_te, pred))`,
      },
      {
        title: "진단·성능 — 다중공선성(VIF)·의사결정계수·분류 지표",
        desc: "설명변수 공선성과 모형 적합도·분류 성능을 함께 점검합니다.",
        level: "advanced",
        code: `import numpy as np
import statsmodels.api as sm
from statsmodels.stats.outliers_influence import variance_inflation_factor
from sklearn.metrics import (confusion_matrix, accuracy_score,
                             roc_auc_score, average_precision_score)

# ① 다중공선성(VIF) — 설명변수끼리 상관이 높으면 오즈비 해석 불안정
feats = ["age", "premium_ratio", "tenure_months"]
Xc = sm.add_constant(df[feats].dropna())
vif = [variance_inflation_factor(Xc.values, i) for i in range(Xc.shape[1])]
print("[VIF]", dict(zip(Xc.columns, np.round(vif, 2))))

# ② McFadden 유사결정계수(pseudo R²) — 0.2~0.4면 양호(선형회귀 R²보다 낮게 나옴)
print(f"McFadden pseudo R2 = {model.prsquared:.3f}")

# ③ 분류 성능 — 정확도·ROC-AUC·PR-AUC·혼동행렬(임계값 0.5)
pred05 = (proba >= 0.5).astype(int)
print(f"정확도    = {accuracy_score(y_te, pred05):.3f}")
print(f"ROC-AUC   = {roc_auc_score(y_te, proba):.3f}")
print(f"PR-AUC    = {average_precision_score(y_te, proba):.3f}  (불균형에 민감)")
print("혼동행렬\\n", confusion_matrix(y_te, pred05))`,
      },
      {
        title: "규제 조건 — penalty(l1/l2/elasticnet)·C로 강도 지정",
        desc: "로지스틱은 기본이 L2 규제. 조건(penalty·C)을 바꿔 각각 산출합니다. C는 규제 강도의 역수(작을수록 강함).",
        level: "advanced",
        code: `from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

X = df[["age", "premium_ratio", "tenure_months"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2,
                                          stratify=y, random_state=42)

variants = {
    "L2, C=1":     LogisticRegression(penalty="l2", C=1.0, max_iter=1000),
    "L2, C=0.05":  LogisticRegression(penalty="l2", C=0.05, max_iter=1000),      # 강한 규제
    "L1, C=0.5":   LogisticRegression(penalty="l1", C=0.5, solver="liblinear"),   # 변수 선택
    "ElasticNet":  LogisticRegression(penalty="elasticnet", C=0.5, l1_ratio=0.5,
                                      solver="saga", max_iter=5000),
}
for name, clf in variants.items():
    clf.fit(X_tr, y_tr)
    nz = int((clf.coef_[0] != 0).sum())
    print(f"{name}: 0아닌 계수 {nz}개, test 정확도 {clf.score(X_te, y_te):.3f}")

# statsmodels로 L1 규제 적합 — 변수 선택 + 오즈비 해석
import statsmodels.formula.api as smf
import numpy as np
d = df.assign(lapsed=df["lapsed"].astype(int))
reg = smf.logit("lapsed ~ age + premium_ratio + tenure_months",
                data=d).fit_regularized(alpha=0.1, disp=0)   # alpha=벌점 강도
print("규제 오즈비:", np.exp(reg.params).round(3).to_dict())`,
      },
      {
        title: "시뮬레이션(난수 생성) — 로짓으로 이진결과 생성·오즈비 복원",
        desc: "참 계수로 0/1 결과를 시뮬레이션해 로지스틱이 오즈비를 복원하는지 검증합니다. (샘플 없이 바로 실행)",
        level: "advanced",
        code: `import numpy as np
import pandas as pd
import statsmodels.formula.api as smf

rng = np.random.default_rng(1)
n = 2000

# 참 계수로 로짓 → 확률 → 베르누이(0/1) 생성
d = pd.DataFrame({"age": rng.normal(45, 12, n), "ratio": rng.normal(0.3, 0.1, n)})
lin = -3 + 0.04 * d["age"] + 2.0 * d["ratio"]
prob = 1 / (1 + np.exp(-lin))
d["lapsed"] = (rng.random(n) < prob).astype(int)

m = smf.logit("lapsed ~ age + ratio", data=d).fit(disp=0)
print("추정 계수:", m.params.round(3).to_dict())      # -3·0.04·2.0 근처
print("오즈비:", np.exp(m.params).round(3).to_dict())

# 부트스트랩으로 오즈비 신뢰구간
ors = [np.exp(smf.logit("lapsed ~ age + ratio",
        data=d.sample(n, replace=True)).fit(disp=0).params["age"])
       for _ in range(300)]
print("age 오즈비 95% CI =", np.round(np.quantile(ors, [0.025, 0.975]), 3))`,
      },
    ],
  },
  {
    id: "glm",
    name: "일반화선형모형(GLM)",
    en: "GLM — Poisson · NegBinom · Gamma",
    category: "model",
    weight: 3,
    difficulty: 4,
    params: [
      { name: "family", desc: "목표변수 분포 — Poisson(건수)·NegativeBinomial(과산포 건수, 분산=μ+α·μ²)·Gamma(양의 연속, 심도)·Binomial(비율)·Tweedie(0 뭉침+연속 꼬리, 순보험료 직접 모형화)." },
      { name: "link", desc: "링크함수. Gamma의 기본은 inverse이므로 요율 승수 해석을 원하면 link=Log()를 명시해야 합니다." },
      { name: "offset / exposure", desc: "노출 반영 — offset=np.log(exposure) 또는 exposure=... (내부에서 log 적용, 계수 1 고정). 노출이 다른 계약을 섞을 때 필수." },
      { name: "var_weights / freq_weights", desc: "관측 가중 — 심도 모형에서 건수 가중, 집계 데이터 사용 시 빈도 가중." },
      { name: "fit(scale='X2')", desc: "과산포 보정(quasi-Poisson) — 분산이 평균보다 클 때 표준오차를 부풀려 과신을 막습니다. 대안: 음이항 family." },
    ],
    summary: "빈도(포아송·과산포 시 음이항)·심도(감마) 등 정규 아닌 분포를 링크함수로 모형화 — 보험료 산출의 표준",
    intro:
      "선형회귀를 확장해 목표변수의 분포(포아송·감마·이항 등)와 링크함수를 명시적으로 지정합니다. 사고 건수는 포아송(로그 링크), 사고 금액은 감마(로그 링크)로 모형화하는 것이 보험요율 산출(빈도×심도)의 국제 표준 접근입니다.\n\n로그 링크에서는 exp(계수)가 승수(relativity)로 해석됩니다 — 요율 상대도를 바로 얻을 수 있어 계리 실무와 궁합이 좋습니다.",
    tips: "노출(경과 계약년수)이 다른 데이터는 반드시 offset=log(exposure)로 반영해야 합니다. 포아송에서 분산이 평균보다 크면(과산포) 음이항 모형이나 quasi-Poisson을 고려하세요.",
    sections: [
      {
        title: "사고빈도 — 포아송 GLM (노출 offset)",
        level: "basic",
        code: `import numpy as np
import statsmodels.api as sm
import statsmodels.formula.api as smf

# n_claims: 사고 건수, exposure: 경과 계약년수
freq = smf.glm(
    "n_claims ~ C(age_band) + C(region) + C(car_type)",
    data=df,
    family=sm.families.Poisson(),
    offset=np.log(df["exposure"]),
).fit()
print(freq.summary())

# 요율 상대도(relativity): exp(coef)
print(np.exp(freq.params).round(3))
# 예: age_band[20대] = 1.42 → 기준 연령대 대비 빈도 1.42배`,
      },
      {
        title: "사고심도 — 감마 GLM",
        level: "basic",
        code: `# 사고가 난 건만 대상으로 평균 사고금액 모형화
sev_df = df[df["n_claims"] > 0].copy()
sev_df["avg_claim"] = sev_df["claim_amt"] / sev_df["n_claims"]

sev = smf.glm(
    "avg_claim ~ C(age_band) + C(car_type)",
    data=sev_df,
    family=sm.families.Gamma(link=sm.families.links.Log()),
).fit()
print(np.exp(sev.params).round(3))

# 순보험료 = 빈도 예측 × 심도 예측
df["pure_premium"] = freq.predict(df) / df["exposure"] * sev.predict(df)`,
      },
      {
        title: "적합도 진단 — 과산포·이탈도",
        desc: "포아송 모형(freq)의 과산포 여부와 적합도를 점검합니다.",
        level: "advanced",
        code: `# ① 과산포(overdispersion): Pearson chi2 / 자유도 ≈ 1이 이상.
#    1보다 크게 벗어나면 과산포 → 음이항 또는 fit(scale='X2')로 표준오차 보정
pearson_chi2 = freq.pearson_chi2
dof = freq.df_resid
print(f"Pearson chi2/df = {pearson_chi2 / dof:.3f}  (>1.2 면 과산포 의심)")

# ② 이탈도 기반 적합도: Deviance/df, 유사결정계수
print(f"Deviance/df     = {freq.deviance / dof:.3f}")
print(f"pseudo R2(dev)  = {1 - freq.deviance / freq.null_deviance:.3f}")
print(f"AIC = {freq.aic:.1f}   BIC = {freq.bic:.1f}")

# ③ 과산포가 크면 표준오차를 보정해 재적합(quasi-Poisson)
freq_qp = freq.model.fit(scale="X2")
print("\\n[quasi-Poisson 보정 후 p-value 일부]")
print(freq_qp.pvalues.round(4).head())`,
      },
      {
        title: "과산포 건수 — 음이항 GLM (NB2)",
        desc: "포아송에서 분산>평균(과산포)이면 음이항으로 교체. 음이항 = 포아송–감마 혼합(포아송 평균 μ가 감마로 흔들림)이라 분산 = μ + α·μ²로 초과분산을 흡수합니다. quasi-Poisson이 표준오차만 부풀리는 것과 달리 우도 기반 모형이라 AIC 비교가 가능합니다.",
        level: "advanced",
        code: `import numpy as np
import statsmodels.api as sm
import statsmodels.formula.api as smf

# ① α(과산포 파라미터)를 함께 MLE로 추정 — discrete 음이항(NB2)
nb = smf.negativebinomial(
    "n_claims ~ C(age_band) + C(region) + C(car_type)",
    data=df,
    offset=np.log(df["exposure"]),
).fit()
print(nb.summary())
alpha_hat = nb.params["alpha"]           # 0에 가까우면 사실상 포아송, 크면 과산포 강함
print(f"추정 과산포 alpha = {alpha_hat:.4f}")

# 요율 상대도 — alpha는 분산 파라미터라 상대도 해석에서 제외
relativity = np.exp(nb.params.drop("alpha"))
print(relativity.round(3))

# ② 같은 α를 GLM 프레임에 넣어 적합(요율 산출 파이프라인을 GLM으로 통일할 때)
nb_glm = smf.glm(
    "n_claims ~ C(age_band) + C(region) + C(car_type)",
    data=df,
    family=sm.families.NegativeBinomial(alpha=alpha_hat),
    offset=np.log(df["exposure"]),
).fit()
print(np.exp(nb_glm.params).round(3))

# ③ 포아송 대비 개선 확인 — AIC가 작아지면 음이항 채택 근거
pois = smf.glm(
    "n_claims ~ C(age_band) + C(region) + C(car_type)",
    data=df, family=sm.families.Poisson(),
    offset=np.log(df["exposure"]),
).fit()
print(f"AIC  Poisson={pois.aic:.1f}   NegBinom={nb.aic:.1f}")`,
      },
      {
        title: "규제 GLM — fit_regularized(alpha·L1_wt)",
        desc: "변수가 많은 GLM에 규제를 걸어 과적합·불안정 계수를 억제합니다. alpha=벌점 강도, L1_wt=L1 비중(1=Lasso식).",
        level: "advanced",
        code: `import numpy as np
import statsmodels.api as sm
import statsmodels.formula.api as smf

# 포아송 빈도 GLM을 규제 적합 — 상관 높은 요인이 많을 때 상대도 안정화
freq_reg = smf.glm(
    "n_claims ~ C(age_band) + C(region) + C(car_type)",
    data=df,
    family=sm.families.Poisson(),
    offset=np.log(df["exposure"]),
).fit_regularized(alpha=0.05, L1_wt=1.0)   # L1_wt=1 → Lasso식 변수선택
print(np.exp(freq_reg.params).round(3))    # 상대도(규제로 1=중립 쪽으로 수축)

# alpha를 키우면 계수가 더 강하게 0/1(중립)로 수축 → 편향↑·분산↓`,
      },
    ],
  },
  {
    id: "regularized",
    name: "Ridge·Lasso",
    en: "Regularized Regression",
    category: "model",
    weight: 3,
    difficulty: 3,
    params: [
      { name: "alpha", desc: "벌점 강도 — 클수록 계수가 강하게 줄어듭니다. RidgeCV·LassoCV에 후보 목록(np.logspace)을 주면 교차검증으로 자동 선택." },
      { name: "l1_ratio (ElasticNet)", desc: "L1 비중 — 0이면 Ridge, 1이면 Lasso. 상관 높은 변수 그룹을 함께 남기고 싶으면 0.2~0.5." },
      { name: "max_iter / tol", desc: "Lasso 수렴 실패 경고 시 max_iter를 10000 이상으로 늘리거나 tol을 완화합니다." },
      { name: "cv", desc: "교차검증 폴드 수(기본 5). 시계열 데이터면 TimeSeriesSplit 객체를 전달." },
      { name: "positive=True (Lasso)", desc: "계수 비음수 제약." },
    ],
    summary: "계수에 벌점을 줘 과적합을 억제 — Lasso는 변수 선택까지 수행",
    intro:
      "설명변수가 많거나 서로 상관이 높을 때, 계수 크기에 벌점(penalty)을 부과해 과적합을 억제합니다. Ridge(L2)는 계수를 고르게 줄이고, Lasso(L1)는 일부 계수를 정확히 0으로 만들어 변수 선택 효과가 있습니다.\n\n벌점 강도 alpha는 교차검증으로 고르며, 벌점이 계수 크기에 작동하므로 학습 전 표준화(StandardScaler)가 사실상 필수입니다.",
    tips: "Lasso가 0으로 만든 변수는 '중요하지 않다'기보다 '상관 높은 변수 중 하나만 남겼다'일 수 있습니다. 상관 그룹 전체를 유지하고 싶으면 ElasticNet(L1+L2 혼합)을 쓰세요.",
    sections: [
      {
        title: "특정 alpha로 각각 산출 — Ridge·Lasso·ElasticNet",
        desc: "교차검증으로 찾기 전에, 규제 강도(alpha)를 직접 지정해 각 모델을 바로 산출합니다. 값을 바꿔 편향·분산 절충을 비교하세요.",
        level: "basic",
        code: `from sklearn.linear_model import Ridge, Lasso, ElasticNet
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
import pandas as pd

df = pd.read_excel("policy.xlsx")

# ① 사용할 변수를 직접 지정 — 규제 모형은 결측을 받지 못하므로 결측 행 제외(또는 대체)
feats = ["age", "bmi", "dependents", "income", "tenure_months", "n_contracts"]
d = df[feats + ["premium"]].dropna()
X, y = d[feats], d["premium"]
X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42)

# ② alpha를 조건으로 고정한 여러 모델(표준화는 규제의 전제)
#    시작값은 Ridge 1·Lasso 0.1 — 0.01~100을 훑으며 수축 정도를 비교해 보세요.
#    (적정 alpha는 y 스케일에 좌우됩니다. 보험료처럼 값이 크면 alpha도 크게 잡아야 효과가 보입니다.)
models = {
    "Ridge(α=1)":   make_pipeline(StandardScaler(), Ridge(alpha=1.0)),
    "Ridge(α=10)":  make_pipeline(StandardScaler(), Ridge(alpha=10.0)),
    "Lasso(α=0.1)": make_pipeline(StandardScaler(), Lasso(alpha=0.1, max_iter=10000)),
    "Lasso(α=1)":   make_pipeline(StandardScaler(), Lasso(alpha=1.0, max_iter=10000)),
    "ElasticNet(α=0.1,l1=0.5)":
        make_pipeline(StandardScaler(), ElasticNet(alpha=0.1, l1_ratio=0.5, max_iter=10000)),
}
for name, m in models.items():
    m.fit(X_tr, y_tr)
    coef = pd.Series(m[-1].coef_, index=X_tr.columns)
    print(f"{name:26s} R²(test)={m.score(X_te, y_te):.3f}  0계수={int((coef == 0).sum())}개")
# alpha↑ → 계수 수축 강화(Lasso는 0 증가). 각 모델의 계수는 m[-1].coef_ 로 확인.`,
      },
      {
        title: "표준화 파이프라인 + 교차검증으로 alpha 선택",
        desc: "alpha를 손으로 고르는 대신 교차검증으로 탐색합니다. 기본 섹션에서 만든 X_tr·y_tr을 그대로 사용합니다.",
        level: "advanced",
        code: `from sklearn.linear_model import RidgeCV, LassoCV
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

alphas = np.logspace(-3, 3, 50)

ridge = make_pipeline(StandardScaler(), RidgeCV(alphas=alphas, cv=5))
lasso = make_pipeline(StandardScaler(), LassoCV(alphas=alphas, cv=5, max_iter=10000))
ridge.fit(X_tr, y_tr)
lasso.fit(X_tr, y_tr)

print("ridge alpha =", ridge[-1].alpha_)
print("lasso alpha =", lasso[-1].alpha_)

# Lasso 변수 선택 결과 — 계수 0이 아닌 변수만
coef = pd.Series(lasso[-1].coef_, index=X_tr.columns)
print(coef[coef != 0].sort_values(key=abs, ascending=False).round(3))
print(f"제외된 변수 수: {(coef == 0).sum()}")`,
      },
    ],
  },
  {
    id: "time-series",
    name: "시계열 분석",
    en: "Time Series — ARIMA",
    category: "model",
    weight: 2,
    difficulty: 4,
    params: [
      { name: "order=(p, d, q)", desc: "자기회귀 차수 p·차분 횟수 d·이동평균 차수 q. ACF/PACF 그림 또는 pmdarima.auto_arima로 선택합니다." },
      { name: "seasonal_order=(P, D, Q, s)", desc: "계절 성분 차수와 주기 s — 월별 데이터는 s=12, 분기는 s=4." },
      { name: "seasonal_decompose(model=...)", desc: "'additive'(변동 폭 일정)·'multiplicative'(수준에 비례해 진폭 증가 — 매출·보험료 수입에 흔함)." },
      { name: "trend", desc: "'n'(없음)·'c'(상수)·'t'(선형 추세) — 차분 후 드리프트 포함 여부." },
      { name: "get_forecast(steps).summary_frame(alpha=...)", desc: "예측 평균과 (1-alpha) 예측구간을 표로 — 기본 95%." },
    ],
    summary: "추세·계절성을 분해하고 ARIMA로 미래 값을 예측",
    intro:
      "월별 보험료 수입·청구 건수처럼 시간 순서가 있는 데이터를 다룹니다. 먼저 분해(decompose)로 추세·계절성·잔차를 눈으로 확인하고, ARIMA(자기회귀+차분+이동평균)로 예측 모형을 세웁니다.\n\nARIMA(p, d, q)의 차수는 ACF/PACF를 보고 정하거나, pmdarima의 auto_arima로 자동 탐색할 수 있습니다.",
    tips: "시계열은 무작위 분할하면 안 됩니다 — 학습은 과거, 검증은 미래로 시간 순서를 지켜 나누세요. 예측 구간(신뢰구간)이 기간이 멀수록 급격히 넓어지는 것은 정상이며, 그만큼 장기 예측은 불확실하다는 뜻입니다.",
    sections: [
      {
        title: "분해 + ARIMA 적합·예측",
        desc: "차수 (p, d, q)를 직접 지정해 바로 적합·예측합니다. 월별 데이터의 무난한 출발점이 (1, 1, 1)+계절(1, 1, 1, 12)입니다.",
        level: "basic",
        code: `import pandas as pd
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.arima.model import ARIMA

ts = (
    pd.read_excel("monthly_claims.xlsx", parse_dates=["month"])
    .set_index("month")["n_claims"]
    .asfreq("MS")
)

# ① 추세·계절성 분해
seasonal_decompose(ts, model="additive").plot()

# ② ARIMA 적합 — (p, d, q) = (자기회귀, 차분, 이동평균) 차수
model = ARIMA(ts, order=(1, 1, 1),
              seasonal_order=(1, 1, 1, 12)).fit()   # 월별 계절성 12
print(model.summary())

# ③ 12개월 예측 + 95% 예측구간
fc = model.get_forecast(steps=12)
out = fc.summary_frame()          # mean, mean_ci_lower, mean_ci_upper
print(out.round(1))`,
      },
      {
        title: "차수 탐색·모형 비교 — AIC 격자·시간순 검증",
        desc: "지정 차수 대신 후보를 훑어 고릅니다. 기본 섹션에서 만든 ts를 그대로 사용합니다.",
        level: "advanced",
        code: `import itertools
import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

# ① (p, d, q) 후보를 격자로 훑어 AIC 최소 조합 탐색
#    범위를 넓히면 오래 걸리니 p·q는 0~2, d는 0~1에서 시작합니다.
rows = []
for p, d, q in itertools.product(range(3), range(2), range(3)):
    try:
        res = ARIMA(ts, order=(p, d, q)).fit()
        rows.append({"order": (p, d, q), "AIC": res.aic, "BIC": res.bic})
    except Exception:
        continue                      # 수렴 실패 조합은 건너뜁니다

grid = pd.DataFrame(rows).sort_values("AIC").reset_index(drop=True)
print(grid.head(5).round(1))
best = tuple(grid.loc[0, "order"])
print("AIC 최소 차수:", best)   # ΔAIC 2 이내는 사실상 동급 → 더 단순한 차수를 택하세요

# ② 시간순 검증 — 마지막 12개월을 미래로 남겨 예측 오차 비교(무작위 분할 금지)
train, test = ts.iloc[:-12], ts.iloc[-12:]
for order in [(1, 1, 1), best]:
    fc = ARIMA(train, order=order).fit().get_forecast(steps=len(test)).predicted_mean
    rmse = float(np.sqrt(np.mean((test.to_numpy() - fc.to_numpy()) ** 2)))
    mape = float(np.mean(np.abs((test.to_numpy() - fc.to_numpy()) / test.to_numpy())) * 100)
    print(f"order={order}  RMSE={rmse:,.1f}  MAPE={mape:.1f}%")
# AIC 순위와 실제 예측오차 순위는 다를 수 있습니다 — 최종 차수는 시간순 검증 결과로 정하세요.`,
      },
    ],
  },
  {
    id: "survival",
    name: "생존분석",
    en: "Survival — Kaplan-Meier · Cox",
    category: "model",
    weight: 2,
    difficulty: 5,
    webSupport: "none",
    webNote:
      "lifelines 패키지가 브라우저 실행기에 포함되어 있지 않아 웹에서는 실행되지 않습니다. 로컬 파이썬(pip install lifelines)에서 이용하세요.",
    params: [
      { name: "fit(durations, event_observed)", desc: "KM 공통 입력 — 관찰 기간과 사건 지표(1=사건 발생, 0=중도절단). 절단을 1로 잘못 코딩하면 결과가 완전히 왜곡됩니다." },
      { name: "CoxPHFitter(penalizer=...)", desc: "0.01~0.1의 소량 규제 — 변수가 많거나 수렴이 불안정할 때 안정화." },
      { name: "fit(..., strata=[...])", desc: "비례위험 가정이 깨진 변수를 층화 처리 — 계수는 추정하지 않되 기저위험을 층별로 분리합니다." },
      { name: "check_assumptions(df, p_value_threshold=...)", desc: "비례위험 가정 진단 — 위반 변수와 처방(층화·시간상호작용)을 제안해 줍니다." },
      { name: "predict_survival_function(X)", desc: "개별 계약의 시점별 생존(유지) 확률 곡선 예측." },
    ],
    summary: "'언제 사건이 일어나는가'를 분석 — 해지·사망·부도까지의 시간, 중도절단 처리",
    intro:
      "관찰이 끝날 때까지 사건(해지·사망)이 일어나지 않은 계약(중도절단, censoring)을 버리지 않고 활용하는 것이 핵심입니다. Kaplan-Meier 곡선은 시점별 생존(유지)율을 그려 주고, Cox 비례위험 모형은 어떤 요인이 위험을 몇 배 높이는지(위험비)를 추정합니다.\n\n보험에서는 계약 해지율 분석, 사망률 연구, 재가입 행동 분석에 직접 대응되는 기법입니다.",
    tips: "Cox 모형의 exp(coef)는 위험비(hazard ratio)입니다 — 1.3이면 해당 요인이 해지 위험을 30% 높인다는 뜻. 비례위험 가정(위험비가 시간에 따라 일정)은 check_assumptions로 점검하세요. 설치: pip install lifelines",
    sections: [
      {
        title: "Kaplan-Meier 유지율 곡선",
        desc: "모수 추정 없이 관측만으로 시점별 유지율을 그립니다 — 생존분석의 첫 결과.",
        level: "basic",
        code: `from lifelines import KaplanMeierFitter
import matplotlib.pyplot as plt

# duration: 관찰 기간(월), event: 1=해지 발생, 0=관찰 종료(중도절단)
kmf = KaplanMeierFitter()

ax = plt.subplot()
for channel, g in df.groupby("channel"):
    kmf.fit(g["duration"], g["event"], label=channel)
    kmf.plot_survival_function(ax=ax)
plt.xlabel("경과월")
plt.ylabel("유지율")
plt.show()

print(kmf.median_survival_time_)   # 유지율이 50%가 되는 시점`,
      },
      {
        title: "Cox 비례위험 모형 — 해지 요인 분석",
        desc: "설명변수를 직접 지정해 적합하고 위험비(HR)를 읽습니다.",
        level: "basic",
        code: `from lifelines import CoxPHFitter

cox = CoxPHFitter()
cox.fit(
    df[["duration", "event", "age", "premium_ratio", "has_rider"]],
    duration_col="duration",
    event_col="event",
)
cox.print_summary()   # exp(coef) = 위험비(HR)
# 읽는 법: exp(coef)=1.3 → 해당 요인이 해지 위험을 30% 높임(1보다 작으면 낮춤)`,
      },
      {
        title: "가정 진단·층화·규제 — 비례위험 점검과 모형 비교",
        desc: "기본 섹션의 cox 적합 결과를 받아 가정을 점검하고, 위반 시 처방(층화)·안정화(규제)를 비교합니다.",
        level: "advanced",
        code: `from lifelines import CoxPHFitter

cols = ["duration", "event", "age", "premium_ratio", "has_rider"]

# ① 비례위험 가정 점검 — 위반 변수와 처방(층화·시간 상호작용)을 함께 안내합니다
cox.check_assumptions(df[cols], p_value_threshold=0.05, show_plots=False)

# ② 가정이 깨진 변수(또는 기저위험이 다른 집단)는 층화 — 계수는 추정하지 않고 기저위험만 분리
cox_st = CoxPHFitter().fit(df[cols + ["channel"]], duration_col="duration",
                           event_col="event", strata=["channel"])
print("[층화 Cox]\\n", cox_st.summary[["exp(coef)", "p"]].round(3))

# ③ 소량 규제(penalizer) — 변수가 많거나 수렴이 불안정할 때 계수를 안정화(0.01~0.1)
cox_pen = CoxPHFitter(penalizer=0.1).fit(df[cols], duration_col="duration", event_col="event")

# ④ 모형 비교 — C-index(0.5=무작위, 1=완벽)가 크고 AIC가 작을수록 좋습니다
for name, m in [("기본", cox), ("층화(channel)", cox_st), ("penalizer=0.1", cox_pen)]:
    print(f"{name:14s} C-index={m.concordance_index_:.3f}  logL={m.log_likelihood_:,.1f}")
print(f"AIC(부분우도): 기본 {cox.AIC_partial_:,.1f} vs 규제 {cox_pen.AIC_partial_:,.1f}")
# 층화 모형은 부분우도의 기준이 달라져 AIC를 다른 모형과 직접 비교하면 안 됩니다 — C-index로 보세요.`,
      },
    ],
  },
  /* ───────────────────────── 머신러닝 (ml) ───────────────────────── */
  {
    id: "decision-tree",
    name: "의사결정나무",
    en: "Decision Tree",
    category: "ml",
    weight: 3,
    difficulty: 2,
    params: [
      { name: "max_depth", desc: "나무 최대 깊이 — 과적합 제어 1순위. 3~5로 시작해 규칙을 읽고, 깊이를 늘릴수록 암기에 가까워집니다." },
      { name: "min_samples_leaf", desc: "잎 노드의 최소 표본 수 — 클수록 단순·안정. 소수 표본으로 만든 억지 규칙을 막습니다." },
      { name: "criterion", desc: "분할 품질 기준 — 분류 'gini'(기본)·'entropy', 회귀 'squared_error'·'absolute_error'(이상치 강건)." },
      { name: "class_weight", desc: "'balanced'로 불균형 클래스 보정." },
      { name: "ccp_alpha", desc: "비용-복잡도 사후 가지치기 강도 — cost_complexity_pruning_path로 후보를 얻어 교차검증으로 선택합니다." },
    ],
    summary: "if-then 규칙의 나무 구조로 분류·회귀 — 눈으로 읽히는 모델",
    intro:
      "데이터를 '나이 ≥ 45인가?' 같은 질문으로 반복 분할해 나무 구조를 만듭니다. 결과를 그림으로 그려 규칙을 그대로 읽을 수 있어 설명 가능성이 가장 높은 모델 중 하나이며, 스케일링·더미변수 없이도 작동합니다.\n\n단독으로는 과적합되기 쉬워 실무 예측력은 랜덤포레스트·부스팅(나무의 앙상블)에 밀리지만, 규칙 발견·세그먼트 정의 용도로 여전히 유용합니다.",
    tips: "max_depth·min_samples_leaf를 제한하지 않으면 학습 데이터를 통째로 암기합니다. 깊이 3~5의 얕은 나무로 시작해 규칙을 읽고, 예측력이 필요하면 앙상블로 넘어가세요.",
    sections: [
      {
        title: "지정 하이퍼파라미터로 학습·예측·평가 (max_depth=4)",
        desc: "샘플(policy)로 바로 실행되는 자체 완결형 첫 실행 경로. 값을 코드에 직접 지정해 탐색 없이 결과를 봅니다. 실제 데이터면 열 이름만 맞추세요.",
        level: "basic",
        code: `from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (accuracy_score, roc_auc_score,
                             confusion_matrix, classification_report)

# ① 변수 지정 — 설명변수(X)와 목표변수(y)를 직접 골라 씁니다.
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

# ② 하이퍼파라미터를 코드에 직접 지정 — 탐색 없이 정해진 값으로 바로 결과를 봅니다.
est = DecisionTreeClassifier(
    max_depth=4,              # 깊이 제한(과적합 제어 1순위) — 3~5로 시작, 늘릴수록 암기에 가까워짐
    min_samples_leaf=50,      # 잎 노드 최소 표본 — 20~100, 클수록 단순·안정
    class_weight="balanced",  # 해지(소수 클래스) 보정 — 불균형 데이터면 사실상 필수
    random_state=42,          # 재현성 — 같은 값이면 항상 같은 나무
).fit(X_tr, y_tr)

# ③ 예측 → 평가
proba = est.predict_proba(X_te)[:, 1]
pred = est.predict(X_te)

print(f"정확도   = {accuracy_score(y_te, pred):.3f}")
print(f"ROC-AUC  = {roc_auc_score(y_te, proba):.3f}")   # 0.5=무작위, 1.0=완벽
print("혼동행렬\\n", confusion_matrix(y_te, pred))
print(classification_report(y_te, pred, target_names=["유지", "해지"]))`,
      },
      {
        title: "나무 시각화 — 규칙 그대로 읽기",
        desc: "위 기본 셀을 먼저 실행해 X_tr·y_tr를 만든 뒤 실행하세요.",
        level: "basic",
        code: `from sklearn.tree import DecisionTreeClassifier, plot_tree
import matplotlib.pyplot as plt

tree = DecisionTreeClassifier(
    max_depth=4,              # 과적합 제어의 핵심
    min_samples_leaf=50,      # 잎 노드 최소 표본
    class_weight="balanced",
    random_state=42,
).fit(X_tr, y_tr)

plt.figure(figsize=(16, 8))
plot_tree(tree, feature_names=X_tr.columns,
          class_names=["유지", "해지"], filled=True, fontsize=9)
plt.show()

print(f"train 정확도 {tree.score(X_tr, y_tr):.3f}")
print(f"test  정확도 {tree.score(X_te, y_te):.3f}")
# 두 값의 차이가 크면 과적합 → max_depth를 줄일 것`,
      },
      {
        title: "가지치기(ccp_alpha) 튜닝 — 비용-복잡도 경로 + 교차검증",
        desc: "깊이를 사람이 정하는 대신 교차검증으로 고릅니다. 기본 셀의 X_tr·y_tr·proba를 그대로 씁니다.",
        level: "advanced",
        code: `import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score
from sklearn.metrics import roc_auc_score
import matplotlib.pyplot as plt

# ① 가지치기 강도(alpha) 후보를 데이터에서 뽑습니다 — 값을 지정하는 기본 단계와 반대 방향.
base = DecisionTreeClassifier(class_weight="balanced", random_state=42)
path = base.cost_complexity_pruning_path(X_tr, y_tr)
alphas = np.unique(path.ccp_alphas[path.ccp_alphas > 0])   # 0(가지치기 없음)은 제외
alphas = alphas[:: max(1, len(alphas) // 20)]              # 후보가 많으면 20개 내외로 솎기

# ② 후보마다 5-겹 교차검증 AUC
scores = [cross_val_score(
    DecisionTreeClassifier(ccp_alpha=a, class_weight="balanced", random_state=42),
    X_tr, y_tr, cv=5, scoring="roc_auc").mean() for a in alphas]

best_alpha = float(alphas[int(np.argmax(scores))])
print(f"best ccp_alpha = {best_alpha:.6f}  (CV ROC-AUC {max(scores):.3f})")

plt.plot(alphas, scores, marker="o")
plt.xlabel("ccp_alpha"); plt.ylabel("CV ROC-AUC"); plt.show()

# ③ 선택된 alpha로 최종 학습 → 기본(max_depth=4)과 비교해 더 나은 쪽을 채택
pruned = DecisionTreeClassifier(ccp_alpha=best_alpha, class_weight="balanced",
                                random_state=42).fit(X_tr, y_tr)
print(f"잎 노드 수 = {pruned.get_n_leaves()}, 깊이 = {pruned.get_depth()}")
print(f"가지치기 test ROC-AUC = {roc_auc_score(y_te, pruned.predict_proba(X_te)[:, 1]):.3f}")
print(f"기본(max_depth=4) test ROC-AUC = {roc_auc_score(y_te, proba):.3f}")`,
      },
    ],
  },
  {
    id: "random-forest",
    name: "랜덤포레스트",
    en: "Random Forest",
    category: "ml",
    weight: 4,
    difficulty: 3,
    params: [
      { name: "n_estimators", desc: "나무 수 — 많을수록 안정되지만 수익은 체감(300~1000이면 충분). 늘려서 나빠지지는 않습니다." },
      { name: "max_features", desc: "분할마다 고려할 후보 변수 수 — 분류 기본 'sqrt'. 낮출수록 나무가 다양해져 과적합이 줄어듭니다." },
      { name: "min_samples_leaf", desc: "잎 최소 표본 — 개별 나무의 과적합 제어. 10~50 수준부터 시도." },
      { name: "oob_score=True", desc: "부트스트랩에 안 뽑힌 표본으로 계산하는 무료 검증 점수 — 별도 검증셋 없이 성능 감을 잡을 수 있습니다." },
      { name: "class_weight", desc: "'balanced'(전체 기준)·'balanced_subsample'(부트스트랩 표본 기준) 불균형 보정." },
      { name: "n_jobs=-1", desc: "모든 코어로 병렬 학습." },
    ],
    summary: "수백 그루의 나무를 배깅으로 평균 — 튜닝 없이도 강한 범용 베이스라인",
    intro:
      "부트스트랩 표본과 무작위 변수 선택으로 서로 다른 나무 수백 그루를 만들고 예측을 평균(투표)합니다. 개별 나무의 과적합이 상쇄되어, 하이퍼파라미터를 거의 만지지 않아도 안정적인 성능이 나오는 대표적 범용 모델입니다.\n\n변수 중요도를 부산물로 제공해 '어떤 변수가 예측에 기여하는가'를 빠르게 훑는 탐색 도구로도 널리 쓰입니다.",
    tips: "불순도 기반 feature_importances_는 범주 수가 많은 변수에 과대평가 경향이 있습니다 — 중요한 의사결정에는 permutation_importance로 교차 확인하세요.",
    sections: [
      {
        title: "지정 하이퍼파라미터로 학습·예측·평가 (n_estimators=300, max_depth=6)",
        desc: "샘플(policy)로 바로 실행되는 자체 완결형 첫 실행 경로. 값을 코드에 직접 지정해 탐색 없이 결과를 봅니다.",
        level: "basic",
        code: `from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, roc_auc_score,
    average_precision_score, confusion_matrix, classification_report)

# ① 변수 지정 — 설명변수(X)와 목표변수(y)를 직접 골라 씁니다.
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

# ② 하이퍼파라미터를 코드에 직접 지정 — 탐색 없이 정해진 값으로 바로 결과를 봅니다.
est = RandomForestClassifier(
    n_estimators=300,         # 나무 수 — 300~1000이면 충분(많을수록 안정, 느려짐)
    max_depth=6,              # 나무 깊이 — 4~10, None이면 끝까지 키움(과적합↑)
    min_samples_leaf=20,      # 잎 최소 표본 — 10~50, 클수록 단순·안정
    max_features="sqrt",      # 분할 후보 변수 수 — 분류 기본값, 낮출수록 나무가 다양해짐
    class_weight="balanced",  # 해지(소수 클래스) 보정
    n_jobs=-1,                # 모든 코어로 병렬 학습
    random_state=42,          # 재현성
).fit(X_tr, y_tr)

# ③ 예측 → 평가
proba = est.predict_proba(X_te)[:, 1]
pred = est.predict(X_te)

print(f"정확도   = {accuracy_score(y_te, pred):.3f}")
print(f"ROC-AUC  = {roc_auc_score(y_te, proba):.3f}")   # 0.5=무작위, 1.0=완벽
print(f"PR-AUC   = {average_precision_score(y_te, proba):.3f}")   # 불균형이면 ROC보다 정직
print("혼동행렬\\n", confusion_matrix(y_te, pred))
print(classification_report(y_te, pred, target_names=["유지", "해지"]))`,
      },
      {
        title: "변수 중요도 — 불순도 기반 vs 순열 중요도",
        desc: "위 기본 셀의 X_tr·X_te를 그대로 씁니다. 중요도 탐색은 해석 단계 — 기본 실행 뒤에 보세요.",
        level: "advanced",
        code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
import pandas as pd

rf = RandomForestClassifier(
    n_estimators=500,
    min_samples_leaf=20,
    class_weight="balanced",
    n_jobs=-1,
    random_state=42,
).fit(X_tr, y_tr)

proba = rf.predict_proba(X_te)[:, 1]
print(f"ROC-AUC = {roc_auc_score(y_te, proba):.3f}")

# 불순도 기반 중요도 (빠른 훑기)
imp = pd.Series(rf.feature_importances_, index=X_tr.columns)
print(imp.sort_values(ascending=False).round(3))

# 순열 중요도 (더 신뢰할 만한 확인)
pi = permutation_importance(rf, X_te, y_te, n_repeats=10, random_state=42)
print(pd.Series(pi.importances_mean, index=X_te.columns)
      .sort_values(ascending=False).round(4))`,
      },
    ],
  },
  {
    id: "gradient-boosting",
    name: "그래디언트 부스팅",
    en: "Gradient Boosting — XGBoost · LightGBM",
    category: "ml",
    weight: 4,
    difficulty: 4,
    webSupport: "partial",
    webNote:
      "LightGBM·XGBoost는 브라우저 실행기에서 사용할 수 없습니다. 다만 예제의 sklearn HistGradientBoosting 블록은 그대로 실행됩니다.",
    params: [
      { name: "learning_rate", desc: "나무 하나의 기여 축소 비율 — 0.03~0.1 권장. 낮출수록 성능은 안정되지만 나무 수를 늘려야 합니다." },
      { name: "n_estimators / max_iter", desc: "최대 나무 수 — 조기 종료와 함께 크게(1000~5000) 잡고 멈춤은 검증 성능에 맡깁니다." },
      { name: "num_leaves · max_depth", desc: "나무 복잡도 — LightGBM은 num_leaves(기본 31)가 주 손잡이. 과적합이면 낮춥니다." },
      { name: "early_stopping(rounds)", desc: "검증 지표가 rounds회 개선 없으면 중단 — eval_set과 함께 사실상 필수." },
      { name: "subsample · colsample_bytree", desc: "나무마다 행·열을 일부만 사용(0.7~0.9) — 무작위성으로 과적합 완화." },
      { name: "scale_pos_weight / class_weight", desc: "불균형 보정 — XGBoost는 (음성 수/양성 수)를 scale_pos_weight로." },
    ],
    summary: "이전 나무의 오차를 다음 나무가 보정 — 정형 데이터 예측력의 사실상 표준",
    intro:
      "나무를 순차적으로 추가하며 직전까지의 예측 오차를 다음 나무가 학습하게 하는 방식입니다. 정형(표 형태) 데이터에서는 딥러닝보다 강한 경우가 많아 캐글·실무 모두에서 예측력의 사실상 표준으로 자리 잡았습니다. XGBoost·LightGBM이 대표 구현체입니다.\n\n순차 학습이라 과적합 위험이 있으므로, 검증 데이터 성능이 더 나아지지 않으면 멈추는 조기 종료(early stopping)와 함께 쓰는 것이 정석입니다.",
    tips: "learning_rate를 낮추고(0.03~0.1) n_estimators를 크게 잡은 뒤 조기 종료에 맡기는 조합이 안전합니다. 외부 라이브러리를 못 쓰는 환경이면 sklearn의 HistGradientBoosting이 좋은 대체재입니다.",
    sections: [
      {
        title: "지정 하이퍼파라미터로 학습·예측·평가 (learning_rate=0.1, max_iter=200)",
        desc: "샘플(policy)로 바로 실행되는 자체 완결형 첫 실행 경로. 조기 종료(자동 중단) 없이 정한 값만으로 결과를 봅니다. sklearn HistGB라 브라우저 실행기에서도 그대로 돌아갑니다.",
        level: "basic",
        code: `from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (accuracy_score, roc_auc_score,
    average_precision_score, confusion_matrix, classification_report)

# ① 변수 지정 — 부스팅은 스케일링·더미 없이 수치형을 그대로 받습니다.
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

# ② 하이퍼파라미터를 코드에 직접 지정 — 나무 수를 자동으로 정하지 않습니다.
est = HistGradientBoostingClassifier(
    learning_rate=0.1,        # 나무 하나의 기여 — 0.03~0.1, 낮추면 max_iter를 늘립니다
    max_iter=200,             # 나무 수 — learning_rate와 반비례로 조정(0.05면 400~800)
    max_depth=3,              # 나무 깊이 — 3~6, 얕은 나무를 여러 개 쌓는 것이 부스팅의 정석
    min_samples_leaf=20,      # 잎 최소 표본 — 10~50
    l2_regularization=1.0,    # 과적합 억제 — 0~10, 클수록 보수적
    early_stopping=False,     # 기본 단계에서는 지정한 max_iter를 그대로 사용(아래 고급과 대비)
    random_state=42,          # 재현성
).fit(X_tr, y_tr)

# ③ 예측 → 평가
proba = est.predict_proba(X_te)[:, 1]
pred = est.predict(X_te)

print(f"train 정확도 = {est.score(X_tr, y_tr):.3f}")
print(f"정확도   = {accuracy_score(y_te, pred):.3f}")
print(f"ROC-AUC  = {roc_auc_score(y_te, proba):.3f}")   # 0.5=무작위, 1.0=완벽
print(f"PR-AUC   = {average_precision_score(y_te, proba):.3f}")
print("혼동행렬\\n", confusion_matrix(y_te, pred))
print(classification_report(y_te, pred, target_names=["유지", "해지"], zero_division=0))
# train 정확도만 높고 test가 낮으면 과적합 → max_iter·max_depth를 줄이거나 l2를 키우세요.`,
      },
      {
        title: "LightGBM — 조기 종료 학습",
        desc: "나무 수를 지정하지 않고 검증 성능이 멈출 때까지 자동으로 늘립니다(브라우저 실행기에서는 불가).",
        level: "advanced",
        code: `import lightgbm as lgb

model = lgb.LGBMClassifier(
    n_estimators=2000,
    learning_rate=0.05,
    num_leaves=31,
    class_weight="balanced",
    random_state=42,
)
model.fit(
    X_tr, y_tr,
    eval_set=[(X_te, y_te)],
    eval_metric="auc",
    callbacks=[lgb.early_stopping(100)],   # 100회 개선 없으면 중단
)
print(f"best iteration = {model.best_iteration_}")
print(f"ROC-AUC = {roc_auc_score(y_te, model.predict_proba(X_te)[:, 1]):.3f}")`,
      },
      {
        title: "sklearn 내장 대체재 — HistGradientBoosting 조기 종료",
        desc: "추가 설치 없이 쓸 수 있고 결측치를 그대로 받아들입니다. 기본 셀과 달리 나무 수를 검증 성능에 맡깁니다.",
        level: "advanced",
        code: `from sklearn.ensemble import HistGradientBoostingClassifier

hgb = HistGradientBoostingClassifier(
    max_iter=1000,
    learning_rate=0.05,
    early_stopping=True,
    validation_fraction=0.15,
    random_state=42,
).fit(X_tr, y_tr)

print(f"ROC-AUC = {roc_auc_score(y_te, hgb.predict_proba(X_te)[:, 1]):.3f}")`,
      },
      {
        title: "조기 종료 모형 성능 평가 — 정확도·ROC-AUC·리포트 (HistGB, 브라우저 실행 가능)",
        desc: "LightGBM은 브라우저 실행기에서 안 되므로 sklearn HistGB로 자체 완결형 평가. 조기 종료로 나무 수를 자동 결정한 모형의 성능입니다.",
        level: "advanced",
        code: `from sklearn.model_selection import train_test_split
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import (accuracy_score, roc_auc_score,
    average_precision_score, confusion_matrix, classification_report)

X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

est = HistGradientBoostingClassifier(max_iter=800, learning_rate=0.05,
    early_stopping=True, validation_fraction=0.15, random_state=42).fit(X_tr, y_tr)
proba = est.predict_proba(X_te)[:, 1]
pred = est.predict(X_te)

print(f"정확도   = {accuracy_score(y_te, pred):.3f}")
print(f"ROC-AUC  = {roc_auc_score(y_te, proba):.3f}")
print(f"PR-AUC   = {average_precision_score(y_te, proba):.3f}")
print("혼동행렬\\n", confusion_matrix(y_te, pred))
print(classification_report(y_te, pred, target_names=["유지", "해지"]))`,
      },
    ],
  },
  {
    id: "svm",
    name: "SVM",
    en: "Support Vector Machine",
    category: "ml",
    weight: 2,
    difficulty: 4,
    params: [
      { name: "C", desc: "오분류 허용도 — 클수록 훈련 데이터에 밀착(과적합 위험), 작을수록 마진 우선. 로그 스케일(0.1~100)로 탐색." },
      { name: "kernel", desc: "'rbf'(기본, 비선형)·'linear'(고차원·텍스트)·'poly'. 선형으로 충분하면 LinearSVC가 훨씬 빠릅니다." },
      { name: "gamma", desc: "rbf 경계의 유연성 — 'scale'(기본) 권장. 클수록 국소적 경계로 과적합." },
      { name: "probability=True", desc: "predict_proba 활성화 — 내부 교차검증을 돌려 학습이 크게 느려집니다. 점수만 필요하면 decision_function 사용." },
      { name: "class_weight='balanced'", desc: "불균형 클래스 보정." },
    ],
    summary: "마진을 최대로 하는 경계면으로 분류 — 커널로 비선형 경계까지",
    intro:
      "두 클래스를 가르는 경계면 중 양쪽 여유(마진)가 가장 큰 것을 찾습니다. 커널 트릭으로 데이터를 고차원에 매핑해 비선형 경계도 학습할 수 있으며, 표본이 적고 차원이 높은 문제에서 여전히 경쟁력이 있습니다.\n\n거리 기반이므로 스케일링이 필수이고, 표본이 수만 건을 넘으면 학습이 급격히 느려져 대용량에는 트리 계열이 더 실용적입니다.",
    tips: "C(오분류 허용)와 gamma(경계 유연성)가 성능을 좌우합니다 — 로그 스케일 그리드로 함께 탐색하세요. 확률이 필요하면 probability=True(느려짐) 대신 decision_function 값을 쓰는 것도 방법입니다.",
    sections: [
      {
        title: "지정 하이퍼파라미터로 학습·예측·평가 (C=1.0 · rbf · gamma='scale')",
        desc: "SVM은 스케일링 필수. 샘플(policy)로 바로 실행되는 자체 완결형 첫 실행 경로 — 기본값을 그대로 지정해 탐색 없이 결과를 봅니다.",
        level: "basic",
        code: `from sklearn.model_selection import train_test_split
from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, roc_auc_score,
                             confusion_matrix, classification_report)

# ① 변수 지정 — SVM은 거리 기반이라 StandardScaler 스케일링이 필수입니다.
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

# ② 하이퍼파라미터를 코드에 직접 지정 — 탐색 없이 기본값으로 바로 결과를 봅니다.
est = make_pipeline(
    StandardScaler(),         # 스케일링 → SVC 순서로 묶어 test 정보 누출을 막습니다
    SVC(
        kernel="rbf",         # 커널 — 'rbf'(비선형 기본)·'linear'(고차원·텍스트)·'poly'
        C=1.0,                # 오분류 허용도 — 기본값 1.0에서 시작, 0.1~100을 로그 스케일로
        gamma="scale",        # 경계 유연성 — 'scale'(기본) 권장, 키우면 국소적·과적합
        class_weight="balanced",  # 해지(소수 클래스) 보정
        probability=True,     # predict_proba 활성화(내부 CV로 느려짐) — 점수만이면 decision_function
        random_state=42,      # 재현성
    ),
).fit(X_tr, y_tr)

# ③ 예측 → 평가
proba = est.predict_proba(X_te)[:, 1]
pred = est.predict(X_te)

print(f"정확도   = {accuracy_score(y_te, pred):.3f}")
print(f"ROC-AUC  = {roc_auc_score(y_te, proba):.3f}")   # 0.5=무작위, 1.0=완벽
print("혼동행렬\\n", confusion_matrix(y_te, pred))
print(classification_report(y_te, pred, target_names=["유지", "해지"], zero_division=0))`,
      },
      {
        title: "스케일링 파이프라인 + 그리드 탐색",
        desc: "C·gamma를 지정하는 대신 교차검증으로 고릅니다. 위 기본 셀의 X_tr·y_tr를 그대로 씁니다.",
        level: "advanced",
        code: `from sklearn.svm import SVC
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GridSearchCV

pipe = make_pipeline(StandardScaler(), SVC(kernel="rbf"))

grid = GridSearchCV(
    pipe,
    {"svc__C": [0.1, 1, 10, 100],
     "svc__gamma": ["scale", 0.01, 0.1, 1]},
    cv=5, scoring="roc_auc", n_jobs=-1,
).fit(X_tr, y_tr)

print(grid.best_params_)
print(f"CV best AUC = {grid.best_score_:.3f}")
print(f"test  score = {grid.score(X_te, y_te):.3f}")`,
      },
    ],
  },
  {
    id: "knn",
    name: "KNN",
    en: "k-Nearest Neighbors",
    category: "ml",
    weight: 2,
    difficulty: 2,
    params: [
      { name: "n_neighbors", desc: "이웃 수 k — 작으면 노이즈에 민감(과적합), 크면 경계가 뭉개짐. 홀수로 동점을 피하고 교차검증으로 선택." },
      { name: "weights", desc: "'uniform'(모든 이웃 동일 표)·'distance'(가까울수록 큰 가중) — 밀도가 불균일하면 distance가 유리." },
      { name: "metric / p", desc: "거리 정의 — 기본 민코프스키 p=2(유클리드), p=1이면 맨해튼. 스케일링과 함께 결과를 좌우합니다." },
      { name: "n_jobs=-1", desc: "예측 시 이웃 탐색 병렬화 — KNN은 예측이 느린 모델입니다." },
    ],
    summary: "가장 가까운 k개 이웃의 다수결·평균으로 예측 — 학습이 없는 게으른 모델",
    intro:
      "새 데이터가 들어오면 학습 데이터에서 가장 가까운 k개를 찾아 다수결(분류)이나 평균(회귀)으로 답합니다. 별도의 학습 과정이 없고 개념이 직관적이라 베이스라인이나 유사 계약 찾기 같은 용도에 적합합니다.\n\n거리 계산이 전부이므로 변수 스케일링이 결과를 좌우하며, 차원이 많아지면 '가깝다'는 개념 자체가 무의미해지는 차원의 저주에 취약합니다.",
    tips: "k가 작으면 노이즈에 민감(과적합), 크면 경계가 뭉개집니다(과소적합). 홀수 k로 동점을 피하고, 교차검증으로 k를 고르세요.",
    sections: [
      {
        title: "지정 하이퍼파라미터로 학습·예측·평가 (n_neighbors=5)",
        desc: "KNN도 스케일링 필수. 샘플(policy)로 바로 실행되는 자체 완결형 첫 실행 경로 — k를 직접 지정해 탐색 없이 결과를 봅니다.",
        level: "basic",
        code: `from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, roc_auc_score,
                             confusion_matrix, classification_report)

# ① 변수 지정 — KNN도 거리 기반이라 StandardScaler 스케일링이 필수입니다.
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42)

# ② 하이퍼파라미터를 코드에 직접 지정 — 탐색 없이 정해진 k로 바로 결과를 봅니다.
est = make_pipeline(
    StandardScaler(),         # 스케일링 → KNN 순서로 묶어 test 정보 누출을 막습니다
    KNeighborsClassifier(
        n_neighbors=5,        # 이웃 수 k — 5부터 시작, 홀수로 동점 회피(3~25를 CV로 조정)
        weights="distance",   # 'uniform'(모든 이웃 동일 표)·'distance'(가까울수록 큰 가중)
        metric="minkowski", p=2,  # 거리 정의 — p=2 유클리드(기본), p=1 맨해튼
        n_jobs=-1,            # 이웃 탐색 병렬화 — KNN은 예측이 느립니다
    ),
).fit(X_tr, y_tr)

# ③ 예측 → 평가
proba = est.predict_proba(X_te)[:, 1]
pred = est.predict(X_te)

print(f"정확도   = {accuracy_score(y_te, pred):.3f}")
print(f"ROC-AUC  = {roc_auc_score(y_te, proba):.3f}")   # 0.5=무작위, 1.0=완벽
print("혼동행렬\\n", confusion_matrix(y_te, pred))
print(classification_report(y_te, pred, target_names=["유지", "해지"], zero_division=0))`,
      },
      {
        title: "k 선택 — 교차검증 곡선",
        desc: "k를 지정하는 대신 교차검증으로 고릅니다. 위 기본 셀의 X_tr·y_tr를 그대로 씁니다.",
        level: "advanced",
        code: `from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
import matplotlib.pyplot as plt

ks = range(1, 40, 2)
scores = [
    cross_val_score(
        make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=k)),
        X_tr, y_tr, cv=5, scoring="roc_auc",
    ).mean()
    for k in ks
]

plt.plot(list(ks), scores, marker="o")
plt.xlabel("k")
plt.ylabel("CV ROC-AUC")
plt.show()

best_k = list(ks)[scores.index(max(scores))]
print(f"best k = {best_k}")`,
      },
      {
        title: "선택된 k로 최종 학습·평가 — 기본(k=5)과 비교",
        desc: "위 교차검증 셀의 best_k를 그대로 씁니다. 지정한 k와 데이터가 고른 k 중 어느 쪽이 나은지 확인하세요.",
        level: "advanced",
        code: `from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (accuracy_score, roc_auc_score,
                             confusion_matrix, classification_report)

tuned = make_pipeline(StandardScaler(),
    KNeighborsClassifier(n_neighbors=best_k, weights="distance")).fit(X_tr, y_tr)
proba_t = tuned.predict_proba(X_te)[:, 1]
pred_t = tuned.predict(X_te)

print(f"k = {best_k}")
print(f"정확도   = {accuracy_score(y_te, pred_t):.3f}")
print(f"ROC-AUC  = {roc_auc_score(y_te, proba_t):.3f}")
print("혼동행렬\\n", confusion_matrix(y_te, pred_t))
print(classification_report(y_te, pred_t, target_names=["유지", "해지"], zero_division=0))
# 기본(k=5)의 ROC-AUC와 비교해 개선이 미미하면 단순한 쪽을 택하는 편이 낫습니다.`,
      },
    ],
  },
  {
    id: "naive-bayes",
    name: "나이브 베이즈",
    en: "Naive Bayes",
    category: "ml",
    weight: 1,
    difficulty: 2,
    params: [
      { name: "alpha (MultinomialNB)", desc: "라플라스 평활(기본 1.0) — 학습에 없던 단어의 확률이 0이 되는 문제를 막습니다. 0.1~1 사이 튜닝." },
      { name: "var_smoothing (GaussianNB)", desc: "분산에 더하는 안정화 항 — 분산 0인 변수로 인한 수치 문제 방지." },
      { name: "class_prior", desc: "클래스 사전확률 수동 지정 — 실제 모집단 비율이 학습 데이터와 다를 때." },
      { name: "TfidfVectorizer(min_df, max_df, ngram_range)", desc: "전처리 짝꿍 — 희귀 단어 컷(min_df)·과빈출 컷(max_df)·(1,2)면 2단어 구까지 반영." },
    ],
    summary: "변수 독립을 가정한 베이즈 정리 기반 분류 — 텍스트 분류의 고전",
    intro:
      "베이즈 정리에 '변수들이 서로 독립'이라는 과감한 가정을 더해 클래스 확률을 계산합니다. 가정이 비현실적인데도 실전에서 의외로 잘 작동하고, 학습·예측이 매우 빨라 스팸 필터·민원 분류 같은 텍스트 문제의 고전적 베이스라인입니다.\n\n연속형 변수에는 GaussianNB, 단어 빈도에는 MultinomialNB를 씁니다.",
    tips: "출력 확률은 순위는 맞지만 값 자체는 극단(0 또는 1 근처)으로 치우치는 경향이 있습니다 — 확률 값을 그대로 업무 판단에 쓰려면 보정(calibration)이 필요합니다.",
    sections: [
      {
        title: "지정 적합 — 연속형 변수로 해지 예측(GaussianNB)",
        desc: "하이퍼파라미터를 지정해 탐색 없이 바로 결과를 봅니다. 샘플 데이터로 그대로 실행됩니다.",
        level: "basic",
        code: `from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
import pandas as pd

# ① 연속형 변수에는 GaussianNB(각 변수를 정규분포로 가정) — 단어 빈도면 아래 MultinomialNB
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# ② 하이퍼파라미터를 지정해 바로 적합 — 탐색 없이 결과부터 봅니다
#    var_smoothing=1e-9(기본) = 분산에 더하는 안정화 항, 분산이 0에 가까운 변수의 수치 오류 방지
#    priors: 모집단 해지율이 학습 데이터와 다르면 priors=[0.82, 0.18]처럼 직접 지정
nb = GaussianNB(var_smoothing=1e-9)
nb.fit(X_tr, y_tr)

# ③ 성능 확인 — 불균형(해지 18%)이라 정확도보다 재현율·AUC를 봅니다
#    샘플의 lapsed는 무작위로 만든 열이라 AUC가 0.5 근처(=찍기)로 나오는 것이 정상입니다.
#    'AUC 0.5 = 이 변수들로는 설명이 안 된다'를 읽는 연습으로 보고, 실제 데이터로 바꿔 확인하세요.
#    zero_division=0: 한 클래스를 아예 예측하지 않을 때 정밀도를 0으로(경고 대신)
proba = nb.predict_proba(X_te)[:, 1]
print(classification_report(y_te, nb.predict(X_te),
                            target_names=["유지", "해지"], zero_division=0))
print(f"ROC-AUC = {roc_auc_score(y_te, proba):.3f}")

# ④ 나이브 베이즈가 무엇을 보고 판단하는지 — 클래스별 변수 평균(theta_)
print("클래스별 변수 평균")
print(pd.DataFrame(nb.theta_, columns=X.columns, index=["유지", "해지"]).round(2))`,
      },
      {
        title: "텍스트 분류 — 민원 유형 자동 분류",
        level: "basic",
        code: `from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

X_tr, X_te, y_tr, y_te = train_test_split(
    df["complaint_text"], df["category"],
    test_size=0.2, stratify=df["category"], random_state=42,
)

nb = make_pipeline(TfidfVectorizer(min_df=3), MultinomialNB())
nb.fit(X_tr, y_tr)
print(classification_report(y_te, nb.predict(X_te)))

# 새 민원 분류
print(nb.predict(["보험금 지급이 한 달째 지연되고 있습니다"]))`,
      },
      {
        title: "확률 보정 — 예측 확률을 업무에 쓰려면",
        desc: "출력 확률이 0·1로 쏠리는 나이브 베이즈의 약점을 보정하고, 보정 전후를 Brier 점수·보정 곡선으로 비교합니다.",
        level: "advanced",
        code: `from sklearn.naive_bayes import GaussianNB
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# 나이브 베이즈 확률은 독립 가정 탓에 0·1로 쏠립니다 — 순위는 맞아도 값 자체는 못 믿습니다.
# 확률을 업무 계산(예: 기대손실 = 해지확률 × 금액)에 넣으려면 보정이 필요합니다.
raw = GaussianNB().fit(X_tr, y_tr)
cal = CalibratedClassifierCV(GaussianNB(), method="isotonic", cv=5).fit(X_tr, y_tr)

p_raw = raw.predict_proba(X_te)[:, 1]
p_cal = cal.predict_proba(X_te)[:, 1]

# Brier 점수 = (예측확률 − 실제)²의 평균 — 낮을수록 확률이 잘 맞습니다
# (샘플의 lapsed는 무작위라 원래 쏠림이 적어 개선 폭이 거의 없습니다 —
#  실제 텍스트·다변량 데이터에서는 보정 전후 차이가 뚜렷합니다)
print(f"Brier 원본 {brier_score_loss(y_te, p_raw):.4f} → 보정 {brier_score_loss(y_te, p_cal):.4f}")

# 보정 곡선: 대각선에 가까울수록 '예측 30%'가 실제로 30% 발생한다는 뜻
for name, p in [("원본", p_raw), ("보정", p_cal)]:
    frac, mean_pred = calibration_curve(y_te, p, n_bins=5, strategy="quantile")
    plt.plot(mean_pred, frac, marker="o", label=name)
plt.plot([0, 1], [0, 1], "k--", lw=1, label="완벽 보정")
plt.xlabel("예측 확률"); plt.ylabel("실제 발생 비율"); plt.legend()
plt.show()`,
      },
    ],
  },
  {
    id: "kmeans",
    name: "K-평균 군집",
    en: "K-means Clustering",
    category: "ml",
    weight: 3,
    difficulty: 3,
    params: [
      { name: "n_clusters", desc: "군집 수 k — 알고리즘이 정해주지 않습니다. 엘보(inertia 감소 둔화)와 실루엣 점수를 함께 보고 선택." },
      { name: "n_init", desc: "서로 다른 초기 중심으로 반복하는 횟수 — 국소해 방지. 10 이상 권장(최신 버전 기본 'auto')." },
      { name: "init", desc: "'k-means++'(기본, 좋은 초기 중심)·'random'. 바꿀 일은 드뭅니다." },
      { name: "random_state", desc: "재현성 고정 — 세그먼트 번호가 실행마다 바뀌지 않게." },
      { name: "max_iter / tol", desc: "수렴 반복 상한·허용 오차 — 대용량에서 조정." },
    ],
    summary: "라벨 없는 데이터를 k개 그룹으로 — 고객 세분화의 기본 도구",
    intro:
      "정답 라벨 없이, 서로 가까운 점끼리 k개의 군집으로 묶습니다. 각 군집의 중심을 반복적으로 갱신하는 단순한 알고리즘이지만 고객 세분화·계약 포트폴리오 분류에 여전히 가장 널리 쓰입니다.\n\nk는 분석자가 정해야 하므로, 엘보(관성 감소 추세)와 실루엣 점수(군집 응집도)를 함께 보고 선택합니다.",
    tips: "거리 기반이므로 스케일링이 필수입니다. 군집 결과는 '발견'이 아니라 '요약'입니다 — 군집별 평균 프로파일을 만들어 업무 언어로 이름 붙일 수 있어야 실무에서 의미가 있습니다.",
    sections: [
      {
        title: "특정 K로 군집화 — K를 지정해 바로 결과 보기",
        desc: "K를 직접 정해 한 번에 군집을 만들고 프로파일까지 읽습니다. 최적 K 탐색은 아래 고급 섹션.",
        level: "basic",
        code: `from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import pandas as pd
import matplotlib.pyplot as plt

# ① 군집에 쓸 변수 — 거리 기반이라 스케일링(평균0·표준편차1)이 먼저입니다
cols = ["age", "premium", "n_contracts", "tenure_months"]
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df[cols])

# ② K를 직접 지정해 바로 군집 — K=3은 예시(마케팅에서 3개 세그먼트를 원할 때처럼)
#    최적 K 탐색(엘보·실루엣)은 아래 고급 섹션. 우선 2~5를 바꿔가며 감을 잡습니다.
#    n_init=10 = 초기 중심을 10번 바꿔 시도(국소해 방지), random_state=42 = 재현용 고정 시드
km = KMeans(n_clusters=3, n_init=10, random_state=42)
df["segment"] = km.fit_predict(X_scaled)

# ③ 군집 크기 — 한 군집에 몰리거나 몇 건짜리 군집이 나오면 K·변수를 다시 봅니다
print("군집 크기")
print(df["segment"].value_counts().sort_index())

# ④ 군집 중심을 원래 단위로 되돌려 읽기 — 스케일 역변환해야 '나이 52세'처럼 해석됩니다
centers = pd.DataFrame(scaler.inverse_transform(km.cluster_centers_), columns=cols)
centers.index.name = "segment"
print("군집 중심(원 스케일)")
print(centers.round(1))

# ⑤ 군집별 프로파일 — 업무 언어로 이름 붙이는 근거
profile = df.groupby("segment")[cols].mean()
profile["n"] = df["segment"].value_counts().sort_index()
print("군집 프로파일")
print(profile.round(1))
# 예: 고연령·고보험료·장기 유지 군집 → 'VIP 장기고객'

# ⑥ 변수 4개를 PCA 2축으로 눌러 담아 눈으로 확인(군집 중심은 X 표시)
proj = PCA(n_components=2, random_state=42).fit(X_scaled)
P, Pc = proj.transform(X_scaled), proj.transform(km.cluster_centers_)
plt.scatter(P[:, 0], P[:, 1], c=df["segment"], s=10, alpha=0.5, cmap="viridis")
plt.scatter(Pc[:, 0], Pc[:, 1], c="red", marker="X", s=200, edgecolor="white")
plt.xlabel("PC1"); plt.ylabel("PC2"); plt.title("K=3 군집 (PCA 2축)")
plt.show()`,
      },
      {
        title: "k 선택 — 엘보 + 실루엣",
        level: "advanced",
        code: `from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt

X_scaled = StandardScaler().fit_transform(
    df[["age", "premium", "n_contracts", "tenure_months"]]
)

inertias, silhouettes = [], []
for k in range(2, 11):
    km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X_scaled)
    inertias.append(km.inertia_)
    silhouettes.append(silhouette_score(X_scaled, km.labels_))

fig, axes = plt.subplots(1, 2, figsize=(10, 4))
axes[0].plot(range(2, 11), inertias, marker="o"); axes[0].set_title("elbow")
axes[1].plot(range(2, 11), silhouettes, marker="o"); axes[1].set_title("silhouette")
plt.show()`,
      },
      {
        title: "군집 적용 + 프로파일링",
        desc: "위에서 탐색한 결과로 k를 정한 뒤(예: 4) 최종 군집을 확정하고 해석합니다.",
        level: "advanced",
        code: `km = KMeans(n_clusters=4, n_init=10, random_state=42).fit(X_scaled)
df["segment"] = km.labels_

# 군집별 평균 프로파일 — 업무 언어로 이름 붙이는 근거
profile = df.groupby("segment")[
    ["age", "premium", "n_contracts", "tenure_months"]
].agg(["mean", "count"])
print(profile.round(1))
# 예: segment 2 = 고연령·고보험료·장기 유지 → 'VIP 장기고객'`,
      },
    ],
  },
  {
    id: "hierarchical",
    name: "계층적 군집",
    en: "Hierarchical Clustering",
    category: "ml",
    weight: 1,
    difficulty: 3,
    params: [
      { name: "linkage(method=...)", desc: "병합 기준 — 'ward'(군집 내 분산 최소, 균형 잡힌 군집)·'average'·'complete'·'single'(사슬 현상 주의)." },
      { name: "linkage(metric=...)", desc: "거리 정의 — ward는 유클리드 전용. 다른 거리가 필요하면 average/complete와 조합." },
      { name: "fcluster(t, criterion=...)", desc: "'maxclust'(군집 수 지정)·'distance'(병합 거리 임계로 자르기) — 덴드로그램을 보고 결정." },
      { name: "dendrogram(truncate_mode='lastp', p=...)", desc: "마지막 p개 병합만 표시 — 표본이 많을 때 그림 간소화." },
    ],
    summary: "가까운 것부터 병합해 나무(덴드로그램)로 — k를 미리 정하지 않아도 됨",
    intro:
      "가장 가까운 점(군집)끼리 차례로 병합해 전체가 하나가 될 때까지의 과정을 나무 그림(덴드로그램)으로 남깁니다. 그림을 보고 적절한 높이에서 잘라 군집 수를 사후에 정할 수 있어, k를 미리 정해야 하는 K-평균과 보완 관계입니다.\n\n모든 쌍의 거리를 계산하므로 수천 건 이상에서는 느려집니다 — 대용량은 표본을 뽑아 구조를 본 뒤 K-평균으로 확정하는 절충이 실용적입니다.",
    sections: [
      {
        title: "군집 수를 지정해 바로 절단",
        desc: "덴드로그램을 그리기 전에, 원하는 군집 수를 지정해 결과부터 확인합니다.",
        level: "basic",
        code: `from sklearn.cluster import AgglomerativeClustering
from sklearn.preprocessing import StandardScaler

# ① 거리 기반이라 스케일링이 먼저 — 단위가 큰 보험료가 거리를 독점하지 않게
cols = ["age", "premium", "tenure_months"]
X_scaled = StandardScaler().fit_transform(df[cols])

# ② 군집 수를 직접 지정해 바로 절단 — n_clusters=3은 예시(2~5를 바꿔가며 확인)
#    linkage="ward" = 병합 시 군집 내 분산이 가장 적게 늘어나는 쌍부터(가장 무난한 기본값)
#    적정 군집 수 탐색(덴드로그램)·연결법 비교는 아래 고급 섹션 참조
hc = AgglomerativeClustering(n_clusters=3, linkage="ward")
df["cluster"] = hc.fit_predict(X_scaled)

# ③ 군집 크기 — 한 군집이 대부분을 삼키면 연결법·변수를 다시 봅니다
print("군집 크기")
print(df["cluster"].value_counts().sort_index())

# ④ 군집별 평균 프로파일 — K-평균과 같은 방식으로 업무 언어를 붙입니다
profile = df.groupby("cluster")[cols].mean()
profile["n"] = df["cluster"].value_counts().sort_index()
print(profile.round(1))`,
      },
      {
        title: "덴드로그램 + 군집 잘라내기",
        level: "advanced",
        code: `from scipy.cluster.hierarchy import linkage, dendrogram, fcluster
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

X_scaled = StandardScaler().fit_transform(df[["age", "premium", "tenure_months"]])

Z = linkage(X_scaled, method="ward")   # ward: 군집 내 분산 최소화

plt.figure(figsize=(12, 5))
dendrogram(Z, truncate_mode="lastp", p=30)
plt.ylabel("병합 거리")
plt.show()

# 덴드로그램을 보고 군집 수 결정 → 라벨 부여
df["cluster"] = fcluster(Z, t=4, criterion="maxclust")
print(df["cluster"].value_counts())`,
      },
      {
        title: "연결법 비교 — ward·average·complete·single",
        desc: "같은 데이터·같은 군집 수에서 병합 기준만 바꿔 결과가 얼마나 달라지는지 확인합니다. (위 셀의 X_scaled 사용)",
        level: "advanced",
        code: `from scipy.cluster.hierarchy import linkage, fcluster
from sklearn.metrics import silhouette_score
import pandas as pd

for method in ["ward", "average", "complete", "single"]:
    lab = fcluster(linkage(X_scaled, method=method), t=4, criterion="maxclust")
    sizes = pd.Series(lab).value_counts().sort_index().tolist()
    print(f"{method:9s} silhouette={silhouette_score(X_scaled, lab):+.3f} 군집크기={sizes}")

# single은 가까운 점을 사슬처럼 이어붙여 한 군집이 거의 전부를 삼키기 쉽습니다(chaining).
# 실루엣 점수가 높아도 [597, 1, 1, 1] 같은 크기 분포면 업무적으로 쓸 수 없습니다 —
# 점수 하나만 보지 말고 군집 크기 분포를 반드시 함께 확인하세요.`,
      },
    ],
  },
  {
    id: "pca",
    name: "주성분분석(PCA)",
    en: "Principal Component Analysis",
    category: "ml",
    weight: 3,
    difficulty: 4,
    params: [
      { name: "n_components", desc: "정수면 성분 개수, 0~1 실수면 그 비율의 설명분산을 채우는 최소 개수 자동 선택(예: 0.9), 'mle'면 자동 추정." },
      { name: "whiten=True", desc: "각 성분의 분산을 1로 정규화 — PCA 출력을 다른 모델 입력으로 쓸 때." },
      { name: "svd_solver", desc: "'auto'(기본)·'randomized'(대규모 데이터 근사 고속)." },
      { name: "fit vs transform", desc: "학습 데이터에만 fit하고 검증·신규 데이터는 transform만 — 정보 누수 방지의 기본기." },
    ],
    summary: "상관된 여러 변수를 소수의 축으로 압축 — 차원 축소·시각화·다중공선성 해소",
    intro:
      "분산이 가장 큰 방향부터 새로운 축(주성분)을 차례로 찾아, 서로 상관된 많은 변수를 정보 손실을 최소화하며 소수의 축으로 압축합니다. 수십 개 변수를 2~3개 축으로 줄여 시각화하거나, 회귀 전 다중공선성을 해소하는 전처리로 씁니다.\n\n각 주성분이 원래 변수들의 어떤 조합인지(로딩)를 읽으면 '종합 규모 축', '위험 성향 축' 같은 해석도 가능합니다.",
    tips: "분산 기반이므로 스케일링 없이 쓰면 단위가 큰 변수가 축을 독점합니다. 누적 설명분산 80~90%를 기준으로 성분 수를 정하는 것이 관례입니다.",
    sections: [
      {
        title: "2개 성분 지정 — 설명분산·2차원 산점도·로딩",
        desc: "성분 수를 2로 지정해 바로 그림을 봅니다. 성분 수를 고르는 방법은 아래 고급 섹션.",
        level: "basic",
        code: `from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import pandas as pd
import matplotlib.pyplot as plt

# ① 압축할 변수와 색으로 구분할 라벨 — 샘플로 바로 실행(실제 데이터면 열 이름만 교체)
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)

# ② 분산이 큰 방향을 찾는 방법이라 스케일링이 먼저 — 단위 큰 변수의 축 독점 방지
X_scaled = StandardScaler().fit_transform(X)

# ③ 성분 수를 2로 지정 — 눈으로 보려면 2축이 기본
#    (누적 설명분산 기준으로 성분 수를 고르는 방법은 아래 고급 섹션)
pca2 = PCA(n_components=2, random_state=42)
P = pca2.fit_transform(X_scaled)

# ④ 이 2축이 원래 정보의 몇 %를 담고 있나 — 낮으면 2D 그림만으로 결론내면 안 됩니다
ev = pca2.explained_variance_ratio_
print(f"PC1 {ev[0]:.1%} · PC2 {ev[1]:.1%} · 2축 합계 {ev.sum():.1%}")

# ⑤ 2차원 산점도 — 라벨(해지 여부)로 색을 나눠 군집·이상치를 눈으로 확인
plt.scatter(P[:, 0], P[:, 1], c=y, s=8, alpha=0.5, cmap="coolwarm")
plt.xlabel(f"PC1 ({ev[0]:.1%})"); plt.ylabel(f"PC2 ({ev[1]:.1%})")
plt.title("PCA 2축 투영")
plt.show()

# ⑥ 로딩 — 각 축이 어떤 변수의 조합인지(절댓값이 큰 변수가 그 축의 정체)
loadings = pd.DataFrame(pca2.components_.T, index=X.columns, columns=["PC1", "PC2"])
print(loadings.round(3))
# 예: PC1에 premium·n_contracts가 크게 실리면 → '거래 규모 축'으로 이름 붙일 수 있습니다`,
      },
      {
        title: "성분 수 결정 — 누적 설명분산 + 로딩",
        desc: "모든 성분을 뽑아 누적 설명분산을 보고 채택할 성분 수를 정합니다. (위 셀의 X·y 사용)",
        level: "advanced",
        code: `from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import pandas as pd
import matplotlib.pyplot as plt

X_scaled = StandardScaler().fit_transform(X)

pca = PCA()
Z = pca.fit_transform(X_scaled)

# 성분별 설명분산 — 누적 80~90%까지 채택
ratio = pca.explained_variance_ratio_
print(pd.Series(ratio.cumsum().round(3), name="누적설명분산"))

# 첫 두 성분으로 산점도 (라벨 색)
plt.scatter(Z[:, 0], Z[:, 1], c=y, s=8, alpha=0.5, cmap="coolwarm")
plt.xlabel("PC1"); plt.ylabel("PC2")
plt.show()

# 로딩: 각 주성분이 어떤 변수의 조합인지
loadings = pd.DataFrame(pca.components_[:2].T,
                        index=X.columns, columns=["PC1", "PC2"])
print(loadings.round(3))`,
      },
      {
        title: "whiten·파이프라인 — PCA를 모델 입력으로",
        desc: "성분 수를 설명분산 비율로 자동 선택하고, 누수 없이 모델에 연결합니다. (위 셀의 X·y 사용)",
        level: "advanced",
        code: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

# n_components=0.9 → 누적 설명분산 90%를 채우는 최소 성분 수를 PCA가 스스로 선택
# whiten=True → 각 성분의 분산을 1로 맞춰, 뒤에 오는 모델이 축 크기에 휘둘리지 않게
pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("pca", PCA(n_components=0.9, whiten=True, random_state=42)),
    ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
])

# 스케일러·PCA를 파이프라인 안에 넣어야 각 폴드에서 학습 폴드에만 fit — 정보 누수 방지
scores = cross_val_score(pipe, X, y, cv=5, scoring="roc_auc")
print(f"PCA(90%)+로지스틱 AUC = {scores.mean():.3f} ± {scores.std():.3f}")

pipe.fit(X, y)
print("자동 선택된 성분 수:", pipe.named_steps["pca"].n_components_, f"(원 변수 {X.shape[1]}개)")
# 샘플처럼 변수들이 서로 거의 무상관이면 압축할 여지가 없어 성분 수가 줄지 않습니다.
# PCA는 '변수들이 서로 상관되어 있을 때' 효과가 나는 방법입니다 — 먼저 상관행렬을 확인하세요.`,
      },
    ],
  },
  {
    id: "cross-validation",
    name: "교차검증·튜닝",
    en: "Cross-validation · GridSearchCV",
    category: "ml",
    weight: 4,
    difficulty: 3,
    params: [
      { name: "train_test_split(stratify=y)", desc: "클래스 비율을 유지한 계층 분할 — 분류 문제 기본. test_size로 비율(0.2 등) 지정." },
      { name: "cv", desc: "정수(분류는 자동 StratifiedKFold)·KFold(shuffle=True, random_state)·TimeSeriesSplit(시계열은 시간 순서 유지 필수)." },
      { name: "scoring", desc: "'roc_auc'·'f1'·'neg_root_mean_squared_error' 등 문자열 지표 — 업무 목표에 맞는 지표로 튜닝해야 의미가 있습니다." },
      { name: "GridSearchCV(param_grid, n_jobs, refit)", desc: "탐색 격자·병렬 수·최적 조합 자동 재학습(기본 True). 파이프라인 파라미터는 '단계이름__파라미터' 표기." },
      { name: "RandomizedSearchCV(n_iter)", desc: "격자 대신 무작위 n_iter개 조합 — 파라미터가 많을 때 같은 예산으로 더 넓게 탐색." },
    ],
    summary: "데이터를 여러 번 나눠 성능을 안정적으로 추정하고 하이퍼파라미터를 탐색",
    intro:
      "한 번의 train/test 분할은 운에 좌우됩니다. k-겹 교차검증은 데이터를 k조각으로 나눠 k번 학습·평가한 평균으로 성능을 안정적으로 추정하며, GridSearchCV는 이 위에서 하이퍼파라미터 조합을 체계적으로 탐색합니다.\n\n어떤 모델을 쓰든 '이 성능 수치를 믿어도 되는가'를 보장하는 공통 인프라이므로, 개별 알고리즘보다 먼저 몸에 익혀야 하는 절차입니다.",
    tips: "분류에서는 stratify(계층 분할)로 클래스 비율을 유지하세요. 스케일링·인코딩은 반드시 Pipeline 안에 넣어야 검증 폴드의 정보가 학습에 새는 것(data leakage)을 막을 수 있습니다.",
    sections: [
      {
        title: "한 번 나눠 한 번 평가 — 가장 단순한 검증",
        desc: "8:2로 한 번 나눠 지정한 설정으로 학습·평가합니다. 교차검증이 왜 필요한지도 여기서 드러납니다.",
        level: "basic",
        code: `from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score

# ① 설명변수와 목표 — 샘플로 바로 실행(실제 데이터면 열 이름만 교체)
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)

# ② 8:2로 한 번만 나눕니다 — test_size=0.2는 관례(데이터가 적으면 0.3)
#    stratify=y: 해지 비율을 학습·평가에 똑같이 유지(분류의 기본)
#    random_state=42: 같은 분할을 재현하기 위한 고정 시드(숫자 자체에 의미는 없음)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
print(f"학습 {len(X_tr)}건 · 평가 {len(X_te)}건 | 해지율 학습 {y_tr.mean():.1%} · 평가 {y_te.mean():.1%}")

# ③ 하이퍼파라미터를 지정해 바로 학습 — 탐색(GridSearchCV)은 아래 고급 섹션
model = LogisticRegression(max_iter=1000, class_weight="balanced")
model.fit(X_tr, y_tr)

# ④ 한 번 평가한 성능
proba = model.predict_proba(X_te)[:, 1]
print(f"정확도 {accuracy_score(y_te, model.predict(X_te)):.3f} · AUC {roc_auc_score(y_te, proba):.3f}")

# ⑤ 주의: 이 숫자 하나는 '어떻게 나뉘었나'라는 운에 흔들립니다.
#    시드만 바꿔 같은 모델을 다시 평가해 보면 값이 꽤 달라집니다 —
#    그래서 아래 고급 섹션에서 여러 번 나눠 평균(교차검증)으로 보고합니다.
for seed in [0, 1, 2]:
    Xa, Xb, ya, yb = train_test_split(X, y, test_size=0.2, stratify=y, random_state=seed)
    m = LogisticRegression(max_iter=1000, class_weight="balanced").fit(Xa, ya)
    print(f"  random_state={seed} → AUC {roc_auc_score(yb, m.predict_proba(Xb)[:, 1]):.3f}")`,
      },
      {
        title: "k-겹 교차검증 — 평균±표준편차로 보고",
        level: "advanced",
        code: `from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.linear_model import LogisticRegression

# 샘플로 바로 실행 — 실제 데이터면 열 이름만 교체
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
model = LogisticRegression(max_iter=1000, class_weight="balanced")

# 최종 평가용 test는 처음에 떼어놓고 끝까지 봉인
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# 5-겹 교차검증 — 평균 ± 표준편차로 보고
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X_tr, y_tr, cv=cv, scoring="roc_auc")
print(f"AUC = {scores.mean():.3f} ± {scores.std():.3f}")`,
      },
      {
        title: "GridSearchCV — 파이프라인째 튜닝",
        level: "advanced",
        code: `from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV

pipe = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(max_iter=1000)),
])

grid = GridSearchCV(
    pipe,
    {"clf__C": [0.01, 0.1, 1, 10],
     "clf__class_weight": [None, "balanced"]},
    cv=5, scoring="roc_auc", n_jobs=-1,
).fit(X_tr, y_tr)

print(grid.best_params_, f"CV AUC={grid.best_score_:.3f}")
print(f"봉인해둔 test AUC = {grid.score(X_te, y_te):.3f}")`,
      },
      {
        title: "여러 분할 전략 — KFold·Stratified·Repeated·TimeSeries·Group",
        desc: "문제 성격에 맞는 분할기를 골라 같은 모델을 검증합니다. (위 셀의 X·y·model 사용)",
        level: "advanced",
        code: `from sklearn.model_selection import (KFold, StratifiedKFold, RepeatedKFold,
    TimeSeriesSplit, GroupKFold, cross_val_score)

splitters = {
    "KFold(5,shuffle)":  KFold(n_splits=5, shuffle=True, random_state=0),
    "StratifiedKFold(5)": StratifiedKFold(n_splits=5, shuffle=True, random_state=0),  # 분류 기본(클래스 비율 유지)
    "RepeatedKFold(5x3)": RepeatedKFold(n_splits=5, n_repeats=3, random_state=0),      # 반복으로 더 안정
}
for name, cv in splitters.items():
    s = cross_val_score(model, X, y, cv=cv, scoring="roc_auc")
    print(f"{name:20s} AUC {s.mean():.3f} ± {s.std():.3f}")

# 시계열: 과거로 학습·미래로 검증(순서 유지 — 절대 shuffle 금지)
print("TimeSeriesSplit 폴드 수:", TimeSeriesSplit(n_splits=5).get_n_splits())

# 그룹 누수 방지: 같은 고객이 학습·검증에 동시에 들어가지 않게
gs = cross_val_score(model, X, y, cv=GroupKFold(n_splits=5),
                     groups=df["customer_id"], scoring="roc_auc")
print(f"GroupKFold(고객 기준) AUC {gs.mean():.3f} ± {gs.std():.3f}")`,
      },
      {
        title: "다중 지표·예측 수집 — cross_validate·cross_val_predict",
        desc: "여러 지표를 한 번에 평가하고, out-of-fold 예측으로 과적합 없는 혼동행렬을 만듭니다.",
        level: "advanced",
        code: `from sklearn.model_selection import cross_validate, cross_val_predict
from sklearn.metrics import confusion_matrix
import pandas as pd

# 한 번에 여러 지표(+학습/검증 시간)
cvres = cross_validate(model, X, y, cv=5,
    scoring=["roc_auc", "average_precision", "f1"], return_train_score=True)
print(pd.DataFrame(cvres).filter(like="test_").mean().round(3))

# 각 표본이 '검증 폴드에 있을 때'의 예측 → 혼동행렬(누수 없는 진단)
oof = cross_val_predict(model, X, y, cv=5)
print("out-of-fold 혼동행렬\\n", confusion_matrix(y, oof))`,
      },
      {
        title: "중첩 교차검증 — 튜닝과 평가 분리(편향 없는 성능)",
        desc: "안쪽 루프에서 튜닝, 바깥 루프에서 '튜닝을 포함한 절차 전체'의 일반화 성능을 추정합니다.",
        level: "advanced",
        code: `from sklearn.model_selection import GridSearchCV, cross_val_score, StratifiedKFold
from sklearn.linear_model import LogisticRegression

inner = StratifiedKFold(5, shuffle=True, random_state=1)
outer = StratifiedKFold(5, shuffle=True, random_state=2)

grid = GridSearchCV(LogisticRegression(max_iter=1000),
                    {"C": [0.1, 1, 10]}, cv=inner, scoring="roc_auc")
# 바깥 루프가 안쪽 튜닝을 감싸므로 test 누수 없이 절차 전체를 평가
nested = cross_val_score(grid, X, y, cv=outer, scoring="roc_auc")
print(f"nested CV AUC = {nested.mean():.3f} ± {nested.std():.3f}")`,
      },
    ],
  },
  {
    id: "model-eval",
    name: "모델 평가 지표",
    en: "Evaluation Metrics",
    category: "ml",
    weight: 3,
    difficulty: 3,
    params: [
      { name: "confusion_matrix(normalize=...)", desc: "'true'면 행(실제 클래스) 기준 비율 — 클래스 크기가 달라도 읽기 쉬워집니다." },
      { name: "classification_report(target_names, digits)", desc: "클래스 표시 이름과 소수 자릿수 지정." },
      { name: "roc_auc_score(average=...)", desc: "다중 클래스면 'macro'(클래스 동일 가중)·'weighted'(빈도 가중), multi_class='ovr' 지정." },
      { name: "f1_score(average=...)", desc: "'binary'(기본)·'macro'·'micro'·'weighted' — 불균형 다중 분류 보고 시 macro를 함께." },
      { name: "RMSE 계산", desc: "root_mean_squared_error(신버전) 또는 mean_squared_error 후 np.sqrt — 버전에 따라 squared=False 지원이 다릅니다." },
    ],
    summary: "혼동행렬·정밀도·재현율·ROC-AUC·RMSE — 문제에 맞는 자로 재기",
    intro:
      "분류는 혼동행렬에서 출발합니다. 정밀도(해지 예측 중 실제 해지 비율)와 재현율(실제 해지 중 잡아낸 비율)은 서로 상충하므로 업무 비용에 따라 무게를 정하고, 임계값과 무관한 종합 지표로 ROC-AUC를 씁니다.\n\n회귀는 RMSE(큰 오차에 민감)·MAE(직관적인 평균 오차)·R²를 함께 봅니다. 클래스가 불균형하면 accuracy는 착시를 만드므로 반드시 피해야 합니다.",
    tips: "해지 예측처럼 놓치는 비용이 큰 문제는 재현율을, 오탐 비용이 큰 문제(마케팅 발송 등)는 정밀도를 우선하세요. PR-AUC는 심한 불균형에서 ROC-AUC보다 민감한 지표입니다.",
    sections: [
      {
        title: "평가 대상 준비 — 지정 설정으로 분류·회귀 모델 학습",
        desc: "아래 지표 섹션들이 쓰는 model(분류)·reg(회귀)를 지정 설정 그대로 학습시켜 둡니다. 샘플 데이터로 그대로 실행됩니다.",
        level: "basic",
        code: `from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression, LinearRegression

# 하이퍼파라미터는 지정값 그대로 — 여기서는 '지표 읽는 법'에만 집중합니다.

# ① 분류: 해지 여부 예측 → model·X_te·y_te
X = df[["age", "premium", "bmi", "tenure_months", "n_contracts"]]
y = df["lapsed"].astype(int)
X_tr, X_te, y_tr, y_te = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
model = LogisticRegression(max_iter=1000, class_weight="balanced").fit(X_tr, y_tr)

# ② 회귀: 보험료 예측 → reg·Xr_te·yr_te (목표가 달라 변수를 따로 둡니다)
Xr = df[["age", "bmi", "tenure_months", "n_contracts"]]
yr = df["premium"]
Xr_tr, Xr_te, yr_tr, yr_te = train_test_split(Xr, yr, test_size=0.2, random_state=42)
reg = LinearRegression().fit(Xr_tr, yr_tr)

print(f"준비 완료 — 분류 평가 {len(X_te)}건(해지 {y_te.sum()}건) · 회귀 평가 {len(Xr_te)}건")`,
      },
      {
        title: "분류 — 혼동행렬·리포트·ROC 곡선",
        level: "basic",
        code: `from sklearn.metrics import (
    confusion_matrix, classification_report,
    roc_auc_score, RocCurveDisplay,
)
import matplotlib.pyplot as plt

pred = model.predict(X_te)
proba = model.predict_proba(X_te)[:, 1]

print(confusion_matrix(y_te, pred))
#           예측0   예측1
#  실제0 [[ TN     FP ]
#  실제1  [ FN     TP ]]

print(classification_report(y_te, pred, target_names=["유지", "해지"]))
print(f"ROC-AUC = {roc_auc_score(y_te, proba):.3f}")

RocCurveDisplay.from_predictions(y_te, proba)
plt.show()`,
      },
      {
        title: "회귀 — RMSE·MAE·R²",
        level: "basic",
        code: `from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np

pred = reg.predict(Xr_te)
print(f"RMSE = {np.sqrt(mean_squared_error(yr_te, pred)):,.0f}")  # 큰 오차에 민감
print(f"MAE  = {mean_absolute_error(yr_te, pred):,.0f}")          # 평균적 오차 크기
print(f"R2   = {r2_score(yr_te, pred):.3f}")                      # 설명 분산 비율`,
      },
      {
        title: "임계값 선택 — 업무 비용으로 컷오프 정하기 + PR 곡선",
        desc: "predict()의 0.5는 관례일 뿐입니다. 오탐·미탐 비용을 넣어 임계값을 직접 고릅니다. (위 셀의 model·X_te·y_te 사용)",
        level: "advanced",
        code: `from sklearn.metrics import (precision_recall_curve, average_precision_score,
    PrecisionRecallDisplay)
import numpy as np
import matplotlib.pyplot as plt

proba = model.predict_proba(X_te)[:, 1]

# PR-AUC — 심한 불균형에서 ROC-AUC보다 민감. 기준선(=양성 비율)과 비교해야 의미가 있습니다.
print(f"PR-AUC = {average_precision_score(y_te, proba):.3f} (찍기 수준 기준선 {y_te.mean():.3f})")
PrecisionRecallDisplay.from_predictions(y_te, proba)
plt.show()

# 임계값은 업무 비용으로 고릅니다.
# 예: 해지를 놓치면(FN) 500만원 손실, 불필요한 방어 마케팅(FP)은 20만원 비용
COST_FN, COST_FP = 5_000_000, 200_000

def total_cost(t):
    pred_t = (proba >= t).astype(int)
    fn = int(((y_te == 1) & (pred_t == 0)).sum())   # 놓친 해지
    fp = int(((y_te == 0) & (pred_t == 1)).sum())   # 헛방어
    return fn * COST_FN + fp * COST_FP

_, _, thr = precision_recall_curve(y_te, proba)
costs = [total_cost(t) for t in thr]
best = int(np.argmin(costs))

print(f"비용 최소 임계값 = {thr[best]:.3f} → 예상 비용 {costs[best]:,}원")
print(f"관례적 0.5 임계값  → 예상 비용 {total_cost(0.5):,}원")
# 놓치는 비용(FN)이 헛방어 비용(FP)보다 크면 임계값은 0.5보다 낮아집니다
# — 조금 헛방어를 하더라도 해지를 더 많이 잡는 쪽이 싸기 때문입니다.`,
      },
    ],
  },
  /* ───────────────────────── 보험·계리 (actuarial) ───────────────────────── */
  ...ACTUARIAL_METHODS,
  /* ─────────────────────── 데이터 핸들링 (wrangle) ─────────────────────── */
  {
    id: "select-rows-cols",
    name: "행·열 선택",
    en: "loc · iloc",
    category: "wrangle",
    weight: 5,
    difficulty: 1,
    params: [
      { name: "loc[행, 열]", desc: "라벨 기준 — 라벨·라벨 목록·슬라이스(끝 포함)·불리언 마스크 모두 허용. 값 대입도 loc로(경고 없는 안전한 방법)." },
      { name: "iloc[행, 열]", desc: "정수 위치 기준 — 파이썬 슬라이스 규칙(끝 제외)·음수 인덱스 허용." },
      { name: "at / iat", desc: "단일 값 전용 고속 접근 — 루프 안에서 한 칸씩 읽고 쓸 때 loc보다 빠릅니다." },
      { name: "select_dtypes(include/exclude)", desc: "'number'·'object'·'datetime' 등 자료형으로 열 묶음 선택." },
      { name: "filter(items/like/regex)", desc: "열 이름 패턴 선택 — like='_amt'면 이름에 _amt가 든 열 전부." },
    ],
    summary: "라벨 기준 loc, 위치(정수) 기준 iloc — 특정 행·열을 꺼내는 기본 문법",
    intro:
      "pandas에서 데이터를 꺼내는 두 축입니다. loc는 라벨(인덱스 이름·열 이름) 기준, iloc는 위치(0부터 시작하는 정수) 기준으로 동작합니다. 둘 다 [행, 열] 순서로 지정하며, 콜론(:)은 '전부'를 뜻합니다.\n\n엑셀로 치면 loc는 이름으로 범위를 지정하는 것, iloc는 '3번째 행, 2번째 열'처럼 좌표로 집는 것에 해당합니다.",
    tips: "loc의 슬라이스(a:c)는 끝을 포함하고, iloc의 슬라이스(0:3)는 끝을 제외합니다 — 파이썬 리스트와 같은 쪽은 iloc입니다. 한 열은 df[\"col\"](Series), 여러 열은 df[[\"a\",\"b\"]](대괄호 두 겹, DataFrame)로 구분하세요.",
    sections: [
      {
        title: "열 선택",
        level: "basic",
        code: `import pandas as pd

df = pd.read_excel("policy.xlsx")

s = df["premium"]                    # 한 열 → Series
sub = df[["policy_id", "premium"]]   # 여러 열 → DataFrame (대괄호 두 겹)

num = df.select_dtypes("number")     # 자료형으로 선택
amt = df.filter(like="_amt")         # 이름 패턴으로 선택 (…_amt 열 전부)`,
      },
      {
        title: "행·[행, 열] 선택 — loc와 iloc",
        level: "basic",
        code: `# loc — 라벨 기준 [행, 열]
df.loc[0]                                  # 인덱스 라벨 0인 행
df.loc[0:4, ["policy_id", "premium"]]      # 라벨 0~4 (끝 포함!)
df.loc[df["age"] >= 60, "premium"]         # 조건 행 + 특정 열

# iloc — 위치 기준 [행, 열]
df.iloc[0]                # 첫 행
df.iloc[:5, :3]           # 앞 5행 × 앞 3열 (끝 제외)
df.iloc[-10:]             # 마지막 10행
df.iloc[[0, 5, 9], [1, 2]]  # 흩어진 위치 지정

# 값 하나만 빠르게
df.at[0, "premium"]       # 라벨 기준 단일 값
df.iat[0, 3]              # 위치 기준 단일 값`,
      },
    ],
  },
  {
    id: "filter-condition",
    name: "조건 필터링",
    en: "Boolean Indexing · query",
    category: "wrangle",
    weight: 5,
    difficulty: 1,
    params: [
      { name: "& | ~ 와 괄호", desc: "그리고(&)·또는(|)·부정(~) — and/or/not은 쓸 수 없고, 각 조건은 반드시 괄호로 감쌉니다." },
      { name: "between(left, right, inclusive=...)", desc: "구간 조건 — 'both'(기본, 양끝 포함)·'neither'·'left'·'right'." },
      { name: "str.contains(pat, na=, case=, regex=)", desc: "문자열 포함 — na=False로 결측 처리 필수, case=False 대소문자 무시, regex=False면 문자 그대로." },
      { name: "query(expr)", desc: "SQL처럼 읽히는 조건식 — 외부 변수는 @변수, 공백 포함 열 이름은 백틱으로 감쌉니다." },
      { name: "where(cond, other=...)", desc: "필터와 달리 행을 유지한 채 조건 거짓인 곳만 NaN(또는 대체값)으로 바꿉니다." },
    ],
    summary: "조건식으로 참인 행만 추출 — &(그리고) |(또는) 와 괄호가 핵심",
    intro:
      "조건식이 만든 True/False 배열(불리언 마스크)을 df[...]에 넣으면 참인 행만 남습니다. 여러 조건은 and/or가 아니라 &와 |로 잇고, 각 조건을 반드시 괄호로 감싸야 합니다 — 연산자 우선순위 때문에 괄호가 없으면 에러가 나거나 다른 결과가 나옵니다.\n\n조건이 길어지면 query()가 SQL의 WHERE처럼 읽기 좋은 대안이 됩니다.",
    tips: "부정은 ~(물결)입니다: df[~mask]. 문자열 조건은 str.contains, 구간은 between이 간결합니다. 필터한 결과를 수정할 때는 SettingWithCopyWarning을 피하기 위해 .copy()를 붙이는 습관을 들이세요.",
    sections: [
      {
        title: "불리언 인덱싱 — 단일·복수 조건",
        level: "basic",
        code: `# 단일 조건
seniors = df[df["age"] >= 60]

# 복수 조건 — & | 와 괄호 필수
target = df[(df["age"] >= 40) & (df["age"] < 60) & (df["product"] == "종신")]
either = df[(df["region"] == "서울") | (df["region"] == "경기")]

# 부정(~), 구간(between), 문자열 포함(str.contains)
active = df[~df["lapsed"]]
mid = df[df["premium"].between(50_000, 150_000)]        # 양끝 포함
cancer = df[df["product_name"].str.contains("암", na=False)]`,
      },
      {
        title: "query — SQL처럼 읽히는 조건식",
        level: "basic",
        code: `# 같은 조건을 query로 — 열 이름을 따옴표 없이 그대로 사용
target = df.query("40 <= age < 60 and product == '종신'")

# 외부 변수는 @ 로 참조
min_prem = 100_000
high = df.query("premium >= @min_prem and not lapsed")

# 결과 건수 빠른 확인
print(len(target), "건 /", len(df), "건")`,
      },
    ],
  },
  {
    id: "isin",
    name: "isin 발췌",
    en: "isin",
    category: "wrangle",
    weight: 3,
    difficulty: 1,
    params: [
      { name: "isin(values)", desc: "리스트·set·Series(다른 표의 열) 모두 허용 — Series를 주면 명단 대조가 한 줄." },
      { name: "~ (반전)", desc: "~df['col'].isin([...]) — 목록에 없는 행만(제외 필터)." },
      { name: "df.isin(dict)", desc: "DataFrame 단위 — {'열이름': [목록]}으로 열마다 다른 목록을 검사." },
      { name: "다중 열 조합 대조", desc: "두 열 이상 조합의 존재 여부는 isin 대신 merge(how='inner') 또는 how='left'+indicator가 정확합니다." },
    ],
    summary: "값이 목록 안에 있는 행만 추출 — ==를 여러 번 잇는 것보다 간결·빠름",
    intro:
      "'상품이 A 또는 B 또는 C인 행'처럼 값 목록에 해당하는 행을 뽑을 때 씁니다. (x == a) | (x == b) | ... 를 길게 잇는 대신 isin([a, b, c]) 한 번으로 끝나고, 목록이 길어져도 성능이 안정적입니다.\n\n다른 데이터프레임의 열을 목록으로 넘기면 'VIP 명단에 있는 계약만' 같은 대조 추출이 한 줄로 됩니다.",
    tips: "~df[\"col\"].isin([...])으로 '목록에 없는 행'(제외)을 만들 수 있습니다. 대조 기준 열에 결측이 섞여 있으면 dropna() 후 넘기는 것이 안전합니다.",
    sections: [
      {
        title: "목록 포함·제외·명단 대조",
        level: "basic",
        code: `# 특정 상품군만 추출
picked = df[df["product"].isin(["종신", "정기", "암보험"])]

# 목록에 없는 행 (제외)
others = df[~df["product"].isin(["종신", "정기", "암보험"])]

# 다른 DataFrame의 명단과 대조 — VIP 고객의 계약만
vip = pd.read_excel("vip_list.xlsx")
vip_contracts = df[df["customer_id"].isin(vip["customer_id"])]

# 여러 열 동시 대조는 merge가 더 적합 (join·merge 항목 참고)
print(len(vip_contracts), "건")`,
      },
    ],
  },
  {
    id: "conditional",
    name: "조건 분기",
    en: "np.where · np.select · case",
    category: "wrangle",
    weight: 3,
    difficulty: 2,
    params: [
      { name: "np.where(cond, a, b)", desc: "이항 분기(IF) — 조건이 참이면 a, 거짓이면 b. 중첩보다는 np.select 권장." },
      { name: "np.select(condlist, choicelist, default)", desc: "다중 분기(CASE WHEN) — 위에서부터 첫 번째 참인 조건이 이기므로 조건 순서가 결과를 바꿉니다." },
      { name: "pd.cut(bins, labels, right, include_lowest)", desc: "경계 직접 구간화 — right=False면 [a, b) 왼쪽 포함. 경계 밖 값은 NaN이 되므로 양끝을 넉넉히." },
      { name: "pd.qcut(q, labels, duplicates=...)", desc: "분위수 균등 구간화 — 같은 값이 몰려 경계가 겹치면 duplicates='drop'." },
      { name: "Series.case_when([(cond, val), ...])", desc: "pandas 2.2+ — 메서드 체인 안에서 다중 분기를 이어 쓸 수 있습니다." },
    ],
    summary: "if/else·CASE WHEN을 벡터 연산으로 — 조건에 따라 다른 값을 부여",
    intro:
      "엑셀의 IF, SQL의 CASE WHEN에 해당합니다. 이항 분기는 np.where(조건, 참값, 거짓값), 다중 분기는 np.select(조건 목록, 값 목록, 기본값)로 처리합니다. 행마다 파이썬 if를 도는 apply보다 수십 배 빠른 벡터 연산입니다.\n\n연속값을 구간으로 나눌 때(연령대·금액대)는 조건을 나열하는 대신 pd.cut이 더 간결하고 안전합니다.",
    tips: "np.select는 위에서부터 첫 번째로 참인 조건이 이깁니다 — 조건 순서가 결과를 바꿉니다. pandas 2.2+에는 메서드 체인 친화적인 Series.case_when도 있습니다.",
    sections: [
      {
        title: "이항·다중 분기 — np.where · np.select",
        level: "basic",
        code: `import numpy as np

# 이항 분기 (IF)
df["risk"] = np.where(df["age"] >= 60, "고위험", "일반")

# 다중 분기 (CASE WHEN) — 첫 번째 참인 조건 적용
conditions = [
    df["loss_ratio"] >= 1.0,
    df["loss_ratio"] >= 0.8,
    df["loss_ratio"] >= 0.6,
]
choices = ["적자", "주의", "양호"]
df["grade"] = np.select(conditions, choices, default="우수")

print(df["grade"].value_counts())`,
      },
      {
        title: "구간화 — pd.cut · pd.qcut",
        level: "basic",
        code: `# 경계를 직접 지정 (연령대)
df["age_band"] = pd.cut(
    df["age"],
    bins=[0, 20, 30, 40, 50, 60, 120],
    labels=["~19", "20대", "30대", "40대", "50대", "60+"],
    right=False,          # [20, 30) — 왼쪽 포함
)

# 분위수로 균등 분할 (보험료 4분위)
df["prem_q"] = pd.qcut(df["premium"], q=4, labels=["Q1", "Q2", "Q3", "Q4"])

print(pd.crosstab(df["age_band"], df["prem_q"]))`,
      },
    ],
  },
  {
    id: "join-merge",
    name: "join·merge",
    en: "merge · concat",
    category: "wrangle",
    weight: 4,
    difficulty: 2,
    params: [
      { name: "how", desc: "'inner'(양쪽 다 있는 키만)·'left'(왼쪽 전부 유지)·'right'·'outer'(둘 다 전부)·'cross'(모든 조합)." },
      { name: "on / left_on·right_on", desc: "결합 키 — 양쪽 이름이 같으면 on, 다르면 left_on·right_on. 여러 키는 리스트로." },
      { name: "validate", desc: "'one_to_one'·'one_to_many' 등 관계 선언 — 위반 시 에러를 내 잘못된 결합(행 폭증)을 사전에 잡습니다." },
      { name: "indicator=True", desc: "_merge 열(both/left_only/right_only) 추가 — 매칭 실패 규모 검증에 필수적인 습관." },
      { name: "suffixes=('_x', '_y')", desc: "양쪽에 같은 이름의 열이 있을 때 붙는 접미사 — ('_계약', '_고객')처럼 의미 있게." },
      { name: "concat(axis, ignore_index, keys)", desc: "같은 구조 쌓기 — axis=0 세로(기본)·1 가로, keys로 출처 라벨 유지." },
    ],
    summary: "키를 기준으로 두 표를 옆으로 결합(SQL JOIN) — how 옵션이 결과를 좌우",
    intro:
      "계약 테이블과 고객 테이블처럼 흩어진 표를 공통 키로 결합합니다. how='inner'(양쪽에 다 있는 키만), 'left'(왼쪽은 전부 유지), 'outer'(둘 다 전부)가 SQL JOIN과 동일하게 대응합니다.\n\n단순히 같은 구조의 표를 위아래로 쌓을 때는 merge가 아니라 concat을 씁니다(월별 파일 합치기 등).",
    tips: "결합 후 행 수가 예상과 다르면 키 중복(1:N, N:M)을 의심하세요 — validate=\"one_to_many\" 같은 옵션이 잘못된 결합을 에러로 잡아 줍니다. indicator=True는 각 행이 어느 쪽에서 왔는지 표시해 검증에 유용합니다.",
    sections: [
      {
        title: "merge — SQL JOIN 4종",
        level: "basic",
        code: `contracts = pd.read_excel("contracts.xlsx")   # 계약 (customer_id 포함)
customers = pd.read_excel("customers.xlsx")   # 고객 마스터

# LEFT JOIN — 계약은 전부 유지, 고객 정보 붙이기
merged = contracts.merge(customers, on="customer_id", how="left")

# 키 이름이 서로 다를 때
merged = contracts.merge(
    customers, left_on="cust_id", right_on="customer_id", how="left"
)

# 검증 옵션 — 결합 품질 확인
merged = contracts.merge(
    customers, on="customer_id", how="left",
    validate="many_to_one",   # 고객이 중복이면 에러로 알려줌
    indicator=True,           # _merge 열: both / left_only
)
print(merged["_merge"].value_counts())   # left_only가 많으면 매칭 실패 다수`,
      },
      {
        title: "concat — 위아래로 쌓기",
        level: "basic",
        code: `# 월별 파일을 하나로
jan = pd.read_excel("claims_2026_01.xlsx")
feb = pd.read_excel("claims_2026_02.xlsx")
all_claims = pd.concat([jan, feb], ignore_index=True)

# 어떤 파일에서 왔는지 표시하며 쌓기
all_claims = pd.concat({"1월": jan, "2월": feb}, names=["월"]).reset_index(0)`,
      },
    ],
  },
  {
    id: "groupby",
    name: "groupby 집계",
    en: "groupby · agg · transform",
    category: "wrangle",
    weight: 5,
    difficulty: 2,
    params: [
      { name: "agg(이름=(열, 함수))", desc: "이름 있는 집계 — 결과 열 이름까지 한 번에. 함수는 'mean' 문자열·np 함수·lambda 모두 허용." },
      { name: "transform(func)", desc: "집계 결과를 원본 행 수 그대로 반환 — '자기 그룹 평균 대비 비율' 같은 파생변수의 표준 방법." },
      { name: "filter(func)", desc: "그룹 조건으로 그룹째 채택/제외 — 예: 계약 100건 이상 지점만." },
      { name: "as_index=False", desc: "그룹 키를 인덱스 대신 일반 열로 — 결과를 바로 표로 다룰 때 편리(reset_index 생략)." },
      { name: "dropna=False", desc: "키 값이 NaN인 행도 하나의 그룹으로 유지(기본은 제외)." },
      { name: "observed=True", desc: "범주형 키에서 실제 등장한 조합만 집계 — 미등장 조합의 빈 행 방지." },
    ],
    summary: "그룹별 합계·평균·건수 — 엑셀 피벗의 코드판이자 분석의 중심 동작",
    intro:
      "'상품별 평균 보험료', '지점별 월별 청구 건수'처럼 그룹 단위 요약은 분석의 중심 동작입니다. groupby(키)로 나눈 뒤 agg로 통계량을 지정하며, 이름 있는 집계(named aggregation)를 쓰면 결과 열 이름까지 한 번에 정리됩니다.\n\ntransform은 집계 결과를 원본 행 수 그대로 되돌려줍니다 — '자기 그룹 평균 대비 비율' 같은 파생변수를 만들 때 필수입니다.",
    tips: "여러 키로 묶으면 결과가 멀티인덱스가 됩니다 — 표로 다루려면 reset_index()로 평평하게 만드세요. 그룹 조건으로 그룹째 거르기(우량 지점만)는 filter를 씁니다.",
    sections: [
      {
        title: "agg — 이름 있는 집계",
        level: "basic",
        code: `# 상품 × 채널별 요약표
summary = (
    df.groupby(["product", "channel"])
    .agg(
        건수=("policy_id", "count"),
        보험료합계=("premium", "sum"),
        평균보험료=("premium", "mean"),
        평균연령=("age", "mean"),
    )
    .reset_index()
)
print(summary.round(1))`,
      },
      {
        title: "transform·filter — 그룹값을 행으로, 그룹째 거르기",
        level: "basic",
        code: `# 자기 상품군 평균 대비 보험료 비율 (행 수 유지)
df["prem_vs_group"] = df["premium"] / df.groupby("product")["premium"].transform("mean")

# 그룹 내 순번 (계약자별 최신 계약 = 1)
df["nth"] = df.sort_values("issue_date", ascending=False).groupby("customer_id").cumcount() + 1

# 계약 100건 이상인 지점만 남기기 (그룹째 필터)
big = df.groupby("branch").filter(lambda g: len(g) >= 100)
print(big["branch"].nunique(), "개 지점")`,
      },
    ],
  },
  {
    id: "apply",
    name: "apply·map",
    en: "apply · map",
    category: "wrangle",
    weight: 4,
    difficulty: 2,
    params: [
      { name: "map(dict 또는 함수)", desc: "Series 값 하나씩 변환 — dict 매핑에 없는 값은 NaN이 됩니다(누락 코드 점검 기회)." },
      { name: "map(..., na_action='ignore')", desc: "결측은 함수에 넣지 않고 그대로 NaN 유지 — 함수가 NaN에서 죽는 것을 방지." },
      { name: "apply(func, axis=1)", desc: "행 전체를 받아 여러 열 조합 계산 — 유연하지만 파이썬 루프라 느립니다. 벡터화 가능하면 그쪽 우선." },
      { name: "apply(..., result_type='expand')", desc: "함수가 리스트/Series를 반환하면 여러 열로 펼칩니다." },
      { name: "replace(dict)", desc: "map과 달리 매핑에 없는 값은 원래 값 유지 — 일부 코드만 바꿀 때는 replace가 안전." },
    ],
    summary: "임의의 함수를 열·행 단위로 적용 — 유연하지만 벡터 연산이 있으면 그쪽 먼저",
    intro:
      "내장 연산으로 표현하기 어려운 사용자 정의 로직을 데이터에 적용합니다. Series.map은 값 하나씩 변환(사전 매핑 포함), df.apply(axis=1)는 행 전체를 받아 여러 열을 조합하는 계산에 씁니다.\n\n다만 apply는 내부적으로 파이썬 루프라서 느립니다 — 같은 일을 np.where·문자열 벡터 연산·산술 연산으로 할 수 있다면 항상 그쪽이 우선입니다.",
    tips: "성능 순서: 벡터 연산 > map(사전) > apply. 수십만 행에 apply(axis=1)를 돌리기 전에 '이거 np.where나 groupby.transform으로 안 되나?'를 먼저 자문하세요.",
    sections: [
      {
        title: "map — 값 변환·사전 매핑",
        level: "basic",
        code: `# 사전으로 코드 → 이름 매핑
code_map = {"L": "생명", "H": "건강", "A": "상해"}
df["product_nm"] = df["product_cd"].map(code_map)

# 함수 적용 (값 하나씩)
df["premium_만원"] = df["premium"].map(lambda x: round(x / 10_000, 1))

# 매핑에 없는 코드는 NaN — 확인 습관
print(df.loc[df["product_nm"].isna(), "product_cd"].unique())`,
      },
      {
        title: "apply — 여러 열 조합 (필요할 때만)",
        level: "basic",
        code: `# 행 전체를 받아 조건 조합 — axis=1
def risk_grade(row):
    if row["age"] >= 65 and row["claim_cnt"] >= 3:
        return "정밀심사"
    if row["age"] >= 65 or row["claim_cnt"] >= 3:
        return "주의"
    return "일반"

df["grade"] = df.apply(risk_grade, axis=1)

# 같은 로직의 벡터 버전 — 대용량에서는 이쪽
import numpy as np
old, freq = df["age"] >= 65, df["claim_cnt"] >= 3
df["grade"] = np.select([old & freq, old | freq], ["정밀심사", "주의"], "일반")`,
      },
    ],
  },
  {
    id: "pivot",
    name: "pivot_table·melt",
    en: "pivot_table · melt",
    category: "wrangle",
    weight: 3,
    difficulty: 2,
    params: [
      { name: "aggfunc", desc: "집계 함수 — 'mean'(기본)·'sum'·'count'·리스트(여러 개)·dict(값 열마다 다르게)." },
      { name: "margins / margins_name", desc: "행·열 합계 추가와 그 라벨('All' 기본)." },
      { name: "fill_value", desc: "조합이 없는 빈 칸 채움 — 0으로 채우기 전에 '거래 없음'과 '0원'의 업무적 차이를 확인." },
      { name: "melt(id_vars, value_vars, var_name, value_name)", desc: "wide→long — 유지할 식별 열, 녹일 열, 결과 열 이름 지정." },
      { name: "pivot vs pivot_table", desc: "pivot은 집계 없는 재배열(중복 조합 있으면 에러), pivot_table은 aggfunc로 집계 — 중복 가능성이 있으면 pivot_table." },
    ],
    summary: "행×열 교차 요약표(엑셀 피벗)와 그 역변환(wide→long)",
    intro:
      "pivot_table은 엑셀 피벗테이블 그대로입니다 — index(행)·columns(열)·values(값)·aggfunc(집계)를 지정해 교차표를 만듭니다. margins=True면 행·열 합계까지 붙습니다.\n\nmelt는 반대 방향입니다. 월별 열이 옆으로 늘어선 보고서형(wide) 표를, 분석·시각화가 요구하는 세로형(long)으로 되돌립니다.",
    tips: "피벗 결과의 빈 칸(NaN)은 fill_value=0으로 채울 수 있지만, '거래 없음'과 '0원'이 업무적으로 다른 의미라면 구분해 두세요. groupby+unstack도 같은 결과를 만듭니다 — 편한 쪽을 쓰면 됩니다.",
    sections: [
      {
        title: "pivot_table — 교차 요약표",
        level: "basic",
        code: `# 상품(행) × 연령대(열) 평균 보험료
pt = pd.pivot_table(
    df,
    index="product",
    columns="age_band",
    values="premium",
    aggfunc="mean",
    margins=True, margins_name="전체",   # 합계 행·열
    fill_value=0,
)
print(pt.round(0))

# 여러 값·여러 집계 동시
pt2 = pd.pivot_table(df, index="product",
                     values=["premium", "claim_amt"],
                     aggfunc={"premium": "mean", "claim_amt": ["sum", "count"]})`,
      },
      {
        title: "melt — wide를 long으로",
        level: "basic",
        code: `# 월별 열(1월, 2월, …)이 옆으로 늘어선 표를 세로로
wide = pd.read_excel("monthly_report.xlsx")   # 지점 | 1월 | 2월 | 3월 …
long = wide.melt(
    id_vars="지점",
    var_name="월",
    value_name="실적",
)
print(long.head())
# long 형태여야 groupby·시각화·시계열 분석이 자연스러움`,
      },
    ],
  },
  {
    id: "missing",
    name: "결측치 처리",
    en: "isna · fillna · dropna",
    category: "wrangle",
    weight: 4,
    difficulty: 2,
    params: [
      { name: "dropna(subset, how, thresh)", desc: "subset=기준 열 목록, how='any'(하나라도 결측)·'all'(전부 결측), thresh=행이 살아남을 최소 유효값 수." },
      { name: "fillna(value)", desc: "단일 값 또는 {'열': 값} dict로 열마다 다른 값 — 수치형 중앙값·범주형 '미상'이 무난한 기본." },
      { name: "ffill() / bfill()", desc: "직전/직후 값으로 채움 — 시계열·정렬된 데이터 전용. limit로 연속 채움 상한." },
      { name: "interpolate(method, limit)", desc: "'linear'(기본)·'time'(시간 간격 반영) 보간 — 시계열 수치에 자연스러움." },
      { name: "replace([...], np.nan)", desc: "공백·'-'·'N/A' 같은 숨은 결측 문자를 진짜 NaN으로 — 결측 집계 전에 필수." },
    ],
    summary: "결측 파악 → 삭제 또는 대체 — 분석 전 반드시 거치는 관문",
    intro:
      "거의 모든 실무 데이터에는 빈 값이 있습니다. 먼저 isna().sum()으로 열별 결측 규모를 파악하고, 소수면 dropna로 삭제, 다수면 fillna로 대체합니다. 대체값은 수치형이면 중앙값(이상치에 강건), 범주형이면 최빈값이나 '미상' 범주가 무난합니다.\n\n결측이 무작위가 아니라 특정 집단에 몰려 있다면(예: 고연령 고객의 소득 미기재) 삭제·대체 모두 편향을 만들 수 있으므로, 결측 자체를 하나의 정보로 남기는 것도 방법입니다.",
    tips: "겉보기엔 값이 있는데 '  '(공백)이나 '-' 같은 문자로 숨어 있는 결측이 흔합니다 — replace로 진짜 NaN으로 바꾼 뒤 세어야 정확합니다. 시계열은 평균 대체보다 ffill·interpolate가 자연스럽습니다.",
    sections: [
      {
        title: "결측 파악 — 숨은 결측까지",
        level: "basic",
        code: `import numpy as np

# 숨은 결측(공백·대시)을 진짜 NaN으로
df = df.replace(["", " ", "-", "N/A"], np.nan)

# 열별 결측 수·비율
na = df.isna().sum()
print(pd.DataFrame({"결측수": na, "비율": (na / len(df)).round(3)})
      .query("결측수 > 0").sort_values("결측수", ascending=False))

# 특정 집단에 몰렸는지 확인
print(df.groupby("channel")["income"].apply(lambda s: s.isna().mean()).round(3))`,
      },
      {
        title: "삭제·대체·보간",
        level: "basic",
        code: `# 핵심 열이 빈 행만 삭제
df = df.dropna(subset=["policy_id", "premium"])

# 수치형: 중앙값 / 범주형: '미상'
df["income"] = df["income"].fillna(df["income"].median())
df["job"] = df["job"].fillna("미상")

# 그룹별 중앙값으로 더 정교하게
df["income"] = df["income"].fillna(
    df.groupby("age_band")["income"].transform("median")
)

# 시계열: 직전 값 유지·선형 보간
ts = ts.ffill()
ts = ts.interpolate(method="linear")

# 결측 여부 자체를 변수로 보존
df["income_missing"] = df["income"].isna().astype(int)`,
      },
    ],
  },
  {
    id: "sort-dedup",
    name: "정렬·중복·순위",
    en: "sort_values · drop_duplicates · rank",
    category: "wrangle",
    weight: 2,
    difficulty: 1,
    params: [
      { name: "sort_values(by, ascending=[...])", desc: "복수 키 정렬 — ascending을 리스트로 주면 키마다 방향 혼합. na_position='first'로 결측 위치 제어." },
      { name: "drop_duplicates(subset, keep)", desc: "subset=중복 판단 열, keep='first'(기본)·'last'·False(중복 전부 제거) — 지우기 전 정렬이 무엇을 남길지 결정합니다." },
      { name: "duplicated(keep)", desc: "중복 여부 마스크 — 삭제 전에 어떤 행이 걸리는지 눈으로 확인." },
      { name: "rank(method, ascending, pct)", desc: "동점 처리 'average'(기본)·'min'·'dense', pct=True면 백분위 순위." },
      { name: "nlargest / nsmallest(n, columns)", desc: "상·하위 N — 전체 정렬보다 빠르고 의도가 명확." },
    ],
    summary: "정렬, 중복 제거(기준·유지 규칙), 순위·상위 N — 마무리 손질 3종",
    intro:
      "결과 표를 만들 때 늘 따라오는 손질입니다. sort_values는 복수 키·방향 혼합 정렬을, drop_duplicates는 어떤 열 기준으로 무엇을 남길지(keep) 지정한 중복 제거를 지원합니다.\n\n'고객별 최신 계약 한 건만'처럼 정렬과 중복 제거를 조합하는 패턴, rank·nlargest로 순위와 상위 N을 뽑는 패턴이 실무 단골입니다.",
    tips: "drop_duplicates 전에 반드시 정렬하세요 — keep='first'가 무엇을 남길지는 행 순서가 정합니다. duplicated()로 지우기 전에 어떤 행이 중복인지 눈으로 확인하는 습관이 사고를 막습니다.",
    sections: [
      {
        title: "정렬·중복 제거·최신 1건",
        level: "basic",
        code: `# 복수 키 정렬 — 상품 오름차순, 보험료 내림차순
df = df.sort_values(["product", "premium"], ascending=[True, False])

# 중복 확인 후 제거
print(df.duplicated(subset=["customer_id", "product"]).sum(), "건 중복")
dedup = df.drop_duplicates(subset=["customer_id", "product"], keep="first")

# 고객별 최신 계약 1건 — 정렬 + keep 조합
latest = (
    df.sort_values("issue_date", ascending=False)
    .drop_duplicates(subset="customer_id", keep="first")
)`,
      },
      {
        title: "순위·상위 N",
        level: "basic",
        code: `# 지점별 실적 순위 (동점은 평균 순위)
df["rank"] = df["sales"].rank(ascending=False, method="min")

# 상위·하위 N — 정렬보다 빠르고 간결
top10 = df.nlargest(10, "claim_amt")
bottom5 = df.nsmallest(5, "loss_ratio")

# 그룹 내 순위 — 채널별 실적 1등
df["rank_in_ch"] = df.groupby("channel")["sales"].rank(ascending=False, method="min")
winners = df[df["rank_in_ch"] == 1]`,
      },
    ],
  },
];
