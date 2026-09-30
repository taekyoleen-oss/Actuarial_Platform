// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
import type { BeginnerBlock } from "../beginnerCode";

export const DATA: Record<string, BeginnerBlock[]> = {
  "desc-stats": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df.head()                                # 앞 5행 보기`,
      result: "계약 데이터의 앞 5행이 표로 나옵니다. 열 이름과 값의 모양을 먼저 확인합니다.",
    },
    {
      title: "2. 요약 통계 보기",
      code: `# 숫자 열마다 개수·평균·표준편차(퍼진 정도)·최소·최대를 한 번에
df.describe()`,
      result: "숫자 열마다 count·mean·std·min·25%·50%·75%·max 8개 행이 담긴 요약표가 나옵니다.",
    },
    {
      title: "다른 방법 — 한 열만 골라 원하는 통계",
      alt: true,
      code: `# 보험료 한 열에서 평균·중앙값·표준편차만 골라 계산
df["premium"].agg(["mean", "median", "std", "min", "max"])`,
      result: "보험료의 평균·중앙값·표준편차·최소·최대 5개 값이 한 열 목록으로 나옵니다.",
    },
    {
      title: "다른 방법 — 그룹별 요약(groupby)",
      alt: true,
      code: `# 상품마다 보험료 요약 통계를 한 행씩
df.groupby("product")["premium"].describe()`,
      result: "상품이 행, 개수·평균·표준편차·사분위수가 열인 표가 나와 상품끼리 비교할 수 있습니다.",
    },
    {
      title: "다른 방법 — 범주 열 빈도(value_counts)",
      alt: true,
      code: `# 글자(범주) 열은 평균 대신 몇 건씩인지 센다
df["product"].value_counts()`,
      result: "상품별 계약 건수가 많은 순서로 나옵니다.",
    },
  ],

  correlation: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df[["age", "premium", "bmi"]].head()     # 볼 열 세 개만 확인`,
      result: "나이·보험료·BMI 세 열의 앞 5행이 표로 나옵니다.",
    },
    {
      title: "2. 상관계수 구하기",
      code: `# 상관계수: -1~1, 1에 가까울수록 함께 커짐
r = df["age"].corr(df["premium"])        # 나이와 보험료의 상관계수
table = df[["age", "premium", "bmi"]].corr()  # 세 열끼리 모두 비교한 표
table`,
      result: "3×3 상관계수 표가 나옵니다. 대각선은 1이고, 나머지 칸이 두 열의 상관계수입니다.",
    },
    {
      title: "다른 방법 — 숫자 열 전체 상관표",
      alt: true,
      code: `# 열을 고르지 않고 숫자 열 전부끼리 비교(글자 열은 자동 제외)
df.corr(numeric_only=True).round(2)      # 소수 둘째 자리까지`,
      result: "모든 숫자 열끼리의 상관계수 표(정사각형)가 소수 둘째 자리로 나옵니다.",
    },
    {
      title: "다른 방법 — scipy pearsonr (p값 포함)",
      alt: true,
      code: `from scipy import stats                  # 통계 검정 도구
res = stats.pearsonr(df["age"], df["premium"])  # 상관계수 + 유의성
{"상관계수": res[0], "p값": res[1]}           # p < 0.05 이면 상관이 유의`,
      result: "피어슨 상관계수와 p값 두 숫자가 나옵니다. p값으로 상관이 우연인지 판단합니다.",
    },
    {
      title: "다른 방법 — 스피어만(순위) 상관",
      alt: true,
      code: `# 순위로 계산: 직선이 아니어도, 이상치가 있어도 튼튼함
df[["age", "premium", "bmi"]].corr(method="spearman")`,
      result: "순위 기준 3×3 상관계수 표가 나옵니다. 피어슨 표와 비교해 보세요.",
    },
    {
      title: "다른 방법 — 산점도로 눈으로 보기",
      alt: true,
      code: `import matplotlib.pyplot as plt          # 그래프 도구
df.plot(kind="scatter", x="age", y="premium", alpha=0.4)  # 점 하나 = 계약 하나
plt.show()`,
      result: "가로 나이, 세로 보험료인 점 그래프가 나옵니다. 오른쪽 위로 올라가면 양의 상관입니다.",
    },
  ],

  "t-test": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
