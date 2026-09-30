// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
import type { BeginnerBlock } from "../beginnerCode";

export const DATA: Record<string, BeginnerBlock[]> = {
  // ── 보험·계리 ──
  "exposure-rates": [
    {
      title: "1. 데이터 불러오기",
      result: "경험 데이터(계약 800건)의 앞 5행이 나옵니다. 상품·성별·가입나이·경과연수·사건 여부 열을 확인하세요.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("experience.xlsx")  # 경험 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 상품별 발생률 계산하기",
      result: "상품별 사건 수·노출연수·발생률(사건 수÷노출연수) 표가 3행 나옵니다.",
      code: `# 상품별로 사건 수와 노출(가입 기간 합계)을 더함
g = df.groupby("product").agg(사건수=("event", "sum"), 노출연수=("duration_years", "sum"))
# 발생률 = 사건 수 ÷ 노출 연수 (1년당 발생 비율)
g["발생률"] = g["사건수"] / g["노출연수"]
g  # 결과 표`,
    },
    {
      title: "다른 방법 — pivot_table로 상품×성별 발생률",
      alt: true,
      result: "행=상품, 열=성별(F·M)인 발생률 표가 나옵니다. 칸마다 사건 수÷노출연수입니다.",
      code: `# 상품×성별 칸마다 사건 수 합계
사건 = pd.pivot_table(df, index="product", columns="sex", values="event", aggfunc="sum")
# 같은 칸의 노출연수 합계
노출 = pd.pivot_table(df, index="product", columns="sex", values="duration_years", aggfunc="sum")
(사건 / 노출).round(4)  # 칸끼리 나누면 발생률 표`,
    },
    {
      title: "다른 방법 — 발생률 막대그래프",
      alt: true,
      result: "상품별 발생률을 막대 3개로 비교하는 그래프가 나옵니다.",
      code: `import matplotlib.pyplot as plt  # 그래프 도구
g["발생률"].plot(kind="bar")  # 상품별 발생률 막대
plt.ylabel("연간 발생률")  # 세로축 이름
plt.show()  # 그래프 보기`,
    },
  ],
  graduation: [
    {
      title: "1. 생명표 불러오기",
      result: "0~100세 생명표의 앞 5행(나이·남자 사망률·여자 사망률)이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
import matplotlib.pyplot as plt  # 그래프 도구
df = pd.read_excel("mortality_table.xlsx")  # 나이별 사망률 표 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 이동평균으로 매끄럽게 하기",
      result: "원래 사망률과 이동평균 보정값을 겹친 로그 축 그래프, 그리고 앞 10세의 비교 표가 나옵니다.",
      code: `# 앞뒤 5개 나이의 평균으로 울퉁불퉁한 사망률을 부드럽게
df["qx_보정"] = df["qx_male"].rolling(5, center=True, min_periods=1).mean()
# 원래 값과 보정 값을 같이 그림 (세로축은 로그)
df.plot(x="age", y=["qx_male", "qx_보정"], logy=True)
plt.show()  # 그래프 보기
df[["age", "qx_male", "qx_보정"]].head(10)  # 결과 표`,
    },
    {
      title: "다른 방법 — 다항식(np.polyfit)으로 곡선 맞추기",
      alt: true,
      result: "로그 사망률에 3차 곡선을 맞춘 보정값(qx_다항)이 생기고, 30~39세 비교 표가 나옵니다.",
      code: `import numpy as np  # 계산 도구
# 로그 사망률에 3차 다항식 곡선을 맞춤 (나이가 x)
계수 = np.polyfit(df["age"], np.log(df["qx_male"]), 3)
# 맞춘 곡선 값을 다시 사망률로 되돌림 (exp)
df["qx_다항"] = np.exp(np.polyval(계수, df["age"]))
df.loc[30:39, ["age", "qx_male", "qx_보정", "qx_다항"]]  # 30대 비교`,
    },
    {
      title: "다른 방법 — 원래 값은 점, 보정 곡선은 선으로",
      alt: true,
      result: "원래 사망률은 점, 두 보정 곡선은 선으로 그린 로그 축 그래프가 나옵니다.",
      code: `plt.scatter(df["age"], df["qx_male"], s=8, label="원래 값")  # 원래 값은 점
plt.plot(df["age"], df["qx_보정"], label="이동평균")  # 이동평균 선
plt.plot(df["age"], df["qx_다항"], label="다항식")  # 다항식 선
plt.yscale("log")  # 세로축 로그
plt.legend()  # 범례
plt.show()  # 그래프 보기`,
    },
  ],
  "kaplan-meier": [
    {
      title: "1. 데이터 불러오기",
      result: "경험 데이터 앞 5행에 경과 기간을 올림한 '연차' 열이 더해져 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
import numpy as np  # 계산 도구
df = pd.read_excel("experience.xlsx")  # 경험 데이터 읽기
df["연차"] = np.ceil(df["duration_years"])  # 경과 기간을 정수 연차로 올림
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 연차별 생존율 계산하기",
      result: "1~16년차의 관찰수·사건수·누적 생존율 표가 나옵니다. 생존율은 1에서 조금씩 줄어듭니다.",
      code: `rows = []  # 결과를 모을 목록
s = 1.0  # 처음 생존율은 100%
for t in range(1, int(df["연차"].max()) + 1):  # 1년차부터 차례로
    n = (df["연차"] >= t).sum()  # t년차에 아직 관찰 중인 사람 수
    d = ((df["연차"] == t) & (df["event"] == 1)).sum()  # t년차 사건 수
    s = s * (1 - d / n)  # 생존율 = 이전 생존율 × (1 - 사건 비율)
    rows.append({"연차": t, "관찰수": n, "사건수": d, "생존율": s})
pd.DataFrame(rows)  # 결과 표`,
    },
    {
      title: "다른 방법 — 반복문 없이 한 번에 계산",
      alt: true,
      result: "위 표와 같은 연차별 생존율이 반복문 없이 계산된 표로 나옵니다.",
      code: `# 연차별 사건 수 (사건=1인 행만 세기)
d = df[df["event"] == 1].groupby("연차").size()
# 연차별 관찰 끝난 사람 수 → 뒤에서부터 누적하면 '아직 관찰 중인 사람 수'
n = df.groupby("연차").size().sort_index(ascending=False).cumsum().sort_index()
km = pd.DataFrame({"관찰수": n, "사건수": d}).fillna(0)  # 표로 묶기
km["생존율"] = (1 - km["사건수"] / km["관찰수"]).cumprod()  # 누적 곱
km  # 결과 표`,
    },
    {
      title: "다른 방법 — 생존곡선 계단 그래프",
      alt: true,
      result: "연차가 지날수록 계단처럼 내려가는 생존곡선 그래프가 나옵니다.",
      code: `import matplotlib.pyplot as plt  # 그래프 도구
plt.step(km.index, km["생존율"], where="post")  # 계단 모양 생존곡선
plt.ylim(0, 1.05)  # 세로축 0~1
plt.xlabel("연차")  # 가로축 이름
plt.ylabel("생존율")  # 세로축 이름
plt.show()  # 그래프 보기`,
    },
  ],
  credibility: [
    {
      title: "1. 신뢰도 계산하기",
      result: "사건 400건일 때 신뢰도 Z 값(약 0.61)이 나옵니다.",
      code: `import numpy as np  # 계산 도구
n = 400  # 우리 회사 경험 사건 수
경험률 = 0.012  # 우리 회사 경험 발생률
업계률 = 0.010  # 업계(기준) 발생률
Z = min(1, np.sqrt(n / 1082))  # 신뢰도 Z (1,082건이면 100% 신뢰)
Z  # 신뢰도`,
    },
    {
      title: "2. 섞어서 최종 요율 만들기",
      result: "경험률과 업계률을 Z로 섞은 최종 요율(약 0.0112)이 나옵니다.",
      code: `# 최종 요율 = Z × 경험률 + (1 - Z) × 업계률
최종률 = Z * 경험률 + (1 - Z) * 업계률
최종률  # 결과`,
    },
    {
      title: "다른 방법 — 여러 사건 수를 한 번에 비교",
      alt: true,
      result: "사건 수 100~2,000건별 신뢰도 Z와 최종 요율 표가 6행 나옵니다. 1,082건부터 Z=1입니다.",
      code: `import pandas as pd  # 표 데이터 도구
ns = np.array([100, 200, 400, 800, 1082, 2000])  # 비교할 사건 수들
Zs = np.minimum(1, np.sqrt(ns / 1082))  # 한 번에 신뢰도 계산
# 사건 수·신뢰도·최종 요율을 한 표로
pd.DataFrame({"사건수": ns, "Z": Zs, "최종률": Zs * 경험률 + (1 - Zs) * 업계률}).round(4)`,
    },
  ],
  "chain-ladder": [
    {
      title: "1. 손해 삼각형 불러오기",
      result: "사고연도 2016~2023 × 진전 1~8의 누적 손해 삼각형이 나옵니다. 오른쪽 아래는 빈칸(NaN)입니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("triangle.xlsx")  # 누적 손해 삼각형 읽기
tri = df.set_index("accident_year")  # 사고연도를 행 이름으로
tri  # 삼각형 확인 (오른쪽 아래는 빈칸)`,
    },
    {
      title: "2. 진전계수로 빈칸 채우기",
      result: "빈칸이 진전계수로 채워진 사각형 표(8×8)가 나옵니다.",
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
      result: "사고연도별 현재 누적·예상 최종·준비금(최종−현재) 표가 8행 나옵니다. 최근 연도일수록 준비금이 큽니다.",
      code: `현재 = tri.ffill(axis=1).iloc[:, -1]  # 사고연도별 지금까지 누적 손해
최종 = full.iloc[:, -1]  # 예상 최종 손해
# 준비금 = 최종 - 현재 (앞으로 더 나갈 돈)
pd.DataFrame({"현재": 현재, "최종": 최종, "준비금": 최종 - 현재}).round(0)`,
    },
    {
      title: "다른 방법 — 연도별 진전계수 표(age-to-age)",
      alt: true,
      result: "사고연도별 이웃 진전 간 비율(다음 열÷앞 열) 표와, 맨 아래 '평균' 행이 나옵니다.",
      code: `# 다음 열 ÷ 앞 열 (.values로 열 이름을 떼고 칸끼리 나눔)
ata = tri.iloc[:, 1:] / tri.iloc[:, :-1].values
ata.columns = [f"{a}→{b}" for a, b in zip(cols[:-1], cols[1:])]  # 열 이름 붙이기
ata.loc["평균"] = ata.mean()  # 열마다 단순 평균 진전계수
ata.round(3)  # 결과 표`,
    },
    {
      title: "다른 방법 — 사고연도별 진전 그래프",
      alt: true,
      result: "사고연도마다 누적 손해가 진전에 따라 늘어나는 선 8개가 나옵니다.",
      code: `import matplotlib.pyplot as plt  # 그래프 도구
tri.T.plot(marker="o")  # 행·열을 뒤집어 사고연도마다 선 하나
plt.xlabel("진전")  # 가로축 이름
plt.ylabel("누적 손해")  # 세로축 이름
plt.show()  # 그래프 보기`,
    },
  ],
  "pure-premium": [
    {
      title: "1. 데이터 불러오기",
      result: "청구 데이터(600건) 앞 5행이 나옵니다. claim_cnt(건수)·claim_amt(금액) 열을 확인하세요.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("claims.xlsx")  # 청구 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 빈도 × 심도 = 순보험료",
      result: "상품 4개별 계약수·건수·금액·빈도·심도·순보험료 표가 나옵니다.",
      code: `# 상품별 계약 수, 청구 건수, 청구 금액 합계
g = df.groupby("product").agg(계약수=("policy_id", "count"), 건수=("claim_cnt", "sum"), 금액=("claim_amt", "sum"))
g["빈도"] = g["건수"] / g["계약수"]  # 계약 1건당 청구 건수
g["심도"] = g["금액"] / g["건수"]  # 청구 1건당 금액
g["순보험료"] = g["빈도"] * g["심도"]  # 계약 1건당 예상 지급액
g.round(2)  # 결과 표`,
    },
    {
      title: "다른 방법 — 계약당 평균 지급액으로 바로",
      alt: true,
      result: "상품별 순보험료(계약당 평균 청구 금액)가 나옵니다. 위 표의 순보험료와 같은 값입니다.",
      code: `# 빈도 × 심도 = 금액 ÷ 계약수 = 계약당 평균 금액
df.groupby("product")["claim_amt"].mean().round(0)`,
    },
    {
      title: "다른 방법 — pivot_table로 상품×성별",
      alt: true,
      result: "행=상품, 열=성별인 순보험료(계약당 평균 금액) 표가 나옵니다.",
      code: `# 칸마다 청구 금액 평균 = 그 칸의 순보험료
pd.pivot_table(df, index="product", columns="sex", values="claim_amt", aggfunc="mean").round(0)`,
    },
  ],
  "life-premium": [
    {
      title: "1. 생명표 불러오기",
      result: "40~49세 남자 사망률 10개가 담긴 배열이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
import numpy as np  # 계산 도구
df = pd.read_excel("mortality_table.xlsx")  # 나이별 사망률 표 읽기
q = df.set_index("age").loc[40:49, "qx_male"].values  # 40~49세 남자 사망률 10개
q  # 확인`,
    },
    {
      title: "2. 10년 정기보험 순보험료",
      result: "40세 남자, 보험금 1억 원·10년 정기보험의 연납 순보험료(원)가 한 숫자로 나옵니다.",
      code: `v = 1 / 1.03  # 할인율 (이율 3%)
p = np.cumprod(np.r_[1, 1 - q[:-1]])  # 각 해 시작 때까지 살아 있을 확률
t = np.arange(10)  # 0 ~ 9년
A = (v ** (t + 1) * p * q).sum()  # 사망보험금 1원의 현재가치
a = (v ** t * p).sum()  # 매년 초 1원씩 내는 보험료의 현재가치
P = 100_000_000 * A / a  # 보험금 1억 원일 때 연납 순보험료
round(P)  # 결과 (원)`,
    },
    {
      title: "다른 방법 — 반복문으로 한 해씩 더하기",
      alt: true,
      result: "위와 같은 연납 순보험료(원)가 한 해씩 더하는 방식으로 계산되어 나옵니다.",
      code: `A2, a2, 생존 = 0, 0, 1.0  # 합계들과 '지금까지 살아 있을 확률'
for k in range(10):  # 0 ~ 9년차
    A2 += v ** (k + 1) * 생존 * q[k]  # 그해 사망하면 연말에 1원 지급
    a2 += v ** k * 생존  # 그해 초 살아 있으면 1원 납입
    생존 *= 1 - q[k]  # 다음 해로 넘어갈 생존 확률
round(100_000_000 * A2 / a2)  # 결과 (원)`,
    },
    {
      title: "다른 방법 — 연도별 계산표로 보기",
      alt: true,
      result: "경과 0~9년의 생존확률·사망률·할인계수 표가 나오고, 맨 아래 '합계' 행에 A·ä가 나옵니다.",
      code: `# 해마다 생존확률·사망률·할인계수·사망급부 현가·납입 현가
표 = pd.DataFrame({"생존확률": p, "사망률": q, "할인": v ** t})
표["급부현가"] = v ** (t + 1) * p * q  # 사망보험금 1원 현가
표["납입현가"] = v ** t * p  # 보험료 1원 현가
표.loc["합계"] = 표.sum()  # 합계 행 = A와 ä
표.round(5)  # 결과 표`,
    },
  ],
  reinsurance: [
    {
      title: "1. 데이터 불러오기",
      result: "청구 금액(claim_amt)의 개수·평균·표준편차·최솟값·분위수·최댓값 요약이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
import numpy as np  # 계산 도구
df = pd.read_excel("claims.xlsx")  # 청구 데이터 읽기
df["claim_amt"].describe()  # 청구 금액 요약`,
    },
    {
      title: "2. 초과손해(XL) 재보험 회수액",
      result: "청구액·재보험 회수액·보유액 세 합계가 나옵니다. 회수액+보유액=청구액입니다.",
      code: `공제 = 500_000  # 이 금액까지는 우리 회사 부담
한도 = 1_000_000  # 재보험사가 최대로 내 주는 금액
# 회수액 = (청구액 - 공제)를 0 ~ 한도 사이로 자름
df["회수액"] = np.clip(df["claim_amt"] - 공제, 0, 한도)
df["보유액"] = df["claim_amt"] - df["회수액"]  # 우리 회사가 남기는 부담
df[["claim_amt", "회수액", "보유액"]].sum()  # 합계 비교`,
    },
    {
      title: "다른 방법 — np.minimum·np.maximum으로",
      alt: true,
      result: "np.clip과 똑같은 회수액 합계가 나옵니다(같은 계산을 두 단계로 나눈 것).",
      code: `초과 = np.maximum(df["claim_amt"] - 공제, 0)  # 공제를 넘은 부분 (음수는 0)
회수 = np.minimum(초과, 한도)  # 한도까지만 회수
회수.sum()  # 회수액 합계`,
    },
    {
      title: "다른 방법 — 비례(Quota Share) 재보험",
      alt: true,
      result: "출재율 30%일 때 청구액·출재액·보유액 합계가 나옵니다. 모든 청구를 같은 비율로 나눕니다.",
      code: `출재율 = 0.3  # 재보험사가 30%를 나눠 부담
df["QS출재"] = df["claim_amt"] * 출재율  # 청구마다 30%
df["QS보유"] = df["claim_amt"] - df["QS출재"]  # 나머지 70%
df[["claim_amt", "QS출재", "QS보유"]].sum()  # 합계 비교`,
    },
  ],

  // ── 데이터 핸들링 ──
  "data-loading": [
    {
      title: "1. 엑셀 파일 불러오기",
      result: "계약 데이터(600행×16열)의 앞 5행이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 엑셀 파일 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 크기와 열 확인하기",
      result: "(600, 16) 크기와 열 이름별 자료형(int64·float64·object·bool) 목록이 나옵니다.",
      code: `print(df.shape)  # (행 수, 열 수)
df.dtypes  # 열 이름과 자료형`,
    },
    {
      title: "다른 방법 — 필요한 열만 골라 읽기",
      alt: true,
      result: "policy_id·age·premium 세 열만 담긴 표의 앞 5행이 나옵니다.",
      code: `# 읽자마자 필요한 열만 남김
small = pd.read_excel("policy.xlsx")[["policy_id", "age", "premium"]]
small.head()  # 앞 5행 확인`,
    },
    {
      title: "다른 방법 — describe로 한눈에 요약",
      alt: true,
      result: "열마다 개수·평균·표준편차·최솟값·분위수·최댓값(글자 열은 고유값 수·최빈값) 요약표가 나옵니다.",
      code: `# 숫자·글자 열 모두 요약 (include="all")
df.describe(include="all").T  # .T로 뒤집으면 열이 행이 되어 보기 쉬움`,
    },
  ],
  "select-rows-cols": [
    {
      title: "1. 데이터 불러오기",
      result: "계약 데이터의 앞 5행이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 원하는 열·행 고르기",
      result: "policy_id·age·premium 세 열의 0~4번 행(5행)이 나옵니다.",
      code: `sub = df[["policy_id", "age", "premium"]]  # 열 3개만 고르기
sub.loc[0:4]  # 그중 0~4번 행`,
    },
    {
      title: "다른 방법 — iloc으로 위치 번호로 고르기",
      alt: true,
      result: "앞 5행 × 앞 3열(policy_id·customer_id·product)이 나옵니다.",
      code: `# iloc[행 위치, 열 위치] — 끝 번호는 포함하지 않음
df.iloc[0:5, 0:3]  # 0~4행, 0~2열`,
    },
    {
      title: "다른 방법 — loc으로 행 조건과 열을 함께",
      alt: true,
      result: "종신 상품 계약만의 age·premium 두 열 앞 5행이 나옵니다.",
      code: `# loc[행 조건, 열 목록] — 행과 열을 한 번에 고름
df.loc[df["product"] == "종신", ["age", "premium"]].head()`,
    },
  ],
  "filter-condition": [
    {
      title: "1. 데이터 불러오기",
      result: "계약 데이터의 앞 5행이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 조건으로 거르기",
      result: "나이 40세 이상이면서 보험료 50,000원 이상인 계약의 앞 5행이 나옵니다.",
      code: `# 나이 40세 이상이면서 보험료 50,000원 이상인 행만
old = df[(df["age"] >= 40) & (df["premium"] >= 50000)]
old.head()  # 결과 앞 5행`,
    },
    {
      title: "다른 방법 — query 문장으로 거르기",
      alt: true,
      result: "위와 같은 조건의 행 수가 나옵니다(두 방법의 결과가 같음).",
      code: `# 조건을 문장처럼 적음 (and·or 사용 가능)
old2 = df.query("age >= 40 and premium >= 50000")
len(old2)  # 걸러진 행 수`,
    },
    {
      title: "다른 방법 — between으로 범위 거르기",
      alt: true,
      result: "나이 30~39세(양 끝 포함) 계약 수가 나옵니다.",
      code: `# 30 이상 39 이하 (양 끝 포함)
thirty = df[df["age"].between(30, 39)]
len(thirty)  # 걸러진 행 수`,
    },
  ],
  isin: [
    {
      title: "1. 데이터 불러오기",
      result: "지역 값 목록(기타·부산·서울·경기)이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df["region"].unique()  # 어떤 지역이 있는지 확인`,
    },
    {
      title: "2. 목록에 든 값만 고르기",
      result: "고른 지역 2개와 지역별 계약 수가 나옵니다.",
      code: `목록 = list(df["region"].unique()[:2])  # 고를 지역 2개 (직접 적어도 됨)
sel = df[df["region"].isin(목록)]  # region이 목록에 있는 행만
sel["region"].value_counts()  # 고른 결과 개수`,
    },
    {
      title: "다른 방법 — ~isin으로 목록 빼기",
      alt: true,
      result: "목록에 없는 나머지 지역 2개와 지역별 계약 수가 나옵니다.",
      code: `# ~ 는 '아닌 것' — 목록에 없는 행만
rest = df[~df["region"].isin(목록)]
rest["region"].value_counts()  # 남은 지역별 개수`,
    },
    {
      title: "다른 방법 — query에서 목록 쓰기",
      alt: true,
      result: "isin과 같은 행 수가 나옵니다. @목록은 파이썬 변수를 뜻합니다.",
      code: `# @ 를 붙이면 query 안에서 파이썬 변수를 씀
sel2 = df.query("region in @목록")
len(sel2)  # 고른 행 수`,
    },
  ],
  conditional: [
    {
      title: "1. 데이터 불러오기",
      result: "계약 데이터의 앞 5행이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
import numpy as np  # 계산 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 조건에 따라 새 열 만들기",
      result: "'고액'·'일반' 두 구분과 각각의 계약 수가 나옵니다.",
      code: `# 보험료가 평균보다 크면 "고액", 아니면 "일반"
df["구분"] = np.where(df["premium"] > df["premium"].mean(), "고액", "일반")
df["구분"].value_counts()  # 구분별 개수`,
    },
    {
      title: "다른 방법 — np.select로 조건 여러 개",
      alt: true,
      result: "'청년'·'중년'·'장년' 세 연령층과 각각의 계약 수가 나옵니다.",
      code: `조건 = [df["age"] < 40, df["age"] < 60]  # 위에서부터 차례로 검사
값 = ["청년", "중년"]  # 조건마다 붙일 이름
df["연령층"] = np.select(조건, 값, default="장년")  # 둘 다 아니면 장년
df["연령층"].value_counts()  # 연령층별 개수`,
    },
    {
      title: "다른 방법 — pd.cut으로 구간 나누기",
      alt: true,
      result: "보험료를 저·중·고 3구간으로 나눈 뒤 구간별 계약 수가 나옵니다.",
      code: `# 경계값으로 구간을 나누고 이름을 붙임
df["보험료대"] = pd.cut(df["premium"], bins=[0, 40000, 70000, np.inf], labels=["저", "중", "고"])
df["보험료대"].value_counts().sort_index()  # 구간별 개수`,
    },
  ],
  "join-merge": [
    {
      title: "1. 두 표 불러오기",
      result: "청구 표의 앞 5행이 나옵니다. 계약 표와 공통 열은 policy_id입니다.",
      code: `import pandas as pd  # 표 데이터 도구
policy = pd.read_excel("policy.xlsx")  # 계약 표
claims = pd.read_excel("claims.xlsx")  # 청구 표
claims.head()  # 청구 표 확인`,
    },
    {
      title: "2. policy_id로 합치기",
      result: "계약 정보(age·premium) 옆에 청구 금액이 붙은 표의 앞 5행이 나옵니다.",
      code: `# 같은 policy_id끼리 옆으로 붙임 (계약 표 기준, 청구 없으면 빈칸)
m = pd.merge(policy[["policy_id", "age", "premium"]], claims[["policy_id", "claim_amt"]], on="policy_id", how="left")
m.head()  # 합친 결과`,
    },
    {
      title: "다른 방법 — 인덱스 기준 join",
      alt: true,
      result: "policy_id가 행 이름이 된 합친 표의 앞 5행이 나옵니다(merge와 같은 내용).",
      code: `# 두 표 모두 policy_id를 행 이름(인덱스)으로 만든 뒤 옆으로 붙임
j = policy.set_index("policy_id")[["age", "premium"]].join(claims.set_index("policy_id")[["claim_amt"]])
j.head()  # 합친 결과`,
    },
    {
      title: "다른 방법 — indicator로 짝 확인",
      alt: true,
      result: "양쪽에 다 있음(both)·한쪽만 있음(left_only·right_only) 개수가 나옵니다.",
      code: `# how="outer"는 양쪽 모두 남기고, indicator는 어디서 왔는지 표시
chk = pd.merge(policy[["policy_id"]], claims[["policy_id"]], on="policy_id", how="outer", indicator=True)
chk["_merge"].value_counts()  # 짝 맞은 수 확인`,
    },
  ],
  groupby: [
    {
      title: "1. 데이터 불러오기",
      result: "계약 데이터의 앞 5행이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 그룹별 평균 내기",
      result: "상품 4개별 평균 보험료와 평균 나이 표가 나옵니다.",
      code: `# 상품별 평균 보험료와 평균 나이
df.groupby("product")[["premium", "age"]].mean().round(1)`,
    },
    {
      title: "다른 방법 — agg로 여러 통계를 한 번에",
      alt: true,
      result: "상품별 계약 수·평균 보험료·최대 보험료·평균 나이 표가 나옵니다.",
      code: `# 새 열 이름=(원래 열, 계산) 형식
df.groupby("product").agg(
    계약수=("policy_id", "count"),  # 계약 개수
    평균보험료=("premium", "mean"),  # 평균
    최대보험료=("premium", "max"),  # 최댓값
    평균나이=("age", "mean"),  # 평균 나이
).round(1)`,
    },
    {
      title: "다른 방법 — transform으로 그룹 평균을 행마다",
      alt: true,
      result: "각 계약 옆에 자기 상품의 평균 보험료와 그 대비 비율이 붙은 앞 5행이 나옵니다.",
      code: `# transform은 행 수를 그대로 두고 그룹 값을 행마다 채움
df["상품평균"] = df.groupby("product")["premium"].transform("mean")
df["평균대비"] = (df["premium"] / df["상품평균"]).round(2)  # 1보다 크면 평균보다 비쌈
df[["product", "premium", "상품평균", "평균대비"]].head()  # 결과`,
    },
  ],
  apply: [
    {
      title: "1. 데이터 불러오기",
      result: "계약 데이터의 앞 5행이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 값마다 함수 적용하기",
      result: "나이·연령대2(청년/중장년)·성별 코드·한글 성별이 나란히 있는 앞 5행이 나옵니다.",
      code: `def 연령대(x):  # 나이를 받아 연령대 글자로 바꾸는 함수
    return "청년" if x < 40 else "중장년"
df["연령대2"] = df["age"].apply(연령대)  # 모든 나이에 적용
df["성별"] = df["sex"].map({"M": "남", "F": "여"})  # 값 바꾸기 표
df[["age", "연령대2", "sex", "성별"]].head()  # 결과`,
    },
    {
      title: "다른 방법 — lambda로 한 줄에",
      alt: true,
      result: "위와 같은 연령대 구분의 개수(청년·중장년)가 나옵니다.",
      code: `# 함수를 따로 만들지 않고 lambda로 바로 적용
df["연령대3"] = df["age"].apply(lambda x: "청년" if x < 40 else "중장년")
df["연령대3"].value_counts()  # 구분별 개수`,
    },
    {
      title: "다른 방법 — np.where로 빠르게",
      alt: true,
      result: "apply와 같은 결과인지 확인한 값 True가 나옵니다. 행이 많을수록 np.where가 훨씬 빠릅니다.",
      code: `import numpy as np  # 계산 도구
# 열 전체를 한 번에 비교 (반복 없이 계산)
df["연령대4"] = np.where(df["age"] < 40, "청년", "중장년")
(df["연령대4"] == df["연령대2"]).all()  # apply 결과와 같은지 확인`,
    },
  ],
  pivot: [
    {
      title: "1. 데이터 불러오기",
      result: "계약 데이터의 앞 5행이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 피벗 표 만들기",
      result: "행=상품 4개, 열=성별(F·M)인 평균 보험료 표가 나옵니다.",
      code: `# 행=상품, 열=성별, 값=평균 보험료 (엑셀 피벗과 같음)
pd.pivot_table(df, index="product", columns="sex", values="premium", aggfunc="mean").round(0)`,
    },
    {
      title: "다른 방법 — groupby 후 unstack",
      alt: true,
      result: "pivot_table과 같은 상품×성별 평균 보험료 표가 나옵니다.",
      code: `# 두 열로 묶어 평균을 낸 뒤, 안쪽(sex)을 열로 펼침
df.groupby(["product", "sex"])["premium"].mean().unstack().round(0)`,
    },
    {
      title: "다른 방법 — crosstab으로 개수 표",
      alt: true,
      result: "상품×채널별 계약 수 표가 나오고, 맨 아래·오른쪽에 합계(All)가 붙습니다.",
      code: `# 두 열의 조합별 개수 (margins=True면 합계 행·열 추가)
pd.crosstab(df["product"], df["channel"], margins=True)`,
    },
  ],
  missing: [
    {
      title: "1. 빈칸 세기",
      result: "열마다 빈칸 개수가 나옵니다. income 열에 빈칸 75개가 있습니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.isna().sum()  # 열마다 빈칸(결측) 개수`,
    },
    {
      title: "2. 빈칸 채우기",
      result: "채운 뒤 income의 남은 빈칸 수 0이 나옵니다.",
      code: `# income 빈칸을 중앙값으로 채움
df["income"] = df["income"].fillna(df["income"].median())
df["income"].isna().sum()  # 남은 빈칸 수 (0이면 성공)`,
    },
    {
      title: "다른 방법 — 빈칸 있는 행 지우기(dropna)",
      alt: true,
      result: "원래 600행과 빈칸 행을 지운 뒤 525행, 두 숫자가 나옵니다.",
      code: `raw = pd.read_excel("policy.xlsx")  # 채우기 전 원본 다시 읽기
# income이 빈칸인 행만 지움 (subset 없으면 어느 열이든 빈칸이면 지움)
clean = raw.dropna(subset=["income"])
len(raw), len(clean)  # 지우기 전·후 행 수`,
    },
    {
      title: "다른 방법 — 그룹 평균으로 채우기",
      alt: true,
      result: "상품마다 그 상품의 평균 소득으로 채운 뒤 남은 빈칸 수 0이 나옵니다.",
      code: `# 같은 상품 계약들의 평균 소득으로 빈칸을 채움
grp평균 = raw.groupby("product")["income"].transform("mean")
raw["income2"] = raw["income"].fillna(grp평균)
raw["income2"].isna().sum()  # 남은 빈칸 수`,
    },
  ],
  "sort-dedup": [
    {
      title: "1. 데이터 불러오기",
      result: "계약 데이터의 앞 5행이 나옵니다.",
      code: `import pandas as pd  # 표 데이터 도구
df = pd.read_excel("policy.xlsx")  # 계약 데이터 읽기
df.head()  # 앞 5행 확인`,
    },
    {
      title: "2. 정렬하고 중복 없애기",
      result: "줄 수 변화(600 → 305, 고객 수)와 보험료가 가장 큰 고객 5명이 나옵니다.",
      code: `s = df.sort_values("premium", ascending=False)  # 보험료 큰 순서로
u = s.drop_duplicates("customer_id")  # 같은 고객은 첫 줄만 남김
print(len(df), "→", len(u))  # 줄 수 변화
u[["customer_id", "premium"]].head()  # 결과`,
    },
    {
      title: "다른 방법 — nlargest로 상위 N개",
      alt: true,
      result: "보험료가 가장 큰 계약 5건이 나옵니다(정렬 후 head와 같음).",
      code: `# 정렬 없이 큰 값 5개만 바로 뽑음 (작은 값은 nsmallest)
df.nlargest(5, "premium")[["policy_id", "customer_id", "premium"]]`,
    },
    {
      title: "다른 방법 — duplicated로 중복 먼저 세기",
      alt: true,
      result: "customer_id가 앞 행과 겹치는 중복 행 수(295)가 나옵니다.",
      code: `# 앞에 이미 나온 고객이면 True
중복 = df.duplicated("customer_id")
중복.sum()  # 중복 행 수`,
    },
  ],
};
