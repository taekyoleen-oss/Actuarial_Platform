// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
import type { BeginnerBlock } from "../beginnerCode";

export const DATA: Record<string, BeginnerBlock[]> = {
  "desc-stats": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df.head()                                # 앞 5행 보기`,
    },
    {
      title: "2. 요약 통계 보기",
      code: `# 숫자 열마다 개수·평균·표준편차(퍼진 정도)·최소·최대를 한 번에
df.describe()`,
    },
  ],

  correlation: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df[["age", "premium", "bmi"]].head()     # 볼 열 세 개만 확인`,
    },
    {
      title: "2. 상관계수 구하기",
      code: `# 상관계수: -1~1, 1에 가까울수록 함께 커짐
r = df["age"].corr(df["premium"])        # 나이와 보험료의 상관계수
table = df[["age", "premium", "bmi"]].corr()  # 세 열끼리 모두 비교한 표
table`,
    },
  ],

  "t-test": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
from scipy import stats                  # 통계 검정 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df.groupby("sex")["premium"].mean()      # 성별 평균 보험료 먼저 보기`,
    },
    {
      title: "2. 두 집단 평균 비교(t-검정)",
      code: `a = df[df["sex"] == "M"]["premium"]      # 남성 보험료
b = df[df["sex"] == "F"]["premium"]      # 여성 보험료
result = stats.ttest_ind(a, b)           # 두 평균이 같은지 검정
result                                   # pvalue < 0.05 이면 차이가 있다고 봄`,
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
    },
    {
      title: "2. 카이제곱 검정",
      code: `# 두 범주(성별·해지)가 서로 관련 있는지 검정
chi2, p, dof, expected = stats.chi2_contingency(table)
{"카이제곱": chi2, "p값": p}                # p < 0.05 이면 관련 있다고 봄`,
    },
  ],

  anova: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
from scipy import stats                  # 통계 검정 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df.groupby("product")["premium"].mean()  # 상품별 평균 보험료 보기`,
    },
    {
      title: "2. 세 집단 이상 평균 비교(분산분석)",
      code: `# 상품마다 보험료 묶음을 하나씩 만든다
groups = [g["premium"] for _, g in df.groupby("product")]
result = stats.f_oneway(*groups)         # 모든 상품 평균이 같은지 검정
result                                   # pvalue < 0.05 이면 어딘가 다름`,
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
    },
    {
      title: "2. 정규분포인지 검정",
      code: `from scipy import stats                  # 통계 검정 도구
result = stats.shapiro(df["bmi"])        # 샤피로 검정: 종 모양인지 확인
result                                   # pvalue > 0.05 이면 정규분포로 봄`,
    },
  ],

  nonparametric: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
from scipy import stats                  # 통계 검정 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df.groupby("sex")["premium"].median()    # 성별 중앙값(가운데 값) 보기`,
    },
    {
      title: "2. 순위로 두 집단 비교",
      code: `# 만-위트니 검정: 정규분포가 아니어도 쓰는 두 집단 비교
a = df[df["sex"] == "M"]["premium"]      # 남성 보험료
b = df[df["sex"] == "F"]["premium"]      # 여성 보험료
result = stats.mannwhitneyu(a, b)        # 순위 기준으로 차이 검정
result                                   # pvalue < 0.05 이면 차이 있음`,
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
    },
    {
      title: "2. 로그정규분포 맞추기",
      code: `# 로그정규: 금액처럼 오른쪽 꼬리가 긴 분포
shape, loc, scale = stats.lognorm.fit(x, floc=0)  # 데이터에 맞는 모수 찾기
dist = stats.lognorm(shape, loc, scale)  # 찾은 모수로 분포 만들기
{"평균": dist.mean(), "99% 분위수": dist.ppf(0.99)}  # 평균과 상위 1% 금액`,
    },
  ],

  "linear-regression": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