from scipy import stats                  # 통계 검정 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df.groupby("sex")["premium"].mean()      # 성별 평균 보험료 먼저 보기`,
      result: "F·M 두 행에 성별 평균 보험료가 나옵니다.",
    },
    {
      title: "2. 두 집단 평균 비교(t-검정)",
      code: `a = df[df["sex"] == "M"]["premium"]      # 남성 보험료
b = df[df["sex"] == "F"]["premium"]      # 여성 보험료
result = stats.ttest_ind(a, b)           # 두 평균이 같은지 검정
result                                   # pvalue < 0.05 이면 차이가 있다고 봄`,
      result: "t 통계량(statistic)과 p값(pvalue)이 나옵니다. p값이 0.05보다 작으면 두 평균이 다르다고 봅니다.",
    },
    {
      title: "다른 방법 — 웰치 t-검정(분산이 달라도)",
      alt: true,
      code: `# 두 집단의 퍼진 정도가 달라도 쓰는 방법(실무 기본값으로 많이 씀)
stats.ttest_ind(a, b, equal_var=False)`,
      result: "분산이 같다고 가정하지 않은 t 통계량과 p값이 나옵니다. 보통 위 결과와 비슷합니다.",
    },
    {
      title: "다른 방법 — 한 집단 평균이 특정 값인지",
      alt: true,
      code: `# 남성 평균 보험료가 50,000원과 같은지 검정(단일표본 t-검정)
stats.ttest_1samp(a, 50000)`,
      result: "남성 평균이 50,000원과 다른지에 대한 t 통계량과 p값이 나옵니다.",
    },
    {
      title: "다른 방법 — 상자그림으로 비교",
      alt: true,
      code: `import matplotlib.pyplot as plt          # 그래프 도구
df.boxplot(column="premium", by="sex")   # 성별 보험료 분포 상자그림
plt.show()`,
      result: "성별로 상자 두 개가 나란히 그려집니다. 가운데 선(중앙값) 높이로 차이를 봅니다.",
    },
  ],

  "chi-square": [
    {
      title: "1. 교차표 만들기",
      code: `import pandas as pd                      # 표 데이터 도구
from scipy import stats                  # 통계 검정 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
table = pd.crosstab(df["sex"], df["lapsed"])  # 성별 × 해지여부 건수 표
table`,
      result: "성별(행) × 해지여부(열) 2×2 건수 표가 나옵니다.",
    },
    {
      title: "2. 카이제곱 검정",
      code: `# 두 범주(성별·해지)가 서로 관련 있는지 검정
chi2, p, dof, expected = stats.chi2_contingency(table)
{"카이제곱": chi2, "p값": p}                # p < 0.05 이면 관련 있다고 봄`,
      result: "카이제곱 통계량과 p값이 나옵니다. p값이 0.05보다 작으면 성별과 해지가 관련 있다고 봅니다.",
    },
    {
      title: "다른 방법 — 비율 교차표로 보기",
      alt: true,
      code: `# 건수 대신 행마다 비율(합계 1)로: 성별 해지율 비교
pd.crosstab(df["sex"], df["lapsed"], normalize="index").round(3)`,
      result: "성별마다 해지 False/True 비율이 나오는 표입니다. True 열이 성별 해지율입니다.",
    },
    {
      title: "다른 방법 — 기대 빈도 확인",
      alt: true,
      code: `# 관련이 없다면 나왔어야 할 건수(기대 빈도) — 5 미만 칸이 많으면 검정이 부정확
pd.DataFrame(expected, index=table.index, columns=table.columns).round(1)`,
      result: "실제 표와 같은 모양의 기대 빈도 표가 나옵니다. 실제 건수와 비교해 차이를 봅니다.",
    },
    {
      title: "다른 방법 — 칸이 작을 때 피셔 정확검정",
      alt: true,
      code: `# 2×2 표이고 건수가 적을 때 쓰는 정확검정
stats.fisher_exact(table)`,
      result: "오즈비(statistic)와 p값(pvalue)이 나옵니다.",
    },
  ],

  anova: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
from scipy import stats                  # 통계 검정 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df.groupby("product")["premium"].mean()  # 상품별 평균 보험료 보기`,
      result: "상품별 평균 보험료가 한 줄씩 나옵니다.",
    },
    {
      title: "2. 세 집단 이상 평균 비교(분산분석)",
      code: `# 상품마다 보험료 묶음을 하나씩 만든다
groups = [g["premium"] for _, g in df.groupby("product")]
result = stats.f_oneway(*groups)         # 모든 상품 평균이 같은지 검정
result                                   # pvalue < 0.05 이면 어딘가 다름`,
      result: "F 통계량과 p값이 나옵니다. p값이 0.05보다 작으면 적어도 한 상품의 평균이 다르다고 봅니다.",
    },
    {
      title: "다른 방법 — statsmodels 분산분석표",
      alt: true,
      code: `import statsmodels.api as sm             # 통계 모형 도구
import statsmodels.formula.api as smf    # 수식으로 모형 쓰기
model = smf.ols("premium ~ C(product)", data=df).fit()  # C(): 범주 변수
sm.stats.anova_lm(model)                 # 교과서식 분산분석표`,
      result: "자유도(df)·제곱합(sum_sq)·평균제곱·F·p값(PR(>F))이 담긴 분산분석표가 나옵니다.",
    },
    {
      title: "다른 방법 — 사후검정(어느 상품끼리 다른지)",
      alt: true,
      code: `from statsmodels.stats.multicomp import pairwise_tukeyhsd  # 튜키 사후검정
res = pairwise_tukeyhsd(df["premium"], df["product"])  # 모든 상품 쌍 비교
res.summary()                            # reject=True 인 쌍이 서로 다름`,
      result: "상품 두 개씩 짝지은 표가 나오고, reject=True인 쌍은 평균 차이가 유의합니다.",
    },
    {
      title: "다른 방법 — 크루스칼-왈리스(비모수)",
      alt: true,
      code: `# 정규분포 가정이 어려울 때: 순위로 세 집단 이상 비교
stats.kruskal(*groups)`,
      result: "H 통계량과 p값이 나옵니다. 해석은 분산분석과 같습니다.",
    },
  ],

  normality: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
