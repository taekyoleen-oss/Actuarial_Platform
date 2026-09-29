// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
import type { BeginnerBlock } from "../beginnerCode";

const one = (title: string, code: string): BeginnerBlock[] => [{ title, code }];

export const DATA: Record<string, BeginnerBlock[]> = {
  // ── 데이터 입력 ──
  "load-csv": one(
    "CSV 읽기 — 구분자·인코딩·헤더",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 파일 이름을 내 파일로 바꾸세요
data = pd.read_csv("data.csv")  # CSV 파일을 표로 읽기
data.head()  # 앞 5행 보기`
  ),
  "load-excel": one(
    "엑셀 읽기 — 시트·범위 지정",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 파일 이름을 내 파일로 바꾸세요
data = pd.read_excel("data.xlsx")  # 엑셀 첫 시트를 표로 읽기
data.head()  # 앞 5행 보기`
  ),
  "load-sheets": one(
    "여러 시트·여러 파일 합치기",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 파일 이름을 내 파일로 바꾸세요
files = ["data.xlsx", "data.csv"]  # 합칠 파일 목록
parts = [pd.read_excel(files[0]), pd.read_csv(files[1])]  # 파일마다 읽기
all_data = pd.concat(parts, ignore_index=True)  # 위아래로 이어 붙이기
all_data.shape  # 합친 표의 (행 수, 열 수)`
  ),
  "load-json": one(
    "JSON·중첩 구조 읽기",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 파일 이름을 내 파일로 바꾸세요
data = pd.read_json("data.json")  # JSON 파일을 표로 읽기
data.head()  # 앞 5행 보기`
  ),
  "load-dates": one(
    "날짜 파싱·자료형 정리",
    `import pandas as pd  # 표 다루는 도구 불러오기
raw = pd.DataFrame({"date": ["2025-01-03", "2025-02-10"]})  # 글자로 된 날짜 예시
raw["date"] = pd.to_datetime(raw["date"])  # 글자를 날짜로 바꾸기
raw["year"] = raw["date"].dt.year  # 날짜에서 연도만 꺼내기
raw  # 결과 보기`
  ),
  "load-manual": one(
    "직접 입력 — 소형 표 만들기",
    `import pandas as pd  # 표 다루는 도구 불러오기
rate_table = pd.DataFrame({  # 열 이름: 값 목록 으로 표 만들기
    "age_band": ["20대", "30대", "40대"],  # 첫째 열
    "rate": [0.0012, 0.0018, 0.0031],  # 둘째 열
})
rate_table  # 결과 보기`
  ),
  "load-url": one(
    "URL에서 바로 읽기",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 웹 주소면 이렇게: data = pd.read_csv("https://example.com/data.csv")
# 여기서는 같은 방식으로 내 파일을 읽어 봅니다(파일 이름을 내 파일로 바꾸세요)
data = pd.read_csv("data.csv")  # 주소 자리에 파일 이름을 넣어도 똑같이 동작
data.head()  # 앞 5행 보기`
  ),

  // ── 선택 ──
  "select-cols": one(
    "열 선택 (한 열·여러 열)",
    `sub = df[["policy_id", "premium"]]  # 원하는 열만 골라 새 표 만들기
sub.head()  # 앞 5행 보기`
  ),
  "select-loc": one(
    "loc — 라벨·조건으로 [행, 열]",
    `sub = df.loc[df["age"] >= 60, ["policy_id", "premium"]]  # 60세 이상 행 + 두 열만
sub.head()  # 앞 5행 보기`
  ),
  "select-iloc": one(
    "iloc — 위치(정수)로 [행, 열]",
    `front = df.iloc[:5, :3]  # 앞 5행 × 앞 3열(번호로 고르기)
front  # 결과 보기`
  ),
  "select-dtypes": one(
    "자료형·이름 패턴으로 선택",
    `num = df.select_dtypes("number")  # 숫자로 된 열만 고르기
num.columns.tolist()  # 고른 열 이름 보기`
  ),

  // ── 조건 필터 ──
  "filter-multi": one(
    "복수 조건 (& | 와 괄호)",
    `target = df[(df["age"] >= 40) & (df["premium"] >= 100000)]  # 두 조건 모두 맞는 행(괄호 필수)
target.shape  # (행 수, 열 수)`
  ),
  "filter-query": one(
    "query — SQL처럼 읽히는 조건",
    `high = df.query("age >= 60 and premium >= 100000")  # 조건을 문장처럼 쓰기
high.shape  # (행 수, 열 수)`
  ),
  "filter-isin": one(
    "isin — 값 목록 포함",
    `picked = df[df["product"].isin(["종신", "정기"])]  # 목록에 든 상품만 남기기
picked["product"].value_counts()  # 상품별 건수 보기`
  ),
  "filter-not-isin": one(
    "isin 제외 (~)",
    `others = df[~df["product"].isin(["종신", "정기"])]  # ~ 를 붙이면 목록에 없는 것만
others.shape  # (행 수, 열 수)`
  ),
  "filter-between": one(
    "between — 구간 조건",
    `mid = df[df["premium"].between(50000, 150000)]  # 5만~15만 사이(양끝 포함)
mid.shape  # (행 수, 열 수)`
  ),

  // ── 조건 분기 ──
  "branch-where": one(
    "np.where — 이항 분기(IF)",
    `import numpy as np  # 숫자 계산 도구 불러오기
df["risk"] = np.where(df["age"] >= 60, "고위험", "일반")  # 조건 맞으면 앞 값, 아니면 뒤 값
df["risk"].value_counts()  # 값별 건수 보기`
  ),
  "branch-select": one(
    "np.select — 다중 분기(CASE)",
    `import numpy as np  # 숫자 계산 도구 불러오기
conds = [df["age"] >= 60, df["age"] >= 40]  # 위에서부터 검사할 조건들
df["age_grp"] = np.select(conds, ["60+", "40-59"], default="~39")  # 조건별 이름 붙이기
df["age_grp"].value_counts()  # 값별 건수 보기`
  ),
  "branch-cut": one(
    "pd.cut — 경계로 구간화",
    `import pandas as pd  # 표 다루는 도구 불러오기
df["age_cut"] = pd.cut(df["age"], bins=[0, 40, 60, 120])  # 나이를 경계값으로 구간 나누기
df["age_cut"].value_counts().sort_index()  # 구간별 건수 보기`
  ),
  "branch-qcut": one(
    "pd.qcut — 분위수 균등 분할",
    `import pandas as pd  # 표 다루는 도구 불러오기
df["prem_q"] = pd.qcut(df["premium"], q=4)  # 보험료를 건수가 비슷한 4구간으로
df["prem_q"].value_counts()  # 구간별 건수 보기`
  ),

  // ── Join ──
  "join-inner": one(
    "Join-inner — 양쪽 다 있는 키만",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="inner")  # 양쪽에 다 있는 계약만 붙이기
result.head()  # 앞 5행 보기`
  ),
  "join-left": one(
    "Join-left — 왼쪽 전부 유지",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="left")  # 계약은 전부 두고 청구 정보 붙이기
