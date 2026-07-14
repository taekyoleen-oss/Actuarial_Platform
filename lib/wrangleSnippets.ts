// 데이터 핸들링(pandas) 세분화 스니펫 — /datalab 파이썬 실행기의 셀별 콤보박스용.
// '분석 방법 사전'처럼 통짜로 불러오지 않고, 작업 중 필요할 때 셀에 조각을 삽입한다.
// 대부분 샘플(df=policy)·소형 인라인 프레임으로 바로 실행되며, 실제 데이터면 열
// 이름만 바꾸면 된다. 그룹은 콤보박스 optgroup, 각 항목은 한 조각(삽입 단위).

export interface WrangleSnippet {
  id: string;
  /** 콤보박스에 보이는 이름 */
  label: string;
  /** 셀에 삽입되는 코드 조각 */
  code: string;
}

export interface WrangleSnippetGroup {
  id: string;
  /** optgroup 라벨 */
  label: string;
  snippets: WrangleSnippet[];
}

export const WRANGLE_SNIPPET_GROUPS: WrangleSnippetGroup[] = [
  {
    id: "select",
    label: "선택 (loc·iloc·열)",
    snippets: [
      {
        id: "select-cols",
        label: "열 선택 (한 열·여러 열)",
        code: `# 한 열은 Series, 여러 열은 대괄호 두 겹(DataFrame)
s = df["premium"]                      # Series
sub = df[["policy_id", "premium"]]     # DataFrame
print(sub.head())`,
      },
      {
        id: "select-loc",
        label: "loc — 라벨·조건으로 [행, 열]",
        code: `# loc: 라벨 기준 [행, 열] (슬라이스 끝 포함)
print(df.loc[df["age"] >= 60, ["policy_id", "premium"]].head())`,
      },
      {
        id: "select-iloc",
        label: "iloc — 위치(정수)로 [행, 열]",
        code: `# iloc: 위치 기준 [행, 열] (슬라이스 끝 제외)
print(df.iloc[:5, :3])       # 앞 5행 × 앞 3열
print(df.iloc[-10:])         # 마지막 10행`,
      },
      {
        id: "select-dtypes",
        label: "자료형·이름 패턴으로 선택",
        code: `num = df.select_dtypes("number")     # 수치형 열만
amt = df.filter(like="_amt")         # 이름에 _amt 든 열
print(num.columns.tolist())`,
      },
    ],
  },
  {
    id: "filter",
    label: "조건 필터",
    snippets: [
      {
        id: "filter-multi",
        label: "복수 조건 (& | 와 괄호)",
        code: `# 각 조건을 괄호로 감싸고 & (그리고) · | (또는)
target = df[(df["age"] >= 40) & (df["age"] < 60) & (df["product"] == "종신")]
print(target.shape)`,
      },
      {
        id: "filter-query",
        label: "query — SQL처럼 읽히는 조건",
        code: `# 열 이름을 따옴표 없이, 외부 변수는 @변수
min_prem = 100_000
high = df.query("age >= 60 and premium >= @min_prem")
print(len(high), "건 /", len(df), "건")`,
      },
      {
        id: "filter-isin",
        label: "isin — 값 목록 포함",
        code: `picked = df[df["product"].isin(["종신", "정기", "암보험"])]
print(picked["product"].value_counts())`,
      },
      {
        id: "filter-not-isin",
        label: "isin 제외 (~)",
        code: `others = df[~df["product"].isin(["종신", "정기"])]
print(others.shape)`,
      },
      {
        id: "filter-between",
        label: "between — 구간 조건",
        code: `mid = df[df["premium"].between(50_000, 150_000)]   # 양끝 포함
print(mid.shape)`,
      },
    ],
  },
  {
    id: "branch",
    label: "조건 분기 (where·select·cut)",
    snippets: [
      {
        id: "branch-where",
        label: "np.where — 이항 분기(IF)",
        code: `import numpy as np
df["risk"] = np.where(df["age"] >= 60, "고위험", "일반")
print(df["risk"].value_counts())`,
      },
      {
        id: "branch-select",
        label: "np.select — 다중 분기(CASE)",
        code: `import numpy as np
# 위에서부터 첫 번째 참인 조건이 이긴다(순서 중요)
conds = [df["age"] >= 60, df["age"] >= 40]
labels = ["60+", "40-59"]
df["age_grp"] = np.select(conds, labels, default="~39")
print(df["age_grp"].value_counts())`,
      },
      {
        id: "branch-cut",
        label: "pd.cut — 경계로 구간화",
        code: `import pandas as pd
df["age_band"] = pd.cut(df["age"], bins=[0, 30, 40, 50, 60, 120],
                        labels=["~29", "30대", "40대", "50대", "60+"], right=False)
print(df["age_band"].value_counts().sort_index())`,
      },
      {
        id: "branch-qcut",
        label: "pd.qcut — 분위수 균등 분할",
        code: `import pandas as pd
df["prem_q"] = pd.qcut(df["premium"], q=4, labels=["Q1", "Q2", "Q3", "Q4"])
print(df["prem_q"].value_counts())`,
      },
    ],
  },
  {
    id: "join",
    label: "Join (merge) — 키로 옆 결합",
    snippets: [
      {
        id: "join-inner",
        label: "Join-inner — 양쪽 다 있는 키만",
        code: `import pandas as pd
# 데모 두 표(실제로는 각자의 df로 대체)
left = pd.DataFrame({"id": [1, 2, 3], "amt": [100, 200, 300]})
right = pd.DataFrame({"id": [2, 3, 4], "grade": ["A", "B", "C"]})

print(left.merge(right, on="id", how="inner"))   # id 2,3만`,
      },
      {
        id: "join-left",
        label: "Join-left — 왼쪽 전부 유지",
        code: `import pandas as pd
left = pd.DataFrame({"id": [1, 2, 3], "amt": [100, 200, 300]})
right = pd.DataFrame({"id": [2, 3, 4], "grade": ["A", "B", "C"]})

print(left.merge(right, on="id", how="left"))    # id 1은 grade=NaN`,
      },
      {
        id: "join-right",
        label: "Join-right — 오른쪽 전부 유지",
        code: `import pandas as pd
left = pd.DataFrame({"id": [1, 2, 3], "amt": [100, 200, 300]})
right = pd.DataFrame({"id": [2, 3, 4], "grade": ["A", "B", "C"]})

print(left.merge(right, on="id", how="right"))   # id 4는 amt=NaN`,
      },
      {
        id: "join-outer",
        label: "Join-outer — 둘 다 전부",
        code: `import pandas as pd
left = pd.DataFrame({"id": [1, 2, 3], "amt": [100, 200, 300]})
right = pd.DataFrame({"id": [2, 3, 4], "grade": ["A", "B", "C"]})

print(left.merge(right, on="id", how="outer"))   # id 1,2,3,4 전부`,
      },
      {
        id: "join-cross",
        label: "Join-cross — 모든 조합(곱)",
        code: `import pandas as pd
a = pd.DataFrame({"plan": ["기본", "고급"]})
b = pd.DataFrame({"rider": ["암", "실손"]})
print(a.merge(b, how="cross"))   # 2×2 = 4행 모든 조합`,
      },
      {
        id: "join-keys",
        label: "키 이름이 다를 때 (left_on·right_on)",
        code: `import pandas as pd
contracts = pd.DataFrame({"cust_id": [1, 2], "amt": [100, 200]})
customers = pd.DataFrame({"customer_id": [1, 2], "name": ["김", "이"]})

print(contracts.merge(customers, left_on="cust_id",
                      right_on="customer_id", how="left"))`,
      },
      {
        id: "join-validate",
        label: "결합 검증 (validate·indicator)",
        code: `import pandas as pd
left = pd.DataFrame({"id": [1, 2, 3], "amt": [100, 200, 300]})
right = pd.DataFrame({"id": [2, 3, 4], "grade": ["A", "B", "C"]})

m = left.merge(right, on="id", how="left",
               validate="one_to_one",   # 키 중복이면 에러로 알림
               indicator=True)          # _merge: both / left_only
print(m["_merge"].value_counts())`,
      },
    ],
  },
  {
    id: "concat",
    label: "합치기 (concat)",
    snippets: [
      {
        id: "concat-row",
        label: "Concat-행 — 위아래로 쌓기(세로)",
        code: `import pandas as pd
jan = pd.DataFrame({"amt": [10, 20]})
feb = pd.DataFrame({"amt": [30, 40]})
# 같은 열 구조를 세로로 이어붙임(월별 파일 합치기 등)
print(pd.concat([jan, feb], ignore_index=True))`,
      },
      {
        id: "concat-col",
        label: "Concat-열 — 나란히 붙이기(가로)",
        code: `import pandas as pd
a = pd.DataFrame({"amt": [10, 20]})
b = pd.DataFrame({"grade": ["A", "B"]})
# 행 순서(인덱스)가 같은 표를 가로로 붙임
print(pd.concat([a, b], axis=1))`,
      },
    ],
  },
  {
    id: "split",
    label: "Split (분할)",
    snippets: [
      {
        id: "split-str-cols",
        label: "Split-열분리 — 한 열을 여러 열로",
        code: `import pandas as pd
s = pd.DataFrame({"full": ["서울-강남", "부산-해운대", "경기-성남"]})
# 구분자로 나눠 여러 열에 배치
s[["시도", "시군구"]] = s["full"].str.split("-", expand=True)
print(s)`,
      },
      {
        id: "split-explode",
        label: "Split-explode — 리스트 열을 여러 행으로",
        code: `import pandas as pd
s = pd.DataFrame({"id": [1, 2], "riders": [["암", "실손"], ["종신"]]})
# 한 행의 리스트를 여러 행으로 펼침(문자열이면 str.split 후 explode)
print(s.explode("riders").reset_index(drop=True))`,
      },
      {
        id: "split-chunks",
        label: "Split-청크 — 행을 n등분",
        code: `import numpy as np
# df를 행 기준 3등분 (배치 처리·표본 분할)
parts = np.array_split(df, 3)
print("조각 수:", len(parts), "| 각 행수:", [len(p) for p in parts])`,
      },
      {
        id: "split-mask",
        label: "Split-조건분할 — 두 그룹으로 나누기",
        code: `# 조건으로 데이터를 둘로 분리
mask = df["age"] >= 60
seniors = df[mask]
others = df[~mask]
print("60+ :", len(seniors), "| 그 외 :", len(others))`,
      },
      {
        id: "split-groups",
        label: "Split-그룹별 — dict로 그룹 분리",
        code: `# 키 값별로 각각의 DataFrame으로 분리(딕셔너리)
groups = {k: g for k, g in df.groupby("product")}
for k, g in groups.items():
    print(k, "->", len(g), "행")`,
      },
    ],
  },
  {
    id: "groupby",
    label: "Groupby (집계)",
    snippets: [
      {
        id: "groupby-sum",
        label: "Groupby-sum — 그룹별 합계",
        code: `print(df.groupby("product")["premium"].sum())`,
      },
      {
        id: "groupby-mean",
        label: "Groupby-mean — 그룹별 평균",
        code: `print(df.groupby("product")["premium"].mean().round(0))`,
      },
      {
        id: "groupby-count",
        label: "Groupby-count — 그룹별 건수",
        code: `print(df.groupby("product").size())          # 그룹별 행 수
print(df.groupby("product")["policy_id"].count())`,
      },
      {
        id: "groupby-agg",
        label: "Groupby-agg — 이름 있는 다중 집계",
        code: `summary = (
    df.groupby("product")
    .agg(건수=("policy_id", "count"),
         평균보험료=("premium", "mean"),
         보험료합계=("premium", "sum"))
    .reset_index()
)
print(summary.round(1))`,
      },
      {
        id: "groupby-transform",
        label: "Groupby-transform — 행 수 유지 파생",
        code: `# 자기 그룹 평균 대비 비율(원본 행 수 그대로)
df["prem_vs_grp"] = df["premium"] / df.groupby("product")["premium"].transform("mean")
print(df[["product", "premium", "prem_vs_grp"]].head())`,
      },
      {
        id: "groupby-filter",
        label: "Groupby-filter — 그룹째 거르기",
        code: `# 계약 100건 이상인 상품군만
big = df.groupby("product").filter(lambda g: len(g) >= 100)
print(big["product"].value_counts())`,
      },
    ],
  },
  {
    id: "pivot",
    label: "피벗 (pivot_table·melt)",
    snippets: [
      {
        id: "pivot-table",
        label: "pivot_table — 교차 요약표",
        code: `import pandas as pd
pt = pd.pivot_table(df, index="product", columns="channel",
                    values="premium", aggfunc="mean",
                    margins=True, margins_name="전체", fill_value=0)
print(pt.round(0))`,
      },
      {
        id: "pivot-melt",
        label: "melt — wide를 long으로",
        code: `import pandas as pd
wide = pd.DataFrame({"지점": ["A", "B"], "1월": [10, 20], "2월": [30, 40]})
long = wide.melt(id_vars="지점", var_name="월", value_name="실적")
print(long)`,
      },
    ],
  },
  {
    id: "missing",
    label: "결측치 (isna·fillna·dropna)",
    snippets: [
      {
        id: "missing-check",
        label: "결측 파악 — 열별 개수·비율",
        code: `import pandas as pd
na = df.isna().sum()
print(pd.DataFrame({"결측수": na, "비율": (na / len(df)).round(3)})
      .query("결측수 > 0").sort_values("결측수", ascending=False))`,
      },
      {
        id: "missing-drop",
        label: "dropna — 핵심 열 결측 행 삭제",
        code: `before = len(df)
clean = df.dropna(subset=["premium"])
print(f"{before} -> {len(clean)} 행")`,
      },
      {
        id: "missing-fill",
        label: "fillna — 중앙값·범주 대체",
        code: `# 수치형은 중앙값, 범주형은 '미상'이 무난
df["income"] = df["income"].fillna(df["income"].median())
print(df["income"].isna().sum(), "개 남음")`,
      },
      {
        id: "missing-group-fill",
        label: "그룹별 중앙값으로 대체",
        code: `df["income"] = df["income"].fillna(
    df.groupby("age_band")["income"].transform("median")
)
print(df["income"].isna().sum(), "개 남음")`,
      },
    ],
  },
  {
    id: "sort-dedup",
    label: "정렬·중복·순위",
    snippets: [
      {
        id: "sort-values",
        label: "sort_values — 복수 키 정렬",
        code: `out = df.sort_values(["product", "premium"], ascending=[True, False])
print(out[["product", "premium"]].head())`,
      },
      {
        id: "drop-duplicates",
        label: "drop_duplicates — 중복 제거",
        code: `print(df.duplicated(subset=["customer_id", "product"]).sum(), "건 중복")
dedup = df.drop_duplicates(subset=["customer_id", "product"], keep="first")
print(dedup.shape)`,
      },
      {
        id: "latest-one",
        label: "그룹별 최신 1건 (정렬+dedup)",
        code: `latest = (
    df.sort_values("tenure_months", ascending=False)
    .drop_duplicates(subset="customer_id", keep="first")
)
print(latest.shape)`,
      },
      {
        id: "rank-topn",
        label: "순위·상위 N (rank·nlargest)",
        code: `df["rank"] = df["premium"].rank(ascending=False, method="min")
top10 = df.nlargest(10, "premium")
print(top10[["policy_id", "premium", "rank"]])`,
      },
    ],
  },
  {
    id: "apply-map",
    label: "apply·map (값 변환)",
    snippets: [
      {
        id: "map-dict",
        label: "map — 사전으로 코드→이름",
        code: `code_map = {"설계사": "FC", "방카": "BA", "다이렉트": "DM"}
df["channel_cd"] = df["channel"].map(code_map)
print(df["channel_cd"].value_counts())`,
      },
      {
        id: "apply-row",
        label: "apply(axis=1) — 여러 열 조합",
        code: `def grade(row):
    if row["age"] >= 65 and row["n_contracts"] >= 3:
        return "정밀심사"
    if row["age"] >= 65 or row["n_contracts"] >= 3:
        return "주의"
    return "일반"

df["grade"] = df.apply(grade, axis=1)
print(df["grade"].value_counts())`,
      },
    ],
  },
];