import matplotlib.pyplot as plt          # 그래프 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df["bmi"].plot(kind="hist", bins=30)     # 체질량지수 분포 모양 보기
plt.show()`,
      result: "BMI 히스토그램이 나옵니다. 가운데가 높고 좌우가 대칭인 종 모양이면 정규분포에 가깝습니다.",
    },
    {
      title: "2. 정규분포인지 검정",
      code: `from scipy import stats                  # 통계 검정 도구
result = stats.shapiro(df["bmi"])        # 샤피로 검정: 종 모양인지 확인
result                                   # pvalue > 0.05 이면 정규분포로 봄`,
      result: "샤피로-윌크 통계량과 p값이 나옵니다. p값이 0.05보다 크면 정규분포라고 봐도 됩니다.",
    },
    {
      title: "다른 방법 — D'Agostino 정규성 검정",
      alt: true,
      code: `# 왜도(치우침)·첨도(뾰족함)로 판단 — 표본이 클 때 많이 씀
stats.normaltest(df["bmi"])`,
      result: "통계량과 p값이 나옵니다. 해석은 샤피로 검정과 같습니다(p > 0.05면 정규).",
    },
    {
      title: "다른 방법 — 왜도·첨도 숫자로 보기",
      alt: true,
      code: `# 정규분포면 왜도≈0, 첨도(초과)≈0
{"왜도": df["bmi"].skew(), "첨도": df["bmi"].kurt()}`,
      result: "왜도와 첨도 두 숫자가 나옵니다. 둘 다 0에 가까울수록 정규분포에 가깝습니다.",
    },
    {
      title: "다른 방법 — QQ 그림",
      alt: true,
      code: `stats.probplot(df["bmi"], dist="norm", plot=plt)  # 정규분포와 분위수 비교
plt.show()`,
      result: "점들과 기준 직선이 그려집니다. 점이 직선 위에 붙어 있으면 정규분포입니다.",
    },
  ],

  nonparametric: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
from scipy import stats                  # 통계 검정 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df.groupby("sex")["premium"].median()    # 성별 중앙값(가운데 값) 보기`,
      result: "F·M 두 행에 성별 보험료 중앙값이 나옵니다.",
    },
    {
      title: "2. 순위로 두 집단 비교",
      code: `# 만-위트니 검정: 정규분포가 아니어도 쓰는 두 집단 비교
a = df[df["sex"] == "M"]["premium"]      # 남성 보험료
b = df[df["sex"] == "F"]["premium"]      # 여성 보험료
result = stats.mannwhitneyu(a, b)        # 순위 기준으로 차이 검정
result                                   # pvalue < 0.05 이면 차이 있음`,
      result: "U 통계량과 p값이 나옵니다. p값이 0.05보다 작으면 두 집단의 분포가 다르다고 봅니다.",
    },
    {
      title: "다른 방법 — 크루스칼-왈리스(세 집단 이상)",
      alt: true,
      code: `# 상품이 여러 개일 때: 순위 기준 비교
groups = [g["premium"] for _, g in df.groupby("product")]  # 상품별 보험료 묶음
stats.kruskal(*groups)`,
      result: "H 통계량과 p값이 나옵니다. p값이 작으면 적어도 한 상품이 다릅니다.",
    },
    {
      title: "다른 방법 — 윌콕슨 부호순위(짝지은 전·후 비교)",
      alt: true,
      code: `claims = pd.read_excel("claims.xlsx")    # 갱신 전·후 보험료가 있는 데이터
# 같은 계약의 전·후 값 차이를 순위로 검정(대응 표본)
stats.wilcoxon(claims["prem_before"], claims["prem_after"])`,
      result: "통계량과 p값이 나옵니다. p값이 작으면 갱신 전후 보험료가 달라졌다고 봅니다.",
    },
    {
      title: "다른 방법 — 상자그림으로 비교",
      alt: true,
      code: `import matplotlib.pyplot as plt          # 그래프 도구
df.boxplot(column="premium", by="product")  # 상품별 보험료 상자그림
plt.show()`,
      result: "상품별 상자그림이 나란히 그려집니다. 가운데 선이 중앙값입니다.",
    },
  ],

  distributions: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
