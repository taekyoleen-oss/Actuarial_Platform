// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
import type { BeginnerBlock } from "../beginnerCode";

export const DATA: Record<string, BeginnerBlock[]> = {
  // ── 보험·계리 ──
  "exposure-rates": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("experience.xlsx")  # 경험 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 상품별 발생률 계산하기",
      code: `# 상품별로 사건 수와 노출(가입 기간 합계)을 더함
g = df.groupby("product").agg(사건수=("event", "sum"), 노출연수=("duration_years", "sum"))
# 발생률 = 사건 수 ÷ 노출 연수 (1년당 발생 비율)
g["발생률"] = g["사건수"] / g["노출연수"]
g  # 결과 표`,
    },
  ],
  graduation: [
    {
      title: "1. 생명표 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
import matplotlib.pyplot as plt  # 그래프 도구
df = pd.read_excel("mortality_table.xlsx")  # 나이별 사망률 표 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 이동평균으로 매끄럽게 하기",
      code: `# 앞뒤 5개 나이의 평균으로 울퉁불퉁한 사망률을 부드럽게
df["qx_보정"] = df["qx_male"].rolling(5, center=True, min_periods=1).mean()
# 원래 값과 보정 값을 같이 그림 (세로축은 로그)
df.plot(x="age", y=["qx_male", "qx_보정"], logy=True)
plt.show()  # 그래프 보기
df[["age", "qx_male", "qx_보정"]].head(10)  # 결과 표`,
    },
  ],
  "kaplan-meier": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
import numpy as np  # 계산 도구
df = pd.read_excel("experience.xlsx")  # 경험 데이터 읽기
df["연차"] = np.ceil(df["duration_years"])  # 경과 기간을 정수 연차로 올림
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 연차별 생존율 계산하기",
      code: `rows = []  # 결과를 모을 목록
s = 1.0  # 처음 생존율은 100%
for t in range(1, int(df["연차"].max()) + 1):  # 1년차부터 차례로
    n = (df["연차"] >= t).sum()  # t년차에 아직 관찰 중인 사람 수
    d = ((df["연차"] == t) & (df["event"] == 1)).sum()  # t년차 사건 수
    s = s * (1 - d / n)  # 생존율 = 이전 생존율 × (1 - 사건 비율)
    rows.append({"연차": t, "관찰수": n, "사건수": d, "생존율": s})
pd.DataFrame(rows)  # 결과 표`,
    },
  ],
  credibility: [
    {
      title: "1. 신뢰도 계산하기",
      code: `import numpy as np  # 계산 도구
n = 400  # 우리 회사 경험 사건 수
경험률 = 0.012  # 우리 회사 경험 발생률
업계률 = 0.010  # 업계(기준) 발생률
Z = min(1, np.sqrt(n / 1082))  # 신뢰도 Z (1,082건이면 100% 신뢰)
Z  # 신뢰도`,
    },
    {
      title: "2. 섞어서 최종 요율 만들기",
      code: `# 최종 요율 = Z × 경험률 + (1 - Z) × 업계률
최종률 = Z * 경험률 + (1 - Z) * 업계률
최종률  # 결과`,
    },
  ],
  "chain-ladder": [
    {
      title: "1. 손해 삼각형 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("triangle.xlsx")  # 누적 손해 삼각형 읽기
tri = df.set_index("accident_year")  # 사고연도를 행 이름으로
tri  # 삼각형 확인 (오른쪽 아래는 빈칸)`,
    },
    {
      title: "2. 진전계수로 빈칸 채우기",
      code: `full = tri.copy()  # 채워 넣을 복사본
cols = list(tri.columns)  # dev_1 ~ dev_8
for a, b in zip(cols[:-1], cols[1:]):  # 이웃한 두 열씩
    ok = tri[b].notna()  # 두 열 모두 값이 있는 행
    f = tri.loc[ok, b].sum() / tri.loc[ok, a].sum()  # 진전계수
    full[b] = full[b].fillna(full[a] * f)  # 빈칸 = 앞 열 × 계수
full.round(0)  # 채워진 삼각형`,
    },
    {
      title: "3. 준비금 보기",
      code: `현재 = tri.ffill(axis=1).iloc[:, -1]  # 사고연도별 지금까지 누적 손해
최종 = full.iloc[:, -1]  # 예상 최종 손해
# 준비금 = 최종 - 현재 (앞으로 더 나갈 돈)
pd.DataFrame({"현재": 현재, "최종": 최종, "준비금": 최종 - 현재}).round(0)`,
    },
  ],
  "pure-premium": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("claims.xlsx")  # 청구 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 빈도 × 심도 = 순보험료",
      code: `# 상품별 계약 수, 청구 건수, 청구 금액 합계
g = df.groupby("product").agg(계약수=("policy_id", "count"), 건수=("claim_cnt", "sum"), 금액=("claim_amt", "sum"))
g["빈도"] = g["건수"] / g["계약수"]  # 계약 1건당 청구 건수
g["심도"] = g["금액"] / g["건수"]  # 청구 1건당 금액
g["순보험료"] = g["빈도"] * g["심도"]  # 계약 1건당 예상 지급액
g.round(2)  # 결과 표`,
    },
  ],
  "life-premium": [
    {
      title: "1. 생명표 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
import numpy as np  # 계산 도구
df = pd.read_excel("mortality_table.xlsx")  # 나이별 사망률 표 읽기
q = df.set_index("age").loc[40:49, "qx_male"].values  # 40~49세 남자 사망률 10개
q  # 확인`,
    },
    {
      title: "2. 10년 정기보험 순보험료",
      code: `v = 1 / 1.03  # 할인율 (이율 3%)
p = np.cumprod(np.r_[1, 1 - q[:-1]])  # 각 해 시작 때까지 살아 있을 확률
t = np.arange(10)  # 0 ~ 9년
A = (v ** (t + 1) * p * q).sum()  # 사망보험금 1원의 현재가치
a = (v ** t * p).sum()  # 매년 초 1원씩 내는 보험료의 현재가치
P = 100_000_000 * A / a  # 보험금 1억 원일 때 연납 순보험료
round(P)  # 결과 (원)`,
    },
  ],
  reinsurance: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
