// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
import type { BeginnerBlock } from "../beginnerCode";

/** 분류 방법 공통 1블록: 샘플 읽기 + 입력/답 정하기 + 학습·시험 나누기 */
const PREP: BeginnerBlock = {
  title: "1. 데이터 준비",
  code: `import pandas as pd                                    # 표 데이터를 다루는 도구
from sklearn.model_selection import train_test_split   # 데이터를 학습용/시험용으로 나누는 도구
df = pd.read_excel("policy.xlsx")                      # 샘플 계약 데이터 읽기
X = df[["age", "premium", "tenure_months"]]            # 입력 열 3개(나이·보험료·가입기간)
y = df["lapsed"]                                       # 맞힐 답: 해지 여부(True/False)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)  # 75% 학습, 25% 시험
X.head()                                               # 입력 데이터 앞 5줄 보기`,
};

/** 비지도(군집·PCA·이상치) 공통 1블록 */
const PREP_NUM: BeginnerBlock = {
  title: "1. 데이터 준비",
  code: `import pandas as pd                                    # 표 데이터를 다루는 도구
from sklearn.preprocessing import StandardScaler       # 열마다 단위를 맞추는 도구
df = pd.read_excel("policy.xlsx")                      # 샘플 계약 데이터 읽기
cols = ["age", "premium", "bmi", "tenure_months"]      # 사용할 숫자 열 4개
X = StandardScaler().fit_transform(df[cols])           # 평균 0·표준편차 1로 크기 맞추기
df[cols].describe()                                    # 원래 열의 요약 통계 보기`,
};