from scipy import stats                  # 확률분포 도구
df = pd.read_excel("claims.xlsx")        # 샘플 사고 데이터 읽기
x = df["claim_amt"]                      # 사고 금액(심도) 열
x.describe()`,
      result: "사고 금액의 개수·평균·표준편차·사분위수·최대가 나옵니다. 평균이 중앙값(50%)보다 크면 오른쪽 꼬리가 깁니다.",
    },
    {
      title: "2. 로그정규분포 맞추기",
      code: `# 로그정규: 금액처럼 오른쪽 꼬리가 긴 분포
shape, loc, scale = stats.lognorm.fit(x, floc=0)  # 데이터에 맞는 모수 찾기
dist = stats.lognorm(shape, loc, scale)  # 찾은 모수로 분포 만들기
{"평균": dist.mean(), "99% 분위수": dist.ppf(0.99)}  # 평균과 상위 1% 금액`,
      result: "맞춘 로그정규분포의 평균과 99% 분위수(100건 중 1건만 넘는 금액) 두 숫자가 나옵니다.",
    },
    {
      title: "다른 방법 — 정규·감마와 AIC 비교",
      alt: true,
      code: `import numpy as np                       # 숫자 계산 도구
aic = {}                                 # 분포별 AIC(작을수록 잘 맞음)
for name in ["norm", "lognorm", "gamma"]:
    d = getattr(stats, name)             # 분포 가져오기
    p = d.fit(x) if name == "norm" else d.fit(x, floc=0)  # 모수 찾기
    aic[name] = 2 * len(p) - 2 * np.sum(d.logpdf(x, *p))  # AIC 계산
aic`,
      result: "정규·로그정규·감마 세 분포의 AIC가 나옵니다. 가장 작은 분포가 데이터에 가장 잘 맞습니다.",
    },
    {
      title: "다른 방법 — 히스토그램 위에 분포 곡선",
      alt: true,
      code: `import numpy as np                       # 숫자 계산 도구
import matplotlib.pyplot as plt          # 그래프 도구
plt.hist(x, bins=40, density=True, alpha=0.5)  # 실제 금액 분포(면적 1)
grid = np.linspace(x.min(), x.max(), 200)      # 곡선을 그릴 x 좌표
plt.plot(grid, dist.pdf(grid))                 # 맞춘 로그정규 곡선
plt.show()`,
      result: "막대(실제 데이터) 위에 로그정규 곡선이 겹쳐 그려집니다. 곡선이 막대 윤곽을 따라가면 잘 맞은 것입니다.",
    },
    {
      title: "다른 방법 — KS 적합도 검정",
      alt: true,
      code: `# 맞춘 분포와 데이터가 같은지 검정(p > 0.05 이면 잘 맞음)
stats.kstest(x, dist.cdf)`,
      result: "KS 통계량(최대 차이)과 p값이 나옵니다.",
    },
  ],

  "linear-regression": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
import statsmodels.formula.api as smf    # 회귀분석 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df[["age", "premium"]].head()            # 쓸 열 두 개 확인`,
      result: "나이·보험료 두 열의 앞 5행이 표로 나옵니다.",
    },
    {
      title: "2. 모델 만들기",
      code: `# 보험료 = 절편 + 기울기 × 나이 (직선 맞추기)
model = smf.ols("premium ~ age", data=df).fit()
model.params                             # 절편(Intercept)과 나이 기울기`,
      result: "Intercept(절편)와 age 계수(나이 1세 증가 시 보험료 변화) 두 줄이 나옵니다.",
    },
    {
      title: "3. 결과 보기",
      code: `# 계수·p값·R²(설명력)가 담긴 전체 결과표
model.summary()`,
      result: "R²·F 통계량과 계수별 표준오차·t·p값·95% 신뢰구간이 담긴 회귀 결과표가 나옵니다.",
    },
    {
      title: "다른 방법 — scikit-learn LinearRegression",
      alt: true,
      code: `from sklearn.linear_model import LinearRegression  # 머신러닝식 회귀
lr = LinearRegression()                  # 모델 준비
lr.fit(df[["age"]], df["premium"])       # X는 표(대괄호 2개), y는 열
{"절편": lr.intercept_, "나이 계수": lr.coef_[0], "R²": lr.score(df[["age"]], df["premium"])}`,
      result: "절편·나이 계수·R² 세 숫자가 나옵니다. statsmodels 결과와 같은 값이지만 p값은 없습니다.",
    },
    {
      title: "다른 방법 — numpy polyfit (직선 한 줄)",
      alt: true,
      code: `import numpy as np                       # 숫자 계산 도구
slope, intercept = np.polyfit(df["age"], df["premium"], 1)  # 1차식(직선) 맞추기
{"기울기": slope, "절편": intercept}`,
      result: "기울기와 절편 두 숫자가 나옵니다. 위 두 방법과 같은 값입니다.",
    },
    {
      title: "다른 방법 — 산점도 + 회귀선",
      alt: true,
      code: `import matplotlib.pyplot as plt          # 그래프 도구
plt.scatter(df["age"], df["premium"], alpha=0.3)  # 실제 점
line = df.sort_values("age")             # 선을 그리려고 나이 순 정렬
plt.plot(line["age"], model.predict(line), color="red")  # 맞춘 직선
plt.show()`,
      result: "나이-보험료 점 그래프 위에 빨간 회귀 직선이 그려집니다.",
    },
  ],

  "logistic-regression": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
