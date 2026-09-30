// 초급 코드 데이터 — 키는 원본 id(방법 id 또는 스니펫 id). 규약은 lib/beginnerCode.ts 참조.
// 항목마다 [기본 방법 블록] + 같은 일을 하는 흔한 다른 방법(alt 블록, 0~3개).
// 샘플(policy 600행): 종신 212·정기 149·건강 129·암보험 110 / 60세 이상 172 / income 결측 75 / 고객 305명.
import type { BeginnerBlock } from "../beginnerCode";

/** [제목, 코드, 결과 설명] — 다른 방법(alt) 한 개 */
type Alt = [title: string, code: string, result: string];

const one = (title: string, code: string, result: string, ...alts: Alt[]): BeginnerBlock[] => [
  { title, code, result },
  ...alts.map(([t, c, r]) => ({ title: t, code: c, result: r, alt: true })),
];

export const DATA: Record<string, BeginnerBlock[]> = {
  // ── 데이터 입력 ──
  "load-csv": one(
    "CSV 읽기 — 구분자·인코딩·헤더",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 파일 이름을 내 파일로 바꾸세요
data = pd.read_csv("data.csv")  # CSV 파일을 표로 읽기
data.head()  # 앞 5행 보기`,
    "CSV 전체(샘플은 600행×16열)를 표로 읽고, 그 앞 5행이 보입니다.",
    [
      "방법 2 — 필요한 열만 읽기(usecols)",
      `import pandas as pd  # 표 다루는 도구 불러오기
cols = ["policy_id", "age", "premium"]  # 읽을 열 이름 목록
small = pd.read_csv("data.csv", usecols=cols)  # 목록에 있는 열만 읽기(빠르고 가벼움)
small.head()  # 앞 5행 보기`,
      "policy_id·age·premium 3개 열만 담긴 표의 앞 5행이 보입니다.",
    ],
    [
      "방법 3 — 구분자·인코딩·행 수 지정",
      `import pandas as pd  # 표 다루는 도구 불러오기
# 한글이 깨지면 encoding="cp949", 세미콜론 파일이면 sep=";"
part = pd.read_csv("data.csv", sep=",", encoding="utf-8", nrows=100)  # 앞 100행만 읽기
part.shape  # (행 수, 열 수)`,
      "(100, 16)이 나옵니다 — 큰 파일을 앞부분만 빠르게 확인할 때 씁니다.",
    ]
  ),
  "load-excel": one(
    "엑셀 읽기 — 시트·범위 지정",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 파일 이름을 내 파일로 바꾸세요
data = pd.read_excel("data.xlsx")  # 엑셀 첫 시트를 표로 읽기
data.head()  # 앞 5행 보기`,
    "엑셀 첫 시트 전체(샘플 600행×16열)를 읽어 앞 5행이 보입니다.",
    [
      "방법 2 — 시트 이름·열 범위 지정",
      `import pandas as pd  # 표 다루는 도구 불러오기
# sheet_name 에 시트 이름(예: "Sheet1") 또는 번호(0=첫 시트)
part = pd.read_excel("data.xlsx", sheet_name=0, usecols="A:D", nrows=10)  # A~D열, 10행만
part  # 결과 보기`,
      "A~D열(policy_id·customer_id·product·channel) 4개 열, 10행짜리 표가 보입니다.",
    ],
    [
      "방법 3 — 모든 시트를 한 번에(sheet_name=None)",
      `import pandas as pd  # 표 다루는 도구 불러오기
sheets = pd.read_excel("data.xlsx", sheet_name=None)  # {시트 이름: 표} 사전으로 읽기
list(sheets)  # 시트 이름 목록 보기`,
      "시트 이름 목록(샘플은 ['Sheet1'])이 보입니다. sheets[\"Sheet1\"]로 표를 꺼냅니다.",
    ]
  ),
  "load-sheets": one(
    "여러 시트·여러 파일 합치기",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 파일 이름을 내 파일로 바꾸세요
files = ["data.xlsx", "data.csv"]  # 합칠 파일 목록
parts = [pd.read_excel(files[0]), pd.read_csv(files[1])]  # 파일마다 읽기
all_data = pd.concat(parts, ignore_index=True)  # 위아래로 이어 붙이기
all_data.shape  # 합친 표의 (행 수, 열 수)`,
    "두 파일(각 600행)을 이어 붙여 (1200, 16)이 나옵니다.",
    [
      "방법 2 — 한 엑셀의 모든 시트 합치기",
      `import pandas as pd  # 표 다루는 도구 불러오기
sheets = pd.read_excel("data.xlsx", sheet_name=None)  # 모든 시트를 사전으로 읽기
merged = pd.concat(sheets.values(), ignore_index=True)  # 시트들을 위아래로 이어 붙이기
merged.shape  # (행 수, 열 수)`,
      "시트가 하나뿐인 샘플은 (600, 16)이 나옵니다 — 시트가 여러 개면 행이 합쳐집니다.",
    ],
    [
      "방법 3 — 출처(파일 이름) 열 붙여 합치기",
      `import pandas as pd  # 표 다루는 도구 불러오기
files = ["data.csv", "data.csv"]  # 같은 형식의 CSV 파일 목록(내 파일로 바꾸세요)
parts = [pd.read_csv(f).assign(source=f) for f in files]  # 읽으면서 출처 열 추가
pd.concat(parts, ignore_index=True)["source"].value_counts()  # 출처별 행 수`,
      "출처(파일 이름)별 행 수가 보입니다 — 합친 뒤에도 어느 파일에서 왔는지 알 수 있습니다.",
    ]
  ),
  "load-json": one(
    "JSON·중첩 구조 읽기",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 파일 이름을 내 파일로 바꾸세요
data = pd.read_json("data.json")  # JSON 파일을 표로 읽기
data.head()  # 앞 5행 보기`,
    "JSON(샘플 20건)을 표로 읽어 앞 5행이 보입니다.",
    [
      "방법 2 — 중첩 구조 펼치기(json_normalize)",
      `import pandas as pd  # 표 다루는 도구 불러오기
nested = [{"id": 1, "insured": {"name": "김", "age": 40}},  # 안쪽에 또 사전이 든 자료
          {"id": 2, "insured": {"name": "이", "age": 55}}]
pd.json_normalize(nested)  # 안쪽 항목을 insured.name 같은 열로 펼치기`,
      "id·insured.name·insured.age 3개 열, 2행짜리 표가 보입니다.",
    ]
  ),
  "load-dates": one(
    "날짜 파싱·자료형 정리",
    `import pandas as pd  # 표 다루는 도구 불러오기
raw = pd.DataFrame({"date": ["2025-01-03", "2025-02-10"]})  # 글자로 된 날짜 예시
raw["date"] = pd.to_datetime(raw["date"])  # 글자를 날짜로 바꾸기
raw["year"] = raw["date"].dt.year  # 날짜에서 연도만 꺼내기
raw  # 결과 보기`,
    "date 열이 날짜형이 되고, 연도(2025)만 꺼낸 year 열이 붙은 2행 표가 보입니다.",
    [
      "방법 2 — 형식 지정 + 잘못된 값은 빈칸(errors='coerce')",
      `import pandas as pd  # 표 다루는 도구 불러오기
s = pd.Series(["20250103", "20250210", "없음"])  # 붙여 쓴 날짜 + 잘못된 값
pd.to_datetime(s, format="%Y%m%d", errors="coerce")  # 형식대로 읽고, 못 읽으면 NaT(빈칸)`,
      "앞 두 값은 2025-01-03·2025-02-10 날짜로, '없음'은 NaT(빈 날짜)로 바뀝니다.",
    ],
    [
      "방법 3 — 연월(기간)로 묶기(dt.to_period)",
      `import pandas as pd  # 표 다루는 도구 불러오기
d = pd.to_datetime(pd.Series(["2025-01-03", "2025-01-20", "2025-02-10"]))  # 날짜로 바꾸기
d.dt.to_period("M").value_counts().sort_index()  # 월 단위로 묶어 건수 세기`,
      "2025-01은 2건, 2025-02는 1건 — 월별 집계에 바로 쓸 수 있습니다.",
    ]
  ),
  "load-manual": one(
    "직접 입력 — 소형 표 만들기",
    `import pandas as pd  # 표 다루는 도구 불러오기
rate_table = pd.DataFrame({  # 열 이름: 값 목록 으로 표 만들기
    "age_band": ["20대", "30대", "40대"],  # 첫째 열
    "rate": [0.0012, 0.0018, 0.0031],  # 둘째 열
})
rate_table  # 결과 보기`,
    "age_band·rate 2개 열, 3행짜리 요율표가 보입니다.",
    [
      "방법 2 — 행 단위 목록으로 만들기",
      `import pandas as pd  # 표 다루는 도구 불러오기
rows = [["20대", 0.0012], ["30대", 0.0018], ["40대", 0.0031]]  # 한 줄에 한 행씩
pd.DataFrame(rows, columns=["age_band", "rate"])  # 열 이름을 따로 붙이기`,
      "방법 1과 똑같은 3행 표가 보입니다 — 엑셀처럼 행 단위로 적고 싶을 때 편합니다.",
    ],
    [
      "방법 3 — CSV 글자를 그대로 붙여 넣기",
      `import io  # 글자를 파일처럼 다루는 도구
import pandas as pd  # 표 다루는 도구 불러오기
text = "age_band,rate\\n20대,0.0012\\n30대,0.0018\\n40대,0.0031"  # 쉼표로 구분한 글자
pd.read_csv(io.StringIO(text))  # 글자를 CSV 파일처럼 읽기`,
      "같은 3행 표가 보입니다 — 복사한 CSV 텍스트를 바로 표로 만들 때 씁니다.",
    ]
  ),
  "load-url": one(
    "URL에서 바로 읽기",
    `import pandas as pd  # 표 다루는 도구 불러오기
# 웹 주소면 이렇게: data = pd.read_csv("https://example.com/data.csv")
# 여기서는 같은 방식으로 내 파일을 읽어 봅니다(파일 이름을 내 파일로 바꾸세요)
data = pd.read_csv("data.csv")  # 주소 자리에 파일 이름을 넣어도 똑같이 동작
data.head()  # 앞 5행 보기`,
    "읽어 온 표의 앞 5행이 보입니다. 웹 주소를 넣으면 인터넷의 CSV를 같은 방식으로 읽습니다(엑셀은 pd.read_excel(주소))."
  ),

  // ── 선택 ──
  "select-cols": one(
    "열 선택 (한 열·여러 열)",
    `sub = df[["policy_id", "premium"]]  # 원하는 열만 골라 새 표 만들기
sub.head()  # 앞 5행 보기`,
    "policy_id·premium 2개 열만 남은 표의 앞 5행이 보입니다.",
    [
      "방법 2 — 이름 범위로(loc)",
      `sub2 = df.loc[:, "policy_id":"product"]  # policy_id부터 product까지 붙어 있는 열 전부
sub2.head()  # 앞 5행 보기`,
      "policy_id·customer_id·product 3개 열의 앞 5행이 보입니다(끝 열도 포함).",
    ],
    [
      "방법 3 — 열 번호로(iloc)",
      `sub3 = df.iloc[:, [0, 7]]  # 0번째(policy_id)와 7번째(premium) 열
sub3.head()  # 앞 5행 보기`,
      "방법 1과 같은 policy_id·premium 표가 보입니다 — 열 이름 대신 위치로 고릅니다.",
    ],
    [
      "방법 4 — 이름에 든 글자로(filter)",
      `sub4 = df.filter(like="prem")  # 이름에 'prem'이 들어간 열만
sub4.head()  # 앞 5행 보기`,
      "premium·premium_ratio 2개 열의 앞 5행이 보입니다.",
    ]
  ),
  "select-loc": one(
    "loc — 라벨·조건으로 [행, 열]",
    `sub = df.loc[df["age"] >= 60, ["policy_id", "premium"]]  # 60세 이상 행 + 두 열만
sub.head()  # 앞 5행 보기`,
    "60세 이상 계약 172행 중 앞 5행이 policy_id·premium 두 열로 보입니다.",
    [
      "방법 2 — 행 거르고 열 고르기(두 단계)",
      `sub2 = df[df["age"] >= 60][["policy_id", "premium"]]  # 먼저 행, 다음 열
sub2.shape  # (행 수, 열 수)`,
      "(172, 2) — 결과는 같지만, 값을 고쳐 넣을 때는 방법 1(loc 한 번)이 안전합니다.",
    ],
    [
      "방법 3 — query로 행, 목록으로 열",
      `sub3 = df.query("age >= 60")[["policy_id", "premium"]]  # 조건을 문장처럼
sub3.shape  # (행 수, 열 수)`,
      "(172, 2)가 나옵니다 — 방법 1과 같은 표입니다.",
    ]
  ),
  "select-iloc": one(
    "iloc — 위치(정수)로 [행, 열]",
    `front = df.iloc[:5, :3]  # 앞 5행 × 앞 3열(번호로 고르기)
front  # 결과 보기`,
    "앞 5행 × policy_id·customer_id·product 3개 열의 작은 표가 보입니다.",
    [
      "방법 2 — 떨어진 위치를 목록으로",
      `picked = df.iloc[[0, 2, 4], [0, 7]]  # 0·2·4번째 행, 0·7번째 열
picked  # 결과 보기`,
      "3행 × policy_id·premium 2개 열 표가 보입니다.",
    ],
    [
      "방법 3 — 뒤에서부터(음수 위치)",
      `last = df.iloc[-5:, -2:]  # 마지막 5행 × 마지막 2열
last  # 결과 보기`,
      "마지막 5행의 age_band·premium_ratio 열이 보입니다.",
    ]
  ),
  "select-dtypes": one(
    "자료형·이름 패턴으로 선택",
    `num = df.select_dtypes("number")  # 숫자로 된 열만 고르기
num.columns.tolist()  # 고른 열 이름 보기`,
    "age·premium·bmi·dependents·income·tenure_months·n_contracts·premium_ratio 8개 숫자 열 이름이 보입니다.",
    [
      "방법 2 — 글자(범주) 열만",
      `text = df.select_dtypes(include="object")  # 글자로 된 열만 고르기
text.columns.tolist()  # 고른 열 이름 보기`,
      "policy_id·customer_id·product·channel·region·sex·age_band 7개 글자 열이 보입니다.",
    ],
    [
      "방법 3 — 이름 패턴(정규식)으로",
      `pat = df.filter(regex="_id$")  # 이름이 '_id'로 끝나는 열만
pat.columns.tolist()  # 고른 열 이름 보기`,
      "policy_id·customer_id 두 열 이름이 보입니다.",
    ],
    [
      "방법 4 — 이름 조건을 loc에 넣기",
      `cols = df.columns[df.columns.str.startswith("prem")]  # 'prem'으로 시작하는 열 이름
df.loc[:, cols].head()  # 그 열만 앞 5행 보기`,
      "premium·premium_ratio 2개 열의 앞 5행이 보입니다.",
    ]
  ),

  // ── 조건 필터 ──
  "filter-multi": one(
    "복수 조건 (& | 와 괄호)",
    `target = df[(df["age"] >= 40) & (df["premium"] >= 100000)]  # 두 조건 모두 맞는 행(괄호 필수)
target.shape  # (행 수, 열 수)`,
    "40세 이상이면서 보험료 10만 원 이상인 계약만 남아 (134, 16)이 나옵니다.",
    [
      "방법 2 — query 문자열 조건",
      `target2 = df.query("age >= 40 and premium >= 100000")  # and·or 를 글자로 쓰기
target2.shape  # (행 수, 열 수)`,
      "방법 1과 같은 (134, 16)이 나옵니다 — 괄호·& 없이 읽기 쉽습니다.",
    ],
    [
      "방법 3 — 조건을 변수로 + loc로 열까지",
      `cond = (df["age"] >= 40) & (df["premium"] >= 100000)  # 조건을 먼저 만들어 두기
df.loc[cond, ["policy_id", "age", "premium"]].head()  # 맞는 행의 세 열만 앞 5행`,
      "조건에 맞는 134행 중 앞 5행이 policy_id·age·premium 세 열로 보입니다.",
    ],
    [
      "방법 4 — 또는(|) 조건",
      `either = df[(df["age"] >= 60) | (df["premium"] >= 200000)]  # 둘 중 하나만 맞아도
either.shape  # (행 수, 열 수)`,
      "60세 이상 '또는' 보험료 20만 원 이상인 계약 수가 (행 수, 16)으로 나옵니다.",
    ]
  ),
  "filter-query": one(
    "query — SQL처럼 읽히는 조건",
    `high = df.query("age >= 60 and premium >= 100000")  # 조건을 문장처럼 쓰기
high.shape  # (행 수, 열 수)`,
    "60세 이상이면서 보험료 10만 원 이상인 계약 62행이 남아 (62, 16)이 나옵니다.",
    [
      "방법 2 — 같은 조건을 대괄호로",
      `high2 = df[(df["age"] >= 60) & (df["premium"] >= 100000)]  # 조건마다 괄호
high2.shape  # (행 수, 열 수)`,
      "방법 1과 같은 (62, 16)이 나옵니다.",
    ],
    [
      "방법 3 — 변수 값을 @로 넣기",
      `limit = 100000  # 기준 금액을 변수로
high3 = df.query("premium >= @limit")  # @변수 이름으로 값 참조
high3.shape  # (행 수, 열 수)`,
      "보험료 10만 원 이상인 계약 수가 (행 수, 16)으로 나옵니다 — 기준값만 바꿔 재사용합니다.",
    ]
  ),
  "filter-isin": one(
    "isin — 값 목록 포함",
    `picked = df[df["product"].isin(["종신", "정기"])]  # 목록에 든 상품만 남기기
picked["product"].value_counts()  # 상품별 건수 보기`,
    "종신 212건·정기 149건(합 361행)만 남은 것이 상품별 건수로 보입니다.",
    [
      "방법 2 — query의 in",
      `picked2 = df.query("product in ['종신', '정기']")  # 목록 포함을 글자로
picked2.shape  # (행 수, 열 수)`,
      "(361, 16)이 나옵니다 — 방법 1과 같은 결과입니다.",
    ],
    [
      "방법 3 — == 조건을 |로 잇기",
      `picked3 = df[(df["product"] == "종신") | (df["product"] == "정기")]  # 값이 적을 때
picked3.shape  # (행 수, 열 수)`,
      "(361, 16) — 값이 많아지면 isin이 훨씬 짧습니다.",
    ]
  ),
  "filter-not-isin": one(
    "isin 제외 (~)",
    `others = df[~df["product"].isin(["종신", "정기"])]  # ~ 를 붙이면 목록에 없는 것만
others.shape  # (행 수, 열 수)`,
    "종신·정기를 뺀 건강·암보험 239행이 남아 (239, 16)이 나옵니다.",
    [
      "방법 2 — query의 not in",
      `others2 = df.query("product not in ['종신', '정기']")  # 목록에 없는 것만
others2.shape  # (행 수, 열 수)`,
      "방법 1과 같은 (239, 16)이 나옵니다.",
    ],
    [
      "방법 3 — 값 하나만 뺄 때는 !=",
      `no_whole = df[df["product"] != "종신"]  # 종신만 빼기
no_whole.shape  # (행 수, 열 수)`,
      "종신 212건을 뺀 (388, 16)이 나옵니다.",
    ]
  ),
  "filter-between": one(
    "between — 구간 조건",
    `mid = df[df["premium"].between(50000, 150000)]  # 5만~15만 사이(양끝 포함)
mid.shape  # (행 수, 열 수)`,
    "보험료 5만~15만 원 계약 377행이 남아 (377, 16)이 나옵니다.",
    [
      "방법 2 — 두 부등호를 &로",
      `mid2 = df[(df["premium"] >= 50000) & (df["premium"] <= 150000)]  # 이상 & 이하
mid2.shape  # (행 수, 열 수)`,
      "방법 1과 같은 (377, 16)이 나옵니다 — 한쪽만 '미만'으로 바꿀 때 편합니다.",
    ],
    [
      "방법 3 — query 연쇄 부등호",
      `mid3 = df.query("50000 <= premium <= 150000")  # 수학 식처럼 쓰기
mid3.shape  # (행 수, 열 수)`,
      "(377, 16) — 같은 결과입니다.",
    ]
  ),

  // ── 조건 분기 ──
  "branch-where": one(
    "np.where — 이항 분기(IF)",
    `import numpy as np  # 숫자 계산 도구 불러오기
df["risk"] = np.where(df["age"] >= 60, "고위험", "일반")  # 조건 맞으면 앞 값, 아니면 뒤 값
df["risk"].value_counts()  # 값별 건수 보기`,
    "새 risk 열이 생기고 일반 428건·고위험 172건으로 나뉜 건수가 보입니다.",
    [
      "방법 2 — apply + lambda(행마다 판정)",
      `risk2 = df["age"].apply(lambda a: "고위험" if a >= 60 else "일반")  # 값마다 IF
risk2.value_counts()  # 값별 건수 보기`,
      "방법 1과 같은 건수가 보입니다 — 읽기 쉽지만 큰 데이터에선 np.where가 빠릅니다.",
    ],
    [
      "방법 3 — 참/거짓을 map으로 이름 붙이기",
      `risk3 = (df["age"] >= 60).map({True: "고위험", False: "일반"})  # 참·거짓 → 이름
risk3.value_counts()  # 값별 건수 보기`,
      "같은 건수(일반 428·고위험 172)가 보입니다.",
    ],
    [
      "방법 4 — pd.cut 두 구간",
      `import pandas as pd  # 표 다루는 도구 불러오기
risk4 = pd.cut(df["age"], bins=[0, 59, 200], labels=["일반", "고위험"])  # 59세 이하 / 60세 이상
risk4.value_counts()  # 값별 건수 보기`,
      "같은 건수가 보입니다 — 구간이 여러 개로 늘어날 때 이 방식이 편합니다.",
    ]
  ),
  "branch-select": one(
    "np.select — 다중 분기(CASE)",
    `import numpy as np  # 숫자 계산 도구 불러오기
conds = [df["age"] >= 60, df["age"] >= 40]  # 위에서부터 검사할 조건들
df["age_grp"] = np.select(conds, ["60+", "40-59"], default="~39")  # 조건별 이름 붙이기
df["age_grp"].value_counts()  # 값별 건수 보기`,
    "새 age_grp 열이 생기고 60+·40-59·~39 세 그룹의 건수가 보입니다(60+는 172건).",
    [
      "방법 2 — pd.cut 경계값 + 이름",
      `import pandas as pd  # 표 다루는 도구 불러오기
grp2 = pd.cut(df["age"], bins=[0, 39, 59, 200], labels=["~39", "40-59", "60+"])  # 오른쪽 끝 포함
grp2.value_counts()  # 값별 건수 보기`,
      "방법 1과 같은 세 그룹 건수가 보입니다 — 숫자 구간 나누기는 이 방법이 가장 짧습니다.",
    ],
    [
      "방법 3 — 함수를 만들어 apply",
      `def band(a):  # 나이 하나를 받아 그룹 이름을 돌려주는 함수
    if a >= 60:  # 60세 이상
        return "60+"
    return "40-59" if a >= 40 else "~39"  # 40~59 / 그 외
df["age"].apply(band).value_counts()  # 행마다 함수 적용 후 건수`,
      "같은 세 그룹 건수가 보입니다 — 조건이 복잡할 때 함수로 풀어 쓰기 좋습니다.",
    ]
  ),
  "branch-cut": one(
    "pd.cut — 경계로 구간화",
    `import pandas as pd  # 표 다루는 도구 불러오기
df["age_cut"] = pd.cut(df["age"], bins=[0, 40, 60, 120])  # 나이를 경계값으로 구간 나누기
df["age_cut"].value_counts().sort_index()  # 구간별 건수 보기`,
    "(0, 40]·(40, 60]·(60, 120] 세 구간별 계약 건수가 순서대로 보입니다.",
    [
      "방법 2 — 구간 이름 붙이기(labels)",
      `import pandas as pd  # 표 다루는 도구 불러오기
cut2 = pd.cut(df["age"], bins=[0, 40, 60, 120], labels=["청년", "중년", "장년"])  # 구간마다 이름
cut2.value_counts().sort_index()  # 구간별 건수 보기`,
      "방법 1과 같은 건수가 '청년·중년·장년' 이름으로 보입니다.",
    ],
    [
      "방법 3 — 왼쪽 끝 포함(right=False)",
      `import pandas as pd  # 표 다루는 도구 불러오기
cut3 = pd.cut(df["age"], bins=[0, 40, 60, 120], right=False)  # [0, 40) 처럼 40은 다음 구간
cut3.value_counts().sort_index()  # 구간별 건수 보기`,
      "[0, 40)·[40, 60)·[60, 120) 구간 건수가 보입니다 — 딱 40세·60세가 옆 구간으로 옮겨 갑니다.",
    ]
  ),
  "branch-qcut": one(
    "pd.qcut — 분위수 균등 분할",
    `import pandas as pd  # 표 다루는 도구 불러오기
df["prem_q"] = pd.qcut(df["premium"], q=4)  # 보험료를 건수가 비슷한 4구간으로
df["prem_q"].value_counts()  # 구간별 건수 보기`,
    "보험료 4개 구간이 각각 약 150건씩 나뉜 것이 보입니다(구간 경계는 분위수).",
    [
      "방법 2 — 구간 이름 붙이기(labels)",
      `import pandas as pd  # 표 다루는 도구 불러오기
q2 = pd.qcut(df["premium"], q=4, labels=["Q1", "Q2", "Q3", "Q4"])  # 낮은 순서대로 이름
q2.value_counts().sort_index()  # 구간별 건수 보기`,
      "Q1~Q4 네 구간이 각각 약 150건으로 보입니다.",
    ],
    [
      "방법 3 — 분위수 경계를 직접 구해 cut",
      `import pandas as pd  # 표 다루는 도구 불러오기
edges = df["premium"].quantile([0, 0.25, 0.5, 0.75, 1])  # 0·25·50·75·100% 값
q3 = pd.cut(df["premium"], bins=edges, include_lowest=True)  # 그 경계로 나누기
q3.value_counts().sort_index()  # 구간별 건수 보기`,
      "방법 1과 같은 4구간 건수가 보입니다 — 경계값(edges)을 따로 보관·재사용할 수 있습니다.",
    ]
  ),

  // ── Join ──
  "join-inner": one(
    "Join-inner — 양쪽 다 있는 키만",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="inner")  # 양쪽에 다 있는 계약만 붙이기
result.head()  # 앞 5행 보기`,
    "계약 표 옆에 청구 정보가 붙은 표의 앞 5행이 보입니다(샘플은 모든 계약에 청구 행이 있어 600행). 겹치는 열 이름엔 _x·_y가 붙습니다.",
    [
      "방법 2 — 표.merge(메서드 형태)",
      `result2 = policy.merge(claims, on="policy_id")  # how 기본값이 inner
result2.shape  # (행 수, 열 수)`,
      "방법 1과 같은 (600, 26)이 나옵니다 — 여러 번 이어 붙일 때 줄이 짧아집니다.",
    ],
    [
      "방법 3 — join(인덱스 기준)",
      `left = policy.set_index("policy_id")  # 키를 인덱스로
right = claims.set_index("policy_id")  # 키를 인덱스로
result3 = left.join(right, how="inner", rsuffix="_c")  # 겹치는 열은 뒤에 _c
result3.shape  # (행 수, 열 수)`,
      "(600, 25)가 나옵니다 — 키가 인덱스로 들어가 열이 하나 적습니다.",
    ]
  ),
  "join-left": one(
    "Join-left — 왼쪽 전부 유지",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="left")  # 계약은 전부 두고 청구 정보 붙이기