import statsmodels.formula.api as smf    # 회귀분석 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df[["age", "premium"]].head()            # 쓸 열 두 개 확인`,
    },
    {
      title: "2. 모델 만들기",
      code: `# 보험료 = 절편 + 기울기 × 나이 (직선 맞추기)
model = smf.ols("premium ~ age", data=df).fit()
model.params                             # 절편(Intercept)과 나이 기울기`,
    },
    {
      title: "3. 결과 보기",
      code: `# 계수·p값·R²(설명력)가 담긴 전체 결과표
model.summary()`,
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
    },
    {
      title: "2. 모델 만들기",
      code: `# 나이로 해지 확률을 예측하는 로지스틱 회귀
model = smf.logit("lapsed ~ age", data=df).fit()
model.params                             # 계수(양수면 나이 많을수록 해지↑)`,
    },
    {
      title: "3. 확률 예측",
      code: `df["해지확률"] = model.predict(df)          # 사람마다 해지 확률(0~1)
df[["age", "lapsed", "해지확률"]].head()`,
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
    },
    {
      title: "2. 포아송 모형(사고 건수)",
      code: `# 포아송: 건수(0,1,2…) 데이터에 쓰는 모형
model = smf.glm("claim_cnt ~ age", data=df,
                family=sm.families.Poisson()).fit()
model.params                             # 계수(로그 척도)`,
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
    },
    {
      title: "2. 릿지 회귀 적합",
      code: `model = Ridge(alpha=1.0)                 # alpha: 누르는 세기(클수록 강함)
model.fit(X, y)                          # 데이터로 학습
pd.Series(model.coef_, index=X.columns)  # 변수별 계수`,
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
    },
    {
      title: "2. 이동평균으로 추세 보기",
      code: `import matplotlib.pyplot as plt          # 그래프 도구
trend = s.rolling(6).mean()              # 최근 6개월 평균(들쭉날쭉 완화)
s.plot(label="월별 값")                    # 원래 값
trend.plot(label="6개월 이동평균")          # 부드러운 추세선
plt.legend()                             # 범례 표시
plt.show()`,
    },
  ],

  survival: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
df = pd.read_excel("experience.xlsx")    # 계약 경과 데이터 읽기
# duration_years: 관찰 기간(년), event: 1=사건 발생 / 0=관찰 중 끝남
df[["duration_years", "event"]].head()`,
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
err = df["premium"] - pred               # 오차 = 실제 - 예측`,
    },
    {
      title: "2. 손실(오차 크기) 계산",
      code: `mse = np.mean(err ** 2)                  # MSE: 오차 제곱의 평균
mae = np.mean(np.abs(err))               # MAE: 오차 크기(절댓값)의 평균
rmse = np.sqrt(mse)                      # RMSE: MSE의 제곱근(원래 단위)
{"MSE": mse, "MAE": mae, "RMSE": rmse}   # 작을수록 예측이 정확`,
    },
  ],

  "stepwise-linear": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd                      # 표 데이터 도구
import statsmodels.formula.api as smf    # 회귀분석 도구
df = pd.read_excel("policy.xlsx")        # 샘플 엑셀 파일 읽기
df[["premium", "age", "bmi"]].head()     # 쓸 열 확인`,
    },
    {
      title: "2. 변수 수가 다른 두 모델 비교",
      code: `# 변수를 더 넣는 게 나은지 AIC(작을수록 좋음)로 비교
m1 = smf.ols("premium ~ age", data=df).fit()          # 나이만
m2 = smf.ols("premium ~ age + bmi", data=df).fit()    # 나이 + BMI
{"나이만 AIC": m1.aic, "나이+BMI AIC": m2.aic}        # 더 작은 쪽을 선택`,
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
    },
    {
      title: "2. 변수 수가 다른 두 모델 비교",
      code: `# 변수를 더 넣는 게 나은지 AIC(작을수록 좋음)로 비교
m1 = smf.logit("lapsed ~ age", data=df).fit()                  # 나이만
m2 = smf.logit("lapsed ~ age + tenure_months", data=df).fit()  # 나이 + 가입기간
{"나이만 AIC": m1.aic, "나이+가입기간 AIC": m2.aic}              # 더 작은 쪽 선택`,
    },
  ],
};