import statsmodels.formula.api as smf    # 회귀분석 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df["lapsed"] = df["lapsed"].astype(int)  # 해지여부 True/False → 1/0
df["lapsed"].mean()                      # 전체 해지율`,
      result: "전체 해지율(0~1 사이 숫자) 하나가 나옵니다.",
    },
    {
      title: "2. 모델 만들기",
      code: `# 나이로 해지 확률을 예측하는 로지스틱 회귀
model = smf.logit("lapsed ~ age", data=df).fit()
model.params                             # 계수(양수면 나이 많을수록 해지↑)`,
      result: "Intercept와 age 계수 두 줄이 나옵니다. age 계수가 양수면 나이가 많을수록 해지 확률이 높습니다.",
    },
    {
      title: "3. 확률 예측",
      code: `df["해지확률"] = model.predict(df)          # 사람마다 해지 확률(0~1)
df[["age", "lapsed", "해지확률"]].head()`,
      result: "나이·실제 해지여부·예측 해지확률 세 열의 앞 5행이 나옵니다.",
    },
    {
      title: "다른 방법 — 오즈비로 해석",
      alt: true,
      code: `import numpy as np                       # 숫자 계산 도구
np.exp(model.params)                     # 오즈비: 나이 1세 늘 때 해지 오즈가 몇 배`,
      result: "Intercept·age의 오즈비가 나옵니다. age가 1.02면 나이 1세마다 해지 오즈가 2% 늘어난다는 뜻입니다.",
    },
    {
      title: "다른 방법 — scikit-learn LogisticRegression",
      alt: true,
      code: `from sklearn.linear_model import LogisticRegression  # 머신러닝식 분류
clf = LogisticRegression()               # 모델 준비
clf.fit(df[["age"]], df["lapsed"])       # 나이로 해지 학습
{"절편": clf.intercept_[0], "나이 계수": clf.coef_[0][0],
 "정확도": clf.score(df[["age"]], df["lapsed"])}  # 맞힌 비율`,
      result: "절편·나이 계수·정확도가 나옵니다. 기본 규제가 있어 계수가 statsmodels와 조금 다를 수 있습니다.",
    },
    {
      title: "다른 방법 — 혼동행렬(맞힘/틀림 표)",
      alt: true,
      code: `# 확률 0.5 이상이면 해지로 예측하고 실제와 비교
pred = (df["해지확률"] >= 0.5).astype(int)
pd.crosstab(df["lapsed"], pred, rownames=["실제"], colnames=["예측"])`,
      result: "실제(행) × 예측(열) 건수 표가 나옵니다. 대각선 칸이 맞힌 건수입니다.",
    },
  ],

  glm: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
