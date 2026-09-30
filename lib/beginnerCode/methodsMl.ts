// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
import type { BeginnerBlock } from "../beginnerCode";

/** 분류 방법 공통 1블록: 샘플 읽기 + 입력/답 정하기 + 학습·시험 나누기 */
const PREP: BeginnerBlock = {
  title: "1. 데이터 준비",
  result:
    "입력 열 3개(age·premium·tenure_months)의 앞 5줄 표가 나옵니다. 학습용 450건·시험용 150건으로 나뉜 변수(X_train·X_test·y_train·y_test)도 만들어집니다.",
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
  result:
    "숫자 열 4개의 요약 통계표(개수·평균·표준편차·최솟값·사분위수·최댓값)가 나옵니다. 크기를 맞춘 배열 X(600행×4열)도 만들어집니다.",
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
      result: "시험 데이터 정확도가 0~1 사이 숫자 하나로 나옵니다(예: 0.87 = 87%를 맞힘).",
      code: `from sklearn.tree import DecisionTreeClassifier       # 의사결정나무(질문을 이어 가며 분류)
model = DecisionTreeClassifier(max_depth=3, random_state=0)  # 질문 깊이 3단계까지만
model.fit(X_train, y_train)                            # 학습 데이터로 규칙 배우기
acc = model.score(X_test, y_test)                      # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "3. 나무 그림 보기",
      result: "나무 그림이 나옵니다. 상자마다 질문(예: premium <= 51250)·건수·많은 쪽 답이 적히고, 색이 진할수록 한쪽 답이 뚜렷합니다.",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
from sklearn.tree import plot_tree                     # 나무 모양을 그려 주는 도구
plt.figure(figsize=(12, 6))                            # 그림 크기 정하기
plot_tree(model, feature_names=list(X.columns), filled=True)  # 나무 그리기(색=많은 쪽 답)
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — 윗부분만 크게 그리기",
      alt: true,
      result: "위 2단계 질문만 크게 그린 나무 그림이 나옵니다. 가장 중요한 첫 질문을 읽기 쉽습니다.",
      code: `plt.figure(figsize=(10, 5))                            # 그림 크기 정하기
plot_tree(model, max_depth=2, feature_names=list(X.columns), filled=True, fontsize=10)  # 2단계까지만 그리기
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — 규칙을 글자로(export_text)",
      alt: true,
      result: "'|--- premium <= 51250.00'처럼 들여쓴 규칙 줄 목록이 나옵니다. 그림 없이 규칙을 복사해 쓸 수 있습니다.",
      code: `from sklearn.tree import export_text                   # 나무 규칙을 글자로 바꾸는 도구
rules = export_text(model, feature_names=list(X.columns))  # 규칙 전체를 문자열로
rules.splitlines()                                     # 한 줄씩 나눠 보기`,
    },
    {
      title: "다른 방법 — classification_report 한 번에",
      alt: true,
      result: "답(False/True)별 정밀도·재현율·F1·건수와 전체 정확도가 한 표로 나옵니다.",
      code: `from sklearn.metrics import classification_report     # 분류 성적표를 한 번에 만드는 도구
rep = classification_report(y_test, model.predict(X_test), output_dict=True)  # 성적표를 사전으로
pd.DataFrame(rep).T                                    # 표로 보기(행=답, 열=지표)`,
    },
  ],

  "random-forest": [
    PREP,
    {
      title: "2. 모델 학습",
      result: "시험 데이터 정확도가 0~1 사이 숫자 하나로 나옵니다(예: 0.86).",
      code: `from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트(나무 여러 그루의 투표)
model = RandomForestClassifier(n_estimators=100, random_state=0)  # 나무 100그루
model.fit(X_train, y_train)                            # 학습 데이터로 배우기
acc = model.score(X_test, y_test)                      # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "3. 변수 중요도 보기",
      result: "열 3개의 중요도 가로 막대그래프가 나옵니다. 막대가 길수록 예측에 많이 쓰인 열입니다(합계 1).",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
imp = pd.Series(model.feature_importances_, index=X.columns)  # 열별 중요도(합계 1)
imp.sort_values().plot(kind="barh")                    # 가로 막대그래프로 그리기
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — accuracy_score로 정확도",
      alt: true,
      result: "model.score와 같은 정확도 숫자 하나가 나옵니다. 예측값을 직접 만들어 비교하는 방식입니다.",
      code: `from sklearn.metrics import accuracy_score            # 정확도 계산 도구
pred = model.predict(X_test)                           # 시험 데이터 답 예측
accuracy_score(y_test, pred)                           # 실제와 예측이 같은 비율`,
    },
    {
      title: "다른 방법 — 혼동행렬 그림",
      alt: true,
      result: "2×2 칸 그림이 나옵니다. 행=실제, 열=예측이고 칸 숫자는 건수라 어떤 쪽을 많이 틀렸는지 보입니다.",
      code: `from sklearn.metrics import ConfusionMatrixDisplay    # 혼동행렬 그림 도구
ConfusionMatrixDisplay.from_estimator(model, X_test, y_test)  # 모델로 예측해 바로 그리기
plt.show()                                             # 그림 표시`,
    },
  ],

  "gradient-boosting": [
    PREP,
    {
      title: "2. 모델 학습",
      result: "시험 데이터 정확도가 0~1 사이 숫자 하나로 나옵니다(예: 0.85).",
      code: `from sklearn.ensemble import GradientBoostingClassifier  # 부스팅(앞 나무의 실수를 다음 나무가 보완)
model = GradientBoostingClassifier(random_state=0)     # 기본 설정 그대로 사용
model.fit(X_train, y_train)                            # 학습 데이터로 배우기
acc = model.score(X_test, y_test)                      # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "3. 변수 중요도 보기",
      result: "열 이름과 중요도(합계 1)가 큰 순서로 나열된 목록이 나옵니다.",
      code: `imp = pd.Series(model.feature_importances_, index=X.columns)  # 열별 중요도(합계 1)
imp.sort_values(ascending=False)                       # 큰 순서로 보기`,
    },
    {
      title: "다른 방법 — HistGradientBoosting(빠른 부스팅)",
      alt: true,
      result: "더 빠른 부스팅 모델의 시험 정확도 숫자 하나가 나옵니다. 데이터가 크거나 빈칸(결측)이 있을 때 흔히 씁니다.",
      code: `from sklearn.ensemble import HistGradientBoostingClassifier  # 구간으로 묶어 빠르게 학습하는 부스팅
hgb = HistGradientBoostingClassifier(random_state=0)   # 기본 설정 사용
hgb.fit(X_train, y_train)                              # 학습 데이터로 배우기
hgb.score(X_test, y_test)                              # 시험 데이터 정확도`,
    },
    {
      title: "다른 방법 — 해지 확률로 AUC 평가",
      alt: true,
      result: "AUC 숫자 하나가 나옵니다(0.5=찍기 수준, 1=완벽). 해지가 적은 데이터에서는 정확도보다 AUC를 많이 봅니다.",
      code: `from sklearn.metrics import roc_auc_score             # AUC 계산 도구
prob = model.predict_proba(X_test)[:, 1]               # 각 계약의 해지 확률(0~1)
roc_auc_score(y_test, prob)                            # 확률로 매긴 순위가 얼마나 정확한지`,
    },
  ],

  svm: [
    PREP,
    {
      title: "2. 모델 학습",
      result: "시험 데이터 정확도가 0~1 사이 숫자 하나로 나옵니다(예: 0.87).",
      code: `from sklearn.preprocessing import StandardScaler       # 열마다 단위를 맞추는 도구
from sklearn.svm import SVC                            # SVM(두 무리를 가르는 경계선 찾기)
scaler = StandardScaler().fit(X_train)                 # 학습 데이터 기준으로 크기 맞추는 법 배우기
model = SVC(kernel="rbf")                              # 곡선 경계를 쓰는 기본 SVM
model.fit(scaler.transform(X_train), y_train)          # 크기 맞춘 데이터로 학습
acc = model.score(scaler.transform(X_test), y_test)    # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "다른 방법 — make_pipeline으로 한 줄에",
      alt: true,
      result: "위와 같은 정확도 숫자가 나옵니다. 크기 맞추기와 SVM을 하나로 묶어 transform을 따로 부를 필요가 없습니다.",
      code: `from sklearn.pipeline import make_pipeline            # 여러 단계를 하나로 묶는 도구
pipe = make_pipeline(StandardScaler(), SVC(kernel="rbf"))  # 크기 맞추기 → SVM 순서로 묶기
pipe.fit(X_train, y_train)                             # 원래 데이터를 그대로 넣어 학습
pipe.score(X_test, y_test)                             # 시험 데이터 정확도`,
    },
    {
      title: "다른 방법 — 커널 바꿔 비교",
      alt: true,
      result: "커널(linear·rbf·poly)별 시험 정확도 3개가 나란히 나옵니다. 가장 높은 커널을 고르면 됩니다.",
      code: `scores = {}                                            # 결과를 담을 빈 사전
for k in ["linear", "rbf", "poly"]:                    # 직선·곡선·다항식 경계를 차례로
    p = make_pipeline(StandardScaler(), SVC(kernel=k))  # 커널만 바꾼 모델
    scores[k] = p.fit(X_train, y_train).score(X_test, y_test)  # 학습 후 정확도 기록
pd.Series(scores)                                      # 커널별 정확도 보기`,
    },
  ],

  knn: [
    PREP,
    {
      title: "2. 모델 학습",
      result: "시험 데이터 정확도가 0~1 사이 숫자 하나로 나옵니다(예: 0.85).",
      code: `from sklearn.preprocessing import StandardScaler       # 열마다 단위를 맞추는 도구
from sklearn.neighbors import KNeighborsClassifier     # KNN(가장 가까운 이웃의 답을 따라감)
scaler = StandardScaler().fit(X_train)                 # 거리 계산 전에 크기 맞추기
model = KNeighborsClassifier(n_neighbors=5)            # 가까운 이웃 5명으로 다수결
model.fit(scaler.transform(X_train), y_train)          # 학습 데이터 기억하기
acc = model.score(scaler.transform(X_test), y_test)    # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "다른 방법 — make_pipeline으로 한 줄에",
      alt: true,
      result: "위와 같은 정확도 숫자가 나옵니다. 크기 맞추기와 KNN을 하나로 묶은 흔한 쓰는 법입니다.",
      code: `from sklearn.pipeline import make_pipeline            # 여러 단계를 하나로 묶는 도구
pipe = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=5))  # 크기 맞추기 → KNN
pipe.fit(X_train, y_train)                             # 원래 데이터를 그대로 넣어 학습
pipe.score(X_test, y_test)                             # 시험 데이터 정확도`,
    },
    {
      title: "다른 방법 — 이웃 수 k 바꿔 비교",
      alt: true,
      result: "k(3·5·9·15·25)별 시험 정확도가 나란히 나옵니다. k가 너무 작으면 들쭉날쭉, 너무 크면 뭉뚱그려집니다.",
      code: `scores = {}                                            # 결과를 담을 빈 사전
for k in [3, 5, 9, 15, 25]:                            # 이웃 수를 바꿔 가며
    p = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=k))  # k만 바꾼 모델
    scores[k] = p.fit(X_train, y_train).score(X_test, y_test)  # 학습 후 정확도 기록
pd.Series(scores)                                      # k별 정확도 보기`,
    },
  ],

  "naive-bayes": [
    PREP,
    {
      title: "2. 모델 학습",
      result: "시험 데이터 정확도가 0~1 사이 숫자 하나로 나옵니다(예: 0.87).",
      code: `from sklearn.naive_bayes import GaussianNB             # 나이브 베이즈(확률로 답을 고름)
model = GaussianNB()                                   # 숫자 열용 기본 모델
model.fit(X_train, y_train)                            # 학습 데이터로 배우기
acc = model.score(X_test, y_test)                      # 시험 데이터 정확도(0~1)
acc                                                    # 정확도 보기`,
    },
    {
      title: "3. 해지 확률 보기",
      result: "시험 데이터 앞 10건의 해지 확률(0~1)이 목록으로 나옵니다. 0.5를 넘으면 '해지'로 예측합니다.",
      code: `prob = model.predict_proba(X_test)[:, 1]              # 각 계약이 해지될 확률(0~1)
pd.Series(prob).head(10)                               # 앞 10건의 해지 확률 보기`,
    },
    {
      title: "다른 방법 — classification_report 한 번에",
      alt: true,
      result: "답(False/True)별 정밀도·재현율·F1·건수와 전체 정확도가 한 표로 나옵니다.",
      code: `from sklearn.metrics import classification_report     # 분류 성적표를 한 번에 만드는 도구
rep = classification_report(y_test, model.predict(X_test), output_dict=True, zero_division=0)  # 성적표 사전
pd.DataFrame(rep).T                                    # 표로 보기(행=답, 열=지표)`,
    },
    {
      title: "다른 방법 — 해지 확률 분포 그림",
      alt: true,
      result: "해지 확률 히스토그램이 나옵니다. 대부분 0 근처에 몰려 있으면 모델이 해지를 잘 가려내지 못한다는 뜻입니다.",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
pd.Series(prob).plot(kind="hist", bins=20)             # 확률을 20구간으로 나눠 막대 그리기
plt.xlabel("해지 확률")                                 # 가로축 이름
plt.show()                                             # 그림 표시`,
    },
  ],

  kmeans: [
    PREP_NUM,
    {
      title: "2. 군집 나누기",
      result: "무리 번호(0·1·2)별 계약 수가 나옵니다(예: 255건·229건·116건).",
      code: `from sklearn.cluster import KMeans                     # K-평균(비슷한 계약끼리 묶기)
model = KMeans(n_clusters=3, n_init=10, random_state=0)  # 3개 무리로 나누기
df["cluster"] = model.fit_predict(X)                   # 계약마다 무리 번호(0·1·2) 붙이기
df["cluster"].value_counts()                           # 무리별 계약 수 보기`,
    },
    {
      title: "3. 무리별 특징 보기",
      result: "행=무리 번호, 열=숫자 열 4개인 평균 표가 나옵니다. 무리마다 어떤 계약인지(예: 고령·고보험료) 읽을 수 있습니다.",
      code: `df.groupby("cluster")[cols].mean()                    # 무리별 평균값 비교`,
    },
    {
      title: "다른 방법 — 무리별 색으로 산점도",
      alt: true,
      result: "나이(가로)·보험료(세로) 산점도가 나오고, 점 색이 무리 번호입니다. 무리가 어디에 모여 있는지 눈으로 봅니다.",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
plt.scatter(df["age"], df["premium"], c=df["cluster"], s=10)  # 색 = 무리 번호
plt.xlabel("age")                                      # 가로축 이름
plt.ylabel("premium")                                  # 세로축 이름
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — 엘보(무리 수 고르기)",
      alt: true,
      result: "무리 수(1~8)별 '무리 안 흩어짐(inertia)' 꺾은선이 나옵니다. 꺾여서 완만해지는 지점이 적당한 무리 수입니다.",
      code: `inertia = {}                                           # 결과를 담을 빈 사전
for k in range(1, 9):                                  # 무리 수를 1~8로 바꿔 가며
    inertia[k] = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X).inertia_  # 흩어짐 기록
pd.Series(inertia).plot(marker="o")                    # 꺾은선으로 그리기
plt.show()                                             # 그림 표시`,
    },
  ],

  hierarchical: [
    PREP_NUM,
    {
      title: "2. 군집 나누기",
      result: "무리 번호(0·1·2)별 계약 수가 나옵니다.",
      code: `from sklearn.cluster import AgglomerativeClustering    # 계층적 군집(가까운 것부터 차례로 합치기)
model = AgglomerativeClustering(n_clusters=3)          # 최종 3개 무리가 될 때까지 합치기
df["cluster"] = model.fit_predict(X)                   # 계약마다 무리 번호 붙이기
df["cluster"].value_counts()                           # 무리별 계약 수 보기`,
    },
    {
      title: "3. 무리별 특징 보기",
      result: "행=무리 번호, 열=숫자 열 4개인 평균 표가 나옵니다.",
      code: `df.groupby("cluster")[cols].mean()                    # 무리별 평균값 비교`,
    },
    {
      title: "다른 방법 — 덴드로그램(scipy)",
      alt: true,
      result: "앞 50건이 차례로 합쳐지는 나무 모양 그림(덴드로그램)이 나옵니다. 세로선이 긴 곳에서 자르면 자연스러운 무리가 됩니다.",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
from scipy.cluster.hierarchy import linkage, dendrogram  # 합치는 순서 계산·그림 도구
Z = linkage(X[:50], method="ward")                     # 앞 50건으로 합치는 순서 계산
dendrogram(Z)                                          # 덴드로그램 그리기
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — 무리별 색으로 산점도",
      alt: true,
      result: "나이(가로)·보험료(세로) 산점도가 나오고, 점 색이 무리 번호입니다.",
      code: `plt.scatter(df["age"], df["premium"], c=df["cluster"], s=10)  # 색 = 무리 번호
plt.xlabel("age")                                      # 가로축 이름
plt.ylabel("premium")                                  # 세로축 이름
plt.show()                                             # 그림 표시`,
    },
  ],

  pca: [
    PREP_NUM,
    {
      title: "2. 주성분 2개로 줄이기",
      result: "두 축이 담은 정보 비율 2개가 나옵니다(예: [0.27, 0.26] = 두 축으로 원래 정보의 약 53%를 설명).",
      code: `from sklearn.decomposition import PCA                  # PCA(여러 열을 요약 축 몇 개로 압축)
model = PCA(n_components=2)                            # 요약 축 2개만 남기기
Z = model.fit_transform(X)                             # 계약마다 새 좌표 2개 계산
model.explained_variance_ratio_                        # 각 축이 담은 정보 비율(합이 클수록 좋음)`,
    },
    {
      title: "3. 2차원 그림 보기",
      result: "PC1(가로)·PC2(세로) 산점도가 나옵니다. 가까운 점일수록 비슷한 계약입니다.",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
plt.scatter(Z[:, 0], Z[:, 1], s=8)                     # 첫째 축(가로)·둘째 축(세로)에 점 찍기
plt.xlabel("PC1")                                      # 가로축 이름
plt.ylabel("PC2")                                      # 세로축 이름
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — 해지 여부로 색칠",
      alt: true,
      result: "같은 PC1·PC2 산점도인데 점 색이 해지 여부입니다. 두 색이 갈라져 있으면 요약 축이 해지를 잘 구분한다는 뜻입니다.",
      code: `plt.scatter(Z[:, 0], Z[:, 1], c=df["lapsed"], s=8, cmap="coolwarm")  # 색 = 해지 여부
plt.xlabel("PC1")                                      # 가로축 이름
plt.ylabel("PC2")                                      # 세로축 이름
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — 축별 열 가중치(로딩) 표",
      alt: true,
      result: "행=PC1·PC2, 열=원래 숫자 열 4개인 가중치 표가 나옵니다. 절댓값이 큰 열이 그 축을 주로 만든 열입니다.",
      code: `pd.DataFrame(model.components_, columns=cols, index=["PC1", "PC2"]).round(2)  # 축마다 열의 가중치`,
    },
    {
      title: "다른 방법 — 축 수별 누적 설명 비율",
      alt: true,
      result: "축을 1~4개 쓸 때 누적 정보 비율(마지막은 1.0)이 나옵니다. 보통 0.8~0.9를 넘는 축 수를 고릅니다.",
      code: `full = PCA().fit(X)                                     # 축을 모두(4개) 남겨 계산
pd.Series(full.explained_variance_ratio_.cumsum(), index=range(1, 5))  # 축 수별 누적 비율`,
    },
  ],

  "cross-validation": [
    PREP,
    {
      title: "2. 5번 나눠서 평가하기",
      result: "5번 시험한 정확도 5개가 배열로 나옵니다(예: [0.83 0.83 0.83 0.83 0.83]).",
      code: `from sklearn.model_selection import cross_val_score   # 교차검증(여러 번 바꿔 가며 시험)
from sklearn.tree import DecisionTreeClassifier       # 평가할 모델: 의사결정나무
model = DecisionTreeClassifier(max_depth=3, random_state=0)  # 깊이 3의 나무
scores = cross_val_score(model, X, y, cv=5)            # 데이터를 5조각 내 5번 시험
scores                                                 # 5번의 정확도 보기`,
    },
    {
      title: "3. 평균 점수 보기",
      result: "5번 정확도의 평균 숫자 하나가 나옵니다. 이것이 모델의 대표 점수입니다.",
      code: `scores.mean()                                          # 5번 정확도의 평균(대표 점수)`,
    },
    {
      title: "다른 방법 — 점수 기준을 AUC로",
      alt: true,
      result: "5번 시험의 AUC 5개가 나옵니다. 해지가 적은 데이터에서는 정확도보다 AUC가 더 믿을 만합니다.",
      code: `cross_val_score(model, X, y, cv=5, scoring="roc_auc")  # 점수 기준만 AUC로 바꾸기`,
    },
    {
      title: "다른 방법 — cross_validate로 여러 지표 한 번에",
      alt: true,
      result: "정확도·AUC·재현율과 학습/예측 시간의 5번 평균이 한 목록으로 나옵니다.",
      code: `from sklearn.model_selection import cross_validate    # 여러 지표를 한 번에 재는 교차검증
res = cross_validate(model, X, y, cv=5, scoring=["accuracy", "roc_auc", "recall"])  # 지표 3개
pd.DataFrame(res).mean()                               # 지표별 5번 평균 보기`,
    },
    {
      title: "다른 방법 — 섞어서 나누기(StratifiedKFold)",
      alt: true,
      result: "정확도 5개가 나옵니다. 조각마다 해지 비율을 똑같이 맞추고 순서를 섞어 나눈 결과입니다.",
      code: `from sklearn.model_selection import StratifiedKFold   # 답 비율을 유지하며 나누는 도구
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)  # 섞어서 5조각
cross_val_score(model, X, y, cv=cv)                    # 이 방식으로 5번 시험`,
    },
  ],

  "model-eval": [
    PREP,
    {
      title: "2. 모델 학습·예측",
      result: "시험 데이터 정확도가 0~1 사이 숫자 하나로 나옵니다. 예측값(pred)·해지 확률(prob)도 만들어집니다.",
      code: `from sklearn.linear_model import LogisticRegression   # 평가할 모델: 로지스틱 회귀
model = LogisticRegression(max_iter=1000)              # 계산 반복 1000번까지 허용
model.fit(X_train, y_train)                            # 학습 데이터로 배우기
pred = model.predict(X_test)                           # 시험 데이터 답 예측
prob = model.predict_proba(X_test)[:, 1]               # 해지 확률 예측
model.score(X_test, y_test)                            # 정확도 보기`,
    },
    {
      title: "3. 평가 지표 보기",
      result: "2×2 혼동행렬 표(행=실제 유지/해지, 열=예측 유지/해지 건수)가 나옵니다. AUC 값은 변수 auc에 담깁니다.",
      code: `from sklearn.metrics import confusion_matrix, roc_auc_score  # 혼동행렬(맞힘/틀림 표)·AUC
auc = roc_auc_score(y_test, prob)                      # AUC(0.5=찍기, 1=완벽)
cm = confusion_matrix(y_test, pred)                    # 행=실제, 열=예측 개수 표
pd.DataFrame(cm, index=["실제 유지", "실제 해지"], columns=["예측 유지", "예측 해지"])  # 표로 보기`,
    },
    {
      title: "다른 방법 — classification_report 한 번에",
      alt: true,
      result: "답(False/True)별 정밀도·재현율·F1·건수와 전체 정확도가 한 표로 나옵니다.",
      code: `from sklearn.metrics import classification_report     # 분류 성적표를 한 번에 만드는 도구
rep = classification_report(y_test, pred, output_dict=True, zero_division=0)  # 성적표를 사전으로
pd.DataFrame(rep).T                                    # 표로 보기(행=답, 열=지표)`,
    },
    {
      title: "다른 방법 — 혼동행렬 그림",
      alt: true,
      result: "2×2 칸 그림이 나옵니다. 칸 숫자는 건수이고, 대각선(왼위·오른아래)이 맞힌 건수입니다.",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
from sklearn.metrics import ConfusionMatrixDisplay    # 혼동행렬 그림 도구
ConfusionMatrixDisplay.from_predictions(y_test, pred)  # 실제·예측으로 바로 그리기
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — ROC 곡선 그림",
      alt: true,
      result: "ROC 곡선과 AUC 값이 범례에 표시된 그림이 나옵니다. 곡선이 왼쪽 위로 붙을수록 좋은 모델입니다.",
      code: `from sklearn.metrics import RocCurveDisplay           # ROC 곡선 그림 도구
RocCurveDisplay.from_estimator(model, X_test, y_test)  # 모델로 확률을 내 바로 그리기
plt.show()                                             # 그림 표시`,
    },
  ],

  imbalanced: [
    PREP,
    {
      title: "2. 기본 모델 vs 균형 모델",
      result: "두 모델의 재현율(실제 해지 중 찾아낸 비율)이 나란히 나옵니다. 이 샘플에서는 기본 0.0, 균형 약 0.21입니다.",
      code: `from sklearn.linear_model import LogisticRegression   # 비교할 모델: 로지스틱 회귀
from sklearn.metrics import recall_score               # 재현율(실제 해지를 찾아낸 비율)
base = LogisticRegression(max_iter=1000).fit(X_train, y_train)  # 기본 설정
bal = LogisticRegression(max_iter=1000, class_weight="balanced").fit(X_train, y_train)  # 적은 쪽에 가중치
pd.Series({                                            # 두 모델의 재현율 나란히 보기
    "기본": recall_score(y_test, base.predict(X_test)),
    "균형(balanced)": recall_score(y_test, bal.predict(X_test)),
})`,
    },
    {
      title: "다른 방법 — 답 비율 먼저 확인",
      alt: true,
      result: "해지 False/True 비율이 나옵니다(예: 0.84 / 0.16). 한쪽이 훨씬 적으면 불균형 데이터입니다.",
      code: `y.value_counts(normalize=True)                         # 답별 비율(합계 1)`,
    },
    {
      title: "다른 방법 — 기준선(임계값) 낮추기",
      alt: true,
      result: "기준선(0.5·0.3·0.2)별 재현율이 나옵니다. 모델은 그대로 두고 '해지' 판정 기준만 낮춰 더 많이 찾아냅니다.",
      code: `prob = base.predict_proba(X_test)[:, 1]                # 기본 모델의 해지 확률
res = {}                                               # 결과를 담을 빈 사전
for t in [0.5, 0.3, 0.2]:                              # 기준선을 바꿔 가며
    res[t] = recall_score(y_test, prob >= t)           # 확률이 기준 이상이면 '해지'로 판정
pd.Series(res)                                         # 기준선별 재현율 보기`,
    },
    {
      title: "다른 방법 — classification_report로 비교",
      alt: true,
      result: "균형 모델의 답별 정밀도·재현율·F1 표가 나옵니다. 재현율이 오르면 정밀도는 보통 내려갑니다.",
      code: `from sklearn.metrics import classification_report     # 분류 성적표 도구
rep = classification_report(y_test, bal.predict(X_test), output_dict=True)  # 균형 모델 성적표
pd.DataFrame(rep).T                                    # 표로 보기`,
    },
  ],

  calibration: [
    PREP,
    {
      title: "2. 모델 학습",
      result: "시험 데이터 앞 10건의 해지 확률(0~1)이 배열로 나옵니다.",
      code: `from sklearn.naive_bayes import GaussianNB             # 확률을 내 주는 간단한 모델
model = GaussianNB().fit(X_train, y_train)             # 학습 데이터로 배우기
prob = model.predict_proba(X_test)[:, 1]               # 해지 확률 예측(0~1)
prob[:10]                                              # 앞 10건 확률 보기`,
    },
    {
      title: "3. 예측 확률 vs 실제 비율",
      result: "구간별 '예측 확률 평균'과 '실제 해지 비율' 표가 나옵니다. 두 열이 비슷할수록 확률을 믿을 수 있습니다.",
      code: `from sklearn.calibration import calibration_curve     # 보정 곡선(확률이 믿을 만한지 확인)
real, pred = calibration_curve(y_test, prob, n_bins=5)  # 확률을 5구간으로 나눠 비교
pd.DataFrame({"예측 확률": pred, "실제 해지 비율": real})  # 두 값이 비슷할수록 좋음`,
    },
    {
      title: "다른 방법 — 보정 곡선 그림",
      alt: true,
      result: "보정 곡선 그림이 나옵니다. 점선(대각선)에 가까울수록 확률이 정확하고, 아래로 처지면 확률을 부풀린 것입니다.",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
from sklearn.calibration import CalibrationDisplay    # 보정 곡선 그림 도구
CalibrationDisplay.from_estimator(model, X_test, y_test, n_bins=5)  # 모델로 바로 그리기
plt.show()                                             # 그림 표시`,
    },
    {
      title: "다른 방법 — 브라이어 점수 숫자 하나",
      alt: true,
      result: "브라이어 점수 숫자 하나가 나옵니다(0에 가까울수록 확률이 정확, 예: 0.12).",
      code: `from sklearn.metrics import brier_score_loss          # 확률 오차 제곱 평균
brier_score_loss(y_test, prob)                         # 예측 확률과 실제(0/1)의 차이`,
    },
    {
      title: "다른 방법 — 확률 보정하기(CalibratedClassifierCV)",
      alt: true,
      result: "보정 전·후 브라이어 점수 2개가 나옵니다. 보정 후 숫자가 작으면 확률이 더 정확해진 것입니다.",
      code: `from sklearn.calibration import CalibratedClassifierCV  # 확률을 사후 보정하는 도구
cal = CalibratedClassifierCV(GaussianNB(), method="isotonic", cv=5).fit(X_train, y_train)  # 보정 학습
pd.Series({                                            # 보정 전·후 비교
    "보정 전": brier_score_loss(y_test, prob),
    "보정 후": brier_score_loss(y_test, cal.predict_proba(X_test)[:, 1]),
})`,
    },
  ],

  anomaly: [
    PREP_NUM,
    {
      title: "2. 이상치 찾기",
      result: "이상치로 표시된 계약 수가 숫자 하나로 나옵니다(기본 설정에서는 약 150건 — 꽤 넉넉하게 잡습니다).",
      code: `from sklearn.ensemble import IsolationForest           # 아이솔레이션 포레스트(튀는 값 찾기)
model = IsolationForest(random_state=0)                # 기본 설정 사용
df["flag"] = model.fit_predict(X)                      # 정상=1, 이상치=-1
(df["flag"] == -1).sum()                               # 이상치 개수 보기`,
    },
    {
      title: "3. 이상치 계약 보기",
      result: "이상치로 표시된 계약 10건의 숫자 열 4개가 표로 나옵니다.",
      code: `df[df["flag"] == -1][cols].head(10)                   # 이상치로 표시된 계약 10건 보기`,
    },
    {
      title: "다른 방법 — 이상치 비율 직접 정하기",
      alt: true,
      result: "이상치 개수가 나옵니다. contamination=0.02로 정했으니 약 12건(600건의 2%)입니다.",
      code: `iso = IsolationForest(contamination=0.02, random_state=0)  # 전체의 2%만 이상치로
flag2 = iso.fit_predict(X)                             # 정상=1, 이상치=-1
(flag2 == -1).sum()                                    # 이상치 개수 보기`,
    },
    {
      title: "다른 방법 — LocalOutlierFactor(주변 밀도)",
      alt: true,
      result: "LOF가 찾은 이상치 개수와, 두 방법이 함께 이상치로 본 개수가 나란히 나옵니다.",
      code: `from sklearn.neighbors import LocalOutlierFactor       # 이웃보다 외딴 점을 찾는 도구
lof = LocalOutlierFactor(n_neighbors=20, contamination=0.02)  # 이웃 20개, 2%를 이상치로
flag_lof = lof.fit_predict(X)                          # 정상=1, 이상치=-1
pd.Series({                                            # 결과 나란히 보기
    "LOF 이상치": (flag_lof == -1).sum(),
    "두 방법 공통": ((flag_lof == -1) & (flag2 == -1)).sum(),
})`,
    },
    {
      title: "다른 방법 — 이상치 산점도",
      alt: true,
      result: "나이(가로)·보험료(세로) 산점도가 나오고, 이상치는 빨간 점으로 표시됩니다.",
      code: `import matplotlib.pyplot as plt                        # 그래프 도구
out = df["flag"] == -1                                 # 이상치 표시(참/거짓)
plt.scatter(df["age"], df["premium"], c="lightgray", s=8)  # 전체 계약은 회색
plt.scatter(df.loc[out, "age"], df.loc[out, "premium"], c="red", s=15)  # 이상치는 빨강
plt.show()                                             # 그림 표시`,
    },
  ],
};
