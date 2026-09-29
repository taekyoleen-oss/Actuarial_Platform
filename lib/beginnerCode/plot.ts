// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
// 그래프 조각: df(policy 샘플)·policy·claims가 이미 있다고 가정. pandas .plot() 한두 줄 + plt.show().
import type { BeginnerBlock } from "../beginnerCode";

export const DATA: Record<string, BeginnerBlock[]> = {
  // ── 기초 그래프 ──
  "basic-hist": [
    {
      title: "히스토그램",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["premium"].plot(kind="hist", bins=20)   # 보험료 분포를 막대 20개로
plt.xlabel("premium")                  # x축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-bar": [
    {
      title: "막대그래프 (범주별 개수)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["product"].value_counts().plot(kind="bar")   # 상품별 건수를 세서 막대로
plt.ylabel("건수")                     # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-pie": [
    {
      title: "파이차트 (비율)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["product"].value_counts().plot(kind="pie", autopct="%1.0f%%")   # 상품별 비율을 원으로(% 표시)
plt.ylabel("")                         # 옆에 붙는 열 이름 지우기
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-line": [
    {
      title: "선그래프 (추이)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.groupby("age")["premium"].mean().plot(kind="line")   # 나이별 평균 보험료를 선으로
plt.ylabel("평균 보험료")              # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-box": [
    {
      title: "박스플롯",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.boxplot(column="premium", by="product")   # 상품별 보험료 분포를 상자로
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-scatter": [
    {
      title: "산점도",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.plot(kind="scatter", x="age", y="premium", alpha=0.5)   # 나이(x)와 보험료(y)를 점으로
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-group-bar": [
    {
      title: "그룹별 평균 막대",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.groupby("channel")["premium"].mean().plot(kind="bar")   # 채널별 평균 보험료를 막대로
plt.ylabel("평균 보험료")              # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],

  // ── 탐색(EDA) ──
  "hist-kde": [
    {
      title: "히스토그램 + KDE",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["premium"].plot(kind="hist", bins=30, density=True, alpha=0.5)   # 히스토그램(밀도 기준)
df["premium"].plot(kind="kde")         # 부드러운 분포선(KDE)을 겹쳐 그리기
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "box-violin": [
    {
      title: "박스·바이올린 (집단 비교)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
names = sorted(df["product"].unique())  # 상품 이름 목록(가나다순)
groups = [df.loc[df["product"] == n, "premium"] for n in names]   # 상품별 보험료 묶음
plt.violinplot(groups, showmedians=True)   # 바이올린: 폭이 넓을수록 값이 많음
plt.xticks(range(1, len(names) + 1), names)   # x축에 상품 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-reg": [
    {
      title: "산점도 + 회귀선",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import numpy as np                     # 계산 도구
b, a = np.polyfit(df["age"], df["premium"], 1)   # 직선 y = b·x + a 맞추기
plt.scatter(df["age"], df["premium"], alpha=0.4)   # 점 찍기
plt.plot(df["age"], b * df["age"] + a, color="red")   # 맞춘 직선 그리기
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "corr-heatmap": [
    {
      title: "상관 히트맵",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
corr = df.select_dtypes("number").corr()   # 숫자 열끼리 상관계수 표
plt.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)   # 색으로 표시(빨강=양, 파랑=음)
plt.xticks(range(len(corr)), corr.columns, rotation=90)   # x축 열 이름
plt.yticks(range(len(corr)), corr.columns)   # y축 열 이름
plt.colorbar()                         # 색 막대(값 범위 안내)
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-matrix": [
    {
      title: "산점도 행렬",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import pandas as pd                    # 표 도구
pd.plotting.scatter_matrix(df[["age", "premium", "bmi"]], figsize=(7, 7))   # 변수 쌍마다 산점도
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "select-columns": [
    {
      title: "특정 열 선택·읽기",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
sub = df[["age", "premium"]]           # 쓸 열만 골라 새 표로
sub.hist(bins=20)                      # 고른 열마다 히스토그램으로 빠르게 확인
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-groups": [
    {
      title: "scatter 2D — x·y·구분 색상",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
for name, g in df.groupby("product"):  # 상품(구분)마다 따로
    plt.scatter(g["age"], g["premium"], label=name, alpha=0.6)   # 다른 색으로 점 찍기
plt.legend()                           # 어떤 색이 어떤 상품인지 범례
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-3d": [
    {
      title: "scatter 3D — x·y·z·구분",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
ax = plt.figure().add_subplot(projection="3d")   # 3차원 축 만들기
ax.scatter(df["age"], df["premium"], df["bmi"])   # x=나이, y=보험료, z=BMI 점 찍기
ax.set_xlabel("age"); ax.set_ylabel("premium"); ax.set_zlabel("bmi")   # 축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-shape-color": [
    {
      title: "산점도 — 그룹 모양+색 구분",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
shapes = ["o", "s", "^", "D", "v"]     # 그룹마다 쓸 점 모양(원·네모·세모…)
for i, (name, g) in enumerate(df.groupby("product")):   # 상품(그룹)마다
    plt.scatter(g["age"], g["premium"], marker=shapes[i % 5], label=name)   # 모양+색 다르게
plt.legend()                           # 범례
plt.show()                             # 그래프 보여 주기`,
    },
  ],

  // ── 모델 진단 ──
  "residual-plot": [
    {
      title: "잔차 플롯 (예측 vs 잔차)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.linear_model import LinearRegression   # 선형회귀 모델
X, y = df[["age", "bmi"]], df["premium"]   # 입력 변수, 맞힐 값(보험료)
pred = LinearRegression().fit(X, y).predict(X)   # 모델 학습 후 예측
plt.scatter(pred, y - pred, alpha=0.4)   # x=예측값, y=잔차(실제-예측)
plt.axhline(0, color="red")            # 0 기준선(고르게 흩어지면 좋음)
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "learning-curve": [
    {
      title: "학습곡선 (learning_curve)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import LearningCurveDisplay   # 학습곡선 그리기 도구
from sklearn.tree import DecisionTreeClassifier   # 간단한 나무 모델
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
LearningCurveDisplay.from_estimator(DecisionTreeClassifier(max_depth=3), X, y, cv=5)   # 표본 수별 점수
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "validation-curve": [
    {
      title: "검증곡선 (validation_curve)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import ValidationCurveDisplay   # 검증곡선 그리기 도구
from sklearn.tree import DecisionTreeClassifier   # 간단한 나무 모델
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
ValidationCurveDisplay.from_estimator(DecisionTreeClassifier(), X, y,   # 나무 모델로
    param_name="max_depth", param_range=[1, 2, 3, 5, 8], cv=5)   # 깊이를 바꿔 가며 점수 비교
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "roc-curve": [
    {
      title: "ROC 곡선 (RocCurveDisplay)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.linear_model import LogisticRegression   # 로지스틱 회귀 모델
from sklearn.metrics import RocCurveDisplay   # ROC 곡선 그리기 도구
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
model = LogisticRegression(max_iter=1000).fit(X_tr, y_tr)   # 모델 학습
RocCurveDisplay.from_estimator(model, X_te, y_te)   # 검증용으로 ROC 곡선(+AUC)
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "pr-curve": [
    {
      title: "PR 곡선 (PrecisionRecallDisplay)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.linear_model import LogisticRegression   # 로지스틱 회귀 모델
from sklearn.metrics import PrecisionRecallDisplay   # PR 곡선 그리기 도구
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
model = LogisticRegression(max_iter=1000).fit(X_tr, y_tr)   # 모델 학습
PrecisionRecallDisplay.from_estimator(model, X_te, y_te)   # 정밀도-재현율 곡선
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "calibration-curve": [
    {
      title: "캘리브레이션 곡선 (+Brier)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.linear_model import LogisticRegression   # 로지스틱 회귀 모델
from sklearn.calibration import CalibrationDisplay   # 캘리브레이션 곡선 도구
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
model = LogisticRegression(max_iter=1000).fit(X_tr, y_tr)   # 모델 학습
CalibrationDisplay.from_estimator(model, X_te, y_te, n_bins=5)   # 예측확률 vs 실제 비율
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "lift-gain": [
    {
      title: "리프트·게인 차트",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.linear_model import LogisticRegression   # 로지스틱 회귀 모델
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"].astype(int)   # 입력 변수, 해지(1/0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
p = LogisticRegression(max_iter=1000).fit(X_tr, y_tr).predict_proba(X_te)[:, 1]   # 해지 확률
hit = y_te.values[p.argsort()[::-1]]   # 확률 높은 고객부터 실제 해지 여부 줄 세우기
plt.plot(hit.cumsum() / hit.sum())     # 게인: 상위부터 누적으로 잡아낸 해지 비율
plt.plot([0, len(hit)], [0, 1], "--")  # 무작위로 골랐을 때 기준선
plt.show()                             # 그래프 보여 주기`,
    },
  ],

  // ── 해석 ──
  "feature-importance": [
    {
      title: "변수 중요도 (막대)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import pandas as pd                    # 표 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
X, y = df[["age", "premium", "bmi", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
model = RandomForestClassifier(random_state=0).fit(X, y)   # 모델 학습
pd.Series(model.feature_importances_, index=X.columns).sort_values().plot(kind="barh")   # 중요도 막대
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "permutation-importance": [
    {
      title: "순열 중요도 (permutation_importance)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import pandas as pd                    # 표 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import permutation_importance   # 순열 중요도 계산
X, y = df[["age", "premium", "bmi", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
model = RandomForestClassifier(random_state=0).fit(X_tr, y_tr)   # 모델 학습
r = permutation_importance(model, X_te, y_te, random_state=0)   # 열을 섞었을 때 점수 하락폭
pd.Series(r.importances_mean, index=X.columns).sort_values().plot(kind="barh")   # 막대로
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  pdp: [
    {
      title: "부분의존도 PDP (PartialDependenceDisplay)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import PartialDependenceDisplay   # PDP 그리기 도구
X = df[["age", "premium", "tenure_months"]].astype(float)   # 입력 변수(실수형으로)
model = RandomForestClassifier(random_state=0).fit(X, df["lapsed"])   # 해지 예측 모델 학습
PartialDependenceDisplay.from_estimator(model, X, ["age"])   # 나이가 바뀌면 예측이 평균적으로 어떻게?
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  ice: [
    {
      title: "ICE (개별 조건부 기대)",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import PartialDependenceDisplay   # PDP·ICE 그리기 도구
X = df[["age", "premium", "tenure_months"]].astype(float)   # 입력 변수(실수형으로)
model = RandomForestClassifier(random_state=0).fit(X, df["lapsed"])   # 해지 예측 모델 학습
PartialDependenceDisplay.from_estimator(model, X, ["age"], kind="both", subsample=50)   # 개별선+평균선
plt.show()                             # 그래프 보여 주기`,
    },
  ],
};