import statsmodels.api as sm             # 통계 모형 도구
import statsmodels.formula.api as smf    # 수식으로 모형 쓰기
df = pd.read_excel("claims.xlsx")        # 샘플 사고 데이터 읽기
df["claim_cnt"].describe()               # 사고 건수(빈도) 확인`,
      result: "사고 건수의 개수·평균·표준편차·최소·최대가 나옵니다.",
    },
    {
      title: "2. 포아송 모형(사고 건수)",
      code: `# 포아송: 건수(0,1,2…) 데이터에 쓰는 모형
model = smf.glm("claim_cnt ~ age", data=df,
                family=sm.families.Poisson()).fit()
model.params                             # 계수(로그 척도)`,
      result: "Intercept와 age 계수 두 줄이 로그 척도로 나옵니다.",
    },
    {
      title: "다른 방법 — 상대도 exp(계수)",
      alt: true,
      code: `import numpy as np                       # 숫자 계산 도구
np.exp(model.params)                     # 나이 1세 늘 때 사고 건수가 몇 배`,
      result: "계수를 배수로 바꾼 값이 나옵니다. age가 1.01이면 나이 1세마다 사고 건수가 1% 늘어납니다.",
    },
    {
      title: "다른 방법 — 결과표(summary)",
      alt: true,
      code: `# 계수·표준오차·z·p값·신뢰구간, deviance(적합 정도)
model.summary()`,
      result: "계수별 표준오차·z·p값·95% 신뢰구간과 Deviance·AIC가 담긴 결과표가 나옵니다.",
    },
    {
      title: "다른 방법 — 감마 모형(사고 금액)",
      alt: true,
      code: `# 감마 + 로그 링크: 양수이고 꼬리가 긴 금액(심도)에 쓰는 모형
sev = df[df["claim_amt"] > 0]            # 금액이 있는 사고만
gm = smf.glm("claim_amt ~ age", data=sev,
             family=sm.families.Gamma(sm.families.links.Log())).fit()
gm.params`,
      result: "사고 금액 모형의 Intercept·age 계수가 로그 척도로 나옵니다.",
    },
    {
      title: "다른 방법 — scikit-learn PoissonRegressor",
      alt: true,
      code: `from sklearn.linear_model import PoissonRegressor  # 머신러닝식 포아송
pr = PoissonRegressor(alpha=0)           # alpha=0: 규제 없이(위와 같은 모형)
pr.fit(df[["age"]], df["claim_cnt"])     # 나이로 사고 건수 학습
{"절편": pr.intercept_, "나이 계수": pr.coef_[0]}`,
      result: "절편과 나이 계수가 나옵니다. statsmodels 포아송 결과와 거의 같습니다.",
    },
  ],

  regularized: [
    {
      title: "1. 데이터 준비",
      code: `import pandas as pd                      # 표 데이터 도구
from sklearn.linear_model import Ridge   # 릿지 회귀(계수를 작게 누름)
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
X = df[["age", "bmi", "dependents"]]     # 설명 변수(입력)
y = df["premium"]                        # 맞출 값(보험료)
X.head()`,
      result: "설명 변수 세 열(나이·BMI·부양가족)의 앞 5행이 나옵니다.",
    },
    {
      title: "2. 릿지 회귀 적합",
      code: `model = Ridge(alpha=1.0)                 # alpha: 누르는 세기(클수록 강함)
model.fit(X, y)                          # 데이터로 학습
pd.Series(model.coef_, index=X.columns)  # 변수별 계수`,
      result: "age·bmi·dependents 세 변수의 계수가 나옵니다.",
    },
    {
      title: "다른 방법 — 라쏘(Lasso)",
      alt: true,
      code: `from sklearn.linear_model import Lasso   # 라쏘: 필요 없는 계수를 0으로
lasso = Lasso(alpha=100)                 # alpha가 클수록 0이 되는 계수가 많아짐
lasso.fit(X, y)                          # 학습
pd.Series(lasso.coef_, index=X.columns)  # 0이 된 변수 = 빠진 변수`,
      result: "세 변수의 계수가 나옵니다. 0이 된 변수는 모델에서 빠졌다는 뜻입니다.",
    },
    {
      title: "다른 방법 — 표준화 후 릿지(파이프라인)",
      alt: true,
      code: `from sklearn.pipeline import make_pipeline         # 단계 묶기
from sklearn.preprocessing import StandardScaler   # 단위 맞추기
pipe = make_pipeline(StandardScaler(), Ridge(alpha=1.0))  # 표준화 → 릿지
pipe.fit(X, y)                                     # 학습
pd.Series(pipe[-1].coef_, index=X.columns)         # 단위가 같아져 크기 비교 가능`,
      result: "표준화된 변수 기준 계수가 나옵니다. 절댓값이 클수록 보험료에 영향이 큰 변수입니다.",
    },
    {
      title: "다른 방법 — RidgeCV로 alpha 자동 선택",
      alt: true,
      code: `from sklearn.linear_model import RidgeCV # 교차검증으로 alpha 고르기
cv = RidgeCV(alphas=[0.1, 1, 10, 100, 1000])  # 후보 alpha
cv.fit(X, y)                             # 후보마다 검증해 가장 좋은 것 선택
{"선택된 alpha": cv.alpha_, "R²": cv.score(X, y)}`,
      result: "가장 좋은 alpha 값과 그때의 R²가 나옵니다.",
    },
  ],

  "time-series": [
    {
      title: "1. 월별 데이터 만들기",
      code: `import pandas as pd                      # 표 데이터 도구
import numpy as np                       # 숫자 계산 도구
months = pd.date_range("2021-01", periods=36, freq="MS")  # 36개월 날짜
rng = np.random.default_rng(42)          # 같은 결과가 나오게 고정한 난수
claims = 100 + np.arange(36) * 2 + rng.normal(0, 8, 36)   # 추세 + 잡음
s = pd.Series(claims, index=months)      # 월별 사고 건수 시계열
s.head()`,
      result: "2021-01부터 5개월의 날짜와 사고 건수가 나옵니다.",
    },
    {
      title: "2. 이동평균으로 추세 보기",
      code: `import matplotlib.pyplot as plt          # 그래프 도구
trend = s.rolling(6).mean()              # 최근 6개월 평균(들쭉날쭉 완화)
s.plot(label="월별 값")                    # 원래 값
trend.plot(label="6개월 이동평균")          # 부드러운 추세선
plt.legend()                             # 범례 표시
plt.show()`,
      result: "들쭉날쭉한 월별 선과 부드러운 6개월 이동평균 선이 함께 그려집니다.",
    },
    {
      title: "다른 방법 — 지수가중 이동평균(ewm)",
      alt: true,
      code: `# 최근 달에 더 큰 가중치를 주는 평균(추세 변화에 빨리 반응)
s.ewm(span=6).mean().tail()`,
      result: "마지막 5개월의 지수가중 평균값이 나옵니다.",
    },
    {
      title: "다른 방법 — 분기 합계로 묶기",
      alt: true,
      code: `q = s.resample("QS").sum()               # 월 → 분기 합계로 묶기
pd.DataFrame({"분기합계": q}).tail(4)`,
      result: "마지막 4개 분기의 사고 건수 합계 표가 나옵니다.",
    },
    {
      title: "다른 방법 — 직선 추세로 다음 달 예측",
      alt: true,
      code: `t = np.arange(len(s))                    # 0,1,2,… 시간 번호
slope, intercept = np.polyfit(t, s, 1)   # 직선 추세 맞추기
{"월 증가량": slope, "다음 달 예측": intercept + slope * len(s)}`,
      result: "한 달에 늘어나는 양(기울기)과 37번째 달 예측값이 나옵니다.",
    },
  ],

  survival: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