import numpy as np  # 계산 도구
df = pd.read_excel("claims.xlsx")  # 청구 데이터 읽기
df["claim_amt"].describe()  # 청구 금액 요약`,
    },
    {
      title: "2. 초과손해(XL) 재보험 회수액",
      code: `공제 = 500_000  # 이 금액까지는 우리 회사 부담
한도 = 1_000_000  # 재보험사가 최대로 내 주는 금액
# 회수액 = (청구액 - 공제)를 0 ~ 한도 사이로 자름
df["회수액"] = np.clip(df["claim_amt"] - 공제, 0, 한도)
df["보유액"] = df["claim_amt"] - df["회수액"]  # 우리 회사가 남기는 부담
df[["claim_amt", "회수액", "보유액"]].sum()  # 합계 비교`,
    },
  ],

  // ── 데이터 핸들링 ──
  "data-loading": [
    {
      title: "1. 엑셀 파일 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 엑셀 파일 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 크기와 열 확인하기",
      code: `print(df.shape)  # (행 수, 열 수)
df.dtypes  # 열 이름과 자료형`,
    },
  ],
  "select-rows-cols": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 원하는 열·행 고르기",
      code: `sub = df[["policy_id", "age", "premium"]]  # 열 3개만 고르기
sub.loc[0:4]  # 그중 0~4번 행`,
    },
  ],
  "filter-condition": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 조건으로 거르기",
      code: `# 나이 40세 이상이면서 보험료 50,000원 이상인 행만
old = df[(df["age"] >= 40) & (df["premium"] >= 50000)]
old.head()  # 결과 앞 5행`,
    },
  ],
  isin: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df["region"].unique()  # 어떤 지역이 있는지 확인`,
    },
    {
      title: "2. 목록에 든 값만 고르기",
      code: `목록 = list(df["region"].unique()[:2])  # 고를 지역 2개 (직접 적어도 됨)
sel = df[df["region"].isin(목록)]  # region이 목록에 있는 행만
sel["region"].value_counts()  # 고른 결과 개수`,
    },
  ],
  conditional: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
import numpy as np  # 계산 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 조건에 따라 새 열 만들기",
      code: `# 보험료가 평균보다 크면 "고액", 아니면 "일반"
df["구분"] = np.where(df["premium"] > df["premium"].mean(), "고액", "일반")
df["구분"].value_counts()  # 구분별 개수`,
    },
  ],
  "join-merge": [
    {
      title: "1. 두 표 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
policy = pd.read_excel("policy.xlsx")  # 계약 표
claims = pd.read_excel("claims.xlsx")  # 청구 표
claims.head()  # 청구 표 확인`,
    },
    {
      title: "2. policy_id로 합치기",
      code: `# 같은 policy_id끼리 옆으로 붙임 (계약 표 기준, 청구 없으면 빈칸)
m = pd.merge(policy[["policy_id", "age", "premium"]], claims[["policy_id", "claim_amt"]], on="policy_id", how="left")
m.head()  # 합친 결과`,
    },
  ],
  groupby: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 그룹별 평균 내기",
      code: `# 상품별 평균 보험료와 평균 나이
df.groupby("product")[["premium", "age"]].mean().round(1)`,
    },
  ],
  apply: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 값마다 함수 적용하기",
      code: `def 연령대(x):  # 나이를 받아 연령대 글자로 바꾸는 함수
    return "청년" if x < 40 else "중장년"
df["연령대2"] = df["age"].apply(연령대)  # 모든 나이에 적용
df["성별"] = df["sex"].map({"M": "남", "F": "여"})  # 값 바꾸기 표
df[["age", "연령대2", "sex", "성별"]].head()  # 결과`,
    },
  ],
  pivot: [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 피벗 표 만들기",
      code: `# 행=상품, 열=성별, 값=평균 보험료 (엑셀 피벗과 같음)
pd.pivot_table(df, index="product", columns="sex", values="premium", aggfunc="mean").round(0)`,
    },
  ],
  missing: [
    {
      title: "1. 빈칸 세기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.isna().sum()  # 열마다 빈칸(결측) 개수`,
    },
    {
      title: "2. 빈칸 채우기",
      code: `# income 빈칸을 중앙값으로 채움
df["income"] = df["income"].fillna(df["income"].median())
df["income"].isna().sum()  # 남은 빈칸 수 (0이면 성공)`,
    },
  ],
  "sort-dedup": [
    {
      title: "1. 데이터 불러오기",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 정렬하고 중복 없애기",
      code: `s = df.sort_values("premium", ascending=False)  # 보험료 큰 순서로
u = s.drop_duplicates("customer_id")  # 같은 고객은 첫 줄만 남김
print(len(df), "→", len(u))  # 줄 수 변화
u[["customer_id", "premium"]].head()  # 결과`,
    },
  ],
};
