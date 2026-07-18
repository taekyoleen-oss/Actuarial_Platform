# /datalab "엑셀 분석함수" 탭 — 설계

날짜: 2026-07-18 · 승인: 사용자("이대로 진행" + "초보자→고급 진행형으로 보강") · 실행: Workflow 멀티에이전트(콘텐츠) + 직접 구현(컴포넌트)

## 목적

`/datalab` 상단에 파이썬 `MethodCloud`(분석 방법 사전)와 **유사한 구조**의 **엑셀 함수 사전**을 신설한다. 통계분석 전처리·처리에 자주 쓰는 엑셀 함수를 4사분면으로 배치하고, 함수 클릭 시 초보자도 이해할 수 있는 설명 → 고급 활용까지 팝업으로 제공한다. 참조: `엑셀 함수 대백과.pdf`(448p) 발췌 + 확립된 엑셀 문서 지식 교차검증.

## 탭 구조 (DataLabTabs)

순서: **① 엑셀 분석함수** → **② 파이썬 데이터 분석방법**(기존 "데이터 분석" 리네임) → ③ 데이터 분석 예제 → ④ 확률분포 → ⑤ 모델 적합.
- `TabKey`에 `"excel"` 추가(맨 앞). `analysis` 라벨 → "파이썬 데이터 분석방법"(모바일 "파이썬").
- 5탭 lg 한 줄 유지 + 모바일 짧은 라벨은 Playwright 실측으로 확정.
- "데이터 분석 예제" 등 나머지 탭 이름은 유지(요청 범위 밖).

## 데이터 모델 (신규 `lib/excelFunctions.ts`)

```ts
type ExcelVersion = "all" | "2016" | "2019" | "2021" | "365";
// all=전 버전, 2021=2021+365, 365=Microsoft 365 전용(동적배열·최신)

type ExcelCategoryId = "stat" | "lookup" | "shape" | "logic" | "lambda";
// stat=기초통계·수학, lookup=검색·참조, shape=데이터가공·동적배열, logic=조건·논리·집계
// lambda=LET·LAMBDA (사분면 아래 별도 섹션)

interface ExcelExample {
  level: "basic" | "advanced";  // 초보자 기초 예제 → 실무/고급 예제
  title: string;
  formula: string;              // =XLOOKUP(...)
  result: string;              // 반환 결과(값·배열 설명)
  explain: string;             // 무엇을·왜 (쉬운 말)
}

interface ExcelParam { name: string; required: boolean; desc: string; }

interface ExcelFunction {
  id; name(대문자); category: ExcelCategoryId; version: ExcelVersion;
  weight: 1..5;      // 실무 빈도 → 사분면 가로축·글자 크기
  difficulty: 1..5;  // 난이도 → 사분면 세로축
  syntax: string;    // 구문 한 줄
  summary: string;   // 한 줄 요약
  intro: string;     // 개념 — 초보자 눈높이(문단 "\n\n")
  params: ExcelParam[];
  examples: ExcelExample[];   // basic 우선 정렬, [전체·기초·고급] 필터
  tips?: string;              // 주의·오해
  related?: string[];         // 연관 함수명
}
```

`EXCEL_CATEGORIES`(4 사분면): 기초통계·수학(blue) / 검색·참조(violet) / 데이터가공·동적배열(teal) / 조건·논리·집계(amber). `lambda`는 별도 섹션.

## 컴포넌트 (신규 `components/feature/datalab/ExcelFunctionCloud.tsx`)

파이썬 `MethodCloud` 미러링:
- **사분면 그래프(md+)**: 4사분면, 가로축=빈도·세로축=난이도. **함수명에 버전 위첨자**(XLOOKUP²¹, VSTACK³⁶⁵ 등). 클릭→팝업.
- **클러스터(모바일)**: 4 카테고리.
- **팝업 `ExcelFunctionDialog`**: 헤더(카테고리 칩·함수명·버전 배지·요약·글자확대/축소) → 본문 순서:
  1. 개념(intro, 초보자)
  2. 구문(syntax 코드블록, 복사)
  3. 인수 상세(params: 이름·필수여부·설명 dl)
  4. **예제 — [전체 | 기초 | 고급] 필터**, 기초 먼저(수식·결과·설명, 수식 복사)
  5. 주의·오해(tips)
  6. 연관 함수(related)
  - 뒤로가기 닫힘(useHistoryDismiss), Escape·오버레이 닫힘, 글자 확대/축소 재사용. **실행기 없음**(엑셀은 브라우저 실행 불가) — 예제 수식 복사로 대체.

## LET · LAMBDA 섹션 (사분면 그래프 아래, `category: "lambda"`)

LET, LAMBDA + 헬퍼(MAP·REDUCE·SCAN·BYROW·BYCOL·MAKEARRAY·ISOMITTED). 활용 예제 카드:
- LET 중복계산 정리 / LAMBDA+이름관리자 재사용 / **재귀 LAMBDA — 귀납적 해찾기**(이분법·뉴턴랩슨 방정식 근) / REDUCE·SCAN 누적 / MAP 배열 변환.
각 항목도 동일 팝업(초보자→고급 예제) 사용.

## 콘텐츠 소싱 — Workflow 멀티에이전트

- 카테고리별 함수 목록(하단)을 배치로 나눠 **저작 에이전트**가 `ExcelFunction` JSON을 스키마 강제로 작성 → **검증 에이전트**가 버전 정확도·구문·초보자 명료성 교정. `_workspace/excel-pdf-text.txt`(추출본) 참조 가능, 확립된 엑셀 지식이 1차·PDF는 보조.
- 초보자 보강: intro는 쉬운 개념부터, examples는 basic 2 + advanced 2 이상, 보험/데이터 실무 맥락 예시 우선.

### 함수 목록(초안 — 각 사분면 16~20, 총 ~80)

- **stat**: AVERAGE, MEDIAN, MODE.SNGL, STDEV.S, STDEV.P, VAR.S, QUARTILE.INC, QUARTILE.EXC, PERCENTILE.INC, PERCENTRANK.INC, RANK.EQ, LARGE, SMALL, SKEW, KURT, TRIMMEAN, SUM, SUMPRODUCT, COUNT·COUNTA·COUNTBLANK, CORREL, FREQUENCY, ROUND(·UP·DOWN), RANDARRAY
- **lookup**: XLOOKUP, VLOOKUP, HLOOKUP, LOOKUP, INDEX, MATCH, XMATCH, CHOOSE, OFFSET, INDIRECT, LEFT, RIGHT, MID, FIND, SEARCH, LEN
- **shape**: FILTER, SORT, SORTBY, UNIQUE, VSTACK, HSTACK, TAKE, DROP, EXPAND, CHOOSEROWS, CHOOSECOLS, TOCOL, TOROW, SEQUENCE, TRANSPOSE, TEXTSPLIT, TEXTJOIN, GROUPBY, PIVOTBY, 스필#·암시적교차@(표기 항목)
- **logic**: IF, IFS, SWITCH, IFERROR, IFNA, AND, OR, NOT, SUMIF, SUMIFS, COUNTIF, COUNTIFS, AVERAGEIF, AVERAGEIFS, MAXIFS, MINIFS, SUBTOTAL, AGGREGATE
- **lambda**: LET, LAMBDA, MAP, REDUCE, SCAN, BYROW, BYCOL, MAKEARRAY, ISOMITTED

## 검증

디자인 비협상 v2 준수 · typecheck·build · Playwright 실측(탭 5개 전환·팝업·버전 위첨자·예제 필터·복사·모바일·콘솔 에러 0).