df = pd.read_excel("experience.xlsx")    # 계약 경과 데이터 읽기
# duration_years: 관찰 기간(년), event: 1=사건 발생 / 0=관찰 중 끝남
df[["duration_years", "event"]].head()`,
      result: "관찰 기간과 사건 여부 두 열의 앞 5행이 나옵니다.",
    },
    {
      title: "2. 연차별 생존표 만들기",
      code: `df["year"] = df["duration_years"].astype(int) + 1   # 몇 년차에 끝났는지
ended = df.groupby("year").size()                    # 연차별 관찰 종료 인원
events = df.groupby("year")["event"].sum()           # 연차별 사건 수
at_risk = len(df) - ended.cumsum().shift(fill_value=0)  # 연차 시작 시 남은 인원
table = pd.DataFrame({"위험인원": at_risk, "사건": events})
table["생존확률"] = (1 - table["사건"] / table["위험인원"]).cumprod()  # 누적 곱
table`,
      result: "연차별 위험인원·사건 수·누적 생존확률 표가 나옵니다. 생존확률은 연차가 갈수록 줄어듭니다.",
    },
    {
      title: "다른 방법 — 생존곡선 그림",
      alt: true,
      code: `import matplotlib.pyplot as plt          # 그래프 도구
table["생존확률"].plot(drawstyle="steps-post", marker="o")  # 계단 모양 생존곡선
plt.ylim(0, 1)                           # 세로축 0~1
plt.show()`,
      result: "연차가 지날수록 내려가는 계단 모양 생존곡선이 그려집니다.",
    },
    {
      title: "다른 방법 — 상품별 사건률 비교",
      alt: true,
      code: `# 상품마다 사건 수 ÷ 총 관찰 기간(년) = 연간 사건률
g = df.groupby("product").agg(사건=("event", "sum"), 관찰년=("duration_years", "sum"))
g["연간사건률"] = g["사건"] / g["관찰년"]
g`,
      result: "상품별 사건 수·총 관찰년·연간 사건률 표가 나옵니다. 사건률이 높은 상품일수록 빨리 끝납니다.",
    },
  ],

  "loss-functions": [
    {
      title: "1. 간단한 예측 만들기",
      code: `import pandas as pd                      # 표 데이터 도구
import numpy as np                       # 숫자 계산 도구
import statsmodels.formula.api as smf    # 회귀분석 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
model = smf.ols("premium ~ age", data=df).fit()  # 나이로 보험료 예측
pred = model.predict(df)                 # 예측값
err = df["premium"] - pred               # 오차 = 실제 - 예측
err.describe()`,
      result: "예측 오차의 개수·평균(약 0)·표준편차·최소·최대가 나옵니다.",
    },
    {
      title: "2. 손실(오차 크기) 계산",
      code: `mse = np.mean(err ** 2)                  # MSE: 오차 제곱의 평균
mae = np.mean(np.abs(err))               # MAE: 오차 크기(절댓값)의 평균
rmse = np.sqrt(mse)                      # RMSE: MSE의 제곱근(원래 단위)
{"MSE": mse, "MAE": mae, "RMSE": rmse}   # 작을수록 예측이 정확`,
      result: "MSE·MAE·RMSE 세 숫자가 나옵니다. RMSE와 MAE는 원 단위라 '평균 몇 원 틀리는지'로 읽습니다.",
    },
    {
      title: "다른 방법 — scikit-learn metrics",
      alt: true,
      code: `from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
y = df["premium"]                        # 실제값
{"MSE": mean_squared_error(y, pred),     # 직접 계산한 값과 같음
 "MAE": mean_absolute_error(y, pred),
 "R²": r2_score(y, pred)}                # 설명력(1에 가까울수록 좋음)`,
      result: "MSE·MAE·R² 세 숫자가 나옵니다. 위에서 직접 계산한 값과 같습니다.",
    },
    {
      title: "다른 방법 — MAPE(퍼센트 오차)",
      alt: true,
      code: `# 실제값 대비 몇 % 틀렸는지 평균 — 금액 크기가 제각각일 때 편함
mape = np.mean(np.abs(err / df["premium"])) * 100
mape`,
      result: "평균 퍼센트 오차 한 숫자가 나옵니다. 20이면 평균 20% 정도 빗나간다는 뜻입니다.",
    },
    {
      title: "다른 방법 — 오차 히스토그램",
      alt: true,
      code: `import matplotlib.pyplot as plt          # 그래프 도구
err.plot(kind="hist", bins=40)           # 오차가 0 주위에 몰려 있는지 보기
plt.show()`,
      result: "오차 분포 히스토그램이 나옵니다. 0 근처에 좁게 모일수록 좋은 예측입니다.",
    },
  ],

  "stepwise-linear": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