export const DATA: Record<string, BeginnerBlock[]> = {
  "decision-tree": [
    PREP,
    {
      title: "2. 모델 학습",
      code: `from sklearn.tree import DecisionTreeClassifier       # 의사결정나무(질문을 이어 가며 분류)
model = DecisionTreeClassifier(max_depth=3, random_state=0)  # 질문 깊이 3단계까지만
model.fit(X_train, y_train)                            # 학습 데이터로 규칙 배우기
acc = model.score(X_test, y_test)                      # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "3. 나무 그림 보기",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
from sklearn.tree import plot_tree                     # 나무 모양을 그려 주는 도구
plt.figure(figsize=(12, 6))                            # 그림 크기 정하기
plot_tree(model, feature_names=list(X.columns), filled=True)  # 나무 그리기(색=많은 쪽 답)
plt.show()                                             # 그림 표시`,
    },
  ],

  "random-forest": [
    PREP,
    {
      title: "2. 모델 학습",
      code: `from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트(나무 여러 그루의 투표)
model = RandomForestClassifier(n_estimators=100, random_state=0)  # 나무 100그루
model.fit(X_train, y_train)                            # 학습 데이터로 배우기
acc = model.score(X_test, y_test)                      # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "3. 변수 중요도 보기",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
imp = pd.Series(model.feature_importances_, index=X.columns)  # 열별 중요도(합계 1)
imp.sort_values().plot(kind="barh")                    # 가로 막대그래프로 그리기
plt.show()                                             # 그림 표시`,
    },
  ],

  "gradient-boosting": [
    PREP,
    {
      title: "2. 모델 학습",
      code: `from sklearn.ensemble import GradientBoostingClassifier  # 부스팅(앞 나무의 실수를 다음 나무가 보완)
model = GradientBoostingClassifier(random_state=0)     # 기본 설정 그대로 사용
model.fit(X_train, y_train)                            # 학습 데이터로 배우기
acc = model.score(X_test, y_test)                      # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "3. 변수 중요도 보기",
      code: `imp = pd.Series(model.feature_importances_, index=X.columns)  # 열별 중요도(합계 1)
imp.sort_values(ascending=False)                       # 큰 순서로 보기`,
    },
  ],

  svm: [
    PREP,
    {
      title: "2. 모델 학습",
      code: `from sklearn.preprocessing import StandardScaler       # 열마다 단위를 맞추는 도구
from sklearn.svm import SVC                            # SVM(두 무리를 가르는 경계선 찾기)
scaler = StandardScaler().fit(X_train)                 # 학습 데이터 기준으로 크기 맞추는 법 배우기
model = SVC(kernel="rbf")                              # 곡선 경계를 쓰는 기본 SVM
model.fit(scaler.transform(X_train), y_train)          # 크기 맞춘 데이터로 학습
acc = model.score(scaler.transform(X_test), y_test)    # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
  ],

  knn: [
    PREP,
    {
      title: "2. 모델 학습",
      code: `from sklearn.preprocessing import StandardScaler       # 열마다 단위를 맞추는 도구
from sklearn.neighbors import KNeighborsClassifier     # KNN(가장 가까운 이웃의 답을 따라감)
scaler = StandardScaler().fit(X_train)                 # 거리 계산 전에 크기 맞추기
model = KNeighborsClassifier(n_neighbors=5)            # 가까운 이웃 5명으로 다수결
model.fit(scaler.transform(X_train), y_train)          # 학습 데이터 기억하기
acc = model.score(scaler.transform(X_test), y_test)    # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
  ],

  "naive-bayes": [
    PREP,
    {
      title: "2. 모델 학습",
      code: `from sklearn.naive_bayes import GaussianNB             # 나이브 베이즈(확률로 답을 고름)
model = GaussianNB()                                   # 숫자 열용 기본 모델
model.fit(X_train, y_train)                            # 학습 데이터로 배우기
acc = model.score(X_test, y_test)                      # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "3. 해지 확률 보기",
      code: `prob = model.predict_proba(X_test)[:, 1]              # 각 계약이 해지될 확률(0~1)
pd.Series(prob).head(10)                               # 앞 10건의 해지 확률 보기`,
    },
  ],

  kmeans: [
    PREP_NUM,
    {
      title: "2. 군집 나누기",
      code: `from sklearn.cluster import KMeans                     # K-평균(비슷한 계약끼리 묶기)
model = KMeans(n_clusters=3, n_init=10, random_state=0)  # 3개 무리로 나누기
df["cluster"] = model.fit_predict(X)                   # 계약마다 무리 번호(0·1·2) 붙이기
df["cluster"].value_counts()                           # 무리별 계약 수 보기`,
    },
    {
      title: "3. 무리별 특징 보기",
      code: `df.groupby("cluster")[cols].mean()                    # 무리별 평균값 비교`,
    },
  ],

  hierarchical: [
    PREP_NUM,
    {
      title: "2. 군집 나누기",
      code: `from sklearn.cluster import AgglomerativeClustering    # 계층적 군집(가까운 것부터 차례로 합치기)
model = AgglomerativeClustering(n_clusters=3)          # 최종 3개 무리가 될 때까지 합치기
df["cluster"] = model.fit_predict(X)                   # 계약마다 무리 번호 붙이기
df["cluster"].value_counts()                           # 무리별 계약 수 보기`,
    },
    {
      title: "3. 무리별 특징 보기",
      code: `df.groupby("cluster")[cols].mean()                    # 무리별 평균값 비교`,
    },
  ],

  pca: [
    PREP_NUM,
    {
      title: "2. 주성분 2개로 줄이기",
      code: `from sklearn.decomposition import PCA                  # PCA(여러 열을 요약 축 몇 개로 압축)
model = PCA(n_components=2)                            # 요약 축 2개만 남기기
Z = model.fit_transform(X)                             # 계약마다 새 좌표 2개 계산
model.explained_variance_ratio_                        # 각 축이 담은 정보 비율(합이 클수록 좋음)`,
    },
    {
      title: "3. 2차원 그림 보기",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
plt.scatter(Z[:, 0], Z[:, 1], s=8)                     # 첫째 축(가로)·둘째 축(세로)에 점 찍기
plt.xlabel("PC1")                                      # 가로축 이름
plt.ylabel("PC2")                                      # 세로축 이름
plt.show()                                             # 그림 표시`,
    },
  ],

  "cross-validation": [
    PREP,
    {
      title: "2. 5번 나눠서 평가하기",
      code: `from sklearn.model_selection import cross_val_score   # 교차검증(여러 번 바꿔 가며 시험)
from sklearn.tree import DecisionTreeClassifier       # 평가할 모델: 의사결정나무
model = DecisionTreeClassifier(max_depth=3, random_state=0)  # 깊이 3의 나무
scores = cross_val_score(model, X, y, cv=5)            # 데이터를 5조각 내 5번 시험
scores                                                 # 5번의 정확도 보기`,
    },
    {
      title: "3. 평균 점수 보기",
      code: `scores.mean()                                          # 5번 정확도의 평균(대표 점수)`,
    },
  ],

  "model-eval": [
    PREP,
    {
      title: "2. 모델 학습·예측",
      code: `from sklearn.linear_model import LogisticRegression   # 평가할 모델: 로지스틱 회귀
model = LogisticRegression(max_iter=1000)              # 계산 반복 1000번까지 허용
model.fit(X_train, y_train)                            # 학습 데이터로 배우기
pred = model.predict(X_test)                           # 시험 데이터 답 예측
prob = model.predict_proba(X_test)[:, 1]               # 해지 확률 예측
model.score(X_test, y_test)                            # 정확도 보기`,
    },
    {
      title: "3. 평가 지표 보기",
      code: `from sklearn.metrics import confusion_matrix, roc_auc_score  # 혼동행렬(맞힘/틀림 표)·AUC
auc = roc_auc_score(y_test, prob)                      # AUC(0.5=찍기, 1=완벽)
cm = confusion_matrix(y_test, pred)                    # 행=실제, 열=예측 개수 표
pd.DataFrame(cm, index=["실제 유지", "실제 해지"], columns=["예측 유지", "예측 해지"])  # 표로 보기`,
    },
  ],

  imbalanced: [
    PREP,
    {
      title: "2. 기본 모델 vs 균형 모델",
      code: `from sklearn.linear_model import LogisticRegression   # 비교할 모델: 로지스틱 회귀
from sklearn.metrics import recall_score               # 재현율(실제 해지를 찾아낸 비율)
base = LogisticRegression(max_iter=1000).fit(X_train, y_train)  # 기본 설정
bal = LogisticRegression(max_iter=1000, class_weight="balanced").fit(X_train, y_train)  # 적은 쪽에 가중치
pd.Series({                                            # 두 모델의 재현율 나란히 보기
    "기본": recall_score(y_test, base.predict(X_test)),
    "균형(balanced)": recall_score(y_test, bal.predict(X_test)),
})`,
    },
  ],

  calibration: [
    PREP,
    {
      title: "2. 모델 학습",
      code: `from sklearn.naive_bayes import GaussianNB             # 확률을 내 주는 간단한 모델
model = GaussianNB().fit(X_train, y_train)             # 학습 데이터로 배우기
prob = model.predict_proba(X_test)[:, 1]               # 해지 확률 예측(0~1)
prob[:10]                                              # 앞 10건 확률 보기`,
    },
    {
      title: "3. 예측 확률 vs 실제 비율",
      code: `from sklearn.calibration import calibration_curve     # 보정 곡선(확률이 믿을 만한지 확인)
real, pred = calibration_curve(y_test, prob, n_bins=5)  # 확률을 5구간으로 나눠 비교
pd.DataFrame({"예측 확률": pred, "실제 해지 비율": real})  # 두 값이 비슷할수록 좋음`,
    },
  ],

  anomaly: [
    PREP_NUM,
    {
      title: "2. 이상치 찾기",
      code: `from sklearn.ensemble import IsolationForest           # 아이솔레이션 포레스트(튀는 값 찾기)
model = IsolationForest(random_state=0)                # 기본 설정 사용
df["flag"] = model.fit_predict(X)                      # 정상=1, 이상치=-1
(df["flag"] == -1).sum()                               # 이상치 개수 보기`,
    },
    {
      title: "3. 이상치 계약 보기",
      code: `df[df["flag"] == -1][cols].head(10)                   # 이상치로 표시된 계약 10건 보기`,
    },
  ],
};