result.head()  # 앞 5행 보기`,
    "계약 600건이 모두 남고 청구 정보가 옆에 붙은 표의 앞 5행이 보입니다(짝 없는 계약은 청구 열이 빈칸).",
    [
      "방법 2 — 표.merge(how='left')",
      `result2 = policy.merge(claims, on="policy_id", how="left")  # 같은 결과를 메서드로
result2.shape  # (행 수, 열 수)`,
      "(600, 26)이 나옵니다 — 방법 1과 같습니다.",
    ],
    [
      "방법 3 — 열 하나만 가져오기(map, VLOOKUP처럼)",
      `lookup = claims.set_index("policy_id")["claim_amt"]  # 키 → 값 조회표
amt = policy["policy_id"].map(lookup)  # 계약마다 청구금액 찾아오기
amt.head()  # 앞 5행 보기`,
      "계약 순서대로 찾아온 청구금액 앞 5개가 보입니다 — 열 하나만 붙일 땐 가장 간단합니다.",
    ]
  ),
  "join-right": one(
    "Join-right — 오른쪽 전부 유지",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="right")  # 청구는 전부 두고 계약 정보 붙이기
result.head()  # 앞 5행 보기`,
    "청구 600건이 모두 남고 계약 정보가 붙은 표의 앞 5행이 보입니다.",
    [
      "방법 2 — 순서를 바꿔 left로",
      `import pandas as pd  # 표 다루는 도구 불러오기
result2 = pd.merge(claims, policy, on="policy_id", how="left")  # 청구를 왼쪽에 두기
result2.shape  # (행 수, 열 수)`,
      "(600, 26) — 행 구성은 같고 열 순서만 청구 열이 앞에 옵니다. 실무에선 이 방식을 더 많이 씁니다.",
    ]
  ),
  "join-outer": one(
    "Join-outer — 둘 다 전부",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="outer")  # 양쪽 행을 모두 살려 붙이기