import statsmodels.formula.api as smf    # 회귀분석 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df[["premium", "age", "bmi"]].head()     # 쓸 열 확인`,
      result: "보험료·나이·BMI 세 열의 앞 5행이 나옵니다.",
    },
    {
      title: "2. 변수 수가 다른 두 모델 비교",
      code: `# 변수를 더 넣는 게 나은지 AIC(작을수록 좋음)로 비교
m1 = smf.ols("premium ~ age", data=df).fit()          # 나이만
m2 = smf.ols("premium ~ age + bmi", data=df).fit()    # 나이 + BMI
{"나이만 AIC": m1.aic, "나이+BMI AIC": m2.aic}        # 더 작은 쪽을 선택`,
      result: "두 모델의 AIC가 나옵니다. 값이 더 작은 모델을 고릅니다.",
    },
    {
      title: "다른 방법 — F 검정(anova_lm)",
      alt: true,
      code: `import statsmodels.api as sm             # 통계 모형 도구
# 변수를 추가해서 설명력이 '유의하게' 늘었는지 검정
sm.stats.anova_lm(m1, m2)                # Pr(>F) < 0.05 이면 bmi 추가가 의미 있음`,
      result: "두 모델의 잔차 제곱합·F·p값(Pr(>F))이 담긴 비교표가 나옵니다.",
    },
    {
      title: "다른 방법 — 여러 후보를 한 표로",
      alt: true,
      code: `forms = ["premium ~ age", "premium ~ age + bmi",
         "premium ~ age + bmi + dependents"]  # 후보 모델 목록
rows = []                                # 결과를 모을 목록
for f in forms:
    m = smf.ols(f, data=df).fit()        # 후보마다 적합
    rows.append({"모델": f, "AIC": m.aic, "BIC": m.bic, "수정R²": m.rsquared_adj})
pd.DataFrame(rows)`,
      result: "후보 모델마다 AIC·BIC·수정 R²가 한 행씩 나옵니다. AIC·BIC는 작을수록, 수정 R²는 클수록 좋습니다.",
    },
  ],

  "stepwise-logistic": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
import statsmodels.formula.api as smf    # 회귀분석 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df["lapsed"] = df["lapsed"].astype(int)  # 해지여부 True/False → 1/0
df[["lapsed", "age", "tenure_months"]].head()`,
      result: "해지여부(1/0)·나이·가입기간 세 열의 앞 5행이 나옵니다.",
    },
    {
      title: "2. 변수 수가 다른 두 모델 비교",
      code: `# 변수를 더 넣는 게 나은지 AIC(작을수록 좋음)로 비교
m1 = smf.logit("lapsed ~ age", data=df).fit()                  # 나이만
m2 = smf.logit("lapsed ~ age + tenure_months", data=df).fit()  # 나이 + 가입기간
{"나이만 AIC": m1.aic, "나이+가입기간 AIC": m2.aic}              # 더 작은 쪽 선택`,
      result: "두 모델의 AIC가 나옵니다. 값이 더 작은 모델을 고릅니다.",
    },
    {
      title: "다른 방법 — 우도비 검정(LR test)",
      alt: true,
      code: `from scipy import stats                  # 통계 검정 도구
lr = 2 * (m2.llf - m1.llf)               # 로그우도 차이 × 2
p = stats.chi2.sf(lr, df=1)              # 추가 변수 1개 → 자유도 1
{"LR 통계량": lr, "p값": p}               # p < 0.05 이면 변수 추가가 의미 있음`,
      result: "우도비 통계량과 p값이 나옵니다. p값이 작으면 가입기간을 넣는 게 낫습니다.",
    },
    {
      title: "다른 방법 — 여러 후보를 한 표로",
      alt: true,
      code: `forms = ["lapsed ~ age", "lapsed ~ age + tenure_months",
         "lapsed ~ age + tenure_months + premium"]  # 후보 모델 목록
rows = []                                # 결과를 모을 목록
for f in forms:
    m = smf.logit(f, data=df).fit(disp=0)  # disp=0: 반복 로그 숨김
    rows.append({"모델": f, "AIC": m.aic, "BIC": m.bic, "의사R²": m.prsquared})
pd.DataFrame(rows)`,
      result: "후보 모델마다 AIC·BIC·의사 R²(McFadden)가 한 행씩 나옵니다. AIC가 가장 작은 모델을 고릅니다.",
    },
  ],
};