result.head()  # 앞 5행 보기`
  ),
  "join-right": one(
    "Join-right — 오른쪽 전부 유지",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="right")  # 청구는 전부 두고 계약 정보 붙이기
result.head()  # 앞 5행 보기`
  ),
  "join-outer": one(
    "Join-outer — 둘 다 전부",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="outer")  # 양쪽 행을 모두 살려 붙이기
result.shape  # (행 수, 열 수)`
  ),
  "join-cross": one(
    "Join-cross — 모든 조합(곱)",
    `import pandas as pd  # 표 다루는 도구 불러오기
plans = pd.DataFrame({"plan": ["기본", "고급"]})  # 첫째 표
riders = pd.DataFrame({"rider": ["암", "실손"]})  # 둘째 표
combos = pd.merge(plans, riders, how="cross")  # 모든 조합 만들기(2×2=4행)
combos  # 결과 보기`
  ),
  "join-keys": one(
    "키 이름이 다를 때 (left_on·right_on)",
    `import pandas as pd  # 표 다루는 도구 불러오기
names = pd.DataFrame({"cust": [df["customer_id"][0]], "name": ["김"]})  # 키 이름이 다른 작은 표
result = pd.merge(df, names, left_on="customer_id", right_on="cust", how="left")  # 각자 키 이름 지정
result.head()  # 앞 5행 보기`
  ),
  "join-validate": one(
    "결합 검증 (validate·indicator)",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="left", indicator=True)  # 짝 여부 표시 열 추가