result.shape  # (행 수, 열 수)`,
    "(600, 26)이 나옵니다 — 샘플은 키가 모두 짝지어져 행이 늘지 않지만, 짝 없는 행이 있으면 빈칸을 채워 모두 남깁니다.",
    [
      "방법 2 — 출처 표시와 함께(indicator)",
      `import pandas as pd  # 표 다루는 도구 불러오기
result2 = pd.merge(policy, claims, on="policy_id", how="outer", indicator=True)  # _merge 열 추가
result2["_merge"].value_counts()  # 어느 쪽에서 왔는지 건수`,
      "both(양쪽)·left_only·right_only 건수가 보입니다 — 샘플은 both 600건입니다.",
    ]
  ),
  "join-cross": one(
    "Join-cross — 모든 조합(곱)",
    `import pandas as pd  # 표 다루는 도구 불러오기
plans = pd.DataFrame({"plan": ["기본", "고급"]})  # 첫째 표
riders = pd.DataFrame({"rider": ["암", "실손"]})  # 둘째 표
combos = pd.merge(plans, riders, how="cross")  # 모든 조합 만들기(2×2=4행)
combos  # 결과 보기`,
    "plan·rider 2개 열에 기본/고급 × 암/실손 4가지 조합이 한 행씩 보입니다.",
    [
      "방법 2 — 값 목록에서 바로(MultiIndex.from_product)",
      `import pandas as pd  # 표 다루는 도구 불러오기
idx = pd.MultiIndex.from_product([["기본", "고급"], ["암", "실손"]], names=["plan", "rider"])  # 모든 조합
idx.to_frame(index=False)  # 표로 바꾸기`,
      "방법 1과 같은 4행 조합표가 보입니다 — 표를 따로 만들지 않아도 됩니다.",
    ]
  ),
  "join-keys": one(
    "키 이름이 다를 때 (left_on·right_on)",
    `import pandas as pd  # 표 다루는 도구 불러오기
names = pd.DataFrame({"cust": [df["customer_id"][0]], "name": ["김"]})  # 키 이름이 다른 작은 표
result = pd.merge(df, names, left_on="customer_id", right_on="cust", how="left")  # 각자 키 이름 지정
result.head()  # 앞 5행 보기`,
    "계약 표 뒤에 cust·name 열이 붙은 앞 5행이 보입니다 — 첫 고객(C00188)의 계약에만 name '김'이 들어갑니다.",
    [
      "방법 2 — 이름을 맞춘 뒤 on으로",
      `import pandas as pd  # 표 다루는 도구 불러오기
names2 = names.rename(columns={"cust": "customer_id"})  # 키 이름을 같게 바꾸기
result2 = pd.merge(df, names2, on="customer_id", how="left")  # 이제 on 하나로
result2["name"].notna().sum()  # 이름이 붙은 계약 수`,
      "이름이 붙은 계약 건수가 보입니다 — 키 열이 하나만 남아 표가 깔끔합니다.",
    ]
  ),
  "join-validate": one(
    "결합 검증 (validate·indicator)",
    `import pandas as pd  # 표 다루는 도구 불러오기
result = pd.merge(policy, claims, on="policy_id", how="left", indicator=True)  # 짝 여부 표시 열 추가
result["_merge"].value_counts()  # both=짝 있음, left_only=짝 없음`,
    "짝 여부별 건수가 보입니다 — 샘플은 both 600건, left_only 0건입니다.",
    [
      "방법 2 — 관계 검사(validate)",
      `import pandas as pd  # 표 다루는 도구 불러오기
# 키가 양쪽에서 한 번씩만 나와야 함(아니면 오류로 멈춤)
checked = pd.merge(policy, claims, on="policy_id", how="left", validate="one_to_one")
checked.shape  # (행 수, 열 수)`,
      "(600, 26)이 나옵니다 — 키가 중복돼 행이 불어날 위험이 있으면 여기서 MergeError로 알려 줍니다.",
    ],
    [
      "방법 3 — 합치기 전 키 중복 직접 확인",
      `dup_p = policy["policy_id"].duplicated().sum()  # 계약 표의 중복 키 수
dup_c = claims["policy_id"].duplicated().sum()  # 청구 표의 중복 키 수
dup_p, dup_c  # 둘 다 0이면 1:1`,
      "(0, 0)이 나옵니다 — 두 표 모두 키가 중복 없이 한 번씩입니다.",
    ]
  ),

  // ── Concat ──
  "concat-row": one(
    "Concat-행 — 위아래로 쌓기(세로)",
    `import pandas as pd  # 표 다루는 도구 불러오기
stacked = pd.concat([df.head(3), df.tail(3)], ignore_index=True)  # 두 표를 위아래로 쌓기
stacked  # 결과 보기`,
    "앞 3행과 뒤 3행이 이어진 6행 표가 보이고, 행 번호는 0~5로 새로 매겨집니다.",
    [
      "방법 2 — 원래 행 번호 유지",
      `import pandas as pd  # 표 다루는 도구 불러오기
kept = pd.concat([df.head(3), df.tail(3)])  # ignore_index 없이
kept.index.tolist()  # 행 번호 보기`,
      "[0, 1, 2, 597, 598, 599] — 원래 행 번호가 그대로 남습니다.",
    ],
    [
      "방법 3 — 출처 이름표 붙이기(keys)",
      `import pandas as pd  # 표 다루는 도구 불러오기
tagged = pd.concat([df.head(2), df.tail(2)], keys=["앞", "뒤"])  # 표마다 이름표
tagged[["policy_id", "premium"]]  # 두 열만 보기`,
      "행 번호 앞에 '앞'·'뒤' 이름표가 붙은 4행 표가 보입니다.",
    ]
  ),
  "concat-col": one(
    "Concat-열 — 나란히 붙이기(가로)",
    `import pandas as pd  # 표 다루는 도구 불러오기
joined = pd.concat([df[["policy_id"]], df[["premium"]]], axis=1)  # axis=1 은 옆으로 붙이기
joined.head()  # 앞 5행 보기`,
    "policy_id·premium 2개 열이 나란히 붙은 표의 앞 5행이 보입니다.",
    [
      "방법 2 — join(행 번호 기준)",
      `joined2 = df[["policy_id"]].join(df[["premium"]])  # 같은 행 번호끼리 옆으로
joined2.head()  # 앞 5행 보기`,
      "방법 1과 같은 2개 열 표가 보입니다.",
    ],
    [
      "방법 3 — assign으로 열 추가",
      `joined3 = df[["policy_id"]].assign(premium=df["premium"])  # 새 열 이름=값
joined3.head()  # 앞 5행 보기`,
      "같은 표가 보입니다 — 열 한두 개를 덧붙일 땐 이 방식이 짧습니다.",
    ]
  ),

  // ── Split ──
  "split-str-cols": one(
    "Split-열분리 — 한 열을 여러 열로",
    `import pandas as pd  # 표 다루는 도구 불러오기
s = pd.DataFrame({"full": ["서울-강남", "부산-해운대"]})  # 예시 표
s[["시도", "시군구"]] = s["full"].str.split("-", expand=True)  # '-' 기준으로 두 열로 나누기
s  # 결과 보기`,
    "full 옆에 시도(서울·부산)·시군구(강남·해운대) 열이 생긴 2행 표가 보입니다.",
    [
      "방법 2 — 필요한 조각만 꺼내기(.str[0])",
      `sido = s["full"].str.split("-").str[0]  # 나눈 뒤 첫 조각만
sido  # 결과 보기`,
      "서울·부산만 담긴 열이 보입니다 — 한 조각만 필요할 때 간단합니다.",
    ],
    [
      "방법 3 — 패턴으로 뽑기(str.extract)",
      `parts = s["full"].str.extract("([^-]+)-([^-]+)")  # '-' 앞뒤 글자를 각각 한 열로
parts  # 결과 보기`,
      "0·1 두 열(서울/강남, 부산/해운대)로 나뉜 표가 보입니다 — 형식이 복잡할 때 씁니다.",
    ]
  ),
  "split-explode": one(
    "Split-explode — 리스트 열을 여러 행으로",
    `import pandas as pd  # 표 다루는 도구 불러오기
s = pd.DataFrame({"id": [1, 2], "riders": [["암", "실손"], ["종신"]]})  # 한 칸에 여러 값
s.explode("riders")  # 값 하나씩 한 행으로 펼치기`,
    "id 1은 암·실손 두 행, id 2는 종신 한 행 — 총 3행 표가 보입니다.",
    [
      "방법 2 — 쉼표 글자를 나눠서 펼치기",
      `import pandas as pd  # 표 다루는 도구 불러오기
t = pd.DataFrame({"id": [1, 2], "riders": ["암,실손", "종신"]})  # 쉼표로 이어 쓴 글자
t.assign(riders=t["riders"].str.split(",")).explode("riders")  # 나눠서 목록 → 행으로`,
      "방법 1과 같은 3행 표가 보입니다 — 엑셀에서 가져온 '쉼표 목록'에 자주 씁니다.",
    ]
  ),
  "split-chunks": one(
    "Split-청크 — 행을 n등분",
    `size = len(df) // 3 + 1  # 한 조각의 행 수
parts = [df[i:i + size] for i in range(0, len(df), size)]  # 앞에서부터 잘라 3조각
[len(p) for p in parts]  # 조각별 행 수 보기`,
    "[201, 201, 198] — 600행이 세 조각으로 나뉜 행 수가 보입니다.",
    [
      "방법 2 — 조각 번호로 groupby",
      `import numpy as np  # 숫자 계산 도구 불러오기
chunk_no = np.arange(len(df)) // 200  # 행마다 조각 번호(0,0,…,1,1,…)
[len(g) for _, g in df.groupby(chunk_no)]  # 번호별로 묶어 행 수 보기`,
      "[200, 200, 200] — 200행씩 세 조각입니다. 조각마다 저장·처리할 때 편합니다.",
    ]
  ),
  "split-mask": one(
    "Split-조건분할 — 두 그룹으로 나누기",
    `seniors = df[df["age"] >= 60]  # 조건에 맞는 그룹
others = df[df["age"] < 60]  # 나머지 그룹
len(seniors), len(others)  # 두 그룹의 행 수`,
    "(172, 428) — 60세 이상 172행과 나머지 428행으로 나뉩니다.",
    [
      "방법 2 — 조건을 한 번 만들고 ~로 반대",
      `mask = df["age"] >= 60  # 조건을 변수로
seniors2, others2 = df[mask], df[~mask]  # 맞는 쪽 / 반대쪽
len(seniors2), len(others2)  # 두 그룹의 행 수`,
      "(172, 428) — 조건을 한 곳에서만 고치면 되어 실수가 줄어듭니다.",
    ],
    [
      "방법 3 — groupby로 참/거짓 두 묶음",
      `split = dict(list(df.groupby(df["age"] >= 60)))  # {False: 표, True: 표}
len(split[True]), len(split[False])  # 두 그룹의 행 수`,
      "(172, 428)이 나옵니다.",
    ]
  ),
  "split-groups": one(
    "Split-그룹별 — dict로 그룹 분리",
    `groups = dict(list(df.groupby("product")))  # 상품별로 표를 나눠 사전에 담기
{k: len(g) for k, g in groups.items()}  # 그룹별 행 수 보기`,
    "건강 129·암보험 110·정기 149·종신 212 — 상품별 표의 행 수가 사전으로 보입니다.",
    [
      "방법 2 — 사전 만들기(dict comprehension)",
      `groups2 = {k: g for k, g in df.groupby("product")}  # 이름: 표
groups2["종신"].shape  # 종신 표의 (행 수, 열 수)`,
      "종신 표의 크기(212행)가 보입니다.",
    ],
    [
      "방법 3 — 필요한 그룹 하나만(get_group)",
      `whole = df.groupby("product").get_group("종신")  # 종신 그룹만 꺼내기
whole.shape  # (행 수, 열 수)`,
      "종신 212행 표의 크기가 보입니다 — df[df[\"product\"] == \"종신\"]와 같습니다.",
    ]
  ),

  // ── Groupby ──
  "groupby-sum": one(
    "Groupby-sum — 그룹별 합계",
    `df.groupby("product")["premium"].sum()  # 상품별 보험료 합계`,
    "건강·암보험·정기·종신 네 상품의 보험료 합계가 한 줄씩 보입니다.",
    [
      "방법 2 — agg('sum')",
      `df.groupby("product")["premium"].agg("sum")  # 집계 이름을 글자로`,
      "방법 1과 같은 합계가 보입니다 — 'mean'·'max'로 바꿔 쓰기 쉽습니다.",
    ],
    [
      "방법 3 — 표 형태로(as_index=False)",
      `df.groupby("product", as_index=False)["premium"].sum()  # 상품도 일반 열로`,
      "product·premium 두 열의 4행 표가 보입니다 — 엑셀로 내보내거나 merge하기 좋습니다.",
    ],
    [
      "방법 4 — pivot_table",
      `import pandas as pd  # 표 다루는 도구 불러오기
pd.pivot_table(df, index="product", values="premium", aggfunc="sum")  # 엑셀 피벗처럼`,
      "같은 합계가 한 열짜리 표로 보입니다.",
    ]
  ),
  "groupby-mean": one(
    "Groupby-mean — 그룹별 평균",
    `df.groupby("product")["premium"].mean()  # 상품별 보험료 평균`,
    "네 상품의 평균 보험료가 한 줄씩 보입니다.",
    [
      "방법 2 — 평균과 건수를 함께(agg 목록)",
      `df.groupby("product")["premium"].agg(["mean", "count"])  # 평균·건수 두 열`,
      "mean·count 두 열의 4행 표가 보입니다 — 평균이 몇 건으로 계산됐는지 같이 봅니다.",
    ],
    [
      "방법 3 — pivot_table(기본이 평균)",
      `import pandas as pd  # 표 다루는 도구 불러오기
pd.pivot_table(df, index="product", values="premium")  # aggfunc 생략 = 평균`,
      "방법 1과 같은 평균이 표로 보입니다.",
    ],
    [
      "방법 4 — 반올림 + 정렬",
      `df.groupby("product")["premium"].mean().round(0).sort_values(ascending=False)  # 큰 순서`,
      "평균 보험료를 원 단위로 반올림해 큰 상품부터 보여 줍니다.",
    ]
  ),
  "groupby-count": one(
    "Groupby-count — 그룹별 건수",
    `df.groupby("product").size()  # 상품별 행(계약) 수`,
    "건강 129·암보험 110·정기 149·종신 212 — 상품별 계약 수가 보입니다.",
    [
      "방법 2 — value_counts(많은 순)",
      `df["product"].value_counts()  # 값별 건수, 많은 순서로`,
      "종신 212부터 많은 순서로 같은 건수가 보입니다 — 한 열 건수는 이 방법이 가장 짧습니다.",
    ],
    [
      "방법 3 — count(빈칸 제외 건수)",
      `df.groupby("product")["income"].count()  # income 이 채워진 행만 세기`,
      "상품별로 income이 있는 계약 수가 보입니다 — size()와 달리 결측(빈칸)은 빠집니다.",
    ],
    [
      "방법 4 — 두 기준 교차 건수(crosstab)",
      `import pandas as pd  # 표 다루는 도구 불러오기
pd.crosstab(df["product"], df["channel"])  # 상품 × 채널 건수표`,
      "상품(행) × 채널(열: 다이렉트·방카·설계사) 건수표가 보입니다.",
    ]
  ),
  "groupby-agg": one(
    "Groupby-agg — 이름 있는 다중 집계",
    `df.groupby("product")["premium"].agg(["count", "mean", "sum"])  # 건수·평균·합계를 한 번에`,
    "상품별 count·mean·sum 세 열의 4행 요약표가 보입니다.",
    [
      "방법 2 — 결과 열 이름 직접 짓기(named agg)",
      `df.groupby("product").agg(건수=("premium", "count"), 평균보험료=("premium", "mean"))  # 새 이름=(열, 집계)`,
      "건수·평균보험료라는 한글 열 이름의 요약표가 보입니다.",
    ],
    [
      "방법 3 — 열마다 다른 집계(사전)",
      `df.groupby("product").agg({"premium": "mean", "age": "max"})  # 보험료는 평균, 나이는 최댓값`,
      "premium(평균)·age(최댓값) 두 열의 요약표가 보입니다.",
    ],
    [
      "방법 4 — pivot_table 여러 집계",
      `import pandas as pd  # 표 다루는 도구 불러오기
pd.pivot_table(df, index="product", values="premium", aggfunc=["count", "mean", "sum"])  # 피벗으로`,
      "방법 1과 같은 숫자가 두 줄짜리 열 제목으로 보입니다.",
    ]
  ),
  "groupby-transform": one(
    "Groupby-transform — 행 수 유지 파생",
    `df["grp_mean"] = df.groupby("product")["premium"].transform("mean")  # 각 행에 자기 상품 평균 붙이기
df[["product", "premium", "grp_mean"]].head()  # 앞 5행 보기`,
    "600행 그대로, 행마다 자기 상품의 평균 보험료(grp_mean)가 붙은 앞 5행이 보입니다.",
    [
      "방법 2 — 평균표를 map으로 찾아 붙이기",
      `means = df.groupby("product")["premium"].mean()  # 상품별 평균표
grp_mean2 = df["product"].map(means)  # 행마다 자기 상품 평균 찾아오기
grp_mean2.head()  # 앞 5행 보기`,
      "방법 1의 grp_mean과 같은 값 앞 5개가 보입니다.",
    ],
    [
      "방법 3 — 평균표를 merge로 붙이기",
      `means = df.groupby("product", as_index=False)["premium"].mean()  # 상품·평균 표
means = means.rename(columns={"premium": "grp_mean3"})  # 열 이름 바꾸기
df[["product", "premium"]].merge(means, on="product").head()  # 상품 기준으로 붙이기`,
      "product·premium·grp_mean3 세 열의 앞 5행이 보입니다(merge라 행 순서는 달라질 수 있음).",
    ]
  ),
  "groupby-filter": one(
    "Groupby-filter — 그룹째 거르기",
    `big = df.groupby("product").filter(lambda g: len(g) >= 130)  # 130건 이상인 상품만 통째로 남기기
big["product"].value_counts()  # 남은 상품별 건수`,
    "130건 이상인 종신 212건·정기 149건만 남은 것이 보입니다(건강 129·암보험 110은 빠짐).",
    [
      "방법 2 — 건수표 + isin",
      `counts = df["product"].value_counts()  # 상품별 건수
keep = counts[counts >= 130].index  # 130건 이상 상품 이름
df[df["product"].isin(keep)]["product"].value_counts()  # 그 상품 행만 남기기`,
      "방법 1과 같은 종신 212·정기 149가 보입니다 — 어떤 상품이 남는지 keep으로 먼저 볼 수 있습니다.",
    ],
    [
      "방법 3 — transform('size')로 행마다 그룹 크기",
      `size = df.groupby("product")["product"].transform("size")  # 각 행에 자기 그룹 건수
df[size >= 130].shape  # (행 수, 열 수)`,
      "(361, …) — 종신·정기 361행이 남습니다. 큰 데이터에선 filter보다 빠릅니다.",
    ]
  ),

  // ── 피벗 ──
  "pivot-table": one(
    "pivot_table — 교차 요약표",
    `import pandas as pd  # 표 다루는 도구 불러오기
pd.pivot_table(df, index="product", columns="channel", values="premium")  # 상품×채널 평균 보험료`,
    "상품(행) × 채널(열: 다이렉트·방카·설계사) 칸마다 평균 보험료가 든 4×3 표가 보입니다.",
    [
      "방법 2 — groupby 두 기준 + unstack",
      `df.groupby(["product", "channel"])["premium"].mean().unstack()  # 두 번째 기준을 열로 펼치기`,
      "방법 1과 같은 4×3 평균표가 보입니다.",
    ],
    [
      "방법 3 — crosstab에 값·집계 지정",
      `import pandas as pd  # 표 다루는 도구 불러오기
pd.crosstab(df["product"], df["channel"], values=df["premium"], aggfunc="mean")  # 교차표로 평균`,
      "같은 4×3 평균표가 보입니다.",
    ],
    [
      "방법 4 — 합계 + 총계 행·열(margins)",
      `import pandas as pd  # 표 다루는 도구 불러오기
pd.pivot_table(df, index="product", columns="channel", values="premium", aggfunc="sum", margins=True)  # All 행·열 추가`,
      "보험료 합계표에 전체 합(All) 행과 열이 붙어 5×4 표로 보입니다.",
    ]
  ),
  "pivot-melt": one(
    "melt — wide를 long으로",
    `import pandas as pd  # 표 다루는 도구 불러오기
wide = pd.DataFrame({"지점": ["A", "B"], "1월": [10, 20], "2월": [30, 40]})  # 옆으로 긴 표
wide.melt(id_vars="지점")  # 월 열들을 세로로 내리기`,
    "지점·variable(월)·value 세 열의 4행 표(A-1월, B-1월, A-2월, B-2월)가 보입니다.",
    [
      "방법 2 — 새 열 이름 붙이기",
      `long = pd.melt(wide, id_vars="지점", var_name="월", value_name="건수")  # 열 이름 지정
long  # 결과 보기`,
      "지점·월·건수 세 열의 4행 표가 보입니다 — 이름이 분명해 뒤 작업이 편합니다.",
    ],
    [
      "방법 3 — stack(인덱스 기준으로 쌓기)",
      `wide.set_index("지점").stack()  # 지점을 기준으로 월 열을 세로로 쌓기`,
      "(지점, 월) 두 단계 행 이름에 값이 붙은 4개 값이 보입니다. reset_index()로 표가 됩니다.",
    ]
  ),

  // ── 결측치 ──
  "missing-check": one(
    "결측 파악 — 열별 개수·비율",
    `df.isna().sum()  # 열마다 빈칸(결측) 개수`,
    "열마다 빈칸 수가 보입니다 — 샘플은 income만 75개, 나머지는 0입니다.",
    [
      "방법 2 — 비율로 보기",
      `(df.isna().mean() * 100).round(1)  # 열마다 빈칸 비율(%)`,
      "income이 12.5%로 보입니다 — 비율이 크면 지우기보다 채우기를 고려합니다.",
    ],
    [
      "방법 3 — 빈칸 있는 열만 추리기",
      `miss = df.isna().sum()  # 열별 빈칸 수
miss[miss > 0]  # 0보다 큰 열만`,
      "income 75 한 줄만 보입니다 — 열이 많을 때 한눈에 봅니다.",
    ]
  ),
  "missing-drop": one(
    "dropna — 핵심 열 결측 행 삭제",
    `clean = df.dropna(subset=["income"])  # income 이 빈 행 지우기
clean.shape  # 남은 (행 수, 열 수)`,
    "income 빈칸 75행이 빠지고 (525, 16)이 남습니다.",
    [
      "방법 2 — notna 조건으로 거르기",
      `clean2 = df[df["income"].notna()]  # income 이 채워진 행만
clean2.shape  # 남은 (행 수, 열 수)`,
      "방법 1과 같은 (525, 16)이 나옵니다.",
    ],
    [
      "방법 3 — 어느 열이든 빈칸이면 삭제",
      `clean3 = policy.dropna()  # 모든 열 검사(빈칸이 하나라도 있으면 삭제)
clean3.shape  # 남은 (행 수, 열 수)`,
      "샘플은 빈칸이 income뿐이라 (525, 16)으로 같지만, 실제 데이터에선 훨씬 많이 지워질 수 있습니다.",
    ]
  ),
  "missing-fill": one(
    "fillna — 중앙값·범주 대체",
    `filled = df["income"].fillna(df["income"].median())  # 빈칸을 중앙값으로 채우기
filled.isna().sum()  # 남은 빈칸 수(0이면 성공)`,
    "0이 나옵니다 — income 빈칸 75개가 모두 중앙값으로 채워졌습니다(원래 표는 그대로).",
    [
      "방법 2 — 고정값(0)으로 채우기",
      `filled2 = df["income"].fillna(0)  # 빈칸을 0으로
(filled2 == 0).sum()  # 0이 된 칸 수`,
      "75가 나옵니다 — '없음=0'이 맞는 열(예: 청구 건수)에만 씁니다.",
    ],
    [
      "방법 3 — 숫자 열 전체를 각 열 평균으로",
      `num = df.select_dtypes("number")  # 숫자 열만
filled3 = num.fillna(num.mean())  # 열마다 자기 평균으로 채우기
filled3.isna().sum().sum()  # 표 전체 남은 빈칸 수`,
      "0이 나옵니다 — 여러 열을 한 번에 채울 때 씁니다.",
    ],
    [
      "방법 4 — 바로 앞 값으로 채우기(ffill)",
      `filled4 = df["income"].ffill()  # 빈칸을 위쪽 값으로
filled4.head()  # 앞 5행 보기`,
      "빈칸이 바로 위 행의 값으로 채워진 앞 5개가 보입니다 — 시간 순서 데이터에 적합합니다.",
    ]
  ),
  "missing-group-fill": one(
    "그룹별 중앙값으로 대체",
    `med = df.groupby("age_band")["income"].transform("median")  # 각 행에 자기 연령대 중앙값
filled = df["income"].fillna(med)  # 빈칸을 그 값으로 채우기
filled.isna().sum()  # 남은 빈칸 수`,
    "0이 나옵니다 — 빈칸이 전체 중앙값이 아니라 같은 연령대의 중앙값으로 채워졌습니다.",
    [
      "방법 2 — transform 안에서 바로 채우기",
      `filled2 = df.groupby("age_band")["income"].transform(lambda s: s.fillna(s.median()))  # 그룹마다 채우기
filled2.isna().sum()  # 남은 빈칸 수`,
      "0이 나옵니다 — 방법 1과 같은 값을 한 줄로 만듭니다.",
    ]
  ),

  // ── 정렬·중복·순위 ──
  "sort-values": one(
    "sort_values — 복수 키 정렬",
    `out = df.sort_values("premium", ascending=False)  # 보험료 큰 순서로 정렬
out[["policy_id", "premium"]].head()  # 앞 5행 보기`,
    "보험료가 가장 큰 계약 5건(최대 431,500원부터)이 보입니다.",
    [
      "방법 2 — 여러 기준으로 정렬",
      `out2 = df.sort_values(["product", "premium"], ascending=[True, False])  # 상품 오름차순, 그 안에서 보험료 내림차순
out2[["product", "premium"]].head()  # 앞 5행 보기`,
      "가나다순 첫 상품(건강) 안에서 보험료 큰 순 5건이 보입니다.",
    ],
    [
      "방법 3 — 상위 N만 바로(nlargest)",
      `df.nlargest(5, "premium")[["policy_id", "premium"]]  # 보험료 상위 5건`,
      "방법 1과 같은 5건이 보입니다 — 전체 정렬 없이 상위 N만 뽑아 빠릅니다.",
    ]
  ),
  "drop-duplicates": one(
    "drop_duplicates — 중복 제거",
    `dedup = df.drop_duplicates(subset=["customer_id"])  # 같은 고객은 첫 행만 남기기
dedup.shape  # 남은 (행 수, 열 수)`,
    "고객 305명당 한 행씩 남아 (305, 16)이 나옵니다.",
    [
      "방법 2 — 마지막 행을 남기기(keep='last')",
      `dedup2 = df.drop_duplicates(subset=["customer_id"], keep="last")  # 같은 고객은 마지막 행
dedup2.shape  # 남은 (행 수, 열 수)`,
      "(305, 16) — 행 수는 같고, 고객마다 남는 행이 마지막 것입니다.",
    ],
    [
      "방법 3 — 중복 개수 먼저 세기(duplicated)",
      `df["customer_id"].duplicated().sum()  # 앞에 이미 나온 고객 수(지워질 행 수)`,
      "295가 나옵니다 — 지우기 전에 몇 행이 중복인지 확인합니다.",
    ],
    [
      "방법 4 — groupby().head(1)",
      `df.groupby("customer_id").head(1).shape  # 고객마다 첫 행만`,
      "(305, 16) — 방법 1과 같은 결과입니다.",
    ]
  ),
  "latest-one": one(
    "그룹별 최신 1건 (정렬+dedup)",
    `latest = df.sort_values("tenure_months").drop_duplicates("customer_id", keep="first")  # 가입기간 짧은(최신) 순 → 고객별 첫 행
latest.shape  # 남은 (행 수, 열 수)`,
    "고객 305명마다 가장 최근(가입기간이 가장 짧은) 계약 1건씩, (305, 16)이 나옵니다.",
    [
      "방법 2 — idxmin으로 행 위치 찾기",
      `rows = df.groupby("customer_id")["tenure_months"].idxmin()  # 고객별 최소 가입기간 행 번호
latest2 = df.loc[rows]  # 그 행들만 꺼내기
latest2.shape  # (행 수, 열 수)`,
      "(305, 16) — 방법 1과 같은 계약들이 뽑힙니다.",
    ],
    [
      "방법 3 — 정렬 후 groupby().head(1)",
      `latest3 = df.sort_values("tenure_months").groupby("customer_id").head(1)  # 고객별 첫 행
latest3.shape  # (행 수, 열 수)`,
      "(305, 16) — head(2)로 바꾸면 고객별 최신 2건을 뽑습니다.",
    ]
  ),
  "rank-topn": one(
    "순위·상위 N (rank·nlargest)",
    `df.nlargest(10, "premium")[["policy_id", "premium"]]  # 보험료 상위 10건`,
    "보험료 상위 10건이 큰 순서로 policy_id·premium 두 열에 보입니다.",
    [
      "방법 2 — 정렬 후 head",
      `df.sort_values("premium", ascending=False).head(10)[["policy_id", "premium"]]  # 큰 순 정렬 → 앞 10건`,
      "방법 1과 같은 10건이 보입니다.",
    ],
    [
      "방법 3 — 순위 열 만들기(rank)",
      `prem_rank = df["premium"].rank(ascending=False, method="min")  # 큰 값이 1등, 동점은 같은 등수
prem_rank.head()  # 앞 5행의 순위 보기`,
      "앞 5개 계약의 보험료 순위(1~600)가 보입니다.",
    ],
    [
      "방법 4 — 그룹별 상위 N",
      `top3 = df.sort_values("premium", ascending=False).groupby("product").head(3)  # 상품마다 상위 3건
top3[["product", "premium"]]  # 결과 보기`,
      "네 상품 × 3건 = 12행, 상품마다 보험료가 큰 계약 3건씩 보입니다.",
    ]
  ),

  // ── apply·map ──
  "map-dict": one(
    "map — 사전으로 코드→이름",
    `code_map = {"설계사": "FC", "방카": "BA", "다이렉트": "DM"}  # 바꿀 값 짝 목록
df["channel_cd"] = df["channel"].map(code_map)  # 사전대로 값 바꾸기(없는 값은 빈칸)
df["channel_cd"].value_counts()  # 값별 건수 보기`,
    "새 channel_cd 열에 FC 318·BA 177·DM 105 건수가 보입니다.",
    [
      "방법 2 — replace(사전에 없는 값은 그대로)",
      `part_map = {"설계사": "FC"}  # 일부만 바꾸기
df["channel"].replace(part_map).value_counts()  # 나머지는 원래 값 유지`,
      "FC 318·방카 177·다이렉트 105 — map과 달리 사전에 없는 값이 빈칸이 되지 않습니다.",
    ],
    [
      "방법 3 — apply + 사전 get(기본값 지정)",
      `df["channel"].apply(lambda v: code_map.get(v, "기타")).value_counts()  # 없으면 '기타'`,
      "FC·BA·DM 건수가 보입니다 — 사전에 없는 값은 '기타'로 채워집니다.",
    ]
  ),
  "apply-row": one(
    "apply(axis=1) — 여러 열 조합",
    `df["grade"] = df.apply(lambda r: "주의" if r["age"] >= 65 and r["n_contracts"] >= 3 else "일반", axis=1)  # 행마다 두 열 보고 판정
df["grade"].value_counts()  # 값별 건수 보기`,
    "새 grade 열에 65세 이상이면서 계약 3건 이상인 '주의'와 나머지 '일반' 건수가 보입니다.",
    [
      "방법 2 — np.where + & (빠른 벡터 계산)",
      `import numpy as np  # 숫자 계산 도구 불러오기
cond = (df["age"] >= 65) & (df["n_contracts"] >= 3)  # 두 조건을 한꺼번에
np.where(cond, "주의", "일반")[:5]  # 앞 5개 판정 보기`,
      "앞 5개 판정 결과가 보입니다 — apply와 같은 판정을 훨씬 빠르게 계산합니다.",
    ],
    [
      "방법 3 — 기본값 후 loc로 덮어쓰기",
      `import pandas as pd  # 표 다루는 도구 불러오기
grade3 = pd.Series("일반", index=df.index)  # 모두 '일반'으로 시작
grade3.loc[(df["age"] >= 65) & (df["n_contracts"] >= 3)] = "주의"  # 조건 맞는 행만 바꾸기
grade3.value_counts()  # 값별 건수 보기`,
      "방법 1과 같은 주의·일반 건수가 보입니다.",
    ]
  ),
};
