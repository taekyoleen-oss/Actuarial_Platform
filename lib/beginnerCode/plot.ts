// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
// 그래프 조각: df(policy 샘플)·policy·claims가 이미 있다고 가정. pandas .plot() 한두 줄 + plt.show().
// 첫 블록 = 기본 방법(셀 삽입 대상), alt 블록 = 같은 그림을 그리는 흔한 다른 방법(팝업에서 골라 복사).
import type { BeginnerBlock } from "../beginnerCode";

export const DATA: Record<string, BeginnerBlock[]> = {
  // ── 기초 그래프 ──
  "basic-hist": [
    {
      title: "방법 1 — df[열].plot(kind=\"hist\")",
      result: "보험료를 20개 구간으로 나눈 히스토그램이 한 장 나옵니다. x축=보험료, y축=구간별 계약 건수.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["premium"].plot(kind="hist", bins=20)   # 보험료 분포를 막대 20개로
plt.xlabel("premium")                  # x축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.hist(값, bins)",
      alt: true,
      result: "방법 1과 같은 보험료 히스토그램이 matplotlib으로 그려집니다. 막대 사이에 흰 테두리가 생겨 구간이 잘 구분됩니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
plt.hist(df["premium"], bins=20, edgecolor="white")   # 값 목록을 20개 구간으로 세어 막대로
plt.xlabel("premium")                  # x축 이름
plt.ylabel("건수")                     # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — df[열].hist()",
      alt: true,
      result: "격자선이 깔린 보험료 히스토그램이 한 장 나옵니다. 가장 짧게 쓰는 방법입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["premium"].hist(bins=20)            # 열 하나를 바로 히스토그램으로(격자 포함)
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — df.hist(column=열, by=그룹)",
      alt: true,
      result: "상품마다 작은 히스토그램이 격자로 여러 장 나옵니다. 칸 제목=상품 이름, 각 칸은 그 상품의 보험료 분포입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.hist(column="premium", by="product", bins=15, figsize=(8, 6))   # 상품별로 나눠 따로 그리기
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 5 — df[[열1, 열2]].hist()",
      alt: true,
      result: "고른 열(나이·보험료)마다 히스토그램이 한 칸씩, 나란히 두 장 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df[["age", "premium"]].hist(bins=20, figsize=(8, 3))   # 열마다 히스토그램 한 칸씩
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-bar": [
    {
      title: "방법 1 — value_counts().plot(kind=\"bar\")",
      result: "상품별 계약 건수 막대그래프가 나옵니다. 건수가 많은 상품부터 왼쪽에 놓입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["product"].value_counts().plot(kind="bar")   # 상품별 건수를 세서 막대로
plt.ylabel("건수")                     # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.bar(이름, 높이)",
      alt: true,
      result: "방법 1과 같은 상품별 건수 막대가 matplotlib으로 그려집니다. x축=상품, y축=건수.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
counts = df["product"].value_counts()  # 상품별 건수 표(이름 → 건수)
plt.bar(counts.index, counts.values)   # x=상품 이름, 높이=건수
plt.ylabel("건수")                     # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 가로 막대 plot.barh()",
      alt: true,
      result: "상품 이름이 세로로 늘어선 가로 막대그래프가 나옵니다. 이름이 길거나 항목이 많을 때 읽기 좋습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["product"].value_counts().sort_values().plot.barh()   # 적은 것→많은 것 순 가로 막대
plt.xlabel("건수")                     # x축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — groupby().size() + 누적 막대",
      alt: true,
      result: "상품별 막대가 채널별 색으로 쌓여서 나옵니다. 막대 전체 높이=상품 건수, 색 조각=채널별 건수.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
t = df.groupby(["product", "channel"]).size().unstack()   # 행=상품, 열=채널인 건수 표
t.plot.bar(stacked=True)               # 채널을 한 막대 위에 쌓기
plt.ylabel("건수")                     # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-pie": [
    {
      title: "방법 1 — value_counts().plot(kind=\"pie\")",
      result: "상품별 계약 비율 원그래프가 나옵니다. 조각마다 비율(%)이 적혀 있습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["product"].value_counts().plot(kind="pie", autopct="%1.0f%%")   # 상품별 비율을 원으로(% 표시)
plt.ylabel("")                         # 옆에 붙는 열 이름 지우기
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.pie(값, labels, autopct)",
      alt: true,
      result: "방법 1과 같은 상품 비율 원그래프가 matplotlib으로 그려집니다. 조각 옆에 상품 이름, 안쪽에 %가 표시됩니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
counts = df["product"].value_counts()  # 상품별 건수
plt.pie(counts, labels=counts.index, autopct="%1.1f%%")   # 이름 붙이고 소수 1자리 %
plt.axis("equal")                      # 찌그러지지 않은 동그라미로
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 합계 기준 비율 groupby().sum()",
      alt: true,
      result: "건수가 아니라 '보험료 합계'에서 상품별 몫이 몇 %인지 보여 주는 원그래프가 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
s = df.groupby("product")["premium"].sum()   # 상품별 보험료 합계
s.plot.pie(autopct="%1.0f%%")          # 합계 비율을 원으로
plt.ylabel("")                         # 열 이름 지우기
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — 도넛 차트 wedgeprops",
      alt: true,
      result: "가운데가 뚫린 도넛 모양 비율 그래프가 나옵니다. 가운데에 '상품'이라는 글자가 들어갑니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
counts = df["product"].value_counts()  # 상품별 건수
plt.pie(counts, labels=counts.index, autopct="%1.0f%%", wedgeprops=dict(width=0.4))   # 조각 폭 40%만 → 도넛
plt.text(0, 0, "상품", ha="center", va="center")   # 가운데 글자
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-line": [
    {
      title: "방법 1 — groupby().mean().plot(kind=\"line\")",
      result: "나이(x)에 따른 평균 보험료(y) 선그래프가 한 줄 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.groupby("age")["premium"].mean().plot(kind="line")   # 나이별 평균 보험료를 선으로
plt.ylabel("평균 보험료")              # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.plot(x, y, marker)",
      alt: true,
      result: "방법 1과 같은 선이 matplotlib으로 그려지고, 나이마다 점(●)이 찍혀 값 위치가 보입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
s = df.groupby("age")["premium"].mean()   # 나이별 평균 보험료
plt.plot(s.index, s.values, marker="o")   # x=나이, y=평균, 점 표시
plt.xlabel("age")                      # x축 이름
plt.ylabel("평균 보험료")              # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — df.plot(x=열, y=열)",
      alt: true,
      result: "표의 두 열을 x·y로 지정한 선그래프가 나옵니다. 가입기간(개월)이 늘수록 평균 보험료가 어떻게 변하는지 보입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
t = df.groupby("tenure_months", as_index=False)["premium"].mean()   # 열 두 개짜리 표로
t.plot(x="tenure_months", y="premium")   # x열·y열 이름을 지정해 선으로
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — 여러 선 (pivot_table → plot)",
      alt: true,
      result: "성별마다 색이 다른 선이 두 줄 나오고 범례가 붙습니다. 나이별 평균 보험료를 성별로 비교합니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
t = df.pivot_table(index="age", columns="sex", values="premium", aggfunc="mean")   # 열마다 한 선
t.plot()                               # 열(성별) 수만큼 선이 그려짐
plt.ylabel("평균 보험료")              # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-box": [
    {
      title: "방법 1 — df.boxplot(column=열, by=그룹)",
      result: "상품마다 보험료 상자 하나씩 나란히 나옵니다. 상자 가운데 선=중앙값, 상자 밖 점=이상치.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.boxplot(column="premium", by="product")   # 상품별 보험료 분포를 상자로
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — df[열].plot(kind=\"box\")",
      alt: true,
      result: "그룹 구분 없이 전체 보험료 상자 하나가 나옵니다. 분포의 중앙·퍼짐·이상치를 빠르게 확인합니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["premium"].plot(kind="box")         # 열 하나를 상자 하나로
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 여러 열 나란히 df[[열1, 열2]].plot.box()",
      alt: true,
      result: "나이·BMI 두 열의 상자가 한 그림에 나란히 나옵니다. 단위가 비슷한 열끼리 비교할 때 씁니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df[["age", "bmi"]].plot.box()          # 열마다 상자 하나씩
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — plt.boxplot([묶음들])",
      alt: true,
      result: "방법 1과 같은 상품별 보험료 상자가 matplotlib으로 그려집니다. x축에 상품 이름이 붙습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
names = sorted(df["product"].unique())  # 상품 이름 목록
groups = [df.loc[df["product"] == n, "premium"] for n in names]   # 상품별 보험료 묶음
plt.boxplot(groups)                    # 묶음마다 상자 하나
plt.xticks(range(1, len(names) + 1), names)   # x축에 상품 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-scatter": [
    {
      title: "방법 1 — df.plot(kind=\"scatter\", x, y)",
      result: "나이(x)와 보험료(y) 산점도가 나옵니다. 점 하나=계약 하나, 반투명이라 겹친 곳이 진하게 보입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.plot(kind="scatter", x="age", y="premium", alpha=0.5)   # 나이(x)와 보험료(y)를 점으로
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.scatter(x, y)",
      alt: true,
      result: "방법 1과 같은 나이-보험료 산점도가 matplotlib으로 그려집니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
plt.scatter(df["age"], df["premium"], alpha=0.5)   # x값 목록, y값 목록으로 점 찍기
plt.xlabel("age")                      # x축 이름
plt.ylabel("premium")                  # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 숫자 열로 색 칠하기 plot.scatter(c=열)",
      alt: true,
      result: "산점도 점이 BMI 값에 따라 색이 달라지고, 오른쪽에 색 막대(값 범위)가 붙습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.plot.scatter(x="age", y="premium", c="bmi", colormap="viridis")   # 점 색 = BMI 크기
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — 점 크기로 세 번째 값 s=",
      alt: true,
      result: "점 크기가 부양가족 수에 따라 커지는 산점도(버블 차트)가 나옵니다. 큰 점=부양가족이 많은 계약.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
plt.scatter(df["age"], df["premium"], s=(df["dependents"] + 1) * 15, alpha=0.4)   # 점 크기=부양가족 수
plt.xlabel("age")                      # x축 이름
plt.ylabel("premium")                  # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "basic-group-bar": [
    {
      title: "방법 1 — groupby().mean().plot(kind=\"bar\")",
      result: "채널별 평균 보험료 막대가 나옵니다. 막대 높이=그 채널 계약의 평균 보험료.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.groupby("channel")["premium"].mean().plot(kind="bar")   # 채널별 평균 보험료를 막대로
plt.ylabel("평균 보험료")              # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.bar(그룹, 평균)",
      alt: true,
      result: "방법 1과 같은 채널별 평균 보험료 막대가 matplotlib으로 그려집니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
s = df.groupby("channel")["premium"].mean()   # 채널 → 평균 보험료
plt.bar(s.index, s.values)             # x=채널, 높이=평균
plt.ylabel("평균 보험료")              # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 정렬한 가로 막대 sort_values().plot.barh()",
      alt: true,
      result: "평균이 작은 채널부터 큰 채널 순으로 정렬된 가로 막대가 나옵니다. 순위를 읽기 쉽습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.groupby("channel")["premium"].mean().sort_values().plot.barh()   # 평균 크기순 가로 막대
plt.xlabel("평균 보험료")              # x축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — 두 기준 묶음 막대 (pivot_table)",
      alt: true,
      result: "채널마다 성별 막대 두 개가 나란히 붙은 묶음 막대그래프와 범례가 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
t = df.pivot_table(index="channel", columns="sex", values="premium", aggfunc="mean")   # 채널×성별 평균 표
t.plot.bar()                           # 열(성별)마다 막대 하나씩 나란히
plt.ylabel("평균 보험료")              # y축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],

  // ── 탐색(EDA) ──
  "hist-kde": [
    {
      title: "방법 1 — plot(kind=\"hist\", density=True) + plot(kind=\"kde\")",
      result: "반투명 히스토그램 위에 부드러운 분포 곡선(KDE)이 겹쳐진 그림이 나옵니다. y축=밀도.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["premium"].plot(kind="hist", bins=30, density=True, alpha=0.5)   # 히스토그램(밀도 기준)
df["premium"].plot(kind="kde")         # 부드러운 분포선(KDE)을 겹쳐 그리기
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.hist + scipy gaussian_kde",
      alt: true,
      result: "방법 1과 같은 히스토그램+KDE 곡선이 나옵니다. KDE를 직접 계산하므로 곡선 값을 다른 곳에도 쓸 수 있습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import numpy as np                     # 계산 도구
from scipy.stats import gaussian_kde   # KDE 계산 도구
x = df["premium"].dropna()             # 빈 값 빼고 보험료만
grid = np.linspace(x.min(), x.max(), 200)   # 곡선을 그릴 x 위치 200개
plt.hist(x, bins=30, density=True, alpha=0.5)   # 밀도 히스토그램
plt.plot(grid, gaussian_kde(x)(grid), color="red")   # 계산한 KDE 곡선
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 곡선만 plot.density()",
      alt: true,
      result: "막대 없이 보험료 분포 곡선(KDE) 하나만 나옵니다. 봉우리가 높은 곳에 계약이 많이 몰려 있습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df["premium"].plot.density()           # KDE 곡선만 그리기(kind="kde"와 같음)
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — 그룹별 KDE 겹쳐 그리기",
      alt: true,
      result: "상품마다 색이 다른 분포 곡선이 한 그림에 겹쳐 나오고 범례가 붙습니다. 상품 간 보험료 분포 차이를 비교합니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.groupby("product")["premium"].plot(kind="kde", legend=True)   # 상품마다 KDE 곡선 하나씩
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "box-violin": [
    {
      title: "방법 1 — plt.violinplot(묶음들)",
      result: "상품별 바이올린 모양이 나란히 나옵니다. 폭이 넓은 곳에 값이 많고, 가운데 가로선=중앙값.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
names = sorted(df["product"].unique())  # 상품 이름 목록(가나다순)
groups = [df.loc[df["product"] == n, "premium"] for n in names]   # 상품별 보험료 묶음
plt.violinplot(groups, showmedians=True)   # 바이올린: 폭이 넓을수록 값이 많음
plt.xticks(range(1, len(names) + 1), names)   # x축에 상품 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — df.boxplot(column=열, by=그룹)",
      alt: true,
      result: "상품별 보험료 박스플롯이 나란히 나옵니다. 상자=가운데 50%, 밖의 점=이상치.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
df.boxplot(column="premium", by="product")   # 상품별 보험료 상자
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — plt.boxplot(가로, vert=False)",
      alt: true,
      result: "상품별 상자가 가로로 누워서 나옵니다. 상품 이름이 y축에 붙어 길어도 잘 읽힙니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
names = sorted(df["product"].unique())  # 상품 이름 목록
groups = [df.loc[df["product"] == n, "premium"] for n in names]   # 상품별 보험료 묶음
plt.boxplot(groups, vert=False)        # 가로 상자
plt.yticks(range(1, len(names) + 1), names)   # y축에 상품 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-reg": [
    {
      title: "방법 1 — np.polyfit(x, y, 1) + plt.plot",
      result: "나이-보험료 점 위에 빨간 회귀 직선이 그어진 그림이 나옵니다. 선의 기울기=나이 1살당 보험료 변화.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import numpy as np                     # 계산 도구
b, a = np.polyfit(df["age"], df["premium"], 1)   # 직선 y = b·x + a 맞추기
plt.scatter(df["age"], df["premium"], alpha=0.4)   # 점 찍기
plt.plot(df["age"], b * df["age"] + a, color="red")   # 맞춘 직선 그리기
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — scipy linregress (기울기·R² 함께)",
      alt: true,
      result: "산점도+회귀선이 나오고, 범례에 기울기와 R²(설명력)가 표시됩니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from scipy.stats import linregress     # 단순회귀 계산 도구
r = linregress(df["age"], df["premium"])   # 기울기·절편·상관계수 계산
plt.scatter(df["age"], df["premium"], alpha=0.4)   # 점 찍기
plt.plot(df["age"], r.slope * df["age"] + r.intercept, color="red",   # 회귀선
         label=f"기울기 {r.slope:.1f}, R² {r.rvalue**2:.2f}")   # 범례 글자
plt.legend()                           # 범례 보이기
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 곡선(2차) 추세선 np.polyfit(x, y, 2)",
      alt: true,
      result: "점 위에 휘어진 2차 곡선 추세선이 그려집니다. 관계가 직선이 아닐 때 모양을 확인합니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import numpy as np                     # 계산 도구
coef = np.polyfit(df["age"], df["premium"], 2)   # 2차식 y = c2·x² + c1·x + c0 맞추기
xs = np.sort(df["age"].unique())       # 곡선을 그릴 x(정렬)
plt.scatter(df["age"], df["premium"], alpha=0.4)   # 점 찍기
plt.plot(xs, np.polyval(coef, xs), color="red")   # 맞춘 곡선 그리기
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "corr-heatmap": [
    {
      title: "방법 1 — plt.imshow(상관표) + colorbar",
      result: "숫자 열끼리의 상관계수가 색 칸으로 된 표(히트맵)로 나옵니다. 빨강=양의 상관, 파랑=음의 상관.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
corr = df.select_dtypes("number").corr()   # 숫자 열끼리 상관계수 표
plt.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)   # 색으로 표시(빨강=양, 파랑=음)
plt.xticks(range(len(corr)), corr.columns, rotation=90)   # x축 열 이름
plt.yticks(range(len(corr)), corr.columns)   # y축 열 이름
plt.colorbar()                         # 색 막대(값 범위 안내)
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.matshow(상관표)",
      alt: true,
      result: "방법 1과 같은 상관 히트맵이 새 그림으로 나옵니다. 열 이름이 위쪽 x축에 붙습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
corr = df.select_dtypes("number").corr()   # 숫자 열끼리 상관계수 표
plt.matshow(corr, cmap="coolwarm", vmin=-1, vmax=1)   # 행렬을 바로 색 칸으로
plt.xticks(range(len(corr)), corr.columns, rotation=90)   # x축 열 이름
plt.yticks(range(len(corr)), corr.columns)   # y축 열 이름
plt.colorbar()                         # 색 막대
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 칸마다 숫자 적기 (plt.text)",
      alt: true,
      result: "히트맵 칸마다 상관계수 숫자(소수 2자리)가 적혀 나옵니다. 색과 정확한 값을 함께 봅니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
corr = df[["age", "premium", "bmi", "tenure_months"]].corr()   # 보고 싶은 열만 상관표
plt.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)   # 색 칸
for i in range(len(corr)):             # 행마다
    for j in range(len(corr)):         # 열마다
        plt.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center")   # 칸 가운데 숫자
plt.xticks(range(len(corr)), corr.columns, rotation=45)   # x축 열 이름
plt.yticks(range(len(corr)), corr.columns)   # y축 열 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-matrix": [
    {
      title: "방법 1 — pd.plotting.scatter_matrix",
      result: "3×3 격자 그림이 나옵니다. 바깥 칸=두 변수의 산점도, 대각선 칸=각 변수의 히스토그램.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import pandas as pd                    # 표 도구
pd.plotting.scatter_matrix(df[["age", "premium", "bmi"]], figsize=(7, 7))   # 변수 쌍마다 산점도
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — 대각선을 KDE로 diagonal=\"kde\"",
      alt: true,
      result: "같은 3×3 격자인데 대각선 칸이 히스토그램 대신 부드러운 분포 곡선으로 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import pandas as pd                    # 표 도구
pd.plotting.scatter_matrix(df[["age", "premium", "bmi"]], diagonal="kde", alpha=0.4, figsize=(7, 7))   # 대각=KDE
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 그룹으로 점 색 구분 c=",
      alt: true,
      result: "3×3 산점도 행렬의 점이 해지(빨강)·유지(파랑)로 색이 나뉘어 나옵니다. 해지 고객이 몰린 영역을 찾습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import pandas as pd                    # 표 도구
colors = df["lapsed"].map({True: "red", False: "blue"})   # 해지=빨강, 유지=파랑
pd.plotting.scatter_matrix(df[["age", "premium", "bmi"]], c=colors, alpha=0.4, figsize=(7, 7))   # 색 지정
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "select-columns": [
    {
      title: "방법 1 — 열 이름 목록 df[[열1, 열2]]",
      result: "고른 두 열(나이·보험료)마다 히스토그램이 한 칸씩 나옵니다. 고른 열이 맞는지 모양으로 확인합니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
sub = df[["age", "premium"]]           # 쓸 열만 골라 새 표로
sub.hist(bins=20)                      # 고른 열마다 히스토그램으로 빠르게 확인
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — 위치 번호로 df.iloc[:, [6, 7]]",
      alt: true,
      result: "7·8번째 열(나이·보험료)의 상자가 칸을 나눠 한 장씩 나옵니다. 열 이름 대신 위치(0부터)로 고르는 방법입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
sub = df.iloc[:, [6, 7]]               # 모든 행, 6·7번 위치 열(0부터 셈)
sub.plot(kind="box", subplots=True, figsize=(6, 3))   # 열마다 상자 한 칸씩
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 숫자 열만 select_dtypes(\"number\")",
      alt: true,
      result: "숫자로 된 열 전부에 대해 히스토그램이 격자로 여러 장 나옵니다. 데이터 전체를 한눈에 훑을 때 씁니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
num = df.select_dtypes("number")       # 숫자 자료형 열만 자동으로 고르기
num.hist(bins=20, figsize=(10, 8))     # 열마다 히스토그램 한 칸씩
plt.tight_layout()                     # 칸끼리 글자가 겹치지 않게
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 4 — 이름 규칙으로 df.filter(like=글자)",
      alt: true,
      result: "이름에 'premium'이 들어간 열(보험료·보험료 비율)만 골라 상자그림이 칸별로 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
sub = df.filter(like="premium")        # 열 이름에 premium이 들어간 열만
sub.plot(kind="box", subplots=True, figsize=(6, 3))   # 열마다 상자 한 칸씩
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-groups": [
    {
      title: "방법 1 — groupby 반복 + plt.scatter(label=)",
      result: "상품마다 색이 다른 나이-보험료 산점도와 범례(색↔상품)가 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
for name, g in df.groupby("product"):  # 상품(구분)마다 따로
    plt.scatter(g["age"], g["premium"], label=name, alpha=0.6)   # 다른 색으로 점 찍기
plt.legend()                           # 어떤 색이 어떤 상품인지 범례
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — 범주를 숫자로 c=cat.codes, cmap",
      alt: true,
      result: "반복문 없이 한 줄로 상품별 색 구분 산점도가 나옵니다. 범례 대신 색 막대(0,1,2…=상품 번호)가 붙습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
codes = df["product"].astype("category").cat.codes   # 상품을 0,1,2… 번호로
plt.scatter(df["age"], df["premium"], c=codes, cmap="tab10", alpha=0.6)   # 번호마다 다른 색
plt.colorbar(label="상품 번호")        # 색 ↔ 번호 안내
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 색 사전 map + df.plot.scatter",
      alt: true,
      result: "해지 계약은 빨강, 유지 계약은 회색으로 칠한 산점도가 나옵니다. 색을 내가 직접 정하는 방법입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
colors = df["lapsed"].map({True: "red", False: "gray"})   # 값 → 색 이름 사전
df.plot.scatter(x="age", y="premium", c=colors, alpha=0.6)   # 점마다 정한 색으로
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-3d": [
    {
      title: "방법 1 — add_subplot(projection=\"3d\") + ax.scatter",
      result: "마우스로 돌려 볼 수 있는 3차원 산점도가 나옵니다(실행기에서는 한 각도 그림). x=나이, y=보험료, z=BMI.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
ax = plt.figure().add_subplot(projection="3d")   # 3차원 축 만들기
ax.scatter(df["age"], df["premium"], df["bmi"])   # x=나이, y=보험료, z=BMI 점 찍기
ax.set_xlabel("age"); ax.set_ylabel("premium"); ax.set_zlabel("bmi")   # 축 이름
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — 그룹마다 색 (groupby 반복)",
      alt: true,
      result: "3차원 산점도의 점이 상품별 색으로 나뉘고 범례가 붙습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
ax = plt.figure().add_subplot(projection="3d")   # 3차원 축
for name, g in df.groupby("product"):  # 상품마다
    ax.scatter(g["age"], g["premium"], g["bmi"], label=name)   # 다른 색으로 점 찍기
ax.legend()                            # 범례
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 네 번째 값을 색으로 c= + 시점 view_init",
      alt: true,
      result: "3차원 점이 가입기간에 따라 색이 변하고, 보는 각도를 위쪽 30°·옆 45°로 돌린 그림이 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
ax = plt.figure().add_subplot(projection="3d")   # 3차원 축
p = ax.scatter(df["age"], df["premium"], df["bmi"], c=df["tenure_months"], cmap="viridis")   # 색=가입기간
ax.view_init(elev=30, azim=45)         # 보는 각도(높이 30°, 회전 45°)
plt.colorbar(p, label="tenure_months") # 색 막대
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "scatter-shape-color": [
    {
      title: "방법 1 — 모양 목록 + enumerate 반복",
      result: "상품마다 점 모양(●■▲◆▼)과 색이 모두 다른 산점도와 범례가 나옵니다. 흑백 인쇄에서도 구분됩니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
shapes = ["o", "s", "^", "D", "v"]     # 그룹마다 쓸 점 모양(원·네모·세모…)
for i, (name, g) in enumerate(df.groupby("product")):   # 상품(그룹)마다
    plt.scatter(g["age"], g["premium"], marker=shapes[i % 5], label=name)   # 모양+색 다르게
plt.legend()                           # 범례
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — 값별 모양·색 사전으로 직접 지정",
      alt: true,
      result: "해지 계약은 빨간 ×, 유지 계약은 파란 ○로 찍힌 산점도와 범례가 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
style = {True: ("x", "red", "해지"), False: ("o", "blue", "유지")}   # 값 → (모양, 색, 이름)
for key, g in df.groupby("lapsed"):    # 해지 여부마다
    m, c, name = style[key]            # 정해 둔 모양·색·이름 꺼내기
    plt.scatter(g["age"], g["premium"], marker=m, color=c, label=name, alpha=0.6)   # 점 찍기
plt.legend()                           # 범례
plt.show()                             # 그래프 보여 주기`,
    },
  ],

  // ── 모델 진단 ──
  "residual-plot": [
    {
      title: "방법 1 — 예측값 vs 잔차 산점도",
      result: "x=예측 보험료, y=잔차(실제−예측) 점그림과 빨간 0 기준선이 나옵니다. 점이 0선 위아래로 고르게 퍼지면 좋은 모델입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.linear_model import LinearRegression   # 선형회귀 모델
X, y = df[["age", "bmi"]], df["premium"]   # 입력 변수, 맞힐 값(보험료)
pred = LinearRegression().fit(X, y).predict(X)   # 모델 학습 후 예측
plt.scatter(pred, y - pred, alpha=0.4)   # x=예측값, y=잔차(실제-예측)
plt.axhline(0, color="red")            # 0 기준선(고르게 흩어지면 좋음)
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — 잔차 히스토그램",
      alt: true,
      result: "잔차의 히스토그램이 나옵니다. 0을 중심으로 좌우 대칭인 종 모양이면 오차가 치우치지 않은 것입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.linear_model import LinearRegression   # 선형회귀 모델
X, y = df[["age", "bmi"]], df["premium"]   # 입력 변수, 맞힐 값
resid = y - LinearRegression().fit(X, y).predict(X)   # 잔차 = 실제 - 예측
plt.hist(resid, bins=30)               # 잔차 분포
plt.axvline(0, color="red")            # 0 위치 표시
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — 실제 vs 예측 산점도 + 45° 선",
      alt: true,
      result: "x=실제 보험료, y=예측 보험료 점그림과 빨간 대각선이 나옵니다. 점이 대각선에 붙을수록 예측이 정확합니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.linear_model import LinearRegression   # 선형회귀 모델
X, y = df[["age", "bmi"]], df["premium"]   # 입력 변수, 맞힐 값
pred = LinearRegression().fit(X, y).predict(X)   # 예측값
plt.scatter(y, pred, alpha=0.4)        # x=실제, y=예측
plt.plot([y.min(), y.max()], [y.min(), y.max()], color="red")   # 완벽 예측선(y=x)
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "learning-curve": [
    {
      title: "방법 1 — LearningCurveDisplay.from_estimator",
      result: "학습 표본 수(x)에 따른 학습 점수·검증 점수 두 곡선(띠=변동폭)이 나옵니다. 두 선이 가까워지면 표본이 충분한 것입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import LearningCurveDisplay   # 학습곡선 그리기 도구
from sklearn.tree import DecisionTreeClassifier   # 간단한 나무 모델
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
LearningCurveDisplay.from_estimator(DecisionTreeClassifier(max_depth=3), X, y, cv=5)   # 표본 수별 점수
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — learning_curve 계산 + plt.plot",
      alt: true,
      result: "방법 1과 같은 두 곡선(학습·검증 평균 정확도)이 점 표시와 범례로 나옵니다. 점수 숫자를 직접 꺼내 쓸 수 있습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import learning_curve   # 학습곡선 계산
from sklearn.tree import DecisionTreeClassifier   # 간단한 나무 모델
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값
n, tr, va = learning_curve(DecisionTreeClassifier(max_depth=3), X, y, cv=5)   # 표본 수·학습·검증 점수
plt.plot(n, tr.mean(axis=1), "o-", label="학습")   # 학습 점수 평균
plt.plot(n, va.mean(axis=1), "o-", label="검증")   # 검증 점수 평균
plt.legend()                           # 범례
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "validation-curve": [
    {
      title: "방법 1 — ValidationCurveDisplay.from_estimator",
      result: "나무 깊이(x)를 1~8로 바꿀 때 학습·검증 점수 두 곡선이 나옵니다. 검증 점수가 가장 높은 깊이가 적당한 값입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import ValidationCurveDisplay   # 검증곡선 그리기 도구
from sklearn.tree import DecisionTreeClassifier   # 간단한 나무 모델
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
ValidationCurveDisplay.from_estimator(DecisionTreeClassifier(), X, y,   # 나무 모델로
    param_name="max_depth", param_range=[1, 2, 3, 5, 8], cv=5)   # 깊이를 바꿔 가며 점수 비교
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — validation_curve 계산 + plt.plot",
      alt: true,
      result: "방법 1과 같은 깊이별 학습·검증 평균 점수 두 선이 점 표시와 범례로 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import validation_curve   # 검증곡선 계산
from sklearn.tree import DecisionTreeClassifier   # 간단한 나무 모델
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값
depths = [1, 2, 3, 5, 8]               # 비교할 깊이 값
tr, va = validation_curve(DecisionTreeClassifier(), X, y, param_name="max_depth", param_range=depths, cv=5)   # 점수
plt.plot(depths, tr.mean(axis=1), "o-", label="학습")   # 학습 점수 평균
plt.plot(depths, va.mean(axis=1), "o-", label="검증")   # 검증 점수 평균
plt.legend()                           # 범례
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "roc-curve": [
    {
      title: "방법 1 — RocCurveDisplay.from_estimator",
      result: "ROC 곡선 한 줄과 범례에 AUC 값이 나옵니다. 곡선이 왼쪽 위로 붙을수록(AUC가 1에 가까울수록) 해지를 잘 가려냅니다.",
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
    {
      title: "방법 2 — roc_curve 계산 + plt.plot",
      alt: true,
      result: "방법 1과 같은 ROC 곡선과 무작위 기준 점선(대각선)이 나오고, 범례에 AUC가 적힙니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.linear_model import LogisticRegression   # 로지스틱 회귀 모델
from sklearn.metrics import roc_curve, roc_auc_score   # ROC 좌표·AUC 계산
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
p = LogisticRegression(max_iter=1000).fit(X_tr, y_tr).predict_proba(X_te)[:, 1]   # 해지 확률
fpr, tpr, _ = roc_curve(y_te, p)       # 기준값별 (오탐률, 적중률)
plt.plot(fpr, tpr, label=f"AUC {roc_auc_score(y_te, p):.3f}")   # ROC 곡선
plt.plot([0, 1], [0, 1], "--")         # 무작위 기준선
plt.legend()                           # 범례
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "pr-curve": [
    {
      title: "방법 1 — PrecisionRecallDisplay.from_estimator",
      result: "x=재현율, y=정밀도 곡선과 범례에 AP(평균 정밀도)가 나옵니다. 해지처럼 드문 사건을 볼 때 ROC보다 민감합니다.",
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
    {
      title: "방법 2 — precision_recall_curve 계산 + plt.plot",
      alt: true,
      result: "방법 1과 같은 정밀도-재현율 곡선이 축 이름과 함께 나옵니다. 좌표 값을 직접 꺼내 쓸 수 있습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.linear_model import LogisticRegression   # 로지스틱 회귀 모델
from sklearn.metrics import precision_recall_curve   # PR 좌표 계산
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
p = LogisticRegression(max_iter=1000).fit(X_tr, y_tr).predict_proba(X_te)[:, 1]   # 해지 확률
prec, rec, _ = precision_recall_curve(y_te, p)   # 기준값별 (정밀도, 재현율)
plt.plot(rec, prec)                    # x=재현율, y=정밀도
plt.xlabel("재현율"); plt.ylabel("정밀도")   # 축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "calibration-curve": [
    {
      title: "방법 1 — CalibrationDisplay.from_estimator",
      result: "x=예측 확률, y=실제 해지 비율 곡선과 완벽 보정 점선이 나옵니다. 점선에 가까울수록 확률을 믿을 수 있습니다.",
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
    {
      title: "방법 2 — calibration_curve 계산 + plt.plot",
      alt: true,
      result: "방법 1과 같은 보정 곡선(점 표시)과 대각선이 나오고, 제목에 Brier 점수(작을수록 좋음)가 적힙니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.linear_model import LogisticRegression   # 로지스틱 회귀 모델
from sklearn.calibration import calibration_curve   # 구간별 실제 비율 계산
from sklearn.metrics import brier_score_loss   # 확률 오차 점수
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"].astype(int)   # 입력 변수, 해지(1/0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
p = LogisticRegression(max_iter=1000).fit(X_tr, y_tr).predict_proba(X_te)[:, 1]   # 해지 확률
frac, mean_p = calibration_curve(y_te, p, n_bins=5)   # 구간별 (실제 비율, 평균 예측)
plt.plot(mean_p, frac, "o-"); plt.plot([0, 1], [0, 1], "--")   # 보정 곡선과 기준 대각선
plt.title(f"Brier {brier_score_loss(y_te, p):.3f}")   # 제목에 점수
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "lift-gain": [
    {
      title: "방법 1 — 누적 게인 곡선 (cumsum)",
      result: "확률 높은 고객부터 골랐을 때 잡아낸 해지 비율의 누적 곡선과 무작위 기준 점선이 나옵니다. 곡선이 점선 위로 높을수록 좋습니다.",
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
    {
      title: "방법 2 — 10분위 리프트 막대 (pd.qcut)",
      alt: true,
      result: "예측 확률로 나눈 10개 등급별 리프트 막대가 나옵니다. 막대 1보다 크면 그 등급의 해지율이 평균보다 높다는 뜻입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import pandas as pd                    # 표 도구
from sklearn.linear_model import LogisticRegression   # 로지스틱 회귀 모델
X, y = df[["age", "premium", "tenure_months"]], df["lapsed"].astype(int)   # 입력 변수, 해지(1/0)
p = LogisticRegression(max_iter=1000).fit(X, y).predict_proba(X)[:, 1]   # 해지 확률
grade = pd.qcut(p, 10, labels=False, duplicates="drop")   # 확률 순 10등분(0=낮음)
lift = y.groupby(grade).mean() / y.mean()   # 등급별 해지율 ÷ 전체 해지율
lift.plot.bar(); plt.axhline(1, color="red")   # 리프트 막대와 기준선 1
plt.show()                             # 그래프 보여 주기`,
    },
  ],

  // ── 해석 ──
  "feature-importance": [
    {
      title: "방법 1 — pd.Series(feature_importances_).plot(kind=\"barh\")",
      result: "변수별 중요도 가로 막대가 작은 것→큰 것 순으로 나옵니다. 긴 막대일수록 해지 예측에 많이 쓰인 변수입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
import pandas as pd                    # 표 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
X, y = df[["age", "premium", "bmi", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값(해지)
model = RandomForestClassifier(random_state=0).fit(X, y)   # 모델 학습
pd.Series(model.feature_importances_, index=X.columns).sort_values().plot(kind="barh")   # 중요도 막대
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — plt.barh(열 이름, 중요도)",
      alt: true,
      result: "방법 1과 같은 중요도 가로 막대가 matplotlib으로 그려집니다(정렬 없이 열 순서대로).",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
X, y = df[["age", "premium", "bmi", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값
model = RandomForestClassifier(random_state=0).fit(X, y)   # 모델 학습
plt.barh(X.columns, model.feature_importances_)   # y=변수 이름, 길이=중요도
plt.xlabel("중요도")                   # x축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  "permutation-importance": [
    {
      title: "방법 1 — 평균 하락폭 막대 (importances_mean)",
      result: "변수를 섞었을 때 검증 점수가 떨어진 폭(평균)이 가로 막대로 나옵니다. 많이 떨어질수록 중요한 변수입니다.",
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
    {
      title: "방법 2 — 반복 결과 상자그림 (importances)",
      alt: true,
      result: "변수마다 섞기 10번의 하락폭이 가로 상자로 나옵니다. 상자가 0에 걸쳐 있으면 중요하다고 보기 어렵습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.model_selection import train_test_split   # 데이터 나누기
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import permutation_importance   # 순열 중요도 계산
X, y = df[["age", "premium", "bmi", "tenure_months"]], df["lapsed"]   # 입력 변수, 맞힐 값
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)   # 학습용·검증용 나누기
model = RandomForestClassifier(random_state=0).fit(X_tr, y_tr)   # 모델 학습
r = permutation_importance(model, X_te, y_te, n_repeats=10, random_state=0)   # 10번 반복
plt.boxplot(r.importances.T, vert=False)   # 변수마다 10개 값을 상자로
plt.yticks(range(1, len(X.columns) + 1), X.columns)   # y축에 변수 이름
plt.axvline(0, color="red", ls="--")   # 0 기준선
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  pdp: [
    {
      title: "방법 1 — PartialDependenceDisplay.from_estimator",
      result: "x=나이, y=평균 예측 해지 확률 곡선이 한 장 나옵니다. 나이만 바꿨을 때 모델 예측이 평균적으로 어떻게 움직이는지 봅니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import PartialDependenceDisplay   # PDP 그리기 도구
X = df[["age", "premium", "tenure_months"]].astype(float)   # 입력 변수(실수형으로)
model = RandomForestClassifier(random_state=0).fit(X, df["lapsed"])   # 해지 예측 모델 학습
PartialDependenceDisplay.from_estimator(model, X, ["age"])   # 나이가 바뀌면 예측이 평균적으로 어떻게?
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — 여러 변수 나란히 [\"age\", \"tenure_months\"]",
      alt: true,
      result: "나이·가입기간 두 변수의 PDP 곡선이 옆으로 나란히 두 칸 나옵니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import PartialDependenceDisplay   # PDP 그리기 도구
X = df[["age", "premium", "tenure_months"]].astype(float)   # 입력 변수(실수형)
model = RandomForestClassifier(random_state=0).fit(X, df["lapsed"])   # 모델 학습
PartialDependenceDisplay.from_estimator(model, X, ["age", "tenure_months"])   # 변수마다 한 칸
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 3 — partial_dependence 계산 + plt.plot",
      alt: true,
      result: "방법 1과 같은 나이 PDP 곡선이 matplotlib 선으로 나옵니다. 곡선 값(격자·평균 예측)을 직접 꺼내 쓸 수 있습니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import partial_dependence   # PDP 값 계산
X = df[["age", "premium", "tenure_months"]].astype(float)   # 입력 변수(실수형)
model = RandomForestClassifier(random_state=0).fit(X, df["lapsed"])   # 모델 학습
pd_res = partial_dependence(model, X, ["age"])   # 나이 격자별 평균 예측
plt.plot(pd_res["grid_values"][0], pd_res["average"][0])   # x=나이, y=평균 예측 확률
plt.xlabel("age"); plt.ylabel("해지 확률(평균)")   # 축 이름
plt.show()                             # 그래프 보여 주기`,
    },
  ],
  ice: [
    {
      title: "방법 1 — kind=\"both\" (개별선 + 평균선)",
      result: "고객 50명 각각의 가는 선(ICE)과 그 평균인 굵은 선(PDP)이 함께 나옵니다. 선 모양이 제각각이면 나이 효과가 사람마다 다르다는 뜻입니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import PartialDependenceDisplay   # PDP·ICE 그리기 도구
X = df[["age", "premium", "tenure_months"]].astype(float)   # 입력 변수(실수형으로)
model = RandomForestClassifier(random_state=0).fit(X, df["lapsed"])   # 해지 예측 모델 학습
PartialDependenceDisplay.from_estimator(model, X, ["age"], kind="both", subsample=50)   # 개별선+평균선
plt.show()                             # 그래프 보여 주기`,
    },
    {
      title: "방법 2 — 출발점 맞추기 centered=True",
      alt: true,
      result: "모든 개별선을 왼쪽 끝에서 0으로 맞춘 ICE 그림이 나옵니다. 절대 수준 대신 '나이가 늘 때 얼마나 변하나'만 비교합니다.",
      code: `import matplotlib.pyplot as plt   # 그래프 도구
from sklearn.ensemble import RandomForestClassifier   # 랜덤포레스트 모델
from sklearn.inspection import PartialDependenceDisplay   # PDP·ICE 그리기 도구
X = df[["age", "premium", "tenure_months"]].astype(float)   # 입력 변수(실수형)
model = RandomForestClassifier(random_state=0).fit(X, df["lapsed"])   # 모델 학습
PartialDependenceDisplay.from_estimator(model, X, ["age"], kind="individual", centered=True, subsample=50, random_state=0)   # 중심 맞춘 개별선
plt.show()                             # 그래프 보여 주기`,
    },
  ],
};