result["_merge"].value_counts()  # both=짝 있음, left_only=짝 없음`
  ),

  // ── Concat ──
  "concat-row": one(
    "Concat-행 — 위아래로 쌓기(세로)",
    `import pandas as pd  # 표 다루는 도구 불러오기
stacked = pd.concat([df.head(3), df.tail(3)], ignore_index=True)  # 두 표를 위아래로 쌓기
stacked  # 결과 보기`
  ),
  "concat-col": one(
    "Concat-열 — 나란히 붙이기(가로)",
    `import pandas as pd  # 표 다루는 도구 불러오기
joined = pd.concat([df[["policy_id"]], df[["premium"]]], axis=1)  # axis=1 은 옆으로 붙이기
joined.head()  # 앞 5행 보기`
  ),

  // ── Split ──
  "split-str-cols": one(
    "Split-열분리 — 한 열을 여러 열로",
    `import pandas as pd  # 표 다루는 도구 불러오기
s = pd.DataFrame({"full": ["서울-강남", "부산-해운대"]})  # 예시 표
s[["시도", "시군구"]] = s["full"].str.split("-", expand=True)  # '-' 기준으로 두 열로 나누기
s  # 결과 보기`
  ),
  "split-explode": one(
    "Split-explode — 리스트 열을 여러 행으로",
    `import pandas as pd  # 표 다루는 도구 불러오기
s = pd.DataFrame({"id": [1, 2], "riders": [["암", "실손"], ["종신"]]})  # 한 칸에 여러 값
s.explode("riders")  # 값 하나씩 한 행으로 펼치기`
  ),
  "split-chunks": one(
    "Split-청크 — 행을 n등분",
    `size = len(df) // 3 + 1  # 한 조각의 행 수
parts = [df[i:i + size] for i in range(0, len(df), size)]  # 앞에서부터 잘라 3조각
[len(p) for p in parts]  # 조각별 행 수 보기`
  ),
  "split-mask": one(
    "Split-조건분할 — 두 그룹으로 나누기",
    `seniors = df[df["age"] >= 60]  # 조건에 맞는 그룹
others = df[df["age"] < 60]  # 나머지 그룹
len(seniors), len(others)  # 두 그룹의 행 수`
  ),
  "split-groups": one(
    "Split-그룹별 — dict로 그룹 분리",
    `groups = dict(list(df.groupby("product")))  # 상품별로 표를 나눠 사전에 담기
{k: len(g) for k, g in groups.items()}  # 그룹별 행 수 보기`
  ),

  // ── Groupby ──
  "groupby-sum": one(
    "Groupby-sum — 그룹별 합계",
    `df.groupby("product")["premium"].sum()  # 상품별 보험료 합계`
  ),
  "groupby-mean": one(
    "Groupby-mean — 그룹별 평균",
    `df.groupby("product")["premium"].mean()  # 상품별 보험료 평균`
  ),
  "groupby-count": one(
    "Groupby-count — 그룹별 건수",
    `df.groupby("product").size()  # 상품별 행(계약) 수`
  ),
  "groupby-agg": one(
    "Groupby-agg — 이름 있는 다중 집계",
    `df.groupby("product")["premium"].agg(["count", "mean", "sum"])  # 건수·평균·합계를 한 번에`
  ),
  "groupby-transform": one(
    "Groupby-transform — 행 수 유지 파생",
    `df["grp_mean"] = df.groupby("product")["premium"].transform("mean")  # 각 행에 자기 상품 평균 붙이기
df[["product", "premium", "grp_mean"]].head()  # 앞 5행 보기`
  ),
  "groupby-filter": one(
    "Groupby-filter — 그룹째 거르기",
    `big = df.groupby("product").filter(lambda g: len(g) >= 100)  # 100건 이상인 상품만 통째로 남기기
big["product"].value_counts()  # 남은 상품별 건수`
  ),

  // ── 피벗 ──
  "pivot-table": one(
    "pivot_table — 교차 요약표",
    `import pandas as pd  # 표 다루는 도구 불러오기
pd.pivot_table(df, index="product", columns="channel", values="premium")  # 상품×채널 평균 보험료`
  ),
  "pivot-melt": one(
    "melt — wide를 long으로",
    `import pandas as pd  # 표 다루는 도구 불러오기
wide = pd.DataFrame({"지점": ["A", "B"], "1월": [10, 20], "2월": [30, 40]})  # 옆으로 긴 표
wide.melt(id_vars="지점")  # 월 열들을 세로로 내리기`
  ),

  // ── 결측치 ──
  "missing-check": one(
    "결측 파악 — 열별 개수·비율",
    `df.isna().sum()  # 열마다 빈칸(결측) 개수`
  ),
  "missing-drop": one(
    "dropna — 핵심 열 결측 행 삭제",
    `clean = df.dropna(subset=["income"])  # income 이 빈 행 지우기
clean.shape  # 남은 (행 수, 열 수)`
  ),
  "missing-fill": one(
    "fillna — 중앙값·범주 대체",
    `df["income"] = df["income"].fillna(df["income"].median())  # 빈칸을 중앙값으로 채우기
df["income"].isna().sum()  # 남은 빈칸 수(0이면 성공)`
  ),
  "missing-group-fill": one(
    "그룹별 중앙값으로 대체",
    `med = df.groupby("age_band")["income"].transform("median")  # 각 행에 자기 연령대 중앙값
df["income"] = df["income"].fillna(med)  # 빈칸을 그 값으로 채우기
df["income"].isna().sum()  # 남은 빈칸 수`
  ),

  // ── 정렬·중복·순위 ──
  "sort-values": one(
    "sort_values — 복수 키 정렬",
    `out = df.sort_values("premium", ascending=False)  # 보험료 큰 순서로 정렬
out[["policy_id", "premium"]].head()  # 앞 5행 보기`
  ),
  "drop-duplicates": one(
    "drop_duplicates — 중복 제거",
    `dedup = df.drop_duplicates(subset=["customer_id"])  # 같은 고객은 첫 행만 남기기
dedup.shape  # 남은 (행 수, 열 수)`
  ),
  "latest-one": one(
    "그룹별 최신 1건 (정렬+dedup)",
    `latest = df.sort_values("tenure_months").drop_duplicates("customer_id", keep="first")  # 가입기간 짧은(최신) 순 → 고객별 첫 행
latest.shape  # 남은 (행 수, 열 수)`
  ),
  "rank-topn": one(
    "순위·상위 N (rank·nlargest)",
    `df.nlargest(10, "premium")[["policy_id", "premium"]]  # 보험료 상위 10건`
  ),

  // ── apply·map ──
  "map-dict": one(
    "map — 사전으로 코드→이름",
    `code_map = {"설계사": "FC", "방카": "BA", "다이렉트": "DM"}  # 바꿀 값 짝 목록
df["channel_cd"] = df["channel"].map(code_map)  # 사전대로 값 바꾸기(없는 값은 빈칸)
df["channel_cd"].value_counts()  # 값별 건수 보기`
  ),
  "apply-row": one(
    "apply(axis=1) — 여러 열 조합",
    `df["grade"] = df.apply(lambda r: "주의" if r["age"] >= 65 and r["n_contracts"] >= 3 else "일반", axis=1)  # 행마다 두 열 보고 판정
df["grade"].value_counts()  # 값별 건수 보기`
  ),
};
