// 엑셀 분석함수 사전 데이터 — 워크플로우(excel-func-dict) 저작·감사 산출(자동 생성).
// 타입은 lib/excelFunctions.ts. 이 파일은 데이터 전용(파일 비대화 분리).
// 재생성: 워크플로우 산출을 검증·정규화해 조립. 직접 수정보다 재생성 권장.
import type { ExcelFunction } from "./excelFunctions";

export const EXCEL_FUNCTIONS: ExcelFunction[] = [
  {
    "id": "average",
    "name": "AVERAGE",
    "category": "stat",
    "version": "all",
    "weight": 5,
    "difficulty": 1,
    "syntax": "=AVERAGE(숫자1, [숫자2], ...)",
    "summary": "숫자들의 산술 평균(합계÷개수)을 구합니다. 가장 기본적인 대표값.",
    "intro": "AVERAGE는 지정한 숫자들을 모두 더한 뒤 개수로 나눈 '평균'을 돌려줍니다. 학교에서 배운 그 평균과 똑같습니다.\n\n셀 범위를 지정하면 그 안의 숫자만 골라 평균을 냅니다. 글자나 빈 칸은 자동으로 계산에서 빠지므로 데이터에 제목·메모가 섞여 있어도 안심하고 범위를 크게 잡을 수 있습니다.\n\n단, 값이 0인 칸은 '0이라는 숫자'로 평균에 포함됩니다. 비어 있는 칸과 0을 적은 칸은 결과가 달라지니, 데이터를 넣을 때 '무응답은 빈 칸, 실제 0은 0'으로 구분해 두면 좋습니다. 청구액·보험료 같은 실무 데이터의 첫 요약값으로 가장 많이 쓰입니다.",
    "params": [
      {
        "name": "숫자1",
        "required": true,
        "desc": "평균을 구할 첫 번째 숫자나 셀 범위. 범위를 지정하면 그 안의 숫자를 모두 사용합니다."
      },
      {
        "name": "숫자2, ...",
        "required": false,
        "desc": "이어서 평균에 넣을 추가 숫자나 범위(선택). 콤마로 최대 255개까지 나열할 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "청구액 평균 구하기",
        "formula": "=AVERAGE(B2:B11)",
        "result": "B2:B11에 입력된 청구액의 평균 한 값",
        "explain": "범위만 지정하면 끝입니다. 빈 칸과 글자는 알아서 빼고 숫자만 평균 냅니다."
      },
      {
        "level": "basic",
        "title": "숫자를 직접 넣어 평균",
        "formula": "=AVERAGE(10, 20, 30, 40)",
        "result": "25",
        "explain": "셀 대신 숫자를 콤마로 나열해도 됩니다. (10+20+30+40)÷4 = 25 입니다."
      },
      {
        "level": "advanced",
        "title": "특정 상품만 골라 평균 (조건부)",
        "formula": "=AVERAGE(FILTER(claim_amt, product=\"자동차\"))",
        "result": "product가 \"자동차\"인 행들의 청구액 평균 한 값",
        "explain": "FILTER로 자동차 계약만 먼저 뽑고, 그 결과를 AVERAGE가 평균 냅니다. FILTER는 Excel 2021·365의 스필 함수라 조건에 맞는 값만 자동으로 골라 줍니다."
      },
      {
        "level": "advanced",
        "title": "계약별 손해율의 평균",
        "formula": "=AVERAGE(claim_amt/premium)",
        "result": "각 계약의 손해율(청구액÷보험료)을 구한 뒤 그 평균 한 값",
        "explain": "두 열을 나누면 계약마다 손해율이 배열로 만들어지고, 그 값들의 평균을 냅니다. 주의: '손해율들의 평균'은 '전체 청구액÷전체 보험료'와 다를 수 있습니다. (동적 배열 Excel은 바로 계산, 옛 버전은 Ctrl+Shift+Enter)"
      },
      {
        "level": "advanced",
        "title": "평균에 오류 방지·반올림 씌우기",
        "formula": "=IFERROR(ROUND(AVERAGE(B2:B11), -2), \"데이터 없음\")",
        "result": "100원 단위로 반올림한 평균. 숫자가 하나도 없으면 \"데이터 없음\"",
        "explain": "범위에 숫자가 전혀 없으면 AVERAGE는 #DIV/0! 오류를 냅니다. IFERROR로 감싸 안내 문구로 바꾸고, ROUND(자릿수 -2)로 보기 좋게 반올림했습니다."
      }
    ],
    "tips": "0은 평균에 포함되지만 빈 칸은 제외됩니다(0을 넣을지 비울지에 따라 결과가 달라짐). 계산할 숫자가 하나도 없으면 #DIV/0! 오류가 납니다. 한 가지 조건으로 평균을 낼 때는 AVERAGEIF·AVERAGEIFS가 더 간단합니다.",
    "related": [
      "AVERAGEIF",
      "AVERAGEIFS",
      "MEDIAN",
      "SUM",
      "TRIMMEAN"
    ]
  },
  {
    "id": "count-family",
    "name": "COUNT · COUNTA · COUNTBLANK",
    "category": "stat",
    "version": "all",
    "weight": 5,
    "difficulty": 1,
    "syntax": "=COUNT(값1, [값2], …)  /  =COUNTA(값1, [값2], …)  /  =COUNTBLANK(범위)",
    "summary": "개수를 세는 세 형제 — COUNT(숫자만)·COUNTA(값이 있는 셀)·COUNTBLANK(빈 셀)",
    "intro": "COUNT 계열은 '개수를 세는' 함수입니다. 무엇을 세느냐에 따라 세 가지로 나뉩니다.\n\n- COUNT: 숫자가 든 셀만 셉니다. 날짜·시간도 내부적으로는 숫자라 함께 세지만, 글자나 빈 칸은 무시합니다.\n- COUNTA: 비어 있지 않은 모든 셀을 셉니다. 숫자든 글자든 뭐라도 들어 있으면 1개로 셉니다.\n- COUNTBLANK: 반대로 '빈 셀'의 개수를 셉니다.\n\n예를 들어 계약 목록에서 '보험료가 실제로 입력된 계약 수'는 COUNT, '한 줄이라도 채워진 전체 건수'는 COUNTA, '아직 심사일이 비어 있는 미처리 건수'는 COUNTBLANK로 셉니다.\n\n주의: 수식 결과가 빈 문자열(\"\")인 셀은 눈에는 비어 보여도 COUNTA는 '값 있음'으로, COUNTBLANK는 '빈 셀'로 각각 계산합니다. 특정 조건(예: 상품이 A인 건수)만 세려면 COUNTIF·COUNTIFS를 씁니다.",
    "params": [
      {
        "name": "값1 / 범위",
        "required": true,
        "desc": "COUNT·COUNTA는 셀 값이나 범위(값1)를, COUNTBLANK는 빈 셀을 셀 대상 범위 하나를 지정합니다."
      },
      {
        "name": "값2, …",
        "required": false,
        "desc": "COUNT·COUNTA에서 추가로 세고 싶은 값이나 범위(최대 255개). 여러 범위를 한꺼번에 셀 때 씁니다. COUNTBLANK는 범위를 하나만 받습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "숫자가 입력된 건수 세기 (COUNT)",
        "formula": "=COUNT(C2:C11)",
        "result": "9 (C열 보험료 중 숫자가 든 셀 수)",
        "explain": "보험료가 실제로 입력된 계약이 몇 건인지 셉니다. '미정' 같은 글자나 빈 칸은 빼고 숫자만 셉니다."
      },
      {
        "level": "basic",
        "title": "전체 건수 세기 (COUNTA)",
        "formula": "=COUNTA(A2:A11)",
        "result": "10 (A열 계약번호가 채워진 행 수)",
        "explain": "뭐라도 입력된 셀을 모두 세어 전체 계약 건수를 구합니다. 숫자·글자 구분 없이 비어 있지만 않으면 셉니다."
      },
      {
        "level": "basic",
        "title": "빈 칸(미처리) 세기 (COUNTBLANK)",
        "formula": "=COUNTBLANK(D2:D11)",
        "result": "3 (D열 심사일이 비어 있는 셀 수)",
        "explain": "아직 심사일이 채워지지 않은 빈 건수를 셉니다. '미처리 건수'를 한눈에 파악할 때 씁니다."
      },
      {
        "level": "advanced",
        "title": "입력 완료율(진행률) 구하기",
        "formula": "=COUNT(C2:C11)/COUNTA(A2:A11)",
        "result": "0.9 (셀 서식을 백분율로 바꾸면 90%)",
        "explain": "'보험료가 입력된 건수 ÷ 전체 건수'로 데이터 입력이 얼마나 진행됐는지 비율을 구합니다. 두 함수를 나눠 대시보드용 진행률로 씁니다."
      },
      {
        "level": "advanced",
        "title": "글자로 잘못 든 셀만 골라 세기 (COUNTA − COUNT)",
        "formula": "=COUNTA(C2:C11)-COUNT(C2:C11)",
        "result": "2 (보험료 칸에 '미정' 등 텍스트가 든 셀 수)",
        "explain": "채워진 칸 전체에서 숫자 칸을 빼면 '숫자가 아닌 글자로 채워진 칸'만 남습니다. 잘못 입력된 값을 점검할 때 유용합니다."
      },
      {
        "level": "advanced",
        "title": "판매 상품 종류 수 (UNIQUE 결합, 365·2021)",
        "formula": "=COUNTA(UNIQUE(B2:B100))",
        "result": "7 (B열 상품 product의 서로 다른 종류 수)",
        "explain": "UNIQUE로 중복을 없앤 상품 목록을 만들고 그 개수를 세어 '판매 상품이 몇 종류인지' 구합니다. 예전 버전에서는 =SUMPRODUCT(1/COUNTIF(...)) 관용식을 씁니다."
      }
    ],
    "related": [
      "COUNTIF",
      "COUNTIFS",
      "SUMPRODUCT",
      "UNIQUE"
    ],
    "tips": "COUNT는 숫자만, COUNTA는 아무 값이나, COUNTBLANK는 빈 칸을 셉니다. 조건을 걸어 세려면 COUNTIF·COUNTIFS를 쓰세요. 수식 결과가 \"\"(빈 문자열)인 셀은 COUNTA는 '값 있음', COUNTBLANK는 '빈 셀'로 계산하는 특이 케이스라 주의합니다."
  },
  {
    "id": "round-family",
    "name": "ROUND · ROUNDUP · ROUNDDOWN",
    "category": "stat",
    "version": "all",
    "weight": 5,
    "difficulty": 1,
    "syntax": "=ROUND(숫자, 자릿수)  /  =ROUNDUP(숫자, 자릿수)  /  =ROUNDDOWN(숫자, 자릿수)",
    "summary": "숫자를 반올림(ROUND)·올림(ROUNDUP)·내림(ROUNDDOWN)으로 원하는 자릿수까지 정리",
    "intro": "ROUND 계열은 숫자의 자릿수를 정리하는 함수입니다. 반올림·올림·내림 세 형제로 나뉩니다.\n\n- ROUND: 반올림 (5 이상이면 올리고 미만이면 버림)\n- ROUNDUP: 무조건 올림 (조금이라도 넘으면 올림)\n- ROUNDDOWN: 무조건 내림 (남는 건 버림)\n\n공통으로 두 번째 인수 '자릿수'가 핵심입니다. 이 숫자가 '어디까지 남길지'를 정합니다.\n- 양수(예: 2): 소수 둘째 자리까지 남김 → 123.456 → 123.46\n- 0: 정수로 만듦 → 123.456 → 123\n- 음수(예: −3): 소수점 왼쪽, 즉 천 원 단위로 정리 → 1,234,567 → 1,235,000\n\n보험 실무에서 보험료를 '원 단위 절사(내림)'하거나 '십 원 단위 반올림'할 때 자릿수에 0이나 음수를 넣어 자주 씁니다.\n\n참고: 셀 서식(표시 형식)으로 소수 자리를 줄이면 '보이기만' 바뀌고 실제 값은 그대로입니다. 계산 결과 자체를 바꾸려면 ROUND 계열을 써야 합니다.",
    "params": [
      {
        "name": "숫자",
        "required": true,
        "desc": "정리할 숫자, 또는 그 숫자가 든 셀·수식(예: 보험료 계산식 전체)."
      },
      {
        "name": "자릿수",
        "required": true,
        "desc": "어디까지 남길지. 양수=소수 자리, 0=정수, 음수=10·100·1000 단위. 예: 2→소수 둘째, −3→천 단위."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "소수 둘째 자리로 반올림 (ROUND)",
        "formula": "=ROUND(123.456, 2)",
        "result": "123.46",
        "explain": "소수 셋째 자리(6)를 보고 반올림해 둘째 자리까지 남깁니다. 가장 기본적인 사용법입니다."
      },
      {
        "level": "basic",
        "title": "원 미만 버리기 (ROUNDDOWN)",
        "formula": "=ROUNDDOWN(53271.8, 0)",
        "result": "53271",
        "explain": "자릿수 0은 정수로 만들라는 뜻이고, ROUNDDOWN은 무조건 내림이라 소수점 이하를 버립니다. 보험료 '원 단위 절사'에 자주 씁니다."
      },
      {
        "level": "basic",
        "title": "무조건 올림 (ROUNDUP)",
        "formula": "=ROUNDUP(12.01, 0)",
        "result": "13",
        "explain": "0.01만 넘어도 ROUNDUP은 무조건 올려 13이 됩니다. '넘치면 한 단위 더'가 필요한 계산에 씁니다."
      },
      {
        "level": "advanced",
        "title": "보험료를 십 원 단위로 반올림 (계산식 감싸기)",
        "formula": "=ROUND(C2*0.023, -1)",
        "result": "53270 (가입금액×요율을 십 원 단위 반올림)",
        "explain": "계산식을 바로 감싸 '보험료를 십 원 단위로 반올림'합니다. 자릿수 −1이 일의 자리를 정리해 10원 단위로 맞춥니다."
      },
      {
        "level": "advanced",
        "title": "절사 단위를 셀로 동적 지정",
        "formula": "=ROUNDDOWN(A2, B2)",
        "result": "A열 값을 B열에 적은 자릿수만큼 내림",
        "explain": "자릿수를 상수 대신 셀(B2)로 주면 상품마다 다른 절사 단위를 표로 관리하며 한 수식으로 처리할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "범위 전체를 한 번에 원 단위 절사 (365 스필)",
        "formula": "=ROUNDDOWN(C2:C101*D2:D101, 0)",
        "result": "각 계약의 보험료(가입금액×요율)를 원 미만 버린 스필 배열",
        "explain": "범위끼리 곱해 각 계약 보험료를 한 번에 계산하고 원 미만을 버립니다. Microsoft 365에서는 결과가 아래로 자동으로 흘러넘칩니다(스필)."
      }
    ],
    "related": [
      "INT",
      "TRUNC",
      "MROUND",
      "CEILING.MATH",
      "FLOOR.MATH",
      "FIXED"
    ],
    "tips": "'무조건 올림'은 ROUNDUP, '무조건 내림'은 ROUNDDOWN, '5 기준 반올림'은 ROUND입니다. 자릿수 음수는 10·100·1000 단위 정리(−1=십, −2=백, −3=천). 단순 소수 버림은 INT·TRUNC도 있으나 음수 처리 방식이 다르며, 500원처럼 특정 배수로 맞추려면 MROUND·CEILING.MATH·FLOOR.MATH를 쓰세요. 셀 표시 형식은 겉보기만 바꾸고 실제 값은 그대로입니다."
  },
  {
    "id": "sum",
    "name": "SUM",
    "category": "stat",
    "version": "all",
    "weight": 5,
    "difficulty": 1,
    "syntax": "=SUM(숫자1, [숫자2], ...)",
    "summary": "범위나 여러 숫자를 모두 더해 합계를 구한다.",
    "intro": "숫자를 더하는 가장 기본이 되는 함수입니다. 셀 범위를 넣으면 그 안의 숫자를 모두 합해 줍니다.\n\n계산기로 하나씩 더하는 대신 =SUM(B2:B13)처럼 범위만 지정하면 되고, 중간에 글자나 빈 칸이 섞여 있어도 숫자만 골라 더합니다.\n\n떨어져 있는 여러 범위, 심지어 여러 시트의 같은 칸까지 한 번에 합칠 수 있어 거의 모든 표 작업의 출발점이 됩니다.",
    "params": [
      {
        "name": "숫자1",
        "required": true,
        "desc": "더할 첫 번째 값 또는 셀 범위. 보통 여기에 합칠 범위를 넣는다."
      },
      {
        "name": "숫자2 ...",
        "required": false,
        "desc": "추가로 더할 값이나 범위. 쉼표로 최대 255개까지 나열할 수 있다(떨어진 영역·개별 숫자 혼합 가능)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "범위 전체 더하기",
        "formula": "=SUM(B2:B13)",
        "result": "B2:B13에 있는 12개월 보험료를 모두 더한 합계",
        "explain": "가장 기본 사용법. 더할 셀 범위만 넣으면 끝난다. 중간에 빈 칸이나 글자가 있어도 무시하고 숫자만 더한다."
      },
      {
        "level": "basic",
        "title": "숫자를 직접 더하기",
        "formula": "=SUM(10, 20, 30)",
        "result": "60",
        "explain": "셀 대신 숫자를 쉼표로 나열해도 된다. 범위·숫자·다른 셀을 섞어서 =SUM(B2, 5000, C2:C10)처럼 넣을 수도 있다."
      },
      {
        "level": "advanced",
        "title": "떨어진 여러 범위 한 번에",
        "formula": "=SUM(B2:B13, F2:F13)",
        "result": "두 범위(예: 생명·손해 보험료 열)의 숫자를 모두 합한 값",
        "explain": "쉼표로 범위를 여러 개 넣으면 서로 떨어져 있는 영역도 한 번에 더한다. 표 중간에 다른 열이 끼어 있어도 상관없다."
      },
      {
        "level": "advanced",
        "title": "누적 합계(러닝 토탈)",
        "formula": "=SUM($B$2:B2)",
        "result": "행을 내려갈수록 그 시점까지의 누계(예: 1월, 1~2월, 1~3월 누적)",
        "explain": "시작점 $B$2는 고정하고 끝점 B2는 아래로 드래그하면 B3, B4로 늘어난다. 그래서 아래로 채울수록 범위가 커져 누적 합계표가 만들어진다."
      },
      {
        "level": "advanced",
        "title": "여러 시트 같은 칸 합치기(3차원 참조)",
        "formula": "=SUM('1월:12월'!B2)",
        "result": "1월부터 12월 시트까지 각 시트의 B2를 모두 더한 연간 합계",
        "explain": "시트가 월별로 나뉘어 있을 때 '첫시트:끝시트'!셀 형태로 쓰면 12장을 한 번에 합산한다. 시트 순서만 맞으면 새 시트를 사이에 끼워도 자동 반영된다."
      }
    ],
    "tips": "빈 칸과 텍스트는 자동으로 무시하고 숫자만 더한다. 다만 '1,000' 같이 숫자로 보이지만 실제로는 문자로 입력된 값은 더해지지 않으니 셀 서식·데이터 형식을 확인한다.",
    "related": [
      "SUMIF",
      "SUMIFS",
      "SUBTOTAL",
      "AGGREGATE",
      "SUMPRODUCT"
    ]
  },
  {
    "id": "correl",
    "name": "CORREL",
    "category": "stat",
    "version": "all",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=CORREL(배열1, 배열2)",
    "summary": "두 데이터가 함께 움직이는 정도를 −1~+1 한 숫자(상관계수)로 보여 준다",
    "intro": "CORREL은 두 데이터가 '함께 움직이는 정도'를 하나의 숫자로 알려 주는 함수입니다. 이 숫자를 상관계수라고 하며 항상 −1에서 +1 사이입니다.\n\n- +1에 가까울수록: 한쪽이 커지면 다른 쪽도 함께 커진다(양의 상관).\n- −1에 가까울수록: 한쪽이 커지면 다른 쪽은 작아진다(음의 상관).\n- 0에 가까울수록: 둘 사이에 뚜렷한 직선 관계가 없다.\n\n예를 들어 '가입자 나이'와 '연간 청구액' 두 열을 넣으면, 나이가 많을수록 청구가 느는지(양수)·주는지(음수)·상관없는지(0 근처)를 한눈에 볼 수 있습니다.\n\n주의할 점 두 가지. ① 상관계수는 '직선 관계'만 봅니다. U자처럼 휘어진 관계는 실제로 관련이 커도 값이 0에 가까울 수 있습니다. ② 상관이 있다고 해서 원인·결과(인과관계)가 있다는 뜻은 아닙니다.",
    "params": [
      {
        "name": "배열1",
        "required": true,
        "desc": "첫 번째 데이터 범위(예: 나이). 숫자 셀 범위를 지정합니다."
      },
      {
        "name": "배열2",
        "required": true,
        "desc": "두 번째 데이터 범위(예: 청구액). 배열1과 같은 개수·같은 순서로 짝지어야 하며, 글자·빈 칸이 낀 위치는 양쪽 모두 무시됩니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "나이와 청구액의 관계",
        "formula": "=CORREL(B2:B21, C2:C21)",
        "result": "0.72",
        "explain": "B열(나이)과 C열(청구액)이 얼마나 함께 움직이는지 한 숫자로 봅니다. 0.72면 나이가 많을수록 청구액도 커지는 경향이 꽤 강하다는 뜻입니다."
      },
      {
        "level": "basic",
        "title": "광고비와 매출의 관계",
        "formula": "=CORREL(A2:A13, B2:B13)",
        "result": "0.93",
        "explain": "광고비(A)가 늘 때 매출(B)이 함께 느는지 봅니다. 1에 아주 가까운 0.93이면 강한 양의 관계입니다."
      },
      {
        "level": "advanced",
        "title": "보고서용으로 소수 두 자리 정리 (ROUND 결합)",
        "formula": "=ROUND(CORREL(B2:B21, C2:C21), 2)",
        "result": "0.72",
        "explain": "상관계수는 소수점이 길게 나오므로 ROUND로 두 자리만 남겨 보고서·표에 쓰기 좋게 정리합니다."
      },
      {
        "level": "advanced",
        "title": "결정계수 R²로 설명력 보기",
        "formula": "=CORREL(B2:B21, C2:C21)^2",
        "result": "0.52 (=RSQ(C2:C21,B2:B21) 와 동일)",
        "explain": "상관계수를 제곱하면 회귀분석의 R²(설명력)와 같아집니다. 0.52면 '청구액 변동의 약 52%를 나이로 설명한다'는 의미로 해석합니다."
      },
      {
        "level": "advanced",
        "title": "오류 방어 — 편차 0이면 안내 문구",
        "formula": "=IFERROR(CORREL(B2:B21, C2:C21), \"계산 불가\")",
        "result": "정상이면 상관계수, 한쪽 값이 전부 같으면 \"계산 불가\"",
        "explain": "한 열의 값이 전부 똑같으면(편차 0) CORREL은 #DIV/0! 오류를 냅니다. IFERROR로 감싸 대시보드가 깨지지 않게 합니다."
      }
    ],
    "related": [
      "PEARSON",
      "RSQ",
      "SLOPE",
      "INTERCEPT",
      "COVARIANCE.S"
    ],
    "tips": "CORREL과 PEARSON은 결과가 완전히 같습니다(피어슨 상관계수). 상관계수의 제곱(=CORREL^2)은 RSQ와 같습니다. 상관은 '직선 관계'만 재고 인과관계를 뜻하지 않으며, 튀는 값(이상치) 하나에도 크게 흔들리니 산점도와 함께 보세요."
  },
  {
    "id": "large-small",
    "name": "LARGE · SMALL",
    "category": "stat",
    "version": "all",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=LARGE(배열, k)   ·   =SMALL(배열, k)",
    "summary": "데이터에서 k번째로 큰 값(LARGE) 또는 k번째로 작은 값(SMALL)을 뽑는다.",
    "intro": "LARGE와 SMALL은 \"몇 번째로 큰/작은 값이 뭐야?\"를 알려주는 짝꿍 함수입니다. MAX·MIN은 1등만 알려주지만, LARGE·SMALL은 두 번째·세 번째처럼 원하는 순번의 값을 직접 뽑을 수 있습니다.\n\nLARGE(범위, 1)은 가장 큰 값(=MAX), LARGE(범위, 3)은 세 번째로 큰 값입니다. 반대로 SMALL(범위, 1)은 가장 작은 값(=MIN), SMALL(범위, 2)는 두 번째로 작은 값이에요.\n\nTop 3 청구액, 하위 5개 손해율처럼 '상위/하위 몇 개'를 뽑아 볼 때 아주 자주 쓰입니다. k에 여러 숫자를 배열로 주면 여러 순번을 한 번에 뽑을 수도 있어 SUM과 결합해 '상위 N개 합계'를 구하는 데도 편리합니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "값을 뽑아낼 숫자 데이터 범위. 문자·빈칸은 무시됩니다."
      },
      {
        "name": "k",
        "required": true,
        "desc": "몇 번째 값인지. LARGE는 1이 최댓값, SMALL은 1이 최솟값. 배열의 개수보다 크면 #NUM! 오류."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "세 번째로 큰 청구액 찾기",
        "formula": "=LARGE(C2:C101, 3)",
        "result": "예: 8,200,000",
        "explain": "청구액 목록(C2:C101)에서 세 번째로 큰 값을 뽑습니다. k에 1을 넣으면 최댓값과 같아요. 상위권 값만 콕 집어 보고 싶을 때 씁니다."
      },
      {
        "level": "basic",
        "title": "두 번째로 작은 보험료 찾기",
        "formula": "=SMALL(D2:D101, 2)",
        "result": "예: 120,000",
        "explain": "보험료 목록에서 두 번째로 작은 값을 뽑습니다. 가장 작은 값(최솟값)이 특이하게 낮은 경우, 그다음 값을 함께 보면 현실적인 하한을 파악할 수 있어요."
      },
      {
        "level": "advanced",
        "title": "상위 3개 청구액 합계",
        "formula": "=SUM(LARGE(C2:C101, {1,2,3}))",
        "result": "1~3위 청구액을 더한 합",
        "explain": "k 자리에 {1,2,3} 배열을 주면 1·2·3위를 한꺼번에 뽑고, 그걸 SUM으로 더합니다. 고액 상위 몇 건이 전체에 얼마나 영향을 주는지 볼 때 유용해요."
      },
      {
        "level": "advanced",
        "title": "동적 배열로 Top 5 한 번에 뽑기",
        "formula": "=LARGE(C2:C101, SEQUENCE(5))",
        "result": "1~5위 값 5개가 세로로 스필",
        "explain": "SEQUENCE(5)가 {1;2;3;4;5}를 만들어 상위 5개 값이 아래로 자동으로 펼쳐집니다(스필). 랭킹 표를 만들 때 편리해요. SEQUENCE는 엑셀 2021·365에서 지원됩니다."
      },
      {
        "level": "advanced",
        "title": "특정 상품 안에서 최고 청구액 찾기",
        "formula": "=MAX(IF($E$2:$E$101=\"암보험\", $C$2:$C$101))",
        "result": "암보험의 최대 청구액",
        "explain": "LARGE에는 조건 옵션이 없어, 조건이 필요할 땐 IF로 해당 상품만 남긴 배열을 만든 뒤 MAX(=1위)나 LARGE로 순번을 뽑습니다. 2021·365는 그냥 Enter, 이전 버전은 Ctrl+Shift+Enter(배열 수식)로 입력하세요."
      }
    ],
    "related": [
      "MAX",
      "MIN",
      "RANK.EQ",
      "SORT",
      "SEQUENCE"
    ],
    "tips": "배열이 비어 있거나 k가 0 이하 또는 데이터 개수보다 크면 #NUM! 오류가 납니다. 상위 N개를 자주 다룬다면 값만 뽑는 LARGE/SMALL 대신 행 전체를 정렬해 주는 SORT/SORTBY(2021·365)도 함께 고려하세요."
  },
  {
    "id": "median",
    "name": "MEDIAN",
    "category": "stat",
    "version": "all",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=MEDIAN(숫자1, [숫자2], ...)",
    "summary": "값들을 크기순으로 줄 세웠을 때 정확히 가운데에 오는 값(중앙값)을 구합니다.",
    "intro": "MEDIAN은 값들을 작은 것부터 큰 것까지 줄 세운 뒤, 딱 가운데에 있는 값을 돌려줍니다. 이것을 '중앙값'이라고 합니다.\n\n평균과 무엇이 다를까요? 평균은 아주 큰 값 몇 개에 크게 끌려갑니다. 예를 들어 대부분 소액이지만 한 건이 수억 원인 청구 데이터에서는 평균이 실제 '보통 청구액'보다 훨씬 커집니다. 반면 중앙값은 순서상 가운데 값이라 이런 극단값에 잘 흔들리지 않아, 데이터의 '전형적인 크기'를 더 잘 보여 줍니다.\n\n그래서 청구액·소득·집값처럼 한쪽으로 길게 늘어진(치우친) 데이터에서는 평균과 중앙값을 함께 보는 것이 좋습니다. 데이터 개수가 짝수면 가운데 두 값의 평균이 중앙값이 됩니다.",
    "params": [
      {
        "name": "숫자1",
        "required": true,
        "desc": "중앙값을 구할 첫 번째 숫자나 셀 범위. 범위를 지정하면 그 안의 숫자를 모두 사용합니다."
      },
      {
        "name": "숫자2, ...",
        "required": false,
        "desc": "이어서 계산에 넣을 추가 숫자나 범위(선택). 콤마로 최대 255개까지 나열할 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "청구액 중앙값 구하기",
        "formula": "=MEDIAN(B2:B11)",
        "result": "청구액을 크기순으로 정렬했을 때 가운데 값",
        "explain": "범위만 지정하면 됩니다. '보통 이 정도 청구된다'는 대표값을 극단값에 덜 흔들리게 알려 줍니다."
      },
      {
        "level": "basic",
        "title": "극단값이 있어도 흔들리지 않음",
        "formula": "=MEDIAN(1, 2, 3, 4, 100)",
        "result": "3",
        "explain": "같은 데이터의 평균은 22이지만 중앙값은 가운데 값 3입니다. 100 같은 큰 값 하나에 영향을 덜 받는다는 점을 보여 줍니다."
      },
      {
        "level": "advanced",
        "title": "특정 상품만 골라 중앙값",
        "formula": "=MEDIAN(FILTER(claim_amt, product=\"자동차\"))",
        "result": "자동차 계약 청구액의 중앙값 한 값",
        "explain": "FILTER로 자동차 계약만 뽑아 중앙값을 냅니다. AVERAGEIF는 있어도 'MEDIANIF'는 없기 때문에 이렇게 FILTER와 조합합니다. (FILTER는 2021·365)"
      },
      {
        "level": "advanced",
        "title": "평균−중앙값으로 분포 치우침 진단",
        "formula": "=AVERAGE(claim_amt)-MEDIAN(claim_amt)",
        "result": "양수면 큰 청구 소수가 평균을 끌어올린(오른쪽 꼬리) 분포",
        "explain": "평균이 중앙값보다 크면 고액 청구 몇 건이 평균을 밀어 올린 것입니다. 청구액은 대개 이런 오른쪽 치우침을 보여, 두 값의 차이로 치우침 정도를 빠르게 가늠할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "값을 특정 범위로 가두기(클램프)",
        "formula": "=MEDIAN(0, A2, 100)",
        "result": "A2가 0보다 작으면 0, 100보다 크면 100, 그 사이면 그대로",
        "explain": "세 값의 중앙값을 이용한 유명한 기법입니다. 최소·최대 한도를 씌울 때 IF 두 번보다 짧습니다. 예: 계산된 비율을 0~100% 사이로 강제할 때 유용합니다."
      }
    ],
    "tips": "데이터 개수가 짝수면 가운데 두 값의 평균이 중앙값이 됩니다. 글자와 빈 칸은 무시합니다. 평균과 함께 보면 분포가 어느 쪽으로 치우쳤는지 알 수 있습니다.",
    "related": [
      "AVERAGE",
      "QUARTILE.INC",
      "PERCENTILE.INC",
      "MODE.SNGL"
    ]
  },
  {
    "id": "percentile-inc",
    "name": "PERCENTILE.INC",
    "category": "stat",
    "version": "all",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=PERCENTILE.INC(배열, 비율)",
    "summary": "데이터에서 원하는 백분위(0~1) 위치의 값을 구한다(양 끝 포함 방식).",
    "intro": "PERCENTILE.INC는 데이터를 작은 값부터 큰 값까지 줄 세웠을 때 '아래에서 몇 %' 지점의 값이 얼마인지 알려주는 함수입니다. 25%·50%·75%만 구하는 QUARTILE와 달리, 원하는 비율을 0~1 사이에서 자유롭게 지정할 수 있습니다.\n\n예를 들어 0.9를 넣으면 하위 90% 지점(= 상위 10% 경계) 값을, 0.5를 넣으면 한가운데(중앙값) 값을 돌려줍니다. 정확히 그 위치에 데이터가 없으면 양옆 값을 비례로 섞어(보간) 계산합니다.\n\n'.INC'는 Inclusive(포함)로 0과 1(0%~100%)을 포함하는 전통 방식입니다. 청구액 상위 1%가 얼마인지(위험액 VaR 개념), 응답 시간의 95퍼센타일이 몇 초인지처럼 '상위/하위 경계선'을 잡을 때 실무에서 매우 자주 씁니다. 참고로 PERCENTILE.INC(범위, 0.25)는 QUARTILE.INC(범위, 1)와 같은 값입니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "백분위수를 구할 숫자 셀 범위 또는 배열입니다. 문자열·빈 칸은 무시됩니다."
      },
      {
        "name": "비율",
        "required": true,
        "desc": "0~1 사이의 소수로 위치를 지정합니다. 0.9는 하위 90% 지점(상위 10% 경계), 0.5는 중앙값."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "상위 10% 경계 (90퍼센타일)",
        "formula": "=PERCENTILE.INC(B2:B21, 0.9)",
        "result": "하위 90% 지점 = 상위 10% 경계 청구액",
        "explain": "0.9는 아래에서 90% 지점, 즉 상위 10%가 시작되는 청구액입니다. '큰 청구 건'의 기준선을 잡을 때 씁니다."
      },
      {
        "level": "basic",
        "title": "중앙값(50퍼센타일)",
        "formula": "=PERCENTILE.INC(B2:B21, 0.5)",
        "result": "한가운데 값 (MEDIAN과 동일)",
        "explain": "0.5는 한가운데 지점으로 =MEDIAN(B2:B21)과 같습니다. 비율만 바꾸면 어떤 위치든 구할 수 있는 것이 PERCENTILE의 장점입니다."
      },
      {
        "level": "advanced",
        "title": "청구액 상위 1% (VaR 개념)",
        "formula": "=PERCENTILE.INC(claim_amt, 0.99)",
        "result": "하위 99% 지점 = 상위 1% 손해 경계",
        "explain": "보험에서 '이보다 큰 손해가 100건 중 1건'인 금액을 위험 관리 기준(VaR과 유사)으로 씁니다. 비율을 0.99로 올려 꼬리(대형 손해) 위험을 봅니다."
      },
      {
        "level": "advanced",
        "title": "여러 백분위수 한 번에 (스필)",
        "formula": "=PERCENTILE.INC(B2:B21, {0.1;0.25;0.5;0.75;0.9})",
        "result": "10·25·50·75·90퍼센타일 5개가 세로로 펼쳐짐(스필)",
        "explain": "중괄호 배열 상수로 원하는 비율을 한꺼번에 넣으면 각 백분위수가 아래로 자동 채워집니다(스필, 2021 이상). 분포 요약표를 즉석에서 만들 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "특정 상품 95퍼센타일 (FILTER 결합)",
        "formula": "=PERCENTILE.INC(FILTER(claim_amt, product=\"실손\"), 0.95)",
        "result": "실손 상품 청구액의 95퍼센타일",
        "explain": "FILTER로 '실손' 청구액만 골라 그 상위 5% 경계를 구합니다. 상품별 고액 청구 기준을 조건에 따라 동적으로 만들 때 유용합니다(2021 이상)."
      }
    ],
    "related": [
      "PERCENTILE.EXC",
      "QUARTILE.INC",
      "PERCENTRANK.INC",
      "MEDIAN"
    ],
    "tips": "비율은 0~1 사이의 소수로 넣습니다(90%는 0.9). 이 범위를 벗어나면 #NUM! 오류가 납니다. '상위 10%'를 구하려면 상위는 큰 값이므로 0.9(하위 90% 경계)를 넣어야 합니다. 0과 1을 포함하지 않는 더 보수적인 계산이 필요하면 PERCENTILE.EXC를 쓰세요(같은 비율이라도 방식이 달라 결과가 다릅니다)."
  },
  {
    "id": "quartile-inc",
    "name": "QUARTILE.INC",
    "category": "stat",
    "version": "all",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=QUARTILE.INC(배열, 사분위수)",
    "summary": "데이터를 4등분하는 위치(0·25·50·75·100%)의 값을 구한다(양 끝 포함 방식).",
    "intro": "QUARTILE.INC는 데이터를 크기 순으로 줄 세운 뒤, 4등분하는 위치의 값을 알려주는 함수입니다. 청구액이나 성적을 낮은 것부터 높은 것까지 늘어놓고 '아래에서 25% 지점은 얼마인가?', '한가운데(50%) 값은?' 같은 질문에 답해 줍니다.\n\n두 번째 인수(사분위수)에 0~4를 넣어 위치를 고릅니다. 0=최솟값, 1=하위 25%(1사분위), 2=한가운데(중앙값), 3=하위 75%(3사분위), 4=최댓값입니다. 정확히 그 위치에 값이 없으면 양옆 값을 비례로 섞어(보간) 계산합니다.\n\n'.INC'는 Inclusive(포함)의 약자로, 0%(최솟값)와 100%(최댓값)까지 포함해 계산하는 전통적인 방식입니다. 데이터가 얼마나 퍼져 있는지, 튀는 값(이상치)이 있는지 파악할 때 상자수염그림과 함께 자주 씁니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "사분위수를 구할 숫자 셀 범위 또는 배열입니다. 안에 있는 문자열·빈 칸은 무시됩니다."
      },
      {
        "name": "사분위수",
        "required": true,
        "desc": "어느 위치를 구할지 0~4로 지정합니다. 0=최솟값, 1=25%, 2=50%(중앙값), 3=75%, 4=최댓값."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "1사분위수(하위 25%) 구하기",
        "formula": "=QUARTILE.INC(B2:B21, 1)",
        "result": "아래에서 25% 지점의 청구액",
        "explain": "청구액을 작은 값부터 줄 세웠을 때 아래에서 4분의 1 지점 값입니다. 두 번째 인수 1이 '1사분위(25%)'를 뜻합니다."
      },
      {
        "level": "basic",
        "title": "중앙값(50%) 구하기",
        "formula": "=QUARTILE.INC(B2:B21, 2)",
        "result": "한가운데 값 (MEDIAN과 동일)",
        "explain": "인수 2는 정확히 한가운데(50%) 값이며 =MEDIAN(B2:B21) 결과와 같습니다. 평균과 달리 아주 큰 청구 한두 건에 덜 흔들립니다."
      },
      {
        "level": "advanced",
        "title": "IQR(사분위 범위)로 흩어짐 재기",
        "formula": "=QUARTILE.INC(B2:B21, 3) - QUARTILE.INC(B2:B21, 1)",
        "result": "3사분위 − 1사분위 = 가운데 50%가 퍼진 폭",
        "explain": "3사분위(75%)에서 1사분위(25%)를 빼면 데이터 중앙 50%가 퍼진 폭인 IQR이 됩니다. 극단값에 강해, 표준편차보다 안정적인 흩어짐 지표로 씁니다."
      },
      {
        "level": "advanced",
        "title": "이상치(튀는 값) 상한 경계 만들기",
        "formula": "=QUARTILE.INC(B2:B21, 3) + 1.5*(QUARTILE.INC(B2:B21, 3) - QUARTILE.INC(B2:B21, 1))",
        "result": "이 값보다 큰 청구액은 이상치 후보",
        "explain": "통계에서 흔히 쓰는 '3사분위 + 1.5×IQR' 규칙으로 비정상적으로 큰 청구액을 걸러낼 경계선을 만듭니다. 이 값을 넘는 건은 검토 대상으로 표시할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "다섯 사분위수 한 번에 (스필)",
        "formula": "=QUARTILE.INC(B2:B21, SEQUENCE(5, 1, 0, 1))",
        "result": "세로 5칸에 최솟값·25%·50%·75%·최댓값이 자동으로 채워짐(스필)",
        "explain": "SEQUENCE로 0~4를 만들어 넣으면 다섯 사분위수가 한 수식으로 아래로 펼쳐집니다(스필). 요약 통계표를 순식간에 만들 때 좋습니다(2021 이상)."
      }
    ],
    "related": [
      "QUARTILE.EXC",
      "PERCENTILE.INC",
      "MEDIAN",
      "MIN",
      "MAX"
    ],
    "tips": "두 번째 인수 0은 MIN, 2는 MEDIAN, 4는 MAX와 결과가 같습니다. 0~4 외의 값을 넣으면 #NUM! 오류가 납니다. '위에서 몇 %'가 아니라 '아래에서(작은 값부터) 몇 %'인지를 지정한다는 점에 주의하세요. 성적 상위 25% 합격선을 구하려면 하위 75% 경계인 3을 넣어야 합니다."
  },
  {
    "id": "stdev",
    "name": "STDEV.S · STDEV.P",
    "category": "stat",
    "version": "all",
    "weight": 4,
    "difficulty": 3,
    "syntax": "=STDEV.S(숫자1, [숫자2], ...)  ·  =STDEV.P(숫자1, [숫자2], ...)",
    "summary": "값들이 평균에서 얼마나 흩어져 있는지(표준편차)를 구합니다. .S=표본(n−1), .P=모집단(n).",
    "intro": "표준편차는 '값들이 평균에서 얼마나 넓게 퍼져 있는가'를 하나의 숫자로 나타낸 것입니다. 표준편차가 작으면 값들이 평균 근처에 옹기종기 모여 있고, 크면 넓게 흩어져 들쭉날쭉하다는 뜻입니다. 보험에서는 청구액의 변동성(위험의 크기)을 가늠하는 기본 지표로 씁니다.\n\nSTDEV.S와 STDEV.P는 무엇이 다를까요? 갖고 있는 데이터가 '전체 중 일부(표본)'인지 '전체 그 자체(모집단)'인지에 따라 나눕니다. STDEV.S는 표본용으로 개수에서 1을 뺀 n−1로 나누고(베셀 보정), STDEV.P는 전수 데이터용으로 n으로 나눕니다. 표본에서 1을 빼는 이유는, 일부만 봤을 때 흩어짐을 실제보다 작게 얕잡아보는 경향을 바로잡기 위해서입니다.\n\n실무 데이터는 대부분 '전체의 일부'인 경우가 많아 STDEV.S가 기본 선택입니다. 조사 대상이 빠짐없이 전부 모인 전수 데이터일 때만 STDEV.P를 씁니다. 두 값은 데이터가 많아질수록 서로 가까워집니다.",
    "params": [
      {
        "name": "숫자1",
        "required": true,
        "desc": "표준편차를 구할 첫 번째 숫자나 셀 범위. 범위를 지정하면 그 안의 숫자를 모두 사용합니다."
      },
      {
        "name": "숫자2, ...",
        "required": false,
        "desc": "이어서 계산에 넣을 추가 숫자나 범위(선택). 콤마로 최대 255개까지 나열할 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "청구액의 흩어짐(표본)",
        "formula": "=STDEV.S(B2:B11)",
        "result": "청구액의 표본 표준편차 한 값(클수록 들쭉날쭉)",
        "explain": "데이터가 전체의 일부일 때 쓰는 기본형입니다. 값이 클수록 청구액이 평균에서 크게 벌어져 있다는 뜻입니다."
      },
      {
        "level": "basic",
        "title": "같은 데이터의 모집단 표준편차",
        "formula": "=STDEV.P(B2:B11)",
        "result": "같은 데이터를 '전체'로 볼 때의 표준편차(STDEV.S보다 조금 작음)",
        "explain": "조사 대상이 빠짐없이 전부 모인 전수 데이터라면 .P를 씁니다. n으로 나눠 계산해 .S보다 값이 약간 작게 나옵니다."
      },
      {
        "level": "advanced",
        "title": "변동계수(CV)로 상품 간 변동성 비교",
        "formula": "=STDEV.S(claim_amt)/AVERAGE(claim_amt)",
        "result": "표준편차를 평균으로 나눈 상대 변동성(단위 없는 비율)",
        "explain": "평균 규모가 다른 상품끼리 '누가 더 들쭉날쭉한가'를 공정하게 비교할 수 있습니다. 표준편차만 보면 평균이 큰 상품이 불리하니, 평균으로 나눠 눈금을 맞춘 것입니다."
      },
      {
        "level": "advanced",
        "title": "특정 상품만 표준편차",
        "formula": "=STDEV.S(FILTER(claim_amt, product=\"자동차\"))",
        "result": "자동차 계약 청구액의 표본 표준편차",
        "explain": "FILTER로 자동차 계약만 뽑아 변동성을 계산합니다. 'STDEVIF' 같은 함수는 없어 FILTER와 조합합니다. (FILTER는 2021·365)"
      },
      {
        "level": "advanced",
        "title": "이상치 상한 경계(평균+2σ)",
        "formula": "=AVERAGE(claim_amt)+2*STDEV.S(claim_amt)",
        "result": "이 값을 넘는 청구는 '이례적으로 큼'으로 볼 수 있는 경계선",
        "explain": "데이터가 정규분포에 가깝다면 평균±2σ 안에 약 95%가 들어옵니다. 이 상한을 넘는 청구를 검토 대상으로 잡는 간단한 이상치 규칙으로 활용합니다."
      }
    ],
    "tips": "STDEV.S는 n−1(표본), STDEV.P는 n(모집단)으로 나눕니다 — 대부분의 실무 데이터는 표본이라 STDEV.S가 기본입니다. 셀 범위 안의 글자·빈 칸·논리값은 무시됩니다(단, 인수로 직접 넣은 TRUE/FALSE는 1/0으로 계산). 옛 STDEV=STDEV.S, STDEVP=STDEV.P와 같습니다. 분산이 필요하면 VAR.S·VAR.P를 씁니다.",
    "related": [
      "STDEVA",
      "VAR.S",
      "VAR.P",
      "AVERAGE",
      "STDEV"
    ]
  },
  {
    "id": "sumproduct",
    "name": "SUMPRODUCT",
    "category": "stat",
    "version": "all",
    "weight": 4,
    "difficulty": 4,
    "syntax": "=SUMPRODUCT(배열1, [배열2], ...)",
    "summary": "여러 배열의 같은 위치 값을 곱한 뒤 그 결과를 모두 더한다.",
    "intro": "여러 배열(줄)의 같은 위치에 있는 값을 서로 곱한 다음, 그 곱들을 전부 더하는 함수입니다.\n\n예를 들어 '건수' 열과 '단가' 열이 있으면, 중간에 곱셈용 열을 따로 만들지 않고 =SUMPRODUCT(건수, 단가) 한 줄로 총액을 바로 구합니다.\n\n진짜 강점은 조건 집계입니다. (상품=\"암보험\") 같은 조건식은 참이면 1, 거짓이면 0이 되는데, 이 1/0을 곱하면 조건에 맞는 행만 살아남습니다. SUMIFS·COUNTIFS가 없던 시절부터 쓰이던 다중조건 계산의 만능 도구이며, 지금도 복잡한 조건에 자주 씁니다.",
    "params": [
      {
        "name": "배열1",
        "required": true,
        "desc": "곱해서 더할 첫 번째 배열(셀 범위 또는 조건식). 곱하기의 기준이 된다."
      },
      {
        "name": "배열2 ...",
        "required": false,
        "desc": "같은 위치끼리 곱할 배열. 모든 배열은 행·열 크기가 같아야 한다. 하나만 넣으면 단순 합계(SUM)와 같다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "건수 × 단가 = 총액",
        "formula": "=SUMPRODUCT(C2:C6, D2:D6)",
        "result": "각 행의 가입 건수 × 보험료를 곱해 모두 더한 총 보험료",
        "explain": "같은 줄끼리 곱한 뒤 전부 더한다. 건수와 단가만 있으면 '금액' 계산 열을 따로 만들지 않아도 총액이 한 번에 나온다."
      },
      {
        "level": "basic",
        "title": "배열이 하나면 SUM과 같다",
        "formula": "=SUMPRODUCT(B2:B6)",
        "result": "B2:B6의 단순 합계",
        "explain": "배열을 하나만 넣으면 곱할 상대가 없어 그냥 더하기(SUM)와 똑같아진다. 함수 동작을 이해할 때 확인용으로 좋다."
      },
      {
        "level": "advanced",
        "title": "가중평균(건수로 가중한 평균 보험료)",
        "formula": "=SUMPRODUCT(C2:C6, D2:D6)/SUM(C2:C6)",
        "result": "가입 건수를 가중치로 반영한 평균 보험료",
        "explain": "값×가중치의 합을 가중치 합으로 나누면 가중평균이다. 단순 AVERAGE와 달리 가입 건수가 많은 상품에 더 큰 무게를 준다."
      },
      {
        "level": "advanced",
        "title": "여러 조건 개수 세기",
        "formula": "=SUMPRODUCT((B2:B100=\"암보험\")*(C2:C100=\"서울\"))",
        "result": "상품이 암보험이면서 지역이 서울인 행의 개수",
        "explain": "각 조건식이 TRUE/FALSE 배열을 만들고, 곱하면 1/0으로 바뀐다. 두 조건이 모두 참인 곳만 1이 되므로 그 합이 곧 개수가 된다."
      },
      {
        "level": "advanced",
        "title": "여러 조건 합계(SUMIFS 없이)",
        "formula": "=SUMPRODUCT((B2:B100=\"암보험\")*(C2:C100=\"서울\")*D2:D100)",
        "result": "암보험이면서 서울인 행의 청구액(D열)만 골라 더한 합계",
        "explain": "조건(1/0) 배열에 청구액을 곱하면 조건을 만족하는 행의 청구액만 남아 합산된다. 부등호·OR 등 SUMIFS로 까다로운 조건도 유연하게 처리한다."
      }
    ],
    "tips": "모든 배열은 행·열 크기가 같아야 하며 다르면 #VALUE! 오류가 난다. 범위 안에 텍스트나 빈 칸이 있으면 곱셈에서 0으로 취급되니, 조건은 곱셈(*)이나 -- (이중 부정)으로 반드시 1/0 숫자로 바꿔 준다.",
    "related": [
      "SUM",
      "SUMIFS",
      "COUNTIFS",
      "SUMIF"
    ]
  },
  {
    "id": "frequency",
    "name": "FREQUENCY",
    "category": "stat",
    "version": "all",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=FREQUENCY(데이터배열, 구간배열)  →  배열(스필)로 반환",
    "summary": "숫자를 구간(계급)별로 몇 개씩인지 세어 도수분포표를 만드는 배열 함수",
    "intro": "FREQUENCY는 숫자 데이터를 '구간(계급)별로 몇 개씩 있는지' 세어 주는 함수입니다. 나이대별 인원, 청구액 구간별 건수처럼 도수분포표(히스토그램의 표 버전)를 만들 때 씁니다.\n\n먼저 구간의 '상한값'을 세로로 적어 둡니다. 예를 들어 19, 29, 39, 49를 적으면 '19 이하 / 20~29 / 30~39 / 40~49 / 49 초과' 다섯 칸으로 나눠 셉니다. 그래서 결과 칸은 항상 구간 개수보다 1개 더 많습니다(마지막 칸 = 상한 최댓값을 넘는 값의 개수).\n\nFREQUENCY는 여러 칸을 한꺼번에 채우는 '배열 함수'입니다. Microsoft 365·Excel 2021에서는 첫 칸에 =FREQUENCY(...)만 입력하면 나머지 칸이 자동으로 흘러넘쳐(스필) 채워집니다. 예전 버전(2019 이하)에서는 결과가 들어갈 칸을 먼저 모두 선택한 뒤 수식을 입력하고 Ctrl+Shift+Enter로 확정해야 합니다.",
    "params": [
      {
        "name": "데이터배열",
        "required": true,
        "desc": "개수를 세고 싶은 원본 숫자들의 범위(예: 가입자 나이 목록, 청구액 목록). 글자·빈 칸은 무시됩니다."
      },
      {
        "name": "구간배열",
        "required": true,
        "desc": "각 구간의 '상한값'을 담은 범위 또는 배열 상수. 오름차순으로 적으며, 각 구간은 그 상한값을 '포함'(이하)해서 셉니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "나이대별 인원 세기 (365 스필)",
        "formula": "=FREQUENCY(B2:B101, D2:D5)",
        "result": "5칸으로 스필된 배열, 예: {12; 34; 28; 19; 7}",
        "explain": "B열 나이를 D열 상한값(19·29·39·49)의 구간으로 나눠 몇 명씩인지 셉니다. 결과는 상한 4개보다 하나 많은 5칸(마지막은 '49 초과')으로 자동으로 채워집니다."
      },
      {
        "level": "basic",
        "title": "옛 버전 배열 수식으로 확정",
        "formula": "{=FREQUENCY(B2:B11, D2:D5)}",
        "result": "미리 선택해 둔 F2:F6에 구간별 개수가 한 번에 입력됨",
        "explain": "Excel 2019 이하에서는 결과 칸(F2:F6) 5개를 먼저 선택하고 수식을 넣은 뒤 Ctrl+Shift+Enter로 확정합니다. 중괄호 { }는 배열 수식이라는 표시로 자동으로 붙습니다."
      },
      {
        "level": "advanced",
        "title": "청구액 구간별 건수 (배열 상수로 상한 지정)",
        "formula": "=FREQUENCY(C2:C500, {1000000;5000000;10000000})",
        "result": "4칸 배열: 100만↓ / 100만~500만 / 500만~1000만 / 1000만↑ 건수",
        "explain": "청구액을 100만·500만·1000만 원 경계로 나눠 소액~고액 분포를 봅니다. 구간 상한을 셀 대신 수식 안 배열 상수({ })로 바로 적을 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "구간별 개수를 비율(%)로 환산",
        "formula": "=FREQUENCY(B2:B101, D2:D5) / COUNT(B2:B101)",
        "result": "각 구간의 비율 배열, 예: {0.12; 0.34; 0.28; 0.19; 0.07}",
        "explain": "구간별 개수를 전체 개수로 나눠 '몇 %가 이 구간에 있는지'를 한 번에 구합니다. 스필 배열끼리 나눠져 비율 배열이 만들어집니다(백분율 서식 적용)."
      },
      {
        "level": "advanced",
        "title": "고유값 개수 세기 (MATCH 결합 관용식)",
        "formula": "=SUM(IF(FREQUENCY(MATCH(B2:B101,B2:B101,0),ROW(B2:B101)-ROW(B2)+1)>0,1))",
        "result": "B열의 서로 다른 값(고유값) 개수",
        "explain": "FREQUENCY를 MATCH와 엮으면 '고유값 개수'를 세는 유명한 관용식이 됩니다. 각 값의 첫 등장 위치만 1로 세는 원리입니다. 365에서는 =COUNTA(UNIQUE(...))가 훨씬 간단합니다."
      }
    ],
    "related": [
      "COUNTIF",
      "COUNTIFS",
      "MATCH",
      "UNIQUE",
      "SUMPRODUCT"
    ],
    "tips": "결과 칸은 구간 개수보다 항상 1개 많습니다(마지막 칸 = 상한 최댓값 초과분). 구간 상한값은 오름차순으로 적고, 각 구간은 상한값을 '포함'(이하)해서 셉니다. 스필로 채워진 결과의 일부만 지우거나 덮어쓸 수 없고, 배열 전체를 함께 다뤄야 합니다."
  },
  {
    "id": "quartile-exc",
    "name": "QUARTILE.EXC",
    "category": "stat",
    "version": "all",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=QUARTILE.EXC(배열, 사분위수)",
    "summary": "데이터를 4등분하는 위치(25·50·75%)의 값을 구한다(양 끝 최솟·최댓값 제외 방식).",
    "intro": "QUARTILE.EXC도 데이터를 4등분하는 위치의 값을 구하지만, 계산 방식이 QUARTILE.INC와 조금 다릅니다. '.EXC'는 Exclusive(제외)의 약자로, 양 끝인 0%(최솟값)와 100%(최댓값)를 제외하고 그 사이만 나눕니다.\n\n그래서 두 번째 인수에는 1(25%), 2(50%), 3(75%)만 넣을 수 있고, 0이나 4를 넣으면 오류(#NUM!)가 납니다. 계산할 때 위치를 데이터 개수 n이 아니라 (n+1) 기준으로 잡기 때문에, 같은 데이터라도 QUARTILE.INC보다 바깥쪽(더 극단적인) 값이 나오는 경향이 있습니다.\n\n표본으로 전체 집단의 사분위수를 좀 더 보수적으로 추정하고 싶을 때 EXC 방식을 씁니다. 어느 방식이 '정답'이라기보다, 보고서나 통계 관례에 맞춰 INC와 EXC 중 하나를 골라 일관되게 쓰면 됩니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "사분위수를 구할 숫자 셀 범위 또는 배열입니다. 문자열·빈 칸은 무시됩니다."
      },
      {
        "name": "사분위수",
        "required": true,
        "desc": "1~3만 지정합니다. 1=25%, 2=50%, 3=75%. 0(최솟값)·4(최댓값)를 넣으면 오류가 납니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "1사분위수(25%) — 제외 방식",
        "formula": "=QUARTILE.EXC(B2:B21, 1)",
        "result": "EXC 방식의 하위 25% 값 (INC보다 조금 작게 나오는 편)",
        "explain": "양 끝을 제외하고 계산하는 방식으로 1사분위를 구합니다. 같은 데이터라도 QUARTILE.INC보다 바깥쪽 값이 나오는 경향이 있습니다."
      },
      {
        "level": "basic",
        "title": "3사분위수(75%) — 제외 방식",
        "formula": "=QUARTILE.EXC(B2:B21, 3)",
        "result": "EXC 방식의 하위 75%(상위 25% 경계) 값",
        "explain": "인수 3으로 상위 25% 경계를 EXC 방식으로 구합니다. EXC에는 1·2·3만 넣을 수 있다는 점을 기억하세요."
      },
      {
        "level": "advanced",
        "title": "INC와 EXC 결과 차이 확인",
        "formula": "=QUARTILE.EXC(B2:B21, 1) - QUARTILE.INC(B2:B21, 1)",
        "result": "두 방식의 1사분위 차이 (보통 0이 아님)",
        "explain": "같은 데이터라도 계산 방식이 달라 값이 벌어집니다. 그 차이를 직접 확인해 어느 방식을 보고서에 쓸지 판단할 때 씁니다."
      },
      {
        "level": "advanced",
        "title": "0을 넣으면 오류 → 안전하게 처리",
        "formula": "=IFERROR(QUARTILE.EXC(B2:B21, 0), \"EXC는 0·4를 못 씀\")",
        "result": "#NUM! 오류 대신 안내 문구 표시",
        "explain": "EXC는 최솟값(0)·최댓값(4)을 지원하지 않아 오류가 납니다. IFERROR로 감싸 오류 대신 이유를 표시하면 표가 깨지지 않고 깔끔해집니다."
      },
      {
        "level": "advanced",
        "title": "세 사분위수 한 번에 (스필)",
        "formula": "=QUARTILE.EXC(B2:B21, SEQUENCE(3, 1, 1, 1))",
        "result": "세로 3칸에 25%·50%·75% 값이 자동으로 채워짐(스필)",
        "explain": "SEQUENCE로 1~3을 만들어 넣으면 EXC 방식 사분위 세 개가 한 수식으로 펼쳐집니다(스필, 2021 이상). 0·4는 EXC가 지원하지 않으므로 1부터 시작합니다."
      }
    ],
    "related": [
      "QUARTILE.INC",
      "PERCENTILE.EXC",
      "MEDIAN"
    ],
    "tips": "인수 0(최솟값)이나 4(최댓값)를 넣으면 #NUM! 오류가 납니다. 최솟·최댓값은 MIN·MAX를 쓰세요. 데이터 개수가 아주 적으면 원하는 백분위 위치를 잡을 수 없어 역시 #NUM!이 날 수 있습니다. INC와 EXC는 결과가 다르므로, 한 보고서 안에서 섞어 쓰지 말고 방식을 통일하세요."
  },
  {
    "id": "randarray",
    "name": "RANDARRAY",
    "category": "stat",
    "version": "2021",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=RANDARRAY([행수], [열수], [최솟값], [최댓값], [정수여부])",
    "summary": "원하는 크기(행×열)의 난수 배열을 한 번에 스필로 만드는 함수. 범위와 정수/소수까지 지정할 수 있어 시뮬레이션·랜덤 표본 추출에 쓴다.",
    "intro": "RANDARRAY는 '무작위 숫자(난수)로 채운 표'를 한 방에 만들어 주는 함수예요. 예전에는 RAND나 RANDBETWEEN을 셀마다 복사해서 붙여야 했는데, RANDARRAY는 \"몇 행 몇 열짜리 난수를 줘\"라고 한 번만 입력하면 나머지 칸까지 자동으로 채워집니다(이렇게 자동으로 아래·오른쪽으로 퍼지는 걸 '스필(spill)'이라고 해요).\n\n인수는 모두 생략 가능합니다. 그냥 =RANDARRAY()만 쓰면 0과 1 사이의 소수 하나가 나오고, 크기·범위·정수여부를 지정하면 원하는 형태로 바뀌어요. 예를 들어 \"1부터 100까지 정수를, 5행 2열로\" 같은 식이죠.\n\n주의할 점 하나. RANDARRAY는 '휘발성(volatile)' 함수라서, 값을 바꾸거나 파일을 열거나 F9(재계산)를 누를 때마다 매번 새 난수로 다시 계산됩니다. 그래서 뽑은 난수를 고정하고 싶다면, 결과를 복사한 뒤 '값 붙여넣기'로 붙여 넣어야 값이 그대로 남습니다. 보험·데이터 실무에서는 청구 건수·손해액을 흉내 내는 몬테카를로 시뮬레이션이나, 계약 데이터에서 무작위 표본을 뽑을 때 특히 유용합니다.",
    "params": [
      {
        "name": "행수",
        "required": false,
        "desc": "만들 난수 배열의 행(세로) 개수. 생략하면 1. 예: 1000이면 1000행짜리 시뮬레이션."
      },
      {
        "name": "열수",
        "required": false,
        "desc": "만들 난수 배열의 열(가로) 개수. 생략하면 1."
      },
      {
        "name": "최솟값",
        "required": false,
        "desc": "난수가 가질 수 있는 가장 작은 값. 생략하면 0."
      },
      {
        "name": "최댓값",
        "required": false,
        "desc": "난수가 가질 수 있는 가장 큰 값. 생략하면 1. (최솟값보다 커야 함)"
      },
      {
        "name": "정수여부",
        "required": false,
        "desc": "TRUE면 정수만, FALSE(또는 생략)면 소수까지 포함한 난수를 만든다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "가장 단순하게 난수 1개",
        "formula": "=RANDARRAY()",
        "result": "0 이상 1 미만의 소수 1개 (예: 0.4820913)",
        "explain": "인수를 하나도 안 쓰면 0~1 사이 소수 하나가 나와요. RAND()와 똑같은 동작이라 '난수가 뭔지' 감을 잡는 첫 실행으로 좋습니다. F9를 누르면 값이 계속 바뀌는 걸 볼 수 있어요."
      },
      {
        "level": "basic",
        "title": "5행 2열, 1~100 정수 표 만들기",
        "formula": "=RANDARRAY(5, 2, 1, 100, TRUE)",
        "result": "1~100 사이 정수가 채워진 5행×2열 배열이 스필로 펼쳐짐",
        "explain": "\"5행 2열, 1부터 100까지, 정수로\"를 한 번에 지정했어요. 한 셀에만 입력해도 아래·오른쪽으로 10칸이 자동으로 채워집니다(스필). 마지막 TRUE를 FALSE로 바꾸면 1.4·88.7 같은 소수가 나와요. 예: 주사위·추첨번호·테스트용 더미 데이터 만들기."
      },
      {
        "level": "advanced",
        "title": "복원추출로 청구액 부트스트랩 표본 뽑기",
        "formula": "=INDEX(청구액, RANDARRAY(1000, 1, 1, ROWS(청구액), TRUE))",
        "result": "실제 청구액 목록에서 무작위로 1000건을 뽑은 1열 배열 (같은 값 중복 허용)",
        "explain": "RANDARRAY로 1~(데이터 행수) 범위의 정수 위치 1000개를 만들고, 그 위치를 INDEX에 넘겨 실제 청구액을 뽑아냅니다. 통계에서 말하는 '부트스트랩(복원추출)'이에요. 이 표본으로 AVERAGE·PERCENTILE을 구하면 평균·분위수의 변동을 가늠할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "계약 목록을 무작위로 섞어 표본 감사 대상 뽑기",
        "formula": "=TAKE(SORTBY(policy, RANDARRAY(ROWS(policy))), 30)",
        "result": "전체 계약을 랜덤 순서로 섞은 뒤 위에서 30건만 잘라낸 배열 (비복원 무작위 추출)",
        "explain": "각 계약마다 난수 하나를 붙여(RANDARRAY) 그 난수 순으로 정렬(SORTBY)하면 목록이 무작위로 섞여요. 여기서 TAKE로 위 30건만 가져오면 '겹치지 않는 랜덤 표본 30건'이 됩니다. 감사·품질검토 대상 무작위 선정에 자주 쓰는 패턴이에요. (TAKE는 M365 전용)"
      },
      {
        "level": "advanced",
        "title": "몬테카를로 — 균등분포 손해액 1만 건 평균",
        "formula": "=AVERAGE(RANDARRAY(10000, 1, 100, 5000))",
        "result": "100~5000 사이 균등 난수 1만 개의 평균 (약 2550 부근에서 재계산마다 변동)",
        "explain": "손해액이 100~5000 사이에서 고르게 발생한다고 가정하고 1만 건을 흉내 낸 뒤 평균을 냅니다. 정수여부를 생략(FALSE)해 소수까지 포함한 연속형 값으로 시뮬레이션했어요. F9를 누를 때마다 표본이 새로 뽑혀 평균이 조금씩 흔들리는데, 이 흔들림이 곧 추정의 불확실성입니다. 결과를 고정하려면 값 붙여넣기 하세요."
      }
    ],
    "related": [
      "RAND",
      "RANDBETWEEN",
      "SEQUENCE",
      "SORTBY",
      "INDEX",
      "TAKE"
    ],
    "tips": "① 휘발성 함수라 셀을 건드릴 때마다 난수가 다시 생성됩니다. 특정 결과를 남기려면 복사 후 '값 붙여넣기'. ② 최댓값이 최솟값보다 작으면 #VALUE! 오류가 납니다. ③ 정수여부를 TRUE로 하면 최솟값·최댓값도 정수로 취급됩니다. ④ 스필이 펼쳐질 자리에 다른 값이 있으면 #SPILL! 오류가 나므로 아래·오른쪽 공간을 비워 두세요. ⑤ RANDBETWEEN은 정수 1개만 주지만, RANDARRAY는 소수/정수를 배열로 한 번에 준다는 점이 다릅니다."
  },
  {
    "id": "rank-eq",
    "name": "RANK.EQ",
    "category": "stat",
    "version": "all",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=RANK.EQ(순위구할값, 참조범위, [정렬방식])",
    "summary": "숫자 목록에서 특정 값이 몇 등인지 순위를 매긴다(같은 값은 같은 등수).",
    "intro": "RANK.EQ는 \"이 숫자가 목록에서 몇 등이야?\"를 계산하는 함수입니다. 기본은 큰 값이 1등인 내림차순이라, 매출·보험료·성과처럼 클수록 좋은 값의 순위를 매길 때 바로 씁니다.\n\n이름 뒤의 .EQ는 'Equal(동일)'이라는 뜻입니다. 같은 값이 여러 개면 모두 같은 등수를 주고, 다음 등수는 건너뜁니다. 예를 들어 2등이 두 명이면 둘 다 2등이고 그다음은 3등이 아니라 4등이 됩니다.\n\n순위를 반대로(작은 값이 1등) 매기고 싶으면 세 번째 인수에 0이 아닌 값(보통 1)을 넣으면 됩니다. 요금·손해율처럼 작을수록 좋은 값에 유용합니다.",
    "params": [
      {
        "name": "순위구할값",
        "required": true,
        "desc": "순위를 알고 싶은 하나의 숫자(보통 셀 참조)."
      },
      {
        "name": "참조범위",
        "required": true,
        "desc": "비교 대상이 되는 숫자 목록. 문자·빈칸은 무시됩니다. 채우기 복사 시 $로 고정하세요."
      },
      {
        "name": "정렬방식",
        "required": false,
        "desc": "0 또는 생략=내림차순(큰 값이 1등), 0이 아닌 값(예: 1)=오름차순(작은 값이 1등)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "보험료 실적 순위 매기기",
        "formula": "=RANK.EQ(B2, $B$2:$B$11)",
        "result": "예: 3 (3등)",
        "explain": "설계사 11명의 보험료 실적(B2:B11) 중 B2가 몇 등인지 구합니다. 큰 값이 1등이라 실적이 높을수록 앞 순위예요. 아래로 복사할 수 있게 범위는 $로 고정했습니다."
      },
      {
        "level": "basic",
        "title": "작은 값이 1등인 순위(손해율 낮은 순)",
        "formula": "=RANK.EQ(B2, $B$2:$B$11, 1)",
        "result": "예: 2 (두 번째로 낮음)",
        "explain": "세 번째 인수에 1을 주면 오름차순이 되어 가장 작은 값이 1등입니다. 손해율·불만율처럼 낮을수록 좋은 지표의 순위를 매길 때 씁니다."
      },
      {
        "level": "advanced",
        "title": "동점 없이 유일한 순위 만들기",
        "formula": "=RANK.EQ(B2, $B$2:$B$11) + COUNTIF($B$2:B2, B2) - 1",
        "result": "동점이어도 1,2,3…처럼 서로 다른 순위",
        "explain": "RANK.EQ는 동점에 같은 등수를 줍니다. 위쪽에서 같은 값이 몇 번 나왔는지(COUNTIF, 시작만 $로 고정) 더해 주면 동점끼리도 순서가 갈려 완전히 유일한 순위가 만들어져요. 정렬·추첨 기준에 편리합니다."
      },
      {
        "level": "advanced",
        "title": "상품별(그룹 안) 순위 매기기",
        "formula": "=SUMPRODUCT(($D$2:$D$101=D2)*($C$2:$C$101>C2)) + 1",
        "result": "같은 상품군 안에서의 등수",
        "explain": "RANK.EQ에는 조건 옵션이 없어 그룹별 순위를 직접 만듭니다. '같은 상품(D열)이면서 나보다 청구액(C열)이 큰 건수'를 세고 1을 더하면 그 상품 안에서의 순위가 됩니다. 상품별 Top 실적을 뽑을 때 좋아요."
      },
      {
        "level": "advanced",
        "title": "순위로 1등 이름 자동 찾기",
        "formula": "=INDEX($A$2:$A$11, MATCH(1, RANK.EQ($B$2:$B$11, $B$2:$B$11), 0))",
        "result": "실적 1등의 이름",
        "explain": "전체 범위의 순위를 한 번에 구한 뒤, 그 안에서 '1'의 위치를 MATCH로 찾고 INDEX로 이름을 가져옵니다. 값이 바뀌면 1등 이름도 자동으로 갱신되는 대시보드용 수식이에요."
      }
    ],
    "related": [
      "RANK.AVG",
      "LARGE",
      "COUNTIF",
      "SUMPRODUCT"
    ],
    "tips": "동점 처리를 '평균 순위'로 하고 싶으면 RANK.EQ 대신 RANK.AVG를 씁니다(예: 2등 둘이면 2.5등). 참조범위에 순위구할값이 없으면 #N/A가 납니다. 큰 값이 1등(내림차순)이 기본이라는 점을 항상 확인하세요."
  },
  {
    "id": "var-s",
    "name": "VAR.S",
    "category": "stat",
    "version": "all",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=VAR.S(숫자1, [숫자2], ...)",
    "summary": "표본 데이터를 기준으로 모집단의 분산을 추정한다(편차 제곱합을 n−1로 나눔).",
    "intro": "VAR.S는 '데이터가 평균에서 얼마나 흩어져 있는지'를 하나의 숫자로 알려주는 함수입니다. 값이 클수록 데이터가 넓게 퍼져 있고, 작을수록 평균 근처에 옹기종기 모여 있다는 뜻입니다.\n\n여기서 '.S'는 표본(Sample)을 의미합니다. 전체 데이터(모집단)를 다 가진 게 아니라 그중 일부만 뽑아 조사할 때 씁니다. 예를 들어 전체 계약 100만 건 중 500건만 골라 청구액이 얼마나 들쭉날쭉한지 볼 때가 이런 경우입니다. 이때 VAR.S는 편차를 제곱해 더한 값을 개수 n이 아니라 n−1로 나누어, 표본만 보고도 전체의 흩어짐을 조금 더 크게(보수적으로) 추정합니다.\n\n전체 데이터를 빠짐없이 다 가지고 있을 때는 VAR.S 대신 VAR.P를 씁니다. 또 분산(VAR.S)에 제곱근을 씌우면 우리가 흔히 쓰는 표준편차(STDEV.S)가 됩니다.",
    "params": [
      {
        "name": "숫자1",
        "required": true,
        "desc": "표본분산을 구할 첫 번째 숫자·셀 범위·배열입니다. 전체가 아닌 표본 데이터를 넣습니다."
      },
      {
        "name": "숫자2",
        "required": false,
        "desc": "이어서 계산에 넣을 숫자나 셀 범위입니다. 최대 255개까지 추가할 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "청구액 표본의 분산 구하기",
        "formula": "=VAR.S(B2:B21)",
        "result": "표본분산 값 하나 (예: 152000)",
        "explain": "B2:B21에 담긴 청구액 표본이 평균에서 얼마나 흩어져 있는지를 분산으로 구합니다. 20건은 전체 계약 중 뽑은 표본이므로 .P가 아닌 .S를 씁니다."
      },
      {
        "level": "basic",
        "title": "숫자를 직접 넣어 분산 구하기",
        "formula": "=VAR.S(12, 15, 9, 14, 11)",
        "result": "5개 값의 표본분산 (약 5.3)",
        "explain": "셀 대신 숫자를 직접 적어도 됩니다. 흩어짐이 클수록 값이 커집니다. 함수가 어떻게 동작하는지 감을 잡을 때 좋습니다."
      },
      {
        "level": "advanced",
        "title": "표준편차와의 관계 확인(제곱근)",
        "formula": "=SQRT(VAR.S(B2:B21))",
        "result": "STDEV.S(B2:B21)와 동일한 표준편차 값",
        "explain": "분산에 제곱근(SQRT)을 씌우면 표준편차가 됩니다. =STDEV.S(B2:B21) 결과와 같은지 비교하며 분산과 표준편차의 관계를 눈으로 확인할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "변동계수(CV)로 상품 간 위험 비교",
        "formula": "=SQRT(VAR.S(B2:B21))/AVERAGE(B2:B21)",
        "result": "표준편차 ÷ 평균 (예: 0.34)",
        "explain": "규모가 다른 상품들의 청구액 변동성을 공정하게 비교하려면 표준편차를 평균으로 나눈 변동계수를 씁니다. 값이 클수록 평균 대비 더 들쭉날쭉하다는 뜻입니다."
      },
      {
        "level": "advanced",
        "title": "특정 상품만 골라 분산 (FILTER 결합)",
        "formula": "=VAR.S(FILTER(claim_amt, product=\"암보험\"))",
        "result": "암보험 청구액만의 표본분산",
        "explain": "FILTER로 상품이 '암보험'인 청구액만 뽑아 그 표본분산을 구합니다. 조건에 맞는 데이터만 동적으로 골라 변동성을 볼 때 유용합니다(2021·365의 FILTER 사용)."
      }
    ],
    "related": [
      "VAR.P",
      "STDEV.S",
      "STDEV.P",
      "VARA"
    ],
    "tips": "'.S'(표본)와 '.P'(모집단)를 혼동하기 쉽습니다. 조사 대상 전체를 다 가지고 있으면 VAR.P, 일부만 뽑은 표본이면 VAR.S입니다. 데이터가 1개뿐이면 n−1이 0이 되어 #DIV/0! 오류가 납니다. 셀 범위 안의 문자열·빈 칸·논리값은 자동으로 무시되지만, 인수로 직접 적어 넣은 TRUE는 1, FALSE는 0으로 계산됩니다."
  },
  {
    "id": "kurt",
    "name": "KURT",
    "category": "stat",
    "version": "all",
    "weight": 2,
    "difficulty": 3,
    "syntax": "=KURT(숫자1, [숫자2], ...)",
    "summary": "데이터 분포의 첨도(뾰족한 정도·꼬리 두께)를 구한다.",
    "intro": "데이터 분포가 얼마나 '뾰족한지', 그리고 극단값(두꺼운 꼬리)이 얼마나 많은지를 하나의 숫자로 알려 주는 함수입니다. 이 값을 첨도라고 합니다.\n\n기준은 정규분포(좌우 대칭 종 모양)이며, 그때 KURT 값은 0입니다. 0보다 크면 값이 평균 근처에 몰려 봉우리가 뾰족하고 꼬리가 두꺼워 큰 이탈값이 더 자주 나옵니다. 0보다 작으면 값이 고르게 퍼져 봉우리가 완만합니다.\n\n보험 손해액처럼 가끔 아주 큰 청구가 튀는 데이터의 위험 성격을 파악할 때 유용합니다. 계산하려면 값이 최소 4개 있어야 합니다.",
    "params": [
      {
        "name": "숫자1",
        "required": true,
        "desc": "첨도를 구할 첫 번째 값 또는 셀 범위. 보통 여기에 분석할 데이터 범위를 넣는다."
      },
      {
        "name": "숫자2 ...",
        "required": false,
        "desc": "추가 값이나 범위. 전체 유효 숫자가 4개 미만이면 #DIV/0! 오류가 난다. 범위 안 문자·빈 칸은 무시된다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "청구액 분포의 첨도",
        "formula": "=KURT(B2:B101)",
        "result": "청구액 100건의 초과첨도(예: 1.85). 0보다 크면 정규분포보다 뾰족하고 꼬리가 두껍다",
        "explain": "데이터가 평균 근처에 얼마나 쏠려 있고 극단값이 얼마나 많은지를 숫자 하나로 요약한다. 범위만 넣으면 되고 값이 4개 이상이어야 한다."
      },
      {
        "level": "basic",
        "title": "숫자를 직접 넣기",
        "formula": "=KURT(3, 4, 4, 5, 5, 5, 6, 6, 7)",
        "result": "입력한 값들의 첨도",
        "explain": "범위 대신 숫자를 나열해도 된다. 동작을 이해할 때 작은 표본으로 시험해 보기 좋다. 값이 4개 미만이면 #DIV/0! 오류가 난다."
      },
      {
        "level": "advanced",
        "title": "정규분포와 비교해 해석하기",
        "formula": "=IF(KURT(B2:B101)>0, \"뾰족·두꺼운 꼬리(극단손해 주의)\", \"완만·얇은 꼬리\")",
        "result": "첨도 부호로 분포 모양을 문구로 판정",
        "explain": "초과첨도는 정규분포=0이 기준. 양수면 큰 손해가 드물어도 한번 터지면 크게 튀는 위험, 음수면 값이 비교적 고르게 퍼진 분포임을 뜻한다."
      },
      {
        "level": "advanced",
        "title": "왜도와 함께 분포 진단",
        "formula": "=KURT(B2:B101)&\" / \"&SKEW(B2:B101)",
        "result": "첨도와 왜도를 함께 표시(예: 1.85 / 1.20)",
        "explain": "꼬리 두께(KURT)와 좌우 치우침(SKEW)을 같이 보면 손해액 분포가 정규분포에서 얼마나, 어느 방향으로 벗어났는지 한눈에 판단할 수 있다."
      },
      {
        "level": "advanced",
        "title": "데이터 부족 오류 방지",
        "formula": "=IFERROR(KURT(B2:B5), \"값 4개 이상 필요\")",
        "result": "유효 값이 4개 미만이면 #DIV/0! 대신 안내 문구",
        "explain": "KURT는 값이 4개 이상이고 표준편차가 0이 아니어야 계산된다. 데이터가 적은 셀에서 오류 대신 메시지를 보여 주어 표를 깔끔하게 유지한다."
      }
    ],
    "tips": "KURT가 반환하는 값은 정규분포를 0으로 삼는 '초과첨도'다(정규분포의 원래 첨도 3을 빼서 보정한 값). 유효 값이 4개 미만이거나 모든 값이 같아 표준편차가 0이면 #DIV/0! 오류가 난다.",
    "related": [
      "SKEW",
      "STDEV.S",
      "AVERAGE",
      "VAR.S"
    ]
  },
  {
    "id": "modesngl",
    "name": "MODE.SNGL",
    "category": "stat",
    "version": "all",
    "weight": 2,
    "difficulty": 2,
    "syntax": "=MODE.SNGL(숫자1, [숫자2], ...)",
    "summary": "가장 자주 나오는 값(최빈값)을 구합니다. 여러 개면 처음 나온 것 하나만 반환.",
    "intro": "MODE.SNGL은 데이터에서 '가장 자주 등장하는 값(최빈값)'을 찾아 줍니다. 평균·중앙값과 함께 데이터를 대표하는 값 3형제 중 하나입니다.\n\n나이, 상품코드, 청구 건수처럼 같은 값이 반복되는 데이터에서 특히 유용합니다. 예를 들어 '가장 많은 계약자 연령대'나 '가장 흔한 청구 건수'를 뽑을 때 씁니다.\n\n두 가지만 기억하면 됩니다. 첫째, 같은 값이 하나도 반복되지 않으면(전부 서로 다른 값이면) #N/A 오류가 납니다. 둘째, 최빈값이 여러 개(동점)일 때 MODE.SNGL은 처음 발견한 하나만 돌려줍니다. 동점인 최빈값을 전부 보려면 MODE.MULT를 씁니다. 이름 끝의 .SNGL은 'single(하나)'을 뜻합니다.",
    "params": [
      {
        "name": "숫자1",
        "required": true,
        "desc": "최빈값을 구할 첫 번째 숫자나 셀 범위. 범위 안의 숫자를 모두 살펴 가장 자주 나온 값을 찾습니다."
      },
      {
        "name": "숫자2, ...",
        "required": false,
        "desc": "이어서 함께 살펴볼 추가 숫자나 범위(선택). 콤마로 최대 255개까지 나열할 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "가장 흔한 나이 찾기",
        "formula": "=MODE.SNGL(B2:B50)",
        "result": "B2:B50에서 가장 자주 나온 숫자 하나",
        "explain": "범위 안에서 반복 등장이 가장 많은 값 하나를 돌려줍니다. 계약자 연령대의 대표값을 볼 때 씁니다."
      },
      {
        "level": "basic",
        "title": "최빈값 직접 확인",
        "formula": "=MODE.SNGL(3, 3, 4, 5, 5, 5, 6)",
        "result": "5",
        "explain": "5가 세 번으로 가장 많이 나오므로 5입니다. (3은 두 번, 4와 6은 한 번씩)"
      },
      {
        "level": "advanced",
        "title": "가장 많이 팔린 상품명(텍스트) 찾기",
        "formula": "=INDEX(product, MODE.SNGL(MATCH(product, product, 0)))",
        "result": "product 열에서 가장 자주 등장하는 상품명 텍스트",
        "explain": "MODE.SNGL은 숫자만 다뤄 텍스트엔 바로 못 씁니다. MATCH로 각 상품명을 '처음 나온 위치 번호'로 바꾼 뒤 그중 최빈 번호를 구하고, INDEX로 그 위치의 상품명을 꺼냅니다. (옛 버전은 Ctrl+Shift+Enter)"
      },
      {
        "level": "advanced",
        "title": "연속값은 반올림 후, 중복 없으면 안내",
        "formula": "=IFERROR(MODE.SNGL(ROUND(premium, -3)), \"중복 없음\")",
        "result": "1,000원 단위로 묶은 보험료의 최빈 구간. 겹치는 값이 없으면 \"중복 없음\"",
        "explain": "보험료처럼 소수까지 제각각인 연속값은 똑같은 값이 거의 없어 #N/A가 납니다. ROUND(자릿수 -3)로 1,000원 단위로 묶어 최빈값이 의미 있게 만들고, IFERROR로 오류에 대비했습니다."
      },
      {
        "level": "advanced",
        "title": "최빈값이 여러 개일 때 전부 보기",
        "formula": "=MODE.MULT(B2:B50)",
        "result": "동점 최빈값이 여러 개면 그 값들이 세로로 스필",
        "explain": "최빈값이 동점으로 여러 개일 때 MODE.SNGL은 하나만 주지만, MODE.MULT는 전부를 배열로 내놓습니다. (2021·365는 자동 스필, 옛 버전은 범위 선택 후 Ctrl+Shift+Enter)"
      }
    ],
    "tips": "숫자에만 작동하고 텍스트·빈 칸은 무시합니다. 겹치는 값이 하나도 없으면 #N/A 오류가 납니다. 소수까지 제각각인 연속형 데이터는 ROUND로 단위를 묶어 쓰면 유용합니다. 옛 MODE 함수는 MODE.SNGL과 결과가 같습니다.",
    "related": [
      "MODE.MULT",
      "AVERAGE",
      "MEDIAN",
      "COUNTIF"
    ]
  },
  {
    "id": "percentrank-inc",
    "name": "PERCENTRANK.INC",
    "category": "stat",
    "version": "all",
    "weight": 2,
    "difficulty": 3,
    "syntax": "=PERCENTRANK.INC(배열, 값, [유효자릿수])",
    "summary": "어떤 값이 데이터 전체에서 하위 몇 % 위치에 있는지 0~1 사이 비율로 알려준다.",
    "intro": "PERCENTRANK.INC는 \"이 값이 전체에서 대략 어느 정도 위치예요?\"라는 질문에 답해 주는 함수입니다. 예를 들어 시험 점수 목록에서 내 점수가 하위 70% 지점에 있다면 0.7을 돌려줍니다. 즉, 나보다 낮은 값이 전체의 약 70%라는 뜻입니다.\n\n결과는 항상 0(가장 작은 값)부터 1(가장 큰 값)까지의 비율입니다. 뒤에 100을 곱하면 우리가 흔히 말하는 \"백분위(퍼센타일)\"가 됩니다.\n\n이름 뒤의 .INC는 'Inclusive(포함)'라는 뜻으로, 최솟값을 0, 최댓값을 1로 양 끝점을 포함해서 계산한다는 의미입니다. 참고로 찾는 값이 데이터 사이의 어중간한 값이면 위아래 값을 이용해 비율을 자동으로 보간(사이값 계산)해 줍니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "순위를 매길 기준이 되는 숫자 데이터 범위(예: 전체 청구액 목록)."
      },
      {
        "name": "값",
        "required": true,
        "desc": "위치(백분율 순위)를 알고 싶은 하나의 값. 배열 안에 없어도 됩니다(사이값이면 보간)."
      },
      {
        "name": "유효자릿수",
        "required": false,
        "desc": "결과 비율을 몇 자리까지 표시할지. 생략하면 3자리(예: 0.333)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "내 점수의 위치 알아보기",
        "formula": "=PERCENTRANK.INC(A2:A11, 80)",
        "result": "0.7 (하위 70% 지점)",
        "explain": "A2:A11에 있는 점수들 중 80점이 어디쯤인지 알려줍니다. 0.7이면 나보다 낮은 값이 전체의 약 70%라는 뜻이에요."
      },
      {
        "level": "basic",
        "title": "특정 청구 건의 백분위",
        "formula": "=PERCENTRANK.INC($C$2:$C$101, C5)",
        "result": "예: 0.812 (상위 약 19%)",
        "explain": "청구액 목록(C2:C101)에서 C5의 청구 건이 전체에서 어느 위치인지 봅니다. 0.812면 이보다 작은 청구가 약 81%라 상당히 큰 편이라는 걸 알 수 있어요."
      },
      {
        "level": "advanced",
        "title": "백분위를 소수 넷째 자리까지 + 퍼센트로 표시",
        "formula": "=TEXT(PERCENTRANK.INC($C$2:$C$1001, C2, 4), \"0.00%\")",
        "result": "예: \"81.25%\"",
        "explain": "유효자릿수를 4로 주면 0.8125처럼 더 촘촘하게 계산합니다. 바깥을 TEXT로 감싸 사람이 읽기 쉬운 퍼센트 문자열로 바꿨어요. 보고서용 표시에 좋습니다."
      },
      {
        "level": "advanced",
        "title": "상위 10% 고액 청구 건 자동 표시",
        "formula": "=IF(PERCENTRANK.INC($C$2:$C$1001, C2) >= 0.9, \"상위10%\", \"\")",
        "result": "상위 10%면 \"상위10%\", 아니면 빈칸",
        "explain": "각 청구액의 백분위를 구해 0.9(90%) 이상이면 라벨을 붙입니다. 이렇게 도우미 열을 만들면 뒤에서 필터로 고액 청구만 뽑아 심사·모니터링할 수 있어요."
      },
      {
        "level": "advanced",
        "title": "값이 범위 밖일 때 오류 방지",
        "formula": "=IFERROR(PERCENTRANK.INC($C$2:$C$101, D2), \"범위밖\")",
        "result": "정상 비율 또는 \"범위밖\"",
        "explain": "찾는 값이 데이터의 최솟값보다 작거나 최댓값보다 크면 #N/A가 납니다. IFERROR로 감싸 두면 대량 계산 시 오류가 표에 그대로 노출되는 걸 막을 수 있어요."
      }
    ],
    "related": [
      "PERCENTILE.INC",
      "RANK.EQ",
      "QUARTILE.INC"
    ],
    "tips": "찾는 값이 배열의 최솟값~최댓값 사이를 벗어나면 #N/A가 납니다. 최솟값을 0, 최댓값을 1에 두는 .INC와 달리, 양 끝점을 제외하는 PERCENTRANK.EXC는 결과가 1/(n+1)~n/(n+1) 범위로 나옵니다. 결과 0.7은 '백분위 70'과 같은 의미(×100)입니다."
  },
  {
    "id": "skew",
    "name": "SKEW",
    "category": "stat",
    "version": "all",
    "weight": 2,
    "difficulty": 3,
    "syntax": "=SKEW(값1, [값2], …)",
    "summary": "데이터 분포가 한쪽으로 얼마나 치우쳤는지(왜도)를 숫자 하나로 나타낸다.",
    "intro": "SKEW는 데이터가 평균을 중심으로 좌우 대칭인지, 아니면 한쪽으로 꼬리가 길게 늘어졌는지(치우침)를 알려주는 함수입니다. 이 치우침 정도를 '왜도(skewness)'라고 부릅니다.\n\n결과가 0에 가까우면 좌우 대칭, 양수(+)면 오른쪽으로 꼬리가 긴 분포입니다. 보험 청구액처럼 대부분은 소액이지만 가끔 아주 큰 값이 섞이는 데이터가 대표적인 오른쪽 꼬리(양의 왜도) 분포예요. 반대로 음수(−)면 왼쪽으로 꼬리가 깁니다.\n\n왜도를 보면 평균과 중앙값만으로는 놓치기 쉬운 '분포의 모양'을 파악할 수 있습니다. 예컨대 양의 왜도가 크면 소수의 고액 청구가 평균을 끌어올리고 있다는 신호라, 위험 분석이나 요율 산정에서 중요한 단서가 됩니다.",
    "params": [
      {
        "name": "값1",
        "required": true,
        "desc": "왜도를 계산할 첫 번째 숫자 또는 범위. 보통 데이터 범위 하나를 지정합니다."
      },
      {
        "name": "값2 …",
        "required": false,
        "desc": "추가로 포함할 숫자·범위(최대 255개까지). 떨어진 여러 범위를 함께 넣을 때 사용."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "청구액 분포의 치우침 보기",
        "formula": "=SKEW(C2:C101)",
        "result": "예: 2.34 (오른쪽 꼬리, 강한 치우침)",
        "explain": "청구액 데이터의 왜도를 구합니다. 값이 양수이고 클수록 소수의 고액 청구 때문에 오른쪽으로 길게 늘어진 분포라는 뜻이에요. 0에 가까우면 대칭입니다."
      },
      {
        "level": "basic",
        "title": "작은 데이터의 대칭 여부 확인",
        "formula": "=SKEW(B2:B11)",
        "result": "예: -0.12 (거의 대칭)",
        "explain": "값이 0 근처면 좌우가 비교적 균형 잡힌 분포입니다. 계산에는 데이터가 최소 3개 이상 있어야 하고, 값이 모두 같으면 #DIV/0! 오류가 납니다."
      },
      {
        "level": "advanced",
        "title": "왜도를 말로 자동 해석하기",
        "formula": "=IF(SKEW(C2:C101)>0.5, \"오른쪽 꼬리(고액청구 존재)\", IF(SKEW(C2:C101)<-0.5, \"왼쪽 꼬리\", \"거의 대칭\"))",
        "result": "\"오른쪽 꼬리(고액청구 존재)\" 등 설명 문구",
        "explain": "왜도 값을 ±0.5 기준으로 나눠 사람이 읽기 쉬운 문장으로 바꿉니다. 대시보드에서 숫자 대신 해석을 바로 보여 주고 싶을 때 유용해요."
      },
      {
        "level": "advanced",
        "title": "평균·중앙값과 함께 분포 진단",
        "formula": "=IF(AND(SKEW(C2:C101)>1, AVERAGE(C2:C101)>MEDIAN(C2:C101)), \"평균이 고액에 끌려 과대\", \"대표값으로 평균 사용 가능\")",
        "result": "평균 신뢰 여부에 대한 판단 문구",
        "explain": "왜도가 크고(오른쪽 치우침) 평균이 중앙값보다 확실히 크면, 소수의 고액 청구가 평균을 부풀리고 있다는 신호입니다. 이럴 땐 평균보다 중앙값이 대표값으로 더 안전하다는 걸 알려 줘요."
      },
      {
        "level": "advanced",
        "title": "상품 A와 B의 치우침 비교",
        "formula": "=SKEW(C2:C101) - SKEW(F2:F101)",
        "result": "두 상품 왜도의 차이(양수면 A가 더 오른쪽 치우침)",
        "explain": "상품 A(C열)와 B(F열)의 왜도를 각각 구해 뺍니다. 어느 상품의 청구 분포가 더 극단적인 고액 위험을 안고 있는지 한눈에 비교할 수 있어요."
      }
    ],
    "related": [
      "SKEW.P",
      "KURT",
      "AVERAGE",
      "MEDIAN",
      "STDEV.S"
    ],
    "tips": "SKEW는 표본 기준 왜도이고, 모집단 전체 기준으로 계산하려면 SKEW.P(엑셀 2013+)를 씁니다. 데이터가 3개 미만이거나 표준편차가 0(모든 값이 동일)이면 #DIV/0! 오류가 납니다. 텍스트·빈칸은 자동으로 무시되지만, 0으로 취급해야 할 값이 빈칸이면 결과가 달라질 수 있으니 주의하세요."
  },
  {
    "id": "trimmean",
    "name": "TRIMMEAN",
    "category": "stat",
    "version": "all",
    "weight": 2,
    "difficulty": 2,
    "syntax": "=TRIMMEAN(배열, 비율)",
    "summary": "상·하위 극단값을 일정 비율 잘라내고 남은 값의 평균을 구한다.",
    "intro": "양쪽 끝의 극단값을 잘라낸 뒤 남은 값들로 평균을 내는 함수입니다. '절사평균'이라고 부릅니다.\n\n비율을 0.2로 주면 위쪽 10%와 아래쪽 10%, 합쳐서 20%를 버리고 가운데 값들만 평균합니다. 유난히 크거나 작은 몇 개 값에 평균이 휘둘리는 것을 막아 줍니다.\n\n심사위원 점수에서 최고·최저를 빼고 평균 내거나, 소수의 대형 청구액이 평균 손해액을 부풀리는 상황에서 더 대표성 있는 중심값을 구할 때 씁니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "평균을 구할 값들의 셀 범위 또는 배열."
      },
      {
        "name": "비율",
        "required": true,
        "desc": "잘라낼 비율(0 이상 1 미만). 0.2면 위·아래 각각 10%씩, 총 20%를 제외한다. 0이면 전체 평균과 같다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "상·하위 10%씩 잘라낸 평균",
        "formula": "=TRIMMEAN(B2:B21, 0.2)",
        "result": "20개 값 중 위·아래 각 10%(각 2개, 총 4개)를 뺀 나머지 16개의 평균",
        "explain": "비율 0.2는 위 10%와 아래 10%를 뜻한다. 유난히 크거나 작은 극단값을 빼고 평균을 내 이상치에 흔들리지 않는다."
      },
      {
        "level": "basic",
        "title": "5%씩만 살짝 잘라내기",
        "formula": "=TRIMMEAN(B2:B101, 0.1)",
        "result": "위·아래 각 5%를 제외한 나머지의 평균",
        "explain": "비율이 작을수록 조금만 잘라낸다. 비율을 0으로 주면 아무것도 자르지 않아 그냥 전체 평균(AVERAGE)과 같아진다."
      },
      {
        "level": "advanced",
        "title": "일반 평균과 비교해 이상치 영향 보기",
        "formula": "=AVERAGE(B2:B21)-TRIMMEAN(B2:B21, 0.2)",
        "result": "두 평균의 차이. 클수록 극단값이 평균을 끌어올리거나 내린 정도가 크다",
        "explain": "차이가 크다면 소수의 큰 청구액이 평균을 왜곡하고 있다는 신호. 이럴 때 절사평균이 더 대표성 있는 중심값일 수 있다."
      },
      {
        "level": "advanced",
        "title": "최고·최저 딱 1개씩만 제외",
        "formula": "=TRIMMEAN(B2:B21, 2/COUNT(B2:B21))",
        "result": "가장 큰 값과 가장 작은 값 1개씩만 빼고 낸 평균(심사 채점식)",
        "explain": "제외 개수 = 개수 × 비율이다. 비율을 2÷개수로 주면 총 2개, 즉 양끝에서 1개씩만 잘린다. 심사위원 점수의 최고·최저 제외 평균에 유용하다."
      },
      {
        "level": "advanced",
        "title": "짝수 내림 규칙 이해하기",
        "formula": "=TRIMMEAN(B2:B22, 0.1)",
        "result": "21개 × 0.1 = 2.1 → 가장 가까운 짝수로 내림해 2개(위·아래 1개씩)만 제외",
        "explain": "엑셀은 제외 개수를 가장 가까운 짝수로 내림해 위·아래를 똑같이 자른다. 그래서 실제 제외 개수가 비율로 단순 계산한 값과 조금 다를 수 있다."
      }
    ],
    "tips": "실제 제외 개수는 'COUNT × 비율'을 가장 가까운 짝수로 내림한 뒤 위·아래로 절반씩 나눠 제거한다. 비율은 0 이상 1 미만이어야 하며, 벗어나면 #NUM! 오류가 난다. 중앙값(MEDIAN)만큼 극단에 완전히 둔감하지는 않지만 더 많은 데이터를 반영하는 절충점이다.",
    "related": [
      "AVERAGE",
      "MEDIAN",
      "AVERAGEIF",
      "LARGE"
    ]
  },
  {
    "id": "index",
    "name": "INDEX",
    "category": "lookup",
    "version": "all",
    "weight": 5,
    "difficulty": 3,
    "syntax": "=INDEX(범위, 행번호, [열번호], [영역번호])",
    "summary": "범위에서 몇 번째 행·몇 번째 열에 있는 값을 콕 집어 꺼낸다.",
    "intro": "INDEX는 표에서 '몇 번째 행, 몇 번째 열'에 있는 값을 콕 집어 꺼내는 함수입니다. 좌석표에서 '3행 2열' 자리를 찾듯이, 범위 안의 위치(행·열 번호)만 알려주면 그 자리의 값을 돌려줍니다.\n\n혼자 쓰면 '몇 번째'인지 사람이 세어야 해서 불편하지만, 위치를 자동으로 찾아 주는 MATCH와 짝을 이루면 강력해집니다. INDEX+MATCH 조합은 VLOOKUP과 달리 찾는 열이 왼쪽에 있어도 되고, 중간 열을 추가·삭제해도 잘 깨지지 않아 실무에서 가장 널리 쓰이는 조회 방식입니다.",
    "params": [
      {
        "name": "범위",
        "required": true,
        "desc": "값을 꺼내 올 표(셀 범위). 한 열·한 행·여러 행열 모두 가능하며, 괄호로 묶으면 떨어진 여러 범위도 지정할 수 있습니다."
      },
      {
        "name": "행번호",
        "required": true,
        "desc": "범위의 위에서부터 몇 번째 행인지. 0으로 두면 지정한 '열 전체'를 참조합니다."
      },
      {
        "name": "열번호",
        "required": false,
        "desc": "범위의 왼쪽에서부터 몇 번째 열인지. 범위가 한 열뿐이면 생략할 수 있습니다. 0으로 두면 '행 전체'를 참조합니다."
      },
      {
        "name": "영역번호",
        "required": false,
        "desc": "여러 개의 떨어진 범위를 지정했을 때 몇 번째 영역을 쓸지. 생략하면 1(첫 영역)로 봅니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "한 열에서 N번째 값 꺼내기",
        "formula": "=INDEX(B2:B10, 3)",
        "result": "B2:B10의 세 번째 값(B4 셀 값)",
        "explain": "범위와 순번만 주면 그 자리 값을 반환합니다. 여기서는 위에서 세 번째 값을 꺼냅니다. 열이 하나뿐이라 열 번호는 생략했습니다."
      },
      {
        "level": "basic",
        "title": "표에서 행·열 교차 값 꺼내기",
        "formula": "=INDEX(B2:E10, 4, 2)",
        "result": "범위의 4번째 행과 2번째 열이 만나는 칸의 값",
        "explain": "좌석표처럼 행 번호와 열 번호를 함께 주면, 두 위치가 교차하는 칸의 값을 돌려줍니다."
      },
      {
        "level": "advanced",
        "title": "INDEX+MATCH로 조회하기 (VLOOKUP 대체)",
        "formula": "=INDEX(D2:D100, MATCH(\"P-1007\", A2:A100, 0))",
        "result": "계약번호 P-1007에 해당하는 청구액(D열 값)",
        "explain": "MATCH가 계약번호의 위치를 찾아 그 순번을 INDEX의 행 번호로 넘깁니다. VLOOKUP과 달리 찾는 열(A)이 결과 열(D)보다 왼쪽에 있어도 되고, 중간 열을 추가·삭제해도 잘 깨지지 않습니다."
      },
      {
        "level": "advanced",
        "title": "행·열을 모두 자동으로 찾는 2차원 조회",
        "formula": "=INDEX(B2:E100, MATCH(\"P-1007\", A2:A100, 0), MATCH(\"청구액\", B1:E1, 0))",
        "result": "계약 P-1007 행과 '청구액' 머리글 열이 만나는 값",
        "explain": "MATCH 두 개로 행 위치와 열 위치를 동시에 찾아 교차 값을 꺼냅니다. 머리글 이름만 바꾸면 '보험료' 등 다른 항목도 같은 수식으로 조회됩니다."
      },
      {
        "level": "advanced",
        "title": "행 번호 0으로 열 전체를 참조해 합계",
        "formula": "=SUM(INDEX(B2:E10, 0, 3))",
        "result": "범위의 3번째 열(premium 열) 전체 합계",
        "explain": "행 번호를 0으로 두면 지정한 열 하나가 통째로 참조됩니다. 이 성질을 SUM 등과 묶으면 '몇 번째 열을 합칠지'를 수식으로 고를 수 있습니다."
      }
    ],
    "related": [
      "MATCH",
      "XMATCH",
      "VLOOKUP",
      "XLOOKUP",
      "OFFSET"
    ],
    "tips": "INDEX가 돌려주는 것은 '값'이자 '셀 참조'이기도 해서 A2:INDEX(...)처럼 범위의 끝점으로도 쓸 수 있습니다(동적 범위). VLOOKUP과 달리 찾을 열이 결과 열보다 오른쪽에 있어도 되고, 중간 열을 추가·삭제해도 잘 깨지지 않는 것이 큰 장점입니다."
  },
  {
    "id": "match",
    "name": "MATCH",
    "category": "lookup",
    "version": "all",
    "weight": 5,
    "difficulty": 2,
    "syntax": "=MATCH(찾을값, 찾을범위, [일치유형])",
    "summary": "어떤 값이 목록에서 몇 번째에 있는지 위치(순번)를 숫자로 알려준다.",
    "intro": "MATCH는 '이 값이 목록에서 몇 번째에 있나?'를 알려주는 함수입니다. 값 자체가 아니라 위치(순번)를 숫자로 돌려줍니다. 예를 들어 상품 목록에서 '자동차'가 세 번째에 있으면 3을 반환합니다.\n\n순번만 알면 뭐가 좋을까요? 그 숫자를 INDEX의 '행 번호'로 넘겨주면, 사람이 일일이 세지 않아도 원하는 값을 자동으로 꺼낼 수 있습니다. 그래서 MATCH는 거의 항상 INDEX와 짝으로 등장합니다.",
    "params": [
      {
        "name": "찾을값",
        "required": true,
        "desc": "위치를 알고 싶은 값(숫자·문자·셀 참조). 완전 일치(0)일 때는 *(여러 글자)·?(한 글자) 와일드카드도 쓸 수 있습니다."
      },
      {
        "name": "찾을범위",
        "required": true,
        "desc": "찾을값을 검색할 범위. 한 행 또는 한 열이어야 합니다."
      },
      {
        "name": "일치유형",
        "required": false,
        "desc": "0=완전 일치, 1(기본값)=찾을값 이하의 최댓값(오름차순 정렬 필요), -1=찾을값 이상의 최솟값(내림차순 정렬 필요). 정확히 찾으려면 0을 권장합니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "값이 몇 번째인지 찾기(문자)",
        "formula": "=MATCH(\"자동차\", A2:A10, 0)",
        "result": "'자동차'가 목록에서 몇 번째인지(예: 3)",
        "explain": "완전 일치(0)로 자동차의 위치를 숫자로 돌려줍니다. 값이 아니라 '순번'이 나온다는 점이 핵심입니다."
      },
      {
        "level": "basic",
        "title": "숫자 위치 찾기",
        "formula": "=MATCH(128, C2:C6, 0)",
        "result": "128이 있는 위치 순번",
        "explain": "숫자도 똑같이 위치를 찾습니다. 정확히 찾으려면 마지막에 0을 붙입니다."
      },
      {
        "level": "advanced",
        "title": "INDEX와 결합한 조회",
        "formula": "=INDEX(B2:B100, MATCH(\"P-1007\", A2:A100, 0))",
        "result": "계약 P-1007에 해당하는 상품명(B열 값)",
        "explain": "MATCH로 찾은 위치를 INDEX에 넘겨 원하는 값을 꺼냅니다. 실무에서 가장 흔한 조회 패턴으로, 찾을 열이 왼쪽에 있어도 동작합니다."
      },
      {
        "level": "advanced",
        "title": "구간(등급) 매칭 — 근사 검색",
        "formula": "=MATCH(720, $F$2:$F$5, 1)",
        "result": "720이 속하는 구간의 순번(기준값이 0·600·700·800이면 3)",
        "explain": "일치 유형 1은 '찾을값 이하의 최댓값'을 찾아 점수·보험료를 구간별로 나눌 때 씁니다. 단, 기준 범위는 반드시 오름차순으로 정렬돼 있어야 정확합니다."
      },
      {
        "level": "advanced",
        "title": "와일드카드로 부분 일치 위치 찾기",
        "formula": "=MATCH(\"삼성*\", A2:A100, 0)",
        "result": "'삼성'으로 시작하는 첫 항목의 위치",
        "explain": "완전 일치(0) 모드에서는 *·? 와일드카드를 쓸 수 있어, 정확한 전체 이름을 몰라도 앞부분만으로 찾을 수 있습니다."
      }
    ],
    "related": [
      "INDEX",
      "XMATCH",
      "VLOOKUP",
      "XLOOKUP"
    ],
    "tips": "마지막 인수를 생략하면 기본값이 1(근사, 오름차순 가정)이라 정렬되지 않은 목록에서는 엉뚱한 위치를 돌려줄 수 있습니다. 정확히 찾을 때는 반드시 0을 붙이세요. 대소문자는 구분하지 않지만 전각·반각 문자는 다르게 봅니다."
  },
  {
    "id": "vlookup",
    "name": "VLOOKUP",
    "category": "lookup",
    "version": "all",
    "weight": 5,
    "difficulty": 2,
    "syntax": "=VLOOKUP(찾을값, 표범위, 열번호, [일치옵션])",
    "summary": "표의 맨 왼쪽 열에서 값을 찾아 같은 행의 지정한 열 값을 가져오는 대표 검색 함수.",
    "intro": "VLOOKUP은 표의 '맨 왼쪽 열'에서 값을 찾아, 같은 행의 오른쪽 어느 열에 있는 값을 가져오는 함수입니다. V는 세로(Vertical)를 뜻합니다.\n\n예를 들어 상품 목록표에서 상품코드를 찾아 그 상품의 보험료를 가져올 때 씁니다. 실무에서 가장 널리 쓰이는 함수 중 하나라 반드시 익혀두어야 합니다.\n\n주의할 점은 ① 찾는 기준 열이 항상 표의 맨 왼쪽이어야 하고, ② 가져올 값은 그 오른쪽에 있어야 한다는 것입니다. 마지막 인수를 FALSE로 두면 '정확히 일치'하는 값을, TRUE(또는 생략)로 두면 '근삿값'을 찾습니다. 초보자는 거의 항상 FALSE(정확히 일치)를 쓰면 됩니다.",
    "params": [
      {
        "name": "찾을값",
        "required": true,
        "desc": "찾고 싶은 기준값입니다. 표의 맨 왼쪽 열에서 이 값을 찾습니다. 예: 상품코드 \"A01\"."
      },
      {
        "name": "표범위",
        "required": true,
        "desc": "검색할 표 전체 범위입니다. 이 범위의 첫 번째(맨 왼쪽) 열에 찾을값이 있어야 합니다. 예: $E$2:$G$5."
      },
      {
        "name": "열번호",
        "required": true,
        "desc": "표범위에서 가져올 값이 몇 번째 열인지 숫자로 지정합니다. 맨 왼쪽 열이 1입니다. 예: 3이면 세 번째 열."
      },
      {
        "name": "일치옵션",
        "required": false,
        "desc": "FALSE(또는 0)=정확히 일치, TRUE(또는 1·생략)=근삿값. 근삿값은 표가 오름차순 정렬되어야 합니다. 보통 FALSE를 씁니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "상품코드로 보험료 찾기(정확히 일치)",
        "formula": "=VLOOKUP(\"A01\", $E$2:$G$5, 3, FALSE)",
        "result": "코드 A01이 있는 행의 세 번째 열(보험료) 값",
        "explain": "표 E2:G5의 맨 왼쪽 열에서 \"A01\"을 찾아, 그 행의 3번째 열 값을 가져옵니다. 마지막 FALSE는 '정확히 일치하는 것만'이라는 뜻입니다. 표 범위를 $로 고정하면 아래로 수식을 복사해도 표 위치가 흔들리지 않습니다."
      },
      {
        "level": "basic",
        "title": "점수 구간으로 등급 매기기(근삿값)",
        "formula": "=VLOOKUP(87, 등급표, 2, TRUE)",
        "result": "87이 속한 구간의 등급(예: \"B\")",
        "explain": "등급표의 첫 열에 구간 하한(0·60·70·80·90…)이 오름차순으로 있을 때, TRUE를 쓰면 87 이하의 가장 가까운 값(80)을 찾아 그 등급을 가져옵니다. 구간 나누기(등급·요율 밴드)에 쓰는 방식이며, 이때는 표가 반드시 오름차순이어야 합니다."
      },
      {
        "level": "advanced",
        "title": "없는 코드일 때 오류 감추기",
        "formula": "=IFERROR(VLOOKUP(A2, 상품표, 3, FALSE), \"미등록 상품\")",
        "result": "찾으면 보험료, 못 찾으면 \"미등록 상품\"",
        "explain": "VLOOKUP은 찾는 값이 없으면 #N/A 오류를 냅니다. IFERROR로 감싸면 오류 대신 원하는 문구를 보여줄 수 있어, 보고서에 오류 표시가 그대로 노출되는 것을 막습니다."
      },
      {
        "level": "advanced",
        "title": "두 열을 합친 조합키로 찾기",
        "formula": "=VLOOKUP(A3&B3, D3:G6, 4, FALSE)",
        "result": "지역+상품을 합친 값과 일치하는 행의 4번째 열 값",
        "explain": "찾을 조건이 두 가지(예: 지역코드 A3, 상품코드 B3)일 때, A3&B3로 두 값을 이어붙여 하나의 '조합키'로 만들어 찾습니다. 표의 첫 열에도 미리 같은 방식(=D3&E3)으로 조합키를 만들어 두어야 합니다."
      },
      {
        "level": "advanced",
        "title": "열 위치를 MATCH로 자동 지정",
        "formula": "=VLOOKUP(A2, 상품표, MATCH(\"premium\", 헤더행, 0), FALSE)",
        "result": "'premium' 열이 몇 번째든 자동으로 그 값을 가져옴",
        "explain": "열번호를 3처럼 직접 쓰면, 표에 열이 추가·삭제될 때 수식을 일일이 고쳐야 합니다. MATCH로 \"premium\" 머리글이 몇 번째 열인지 찾아 넣으면, 표 구조가 바뀌어도 수식이 알아서 맞춰집니다."
      }
    ],
    "related": [
      "XLOOKUP",
      "HLOOKUP",
      "INDEX",
      "MATCH",
      "IFERROR"
    ],
    "tips": "가장 흔한 실수 세 가지: ① 가져올 값이 기준 열의 왼쪽에 있으면 VLOOKUP으로는 못 가져옵니다(XLOOKUP 또는 INDEX+MATCH 사용). ② 마지막 인수를 생략하면 근삿값(TRUE)으로 동작해 엉뚱한 값이 나올 수 있으니 정확히 찾을 땐 꼭 FALSE를 쓰세요. ③ 찾을값과 표의 값이 '숫자 vs 텍스트 숫자'로 형식이 다르면 못 찾습니다."
  },
  {
    "id": "xlookup",
    "name": "XLOOKUP",
    "category": "lookup",
    "version": "2021",
    "weight": 5,
    "difficulty": 2,
    "syntax": "=XLOOKUP(찾을값, 찾을범위, 반환범위, [없을때], [일치모드], [검색모드])",
    "summary": "찾을 범위와 가져올 범위를 따로 지정해 값을 검색하는 최신 검색 함수(VLOOKUP 대체).",
    "intro": "XLOOKUP은 '어떤 값을 기준으로 표에서 짝이 되는 값을 찾아오는' 함수입니다. 예를 들어 계약번호를 주면 그 계약의 보험료를 찾아오는 식이죠.\n\nVLOOKUP의 최신·강화 버전이라고 생각하면 됩니다. 찾을 값이 든 범위와 가져올 값이 든 범위를 따로 지정하기 때문에, VLOOKUP처럼 '표의 몇 번째 열인지 세는' 번거로움이 없고, 기준 열의 왼쪽 방향으로도 값을 가져올 수 있습니다.\n\n못 찾았을 때 대신 표시할 값, 근삿값 찾기, 아래에서 위로(역방향) 찾기 같은 기능을 한 함수 안에서 옵션으로 처리할 수 있어, 익숙해지면 검색 작업 대부분을 이 함수 하나로 해결할 수 있습니다. (엑셀 2021·Microsoft 365에서 사용 가능)",
    "params": [
      {
        "name": "찾을값",
        "required": true,
        "desc": "찾고 싶은 기준값입니다. 예: 계약번호 \"P1003\", 나이 37."
      },
      {
        "name": "찾을범위",
        "required": true,
        "desc": "찾을값을 찾아볼 한 줄(한 열 또는 한 행) 범위입니다. 예: 계약번호가 들어 있는 A2:A100."
      },
      {
        "name": "반환범위",
        "required": true,
        "desc": "찾은 자리에서 실제로 가져올 값이 들어 있는 범위입니다. 여러 열을 주면 그만큼 옆으로 펼쳐(스필) 반환합니다."
      },
      {
        "name": "없을때",
        "required": false,
        "desc": "찾는 값이 없을 때 대신 표시할 값입니다. 생략하면 오류(#N/A)가 납니다. IFERROR 없이 오류 처리를 할 수 있습니다."
      },
      {
        "name": "일치모드",
        "required": false,
        "desc": "0=정확히 일치(기본), -1=정확 또는 다음 작은 값, 1=정확 또는 다음 큰 값, 2=와일드카드(*,?) 사용."
      },
      {
        "name": "검색모드",
        "required": false,
        "desc": "1=처음부터(기본), -1=끝에서부터(역방향), 2=오름차순 이진 검색, -2=내림차순 이진 검색."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "계약번호로 보험료 찾기",
        "formula": "=XLOOKUP(\"P1003\", A2:A100, C2:C100)",
        "result": "계약번호가 P1003인 행의 보험료(예: 120000)",
        "explain": "A열(계약번호)에서 \"P1003\"을 찾아, 같은 행의 C열(보험료) 값을 가져옵니다. '어디서 찾을지'(A열)와 '무엇을 가져올지'(C열)를 따로 지정하는 것이 XLOOKUP의 기본 사용법입니다."
      },
      {
        "level": "basic",
        "title": "못 찾으면 '없음'으로 표시하기",
        "formula": "=XLOOKUP(\"P9999\", A2:A100, C2:C100, \"미등록\")",
        "result": "P9999가 없으면 오류 대신 \"미등록\"",
        "explain": "네 번째 인수(없을때)에 대체 문구를 넣으면, 찾는 값이 없을 때 #N/A 오류 대신 그 문구가 나옵니다. 초보자가 보기에도 깔끔하고, IFERROR로 감쌀 필요가 없습니다."
      },
      {
        "level": "advanced",
        "title": "한 번에 여러 열 가져오기(스필)",
        "formula": "=XLOOKUP(\"P1003\", A2:A100, C2:E100)",
        "result": "보험료·청구액·상품명 3개 값이 옆으로 펼쳐진 배열 {120000, 45000, \"암보험\"}",
        "explain": "반환범위를 여러 열(C:E)로 주면, 찾은 행의 여러 값이 한 번에 옆으로 펼쳐집니다(스필). 계약 한 건의 여러 정보를 한 수식으로 끌어올 때 유용합니다."
      },
      {
        "level": "advanced",
        "title": "나이 구간별 요율 찾기(근삿값)",
        "formula": "=XLOOKUP(37, F2:F5, G2:G5, , -1)",
        "result": "나이 37이 속한 구간(30세대)의 요율(예: 0.02)",
        "explain": "F2:F5에 구간 하한(20·30·40·50)이 오름차순으로 있을 때, 일치모드 -1(정확 또는 다음 작은 값)을 쓰면 37은 30 구간으로 잡혀 그 요율을 가져옵니다. 정확히 일치하는 값이 없어도 '해당 구간'을 찾는 방식입니다. (네 번째 인수 '없을때'는 비워 두어 건너뜁니다.)"
      },
      {
        "level": "advanced",
        "title": "가장 최근 청구 내역 찾기(역방향 검색)",
        "formula": "=XLOOKUP(\"P1003\", A2:A100, D2:D100, , , -1)",
        "result": "P1003의 마지막(가장 아래) 행에 있는 청구액",
        "explain": "같은 계약번호가 여러 번 나올 때, 검색모드 -1(끝에서부터)을 쓰면 표의 아래에서 위로 찾습니다. 시간순으로 쌓인 데이터라면 '가장 최근 건'을 집어올 수 있습니다. 앞의 콤마 두 개는 '없을때'와 '일치모드'를 건너뛴다는 표시입니다."
      }
    ],
    "related": [
      "VLOOKUP",
      "INDEX",
      "MATCH",
      "XMATCH",
      "FILTER"
    ],
    "tips": "VLOOKUP과 달리 기준 열의 왼쪽 값도 가져올 수 있고, 열 번호를 세지 않습니다. 다만 엑셀 2019 이하에서는 없는 함수라, 파일을 구버전에서 열면 동작하지 않습니다(#NAME? 또는 값 고정). 호환이 필요하면 INDEX+MATCH를 쓰세요."
  },
  {
    "id": "find-search",
    "name": "FIND · SEARCH",
    "category": "lookup",
    "version": "all",
    "weight": 4,
    "difficulty": 3,
    "syntax": "=FIND(찾을텍스트, 대상텍스트, [시작위치])  ·  =SEARCH(찾을텍스트, 대상텍스트, [시작위치])",
    "summary": "텍스트 안에서 특정 글자·단어가 몇 번째에 있는지 위치(숫자)를 찾습니다. FIND는 대소문자 구분, SEARCH는 무시+와일드카드.",
    "intro": "FIND와 SEARCH는 '이 글자가 텍스트에서 몇 번째에 있나?'를 알려주는 함수예요. 예를 들어 이메일 \"hong@abc.com\"에서 @가 몇 번째 글자인지 숫자(5)로 돌려줍니다.\n\n왜 필요할까요? 위치 번호를 알면 LEFT·MID·RIGHT와 짝지어 '구분자 앞/뒤만 잘라내기'를 할 수 있어요. @ 앞의 아이디, 하이픈 뒤의 코드처럼요. 그래서 데이터 정리 작업에서 아주 자주 등장합니다.\n\n둘은 거의 같지만 두 가지가 다릅니다. FIND는 대소문자를 구분하고 와일드카드를 못 씁니다. SEARCH는 대소문자를 무시하고 와일드카드(?, *)를 쓸 수 있어요. 찾는 글자가 없으면 둘 다 #VALUE! 오류를 냅니다.",
    "params": [
      {
        "name": "찾을텍스트",
        "required": true,
        "desc": "대상 안에서 찾고 싶은 글자나 단어. SEARCH는 여기에 와일드카드(? 글자 1개, * 여러 글자)를 쓸 수 있습니다."
      },
      {
        "name": "대상텍스트",
        "required": true,
        "desc": "검색할 원본 텍스트, 또는 그 값이 든 셀(예: A2)."
      },
      {
        "name": "시작위치",
        "required": false,
        "desc": "몇 번째 글자부터 찾기 시작할지. 생략하면 1(처음부터). 같은 글자의 '두 번째' 위치를 찾을 때 유용합니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "이메일에서 @ 위치 찾기",
        "formula": "=FIND(\"@\",\"hong@abc.com\")",
        "result": "5 (@가 왼쪽에서 5번째 글자)",
        "explain": "대상 텍스트를 왼쪽부터 세어 \"@\"가 처음 나오는 자리 번호를 돌려줘요. 여기서는 5번째라 5입니다."
      },
      {
        "level": "basic",
        "title": "대소문자 구분 없이 찾기 (SEARCH)",
        "formula": "=SEARCH(\"plan\",\"AutoPlan2024\")",
        "result": "5 (\"Plan\"의 P 위치, 대소문자 무시)",
        "explain": "SEARCH는 대소문자를 가리지 않아요. 소문자 \"plan\"으로 찾아도 대문자 \"Plan\"을 찾아 5를 돌려줍니다. 같은 걸 FIND로 하면 대소문자가 달라 못 찾고 #VALUE! 오류가 나요."
      },
      {
        "level": "advanced",
        "title": "@ 앞의 아이디만 추출 (FIND+LEFT)",
        "formula": "=LEFT(A2, FIND(\"@\",A2)-1)",
        "result": "\"hong\"  (A2가 \"hong@abc.com\"일 때)",
        "explain": "FIND로 @ 위치(5)를 구하고, 그보다 1 적은 4글자를 LEFT로 왼쪽에서 잘라 아이디만 남겨요. 이메일·코드에서 구분자 앞부분을 뽑아내는 대표 패턴입니다."
      },
      {
        "level": "advanced",
        "title": "상품명에 특정 단어가 들어있는지로 분류",
        "formula": "=IF(ISNUMBER(SEARCH(\"암\",[@상품명])),\"암보험\",\"기타\")",
        "result": "\"암보험\" 또는 \"기타\"",
        "explain": "SEARCH가 단어를 찾으면 숫자(위치)를, 못 찾으면 #VALUE! 오류를 줍니다. ISNUMBER로 '숫자가 나왔나=찾았나'를 참·거짓으로 바꿔 IF로 분류해요. 포함 여부만 판정할 때 자주 쓰는 방법입니다."
      },
      {
        "level": "advanced",
        "title": "두 번째 하이픈 위치 찾기 (시작위치 활용)",
        "formula": "=FIND(\"-\", A2, FIND(\"-\",A2)+1)",
        "result": "두 번째 \"-\"의 자리 번호  (A2가 \"2024-05-18\"이면 8)",
        "explain": "안쪽 FIND로 첫 하이픈 위치(5)를 구하고, 그 다음 칸(6)부터 다시 찾게 해서 두 번째 하이픈(8)을 찾아요. 세 번째 인수 '시작위치'로 같은 글자의 n번째를 짚는 기법입니다."
      },
      {
        "level": "advanced",
        "title": "와일드카드로 유연하게 찾기 (SEARCH 전용)",
        "formula": "=SEARCH(\"실손?세대\",A2)",
        "result": "\"실손\"과 \"세대\" 사이에 글자 1개가 낀 위치.  \"실손4세대보장\"이면 1",
        "explain": "SEARCH는 ?(글자 1개)·*(여러 글자) 와일드카드를 지원해요(FIND는 불가). 실제 \"?\"·\"*\" 글자 자체를 찾으려면 앞에 물결(~)을 붙여 \"~?\"처럼 씁니다."
      }
    ],
    "tips": "FIND는 대소문자를 구분하고 와일드카드를 못 쓰며, SEARCH는 대소문자를 무시하고 와일드카드(?, *)를 씁니다. 찾는 글자가 없으면 둘 다 #VALUE! 오류 → ISNUMBER()나 IFERROR()로 감싸 처리하세요. 한글도 한 글자를 1로 세지만, 바이트 기준(한글 2)이 필요하면 FINDB·SEARCHB를 씁니다. 최신 365라면 위치 계산 없이 TEXTBEFORE·TEXTAFTER로 훨씬 쉽게 자를 수 있어요.",
    "related": [
      "LEFT",
      "RIGHT",
      "MID",
      "LEN",
      "SUBSTITUTE",
      "IFERROR",
      "ISNUMBER",
      "TEXTBEFORE",
      "TEXTAFTER"
    ]
  },
  {
    "id": "left-right",
    "name": "LEFT · RIGHT",
    "category": "lookup",
    "version": "all",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=LEFT(문자열, [개수])  /  =RIGHT(문자열, [개수])",
    "summary": "문자열의 왼쪽(LEFT)·오른쪽(RIGHT) 끝에서 지정한 개수만큼 글자를 잘라 온다.",
    "intro": "LEFT와 RIGHT는 글자를 '끝에서부터 몇 글자'만 잘라 오는 짝꿍 함수예요. LEFT는 왼쪽(앞)에서, RIGHT는 오른쪽(뒤)에서 가져옵니다. 예를 들어 \"보험료\"에서 왼쪽 2글자를 뽑으면 \"보험\"이 됩니다.\n\n코드나 번호처럼 자리마다 의미가 정해진 데이터를 나눌 때 특히 유용해요. 계약번호 앞자리로 상품 구분을, 뒷자리로 일련번호를 뽑아내는 식이죠.\n\n개수를 생략하면 1글자만 가져옵니다. 그리고 이 함수들은 결과를 '글자(텍스트)'로 돌려주기 때문에, 숫자로 계산하려면 VALUE로 다시 숫자로 바꿔 줘야 한다는 점을 기억하세요.",
    "params": [
      {
        "name": "문자열",
        "required": true,
        "desc": "잘라 올 대상 글자(또는 글자가 든 셀). 숫자가 들어와도 글자처럼 다뤄요."
      },
      {
        "name": "개수",
        "required": false,
        "desc": "가져올 글자 수. 생략하면 1. 문자열 길이보다 크면 전체를 그대로 반환하고, 음수면 오류가 나요."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "왼쪽에서 두 글자 가져오기",
        "formula": "=LEFT(\"보험료\", 2)",
        "result": "\"보험\"",
        "explain": "\"보험료\"의 왼쪽 끝에서 2글자를 잘라 \"보험\"을 돌려줍니다. 앞부분 몇 글자를 떼어 낼 때 쓰는 가장 단순한 사용법이에요."
      },
      {
        "level": "basic",
        "title": "오른쪽에서 일련번호 뽑기",
        "formula": "=RIGHT(\"2024-001\", 3)",
        "result": "\"001\"",
        "explain": "오른쪽 끝에서 3글자를 가져와 계약번호의 뒤 일련번호 \"001\"만 남깁니다. 뒤에서부터 정해진 자릿수를 뽑을 때 RIGHT를 씁니다."
      },
      {
        "level": "advanced",
        "title": "구분 기호 앞의 상품 코드 뽑기",
        "formula": "=LEFT(A2, FIND(\"-\", A2)-1)",
        "result": "\"LIFE-2024\" → \"LIFE\"",
        "explain": "FIND로 하이픈(-)의 위치를 찾고, 그 바로 앞까지(-1)를 LEFT로 잘라 냅니다. 코드 길이가 제각각이어도 '하이픈 앞부분'을 정확히 뽑을 수 있어, product 구분처럼 앞자리 길이가 일정치 않은 데이터에 강해요."
      },
      {
        "level": "advanced",
        "title": "구분 기호 뒤의 내용 뽑기",
        "formula": "=RIGHT(A2, LEN(A2)-FIND(\"-\", A2))",
        "result": "\"LIFE-2024\" → \"2024\"",
        "explain": "전체 길이 LEN에서 하이픈 위치를 빼면 '하이픈 뒤에 남은 글자 수'가 됩니다. 그만큼을 RIGHT로 뒤에서 가져와 하이픈 다음 부분만 얻어요. 앞 예제와 짝을 이뤄 한 칸의 코드를 앞뒤로 분리합니다."
      },
      {
        "level": "advanced",
        "title": "잘라 온 연도를 숫자로 바꿔 계산",
        "formula": "=VALUE(LEFT(A2, 4))",
        "result": "\"2024-001\" → 숫자 2024",
        "explain": "LEFT는 글자 \"2024\"를 돌려주므로 그대로는 계산이 안 됩니다. VALUE로 감싸 진짜 숫자 2024로 바꾸면, 이후 연도 차이 계산이나 조건 비교에 바로 쓸 수 있어요. 텍스트 함수 결과는 숫자로 변환한다는 실무 습관을 보여 줍니다."
      }
    ],
    "related": [
      "MID",
      "FIND",
      "SEARCH",
      "LEN",
      "VALUE",
      "TEXTBEFORE"
    ],
    "tips": "LEFT/RIGHT는 항상 '글자'를 반환하므로 숫자 계산 전에는 VALUE로 바꿔야 해요. 개수에 음수를 넣으면 #VALUE! 오류가 납니다. 위치를 정확히 세기 어렵다면 FIND(대소문자·정확 일치)나 SEARCH(대소문자 무시·와일드카드)로 구분자 위치를 찾아 조합하세요. 최신 365에서는 TEXTBEFORE/TEXTAFTER가 같은 일을 더 간단히 처리합니다."
  },
  {
    "id": "choose",
    "name": "CHOOSE",
    "category": "lookup",
    "version": "all",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=CHOOSE(인덱스번호, 값1, [값2], …)",
    "summary": "번호를 주면 여러 값 중 그 번호에 해당하는 값을 꺼낸다.",
    "intro": "CHOOSE는 번호를 주면 여러 값 중 그 번호에 해당하는 값을 꺼내는 함수입니다. 사물함에서 '2번 칸'을 열면 그 안의 물건이 나오는 것과 같습니다. 예를 들어 CHOOSE(2, \"생명\", \"손해\", \"재보험\")는 두 번째인 \"손해\"를 돌려줍니다.\n\n1, 2, 3 같은 코드 번호를 실제 이름·등급으로 바꿀 때 쉽고 직관적입니다. 값 자리에는 범위(예: 합계 낼 열)도 넣을 수 있어, 조건에 따라 다른 범위를 골라 계산하는 고급 기법에도 씁니다.",
    "params": [
      {
        "name": "인덱스번호",
        "required": true,
        "desc": "몇 번째 값을 꺼낼지 1, 2, 3…의 정수. 소수는 버림 처리됩니다. 1부터 값 개수 사이여야 하며, 벗어나면 #VALUE! 오류가 납니다."
      },
      {
        "name": "값1",
        "required": true,
        "desc": "1번에 해당하는 값. 숫자·문자·셀·범위 모두 가능합니다."
      },
      {
        "name": "값2",
        "required": false,
        "desc": "2번 이후의 값들. 최대 254개까지 나열할 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "번호로 이름 꺼내기",
        "formula": "=CHOOSE(2, \"생명\", \"손해\", \"재보험\")",
        "result": "두 번째 값인 \"손해\"",
        "explain": "첫 인수 번호에 해당하는 값을 목록에서 고릅니다. 2를 주면 두 번째인 \"손해\"가 나옵니다."
      },
      {
        "level": "basic",
        "title": "코드 번호를 분류명으로 변환",
        "formula": "=CHOOSE(B2, \"영업일\", \"정기휴일\", \"할인판매일\")",
        "result": "B2가 1이면 영업일, 2면 정기휴일, 3이면 할인판매일",
        "explain": "셀에 든 코드 번호(1, 2, 3)를 사람이 읽을 수 있는 이름으로 바꿉니다."
      },
      {
        "level": "advanced",
        "title": "VLOOKUP 왼쪽 조회 트릭",
        "formula": "=VLOOKUP(\"P-1007\", CHOOSE({1,2}, B2:B100, A2:A100), 2, 0)",
        "result": "찾을 열(A)이 결과 열(B) 오른쪽에 있어도 조회 성공",
        "explain": "배열 상수 {1,2}로 A·B 두 열의 순서를 가상으로 뒤집어, 원래 왼쪽만 못 찾던 VLOOKUP이 왼쪽 열도 찾게 만드는 고전 기법입니다(요즘은 XLOOKUP·INDEX+MATCH로 대체)."
      },
      {
        "level": "advanced",
        "title": "월을 분기로 변환",
        "formula": "=CHOOSE(MONTH(A2), 1,1,1,2,2,2,3,3,3,4,4,4)",
        "result": "날짜의 월에 맞는 분기 번호(1~4)",
        "explain": "MONTH가 돌려준 1~12를 12개 값에 하나씩 대응시켜 분기로 접습니다. 매핑 규칙을 값 목록으로 직접 적어 두는 방식입니다."
      },
      {
        "level": "advanced",
        "title": "조건에 따라 합계 범위 고르기",
        "formula": "=SUM(CHOOSE(분기, D2:D13, E2:E13, F2:F13, G2:G13))",
        "result": "선택한 분기 열의 합계",
        "explain": "CHOOSE의 값 자리에는 범위도 넣을 수 있어, 번호에 따라 다른 열을 골라 SUM에 넘길 수 있습니다. 분기 값을 바꾸면 합산 대상 열이 자동으로 바뀝니다."
      }
    ],
    "related": [
      "SWITCH",
      "IFS",
      "INDEX",
      "VLOOKUP"
    ],
    "tips": "선택지가 연속된 코드(1,2,3…)일 때 간단합니다. 다만 조건이 '이상/이하' 같은 범위이거나 항목이 많으면 CHOOSE보다 SWITCH·IFS나 VLOOKUP/XLOOKUP이 더 관리하기 쉽습니다. 인덱스번호가 0이거나 값 개수를 넘으면 #VALUE! 오류가 납니다."
  },
  {
    "id": "indirect",
    "name": "INDIRECT",
    "category": "lookup",
    "version": "all",
    "weight": 3,
    "difficulty": 4,
    "syntax": "=INDIRECT(참조_문자열, [A1스타일])",
    "summary": "\"B3\" 같은 문자열을 실제 셀 참조로 바꿔 그 위치의 값을 가져온다.",
    "intro": "보통 =B3 이라고 쓰면 엑셀은 B3 셀을 직접 가리킵니다. 그런데 셀 주소가 '글자(텍스트)'로 되어 있으면 엑셀은 그냥 글자로만 알아요. INDIRECT는 이 \"B3\"라는 글자를 진짜 B3 셀 참조로 바꿔 그 안의 값을 꺼내 주는 함수예요.\n\n왜 필요할까요? 참조할 위치를 셀 값이나 수식으로 '조립'할 수 있기 때문입니다. 예를 들어 A1에 시트 이름을 적어 두고, 그 이름을 이용해 여러 시트에서 같은 위치의 값을 끌어오는 식으로요. 즉 '어디를 참조할지'를 상황에 따라 바꿀 수 있게 해 줍니다.\n\nINDIRECT도 휘발성 함수라 자주 쓰면 느려질 수 있고, 닫힌 다른 파일은 참조하지 못하는 제약이 있어요.",
    "params": [
      {
        "name": "참조_문자열",
        "required": true,
        "desc": "셀 주소를 담은 텍스트(예: \"B3\", \"'상품A'!B2\", 이름 정의). 이 글자를 실제 참조로 해석해요."
      },
      {
        "name": "A1스타일",
        "required": false,
        "desc": "참조 표기 방식. 생략/TRUE면 일반적인 A1 방식, FALSE면 R1C1(행번호·열번호) 방식으로 해석."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "문자열 주소로 값 가져오기",
        "formula": "=INDIRECT(\"B3\")",
        "result": "B3 셀의 값",
        "explain": "따옴표 안의 \"B3\"는 그냥 글자지만, INDIRECT가 이를 실제 B3 셀 참조로 바꿔 그 값을 돌려줍니다. =B3 과 결과는 같지만 '주소를 글자로 다룰 수 있다'는 점이 다릅니다."
      },
      {
        "level": "basic",
        "title": "다른 셀에 적힌 주소를 따라가기",
        "formula": "=INDIRECT(A1)",
        "result": "A1에 \"B3\"이 적혀 있으면 B3의 값",
        "explain": "A1 칸에 참조할 주소(B3)를 글자로 적어 두면, INDIRECT가 그 주소로 이동해 값을 가져옵니다. A1의 글자만 바꾸면 참조 대상이 바뀌므로, 보고 싶은 셀을 입력값으로 고를 수 있어요."
      },
      {
        "level": "advanced",
        "title": "시트 이름을 골라 값 끌어오기(여러 상품 시트)",
        "formula": "=INDIRECT(\"'\"&A1&\"'!B2\")",
        "result": "A1에 적힌 이름의 시트 B2 값",
        "explain": "상품마다 시트가 따로 있을 때, A1에 상품 시트 이름을 넣으면 \"'상품A'!B2\" 같은 주소가 글자로 조립됩니다(시트 이름에 공백이 있어도 안전하도록 작은따옴표로 감쌈). INDIRECT가 이를 참조로 바꿔 해당 상품 시트의 B2를 가져와, 한 셀에서 상품만 바꿔 가며 요약할 수 있어요."
      },
      {
        "level": "advanced",
        "title": "이름 정의된 범위를 골라 합계",
        "formula": "=SUM(INDIRECT(E3))",
        "result": "E3에 적힌 이름(예: 상품A) 범위의 합계",
        "explain": "미리 B3:B4 같은 범위에 '상품A'라는 이름을 정의해 두고, E3에 \"상품A\"라고 적으면 INDIRECT가 그 이름을 실제 범위로 바꿔 SUM에 넘깁니다. 드롭다운으로 이름만 고르면 그 그룹의 premium 합계가 나오게 만드는 방식이에요."
      },
      {
        "level": "advanced",
        "title": "찾을 표(테이블)를 동적으로 바꿔 VLOOKUP",
        "formula": "=VLOOKUP(A3, INDIRECT(B3), 2, FALSE)",
        "result": "B3이 가리키는 표에서 A3을 찾은 2번째 열 값",
        "explain": "B3에 참조할 표의 이름이나 범위를 글자로 넣으면, INDIRECT가 그것을 실제 범위로 바꿔 VLOOKUP의 검색 대상 표로 씁니다. 같은 조회식으로 상품·연도별 요율표를 바꿔 가며 조회할 수 있어, 표가 여러 개일 때 편리해요."
      }
    ],
    "related": [
      "OFFSET",
      "ADDRESS",
      "INDEX",
      "CHOOSE",
      "VLOOKUP"
    ],
    "tips": "INDIRECT는 휘발성 함수라 남용하면 느려지고, 참조를 '글자'로만 다루기 때문에 열을 삽입·삭제해도 자동으로 따라오지 않아요(끊기지 않는 대신 위치가 안 맞을 수 있음). 또 닫혀 있는 다른 통합 문서는 참조하지 못하며, 잘못된 주소 문자열은 #REF! 오류가 납니다."
  },
  {
    "id": "len",
    "name": "LEN",
    "category": "lookup",
    "version": "all",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=LEN(텍스트)",
    "summary": "텍스트의 글자 수(공백 포함)를 셉니다. 자릿수 검증과 다른 함수와의 조합 계산에 핵심.",
    "intro": "LEN은 텍스트가 '몇 글자인지' 세어 주는 아주 단순한 함수예요. \"보험료\"는 3, \"A-100\"은 5(하이픈·숫자 모두 한 글자, 공백도 셈)처럼요.\n\n혼자서도 자릿수 검사(계약번호가 10자리 맞나?)에 쓰지만, 진짜 힘은 조합에 있어요. FIND·MID와 함께 쓰면 '남은 글자 수'를 계산해 뒷부분을 정확히 자르고, SUBSTITUTE와 함께 쓰면 특정 문자가 몇 번 나오는지까지 셀 수 있습니다.\n\n참고로 한글도 한 글자를 1로 셉니다. 바이트 기준(한글은 2)이 필요하면 LENB를 쓰세요.",
    "params": [
      {
        "name": "텍스트",
        "required": true,
        "desc": "글자 수를 셀 텍스트, 또는 그 값이 든 셀 참조. 숫자·날짜를 넣으면 화면에 보이는 자릿수를 셉니다(예: 1000 → 4)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "글자 수 세기",
        "formula": "=LEN(\"실손의료보험\")",
        "result": "6",
        "explain": "텍스트의 글자 개수를 그대로 돌려줘요. 여섯 글자라 6입니다."
      },
      {
        "level": "basic",
        "title": "셀 값의 길이 (공백 포함)",
        "formula": "=LEN(A2)",
        "result": "A2가 \"123-45\"이면 6, \"홍 길동\"이면 4",
        "explain": "셀을 가리키면 그 안의 글자 수를 세요. 눈에 잘 안 보이는 공백도 한 글자로 세는 점이 중요합니다(\"홍 길동\"은 가운데 공백 포함 4)."
      },
      {
        "level": "advanced",
        "title": "계약번호 자릿수 검증",
        "formula": "=IF(LEN(TRIM(A2))=10,\"정상\",\"확인필요\")",
        "result": "\"정상\" 또는 \"확인필요\"",
        "explain": "TRIM으로 앞뒤 공백을 없앤 뒤 길이가 10인지 확인해요. 코드·번호가 규칙에 맞는지 걸러내는 데이터 검증의 기본기입니다."
      },
      {
        "level": "advanced",
        "title": "구분자(하이픈) 개수 세기 (SUBSTITUTE 조합)",
        "formula": "=LEN(A2)-LEN(SUBSTITUTE(A2,\"-\",\"\"))",
        "result": "A2가 \"2024-05-18\"이면 2",
        "explain": "원래 길이에서 '하이픈을 모두 지운 길이'를 빼면 사라진 하이픈 개수가 나와요. 콤마로 나뉜 항목 수를 셀 때(끝에 +1) 자주 쓰는 고전 기법입니다."
      },
      {
        "level": "advanced",
        "title": "@ 뒤 도메인만 남기기 (RIGHT+LEN+FIND)",
        "formula": "=RIGHT(A2, LEN(A2)-FIND(\"@\",A2))",
        "result": "\"hong@abc.com\"이면 \"abc.com\"",
        "explain": "전체 길이에서 @까지의 위치를 빼면 '@ 뒤 글자 수'가 나와요. 그만큼 오른쪽에서 잘라 도메인만 남깁니다. LEN이 '남은 길이'를 계산하는 역할을 해요."
      },
      {
        "level": "advanced",
        "title": "앞자리 0 채워 6자리 코드 만들기 (REPT+LEN)",
        "formula": "=\"P\"&REPT(\"0\",6-LEN(A2))&A2",
        "result": "A2가 \"42\"이면 \"P000042\"",
        "explain": "6에서 현재 길이를 빼 부족한 만큼 \"0\"을 REPT로 만들어 앞에 붙여요. 상품·부서 코드처럼 자릿수를 맞춰야 할 때 씁니다(TEXT(A2,\"000000\")로도 가능)."
      }
    ],
    "tips": "공백도 한 글자로 셉니다 — 자릿수 검사가 자꾸 틀리면 TRIM으로 공백을 정리한 뒤 세어 보세요. 숫자를 넣으면 값이 아니라 '보이는 자릿수'를 셉니다(1000 → 4). 한글 1글자는 1로 세며, 바이트가 필요하면 LENB(한글은 2)를 씁니다.",
    "related": [
      "FIND",
      "SEARCH",
      "MID",
      "RIGHT",
      "LEFT",
      "SUBSTITUTE",
      "TRIM",
      "REPT",
      "TEXT"
    ]
  },
  {
    "id": "mid",
    "name": "MID",
    "category": "lookup",
    "version": "all",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=MID(문자열, 시작위치, 개수)",
    "summary": "문자열의 지정한 시작 위치부터 원하는 개수만큼 글자를 잘라 온다(가운데 추출).",
    "intro": "MID는 글자 문자열의 '가운데 어느 지점부터 몇 글자'를 잘라 오는 함수예요. LEFT는 앞에서, RIGHT는 뒤에서 가져오지만, MID는 시작 위치를 직접 정할 수 있어 문자열 중간의 아무 곳이나 뽑을 수 있습니다.\n\n엑셀은 글자 위치를 1번부터 셉니다. 그래서 \"시작위치 3\"은 세 번째 글자부터라는 뜻이에요. 여기서 '개수'만큼 오른쪽으로 잘라 옵니다.\n\n계약번호나 코드처럼 자리마다 정해진 의미가 있는 데이터에서 특정 구간(예: 중간의 상품 구분 한 글자)을 뽑을 때 아주 유용합니다.",
    "params": [
      {
        "name": "문자열",
        "required": true,
        "desc": "잘라 올 대상 글자(또는 글자가 든 셀)."
      },
      {
        "name": "시작위치",
        "required": true,
        "desc": "가져오기 시작할 글자 위치. 첫 글자가 1. 1보다 작으면 오류가 나요."
      },
      {
        "name": "개수",
        "required": true,
        "desc": "시작 위치부터 가져올 글자 수. 남은 길이보다 커도 오류 없이 끝까지만 가져와요."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "중간 한 글자 뽑기",
        "formula": "=MID(\"2024-A-001\", 6, 1)",
        "result": "\"A\"",
        "explain": "여섯 번째 글자부터 1글자를 가져와 가운데의 상품 구분 코드 \"A\"만 뽑습니다. 시작 위치와 개수를 직접 정해 문자열 중간을 집어내는 기본 사용법이에요."
      },
      {
        "level": "basic",
        "title": "앞에서부터 일정 구간 뽑기",
        "formula": "=MID(A2, 1, 4)",
        "result": "\"2024-001\" → \"2024\"",
        "explain": "시작 위치 1, 개수 4이므로 첫 글자부터 4글자를 가져옵니다. 결과는 LEFT(A2, 4)와 같지만, 시작 위치를 바꾸면 어디서든 잘라올 수 있다는 점이 MID의 장점이에요."
      },
      {
        "level": "advanced",
        "title": "두 구분 기호 사이의 값 뽑기",
        "formula": "=MID(A2, FIND(\"-\",A2)+1, FIND(\"-\",A2,FIND(\"-\",A2)+1)-FIND(\"-\",A2)-1)",
        "result": "\"2024-A-001\" → \"A\"",
        "explain": "첫 하이픈 위치 다음(+1)에서 시작하고, 두 번째 하이픈 위치에서 첫 하이픈 위치를 빼 '사이 글자 수'를 구합니다. FIND의 세 번째 인수(시작점)로 두 번째 하이픈을 찾는 게 핵심이에요. 코드 길이가 달라도 가운데 상품 구분을 정확히 추출합니다."
      },
      {
        "level": "advanced",
        "title": "정해진 자리의 코드 뽑기(주민번호 성별 자리)",
        "formula": "=MID(A2, 8, 1)",
        "result": "\"901010-1234567\" → \"1\"",
        "explain": "자리 규칙이 고정된 데이터에서는 위치를 상수로 지정하면 됩니다. 8번째 글자(하이픈 뒤 첫 자리)를 뽑아 성별 코드를 얻어요. 여기에 IF나 CHOOSE를 결합하면 '남/여' 표시로 바꿀 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "코드 중간의 월(2자리) 뽑아 숫자로",
        "formula": "=VALUE(MID(A2, 5, 2))",
        "result": "\"2024-06-15\" → 숫자 6",
        "explain": "다섯 번째 글자부터 2글자(\"06\")를 잘라 온 뒤 VALUE로 숫자 6으로 바꿉니다. MID 결과도 글자이므로, 월별 집계나 비교에 쓰려면 숫자로 변환해야 해요. 날짜가 텍스트로 들어온 데이터를 정리할 때 자주 쓰는 패턴입니다."
      }
    ],
    "related": [
      "LEFT",
      "RIGHT",
      "FIND",
      "SEARCH",
      "LEN",
      "TEXTSPLIT"
    ],
    "tips": "위치는 1부터 셉니다. 시작위치가 1보다 작으면 #VALUE! 오류가 나지만, 개수가 남은 글자 수보다 크면 오류 없이 끝까지만 가져와요. 구분자의 위치가 매번 다르면 FIND/SEARCH·LEN과 조합하고, 365에서는 TEXTSPLIT/TEXTBEFORE/TEXTAFTER로 더 간단히 나눌 수 있습니다."
  },
  {
    "id": "offset",
    "name": "OFFSET",
    "category": "lookup",
    "version": "all",
    "weight": 3,
    "difficulty": 4,
    "syntax": "=OFFSET(기준셀, 행이동, 열이동, [높이], [너비])",
    "summary": "기준 셀에서 지정한 행·열만큼 떨어진 위치의 셀 또는 범위를 참조한다.",
    "intro": "OFFSET은 '어떤 셀을 기준으로 몇 칸 아래·몇 칸 오른쪽에 있는 셀을 가리켜라'라고 지시하는 함수예요. 예를 들어 A1에서 시작해 3칸 아래로 내려가면 A4를 가리키게 됩니다. 값을 직접 계산하는 게 아니라 '위치(참조)'를 만들어 낸다는 점이 핵심이에요.\n\n여기에 높이·너비를 더 지정하면 한 개 셀이 아니라 '범위'도 만들 수 있습니다. 그래서 데이터가 늘어날 때마다 자동으로 커지는 합계 범위(동적 범위)를 만들 때 자주 쓰여요.\n\n다만 OFFSET은 '휘발성(volatile)' 함수라 시트에서 무언가 바뀔 때마다 매번 다시 계산됩니다. 데이터가 아주 많으면 느려질 수 있어, 요즘은 INDEX나 스필·XLOOKUP으로 대체하기도 합니다.",
    "params": [
      {
        "name": "기준셀",
        "required": true,
        "desc": "이동을 시작할 기준이 되는 셀 또는 범위. 여기서부터 칸을 세요."
      },
      {
        "name": "행이동",
        "required": true,
        "desc": "기준셀에서 아래로 이동할 칸 수. 양수는 아래, 음수는 위, 0은 그대로."
      },
      {
        "name": "열이동",
        "required": true,
        "desc": "기준셀에서 오른쪽으로 이동할 칸 수. 양수는 오른쪽, 음수는 왼쪽, 0은 그대로."
      },
      {
        "name": "높이",
        "required": false,
        "desc": "반환할 범위의 세로 칸 수(행 개수). 생략하면 기준셀 높이(보통 1)를 따라감."
      },
      {
        "name": "너비",
        "required": false,
        "desc": "반환할 범위의 가로 칸 수(열 개수). 생략하면 기준셀 너비(보통 1)를 따라감."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "몇 칸 아래 값 가져오기",
        "formula": "=OFFSET(A1, 3, 0)",
        "result": "A4 셀의 값",
        "explain": "A1을 기준으로 3칸 아래·0칸 오른쪽으로 이동해 A4를 가리킵니다. 이동만 하고 범위 크기는 지정 안 했으니 셀 하나(A4)의 값을 그대로 돌려줘요."
      },
      {
        "level": "basic",
        "title": "오른쪽으로 이동해 값 가져오기",
        "formula": "=OFFSET(A1, 0, 2)",
        "result": "C1 셀의 값",
        "explain": "행 이동은 0, 열 이동은 2이므로 A1에서 오른쪽으로 두 칸 간 C1을 참조합니다. 표에서 '기준 위치 + 몇 번째 열' 식으로 값을 뽑을 때 유용해요."
      },
      {
        "level": "advanced",
        "title": "높이·너비로 범위를 만들어 합계",
        "formula": "=SUM(OFFSET(B2, 0, 0, 12, 1))",
        "result": "B2:B13(12개월 보험료)의 합계",
        "explain": "B2를 기준으로 이동은 0이지만, 높이 12·너비 1을 줘서 B2부터 아래로 12칸짜리 '범위'를 만듭니다. 그 범위를 SUM에 넣어 한 해 12개월 premium 합계를 구해요. OFFSET이 단일 셀이 아닌 범위를 반환할 수 있다는 점을 보여줍니다."
      },
      {
        "level": "advanced",
        "title": "데이터가 늘어도 자동으로 커지는 합계(동적 범위)",
        "formula": "=SUM(OFFSET($B$2, 0, 0, COUNT($B:$B), 1))",
        "result": "B2부터 숫자가 입력된 만큼의 claim_amt 합계",
        "explain": "COUNT($B:$B)로 B열에 입력된 숫자 개수를 세어 그만큼을 높이로 씁니다. 새 청구액을 아래에 추가하면 범위가 자동으로 그 행까지 늘어나 합계가 갱신돼요. 매번 SUM 범위를 손보지 않아도 되는 동적 범위 패턴입니다."
      },
      {
        "level": "advanced",
        "title": "열의 마지막(최신) 값 가져오기",
        "formula": "=OFFSET(B1, COUNTA(B:B)-1, 0)",
        "result": "B열에 마지막으로 입력된 값",
        "explain": "COUNTA(B:B)로 B열에 채워진 셀 수를 세고, 머리글(B1) 한 줄을 빼기 위해 -1을 합니다. 그만큼 아래로 내려가 가장 최근에 추가된 계약·청구 값을 항상 가리켜요. 로그처럼 계속 쌓이는 데이터의 '최신값'을 뽑을 때 씁니다."
      }
    ],
    "related": [
      "INDEX",
      "INDIRECT",
      "CHOOSE",
      "COUNTA",
      "SUM"
    ],
    "tips": "OFFSET은 휘발성 함수라 시트가 바뀔 때마다 재계산돼 파일이 무거워질 수 있어요. 같은 일을 INDEX(비휘발성)나 표(구조적 참조)·스필로 대체하면 더 빠릅니다. 행/열 이동이 표 밖으로 나가면 #REF! 오류가 납니다."
  },
  {
    "id": "xmatch",
    "name": "XMATCH",
    "category": "lookup",
    "version": "2021",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=XMATCH(찾을값, 찾을배열, [일치모드], [검색모드])",
    "summary": "MATCH의 강화판 — 기본이 완전 일치이고 뒤에서부터 검색도 된다.",
    "intro": "XMATCH는 MATCH의 최신·강화판입니다(엑셀 2021·Microsoft 365 이상). MATCH처럼 값이 목록에서 몇 번째에 있는지 위치를 돌려주지만, 두 가지가 더 편합니다.\n\n첫째, 아무 옵션 없이 쓰면 자동으로 '완전 일치'로 찾습니다(MATCH는 정확히 찾으려면 끝에 0을 꼭 붙여야 했습니다). 둘째, '맨 뒤에서부터' 검색할 수 있어서, 같은 값이 여러 번 나올 때 가장 마지막(최신) 위치를 바로 찾을 수 있습니다. 근사 검색(구간 매칭)도 데이터를 정렬해 두지 않아도 동작합니다.",
    "params": [
      {
        "name": "찾을값",
        "required": true,
        "desc": "위치를 알고 싶은 값(숫자·문자·셀 참조)."
      },
      {
        "name": "찾을배열",
        "required": true,
        "desc": "찾을값을 검색할 범위. 한 행 또는 한 열이어야 합니다."
      },
      {
        "name": "일치모드",
        "required": false,
        "desc": "0(기본)=완전 일치, -1=완전 일치 또는 다음 작은 값, 1=완전 일치 또는 다음 큰 값, 2=와일드카드(*·?) 일치."
      },
      {
        "name": "검색모드",
        "required": false,
        "desc": "1(기본)=앞→뒤, -1=뒤→앞(최신 항목 찾기), 2=이진 검색(오름차순 정렬 전용), -2=이진 검색(내림차순 정렬 전용)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "옵션 없이 완전 일치로 위치 찾기",
        "formula": "=XMATCH(\"자동차\", A2:A10)",
        "result": "'자동차'의 위치 순번",
        "explain": "XMATCH는 아무 옵션 없이도 기본이 완전 일치입니다. MATCH처럼 끝에 0을 붙일 필요가 없어 실수가 줄어듭니다."
      },
      {
        "level": "basic",
        "title": "숫자 위치 찾기",
        "formula": "=XMATCH(500000, B2:B10)",
        "result": "500000이 있는 위치 순번",
        "explain": "숫자도 동일하게 완전 일치로 위치를 반환합니다."
      },
      {
        "level": "advanced",
        "title": "뒤에서부터 검색해 최신 항목 찾기",
        "formula": "=XMATCH(\"P-1007\", A2:A100, 0, -1)",
        "result": "계약 P-1007이 여러 번 나올 때 마지막(가장 아래) 위치",
        "explain": "검색 모드 -1은 맨 뒤에서 앞으로 훑습니다. 같은 계약의 갱신 이력이 여러 줄일 때 '가장 최근 기록'의 위치를 바로 찾을 수 있습니다. MATCH로는 어려운 작업입니다."
      },
      {
        "level": "advanced",
        "title": "INDEX와 결합한 2차원 조회",
        "formula": "=INDEX(B2:E100, XMATCH(\"P-1007\", A2:A100), XMATCH(\"청구액\", B1:E1))",
        "result": "계약 P-1007 행과 '청구액' 열이 만나는 값",
        "explain": "행·열 위치를 XMATCH 두 개로 찾아 교차 값을 꺼냅니다. 완전 일치가 기본이라 옵션이 없어도 되어 수식이 짧고 읽기 쉽습니다."
      },
      {
        "level": "advanced",
        "title": "정렬 없이 구간(다음 작은 값) 매칭",
        "formula": "=XMATCH(720, F2:F5, -1)",
        "result": "720 이하의 가장 큰 기준값 위치",
        "explain": "일치 모드 -1은 '완전 일치 또는 다음 작은 값'을 찾습니다. MATCH의 근사 검색과 달리 기준 범위를 정렬해 두지 않아도 되어 점수·보험료 구간 매칭이 훨씬 안전합니다."
      }
    ],
    "related": [
      "MATCH",
      "INDEX",
      "XLOOKUP",
      "FILTER"
    ],
    "tips": "엑셀 2019 이하에는 없는 함수라 파일을 구버전에서 열면 #NAME? 오류가 납니다. 근사 검색(-1, 1)이 정렬 없이도 동작하는 점과, 뒤에서부터(-1) 검색으로 최신 값을 찾는 점이 MATCH 대비 실무 이점입니다."
  },
  {
    "id": "hlookup",
    "name": "HLOOKUP",
    "category": "lookup",
    "version": "all",
    "weight": 2,
    "difficulty": 2,
    "syntax": "=HLOOKUP(찾을값, 표범위, 행번호, [일치옵션])",
    "summary": "표의 맨 윗 행에서 값을 찾아 같은 열의 지정한 행 값을 가져오는 가로형 검색 함수.",
    "intro": "HLOOKUP은 VLOOKUP의 '가로 버전'입니다. H는 가로(Horizontal)를 뜻하며, 표의 '맨 윗 행'에서 값을 찾아 같은 열의 아래쪽에 있는 값을 가져옵니다.\n\n데이터가 세로가 아니라 가로로 나열된 표에서 유용합니다. 예를 들어 1행에 월(1월·2월·3월…)이 쭉 있고 그 아래로 항목별 값이 있는 표에서, 특정 월의 값을 뽑아낼 때 씁니다.\n\n사용법은 VLOOKUP과 거의 같지만, '열 번호' 대신 '행 번호'를 지정한다는 점만 다릅니다. 실무 데이터는 대부분 세로로 쌓기 때문에 VLOOKUP보다 덜 쓰이지만, 가로형 요약표를 다룰 때 꼭 필요합니다.",
    "params": [
      {
        "name": "찾을값",
        "required": true,
        "desc": "찾고 싶은 기준값입니다. 표의 맨 윗 행에서 이 값을 찾습니다. 예: \"3월\", \"암보험\"."
      },
      {
        "name": "표범위",
        "required": true,
        "desc": "검색할 표 전체 범위입니다. 이 범위의 첫 번째(맨 위) 행에 찾을값이 있어야 합니다. 예: B1:F5."
      },
      {
        "name": "행번호",
        "required": true,
        "desc": "표범위에서 가져올 값이 위에서 몇 번째 행인지 숫자로 지정합니다. 맨 윗 행이 1입니다. 예: 2이면 두 번째 행."
      },
      {
        "name": "일치옵션",
        "required": false,
        "desc": "FALSE(또는 0)=정확히 일치, TRUE(또는 1·생략)=근삿값. 근삿값은 맨 윗 행이 왼쪽부터 오름차순 정렬되어야 합니다. 보통 FALSE를 씁니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "상품명으로 보험료 찾기(가로 표)",
        "formula": "=HLOOKUP(\"암보험\", B1:F2, 2, FALSE)",
        "result": "1행에서 \"암보험\" 열을 찾아, 그 아래 2행의 보험료 값",
        "explain": "표의 맨 윗 행(B1:F1)에 상품명이 가로로 나열되어 있고 그 아래 2행에 보험료가 있을 때, \"암보험\" 열을 찾아 2번째 행 값을 가져옵니다. VLOOKUP과 방향만 다를 뿐 원리는 같습니다."
      },
      {
        "level": "basic",
        "title": "특정 월의 청구 건수 뽑기",
        "formula": "=HLOOKUP(\"3월\", A1:M2, 2, FALSE)",
        "result": "1행에서 \"3월\" 열을 찾아 2행의 청구 건수",
        "explain": "1행에 1월~12월이 가로로 있고 2행에 월별 청구 건수가 있는 표에서, 원하는 월의 값을 한 번에 가져옵니다. 월별·분기별 가로 요약표에서 자주 쓰는 형태입니다."
      },
      {
        "level": "advanced",
        "title": "항목 위치를 MATCH로 자동 지정",
        "formula": "=HLOOKUP(\"3월\", A1:M5, MATCH(\"claim_amt\", A1:A5, 0), FALSE)",
        "result": "'claim_amt' 행이 몇 번째든 3월 값을 자동으로 가져옴",
        "explain": "행번호를 2처럼 고정하면 표에 행이 늘거나 순서가 바뀔 때 수식을 고쳐야 합니다. MATCH로 A열의 항목 이름 중 \"claim_amt\"가 몇 번째 행인지 찾아 넣으면, 표 구조가 바뀌어도 알아서 맞는 행을 가져옵니다."
      },
      {
        "level": "advanced",
        "title": "없는 월이면 0으로 처리",
        "formula": "=IFERROR(HLOOKUP(J2, 월별표, 3, FALSE), 0)",
        "result": "해당 월이 표에 있으면 그 값, 없으면 0",
        "explain": "찾는 월이 표에 없으면 HLOOKUP은 #N/A 오류를 냅니다. IFERROR로 감싸 0으로 바꾸면, 이어지는 합계·평균 계산에서 오류가 번지지 않습니다."
      }
    ],
    "related": [
      "VLOOKUP",
      "XLOOKUP",
      "INDEX",
      "MATCH",
      "TRANSPOSE"
    ],
    "tips": "데이터가 세로로 쌓여 있다면 HLOOKUP이 아니라 VLOOKUP을 쓰는 것이 맞습니다. XLOOKUP은 검색모드에 따라 가로·세로를 모두 다룰 수 있어, 가로형 표도 XLOOKUP 하나로 처리하는 경우가 늘고 있습니다. 가로↔세로 방향을 바꾸고 싶을 때는 TRANSPOSE가 도움이 됩니다."
  },
  {
    "id": "lookup",
    "name": "LOOKUP",
    "category": "lookup",
    "version": "all",
    "weight": 2,
    "difficulty": 3,
    "syntax": "벡터형식 =LOOKUP(찾을값, 찾을범위, [반환범위]) · 배열형식 =LOOKUP(찾을값, 표배열)",
    "summary": "항상 근삿값으로 검색하는 고전 함수. 정렬된 데이터 검색과 '마지막 값 찾기' 기법에 쓰임.",
    "intro": "LOOKUP은 VLOOKUP·HLOOKUP보다 오래된 검색 함수입니다. 값을 찾을 범위와 가져올 범위를 따로 지정하는 '벡터 형식'과, 표의 긴 쪽(행 또는 열)을 자동으로 검색하는 '배열 형식' 두 가지가 있습니다.\n\n가장 큰 특징은 항상 '근삿값'으로 찾는다는 점입니다. 그래서 찾을 범위는 반드시 오름차순으로 정렬되어 있어야 제대로 동작합니다. 정렬이 안 된 데이터에서 정확히 일치하는 값을 찾을 때는 XLOOKUP이나 VLOOKUP(FALSE)이 더 안전합니다.\n\n요즘은 XLOOKUP에 자리를 많이 내주었지만, '조건에 맞는 마지막 값 찾기'나 '열의 마지막 숫자 찾기' 같은 고급 기법 덕분에 실무 고수들이 여전히 애용하는 함수입니다.",
    "params": [
      {
        "name": "찾을값",
        "required": true,
        "desc": "찾고 싶은 기준값입니다. 예: 점수 87, 계약번호."
      },
      {
        "name": "찾을범위",
        "required": true,
        "desc": "값을 찾아볼 한 줄(한 행 또는 한 열) 범위입니다. 반드시 오름차순으로 정렬되어 있어야 합니다. 배열 형식에서는 검색할 표 전체가 됩니다."
      },
      {
        "name": "반환범위",
        "required": false,
        "desc": "찾은 위치에서 실제로 가져올 값이 든 범위입니다. 찾을범위와 크기가 같아야 합니다. 생략하면 '배열 형식'으로 동작해 표의 마지막 행·열 값을 돌려줍니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "점수로 등급 찾기(벡터 형식)",
        "formula": "=LOOKUP(87, B2:B6, C2:C6)",
        "result": "87 이하의 가장 가까운 값에 대응하는 등급(예: \"B\")",
        "explain": "B열(구간 하한)이 오름차순으로 정렬되어 있을 때, 87을 넘지 않는 가장 가까운 값을 찾아 같은 위치의 C열(등급)을 가져옵니다. LOOKUP은 항상 근삿값으로 찾으므로 정확히 87이 없어도 구간을 잡아냅니다."
      },
      {
        "level": "basic",
        "title": "표 하나로 바로 찾기(배열 형식)",
        "formula": "=LOOKUP(87, B2:C6)",
        "result": "B열에서 87을 찾아 마지막 열(C열)의 값",
        "explain": "반환범위를 생략하고 표(B2:C6)만 주면, 표의 첫 열에서 값을 찾아 '마지막 열'의 값을 돌려줍니다(세로가 더 길면 열 기준). 간단하지만 표 구조가 바뀌면 결과가 달라질 수 있어, 실무에서는 벡터 형식을 더 권합니다."
      },
      {
        "level": "advanced",
        "title": "조건에 맞는 '마지막' 값 찾기",
        "formula": "=LOOKUP(2, 1/(A2:A100=\"P1003\"), D2:D100)",
        "result": "계약번호 P1003이 나오는 마지막 행의 청구액",
        "explain": "이 기법이 LOOKUP의 진짜 매력입니다. 1/(A2:A100=\"P1003\")은 조건이 맞는 자리는 1, 아니면 오류(#DIV/0!)가 됩니다. 존재하지 않는 큰 값 2를 찾게 하면, LOOKUP은 오류를 건너뛰고 '1이 있는 마지막 자리'를 잡아 그 행의 값을 가져옵니다. 정렬 없이 '조건에 맞는 최신 값'을 뽑는 대표 기법입니다."
      },
      {
        "level": "advanced",
        "title": "열의 마지막 숫자 찾기",
        "formula": "=LOOKUP(9.99E+307, C:C)",
        "result": "C열에 입력된 마지막 숫자 값(예: 누적 보험료의 최신 합계)",
        "explain": "9.99E+307은 엑셀이 다룰 수 있는 거의 최댓값입니다. 이보다 큰 숫자는 없으니 LOOKUP은 C열의 '마지막 숫자'를 돌려줍니다. 데이터가 계속 추가되는 열에서 '가장 최근에 입력된 값'을 자동으로 참조할 때 유용합니다."
      }
    ],
    "related": [
      "XLOOKUP",
      "VLOOKUP",
      "INDEX",
      "MATCH",
      "HLOOKUP"
    ],
    "tips": "LOOKUP은 옵션이 없어 항상 근삿값으로 찾고, 찾을 범위가 오름차순이 아니면 엉뚱한 값을 조용히 반환합니다(오류를 안 내서 더 위험). 일반적인 정확 일치 검색은 XLOOKUP·VLOOKUP(FALSE)을 쓰고, LOOKUP은 '마지막 값 찾기'(1/(조건) 또는 9.99E+307 기법)처럼 다른 함수로 어려운 상황에 골라 쓰는 것이 좋습니다."
  },
  {
    "id": "filter",
    "name": "FILTER",
    "category": "shape",
    "version": "2021",
    "weight": 5,
    "difficulty": 3,
    "syntax": "=FILTER(배열, 포함조건, [비었을때])",
    "summary": "표에서 조건에 맞는 행만 골라 자동으로 펼쳐 주는 함수.",
    "intro": "FILTER는 큰 표에서 '조건에 맞는 행만' 뽑아내는 함수입니다. 예전에는 자동 필터를 켜고 마우스로 조건을 고른 뒤 결과를 복사·붙여넣기 해야 했지만, FILTER는 수식 하나로 조건에 맞는 데이터가 자동으로 아래(또는 옆)로 좌르륵 펼쳐집니다. 이렇게 저절로 펼쳐지는 것을 '스필(spill)'이라고 부릅니다.\n\n핵심은 두 번째 인수인 '포함조건'입니다. 여기에는 원본과 같은 크기의 TRUE/FALSE 목록이 들어가는데, C2:C100>1000000 처럼 비교식을 쓰면 각 행이 조건을 만족하는지(TRUE) 아닌지(FALSE)가 자동으로 계산됩니다. 그중 TRUE인 행만 결과에 남습니다.\n\n조건에 맞는 게 하나도 없으면 기본적으로 #CALC! 오류가 나므로, 세 번째 인수 '비었을때'에 \"해당 없음\" 같은 값을 넣어 두면 안전합니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "필터링할 원본 데이터. 한 열·여러 열·표 전체 모두 가능합니다."
      },
      {
        "name": "포함조건",
        "required": true,
        "desc": "남길 행을 정하는 TRUE/FALSE 배열. 보통 C2:C100>1000000 같은 비교식을 씁니다. 배열과 행(또는 열) 개수가 같아야 합니다."
      },
      {
        "name": "비었을때",
        "required": false,
        "desc": "조건에 맞는 게 하나도 없을 때 대신 반환할 값. 생략하면 #CALC! 오류가 납니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "조건에 맞는 행만 뽑기",
        "formula": "=FILTER(A2:C100, C2:C100>1000000)",
        "result": "C열(청구액)이 100만원을 초과하는 행만 A:C 3개 열 그대로 아래로 스필",
        "explain": "가장 기본. 두 번째 칸에 '어떤 행을 남길지' 조건식을 넣으면 TRUE인 행만 자동으로 추려져 펼쳐집니다."
      },
      {
        "level": "basic",
        "title": "특정 상품의 값만 뽑기",
        "formula": "=FILTER(B2:B100, A2:A100=\"자동차\")",
        "result": "A열 상품이 \"자동차\"인 계약의 B열(보험료)만 세로로 스필",
        "explain": "결과로 내보내는 범위(B열)와 조건을 검사하는 범위(A열)를 다르게 둘 수 있습니다. 상품이 자동차인 보험료만 모입니다."
      },
      {
        "level": "advanced",
        "title": "여러 조건 동시 만족(AND)",
        "formula": "=FILTER(A2:D100, (A2:A100=\"자동차\")*(C2:C100>500000))",
        "result": "상품이 자동차이면서 청구액 50만원 초과인 행만 스필",
        "explain": "조건과 조건을 곱하면(*) '둘 다 참'인 AND가 됩니다. TRUE=1·FALSE=0이라 1×1=1일 때만 남습니다."
      },
      {
        "level": "advanced",
        "title": "둘 중 하나면 통과(OR)",
        "formula": "=FILTER(A2:D100, (B2:B100=\"서울\")+(B2:B100=\"부산\"))",
        "result": "지역이 서울 또는 부산인 행 스필",
        "explain": "조건끼리 더하면(+) '하나라도 참'인 OR가 됩니다. 서울이거나 부산인 계약이 모두 포함됩니다."
      },
      {
        "level": "advanced",
        "title": "결과 없을 때 오류 막고 정렬까지",
        "formula": "=SORT(FILTER(A2:C100, C2:C100>0, \"해당 없음\"), 3, -1)",
        "result": "청구액이 있는 계약만 골라 청구액(3열) 내림차순 정렬, 하나도 없으면 \"해당 없음\" 한 칸",
        "explain": "세 번째 인수로 빈 결과의 #CALC! 오류를 막고, FILTER 결과를 SORT로 감싸 곧바로 정렬합니다. 함수 조합의 대표 패턴입니다."
      }
    ],
    "tips": "AND는 조건끼리 곱하기(*), OR는 더하기(+)로 만듭니다. 조건 범위와 데이터 범위의 행 수가 다르면 #VALUE! 오류가 납니다. 결과가 펼쳐질 아래·옆 칸에 다른 값이 있으면 #SPILL! 오류가 나므로 주변을 비워 두세요.",
    "related": [
      "SORT",
      "UNIQUE",
      "XLOOKUP",
      "IFERROR"
    ]
  },
  {
    "id": "sequence",
    "name": "SEQUENCE",
    "category": "shape",
    "version": "2021",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=SEQUENCE(행수, [열수], [시작값], [증가분])",
    "summary": "1, 2, 3처럼 규칙적으로 이어지는 숫자 배열을 한 번에 자동으로 만들어 스필한다.",
    "intro": "SEQUENCE는 1, 2, 3처럼 규칙적으로 이어지는 숫자를 한 번에 자동으로 만들어 주는 함수입니다. 셀마다 직접 숫자를 입력하거나 채우기 핸들로 끌어내릴 필요 없이, '몇 행 몇 열로, 몇부터, 몇씩 커지게'만 정해 주면 됩니다.\n\n결과는 '스필(spill)'이라고 해서 수식을 넣은 한 칸에서 필요한 만큼 아래·오른쪽으로 자동으로 펼쳐집니다.\n\nSEQUENCE는 단독으로 순번을 매길 때도 쓰지만, 다른 함수의 '엔진'처럼 쓰일 때 진가를 발휘합니다. 예를 들어 EDATE와 결합해 매월 납입일을 만들거나, 거듭제곱과 결합해 여러 해에 걸친 보험료 추이를 한 수식으로 계산할 수 있습니다. 동적 배열을 다룰 때 가장 기본이 되는 함수입니다.",
    "params": [
      {
        "name": "행수",
        "required": true,
        "desc": "만들 배열의 행(세로) 개수입니다. 예를 들어 5를 넣으면 세로로 5칸이 채워집니다."
      },
      {
        "name": "열수",
        "required": false,
        "desc": "배열의 열(가로) 개수입니다. 생략하면 1(한 열)입니다."
      },
      {
        "name": "시작값",
        "required": false,
        "desc": "첫 번째 숫자입니다. 생략하면 1부터 시작합니다."
      },
      {
        "name": "증가분",
        "required": false,
        "desc": "다음 숫자로 넘어갈 때 더할 값입니다. 생략하면 1씩 커집니다. 음수를 넣으면 줄어듭니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "1부터 5까지 세로로 만들기",
        "formula": "=SEQUENCE(5)",
        "result": "세로 5칸에 1, 2, 3, 4, 5가 자동으로 채워짐",
        "explain": "행수(5)만 정하면 나머지는 기본값(1열, 1부터, 1씩)이 적용됩니다. 순번을 매기는 가장 간단한 사용법입니다."
      },
      {
        "level": "basic",
        "title": "10부터 5씩 커지는 숫자 만들기",
        "formula": "=SEQUENCE(5, 1, 10, 5)",
        "result": "세로 5칸에 10, 15, 20, 25, 30이 채워짐",
        "explain": "시작값(10)과 증가분(5)을 주면 원하는 간격의 숫자열을 만듭니다. 나이 구간(10, 15, 20…)이나 눈금 값을 만들 때 유용합니다."
      },
      {
        "level": "advanced",
        "title": "매년 3%씩 오르는 10년 보험료 추이",
        "formula": "=B2*(1+0.03)^SEQUENCE(10, 1, 0, 1)",
        "result": "B2의 보험료가 매년 3%씩 인상된 10년치 금액이 세로로 스필됨",
        "explain": "SEQUENCE(10,1,0,1)이 0~9의 연차 지수를 만들고, 이를 (1+인상률)의 거듭제곱에 넣어 10년 추이를 한 번에 계산합니다. 셀을 하나하나 끌어내릴 필요가 없습니다."
      },
      {
        "level": "advanced",
        "title": "계약일 기준 12개월 납입일 만들기",
        "formula": "=EDATE(C2, SEQUENCE(12, 1, 0, 1))",
        "result": "C2(계약일)로부터 0~11개월 뒤 날짜 12개가 세로로 스필됨",
        "explain": "SEQUENCE가 0, 1, …, 11의 개월 수를 만들고 EDATE가 각 개월만큼 뒤 날짜를 계산해, 월납 보험료의 납입 일정표를 한 수식으로 완성합니다."
      }
    ],
    "related": [
      "RANDARRAY",
      "EDATE",
      "INDEX",
      "FILTER"
    ],
    "tips": "결과가 스필되므로 아래·오른쪽 칸이 비어 있어야 합니다. 이미 값이 있으면 #SPILL! 오류가 납니다. 열수·시작값·증가분은 모두 생략 가능하며 기본값은 각각 1입니다. Excel 2021과 Microsoft 365에서만 동작합니다."
  },
  {
    "id": "sort",
    "name": "SORT",
    "category": "shape",
    "version": "2021",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=SORT(배열, [정렬기준], [정렬방향], [열기준])",
    "summary": "원본은 그대로 두고 정렬된 결과만 새 위치에 펼쳐 주는 함수.",
    "intro": "SORT는 표나 목록을 원하는 순서대로 자동 정렬해 주는 함수입니다. 원본 데이터는 건드리지 않고, 정렬된 결과만 새 위치에 좌르륵 펼쳐(스필) 보여줍니다. 원본이 바뀌면 정렬 결과도 자동으로 다시 계산되므로, 한 번 걸어 두면 계속 최신 상태로 유지됩니다.\n\n기본값은 첫 번째 열을 기준으로 오름차순(작은 값→큰 값) 정렬입니다. 몇 번째 열을 기준으로 삼을지(정렬기준), 오름차순(1)인지 내림차순(-1)인지(정렬방향), 세로가 아니라 가로로 정렬할지(열기준)까지 지정할 수 있습니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "정렬할 범위나 배열입니다."
      },
      {
        "name": "정렬기준",
        "required": false,
        "desc": "몇 번째 열(또는 행)을 기준으로 삼을지. 생략하면 1(첫 열)입니다."
      },
      {
        "name": "정렬방향",
        "required": false,
        "desc": "1=오름차순, -1=내림차순. 생략하면 1(오름차순)입니다."
      },
      {
        "name": "열기준",
        "required": false,
        "desc": "TRUE면 가로(열 방향)로 정렬, FALSE(기본)면 세로(행 방향)로 정렬합니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "값 오름차순 정렬",
        "formula": "=SORT(A2:A100)",
        "result": "A열 값이 작은 것부터 큰 것 순으로 스필",
        "explain": "인수 하나만 넣으면 첫 열 기준 오름차순. 원본은 그대로 두고 정렬본만 새로 펼쳐집니다."
      },
      {
        "level": "basic",
        "title": "특정 열 기준 내림차순",
        "formula": "=SORT(A2:C100, 3, -1)",
        "result": "3번째 열(청구액)이 큰 순서대로 A:C 전체 행이 스필",
        "explain": "정렬기준=3(세 번째 열), 정렬방향=-1(내림차순). 청구액이 큰 계약이 위로 옵니다."
      },
      {
        "level": "advanced",
        "title": "거른 뒤 정렬하기",
        "formula": "=SORT(FILTER(A2:C100, A2:A100=\"자동차\"), 3, -1)",
        "result": "자동차 계약만 골라 청구액 내림차순으로 스필",
        "explain": "안쪽 FILTER로 자동차만 추린 뒤 바깥 SORT로 청구액순 정렬. 실무에서 가장 자주 쓰는 2단 조합입니다."
      },
      {
        "level": "advanced",
        "title": "정렬된 고유 목록",
        "formula": "=SORT(UNIQUE(A2:A100))",
        "result": "A열의 중복 없는 값들을 가나다·오름차순으로 스필",
        "explain": "UNIQUE로 중복을 없앤 뒤 SORT로 정렬하면 깔끔한 '분류 목록'이 됩니다. 드롭다운 원본으로 쓰기 좋습니다."
      },
      {
        "level": "advanced",
        "title": "가로 방향으로 정렬",
        "formula": "=SORT(B1:M1, 1, 1, TRUE)",
        "result": "1행에 가로로 나열된 값을 왼쪽→오른쪽 오름차순으로 재배열",
        "explain": "네 번째 인수 열기준=TRUE면 세로가 아니라 가로(열 방향)로 정렬합니다. 월별·항목별 헤더를 정렬할 때 씁니다."
      }
    ],
    "tips": "1차·2차 기준을 함께 쓰는 다중 열 정렬은 SORT보다 SORTBY가 명확합니다. 정렬 결과가 펼쳐질 공간이 막혀 있으면 #SPILL! 오류가 납니다. 원본 표의 순서는 바뀌지 않고 별도 위치에 정렬본이 새로 생깁니다.",
    "related": [
      "SORTBY",
      "FILTER",
      "UNIQUE",
      "LARGE"
    ]
  },
  {
    "id": "spill-operator",
    "name": "스필 범위 연산자 (#)",
    "category": "shape",
    "version": "2021",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=첫번째셀#   (예: =D2#, =SUM(A2#))",
    "summary": "동적 배열이 펼쳐진 전체 범위를 '#' 하나로 자동 참조",
    "intro": "동적 배열 함수(FILTER, UNIQUE, SORT, SEQUENCE 등)를 입력하면 결과가 여러 셀에 자동으로 '흘러넘쳐(spill)' 표시됩니다. 이렇게 자동으로 채워진 전체 범위를, 개수가 몇 개든 상관없이 '#' 기호 하나로 통째로 가리키게 해주는 것이 스필 범위 연산자입니다.\n\n예를 들어 A2 셀에 =UNIQUE(상품목록)을 입력해 상품 목록이 A2부터 아래로 펼쳐졌다면, 'A2#'이라고 쓰면 펼쳐진 목록 전체(A2:A20 등)를 가리킵니다. 나중에 상품이 늘어나 목록이 길어져도 'A2#'은 자동으로 늘어난 범위까지 따라갑니다.\n\n즉 '=SUM(D2#)'처럼 쓰면 범위를 매번 고쳐 잡을 필요 없이 항상 최신 결과 전체를 계산합니다. 참조하는 셀은 반드시 동적 배열의 첫 번째(왼쪽 위) 셀이어야 합니다. (Excel 2021·Microsoft 365에서 사용 가능)",
    "params": [
      {
        "name": "앵커셀",
        "required": true,
        "desc": "동적 배열의 첫 번째(왼쪽 위) 셀 참조. 뒤에 #을 붙여 그 셀에서 펼쳐진 전체 범위를 가리킴 (예: D2#). 중간 셀에는 붙일 수 없음"
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "펼쳐진 목록 전체 참조",
        "formula": "=A2#",
        "result": "A2에서 아래로 스필된 동적 배열 전체(예: A2:A15)를 하나의 범위로 참조",
        "explain": "A2에 =UNIQUE(계약[상품])처럼 결과가 여러 칸으로 펼쳐졌을 때, 그 전체를 'A2#' 한 번으로 가리킵니다. 목록 길이가 바뀌어도 자동으로 따라갑니다."
      },
      {
        "level": "basic",
        "title": "스필 결과 합계 내기",
        "formula": "=SUM(D2#)",
        "result": "D2에서 시작해 펼쳐진 금액 배열 전체의 합계(예: 160,000)",
        "explain": "D2에 =B2:B4*C2:C4를 넣어 각 행 금액이 자동으로 펼쳐졌다면, D2#으로 그 전체를 잡아 합계를 냅니다. 행이 늘어도 범위를 다시 지정할 필요가 없습니다."
      },
      {
        "level": "advanced",
        "title": "자동 확장되는 상품별 합계표",
        "formula": "=SUMIF(계약[상품], G2#, 계약[보험료])",
        "result": "G2#(고유 상품 목록)의 상품 수만큼 자동 확장된 상품별 보험료 합계 배열",
        "explain": "G2에 =UNIQUE(계약[상품])로 상품 목록을 펼친 뒤, 그 목록(G2#)을 SUMIF의 조건으로 사용합니다. 새 상품이 생기면 목록도, 합계도 함께 늘어나는 '살아 있는' 요약표가 됩니다."
      },
      {
        "level": "advanced",
        "title": "개수 세기 · 동적 드롭다운",
        "formula": "=COUNTA(A2#)",
        "result": "A2에서 펼쳐진 항목의 개수(목록이 늘거나 줄면 값도 자동 변경)",
        "explain": "펼쳐진 목록이 지금 몇 개인지 셀 때 A2#을 씁니다. 또 데이터 유효성 검사의 원본에 '=$A$2#'을 넣으면 목록이 바뀔 때 드롭다운도 자동으로 갱신됩니다."
      }
    ],
    "related": [
      "FILTER",
      "UNIQUE",
      "SORT",
      "SEQUENCE",
      "암시적 교차 연산자 (@)"
    ],
    "tips": "'#'은 반드시 동적 배열의 첫 번째(왼쪽 위) 셀에 붙입니다(D2#은 OK, 중간 셀 D3#은 오류). 일반 값이나 단일 셀에는 쓸 수 없습니다. 스필될 자리에 다른 값이 있으면 #SPILL! 오류가 나며, 그 셀을 비우면 다시 표시됩니다. 스필 범위를 '이름 정의'로 등록해 두면 차트·유효성 검사에서 편리합니다."
  },
  {
    "id": "textjoin",
    "name": "TEXTJOIN",
    "category": "shape",
    "version": "2019",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=TEXTJOIN(구분기호, 빈셀무시, 텍스트1, [텍스트2], ...)",
    "summary": "여러 셀·문자열을 지정한 구분 기호로 이어 붙여 하나의 텍스트로 만든다.",
    "intro": "TEXTJOIN은 흩어져 있는 여러 글자나 셀 값을 정해진 기호(쉼표, 공백, 슬래시 등)로 연결해 한 문장으로 합쳐 주는 함수예요. 예전 CONCATENATE나 & 연산자와 달리, 구분 기호를 셀 사이마다 자동으로 끼워 넣어 주고 범위(A1:A10) 전체를 한 번에 넘길 수 있어 훨씬 편합니다.\n\n가장 큰 장점은 '빈 셀 무시' 기능이에요. 중간에 값이 없는 칸이 있어도 쓸데없는 구분 기호가 겹쳐 나오지 않게 알아서 건너뜁니다. 그래서 명단을 쉼표로 잇거나, 여러 조각을 코드로 조립하거나, 조건에 맞는 값만 모아 한 셀에 요약할 때 자주 씁니다.\n\nTEXTSPLIT이 '자르는' 함수라면 TEXTJOIN은 정반대로 '붙이는' 함수라고 생각하면 쉬워요. Excel 2019부터 사용할 수 있습니다.",
    "params": [
      {
        "name": "구분기호",
        "required": true,
        "desc": "값들 사이에 끼워 넣을 기호. \", \"(쉼표+공백), \"-\", \"/\" 등. 줄바꿈은 CHAR(10)을 씁니다."
      },
      {
        "name": "빈셀무시",
        "required": true,
        "desc": "빈 셀을 건너뛸지 여부. TRUE면 빈 칸을 무시해 구분 기호가 겹치지 않고, FALSE면 빈 칸도 그대로 이어 붙입니다."
      },
      {
        "name": "텍스트1",
        "required": true,
        "desc": "이어 붙일 첫 번째 값. 셀 하나, 범위(A1:A10), 또는 \"문자열\"을 직접 넣을 수 있어요."
      },
      {
        "name": "텍스트2 …",
        "required": false,
        "desc": "추가로 이어 붙일 값들. 여러 범위·문자열을 계속 나열할 수 있습니다(최대 252개)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "이름 목록을 쉼표로 잇기",
        "formula": "=TEXTJOIN(\", \", TRUE, A2:A6)",
        "result": "A2:A6의 이름들이 \"김철수, 이영희, 박민수, ...\" 한 문장으로 연결됨",
        "explain": "세로로 늘어선 값을 한 줄로 모으는 가장 기본 사용이에요. 빈 셀이 있어도 TRUE라서 쉼표가 겹치지 않고 깔끔하게 이어집니다."
      },
      {
        "level": "basic",
        "title": "조각을 이어 붙여 계약 코드 만들기",
        "formula": "=TEXTJOIN(\"-\", TRUE, \"P\", 2024, \"00123\")",
        "result": "\"P-2024-00123\"",
        "explain": "고정 문자열과 값들을 하이픈으로 연결해 규칙적인 코드를 조립할 때 써요. 각 조각을 셀 참조로 바꾸면 자동으로 코드가 생성됩니다."
      },
      {
        "level": "advanced",
        "title": "조건에 맞는 값만 모아 한 셀에 요약",
        "formula": "=TEXTJOIN(\", \", TRUE, IF(C2:C500=\"생명보험\", B2:B500, \"\"))",
        "result": "product가 '생명보험'인 행의 계약자 이름만 쉼표로 이어진 한 문장",
        "explain": "IF로 조건에 맞지 않는 값은 빈 문자열 \"\"로 만들고, 빈셀무시 TRUE가 그 빈 칸을 건너뛰게 하면 조건부 목록이 완성돼요. 365에서는 그냥 확정, 2019에서는 배열 수식(Ctrl+Shift+Enter)으로 넣습니다."
      },
      {
        "level": "advanced",
        "title": "FILTER와 결합해 고객별 계약 목록 만들기",
        "formula": "=TEXTJOIN(CHAR(10), TRUE, FILTER(D2:D500, A2:A500=F2))",
        "result": "F2 고객이 가진 계약번호들이 셀 안에서 줄바꿈으로 나열됨",
        "explain": "FILTER로 특정 고객의 계약만 먼저 뽑고 TEXTJOIN으로 합치면, 한 셀에 그 고객의 계약을 모두 보여줄 수 있어요. 구분 기호 CHAR(10)은 셀 안 줄바꿈이라 '자동 줄 바꿈' 서식과 함께 쓰면 보기 좋습니다(FILTER는 365·2021)."
      },
      {
        "level": "advanced",
        "title": "중복 없는 상품 목록을 한 줄로",
        "formula": "=TEXTJOIN(\" / \", TRUE, UNIQUE(C2:C500))",
        "result": "판매 상품의 고유 목록이 \"생명보험 / 건강 / 상해 / ...\"로 이어진 한 문장",
        "explain": "UNIQUE로 중복을 없앤 뒤 TEXTJOIN으로 합치면 태그·범례처럼 쓸 요약 문자열을 만들 수 있어요. 데이터가 늘어도 자동으로 갱신됩니다(UNIQUE는 365·2021)."
      }
    ],
    "tips": "① 두 번째 인수 빈셀무시는 생략할 수 없습니다 — 보통 TRUE로 두면 빈 칸으로 인한 구분자 겹침을 막습니다. ② 숫자를 이어 붙이면 셀 서식(천 단위 콤마 등)은 무시되고 원래 값이 붙으니, 형식이 필요하면 TEXT로 감싸세요(예: TEXT(A2,\"#,##0\")). ③ 결과가 32,767자를 넘으면 #VALUE! 오류가 납니다. ④ 반대로 붙은 문자열을 다시 나누려면 TEXTSPLIT을 쓰세요.",
    "related": [
      "TEXTSPLIT",
      "CONCAT",
      "FILTER",
      "UNIQUE",
      "TEXT"
    ]
  },
  {
    "id": "unique",
    "name": "UNIQUE",
    "category": "shape",
    "version": "2021",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=UNIQUE(배열, [열기준], [정확히한번])",
    "summary": "목록에서 중복을 없애고 서로 다른 값만 남겨 주는 함수.",
    "intro": "UNIQUE는 목록에서 중복을 제거하고 '서로 다른 값만' 남겨 주는 함수입니다. 상품 종류, 지역, 담당자처럼 '몇 가지 종류가 있는지' 뽑아낼 때 가장 많이 씁니다. 결과는 자동으로 펼쳐지고(스필), 원본이 바뀌면 목록도 저절로 갱신됩니다.\n\n한 열만 넣으면 그 열의 고유값을, 여러 열을 넣으면 '열 조합'이 같은 것을 하나로 봐서 고유 조합을 돌려줍니다. 세 번째 인수를 TRUE로 하면 '딱 한 번만 등장한 값'만 골라낼 수도 있습니다(예: 청구가 한 번밖에 없던 계약 찾기).\n\nCOUNTA(UNIQUE(...))처럼 감싸면 '고유 개수'를, 데이터 유효성 검사에서 스필 참조(예: E2#)로 쓰면 '자동으로 늘었다 줄었다 하는 드롭다운 목록'을 만들 수 있습니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "중복을 제거할 범위나 배열입니다."
      },
      {
        "name": "열기준",
        "required": false,
        "desc": "FALSE(기본)=행 단위로 비교(각 행이 한 레코드), TRUE=열 단위로 비교합니다."
      },
      {
        "name": "정확히한번",
        "required": false,
        "desc": "FALSE(기본)=중복은 하나로 합쳐 모두 표시, TRUE=정확히 한 번만 나온 값만 표시합니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "중복 제거",
        "formula": "=UNIQUE(A2:A100)",
        "result": "A열의 서로 다른 값만 한 번씩 스필",
        "explain": "가장 기본. 상품·지역·담당자 같은 열에서 '어떤 종류가 있는지'를 한 번에 뽑아냅니다."
      },
      {
        "level": "basic",
        "title": "여러 열 조합의 고유값",
        "formula": "=UNIQUE(A2:B100)",
        "result": "A·B 두 열 조합이 겹치지 않는 행만 스필",
        "explain": "여러 열을 넣으면 '조합'이 같은 것을 하나로 봅니다. 예: (상품, 지역) 조합 목록을 만들 때 씁니다."
      },
      {
        "level": "advanced",
        "title": "고유 개수 세기",
        "formula": "=COUNTA(UNIQUE(A2:A100))",
        "result": "서로 다른 값이 몇 개인지 숫자 하나 반환",
        "explain": "UNIQUE 결과를 COUNTA로 감싸면 '몇 종류인지'가 나옵니다. 예: 거래한 상품 종류 수를 셀 때 유용합니다."
      },
      {
        "level": "advanced",
        "title": "딱 한 번만 나온 값",
        "formula": "=UNIQUE(A2:A100, FALSE, TRUE)",
        "result": "목록에서 정확히 1회만 등장한 값만 스필",
        "explain": "세 번째 인수 정확히한번=TRUE면 중복된 값은 아예 빼고, 유일하게 한 번만 나온 값만 남깁니다. 청구가 1건뿐인 계약 찾기 등에 씁니다."
      },
      {
        "level": "advanced",
        "title": "조건 충족 항목의 정렬된 고유 목록 → 자동 드롭다운",
        "formula": "=SORT(UNIQUE(FILTER(A2:A100, C2:C100>0)))",
        "result": "청구액이 있는 계약의 상품만 골라 중복 제거·정렬해 스필. 이 셀 주소에 #를 붙여(예: E2#) 데이터 유효성 목록으로 지정하면 자동 확장 드롭다운",
        "explain": "FILTER→UNIQUE→SORT 3단 조합으로 '조건에 맞는 깔끔한 분류 목록'을 만들고, 스필 참조(#)로 늘었다 줄었다 하는 드롭다운을 만듭니다."
      }
    ],
    "tips": "'고유 개수'는 COUNTA(UNIQUE(...)) 또는 ROWS(UNIQUE(...))로 셉니다. 빈 셀이 섞이면 0(빈 값)이 하나의 고유값으로 잡힐 수 있으니 주의하세요. 열기준 없이 여러 열을 넣으면 '행 조합' 기준으로 중복을 판단합니다.",
    "related": [
      "FILTER",
      "SORT",
      "COUNTIF",
      "COUNTA"
    ]
  },
  {
    "id": "vstack",
    "name": "VSTACK",
    "category": "shape",
    "version": "365",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=VSTACK(배열1, [배열2], ...)",
    "summary": "여러 개의 표·목록을 위아래로 이어 붙여 하나의 배열로 세로 결합한다.",
    "intro": "VSTACK은 '세로로 쌓기(Vertical Stack)'라는 이름 그대로, 여러 개의 표나 목록을 위아래로 이어 붙여 하나로 합쳐 주는 함수입니다. 예를 들어 1월 계약 목록과 2월 계약 목록이 따로 떨어져 있을 때, VSTACK으로 한 번에 하나의 긴 목록으로 만들 수 있습니다.\n\n결과는 '스필(spill)' 방식으로 자동으로 아래 칸까지 채워집니다. 즉 수식은 한 칸에만 입력해도 합쳐진 행 수만큼 결과가 흘러넘쳐 표시됩니다. 복사·붙여넣기로 데이터를 이어 붙이던 작업을 수식 하나로 자동화할 수 있어, 원본이 바뀌면 합쳐진 결과도 자동으로 갱신됩니다.\n\n주의: 합치려는 표들의 '열 개수'가 서로 다르면, 부족한 칸은 #N/A 오류로 채워집니다. 열 개수를 맞춰서 사용하세요.",
    "params": [
      {
        "name": "배열1",
        "required": true,
        "desc": "위아래로 합칠 첫 번째 범위나 배열. 맨 위에 놓입니다."
      },
      {
        "name": "배열2, ...",
        "required": false,
        "desc": "그 아래에 순서대로 이어 붙일 두 번째 이후의 범위·배열(최대 255개)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "두 목록을 하나로 이어 붙이기",
        "formula": "=VSTACK(A2:A5, C2:C5)",
        "result": "A2:A5의 값 아래에 C2:C5의 값이 이어진 한 열(8행) 스필 배열",
        "explain": "떨어져 있는 두 목록을 위아래로 합쳐 하나의 목록으로 만듭니다. 한 칸에만 입력해도 결과가 8칸으로 자동으로 흘러넘쳐 표시됩니다."
      },
      {
        "level": "basic",
        "title": "여러 시트의 표를 세로로 합치기",
        "formula": "=VSTACK('1월'!A2:C10, '2월'!A2:C10)",
        "result": "1월 시트와 2월 시트의 3열짜리 표가 세로로 이어진 배열(최대 18행)",
        "explain": "월별로 나뉜 계약 표를 한 곳에 모읍니다. 열 구조(3열)가 같으면 그대로 아래로 이어 붙습니다."
      },
      {
        "level": "advanced",
        "title": "제목 행은 유지하고 조건에 맞는 행만 합치기",
        "formula": "=VSTACK(A1:C1, FILTER(A2:C100, C2:C100>=1000000))",
        "result": "1행 머리글 아래에 청구액(claim_amt) 100만원 이상인 행만 이어진 표",
        "explain": "머리글(A1:C1)을 맨 위에 두고, 그 아래에 FILTER로 걸러낸 데이터만 붙입니다. 보고서용 표를 수식 하나로 완성할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "여러 상품 목록을 합쳐 중복 제거 후 정렬",
        "formula": "=SORT(UNIQUE(VSTACK(상품A!B2:B200, 상품B!B2:B200)))",
        "result": "두 시트의 상품(product) 코드를 합친 뒤 중복을 없애고 오름차순 정렬한 목록",
        "explain": "VSTACK으로 여러 곳의 코드를 모으고, UNIQUE로 중복을 제거한 뒤 SORT로 정렬합니다. 통합 마스터 목록을 만들 때 자주 쓰는 조합입니다."
      },
      {
        "level": "advanced",
        "title": "합친 뒤 빈 칸까지 정리해 깔끔한 한 열로",
        "formula": "=TOCOL(VSTACK(A2:A50, C2:C50), 1)",
        "result": "두 목록을 합친 뒤 빈 칸을 제거한 한 열",
        "explain": "VSTACK으로 합친 결과를 TOCOL의 '빈 셀 무시(1)' 옵션으로 정리해, 중간에 빈 칸이 없는 연속된 목록으로 만듭니다."
      }
    ],
    "related": [
      "HSTACK",
      "TOCOL",
      "FILTER",
      "SORT",
      "UNIQUE"
    ],
    "tips": "열 개수가 다른 표를 합치면 부족한 칸이 #N/A로 채워집니다. 열 수를 맞추거나 필요하면 IFERROR로 감싸 처리하세요. 최대 255개 배열까지 이어 붙일 수 있으며, 가로로 붙이는 짝 함수는 HSTACK입니다."
  },
  {
    "id": "chooserows",
    "name": "CHOOSEROWS · CHOOSECOLS",
    "category": "shape",
    "version": "365",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=CHOOSEROWS(배열, 행번호1, [행번호2], …)  /  =CHOOSECOLS(배열, 열번호1, [열번호2], …)",
    "summary": "표에서 원하는 행(CHOOSEROWS)이나 열(CHOOSECOLS)만 골라 뽑는다. 떨어져 있어도, 순서를 바꿔도 OK.",
    "intro": "CHOOSEROWS는 표에서 원하는 '행'만, CHOOSECOLS는 원하는 '열'만 골라 뽑아 주는 함수입니다. 1행·3행·5행처럼 서로 떨어져 있는 행을 한 번에 뽑을 수 있고, 뽑는 순서도 마음대로 바꿀 수 있습니다.\n\n번호에 음수를 쓰면 끝에서부터 셉니다(-1은 마지막 행/열). 그래서 '최근 3건'이나 '맨 뒤 열'을 뽑을 때 편리합니다.\n\n연속된 부분을 잘라내는 TAKE·DROP과 달리, CHOOSEROWS·CHOOSECOLS는 서로 떨어져 있는 행·열을 골라 오거나 순서를 재배치할 수 있는 것이 강점입니다. 필요한 열만 골라 보고서 형태로 재배치하거나, 표의 순서를 뒤집는 등 데이터를 원하는 모양으로 재구성할 때 자주 씁니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "행·열을 골라낼 원본 표나 셀 범위입니다."
      },
      {
        "name": "행번호 / 열번호",
        "required": true,
        "desc": "뽑을 행(CHOOSEROWS) 또는 열(CHOOSECOLS)의 번호입니다. 1부터 시작하며, 음수는 끝에서부터 셉니다(-1=마지막)."
      },
      {
        "name": "행번호2, 행번호3, …",
        "required": false,
        "desc": "추가로 뽑을 행·열 번호입니다. 나열한 순서대로 결과가 배치됩니다. 필요한 만큼 이어서 넣을 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "필요한 열만 골라 뽑기",
        "formula": "=CHOOSECOLS(A2:F10, 1, 3)",
        "result": "A~F 표에서 1열과 3열만 뽑아 2열로 스필",
        "explain": "여러 열 중 계약번호(1열)와 보험료(3열)처럼 필요한 것만 골라 옮깁니다. 중간의 2열은 건너뜁니다."
      },
      {
        "level": "basic",
        "title": "떨어져 있는 행만 뽑기",
        "formula": "=CHOOSEROWS(A2:C10, 1, 3, 5)",
        "result": "1·3·5번째 행만 뽑아 3행으로 스필",
        "explain": "떨어져 있는 행도 번호만 나열하면 한 번에 뽑힙니다. 나열 순서를 바꾸면 뽑히는 순서도 바뀝니다."
      },
      {
        "level": "advanced",
        "title": "최근 3건(맨 뒤 행) 뽑기",
        "formula": "=CHOOSEROWS(A2:C100, -3, -2, -1)",
        "result": "표의 마지막 3개 행이 원래 순서대로 스필",
        "explain": "음수 번호는 끝에서부터 셉니다. -3, -2, -1은 뒤에서 세 번째·두 번째·마지막 행이므로, 최신 청구 3건처럼 '맨 아래 몇 건'을 뽑을 때 편합니다."
      },
      {
        "level": "advanced",
        "title": "열 순서를 보고서용으로 재배치",
        "formula": "=CHOOSECOLS(A2:E100, 5, 1, 3)",
        "result": "5열 → 1열 → 3열 순서로 열을 재배열해 스필",
        "explain": "원본 순서와 상관없이 원하는 순서로 열을 다시 배치합니다. 예를 들어 상품명(5열)을 맨 앞으로 옮겨 보기 좋은 보고서 열 순서를 만듭니다."
      },
      {
        "level": "advanced",
        "title": "표를 위아래로 뒤집기",
        "formula": "=CHOOSEROWS(A2:A100, SEQUENCE(99, , 99, -1))",
        "result": "행 순서가 완전히 거꾸로 뒤집혀 스필",
        "explain": "SEQUENCE(99,,99,-1)이 99, 98, …, 1의 역순 번호를 만들고, CHOOSEROWS가 그 순서대로 행을 뽑아 표를 뒤집습니다. 오래된순↔최신순 전환에 활용합니다."
      }
    ],
    "related": [
      "TAKE",
      "DROP",
      "INDEX",
      "FILTER",
      "SEQUENCE"
    ],
    "tips": "번호는 1부터 시작합니다(0은 오류). 존재하지 않는 번호를 넣으면 #VALUE! 오류가 납니다. 연속된 범위라면 TAKE·DROP이 더 간단하고, 떨어져 있거나 순서를 바꿀 때는 CHOOSEROWS·CHOOSECOLS가 유리합니다. Microsoft 365 전용 함수입니다."
  },
  {
    "id": "drop",
    "name": "DROP",
    "category": "shape",
    "version": "365",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=DROP(배열, 행수, [열수])",
    "summary": "표의 처음(양수) 또는 끝(음수)에서 지정한 개수만큼의 행·열을 제거하고 나머지를 돌려준다.",
    "intro": "DROP은 TAKE와 반대로, 표에서 '처음 몇 줄' 또는 '마지막 몇 줄'을 '떼어내고(제거하고)' 나머지를 돌려주는 함수입니다. 가장 흔한 쓰임은 표의 첫 줄(제목 행)을 떼어내고 데이터만 남기는 것입니다.\n\n행 개수를 양수로 주면 위에서부터 제거하고, 음수로 주면 아래에서부터 제거합니다. 세 번째 인수로 열도 같은 방식으로 제거할 수 있습니다.\n\nTAKE(가져오기)와 DROP(버리기)을 조합하면 '11번째부터 20번째까지'처럼 표의 중간 구간만 잘라내는 것도 가능합니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "일부를 제거하고 나머지를 돌려줄 원본 범위나 배열."
      },
      {
        "name": "행수",
        "required": true,
        "desc": "제거할 행 수. 양수=위(처음)에서부터, 음수=아래(끝)에서부터. 제목 행 제거는 1. 열만 제거하려면 쉼표로 자리를 비웁니다."
      },
      {
        "name": "열수",
        "required": false,
        "desc": "제거할 열 수. 양수=왼쪽에서, 음수=오른쪽에서. 생략하면 열은 그대로 둡니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "제목 행 떼어내고 데이터만 남기기",
        "formula": "=DROP(A1:C100, 1)",
        "result": "머리글(1행)을 제외한 A2:C100 데이터 배열",
        "explain": "표의 첫 줄(제목)을 떼어내고 순수 데이터만 얻습니다. DROP의 가장 흔한 쓰임입니다."
      },
      {
        "level": "basic",
        "title": "마지막 합계 행 떼어내기",
        "formula": "=DROP(A2:C101, -1)",
        "result": "맨 아래 1개 행을 제외한 나머지",
        "explain": "음수를 주면 끝에서부터 제거합니다. -1은 맨 아래 한 줄(예: 합계 행)을 빼고 나머지를 돌려줍니다."
      },
      {
        "level": "advanced",
        "title": "머리글 제거 후 정렬하기",
        "formula": "=SORT(DROP(A1:C100, 1), 3, -1)",
        "result": "제목 행을 뺀 데이터를 청구액(claim_amt) 내림차순으로 정렬한 배열",
        "explain": "DROP으로 머리글을 떼어내고 데이터만 SORT에 넘겨 정렬합니다. 머리글이 데이터에 섞여 정렬이 어긋나는 문제를 막아 줍니다."
      },
      {
        "level": "advanced",
        "title": "첫 열(관리번호) 빼고 나머지 열만",
        "formula": "=DROP(A1:F100, , 1)",
        "result": "맨 왼쪽 첫 열을 제거한 나머지 열들",
        "explain": "행 인수를 쉼표로 비우고 열 인수에 1을 주면, 맨 왼쪽 열(예: 내부 관리번호)만 빼고 나머지를 보여줄 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "TAKE와 조합해 중간 구간(11~20행)만 잘라내기",
        "formula": "=TAKE(DROP(A2:C1000, 10), 10)",
        "result": "앞 10행을 버린 뒤 그다음 10행 — 즉 11~20번째 행",
        "explain": "DROP으로 앞 10줄을 버리고 TAKE로 그다음 10줄만 가져옵니다. 페이지 나누기(11~20위 구간)처럼 표의 중간만 잘라낼 때 쓰는 조합입니다."
      }
    ],
    "related": [
      "TAKE",
      "CHOOSEROWS",
      "CHOOSECOLS",
      "SORT",
      "FILTER"
    ],
    "tips": "제거할 개수가 전체 행/열 수보다 크거나 같으면 남는 것이 없어 #CALC! 오류가 납니다. 양수=처음부터 제거, 음수=끝부터 제거이며, 가져오는 함수 TAKE와 조합하면 표의 중간 구간만 잘라낼 수 있습니다."
  },
  {
    "id": "groupby",
    "name": "GROUPBY",
    "category": "shape",
    "version": "365",
    "weight": 3,
    "difficulty": 4,
    "syntax": "=GROUPBY(행필드, 값, 집계함수, [머리글], [총합계깊이], [정렬순서], [필터배열], [필드관계])",
    "summary": "수식 한 줄로 기준별 그룹을 묶고 합계·평균·개수 등을 집계해 요약표를 스필한다.",
    "intro": "GROUPBY는 피벗 테이블이 하는 일을 수식 한 줄로 해내는 함수예요. '무엇을 기준으로 묶어서(예: 상품별)' '어떤 값을(예: 보험료)' '어떻게 집계할지(합계·평균·개수 등)'만 알려 주면, 그룹별 요약표를 자동으로 만들어 아래로 흘려(스필) 줍니다.\n\n피벗 테이블과 달리 원본이 바뀌면 결과가 즉시 갱신되고, 다른 수식과 자유롭게 이어 붙일 수 있다는 점이 강력합니다. 집계 방법에는 SUM·AVERAGE·COUNT·MAX 같은 기본 함수는 물론, PERCENTOF(비중)나 직접 만든 LAMBDA도 넣을 수 있어요.\n\n인수가 많아 보이지만 앞의 세 개(기준·값·집계함수)만 필수예요. 나머지는 머리글 표시, 총합계, 정렬, 필터를 세밀하게 조절하는 선택 사항입니다. Microsoft 365 전용의 비교적 새 함수입니다.",
    "params": [
      {
        "name": "행필드",
        "required": true,
        "desc": "그룹으로 묶을 기준 열(예: 상품 product 열). 두 개 이상 열을 함께 주면 계층형으로 묶입니다."
      },
      {
        "name": "값",
        "required": true,
        "desc": "집계할 대상 열(예: 보험료 premium, 청구액 claim_amt). 여러 열을 HSTACK으로 묶어 함께 집계할 수도 있어요."
      },
      {
        "name": "집계함수",
        "required": true,
        "desc": "묶은 값을 계산할 방법. SUM·AVERAGE·COUNT·MAX·MIN·PERCENTOF 등을 괄호 없이 이름만 넣거나 LAMBDA를 넣습니다."
      },
      {
        "name": "머리글",
        "required": false,
        "desc": "데이터에 머리글이 있는지·표시할지 설정. 0=자동, 1=없음, 2=있음(감춤), 3=있음(표시)."
      },
      {
        "name": "총합계깊이",
        "required": false,
        "desc": "총합계·소계 표시. 0=없음, 1=총합계, 2=총합계+소계. 음수(-1,-2)는 아래쪽에 표시."
      },
      {
        "name": "정렬순서",
        "required": false,
        "desc": "정렬할 열 번호. 양수면 오름차순, 음수면 내림차순(예: -2 = 두 번째 열 기준 내림차순)."
      },
      {
        "name": "필터배열",
        "required": false,
        "desc": "포함할 행만 남기는 TRUE/FALSE 배열. 특정 조건(예: 특정 지역)만 집계할 때 씁니다."
      },
      {
        "name": "필드관계",
        "required": false,
        "desc": "행 기준을 여러 개 줬을 때의 관계. 0=계층형, 1=테이블형(조합별 나열)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "상품별 보험료 합계",
        "formula": "=GROUPBY(C2:C500, D2:D500, SUM)",
        "result": "C열(상품)별로 묶어 D열(보험료) 합계를 낸 2열 요약표가 스필됨",
        "explain": "기준 열·값 열·집계함수만 주면 되는 가장 기본 사용이에요. SUM은 괄호 없이 이름만 넣습니다. 피벗을 만들 필요 없이 즉시 상품별 합계표가 생깁니다."
      },
      {
        "level": "basic",
        "title": "지역별 계약 건수 세기",
        "formula": "=GROUPBY(A2:A500, A2:A500, COUNT)",
        "result": "지역별로 몇 건인지 세어 지역-건수 표로 펼침",
        "explain": "개수만 세고 싶을 때는 집계함수에 COUNT를 넣어요. 값 열에 기준 열을 그대로 넣어도 건수는 정확히 계산됩니다."
      },
      {
        "level": "advanced",
        "title": "상품별 청구액 합계·평균·건수 한 번에",
        "formula": "=GROUPBY(C2:C500, HSTACK(E2:E500, E2:E500, E2:E500), HSTACK(SUM, AVERAGE, COUNT), 3, 1)",
        "result": "상품별로 청구액 합계·평균·건수 3개 열을 나란히, 머리글 표시(3)와 맨 위 총합계(1)까지 포함",
        "explain": "값과 집계함수를 HSTACK으로 여러 개 묶으면 한 수식으로 다중 집계표를 만들 수 있어요. 머리글 3(표시)·총합계깊이 1을 주면 제목 줄과 합계 줄이 자동으로 붙습니다."
      },
      {
        "level": "advanced",
        "title": "지역·상품 2단 그룹 + 보험료 큰 순 정렬",
        "formula": "=GROUPBY(HSTACK(A2:A500, C2:C500), D2:D500, SUM, 3, 2, -3)",
        "result": "지역>상품 계층으로 묶어 보험료 합계를 내고, 소계·총합계 포함, 합계 열(3번째) 기준 내림차순 정렬",
        "explain": "행 기준을 HSTACK으로 두 개 주면 지역 안에서 상품별로 다시 쪼갠 계층 요약이 됩니다. 정렬순서 -3은 세 번째 열(합계)을 큰 값부터, 총합계깊이 2는 소계+총합계를 함께 보여 줘요."
      },
      {
        "level": "advanced",
        "title": "조건 필터 + 상품별 비중(%) 계산",
        "formula": "=GROUPBY(C2:C500, D2:D500, PERCENTOF, 3, 0, -2, B2:B500=\"영업1팀\")",
        "result": "영업1팀 계약만 걸러(필터배열) 상품별 보험료가 전체에서 차지하는 비중(%)을 큰 순으로 나열",
        "explain": "집계함수에 PERCENTOF를 넣으면 각 그룹이 전체에서 차지하는 비율을 바로 구할 수 있어요. 필터배열(B열=\"영업1팀\")로 특정 팀만 대상으로 삼고, 정렬순서 -2로 비중이 큰 상품부터 보여 줍니다."
      }
    ],
    "tips": "① 집계함수는 SUM(...)처럼 실행하지 말고 함수 이름만 넣습니다(엔진이 그룹마다 알아서 적용). ② 결과가 스필하므로 아래·오른쪽 셀을 비워 두지 않으면 #SPILL! 오류가 납니다. ③ 원본이 표(테이블) 구조면 열 참조가 자동 확장되어 데이터가 늘어도 요약표가 따라 커집니다. ④ 행이 아니라 열 방향으로 펼치는 교차표가 필요하면 PIVOTBY를 사용하세요. ⑤ 비교적 새 함수라 사용 중인 365 채널·버전에 따라 아직 없을 수 있습니다.",
    "related": [
      "PIVOTBY",
      "SUM",
      "AVERAGE",
      "PERCENTOF",
      "LAMBDA",
      "HSTACK",
      "FILTER"
    ]
  },
  {
    "id": "hstack",
    "name": "HSTACK",
    "category": "shape",
    "version": "365",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=HSTACK(배열1, [배열2], ...)",
    "summary": "여러 범위를 좌우로 나란히 이어 붙여 하나의 배열로 가로 결합한다.",
    "intro": "HSTACK은 '가로로 쌓기(Horizontal Stack)'로, 여러 범위를 좌우로 나란히 이어 붙여 하나의 표로 만드는 함수입니다. 서로 떨어져 있는 열들을 옆으로 붙이거나, 계산한 값을 원래 표 옆에 새 열로 덧붙일 때 유용합니다.\n\nVSTACK이 위아래로 쌓는다면 HSTACK은 좌우로 붙인다고 생각하면 됩니다. 결과는 스필로 자동 표시되고, 원본이 바뀌면 합쳐진 결과도 함께 갱신됩니다.\n\n주의: 붙이려는 범위들의 '행 개수'가 서로 다르면, 부족한 부분은 #N/A 오류로 채워집니다. 행 개수를 맞춰서 사용하세요.",
    "params": [
      {
        "name": "배열1",
        "required": true,
        "desc": "좌우로 합칠 첫 번째 범위나 배열. 맨 왼쪽에 놓입니다."
      },
      {
        "name": "배열2, ...",
        "required": false,
        "desc": "오른쪽에 순서대로 이어 붙일 두 번째 이후의 범위·배열(최대 255개)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "떨어진 두 열을 나란히 붙이기",
        "formula": "=HSTACK(A2:A6, D2:D6)",
        "result": "A열 값과 D열 값이 좌우로 나란히 놓인 2열 배열",
        "explain": "서로 떨어져 있던 두 열을 옆으로 붙여 한 표로 만듭니다. 원본 표에서 필요한 열만 골라 새 표를 구성할 때 편리합니다."
      },
      {
        "level": "basic",
        "title": "여러 열을 원하는 순서로 재배열",
        "formula": "=HSTACK(C2:C10, A2:A10, B2:B10)",
        "result": "원래 A, B, C 순서를 C, A, B 순서로 바꾼 3열 배열",
        "explain": "열 순서를 바꿔서 보여주고 싶을 때, 원본은 그대로 두고 원하는 순서로 옆에 붙여 새 배열을 만듭니다."
      },
      {
        "level": "advanced",
        "title": "원래 표 옆에 계산한 열 덧붙이기",
        "formula": "=HSTACK(A2:B10, B2:B10*0.02)",
        "result": "이름·보험료(premium) 표 오른쪽에 '보험료×2%' 계산 열이 추가된 3열 배열",
        "explain": "기존 표(A2:B10) 옆에 계산 결과 열을 나란히 붙입니다. 원본을 건드리지 않고도 파생 열을 즉석에서 붙일 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "VSTACK과 함께 표 전체 조립하기",
        "formula": "=VSTACK({\"상품\",\"보험료\"}, HSTACK(A2:A10, B2:B10))",
        "result": "머리글 행 아래에 상품·보험료 두 열을 붙인 완성형 표",
        "explain": "HSTACK으로 열을 옆으로 붙이고, VSTACK으로 머리글을 위에 올려 표를 통째로 만듭니다. 세로·가로 쌓기를 조합하면 원하는 모양의 표를 자유롭게 구성할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "넓은 표에서 보고용 열만 골라 붙이기",
        "formula": "=HSTACK(A2:A100, C2:C100, F2:F100)",
        "result": "1·3·6번째 열만 뽑아 나란히 붙인 3열 배열",
        "explain": "넓은 원본 표에서 보고에 필요한 열만 골라 옆으로 붙입니다. CHOOSECOLS와 비슷하지만, 떨어진 여러 원본에서도 자유롭게 가져올 수 있는 점이 다릅니다."
      }
    ],
    "related": [
      "VSTACK",
      "CHOOSECOLS",
      "TOROW",
      "FILTER"
    ],
    "tips": "행 개수가 다른 범위를 붙이면 부족한 부분이 #N/A로 채워지므로 행 수를 맞추세요. 세로로 붙이는 짝 함수는 VSTACK이며, 두 함수를 조합하면 표를 통째로 조립할 수 있습니다."
  },
  {
    "id": "pivotby",
    "name": "PIVOTBY",
    "category": "shape",
    "version": "365",
    "weight": 3,
    "difficulty": 4,
    "syntax": "=PIVOTBY(행_필드, 열_필드, 값, 집계함수, [머리글], [행_총계], [행_정렬], [열_총계], [열_정렬], [필터], [상대피벗])",
    "summary": "표 데이터를 함수 한 줄로 피벗 테이블처럼 교차 요약(Microsoft 365 전용)",
    "intro": "PIVOTBY는 표 데이터를 수식 한 줄로 '피벗 테이블처럼' 요약해 주는 함수입니다. 예를 들어 '상품별·지역별 보험료 합계'를 마우스로 피벗 테이블을 만들지 않고도, 셀에 함수만 입력하면 교차표 형태로 자동으로 펼쳐집니다.\n\n행에 넣을 기준(예: 상품), 열에 넣을 기준(예: 지역), 집계할 값(예: 보험료), 그리고 어떻게 계산할지(합계·평균·개수 등)를 지정하면, 교차표(크로스탭)가 스필 기능으로 자동 확장되어 나타납니다.\n\n원본 데이터가 바뀌면 결과도 자동으로 다시 계산되는 것이 큰 장점입니다. 한 방향(예: 상품별)만 요약하려면 GROUPBY가 더 간단하고, 두 방향으로 교차 집계할 때 PIVOTBY가 제격입니다. 단, Microsoft 365 전용이라 2021 이하 버전에는 없습니다.",
    "params": [
      {
        "name": "행_필드",
        "required": true,
        "desc": "행(세로)으로 묶을 기준 열. 예: 상품 열 → 상품마다 한 행"
      },
      {
        "name": "열_필드",
        "required": true,
        "desc": "열(가로)로 묶을 기준 열. 예: 지역 열 → 지역마다 한 열. (행·열 중 최소 하나는 있어야 함)"
      },
      {
        "name": "값",
        "required": true,
        "desc": "집계할 값이 든 열. 예: 보험료, 청구액. 개수를 셀 땐 세고 싶은 항목 열"
      },
      {
        "name": "집계함수",
        "required": true,
        "desc": "계산 방식. SUM(합계)·AVERAGE(평균)·COUNTA(개수)·MAX·MIN·PERCENTOF(비중) 등, 또는 LAMBDA로 직접 정의"
      },
      {
        "name": "머리글",
        "required": false,
        "desc": "데이터에 제목행이 있는지·표시할지. 0=없음, 1=있음(숨김), 2=없음(생성), 3=있음(표시)"
      },
      {
        "name": "행_총계",
        "required": false,
        "desc": "행 방향 총계 깊이. 0=없음, 1=총합계, 2=총합계+소계. 음수면 위쪽에 표시"
      },
      {
        "name": "행_정렬",
        "required": false,
        "desc": "행 정렬 기준 열 번호. 양수=오름차순, 음수=내림차순"
      },
      {
        "name": "열_총계",
        "required": false,
        "desc": "열 방향 총계 깊이(행_총계와 동일한 규칙)"
      },
      {
        "name": "열_정렬",
        "required": false,
        "desc": "열 정렬 기준(양수=오름/음수=내림)"
      },
      {
        "name": "필터",
        "required": false,
        "desc": "포함할 행을 TRUE/FALSE로 지정하는 배열. 예: (계약[상태]=\"유효\") → 유효 계약만 집계"
      },
      {
        "name": "상대피벗",
        "required": false,
        "desc": "상대적 피벗 계산 사용 여부(고급 옵션, 보통 생략)"
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "상품 × 지역 보험료 합계",
        "formula": "=PIVOTBY(계약[상품], 계약[지역], 계약[보험료], SUM)",
        "result": "행=상품, 열=지역인 교차표가 자동으로 펼쳐지고 각 칸에 보험료 합계, 가장자리에 총합계가 표시됨",
        "explain": "상품과 지역으로 나눠 보험료 합계를 한눈에. 피벗 테이블을 따로 만들지 않고 함수 하나로 요약합니다."
      },
      {
        "level": "basic",
        "title": "상품 × 가입연도 계약 건수",
        "formula": "=PIVOTBY(계약[상품], 계약[가입연도], 계약[계약번호], COUNTA)",
        "result": "상품(행) × 가입연도(열)별 계약 '건수' 표가 스필로 확장되어 표시",
        "explain": "합계 대신 COUNTA를 쓰면 '몇 건'인지 세어 줍니다. 값 자리에는 세고 싶은 항목(계약번호)을 넣으면 됩니다."
      },
      {
        "level": "advanced",
        "title": "비중(%)으로 보기 — PERCENTOF",
        "formula": "=PIVOTBY(계약[상품], 계약[채널], 계약[보험료], PERCENTOF)",
        "result": "각 칸이 전체 보험료 대비 그 상품·채널의 비율(%)로 표시됨",
        "explain": "집계함수 자리에 PERCENTOF를 넣으면 합계 대신 '전체에서 차지하는 비중'을 계산합니다. 어느 상품·채널이 큰지 구성비를 바로 파악할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "유효 계약만 + 총계·머리글 옵션",
        "formula": "=PIVOTBY(계약[상품], 계약[가입연도], 계약[보험료], SUM, 3, 1, , , , (계약[상태]=\"유효\"))",
        "result": "상태가 '유효'인 행만 집계한 상품×연도 보험료 합계표(머리글 표시, 총합계 1단)",
        "explain": "뒤쪽 선택 인수로 세밀하게 제어합니다: 머리글 표시(3), 총계 1단(1), 마지막 필터 배열로 '유효' 계약만 포함. 중간에 쓰지 않는 인수는 콤마로 자리를 비워 위치를 맞춥니다."
      },
      {
        "level": "advanced",
        "title": "사용자 정의 집계 — LAMBDA로 중앙값",
        "formula": "=PIVOTBY(청구[상품], 청구[가입연도], 청구[청구액], LAMBDA(값들, MEDIAN(값들)))",
        "result": "상품 × 가입연도별 청구액의 '중앙값'이 담긴 교차표",
        "explain": "기본 제공 함수(SUM·AVERAGE) 외에 LAMBDA로 원하는 계산도 넣을 수 있습니다. 평균이 큰 청구 건에 흔들릴 때 중앙값으로 대푯값을 보면 더 안정적입니다."
      }
    ],
    "related": [
      "GROUPBY",
      "SUMIFS",
      "AVERAGEIFS",
      "COUNTIFS",
      "LAMBDA"
    ],
    "tips": "행·열 기준을 둘 다 비울 수는 없고 최소 하나는 필요합니다. 한 방향만 요약하려면 GROUPBY가 더 간단합니다. 선택 인수는 순서가 중요해 중간을 건너뛸 땐 콤마로 자리를 비워야 합니다. 결과가 스필되므로 아래·오른쪽 셀이 비어 있어야 하며, 막혀 있으면 #SPILL! 오류가 납니다."
  },
  {
    "id": "sortby",
    "name": "SORTBY",
    "category": "shape",
    "version": "2021",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=SORTBY(배열, 기준배열1, [정렬방향1], [기준배열2], [정렬방향2], ...)",
    "summary": "결과에 없는 다른 범위나 계산식을 기준으로 삼아 정렬하는 함수.",
    "intro": "SORTBY는 '정렬 기준을 결과에 포함하지 않아도 되는' 정렬 함수입니다. SORT가 '표 안의 몇 번째 열'을 기준으로 삼는다면, SORTBY는 아예 다른 범위나 계산식을 기준으로 삼을 수 있습니다.\n\n예를 들어 결과로는 '이름 목록'만 받고 싶은데 정렬은 '청구액 크기순'으로 하고 싶다면 =SORTBY(이름범위, 청구액범위, -1) 처럼 씁니다. 결과에는 이름만 나오고 청구액은 보이지 않지만, 청구액이 큰 순서대로 정렬됩니다.\n\n기준을 여러 개 이어 붙여 '지역 오름차순 → 같은 지역 안에서는 청구액 내림차순'처럼 다단계 정렬도 쉽게 할 수 있고, 손해율 같은 계산식을 기준으로도 정렬할 수 있어 SORT보다 유연합니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "정렬해서 돌려줄 데이터 범위입니다."
      },
      {
        "name": "기준배열1",
        "required": true,
        "desc": "정렬 기준이 되는 범위나 계산식. 배열과 크기(개수)가 같아야 합니다. 결과에 표시되지 않아도 됩니다."
      },
      {
        "name": "정렬방향1",
        "required": false,
        "desc": "1=오름차순(기본), -1=내림차순."
      },
      {
        "name": "기준배열2",
        "required": false,
        "desc": "2차 정렬 기준(1차가 같을 때의 동점 처리). 정렬방향2와 짝으로 계속 추가할 수 있습니다."
      },
      {
        "name": "정렬방향2",
        "required": false,
        "desc": "2차 기준의 오름/내림. 이후 기준3·방향3…처럼 짝을 계속 이어 붙일 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "다른 열 기준으로 정렬",
        "formula": "=SORTBY(A2:A100, C2:C100, -1)",
        "result": "A열(이름)을 C열(청구액) 큰 순서대로 정렬해 이름만 스필",
        "explain": "결과에는 이름만 나오지만 정렬은 청구액 기준. 기준 열을 결과에 포함하지 않아도 되는 게 SORT와의 차이입니다."
      },
      {
        "level": "basic",
        "title": "이름 기준 오름차순",
        "formula": "=SORTBY(B2:B100, A2:A100)",
        "result": "B열(보험료)을 A열(이름) 가나다순에 맞춰 스필",
        "explain": "정렬방향을 생략하면 오름차순(1)입니다. 이름 순서에 맞춰 보험료가 재배열됩니다."
      },
      {
        "level": "advanced",
        "title": "다단계 정렬(지역 → 청구액)",
        "formula": "=SORTBY(A2:C100, B2:B100, 1, C2:C100, -1)",
        "result": "지역(B) 오름차순, 같은 지역 안에서는 청구액(C) 내림차순으로 스필",
        "explain": "기준배열·정렬방향 짝을 계속 이어 붙이면 1차·2차·3차 정렬이 됩니다. SORT보다 다중 기준을 다루기 쉽습니다."
      },
      {
        "level": "advanced",
        "title": "계산식(손해율) 기준 정렬",
        "formula": "=SORTBY(A2:A100, C2:C100/D2:D100, -1)",
        "result": "이름을 손해율(청구액÷보험료)이 높은 순으로 정렬해 스필",
        "explain": "기준 자리에 표에 없는 계산식을 바로 넣을 수 있습니다. 별도 도우미 열 없이 손해율순 정렬이 됩니다."
      },
      {
        "level": "advanced",
        "title": "무작위로 섞기",
        "formula": "=SORTBY(A2:A100, RANDARRAY(ROWS(A2:A100)))",
        "result": "A열 목록을 매번 무작위 순서로 섞어 스필",
        "explain": "난수 배열을 기준으로 정렬하면 목록이 랜덤으로 섞입니다. 표본 추출·무작위 배정에 유용합니다."
      }
    ],
    "tips": "기준배열은 결과에 표시되지 않아도 되지만, 배열과 '개수'는 반드시 같아야 합니다. 다르면 #VALUE! 오류가 납니다. 다단계 정렬은 (기준, 방향) 짝을 순서대로 이어 붙이며, 먼저 쓴 기준이 1차 정렬입니다.",
    "related": [
      "SORT",
      "FILTER",
      "RANDARRAY",
      "SEQUENCE"
    ]
  },
  {
    "id": "take",
    "name": "TAKE",
    "category": "shape",
    "version": "365",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=TAKE(배열, 행수, [열수])",
    "summary": "표의 처음(양수) 또는 끝(음수)에서 지정한 개수만큼의 연속된 행·열을 잘라 온다.",
    "intro": "TAKE는 표에서 '처음 몇 줄' 또는 '마지막 몇 줄'만 잘라서 가져오는 함수입니다. 예를 들어 정렬된 청구 목록에서 상위 10건만 뽑거나, 가장 최근에 입력된 마지막 1건만 가져올 때 씁니다.\n\n행 개수를 양수로 주면 위(처음)에서부터, 음수로 주면 아래(끝)에서부터 셉니다. 세 번째 인수로 열 개수도 같은 방식으로 지정할 수 있습니다(양수=왼쪽에서, 음수=오른쪽에서).\n\n엑셀의 필터나 정렬 기능과 달리 수식이므로, 원본이 바뀌면 잘라낸 결과도 자동으로 갱신됩니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "잘라 올 원본 범위나 배열."
      },
      {
        "name": "행수",
        "required": true,
        "desc": "가져올 행 수. 양수=위(처음)에서부터, 음수=아래(끝)에서부터. 열만 지정하려면 쉼표로 자리를 비웁니다."
      },
      {
        "name": "열수",
        "required": false,
        "desc": "가져올 열 수. 양수=왼쪽에서, 음수=오른쪽에서. 생략하면 모든 열을 유지합니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "처음 5행만 가져오기",
        "formula": "=TAKE(A2:C100, 5)",
        "result": "A2:C100에서 맨 위 5개 행(3열) 배열",
        "explain": "표에서 위쪽 5줄만 잘라옵니다. 미리보기나 상위 항목만 확인할 때 씁니다."
      },
      {
        "level": "basic",
        "title": "마지막 1행(가장 최근 기록) 가져오기",
        "formula": "=TAKE(A2:C100, -1)",
        "result": "표의 맨 아래 1개 행",
        "explain": "행 수를 음수로 주면 끝에서부터 셉니다. -1은 마지막 한 줄, 즉 가장 최근에 입력된 기록을 가져옵니다."
      },
      {
        "level": "advanced",
        "title": "청구액 상위 10건(Top 10) 뽑기",
        "formula": "=TAKE(SORT(A2:C100, 3, -1), 10)",
        "result": "청구액(claim_amt, 3번째 열) 내림차순 정렬 후 상위 10개 행",
        "explain": "SORT로 청구액이 큰 순서로 정렬한 뒤, TAKE로 위에서 10건만 잘라냅니다. '상위 N개' 리스트를 만드는 대표 조합입니다."
      },
      {
        "level": "advanced",
        "title": "특정 열 하나만 통째로 가져오기",
        "formula": "=TAKE(A2:C100, , 1)",
        "result": "모든 행 × 첫 번째 열만",
        "explain": "두 번째 인수(행수)를 쉼표로 비우면 모든 행을 유지하고, 세 번째 인수로 첫 열만 가져옵니다. 열 방향으로도 자를 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "조건에 맞는 것 중 상위 3건만",
        "formula": "=TAKE(SORT(FILTER(A2:C100, B2:B100=\"자동차\"), 3, -1), 3)",
        "result": "'자동차' 상품만 걸러 청구액 내림차순 정렬 후 상위 3건",
        "explain": "FILTER로 조건을 걸고, SORT로 정렬한 뒤, TAKE로 상위 3건만 남깁니다. 필터·정렬·자르기를 이어 붙여 원하는 결과를 한 수식으로 만듭니다."
      }
    ],
    "related": [
      "DROP",
      "CHOOSEROWS",
      "CHOOSECOLS",
      "SORT",
      "FILTER"
    ],
    "tips": "행수는 양수=처음부터, 음수=끝부터입니다. 두 번째 인수를 쉼표로 비우면 열만 지정할 수 있습니다(예: =TAKE(범위,,2)). 요청한 개수가 실제 크기보다 크면 있는 만큼만 돌려줍니다. 반대로 지정한 만큼 '떼어내는' 함수는 DROP입니다."
  },
  {
    "id": "textsplit",
    "name": "TEXTSPLIT",
    "category": "shape",
    "version": "365",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=TEXTSPLIT(문자열, 열구분기호, [행구분기호], [빈값무시], [대소문자구분], [빈셀채움])",
    "summary": "한 셀의 문자열을 구분 기호로 잘라 여러 셀로 펼친다(가로·세로 동시 가능).",
    "intro": "TEXTSPLIT은 한 칸에 뭉쳐 있는 글자를 정해진 기호(쉼표, 하이픈, 공백 등)로 잘라 여러 셀에 나눠 담아 주는 함수예요. 예전에 '텍스트 나누기' 메뉴로 하던 작업을 수식 한 줄로, 그것도 자동으로 흘러넘치게(스필) 처리합니다.\n\n예를 들어 \"생명보험,건강,2024\"를 쉼표로 자르면 세 칸으로 좌→우로 펼쳐집니다. 열 구분 기호만 주면 가로로, 행 구분 기호까지 주면 세로·가로 격자(2차원)로도 나눌 수 있어요.\n\n원본을 건드리지 않고 값을 자동으로 쪼개므로, 계약번호·주소·코드처럼 규칙적으로 붙어 있는 문자열을 분리할 때 특히 편리합니다. Microsoft 365 전용 함수입니다.",
    "params": [
      {
        "name": "문자열",
        "required": true,
        "desc": "나눌 원본 텍스트(셀 참조 또는 \"...\" 직접 입력)."
      },
      {
        "name": "열구분기호",
        "required": true,
        "desc": "열(좌→우)을 나눌 기호. \",\"처럼 하나만 주거나 {\",\",\";\"}처럼 여러 기호를 배열로 줄 수 있어요."
      },
      {
        "name": "행구분기호",
        "required": false,
        "desc": "행(위→아래)을 나눌 기호. 지정하면 결과가 2차원 격자로 펼쳐집니다."
      },
      {
        "name": "빈값무시",
        "required": false,
        "desc": "구분 기호가 연달아 나올 때 생기는 빈 칸을 무시할지 여부. TRUE면 빈 칸을 건너뜁니다(기본 FALSE=빈 칸 생성)."
      },
      {
        "name": "대소문자구분",
        "required": false,
        "desc": "구분 기호의 대/소문자를 구분할지. 0(기본)=구분함, 1=구분 안 함."
      },
      {
        "name": "빈셀채움",
        "required": false,
        "desc": "행·열 개수가 안 맞아 생기는 빈 셀에 넣을 값. 생략하면 그 자리에 #N/A가 표시됩니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "쉼표로 이름 나누기",
        "formula": "=TEXTSPLIT(\"김철수,이영희,박민수\", \",\")",
        "result": "세 개의 이름이 좌→우 3칸으로 펼쳐짐: 김철수 | 이영희 | 박민수",
        "explain": "한 칸에 쉼표로 붙어 있던 글자를 잘라 옆으로 펼치는 가장 단순한 사용이에요. 열 구분 기호만 있으면 가로로 흘러넘칩니다."
      },
      {
        "level": "basic",
        "title": "계약번호를 조각내기",
        "formula": "=TEXTSPLIT(A2, \"-\")",
        "result": "A2의 \"P-2024-00123\"이 P | 2024 | 00123 세 칸으로 분리",
        "explain": "하이픈으로 이어진 코드를 부분별로 나눌 때 씁니다. 상품기호·연도·일련번호를 각각 다른 열로 떼어내 재활용할 수 있어요."
      },
      {
        "level": "advanced",
        "title": "여러 구분 기호로 한 번에 자르기 + 빈 칸 무시",
        "formula": "=TEXTSPLIT(A2, {\",\",\";\",\" \"}, , TRUE)",
        "result": "쉼표·세미콜론·공백 어느 것으로 구분되어 있든 모두 잘라 나누고, 연달아 나온 구분자로 생기는 빈 칸은 건너뜀",
        "explain": "구분 기호를 배열 {}로 여러 개 넘기면 형식이 제각각인 데이터도 한 수식으로 정리돼요. 빈값무시를 TRUE로 두면 \"A,,B\"의 가운데 빈 칸이 사라져 깔끔합니다."
      },
      {
        "level": "advanced",
        "title": "행·열 동시 분할로 2차원 표 복원",
        "formula": "=TEXTSPLIT(A1, \",\", \";\", , , \"\")",
        "result": "\"생명,100;건강,80;상해,60\"을 쉼표는 열, 세미콜론은 행으로 나눠 3행×2열 표로 펼침(빈 칸은 공백 처리)",
        "explain": "열 구분과 행 구분을 함께 주면 한 셀에 눌러 담긴 문자열을 격자 표로 되살릴 수 있어요. 빈셀채움에 \"\"를 주면 #N/A 대신 빈 칸으로 보입니다."
      },
      {
        "level": "advanced",
        "title": "분리한 조각 중 특정 위치만 뽑기",
        "formula": "=INDEX(TEXTSPLIT(A2, \"-\"), 1, 2)",
        "result": "A2의 \"P-2024-00123\"에서 두 번째 조각인 \"2024\"만 반환",
        "explain": "TEXTSPLIT의 스필 결과를 INDEX로 감싸면 원하는 조각(예: 연도 부분)만 콕 집어낼 수 있어요. 보조 열 없이 원하는 부분만 바로 계산에 쓸 때 유용합니다."
      }
    ],
    "tips": "① 구분 기호는 대소문자를 기본으로 구분하므로 알파벳 구분자는 주의하세요. ② 조각 개수가 행마다 다르면 짧은 쪽에 #N/A가 채워지니 빈셀채움을 지정하면 깔끔합니다. ③ 텍스트 앞뒤 공백까지 함께 잘릴 수 있어, 필요하면 TRIM으로 감싸 정리하세요. ④ 왼쪽·오른쪽 특정 글자만 필요하면 TEXTBEFORE·TEXTAFTER가 더 간단할 수 있습니다.",
    "related": [
      "TEXTJOIN",
      "TEXTBEFORE",
      "TEXTAFTER",
      "TRIM",
      "INDEX"
    ]
  },
  {
    "id": "tocol",
    "name": "TOCOL · TOROW",
    "category": "shape",
    "version": "365",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=TOCOL(배열, [무시할값], [열우선])  /  =TOROW(배열, [무시할값], [열우선])",
    "summary": "2차원 표를 한 열(TOCOL)이나 한 행(TOROW)으로 납작하게 편다. 빈칸·오류를 걸러낼 수 있다.",
    "intro": "TOCOL은 여러 행·열로 퍼져 있는 2차원 표를 '한 열'로, TOROW는 '한 행'으로 납작하게 펴 주는 함수입니다. 이곳저곳 흩어진 값을 하나의 긴 목록으로 모을 때 씁니다.\n\n두 번째 인수(무시할값)로 빈칸이나 오류값을 걸러낼 수 있어서(1=빈칸, 2=오류, 3=둘 다 무시), 지저분한 표를 깔끔한 목록으로 정리하기 좋습니다.\n\nUNIQUE(중복 제거)나 SORT(정렬)와 함께 쓰면, 여러 열에 흩어진 상품명·코드에서 정렬된 고유 목록을 한 번에 뽑아낼 수 있습니다. 반대로 한 줄을 여러 행·열로 되접고 싶다면 WRAPROWS·WRAPCOLS를 씁니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "한 열·한 행으로 펼칠 원본 표나 셀 범위입니다."
      },
      {
        "name": "무시할값",
        "required": false,
        "desc": "걸러낼 값을 정합니다. 0(또는 생략)=모두 포함, 1=빈칸 무시, 2=오류 무시, 3=빈칸·오류 모두 무시."
      },
      {
        "name": "열우선",
        "required": false,
        "desc": "TRUE면 열(세로) 방향으로 먼저 훑고, FALSE(기본)면 행(가로) 방향으로 먼저 훑어 담습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "표 전체를 한 열로 펴기",
        "formula": "=TOCOL(A2:C5)",
        "result": "3열×4행의 값들이 한 열(12칸)로 정렬됨",
        "explain": "흩어진 2차원 표를 하나의 세로 목록으로 만듭니다. 기본은 행 방향(가로줄 먼저)으로 훑어 담습니다."
      },
      {
        "level": "basic",
        "title": "표를 한 행으로 펴기",
        "formula": "=TOROW(A2:C5)",
        "result": "같은 값들이 한 행(가로 12칸)으로 정렬됨",
        "explain": "TOCOL과 방향만 다릅니다. 여러 칸의 값을 한 줄로 옆으로 늘어놓고 싶을 때 씁니다."
      },
      {
        "level": "advanced",
        "title": "여러 열에 흩어진 상품명을 고유 목록으로",
        "formula": "=SORT(UNIQUE(TOCOL(B2:E100, 1)))",
        "result": "B~E 4개 열에 흩어진 상품명이 빈칸 없이 정렬된 고유 목록으로",
        "explain": "TOCOL(…,1)이 빈칸을 무시하며 4개 열을 한 목록으로 모으고, UNIQUE가 중복을 없애고, SORT가 가나다순으로 정렬합니다. 흩어진 코드·상품명 정리에 아주 강력합니다."
      },
      {
        "level": "advanced",
        "title": "오류·빈칸을 걸러 평균 내기",
        "formula": "=AVERAGE(TOCOL(G2:J50, 3))",
        "result": "G~J 범위에서 빈칸과 #DIV/0! 등 오류를 뺀 숫자만 평균",
        "explain": "무시할값 3은 빈칸과 오류를 모두 건너뜁니다. 손해율 표에 0으로 나눈 오류가 섞여 있어도, 유효한 값만 골라 안전하게 평균을 냅니다."
      },
      {
        "level": "advanced",
        "title": "세로(열) 방향으로 훑어 펴기",
        "formula": "=TOCOL(A2:C5, 0, TRUE)",
        "result": "값을 열 우선(위→아래를 먼저)으로 훑어 한 열로 정렬",
        "explain": "세 번째 인수 TRUE는 열 방향으로 먼저 읽습니다. 원본이 세로로 이어지는 데이터라면 이 순서가 더 자연스럽습니다."
      }
    ],
    "related": [
      "WRAPROWS",
      "WRAPCOLS",
      "UNIQUE",
      "SORT",
      "FILTER"
    ],
    "tips": "무시할값: 0(또는 생략)=모두 포함, 1=빈칸 무시, 2=오류 무시, 3=둘 다 무시. 세 번째 인수 TRUE는 열 우선, FALSE(기본)는 행 우선 스캔입니다. 반대로 한 줄을 여러 행·열로 되접으려면 WRAPROWS·WRAPCOLS를 씁니다. Microsoft 365 전용 함수입니다."
  },
  {
    "id": "transpose",
    "name": "TRANSPOSE",
    "category": "shape",
    "version": "all",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=TRANSPOSE(배열)",
    "summary": "표의 행과 열을 서로 바꿔 세로↔가로로 눕히거나 세운다.",
    "intro": "TRANSPOSE는 표를 90도 돌려주는 함수예요. 세로로 길게 늘어선 값을 가로 한 줄로 눕히거나, 반대로 가로로 늘어선 값을 세로로 세울 때 씁니다. 쉽게 말해 '행과 열의 자리를 맞바꾸는' 도구입니다.\n\n예를 들어 A열에 위에서 아래로 상품명이 5개 적혀 있으면, TRANSPOSE로 이걸 한 줄에 좌→우로 5칸으로 펼칠 수 있어요. 원본 표와 연결되어 있어서 원본을 고치면 결과도 자동으로 바뀝니다.\n\n요즘 엑셀(365·2021)에서는 결과가 필요한 만큼 셀로 저절로 '흘러넘쳐(스필)' 채워집니다. 예전 버전(2019 이하)에서는 결과가 들어갈 범위를 먼저 드래그로 선택한 뒤 수식을 넣고 Ctrl+Shift+Enter로 확정해야 한다는 점만 기억하면 됩니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "행과 열을 바꾸고 싶은 셀 범위나 배열. 세로 5칸이면 가로 5칸으로, 3행×4열이면 4행×3열로 바뀝니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "세로 목록을 가로로 눕히기",
        "formula": "=TRANSPOSE(A2:A6)",
        "result": "A2:A6에 세로로 있던 상품명 5개가 한 행에 좌→우 5칸으로 펼쳐짐(스필)",
        "explain": "위아래로 늘어선 값을 한 줄로 눕히는 가장 기본 사용이에요. 결과 셀 하나에만 수식을 넣으면 나머지는 자동으로 채워집니다."
      },
      {
        "level": "basic",
        "title": "가로 머리글을 세로로 세우기",
        "formula": "=TRANSPOSE(B1:E1)",
        "result": "B1:E1에 가로로 있던 4개의 열 제목이 세로 4칸으로 세워짐",
        "explain": "표 머리글을 세로 목록으로 바꿔 다른 표의 기준 열로 재활용할 때 편해요. 행↔열이 반대로 뒤집힙니다."
      },
      {
        "level": "advanced",
        "title": "표 전체를 통째로 회전",
        "formula": "=TRANSPOSE(A1:D10)",
        "result": "10행×4열 표가 4행×10열로 회전되어 스필. 상품이 행이던 표가 상품이 열인 표로 바뀜",
        "explain": "한 셀 범위(2차원)를 통째로 돌리면 보고서 방향을 반대로 뒤집을 수 있어요. 원본과 연결되어 있어 원본 값이 바뀌면 회전본도 즉시 갱신됩니다."
      },
      {
        "level": "advanced",
        "title": "고유 상품 목록을 가로 머리글로 자동 생성",
        "formula": "=TRANSPOSE(SORT(UNIQUE(C2:C500)))",
        "result": "C열 product에서 중복 없는 상품명을 정렬한 뒤 가로 한 줄의 머리글로 펼침",
        "explain": "UNIQUE로 중복 제거→SORT로 정렬→TRANSPOSE로 눕히기를 이어 붙이면, 상품이 늘어나도 자동으로 늘어나는 동적 교차표 머리글을 만들 수 있어요. 실무에서 피벗 없이 요약표 뼈대를 짤 때 유용합니다."
      },
      {
        "level": "advanced",
        "title": "행 벡터×열 벡터 곱으로 가중합 계산",
        "formula": "=SUM(D2:D11*TRANSPOSE(F2:F11))",
        "result": "두 세로 범위를 곱해 만든 배열의 총합(예: 담보별 발생빈도×심도의 조합 합계)",
        "explain": "한 범위를 TRANSPOSE로 가로로 눕히면 세로×가로가 교차되어 모든 조합의 곱 배열이 만들어져요. 그 배열을 SUM으로 더하면 행렬 곱 형태의 가중합을 한 방에 구할 수 있습니다(고급 배열 활용)."
      }
    ],
    "tips": "① 결과 셀에 다른 값이 있으면 스필이 막혀 #SPILL! 오류가 납니다 — 아래·오른쪽 공간을 비워 두세요. ② 원본과 '연결'되므로 원본이 지워지면 결과도 오류가 됩니다. 값만 남기려면 복사→값 붙여넣기 하세요. ③ 2019 이하에서는 배열 수식(Ctrl+Shift+Enter)으로 넣어야 하며 중괄호 {}가 자동으로 붙습니다.",
    "related": [
      "FILTER",
      "SORT",
      "UNIQUE",
      "INDEX"
    ]
  },
  {
    "id": "expand",
    "name": "EXPAND",
    "category": "shape",
    "version": "365",
    "weight": 2,
    "difficulty": 2,
    "syntax": "=EXPAND(배열, [행수], [열수], [채울값])",
    "summary": "작은 표를 원하는 크기로 넓히고, 새로 생긴 빈 칸을 원하는 값으로 채운다.",
    "intro": "EXPAND는 작은 표(배열)를 원하는 크기로 '넓혀' 주는 함수입니다. 예를 들어 3행짜리 목록을 항상 10행 양식에 맞추고 싶을 때, 모자라는 칸을 자동으로 채워 크기를 키웁니다.\n\n새로 늘어난 빈 칸에는 기본적으로 오류값 #N/A가 들어가는데, 마지막 인수(채울값)로 0이나 빈 문자열(\"\"), \"-\" 같은 원하는 값을 지정하면 깔끔하게 채울 수 있습니다.\n\n혼자서도 쓰지만, VSTACK·HSTACK으로 여러 표를 이어 붙이기 전에 행·열 크기를 맞추는 용도로 특히 유용합니다. 단, EXPAND는 '넓히기'만 할 수 있고 원본보다 작게 '줄이기'는 못 한다는 점을 기억하세요(줄이려면 TAKE·DROP).",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "확장할 원본 표나 셀 범위입니다."
      },
      {
        "name": "행수",
        "required": false,
        "desc": "확장한 뒤의 전체 행 개수입니다. 원본 행수보다 크거나 같아야 합니다. 생략하면 행은 그대로 둡니다."
      },
      {
        "name": "열수",
        "required": false,
        "desc": "확장한 뒤의 전체 열 개수입니다. 원본 열수보다 크거나 같아야 합니다. 생략하면 열은 그대로 둡니다."
      },
      {
        "name": "채울값",
        "required": false,
        "desc": "새로 생긴 빈 칸에 넣을 값입니다. 생략하면 #N/A가 들어갑니다. 0, \"\", \"-\" 등을 지정할 수 있습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "목록을 5행으로 늘리고 0으로 채우기",
        "formula": "=EXPAND(A2:A4, 5, 1, 0)",
        "result": "A2:A4의 값 3개 아래에 0이 2개 더해져 5행이 됨",
        "explain": "원본 3행을 5행으로 확장하고, 새로 생긴 빈 2칸을 0으로 채웁니다. 채울값(0)을 빼면 그 칸에 #N/A가 나타납니다."
      },
      {
        "level": "basic",
        "title": "행·열을 넓히고 빈칸을 대시(-)로",
        "formula": "=EXPAND(B2:C2, 2, 4, \"-\")",
        "result": "2행 4열로 확장되고, 원본에 없던 칸은 모두 \"-\"로 표시됨",
        "explain": "행과 열을 동시에 넓히고 빈 곳을 \"-\"로 채웠습니다. 채울값에 문자열을 주면 보고서에서 '해당 없음'을 표현하기 좋습니다."
      },
      {
        "level": "advanced",
        "title": "필터 결과를 항상 10행 고정 양식으로",
        "formula": "=EXPAND(FILTER(A2:A100, B2:B100=\"암보험\"), 10, 1, \"\")",
        "result": "조건에 맞는 값을 위에서부터 채우고, 모자라면 빈 문자열로 채워 항상 10행",
        "explain": "FILTER 결과 개수가 매번 달라도 EXPAND로 10행에 고정하면 인쇄 양식이나 대시보드 칸 수가 흔들리지 않습니다. 채울값 \"\"로 남는 칸을 깔끔히 비웁니다(단, 결과가 10개를 넘으면 #VALUE!)."
      },
      {
        "level": "advanced",
        "title": "VSTACK 전에 열 개수 맞추기",
        "formula": "=VSTACK(A2:C2, EXPAND(E2:E5, 4, 3, \"\"))",
        "result": "1열짜리 목록을 3열로 넓혀 머리글(3열)과 세로로 이어 붙임",
        "explain": "VSTACK·HSTACK은 열(또는 행) 수가 다르면 빈 곳에 #N/A가 생깁니다. EXPAND로 미리 3열로 맞추고 빈칸을 \"\"로 채우면 오류 없이 깔끔하게 결합됩니다."
      }
    ],
    "related": [
      "VSTACK",
      "HSTACK",
      "TAKE",
      "DROP"
    ],
    "tips": "행수·열수는 원본보다 작을 수 없습니다(작으면 #VALUE! 오류). 즉 EXPAND는 '넓히기'만 하고 '줄이기'는 못 합니다 — 줄이려면 TAKE·DROP을 쓰세요. 채울값을 생략하면 빈칸에 #N/A가 들어갑니다. Microsoft 365 전용 함수입니다."
  },
  {
    "id": "implicit-intersection",
    "name": "암시적 교차 연산자 (@)",
    "category": "shape",
    "version": "2021",
    "weight": 2,
    "difficulty": 3,
    "syntax": "=@참조   (예: =@A2:A10, =@SEQUENCE(5), =[@보험료])",
    "summary": "수식을 값 하나로 축소(스필 방지·같은 행 값 참조)하는 암시적 교차 연산자",
    "intro": "암시적 교차 연산자 '@'는 수식이 여러 값(배열) 대신 '값 하나만' 돌려주도록 만드는 기호입니다. 참조나 함수 앞에 @를 붙이면 스필(자동 확장)을 막고 단일 값으로 축소합니다.\n\n두 가지로 동작합니다. ① 범위(예: =@A2:A10)에 쓰면 수식이 있는 '같은 행'의 값 하나를 가져옵니다(이것을 '암시적 교차'라고 합니다). 5행에 =@A2:A10을 넣으면 A5 값이 나옵니다. ② 함수 결과 같은 배열(예: =@SEQUENCE(5))에 쓰면 맨 왼쪽 위 값 하나만 남깁니다.\n\n옛 버전(2019 이하)에서 만든 '한 값만 반환하던' 수식을 새 엑셀에서 열면, 호환을 위해 엑셀이 자동으로 @를 붙여 주기도 합니다. 그래서 예전에 없던 @가 수식에 보이는 경우가 있습니다. (Excel 2021·Microsoft 365)",
    "params": [
      {
        "name": "참조",
        "required": true,
        "desc": "앞에 @를 붙일 범위·배열·함수 결과. 여러 값을 단일 값으로 축소함. 범위면 '같은 행/열' 값, 함수 결과 배열이면 '맨 왼쪽 위' 값을 반환 (예: @A2:A10, @SEQUENCE(5))"
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "스필 막고 한 값만 — @SEQUENCE",
        "formula": "=@SEQUENCE(5)",
        "result": "1 (여러 값으로 펼쳐지지 않고 배열의 맨 왼쪽 위 값 하나만 반환)",
        "explain": "SEQUENCE(5)는 원래 1~5로 펼쳐지지만, 앞에 @를 붙이면 첫 값 하나(1)만 남깁니다. 결과를 한 칸에만 두고 싶을 때 씁니다."
      },
      {
        "level": "basic",
        "title": "같은 행의 값 가져오기(암시적 교차)",
        "formula": "=@A2:A10",
        "result": "수식이 5행에 있으면 A5 값을 반환(수식과 같은 행의 셀 값 하나)",
        "explain": "범위 앞의 @는 '내 수식과 같은 행'의 값을 콕 집어 옵니다. 같은 행이 겹치지 않으면 #VALUE! 오류가 납니다. 예전 엑셀이 자동으로 하던 동작을 명시적으로 표현한 것입니다."
      },
      {
        "level": "advanced",
        "title": "표에서 현재 행만 계산 — [@열]",
        "formula": "=[@보험료]*0.03",
        "result": "표 계산 열에서 각 행의 보험료에 3%를 곱한 값(행마다 그 행 값만 사용)",
        "explain": "표(테이블) 안 구조적 참조에서 '@'는 '이 행'을 뜻합니다. [@보험료]는 열 전체가 아니라 지금 행의 보험료만 가리켜, 결과가 열 전체로 펼쳐지지 않게 합니다."
      },
      {
        "level": "advanced",
        "title": "옛 파일 호환 — 자동으로 붙는 @",
        "formula": "=@B:B*0.1",
        "result": "B열 전체가 아니라 수식과 같은 행의 B값 하나에만 0.1을 곱한 값",
        "explain": "2019 이하에서 '=B:B*0.1'처럼 열 전체를 한 셀에 쓰면 같은 행 값만 쓰이는 '암시적 교차'가 일어났습니다. 새 엑셀은 이 옛 수식을 열면 동작을 유지하려 자동으로 @를 붙여 =@B:B*0.1로 바꿉니다."
      }
    ],
    "related": [
      "스필 범위 연산자 (#)",
      "SEQUENCE",
      "FILTER",
      "INDEX"
    ],
    "tips": "@는 편의 기능이므로, 진짜 여러 값이 필요하면 붙이지 마세요. 함수 결과 배열엔 '맨 왼쪽 위 값', 범위엔 '같은 행/열 값'으로 서로 다르게 동작하니 주의합니다. 새로 만드는 수식에서 일부러 @를 넣는 경우는 드물고, 대부분 스필을 의도적으로 막거나 옛 파일 호환 때 나타납니다. 표의 [@열] 표기도 '이 행'을 뜻하는 같은 계열입니다."
  },
  {
    "id": "countif",
    "name": "COUNTIF",
    "category": "logic",
    "version": "all",
    "weight": 5,
    "difficulty": 2,
    "syntax": "=COUNTIF(범위, 조건)",
    "summary": "한 가지 조건에 맞는 셀이 몇 개인지 센다",
    "intro": "COUNTIF는 '조건에 맞는 셀이 몇 개인지 세는' 함수입니다. 값을 더하는 SUMIF의 '개수 세기' 버전이라고 보면 됩니다.\n\n예를 들어 상품이 '자동차'인 계약이 몇 건인지, 청구액이 100만 원 이상인 건이 몇 개인지 한 번에 셀 수 있습니다. 조건은 값('자동차'), 크기 비교('>=1000000'), 이름의 일부(와일드카드 '김*') 등으로 줄 수 있습니다.\n\n인수는 두 개로 아주 단순합니다. 개수를 셀 범위와 그 기준이 되는 조건입니다. 실무에서는 단순 집계뿐 아니라 '이 값이 명단에 있는가(존재 확인)'나 '중복이 있는가(개수가 1보다 큰가)' 같은 점검에도 많이 씁니다. 조건이 두 개 이상이면 COUNTIFS를 씁니다.",
    "params": [
      {
        "name": "범위",
        "required": true,
        "desc": "개수를 셀 대상 셀 범위. 예: 상품명이 든 B열, 청구액이 든 C열."
      },
      {
        "name": "조건",
        "required": true,
        "desc": "셀 수 기준. 값(\"자동차\"), 비교식(\">=60\", \"<>\"), 와일드카드(\"김*\", \"*상해*\")를 쓸 수 있다. 빈 셀은 \"\", 비어있지 않은 셀은 \"<>\"로 센다. 대소문자는 구분하지 않는다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "COUNTIF — 값 개수 세기",
        "formula": "=COUNTIF(B2:B100, \"자동차\")",
        "result": "B열에서 \"자동차\"인 셀의 개수(계약 건수)",
        "explain": "조건에 맞는 셀이 몇 개인지 센다. 상품이 자동차인 계약이 몇 건인지 바로 알 수 있다."
      },
      {
        "level": "basic",
        "title": "COUNTIF — 크기 조건으로 세기",
        "formula": "=COUNTIF(C2:C100, \">=1000000\")",
        "result": "청구액이 100만 이상인 건수",
        "explain": "비교식을 따옴표 안에 넣으면 크기 조건으로 셀 수 있다. 고액 청구 건수를 세는 예이다."
      },
      {
        "level": "advanced",
        "title": "중복 확인",
        "formula": "=COUNTIF($A$2:$A$100, A2)>1",
        "result": "같은 증권번호가 2개 이상이면 TRUE(중복), 하나뿐이면 FALSE",
        "explain": "전체 범위에서 현재 값 A2가 몇 번 나오는지 세어 1보다 크면 중복이다. 조건부 서식과 함께 중복 찾기에 자주 쓴다."
      },
      {
        "level": "advanced",
        "title": "명단에 있는지(존재 확인)",
        "formula": "=IF(COUNTIF($F$2:$F$50, A2), \"확인대상\", \"정상\")",
        "result": "A2가 F열 명단에 있으면 \"확인대상\", 없으면 \"정상\"",
        "explain": "COUNTIF 결과가 0(없음)이면 IF가 거짓으로 본다. 블랙리스트·특정 명단에 포함되는지 점검할 때 쓰는 관용 표현이다."
      },
      {
        "level": "advanced",
        "title": "와일드카드 + 셀 참조로 포함 검색",
        "formula": "=COUNTIF(B2:B100, \"*\"&F1&\"*\")",
        "result": "상품명에 F1의 글자가 들어간 건수",
        "explain": "F1에 \"상해\"를 넣으면 \"*상해*\"가 되어 상해가 포함된 상품 수를 센다. 검색어를 셀로 바꿔 재사용할 수 있다."
      },
      {
        "level": "advanced",
        "title": "비율(합격률·달성률) 계산",
        "formula": "=COUNTIF(C2:C100, \">=60\") / COUNT(C2:C100)",
        "result": "60 이상인 건의 비율(예: 0.72 → 72%)",
        "explain": "조건을 만족한 개수를 전체 개수로 나누면 비율이 된다. 합격률·달성률 같은 지표를 낼 때 쓴다."
      }
    ],
    "related": [
      "COUNTIFS",
      "SUMIF",
      "COUNTA",
      "COUNT",
      "COUNTBLANK"
    ],
    "tips": "조건은 대소문자를 구분하지 않으며 와일드카드 *(임의 문자열)·?(임의 한 글자)를 쓸 수 있다. 실제 * 나 ? 글자를 찾으려면 ~*, ~? 로 쓴다. 숫자 크기 비교는 \">=60\"처럼 따옴표 안에, 셀 참조와 함께 쓸 때는 \">=\"&F1 로 이어 붙인다. 빈 셀은 \"\", 비어있지 않은 셀은 \"<>\"로 세며, 조건이 두 개 이상이면 COUNTIFS를 쓴다."
  },
  {
    "id": "countifs",
    "name": "COUNTIFS",
    "category": "logic",
    "version": "all",
    "weight": 5,
    "difficulty": 2,
    "syntax": "=COUNTIFS(조건범위1, 조건1, [조건범위2, 조건2], …)",
    "summary": "여러 조건을 모두 만족하는(AND) 셀의 개수를 셉니다.",
    "intro": "COUNTIFS는 '이 조건도 맞고 저 조건도 맞는' 데이터가 몇 건인지 세어 주는 함수입니다. 예를 들어 '자동차 상품이면서 보험료가 100만 원을 넘는 계약이 몇 건일까?' 같은 질문에 한 줄로 답할 수 있습니다.\n\n조건이 하나뿐이라면 COUNTIF(단수)를, 조건이 둘 이상이라면 COUNTIFS(복수, 끝에 S)를 씁니다. 조건을 여러 개 적으면 그 조건들을 전부 만족하는 셀만 세므로 '그리고(AND)' 개념이 됩니다.\n\n조건은 \"자동차\"처럼 정확히 같은 값, \">1000000\"처럼 크기 비교, \"*생명*\"처럼 일부만 일치(와일드카드)를 모두 쓸 수 있습니다. 조건에 비교나 별표를 쓸 때는 반드시 큰따옴표로 감쌉니다.",
    "params": [
      {
        "name": "조건범위1",
        "required": true,
        "desc": "첫 번째 조건을 검사할 셀 범위(예: 상품명이 들어 있는 열)."
      },
      {
        "name": "조건1",
        "required": true,
        "desc": "조건범위1에서 찾을 기준. \"자동차\"처럼 값, \">100\"처럼 비교, \"*생명*\"처럼 와일드카드 가능(큰따옴표로 감쌈)."
      },
      {
        "name": "조건범위2",
        "required": false,
        "desc": "두 번째로 검사할 셀 범위. 조건범위1과 크기(행 수)가 같아야 함."
      },
      {
        "name": "조건2",
        "required": false,
        "desc": "조건범위2에 적용할 기준. 이런 (범위, 조건) 짝을 최대 127쌍까지 이어 붙일 수 있음."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "한 가지 조건으로 세기",
        "formula": "=COUNTIFS(C2:C100, \"자동차\")",
        "result": "C열(상품)이 '자동차'인 계약 건수(예: 37)",
        "explain": "가장 단순한 사용입니다. 상품명이 적힌 C열에서 '자동차'와 정확히 같은 셀이 몇 개인지 셉니다. 조건이 하나뿐이라 COUNTIF와 결과가 같습니다."
      },
      {
        "level": "basic",
        "title": "두 조건을 모두 만족하는 건수",
        "formula": "=COUNTIFS(C2:C100, \"자동차\", D2:D100, \">1000000\")",
        "result": "상품이 '자동차'이면서 보험료(D열)가 100만 원 초과인 계약 건수",
        "explain": "조건을 (범위, 기준) 짝으로 나란히 적으면 둘 다 만족하는 건수만 셉니다. 크기 비교는 \">1000000\"처럼 부등호와 숫자를 큰따옴표 안에 함께 넣습니다."
      },
      {
        "level": "advanced",
        "title": "날짜 구간 + 셀 값으로 임계값 지정",
        "formula": "=COUNTIFS(B2:B100, \">=\"&F1, B2:B100, \"<=\"&F2, C2:C100, \"자동차\")",
        "result": "가입일(B열)이 F1~F2 사이이면서 상품이 자동차인 계약 건수",
        "explain": "같은 열(B)을 두 번 써서 '이상'과 '이하'를 걸면 기간 필터가 됩니다. 셀 F1의 값을 조건에 넣을 때는 부등호 문자열과 셀을 &로 이어 붙입니다(\">=\"&F1). F1, F2만 바꾸면 기간을 바로 바꿀 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "와일드카드 부분일치 + 스필로 상품별 건수표 자동 생성",
        "formula": "=COUNTIFS($C$2:$C$100, H2#)",
        "result": "H2#(UNIQUE 등으로 뽑은 상품 목록)의 각 상품별 건수가 세로로 자동 채워짐(스필 배열)",
        "explain": "H2에 =UNIQUE(C2:C100) 같은 스필 수식이 있으면 H2#는 그 결과 전체를 가리킵니다. 조건 자리에 H2#를 넣으면 상품 종류마다 건수를 한 번에 계산해 표가 스스로 늘고 줄어듭니다. 부분일치가 필요하면 조건에 \"*생명*\"처럼 별표를 써서 '생명'이 포함된 모든 상품을 셀 수도 있습니다."
      }
    ],
    "tips": "모든 조건범위는 행 수(크기)가 같아야 하며, 다르면 #VALUE! 오류가 납니다. 조건에 셀 값을 넣을 때는 \">\"&A1처럼 연산자만 따옴표로 감싸고 셀은 &로 잇습니다. 물음표(?)는 한 글자, 별표(*)는 임의 길이 문자를 뜻하며, 별표 자체를 찾으려면 ~*처럼 물결(~)을 앞에 붙입니다. 빈 셀을 세려면 \"=\", 값이 있는 셀은 \"<>\"를 조건으로 씁니다.",
    "related": [
      "COUNTIF",
      "SUMIFS",
      "AVERAGEIFS",
      "COUNTA"
    ]
  },
  {
    "id": "if",
    "name": "IF",
    "category": "logic",
    "version": "all",
    "weight": 5,
    "difficulty": 2,
    "syntax": "=IF(조건, 참일_때_값, [거짓일_때_값])",
    "summary": "조건이 맞으면 A, 아니면 B를 돌려주는 가장 기본적인 판단 함수.",
    "intro": "IF는 '만약 ~라면 A, 아니면 B'라는 판단을 엑셀이 대신 해 주는 함수입니다. 사람이 '점수가 60점 이상이면 합격, 아니면 불합격'이라고 생각하는 방식을 그대로 수식으로 옮긴 것이라고 보면 됩니다.\n\n첫 번째 칸(조건)에는 참(TRUE)이나 거짓(FALSE)으로 판가름 나는 비교식을 넣습니다. 예를 들어 A2>=60 처럼요. 조건이 참이면 두 번째 값을, 거짓이면 세 번째 값을 돌려줍니다.\n\n세 번째 값(거짓일 때)은 생략할 수 있는데, 생략하면 조건이 거짓일 때 FALSE가 나옵니다. 그래서 보통은 두 경우를 모두 채워서 씁니다. 조건이 여러 갈래로 나뉠 때는 IF 안에 IF를 넣어(중첩) 쓰기도 하지만, 너무 깊어지면 IFS나 SWITCH가 더 읽기 편합니다.",
    "params": [
      {
        "name": "조건",
        "required": true,
        "desc": "참·거짓으로 판정되는 비교식이나 논리값. 예: A2>=60, B2=\"완료\""
      },
      {
        "name": "참일_때_값",
        "required": true,
        "desc": "조건이 참(TRUE)일 때 돌려줄 값이나 수식"
      },
      {
        "name": "거짓일_때_값",
        "required": false,
        "desc": "조건이 거짓(FALSE)일 때 돌려줄 값. 생략하면 FALSE가 반환됨"
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "점수로 합격·불합격 판정",
        "formula": "=IF(A2>=60, \"합격\", \"불합격\")",
        "result": "A2가 60 이상이면 \"합격\", 아니면 \"불합격\"",
        "explain": "가장 기본형입니다. A2 값이 60 이상인지 보고, 맞으면 합격, 아니면 불합격 글자를 표시합니다. 첫 IF 실행에 딱 좋은 형태입니다."
      },
      {
        "level": "basic",
        "title": "고액 청구 한눈에 표시하기",
        "formula": "=IF(C2>=1000000, \"고액\", \"일반\")",
        "result": "청구액 C2가 100만원 이상이면 \"고액\", 아니면 \"일반\"",
        "explain": "보험 청구액 열에서 100만원 이상을 '고액'으로 표시하는 실무 패턴입니다. 비교 결과에 따라 라벨만 붙여 줍니다."
      },
      {
        "level": "advanced",
        "title": "IF 중첩으로 3단계 등급 매기기",
        "formula": "=IF(A2>=90, \"A\", IF(A2>=70, \"B\", \"C\"))",
        "result": "90 이상 \"A\", 70~89 \"B\", 그 미만 \"C\"",
        "explain": "조건이 세 갈래일 때 '거짓일 때 값' 자리에 또 다른 IF를 넣습니다. 위에서부터 순서대로 걸러지므로 큰 기준부터 씁니다. 갈래가 더 많아지면 IFS가 읽기 쉽습니다."
      },
      {
        "level": "advanced",
        "title": "여러 조건을 동시에 만족할 때 (AND 결합)",
        "formula": "=IF(AND(B2=\"자동차\", C2>=3000000), \"정밀심사\", \"일반심사\")",
        "result": "상품이 자동차이면서 청구액이 300만원 이상일 때만 \"정밀심사\"",
        "explain": "조건 두 개를 모두 만족해야 할 때는 AND로 묶고, 둘 중 하나만이면 OR을 씁니다. IF의 조건 칸에는 참·거짓을 내는 어떤 식이든 넣을 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "조건에 맞는 값만 골라 합산하기 (배열 IF, 스필)",
        "formula": "=SUM(IF(product=\"자동차\", claim_amt))",
        "result": "product가 \"자동차\"인 행의 claim_amt만 더한 합계",
        "explain": "최신 엑셀(365/2021)에서는 IF가 열 전체를 한꺼번에 받아, 조건에 맞지 않는 칸은 FALSE로 두고 SUM이 그 논리값을 무시해 맞는 값만 더합니다. 간단한 조건 합계는 SUMIF가 편하지만, IF의 '조건별 선택'을 배열로 확장한 좋은 예입니다."
      }
    ],
    "related": [
      "IFS",
      "SWITCH",
      "IFERROR",
      "AND",
      "OR"
    ],
    "tips": "조건이 3갈래 이상이면 IF를 겹겹이 쌓기보다 IFS·SWITCH가 읽고 고치기 쉽습니다. '거짓일 때 값'을 비워 두면 결과가 FALSE로 나오니, 빈 칸을 원하면 \"\"(빈 문자열)를 넣으세요."
  },
  {
    "id": "iferror",
    "name": "IFERROR · IFNA",
    "category": "logic",
    "version": "all",
    "weight": 5,
    "difficulty": 2,
    "syntax": "=IFERROR(검사할_값, 오류일_때_값)   ·   =IFNA(검사할_값, N/A일_때_값)",
    "summary": "수식이 오류를 내면 대신 보여줄 값을 지정하는 오류 처리 함수(IFNA는 #N/A만).",
    "intro": "IFERROR는 수식이 오류(#DIV/0!, #N/A, #VALUE! 등)를 냈을 때 빨간 오류 대신 지정한 값을 보여 주는 함수입니다. 나눗셈에서 0으로 나누거나, 찾는 값이 표에 없거나 할 때 화면이 오류로 지저분해지는 것을 깔끔하게 막아 줍니다.\n\n사용법은 간단합니다. 원래 쓰려던 수식을 첫 칸에 넣고, 두 번째 칸에 '오류가 나면 대신 보여줄 값'을 넣습니다. 오류가 없으면 원래 계산 결과가 그대로 나오고, 오류가 나야만 대체 값이 나옵니다.\n\nIFNA는 IFERROR와 똑같이 생겼지만 오직 #N/A 오류만 잡아 줍니다. VLOOKUP·XLOOKUP·MATCH에서 '찾는 값이 없음'을 뜻하는 #N/A만 처리하고, 그 밖의 진짜 오류(#REF!, #VALUE! 등)는 일부러 드러내고 싶을 때 IFNA를 씁니다. IFERROR는 2007, IFNA는 2013부터 쓸 수 있습니다.\n\n한 가지 주의할 점: IFERROR는 모든 오류를 덮어 버리기 때문에, 수식에 숨은 진짜 실수(잘못된 참조 등)까지 가려 버릴 수 있습니다. 그래서 '찾기 실패'만 처리하려면 IFERROR보다 IFNA가 더 안전합니다.",
    "params": [
      {
        "name": "검사할_값",
        "required": true,
        "desc": "원래 계산하려던 수식이나 값. 오류가 없으면 이 결과가 그대로 나옴"
      },
      {
        "name": "오류일_때_값",
        "required": true,
        "desc": "검사할_값이 오류일 때 대신 보여줄 값(IFERROR는 모든 오류, IFNA는 #N/A만 잡음)"
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "0으로 나눌 때 오류 감추기",
        "formula": "=IFERROR(B2/C2, 0)",
        "result": "C2가 0이 아니면 나눗셈 결과, C2가 0이면 0",
        "explain": "C2가 0이면 B2/C2는 #DIV/0! 오류가 납니다. IFERROR로 감싸면 오류 대신 0을 보여 주어 표가 깔끔해집니다. 0 대신 \"\"(빈칸)이나 \"-\"를 넣어도 됩니다."
      },
      {
        "level": "basic",
        "title": "찾는 값이 없을 때 안내 문구 보이기",
        "formula": "=IFERROR(VLOOKUP(A2, 상품표, 2, 0), \"미등록\")",
        "result": "상품표에서 A2를 찾으면 그 값, 못 찾으면 \"미등록\"",
        "explain": "VLOOKUP은 값을 못 찾으면 #N/A를 냅니다. IFERROR로 감싸 \"미등록\" 같은 사람이 읽기 쉬운 문구로 바꿉니다. 조회 수식의 단짝 패턴입니다."
      },
      {
        "level": "advanced",
        "title": "찾기 실패만 처리하고 진짜 오류는 남기기 (IFNA)",
        "formula": "=IFNA(VLOOKUP(A2, 상품표, 2, 0), \"미등록\")",
        "result": "못 찾으면 \"미등록\", 그러나 열 번호 오류(#REF!)나 형식 오류(#VALUE!)는 그대로 표시",
        "explain": "IFERROR 대신 IFNA를 쓰면 '값 없음(#N/A)'만 \"미등록\"으로 바꾸고, 수식 자체의 실수는 가리지 않고 드러냅니다. 덕분에 진짜 버그를 놓치지 않습니다."
      },
      {
        "level": "advanced",
        "title": "여러 표를 순서대로 찾기 (IFERROR 연쇄)",
        "formula": "=IFERROR(VLOOKUP(A2, 표1, 2, 0), IFERROR(VLOOKUP(A2, 표2, 2, 0), \"없음\"))",
        "result": "표1에서 찾고, 없으면 표2에서 찾고, 그래도 없으면 \"없음\"",
        "explain": "'오류일 때 값' 자리에 또 다른 조회 수식을 넣어, 첫 표에서 실패하면 다음 표로 넘어가게 만드는 방법입니다. IFERROR를 겹쳐 여러 후보 표를 차례로 뒤집니다."
      },
      {
        "level": "advanced",
        "title": "배열 계산에서 오류 난 칸만 대체하기 (스필)",
        "formula": "=IFERROR(claim_amt / policy_cnt, 0)",
        "result": "두 열을 나눈 결과 배열이 한 번에 채워지되, 0으로 나뉜 칸만 0",
        "explain": "최신 엑셀(365/2021)에서는 두 열을 통째로 나누면 결과가 자동으로 스필됩니다. IFERROR로 감싸면 그 배열 안에서 오류가 난 칸만 골라 0으로 바꿔 주므로, 셀마다 일일이 감쌀 필요가 없습니다."
      }
    ],
    "related": [
      "IFNA",
      "IF",
      "IFS",
      "VLOOKUP",
      "XLOOKUP",
      "ISERROR"
    ],
    "tips": "IFERROR는 모든 오류를 덮으므로 숨은 실수까지 가릴 수 있습니다. 조회 '값 없음'만 처리할 땐 #N/A만 잡는 IFNA가 안전합니다. 참고로 XLOOKUP은 [없을때] 인수가 기본 내장되어 있어 굳이 IFERROR로 감쌀 필요가 없습니다. 오류를 아예 안 보이게만 하려면 두 번째 값에 \"\"(빈 문자열)를 넣으세요."
  },
  {
    "id": "sumif",
    "name": "SUMIF",
    "category": "logic",
    "version": "all",
    "weight": 5,
    "difficulty": 2,
    "syntax": "=SUMIF(조건범위, 조건, [합계범위])",
    "summary": "한 가지 조건에 맞는 행의 값만 골라서 더한다",
    "intro": "SUMIF는 '조건에 맞는 값만 골라서 더하는' 함수입니다. 전부 더하는 SUM과 달리, 먼저 조건을 검사해 통과한 행의 숫자만 합산합니다.\n\n예를 들어 상품별로 보험료를 더하고 싶다면, 상품명이 적힌 열에서 '자동차'인 행만 찾아 그 보험료를 합할 수 있습니다. 조건은 값('자동차'), 크기 비교('>=1000000'), 이름의 일부(와일드카드 '김*') 등 다양하게 줄 수 있습니다.\n\n인수는 세 개입니다. 조건을 검사할 범위, 그 기준이 되는 조건, 그리고 실제로 더할 범위입니다. 조건을 검사하는 열과 더하는 열이 같다면 세 번째(합계범위)는 생략할 수 있습니다. 조건이 두 개 이상이면 SUMIFS를 씁니다.",
    "params": [
      {
        "name": "조건범위",
        "required": true,
        "desc": "조건을 검사할 셀 범위. 예: 상품명이 든 B열, 청구액이 든 D열."
      },
      {
        "name": "조건",
        "required": true,
        "desc": "더할 대상을 고르는 기준. 값(\"자동차\"), 비교식(\">=1000000\", \"<>해지\"), 와일드카드(\"김*\", \"*상해*\")를 쓸 수 있다. 대소문자는 구분하지 않는다."
      },
      {
        "name": "합계범위",
        "required": false,
        "desc": "실제로 더할 값이 든 범위. 생략하면 조건범위 자체를 더한다. 지정할 때는 조건범위와 크기·모양이 같아야 한다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "SUMIF — 상품별 합계",
        "formula": "=SUMIF(B2:B100, \"자동차\", D2:D100)",
        "result": "상품명(B열)이 \"자동차\"인 행의 보험료(D열) 합계",
        "explain": "B열에서 \"자동차\"를 찾아 같은 행의 D열 값만 더한다. 조건을 검사하는 범위(B)와 실제로 더하는 범위(D)를 따로 지정한다."
      },
      {
        "level": "basic",
        "title": "SUMIF — 합계범위 생략(자기 자신 합)",
        "formula": "=SUMIF(D2:D100, \">=1000000\")",
        "result": "D열 값 중 100만 이상인 것들의 합",
        "explain": "조건을 검사하는 열과 더할 열이 같으면 세 번째 인수를 생략한다. 여기서는 D열에서 100만 이상인 값만 골라 더한다."
      },
      {
        "level": "advanced",
        "title": "셀 참조로 기준을 동적으로",
        "formula": "=SUMIF(C2:C100, \">=\"&F1, D2:D100)",
        "result": "C열 값이 F1 이상인 행의 D열 합계",
        "explain": "비교연산자 \">=\"와 셀 값을 &로 이어 붙이면 기준을 셀로 바꿀 수 있다. F1 숫자만 고치면 합계가 자동으로 다시 계산된다."
      },
      {
        "level": "advanced",
        "title": "와일드카드 — 이름의 일부로 합산",
        "formula": "=SUMIF(B2:B100, \"*상해*\", D2:D100)",
        "result": "상품명에 \"상해\"가 들어간 모든 행의 D열 합",
        "explain": "*는 임의의 문자열을 뜻한다. 상품명이 정확히 일치하지 않아도 \"상해\"라는 글자를 포함하면 모두 더한다."
      },
      {
        "level": "advanced",
        "title": "절대참조로 요약표 만들기",
        "formula": "=SUMIF($B$2:$B$100, F2, $D$2:$D$100)",
        "result": "F2에 적힌 상품의 보험료 합계(아래로 복사하면 상품별 합계표)",
        "explain": "데이터 범위를 $로 고정하고 조건만 F2로 두면, 수식을 아래로 복사할 때 F3·F4… 상품마다 합계가 자동으로 채워진다. 간단한 요약표를 만들 때 쓴다."
      }
    ],
    "related": [
      "SUMIFS",
      "COUNTIF",
      "AVERAGEIF",
      "SUMPRODUCT"
    ],
    "tips": "조건범위와 합계범위는 크기·모양이 같아야 한다(같은 행끼리 대응). 다르면 엉뚱한 값이 더해질 수 있다. 텍스트 조건은 \"\" 안에 넣고, 비교연산자와 셀 참조를 함께 쓸 때는 \">=\"&A1처럼 &로 이어 붙인다. 대소문자는 구분하지 않으며, 조건이 두 개 이상이면 SUMIFS를 사용한다."
  },
  {
    "id": "sumifs",
    "name": "SUMIFS",
    "category": "logic",
    "version": "all",
    "weight": 5,
    "difficulty": 3,
    "syntax": "=SUMIFS(합계범위, 조건범위1, 조건1, [조건범위2, 조건2], …)",
    "summary": "여러 조건을 모두(AND) 만족하는 행의 값만 더한다",
    "intro": "SUMIFS는 SUMIF의 확장판으로, '여러 조건을 모두 만족하는' 값만 더하는 함수입니다. 조건이 하나면 SUMIF, 두 개 이상이면 SUMIFS라고 기억하면 쉽습니다.\n\n예를 들어 '상품이 자동차이면서 지역이 서울'인 계약의 보험료만 더하거나, '2026년 1분기 동안' 접수된 청구액만 더하는 식으로 조건을 여러 개 겹쳐 걸 수 있습니다. 걸어 준 조건은 모두 AND로 이어져 전부 맞아야 합산 대상이 됩니다.\n\n가장 흔한 실수는 인수 순서입니다. SUMIF는 '조건범위'가 맨 앞이지만, SUMIFS는 '더할 범위(합계범위)'가 맨 앞에 오고 그 뒤로 조건범위·조건이 쌍으로 이어집니다. 조건은 최대 127쌍까지 넣을 수 있습니다.",
    "params": [
      {
        "name": "합계범위",
        "required": true,
        "desc": "실제로 더할 값이 든 범위. SUMIF와 달리 맨 앞에 온다. 모든 조건범위와 크기·모양이 같아야 한다."
      },
      {
        "name": "조건범위1",
        "required": true,
        "desc": "첫 번째 조건을 검사할 셀 범위. 예: 상품명이 든 B열."
      },
      {
        "name": "조건1",
        "required": true,
        "desc": "첫 번째 기준. 값(\"자동차\"), 비교식(\">=1000000\"), 와일드카드(\"*상해*\")를 쓸 수 있다."
      },
      {
        "name": "조건범위2, 조건2, …",
        "required": false,
        "desc": "추가 조건 쌍. 최대 127쌍까지 이어 붙일 수 있고, 모든 조건은 AND(모두 만족)로 결합된다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "SUMIFS — 두 조건 모두 만족",
        "formula": "=SUMIFS(E2:E100, B2:B100, \"자동차\", C2:C100, \"서울\")",
        "result": "상품=자동차 이면서 지역=서울인 행의 보험료(E열) 합",
        "explain": "더할 범위(E)를 맨 앞에 두고 뒤에 조건범위·조건을 쌍으로 이어 붙인다. 두 조건을 모두 만족한 행만 합산된다."
      },
      {
        "level": "basic",
        "title": "SUMIFS — 상품+사유 조건",
        "formula": "=SUMIFS(D2:D100, A2:A100, \"실손\", C2:C100, \"입원\")",
        "result": "상품이 실손이고 사유가 입원인 청구액(D열) 합",
        "explain": "조건이 두 개이므로 SUMIF 대신 SUMIFS를 쓴다. 두 조건은 AND로 이어져 둘 다 맞아야 더해진다."
      },
      {
        "level": "advanced",
        "title": "날짜 구간(사이) 합계",
        "formula": "=SUMIFS(D2:D100, A2:A100, \">=\"&DATE(2026,1,1), A2:A100, \"<=\"&DATE(2026,3,31))",
        "result": "접수일(A열)이 2026-01-01 ~ 03-31 사이인 청구액 합",
        "explain": "같은 날짜 범위(A열)에 '이상(>=)'과 '이하(<=)' 두 조건을 걸면 '구간 사이'가 된다. 1분기 청구액 합계를 구하는 전형적인 방법이다."
      },
      {
        "level": "advanced",
        "title": "교차 요약표(행·열 조건)",
        "formula": "=SUMIFS($E$2:$E$100, $B$2:$B$100, $G2, $C$2:$C$100, H$1)",
        "result": "G열 상품 × 1행 지역이 교차하는 칸마다 해당 합계(피벗형 표)",
        "explain": "행 기준($G2)과 열 기준(H$1)의 참조 고정을 다르게 주면, 수식 하나를 표 전체에 복사해 상품×지역 교차 합계표를 만들 수 있다."
      },
      {
        "level": "advanced",
        "title": "고유값별 합계를 한 번에 스필(365)",
        "formula": "=SUMIFS(E2:E100, B2:B100, UNIQUE(B2:B100))",
        "result": "상품 종류마다의 합계가 세로로 자동으로 펼쳐짐(스필)",
        "explain": "조건 자리에 UNIQUE로 뽑은 상품 목록(배열)을 넣으면 상품별 합계가 한 수식으로 아래로 펼쳐진다. UNIQUE·스필은 Microsoft 365·엑셀 2021에서만 동작한다."
      }
    ],
    "related": [
      "SUMIF",
      "COUNTIFS",
      "AVERAGEIFS",
      "MAXIFS",
      "SUMPRODUCT"
    ],
    "tips": "인수 순서 주의: SUMIFS는 합계범위가 맨 앞, SUMIF는 조건범위가 맨 앞이다(가장 흔한 실수). 모든 조건범위는 합계범위와 크기·모양이 같아야 한다. 조건들은 AND(모두 만족)로만 묶이므로, OR로 합치려면 SUMIFS 여러 개를 더하거나 SUMPRODUCT를 쓴다. '구간 사이'는 같은 범위에 >= 와 <= 두 조건을 준다."
  },
  {
    "id": "and-or-not",
    "name": "AND · OR · NOT",
    "category": "logic",
    "version": "all",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=AND(논리식1, [논리식2], …) · =OR(논리식1, [논리식2], …) · =NOT(논리식)",
    "summary": "여러 조건을 모두 만족(AND)·하나라도 만족(OR)·결과를 반대로(NOT) 판정하는 기본 논리 함수",
    "intro": "엑셀에서 '조건이 맞는가?'를 판단하면 참(TRUE) 또는 거짓(FALSE), 두 값 중 하나가 나옵니다. AND·OR·NOT은 이런 참·거짓을 서로 조합하거나 뒤집는 세 개의 기본 논리 함수입니다.\n\nAND는 넣은 조건이 '모두' 맞아야 TRUE가 됩니다(하나라도 틀리면 FALSE). OR는 조건 중 '하나라도' 맞으면 TRUE가 됩니다(전부 틀려야 FALSE). NOT은 조건 하나를 받아 결과를 반대로 뒤집습니다(TRUE→FALSE, FALSE→TRUE).\n\n세 함수는 혼자 쓰기보다 주로 IF 함수 안에 넣어 '여러 조건을 동시에/하나라도/반대로 만족할 때 이렇게 하라'는 식으로 사용합니다. 예를 들어 '나이가 18세 이상이고 65세 이하'처럼 조건 두 개를 함께 걸 때 AND를 씁니다.",
    "params": [
      {
        "name": "논리식1",
        "required": true,
        "desc": "참(TRUE)/거짓(FALSE)으로 판정되는 첫 번째 조건. 예: B2=\"남\", C2>=25. AND·OR·NOT에 공통이며, NOT은 이 하나만 받는다."
      },
      {
        "name": "논리식2, …",
        "required": false,
        "desc": "AND·OR에 이어서 넣는 추가 조건. 최대 255개까지 나열할 수 있다(NOT에는 없음). 값 하나만 넣으면 0은 FALSE, 0이 아닌 값은 TRUE로 본다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "AND — 두 조건 모두 만족",
        "formula": "=AND(B2>=18, B2<=65)",
        "result": "두 조건이 다 맞으면 TRUE, 하나라도 틀리면 FALSE",
        "explain": "B2의 나이가 18세 이상이면서 동시에 65세 이하일 때만 TRUE. 가입 가능 연령대(18~65세) 안에 드는지 한 번에 확인한다."
      },
      {
        "level": "basic",
        "title": "OR — 하나라도 만족",
        "formula": "=OR(C2=\"암\", C2=\"뇌졸중\", C2=\"급성심근경색\")",
        "result": "셋 중 하나라도 해당하면 TRUE, 모두 아니면 FALSE",
        "explain": "진단명 C2가 3대 질병 중 어느 하나에만 해당해도 TRUE. 여러 값 중 하나에 속하는지 볼 때 쓴다."
      },
      {
        "level": "basic",
        "title": "NOT — 결과를 반대로",
        "formula": "=NOT(B2=\"해지\")",
        "result": "해지가 아니면 TRUE, 해지면 FALSE",
        "explain": "B2가 \"해지\"이면 FALSE, 그 외에는 TRUE로 뒤집는다. NOT(B2=\"해지\")는 비교식 B2<>\"해지\"와 같은 뜻이다."
      },
      {
        "level": "advanced",
        "title": "IF + AND — 다중 조건 분류",
        "formula": "=IF(AND(D2>=1000000, E2=\"입원\"), \"고액입원심사\", \"일반\")",
        "result": "두 조건을 다 만족한 행만 \"고액입원심사\", 나머지는 \"일반\"",
        "explain": "청구액 D2가 100만 원 이상이고 사유 E2가 \"입원\"인 건만 별도 심사 대상으로 표시. IF의 조건 자리에 AND를 넣어 조건 두 개를 함께 건다."
      },
      {
        "level": "advanced",
        "title": "IF + OR — 여러 값 중 하나면 그룹으로",
        "formula": "=IF(OR(E2=\"암\", E2=\"뇌혈관\", E2=\"심장\"), \"3대질병\", \"기타\")",
        "result": "세 값 중 하나면 \"3대질병\", 아니면 \"기타\"",
        "explain": "담보 E2가 세 값 중 하나라도 맞으면 3대질병군으로 묶는다. 나열식 OR로 분류 그룹을 만들 때 쓴다."
      },
      {
        "level": "advanced",
        "title": "AND로 범위 전체를 한 번에 검사",
        "formula": "=AND(C2:C13>=0)",
        "result": "C2:C13 값이 모두 0 이상이면 TRUE, 하나라도 음수면 FALSE",
        "explain": "범위를 통째로 넣으면 AND가 모든 셀을 한 번에 검사한다. 청구액 열에 음수(입력 오류)가 하나도 없는지 점검할 때 유용하다. (엑셀 2019 이하에서는 Ctrl+Shift+Enter 배열 입력이 필요할 수 있다.)"
      }
    ],
    "related": [
      "IF",
      "IFS",
      "XOR",
      "IFERROR"
    ],
    "tips": "AND·OR의 인수는 값이 아니라 '참/거짓으로 판정되는 식'이어야 한다(예: A2>=25). 엑셀에는 10<A2<20 같은 문법이 없으므로 AND(A2>10, A2<20)처럼 셀 참조를 반복해서 쓴다. NOT은 인수 하나만 받으며, NOT(A2=B2)는 A2<>B2와 같다. 세 함수 모두 대개 IF 안에 넣어 사용한다."
  },
  {
    "id": "averageif",
    "name": "AVERAGEIF · AVERAGEIFS",
    "category": "logic",
    "version": "all",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=AVERAGEIF(조건범위, 조건, [평균범위])  ·  =AVERAGEIFS(평균범위, 조건범위1, 조건1, [조건범위2, 조건2], …)",
    "summary": "조건에 맞는 값들만 골라 평균을 구합니다(단일=AVERAGEIF, 다중=AVERAGEIFS).",
    "intro": "전체 평균이 아니라 '조건에 맞는 것만의 평균'이 필요할 때 쓰는 함수입니다. 예를 들어 '자동차 상품의 평균 보험료'처럼, 특정 부류만 뽑아 평균을 냅니다.\n\n조건이 하나면 AVERAGEIF, 여러 개면 AVERAGEIFS(끝에 S)를 씁니다. 한 가지 주의할 점은 두 함수의 인수 순서가 반대라는 것입니다. AVERAGEIF는 (조건범위 → 조건 → 평균범위) 순서지만, AVERAGEIFS는 평균 낼 범위를 맨 앞에 먼저 적고 그 뒤에 (조건범위, 조건) 짝을 붙입니다.\n\n조건에 맞는 값이 하나도 없으면 결과가 #DIV/0! 오류가 됩니다(0으로 나눌 수 없기 때문). 이럴 때는 IFERROR로 감싸 빈칸이나 0으로 바꿔 주면 표가 깔끔해집니다.",
    "params": [
      {
        "name": "평균범위",
        "required": true,
        "desc": "AVERAGEIFS에서 맨 앞에 오는, 실제로 평균 낼 숫자 범위. (AVERAGEIF에서는 이 인수가 맨 뒤의 선택 인수)"
      },
      {
        "name": "조건범위(1)",
        "required": true,
        "desc": "조건을 검사할 셀 범위(예: 상품 열)."
      },
      {
        "name": "조건(1)",
        "required": true,
        "desc": "찾을 기준. \"자동차\", \">0\", \"*생명*\" 등(큰따옴표로 감쌈)."
      },
      {
        "name": "조건범위2 / 조건2 …",
        "required": false,
        "desc": "AVERAGEIFS에서 조건을 더 걸 때 추가하는 (범위, 조건) 짝(최대 127쌍). 모든 조건범위는 평균범위와 크기가 같아야 함."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "조건에 맞는 값의 평균 (AVERAGEIF)",
        "formula": "=AVERAGEIF(C2:C100, \"자동차\", E2:E100)",
        "result": "상품(C열)이 '자동차'인 계약들의 보험료(E열) 평균",
        "explain": "AVERAGEIF는 '어디를 보고(C열), 무엇을 찾고(자동차), 무엇을 평균 낼지(E열)' 순서로 적습니다. 조건 열과 평균 낼 열이 다를 때 세 번째 인수(평균범위)를 꼭 지정합니다."
      },
      {
        "level": "basic",
        "title": "같은 계산을 AVERAGEIFS로",
        "formula": "=AVERAGEIFS(E2:E100, C2:C100, \"자동차\")",
        "result": "위와 동일한 자동차 상품 평균 보험료",
        "explain": "AVERAGEIFS는 평균 낼 범위(E열)를 맨 앞에 먼저 적는 점이 다릅니다. 인수 순서만 바뀔 뿐 결과는 같습니다. 조건을 나중에 늘릴 계획이라면 처음부터 AVERAGEIFS로 쓰는 편이 편합니다."
      },
      {
        "level": "advanced",
        "title": "여러 조건을 만족하는 평균 청구액",
        "formula": "=AVERAGEIFS(F2:F100, C2:C100, \"자동차\", D2:D100, \"서울\", B2:B100, \">=\"&DATE(2026,1,1))",
        "result": "2026년 이후, 서울 지역, 자동차 상품 계약의 평균 청구액(F열)",
        "explain": "상품·지역·가입일 세 조건을 모두 만족하는 행만 골라 청구액 평균을 냅니다. 날짜는 DATE(2026,1,1)로 만들고 \">=\"&로 이어 붙여 '그 날짜 이후'를 표현합니다."
      },
      {
        "level": "advanced",
        "title": "일치 항목이 없을 때 오류 방지",
        "formula": "=IFERROR(AVERAGEIFS(E2:E100, C2:C100, G2, D2:D100, \"서울\"), \"해당 없음\")",
        "result": "조건에 맞는 데이터가 있으면 평균, 없으면 '해당 없음'",
        "explain": "조건에 맞는 값이 하나도 없으면 AVERAGEIFS는 #DIV/0! 오류를 냅니다. IFERROR로 감싸면 오류 대신 원하는 문구나 0을 보여 줄 수 있어, G2에 어떤 상품을 넣어도 표가 깨지지 않습니다."
      }
    ],
    "tips": "AVERAGEIF와 AVERAGEIFS는 인수 순서가 반대입니다(AVERAGEIF는 평균범위가 맨 뒤·선택, AVERAGEIFS는 맨 앞·필수). 이 차이가 가장 흔한 실수 원인입니다. 조건에 맞는 셀이 없거나 대상이 모두 빈 셀이면 #DIV/0! 오류가 나므로 IFERROR로 감싸는 습관이 좋습니다. 평균은 빈 셀·텍스트를 자동으로 제외하고 숫자만 계산합니다.",
    "related": [
      "AVERAGE",
      "SUMIFS",
      "COUNTIFS",
      "IFERROR",
      "AVERAGEA"
    ]
  },
  {
    "id": "ifs",
    "name": "IFS",
    "category": "logic",
    "version": "2019",
    "weight": 4,
    "difficulty": 2,
    "syntax": "=IFS(조건1, 값1, [조건2, 값2], …, [TRUE, 기본값])",
    "summary": "여러 조건을 위에서부터 차례로 검사해 처음 맞는 값을 돌려주는 함수(중첩 IF 대체).",
    "intro": "IFS는 조건이 여러 개일 때 IF를 겹겹이 쌓는 대신 깔끔하게 나열할 수 있게 해 주는 함수입니다. '조건1이 맞으면 값1, 아니면 조건2가 맞으면 값2…' 하는 식으로 위에서부터 차례로 검사해서, 처음으로 참이 되는 조건의 값을 돌려줍니다.\n\n조건과 값을 한 쌍씩 짝지어 계속 이어 붙이면 됩니다. 순서가 중요해서, 위에 있는 조건부터 검사하고 하나라도 맞으면 거기서 멈춥니다. 그래서 범위가 넓은 조건은 아래쪽에, 좁고 구체적인 조건은 위쪽에 두는 게 안전합니다.\n\n주의할 점은, 어떤 조건에도 맞지 않으면 #N/A 오류가 난다는 것입니다. 이를 막으려면 마지막 쌍의 조건 자리에 TRUE를 두어 '그 외 전부'에 해당하는 기본값을 넣어 줍니다. IFS는 엑셀 2019부터 쓸 수 있습니다.",
    "params": [
      {
        "name": "조건1",
        "required": true,
        "desc": "가장 먼저 검사할 참·거짓 식. 참이면 값1을 반환"
      },
      {
        "name": "값1",
        "required": true,
        "desc": "조건1이 참일 때 돌려줄 값"
      },
      {
        "name": "조건2, 값2 …",
        "required": false,
        "desc": "필요한 만큼 이어 붙이는 추가 조건·값 쌍(최대 127쌍)"
      },
      {
        "name": "TRUE, 기본값",
        "required": false,
        "desc": "맨 마지막에 두는 '그 외 전부' 쌍. 조건 자리에 TRUE를 넣어 #N/A를 방지"
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "점수로 3단계 등급 매기기",
        "formula": "=IFS(A2>=90, \"A\", A2>=70, \"B\", A2>=50, \"C\")",
        "result": "90 이상 \"A\", 70~89 \"B\", 50~69 \"C\" (49 이하는 #N/A)",
        "explain": "조건·값을 쌍으로 나열합니다. 위에서부터 검사하므로 높은 기준을 먼저 씁니다. 어디에도 안 걸리는 49 이하는 오류가 나므로 기본값 처리가 필요합니다(아래 예 참고)."
      },
      {
        "level": "basic",
        "title": "맨 끝에 '그 외' 기본값 넣기",
        "formula": "=IFS(A2>=90, \"A\", A2>=70, \"B\", TRUE, \"C 이하\")",
        "result": "90 이상 \"A\", 70~89 \"B\", 나머지 전부 \"C 이하\"",
        "explain": "마지막 쌍의 조건을 TRUE로 두면 위 조건에 하나도 안 맞은 나머지가 모두 여기로 옵니다. #N/A 오류를 막는 표준 방법입니다."
      },
      {
        "level": "advanced",
        "title": "청구액 구간별 결재 단계 자동 지정",
        "formula": "=IFS(C2>=10000000, \"임원결재\", C2>=3000000, \"팀장결재\", C2>=1000000, \"담당자검토\", TRUE, \"자동승인\")",
        "result": "1천만↑ 임원결재, 3백만~ 팀장결재, 1백만~ 담당자검토, 그 미만 자동승인",
        "explain": "금액 구간이 여러 개일 때 딱 맞는 도구입니다. 큰 금액 조건부터 위에 두어야 원하는 대로 걸러집니다. 순서를 뒤집으면 모든 값이 첫 조건에 걸려 잘못 분류됩니다."
      },
      {
        "level": "advanced",
        "title": "여러 열을 조합한 분기 (AND 결합)",
        "formula": "=IFS(AND(B2=\"자동차\", C2>=3000000), \"정밀심사\", B2=\"자동차\", \"일반심사\", TRUE, \"기타상품\")",
        "result": "자동차+고액이면 정밀심사, 자동차(그 외)면 일반심사, 나머지 상품은 기타상품",
        "explain": "각 조건 자리에 AND·OR를 넣어 여러 열을 함께 볼 수 있습니다. 좁은 조건(자동차+고액)을 위에, 넓은 조건(자동차 전체)을 아래에 두는 순서가 핵심입니다."
      },
      {
        "level": "advanced",
        "title": "조건 미충족 오류를 IFERROR로 안전하게 처리",
        "formula": "=IFERROR(IFS(A2>=90, \"A\", A2>=70, \"B\"), \"미분류\")",
        "result": "90↑ \"A\", 70~89 \"B\", 어디에도 안 맞으면 \"미분류\"",
        "explain": "마지막에 TRUE 쌍을 안 넣었다면 IFS 전체를 IFERROR로 감싸 #N/A를 대체 값으로 바꿀 수 있습니다. 다만 IFS 안에 TRUE 기본값을 두는 편이 의도가 더 분명합니다."
      }
    ],
    "related": [
      "IF",
      "SWITCH",
      "IFERROR",
      "AND",
      "OR"
    ],
    "tips": "조건은 위에서부터 순서대로 검사되고 처음 맞는 하나에서 멈춥니다. 범위가 겹치면 순서가 결과를 좌우하니 넓은 조건일수록 아래로 내리세요. 어디에도 안 맞으면 #N/A가 나므로 마지막에 TRUE 기본값을 습관처럼 넣는 것이 좋습니다."
  },
  {
    "id": "subtotal",
    "name": "SUBTOTAL",
    "category": "logic",
    "version": "all",
    "weight": 4,
    "difficulty": 3,
    "syntax": "=SUBTOTAL(함수번호, 참조1, [참조2], …)",
    "summary": "합계·평균·개수 등을 하나의 함수로 계산하되, 필터로 숨겨진 행은 자동으로 제외합니다.",
    "intro": "SUBTOTAL은 합계·평균·개수·최대·최소 같은 여러 집계를 '함수번호'만 바꿔 한 함수로 처리하는 도구입니다. 예컨대 첫 번째 인수를 9로 주면 합계, 1로 주면 평균이 됩니다.\n\n가장 큰 장점은 '필터로 걸러 낸(숨겨진) 행을 자동으로 빼고 계산'한다는 점입니다. 자동 필터로 자동차 상품만 남기면 SUBTOTAL 합계가 화면에 보이는 자동차 행만 더합니다. 그래서 일반 SUM으로는 필터를 걸어도 숨은 값까지 다 더해지는 문제를, SUBTOTAL은 깔끔하게 해결합니다.\n\n함수번호는 두 벌이 있습니다. 1~11은 '필터로 숨겨진 행'을 제외하고, 101~111은 여기에 더해 '사용자가 마우스로 직접 숨긴 행'까지 제외합니다. 또한 SUBTOTAL은 계산 범위 안에 들어 있는 다른 SUBTOTAL(소계) 셀을 알아서 무시하므로, 소계를 여러 개 두어도 총합이 이중으로 더해지지 않습니다.",
    "params": [
      {
        "name": "함수번호",
        "required": true,
        "desc": "어떤 집계를 할지 정하는 번호. 1=평균, 2=숫자개수, 3=값개수(COUNTA), 4=최대, 5=최소, 6=곱, 7=표본표준편차, 8=모표준편차, 9=합계, 10=표본분산, 11=모분산. 앞에 10을 붙인 101~111은 '직접 숨긴 행'도 함께 제외."
      },
      {
        "name": "참조1",
        "required": true,
        "desc": "집계할 셀 범위(예: 보험료가 든 열)."
      },
      {
        "name": "참조2 …",
        "required": false,
        "desc": "추가로 집계할 범위. 여러 범위를 이어서 지정할 수 있음(최대 254개)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "필터에 반응하는 합계",
        "formula": "=SUBTOTAL(9, E2:E100)",
        "result": "현재 필터로 보이는 행들의 보험료(E열) 합계",
        "explain": "함수번호 9는 합계입니다. 자동 필터로 상품을 '자동차'만 남기면 이 값이 자동으로 자동차 합계로 바뀝니다. 일반 =SUM(E2:E100)은 필터와 무관하게 전체를 더하지만, SUBTOTAL은 보이는 행만 더합니다."
      },
      {
        "level": "basic",
        "title": "보이는 데이터 건수 세기",
        "formula": "=SUBTOTAL(3, C2:C100)",
        "result": "필터 후 화면에 보이는(비어 있지 않은) 셀 개수",
        "explain": "함수번호 3은 값이 있는 셀 개수(COUNTA에 해당)입니다. 필터로 걸러진 상태에서 '지금 몇 건이 보이는지'를 셀 때 유용합니다. 숫자만 세려면 3 대신 2를 씁니다."
      },
      {
        "level": "advanced",
        "title": "필터별 평균을 실시간으로",
        "formula": "=SUBTOTAL(1, F2:F100)",
        "result": "현재 보이는 행들의 청구액(F열) 평균",
        "explain": "함수번호 1은 평균입니다. 상품·지역 등으로 필터를 바꿀 때마다 그 조건에 맞는 청구액 평균이 자동으로 다시 계산됩니다. 대시보드 요약 셀에 두면 필터 하나로 여러 지표가 함께 움직입니다."
      },
      {
        "level": "advanced",
        "title": "필터해도 1,2,3… 이어지는 일련번호 매기기",
        "formula": "=SUBTOTAL(103, $B$2:B2)",
        "result": "보이는 행에만 1부터 순서대로 붙는 번호(숨은 행은 건너뜀)",
        "explain": "2행부터 아래로 채우는 트릭입니다. 시작점($B$2)은 고정하고 끝점(B2)만 상대참조로 두면, 각 행까지의 '보이는 값 개수'가 곧 순번이 됩니다. 103은 '값 개수'이면서 직접 숨긴 행까지 제외하므로, 필터를 걸어도 번호가 1,2,3…으로 끊김 없이 이어집니다."
      }
    ],
    "tips": "함수번호 9(필터 숨김만 제외)와 109(필터 숨김 + 직접 숨긴 행 제외)의 차이를 이해해야 합니다. 자동 필터만 쓴다면 9와 109 결과가 같지만, 행을 마우스로 직접 숨겼다면 109 계열만 그 행을 뺍니다. SUBTOTAL은 같은 열 안의 다른 SUBTOTAL 셀을 자동으로 무시하므로 소계와 총계를 한 열에 함께 두어도 안전합니다. 더 많은 옵션(오류값 무시 등)이 필요하면 상위 호환 함수인 AGGREGATE를 고려하세요.",
    "related": [
      "AGGREGATE",
      "SUM",
      "SUMIFS",
      "COUNTA",
      "AVERAGE"
    ]
  },
  {
    "id": "aggregate",
    "name": "AGGREGATE",
    "category": "logic",
    "version": "all",
    "weight": 3,
    "difficulty": 4,
    "syntax": "=AGGREGATE(집계방법, 옵션, 참조1, [참조2], …)  또는  =AGGREGATE(집계방법, 옵션, 배열, [순위])",
    "summary": "오류·숨겨진 행을 건너뛰고 합계·평균·최대·순위 등 19가지 집계를 한 함수로 처리한다.",
    "intro": "AGGREGATE는 \"어떤 계산을 할지\"를 숫자 코드로 골라 쓰는 만능 집계 함수예요. SUM(합계), AVERAGE(평균), MAX(최대), LARGE(n번째 큰 값) 같은 여러 함수를 코드 하나로 바꿔서 쓸 수 있습니다.\n\nAGGREGATE가 특별한 이유는 두 번째 인수인 \"옵션\"으로 방해 요소를 무시할 수 있다는 점이에요. 예를 들어 범위 안에 #N/A, #DIV/0! 같은 오류 셀이 하나라도 있으면 보통 SUM은 통째로 오류를 내지만, AGGREGATE는 그 오류 셀만 쏙 빼고 나머지를 계산해 줍니다. 필터로 숨긴 행을 빼고 집계하는 것도 됩니다.\n\n쓰는 법은 두 부분만 기억하면 됩니다. ① 첫 번째 칸에 \"무슨 계산\"인지 번호(1~19), ② 두 번째 칸에 \"무엇을 무시\"할지 번호(0~7)를 넣고, 그다음에 데이터 범위를 씁니다. 자주 쓰는 조합은 집계방법 9(합계)·1(평균)·4(최대)와 옵션 6(오류 무시)입니다.",
    "params": [
      {
        "name": "집계방법",
        "required": true,
        "desc": "무슨 계산을 할지 정하는 1~19 번호. 1=평균, 2=COUNT(숫자개수), 3=COUNTA(비어있지않은개수), 4=최대, 5=최소, 6=곱, 7=STDEV.S, 8=STDEV.P, 9=합계, 10=VAR.S, 11=VAR.P, 12=중위수, 13=최빈값, 14=LARGE(n번째 큰값), 15=SMALL(n번째 작은값), 16=PERCENTILE.INC(백분위), 17=QUARTILE.INC(사분위), 18=PERCENTILE.EXC, 19=QUARTILE.EXC."
      },
      {
        "name": "옵션",
        "required": true,
        "desc": "무엇을 무시할지 정하는 0~7 번호. 0(생략)=중첩 SUBTOTAL/AGGREGATE 무시, 1=숨겨진 행+중첩 무시, 2=오류값+중첩 무시, 3=숨겨진 행+오류값+중첩 무시, 4=아무것도 안 무시, 5=숨겨진 행만 무시, 6=오류값만 무시, 7=숨겨진 행+오류값 무시. 실무에서 오류 제거는 보통 6, 필터 반영은 5."
      },
      {
        "name": "참조1 / 배열",
        "required": true,
        "desc": "집계할 셀 범위. 집계방법이 1~13이면 여러 범위를 이어 쓸 수 있는 '참조1'이 되고, 14~19(LARGE·SMALL·백분위·사분위)이면 순위를 계산할 대상인 '배열' 하나가 됩니다."
      },
      {
        "name": "참조2 …",
        "required": false,
        "desc": "집계방법이 1~13일 때만 추가로 이어 붙일 수 있는 두 번째 이후 범위(SUM처럼 여러 구간 합산 가능). 14~19에서는 쓸 수 없습니다."
      },
      {
        "name": "순위 / 분위",
        "required": false,
        "desc": "집계방법이 14~19일 때 필수로 넣는 값. 14/15는 몇 번째(1이면 1등), 16/18은 0~1 사이 백분위(0.9=90%), 17/19는 1~3의 사분위 번호를 지정합니다. 1~13에서는 사용하지 않습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "오류가 섞인 청구액 합계 구하기",
        "formula": "=AGGREGATE(9, 6, B2:B11)",
        "result": "B2:B11 안에 #N/A 같은 오류 셀이 있어도 무시하고 정상 숫자만 더한 합계",
        "explain": "집계방법 9=합계, 옵션 6=오류값 무시. 조회수식(VLOOKUP 등)으로 채운 청구액 열에 오류가 한두 개 있어도 =SUM(B2:B11)처럼 통째로 터지지 않고, 멀쩡한 값만 합해 줍니다. AGGREGATE의 가장 흔한 첫 사용이에요."
      },
      {
        "level": "basic",
        "title": "필터로 걸러 보이는 행만 평균 내기",
        "formula": "=AGGREGATE(1, 5, C2:C500)",
        "result": "필터로 숨긴 행을 빼고, 현재 화면에 보이는 행들만의 평균 보험료",
        "explain": "집계방법 1=평균, 옵션 5=숨겨진 행 무시. 표에 자동 필터를 걸어 특정 상품만 남기면, 이 수식은 보이는 행만 평균을 냅니다. 필터를 바꿀 때마다 결과가 자동으로 따라 바뀌어요(SUBTOTAL과 비슷하지만 옵션이 더 풍부합니다)."
      },
      {
        "level": "advanced",
        "title": "오류를 무시하고 가장 큰 청구액 Top 3 뽑기",
        "formula": "=AGGREGATE(14, 6, claim_amt, ROW()-1)",
        "result": "1행에 넣으면 1위, 아래로 채우면 2위·3위 최대 청구액이 차례로 표시(오류 셀 무시)",
        "explain": "집계방법 14=LARGE(n번째 큰 값), 옵션 6=오류 무시. 마지막 인수 ROW()-1이 수식을 아래로 복사할 때마다 1,2,3…으로 늘어나 순위표가 됩니다. LARGE 함수는 범위에 오류가 있으면 실패하지만, AGGREGATE 버전은 오류를 건너뛰고 상위값을 안전하게 뽑아 줍니다."
      },
      {
        "level": "advanced",
        "title": "특정 상품만 골라 최소값 — 배열식을 오류 없이",
        "formula": "=AGGREGATE(15, 6, 1/(product=\"암보험\")*claim_amt, 1)",
        "result": "product가 \"암보험\"인 계약들 중 가장 작은 청구액(다른 상품 행은 자동 제외)",
        "explain": "조건에 안 맞는 행은 1/(FALSE)=1/0 즉 #DIV/0! 오류가 되는데, 옵션 6이 그 오류들을 싹 무시하므로 결국 '암보험' 행만 남습니다. 집계방법 15=SMALL, 순위 1=1번째 작은 값. AGGREGATE는 Ctrl+Shift+Enter 없이도 이런 조건부 배열 집계를 처리해 주는 게 강점이에요(MINIFS가 없던 버전의 대안)."
      },
      {
        "level": "advanced",
        "title": "여러 소계와 섞여도 이중 계산 없이 총계",
        "formula": "=AGGREGATE(9, 3, D2:D200)",
        "result": "D열 중간중간의 소계(SUBTOTAL·AGGREGATE) 셀과 오류·숨겨진 행을 모두 빼고 낸 순수 총계",
        "explain": "집계방법 9=합계, 옵션 3=숨겨진 행+오류값+중첩 소계 함수 무시. 상품별 소계를 SUBTOTAL로 넣어 둔 표에서 맨 아래 총계를 낼 때, 소계 셀을 다시 더해 두 배가 되는 실수를 막아 줍니다. 필터로 감춘 행과 오류 셀까지 한 번에 정리되는 실무형 조합이에요."
      }
    ],
    "related": [
      "SUBTOTAL",
      "SUM",
      "SUMIFS",
      "LARGE",
      "SMALL",
      "PERCENTILE.INC"
    ],
    "tips": "집계방법 14~19(LARGE·SMALL·백분위·사분위)를 쓸 때는 마지막 '순위/분위'를 반드시 넣어야 하고, 이때 참조는 범위 하나만 됩니다(여러 범위 이어붙이기 불가). 옵션 6은 '오류만', 5는 '숨긴 행만', 3은 '둘 다+소계 무시'로 헷갈리기 쉬우니 목적에 맞게 고르세요. 참고로 옵션은 세로 열 범위에서 필터·숨김을 인식합니다."
  },
  {
    "id": "maxifs",
    "name": "MAXIFS · MINIFS",
    "category": "logic",
    "version": "2019",
    "weight": 3,
    "difficulty": 2,
    "syntax": "=MAXIFS(최대범위, 조건범위1, 조건1, [조건범위2, 조건2], …)  ·  =MINIFS(최소범위, 조건범위1, 조건1, …)",
    "summary": "조건에 맞는 값들 중에서 최댓값(MAXIFS)·최솟값(MINIFS)을 구합니다.",
    "intro": "'자동차 상품 중 가장 큰 청구액은 얼마일까?'처럼, 조건에 맞는 데이터만 놓고 그중 최댓값이나 최솟값을 찾는 함수입니다. MAXIFS는 최댓값, MINIFS는 최솟값을 구하며 사용법은 똑같습니다.\n\n인수 순서는 AVERAGEIFS와 같습니다. 값을 뽑을 범위(최대/최소범위)를 맨 앞에 먼저 적고, 그 뒤에 (조건범위, 조건) 짝을 붙입니다. 조건은 여러 개 걸 수 있고 모두 만족하는(AND) 데이터만 대상이 됩니다.\n\nExcel 2019부터 추가된 함수입니다(2016 이하에는 없음). 조건에 맞는 값이 하나도 없으면 오류가 아니라 0을 돌려주므로, 실제 데이터의 최솟값이 음수일 수 있는 경우 0과 헷갈리지 않도록 주의합니다.",
    "params": [
      {
        "name": "최대범위 / 최소범위",
        "required": true,
        "desc": "실제로 최댓값·최솟값을 뽑아낼 숫자 범위(맨 앞에 위치)."
      },
      {
        "name": "조건범위1",
        "required": true,
        "desc": "조건을 검사할 셀 범위. 최대/최소범위와 크기가 같아야 함."
      },
      {
        "name": "조건1",
        "required": true,
        "desc": "찾을 기준. \"자동차\", \">100\", \"*생명*\" 등(큰따옴표로 감쌈)."
      },
      {
        "name": "조건범위2 / 조건2 …",
        "required": false,
        "desc": "조건을 더 걸 때 추가하는 (범위, 조건) 짝(최대 126쌍). 모든 조건범위는 값 범위와 크기가 같아야 함."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "조건에 맞는 값의 최댓값 (MAXIFS)",
        "formula": "=MAXIFS(F2:F100, C2:C100, \"자동차\")",
        "result": "상품(C열)이 '자동차'인 계약 중 가장 큰 청구액(F열)",
        "explain": "값을 뽑을 열(F열, 청구액)을 먼저 적고, 그 뒤에 조건(C열이 자동차)을 답니다. 자동차 계약들 가운데 최고 청구액 한 개를 돌려줍니다."
      },
      {
        "level": "basic",
        "title": "같은 조건의 최솟값 (MINIFS)",
        "formula": "=MINIFS(F2:F100, C2:C100, \"자동차\")",
        "result": "자동차 계약 중 가장 작은 청구액",
        "explain": "MAXIFS를 MINIFS로만 바꾸면 최솟값이 됩니다. 사용법은 완전히 같아 최고·최저를 나란히 비교하기 좋습니다."
      },
      {
        "level": "advanced",
        "title": "여러 조건 + 날짜 범위로 최고 보험료 찾기",
        "formula": "=MAXIFS(E2:E100, C2:C100, \"자동차\", D2:D100, \"서울\", B2:B100, \">=\"&DATE(2026,1,1))",
        "result": "2026년 이후 서울 지역 자동차 계약 중 최고 보험료(E열)",
        "explain": "상품·지역·가입일 세 조건을 모두 만족하는 계약만 놓고 최고 보험료를 뽑습니다. 날짜 조건은 DATE로 만든 뒤 \">=\"&로 이어 붙입니다."
      },
      {
        "level": "advanced",
        "title": "스필 목록으로 상품별 최고 청구액 표 자동 생성",
        "formula": "=MAXIFS($F$2:$F$100, $C$2:$C$100, H2#)",
        "result": "H2#(UNIQUE로 뽑은 상품 목록)의 상품마다 최고 청구액이 세로로 자동 채워짐(스필 배열)",
        "explain": "H2에 =UNIQUE(C2:C100)가 있으면 H2#가 상품 목록 전체를 가리킵니다. 조건 자리에 H2#를 넣으면 상품별 최고 청구액이 한 번에 계산되어 목록이 늘거나 줄어도 표가 자동으로 따라갑니다. 참고로 2016 이하에서는 =MAX(IF(C2:C100=\"자동차\",F2:F100))를 배열 수식(Ctrl+Shift+Enter)으로 대신 썼습니다."
      }
    ],
    "tips": "Excel 2019 이상(및 Microsoft 365)에서만 동작하며, 그 이전 버전에서 열면 #NAME? 오류가 납니다. 조건에 맞는 값이 없으면 오류가 아니라 0을 반환하므로, 원래 데이터에 음수가 있을 수 있다면 0(=일치 없음)과 실제 최솟값을 구분하는 로직을 함께 두는 것이 안전합니다. 모든 조건범위는 값 범위와 크기가 같아야 합니다.",
    "related": [
      "MAX",
      "MIN",
      "AVERAGEIFS",
      "SUMIFS",
      "COUNTIFS"
    ]
  },
  {
    "id": "switch",
    "name": "SWITCH",
    "category": "logic",
    "version": "2019",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=SWITCH(대상식, 값1, 결과1, [값2, 결과2], …, [기본값])",
    "summary": "하나의 값을 여러 후보와 차례로 대조해 일치하는 결과를 돌려주는 함수.",
    "intro": "SWITCH는 '이 값이 A면 이것, B면 저것, C면 그것'처럼 하나의 대상을 여러 후보 값과 하나씩 맞춰 보는 함수입니다. IF나 IFS가 '크다·작다' 같은 비교에 강하다면, SWITCH는 '정확히 이 값과 같은가'를 여러 개 비교할 때 더 짧고 깔끔합니다.\n\n맨 앞에 검사할 대상(예: 상품코드가 든 셀)을 한 번만 적고, 그 뒤로 '후보값, 그 값일 때 결과'를 쌍으로 나열합니다. 대상이 후보값과 정확히 같으면 짝지어진 결과를 돌려주고, 처음 일치하는 데서 멈춥니다.\n\n맨 끝에 쌍이 아니라 값 하나만 홀로 남기면 그것이 '어느 것과도 안 맞을 때의 기본값'이 됩니다. 기본값이 없고 일치하는 후보도 없으면 #N/A 오류가 납니다. SWITCH는 엑셀 2019부터 쓸 수 있습니다.",
    "params": [
      {
        "name": "대상식",
        "required": true,
        "desc": "여러 후보와 비교할 기준 값이나 식(예: 코드가 든 셀)"
      },
      {
        "name": "값1",
        "required": true,
        "desc": "대상식과 견줄 첫 번째 후보 값"
      },
      {
        "name": "결과1",
        "required": true,
        "desc": "대상식이 값1과 정확히 같을 때 돌려줄 결과"
      },
      {
        "name": "값2, 결과2 …",
        "required": false,
        "desc": "필요한 만큼 이어 붙이는 후보·결과 쌍"
      },
      {
        "name": "기본값",
        "required": false,
        "desc": "맨 끝에 홀로 두면 어느 후보와도 안 맞을 때의 기본 결과(생략 시 미일치는 #N/A)"
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "코드를 이름으로 바꾸기",
        "formula": "=SWITCH(A2, 1, \"월\", 2, \"화\", 3, \"수\")",
        "result": "A2가 1이면 \"월\", 2면 \"화\", 3이면 \"수\" (그 외는 #N/A)",
        "explain": "대상 A2를 후보 1·2·3과 차례로 맞춰 봅니다. 정확히 같은 값을 찾으면 짝지어진 글자를 돌려줍니다. 단순 코드→이름 변환의 전형입니다."
      },
      {
        "level": "basic",
        "title": "맨 끝에 기본값 넣기",
        "formula": "=SWITCH(A2, \"L\", \"생명보험\", \"G\", \"손해보험\", \"기타\")",
        "result": "\"L\"→생명보험, \"G\"→손해보험, 그 외 전부 \"기타\"",
        "explain": "마지막에 쌍이 아니라 값 하나(\"기타\")만 두면 어느 후보에도 안 맞을 때의 기본값이 됩니다. 글자 후보도 이렇게 대조할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "SWITCH(TRUE, …)로 구간 나누기",
        "formula": "=SWITCH(TRUE, A2>=90, \"A\", A2>=70, \"B\", A2>=50, \"C\", \"F\")",
        "result": "90↑ A, 70~89 B, 50~69 C, 나머지 F",
        "explain": "대상 자리에 TRUE를 넣으면, 뒤의 각 조건식(A2>=90 등)이 참(TRUE)이 되는 첫 번째를 골라 줍니다. 이 방법을 쓰면 SWITCH로도 IFS처럼 크기 비교 구간을 처리할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "함수 결과를 대상으로 분기하기 (MONTH 결합)",
        "formula": "=SWITCH(MONTH(A2), 1, \"1분기\", 2, \"1분기\", 3, \"1분기\", 4, \"2분기\", \"기타분기\")",
        "result": "A2 날짜의 달이 1~3이면 \"1분기\", 4면 \"2분기\" 식으로 분류",
        "explain": "대상 자리에 MONTH() 같은 함수를 바로 넣을 수 있습니다. 다만 같은 결과(\"1분기\")를 여러 값에 반복해야 한다면, 구간형에는 IFS나 SWITCH(TRUE, …)가 더 간결할 수 있습니다."
      },
      {
        "level": "advanced",
        "title": "상품명을 정렬용 순번으로 매핑 (미등록 안전 처리)",
        "formula": "=SWITCH(B2, \"자동차\", 1, \"화재\", 2, \"상해\", 3, 0)",
        "result": "상품명을 정렬·집계용 번호로 변환, 미등록 상품은 0",
        "explain": "상품명을 정해진 순서 번호로 바꿔 정렬·피벗에 쓰는 실무 패턴입니다. 맨 끝 기본값 0으로 예상 못 한 값도 오류 없이 처리합니다. 후보가 수십 개로 늘면 VLOOKUP·XLOOKUP 표 참조가 더 관리하기 편합니다."
      }
    ],
    "related": [
      "IFS",
      "IF",
      "XLOOKUP",
      "CHOOSE"
    ],
    "tips": "SWITCH는 '정확히 같음(=)'만 비교합니다. 크다·작다 같은 범위 판정은 대상 자리에 TRUE를 넣는 SWITCH(TRUE, 조건, 결과…) 방식을 쓰거나 IFS를 선택하세요. 후보가 아주 많으면 함수보다 조회표(XLOOKUP/VLOOKUP)가 유지보수에 유리합니다."
  },
  {
    "id": "let",
    "name": "LET",
    "category": "lambda",
    "version": "2021",
    "weight": 3,
    "difficulty": 3,
    "syntax": "=LET(이름1, 값1, [이름2, 값2], …, 계산식)",
    "summary": "수식 안에서 이름(변수)을 정해 두고 재사용해, 반복 계산을 줄이고 수식을 읽기 쉽게 만드는 함수",
    "intro": "LET은 하나의 수식 안에서 값에 '이름표'를 붙여 두고, 뒤에서 그 이름을 다시 불러 쓰게 해 줍니다. 프로그래밍에서 변수를 만드는 것과 똑같은 개념이라고 보면 됩니다.\n\n왜 필요할까요? 예를 들어 XLOOKUP 같은 무거운 계산을 한 수식 안에서 세 번 쓰면 엑셀은 그 계산을 세 번 반복합니다. LET으로 결과에 이름을 붙여 두면 계산은 한 번만 하고 이름으로 여러 번 꺼내 쓰므로 더 빠르고, 수식도 짧고 이해하기 쉬워집니다.\n\n쓰는 순서는 항상 '이름-값' 쌍을 먼저 나열하고, 맨 마지막에 그 이름들을 사용하는 '계산식'을 딱 한 번 씁니다. 마지막 계산식이 최종 결과가 됩니다.",
    "params": [
      {
        "name": "이름1",
        "required": true,
        "desc": "계산에 사용할 첫 번째 이름(변수). 글자로 시작하고 셀 주소처럼 보이면 안 됩니다(A1 같은 이름 금지)."
      },
      {
        "name": "값1",
        "required": true,
        "desc": "이름1에 담을 값 또는 수식. 숫자, 셀 참조, XLOOKUP 결과 등 무엇이든 가능합니다."
      },
      {
        "name": "이름2, 값2 …",
        "required": false,
        "desc": "필요한 만큼 이름-값 쌍을 계속 추가할 수 있습니다(짝을 이뤄야 함). 뒤 이름은 앞에서 정의한 이름을 참조할 수 있습니다."
      },
      {
        "name": "계산식",
        "required": true,
        "desc": "맨 마지막 인수. 앞에서 정의한 이름들을 사용해 최종 결과를 만드는 식입니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "이름 하나 정하고 바로 쓰기",
        "formula": "=LET(x, 10, x*2)",
        "result": "20",
        "explain": "x라는 이름에 10을 담고, 마지막 계산식 x*2를 실행합니다. LET의 가장 단순한 형태로 '이름 정의 → 사용' 흐름을 보여 줍니다."
      },
      {
        "level": "basic",
        "title": "가격과 할인율에 이름 붙이기",
        "formula": "=LET(가격, 10000, 할인율, 0.2, 가격*(1-할인율))",
        "result": "8000",
        "explain": "가격=10000, 할인율=0.2로 각각 이름을 정한 뒤 마지막 식에서 함께 사용합니다. 숫자를 직접 여러 번 쓰지 않아 수식의 뜻이 한눈에 읽힙니다."
      },
      {
        "level": "advanced",
        "title": "무거운 조회를 한 번만 하고 재사용",
        "formula": "=LET(찾음, XLOOKUP(A2, 상품표[코드], 상품표[상품명]), IF(찾음=\"\", \"미등록\", 찾음))",
        "result": "조회 성공 시 상품명, 실패(빈값) 시 \"미등록\"",
        "explain": "XLOOKUP 결과에 '찾음'이라는 이름을 붙여 두면, 같은 조회를 두 번 실행하지 않고 IF 안에서 이름만 두 번 꺼내 씁니다. 계산이 빨라지고 IFERROR 없이도 결과를 깔끔하게 처리합니다."
      },
      {
        "level": "advanced",
        "title": "FILTER 결과를 여러 통계에 재활용",
        "formula": "=LET(대상, FILTER(claim_amt, product=\"자동차\"), 평균, AVERAGE(대상), 건수, ROWS(대상), \"평균 \"&TEXT(평균,\"#,##0\")&\"원 · \"&건수&\"건\")",
        "result": "\"평균 1,250,000원 · 37건\" 형태의 문자열",
        "explain": "자동차 상품 청구액을 FILTER로 걸러 '대상'에 담고, 그 하나의 결과에서 평균과 건수를 각각 뽑아 한 문장으로 합칩니다. 같은 FILTER를 여러 번 반복하지 않아도 되고, 조건이 바뀌면 FILTER 한 곳만 고치면 됩니다."
      }
    ],
    "related": [
      "LAMBDA",
      "MAP",
      "REDUCE",
      "FILTER"
    ],
    "tips": "이름은 반드시 글자로 시작해야 하고 A1·R1C1처럼 셀 주소로 보이는 이름은 쓸 수 없습니다. 인수는 항상 '이름, 값' 쌍으로 나열하고 맨 끝에 계산식이 오는데, 이 마지막 계산식을 빠뜨리면 오류가 납니다."
  },
  {
    "id": "map",
    "name": "MAP",
    "category": "lambda",
    "version": "365",
    "weight": 3,
    "difficulty": 4,
    "syntax": "=MAP(배열1, [배열2], …, LAMBDA(값1, [값2], …, 계산식))",
    "summary": "배열의 각 값에 같은 계산(LAMBDA)을 하나씩 적용해, 같은 크기의 결과 배열로 돌려주는 함수",
    "intro": "MAP은 범위(배열) 안의 값들을 하나씩 꺼내 똑같은 계산을 적용하고, 그 결과들을 원래와 같은 모양의 배열로 돌려줍니다. '한 줄 한 줄 보조 열을 만들어 수식을 아래로 복사'하던 작업을, 수식 하나로 대신할 수 있습니다.\n\n어떤 계산을 적용할지는 마지막 인수인 LAMBDA로 정합니다. LAMBDA의 매개변수 개수는 앞에 넣은 배열 개수와 같아야 합니다. 배열 하나면 매개변수 하나, 배열 둘이면 매개변수 둘(예: 청구액과 보험료를 같은 위치끼리 계산)입니다.\n\n결과가 여러 값이면 자동으로 아래·옆으로 '스필(spill)'되어 펼쳐집니다. 조건 분류, 값 변환, 두 열을 짝지어 계산하기 등 반복 작업을 깔끔하게 처리할 때 유용합니다.",
    "params": [
      {
        "name": "배열1",
        "required": true,
        "desc": "계산을 적용할 값들의 범위 또는 배열."
      },
      {
        "name": "배열2 …",
        "required": false,
        "desc": "함께 계산할 추가 배열. 배열1과 크기(행·열)가 같아야 하며, LAMBDA 매개변수 순서대로 짝지어집니다."
      },
      {
        "name": "LAMBDA(값…, 계산식)",
        "required": true,
        "desc": "각 위치의 값에 적용할 계산. 앞에 넣은 배열 수만큼 매개변수를 받아 계산식으로 결과를 만듭니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "각 값에 10 곱하기",
        "formula": "=MAP({1,2,3}, LAMBDA(x, x*10))",
        "result": "{10, 20, 30} (가로 스필)",
        "explain": "배열 {1,2,3}의 값을 하나씩 x로 받아 x*10을 계산합니다. 결과가 세 개이므로 자동으로 펼쳐집니다. MAP의 기본 동작(값마다 같은 계산)을 보여 줍니다."
      },
      {
        "level": "basic",
        "title": "범위 전체를 10% 인상",
        "formula": "=MAP(A2:A6, LAMBDA(값, 값*1.1))",
        "result": "A2:A6 각 값에 1.1을 곱한 5개 결과가 세로로 스필",
        "explain": "보조 열을 만들고 수식을 아래로 끌어 복사하는 대신, MAP 한 줄이면 범위의 모든 값을 한꺼번에 변환합니다. 결과는 입력과 같은 세로 모양으로 펼쳐집니다."
      },
      {
        "level": "advanced",
        "title": "두 배열을 짝지어 손해율 계산(0 나눗셈 방어)",
        "formula": "=MAP(claim_amt, premium, LAMBDA(c, p, IF(p=0, \"\", c/p)))",
        "result": "행별 손해율(청구액/보험료)이 세로로 스필, 보험료 0인 행은 빈칸",
        "explain": "배열을 두 개 넣으면 LAMBDA도 매개변수를 두 개 받아 같은 위치끼리 계산합니다. 청구액 c와 보험료 p를 짝지어 손해율을 구하되, 보험료가 0인 행은 오류 대신 빈칸으로 처리합니다."
      },
      {
        "level": "advanced",
        "title": "청구액을 금액대별 등급으로 분류",
        "formula": "=MAP(claim_amt, LAMBDA(c, IF(c>=1000000, \"고액\", IF(c>=100000, \"중간\", \"소액\"))))",
        "result": "각 청구 건이 \"고액\"/\"중간\"/\"소액\" 중 하나로 분류되어 세로 스필",
        "explain": "여러 단계의 IF 판정을 배열 전체에 한 번에 적용합니다. 데이터가 늘어나도 수식을 복사할 필요 없이 원본 범위가 커지면 결과도 자동으로 함께 늘어납니다(테이블 참조 시)."
      }
    ],
    "related": [
      "LAMBDA",
      "REDUCE",
      "SCAN",
      "BYROW",
      "BYCOL"
    ],
    "tips": "여러 배열을 넣을 때는 모두 같은 행·열 크기여야 하며, 크기가 다르면 오류가 납니다. 각 값을 독립적으로 변환할 때 MAP을 쓰고, 값들을 하나로 합쳐 누적할 때는 REDUCE, 누적 과정을 배열로 남기려면 SCAN을 씁니다."
  },
  {
    "id": "byrow-bycol",
    "name": "BYROW · BYCOL",
    "category": "lambda",
    "version": "365",
    "weight": 2,
    "difficulty": 4,
    "syntax": "=BYROW(배열, LAMBDA(행, 계산식))  ·  =BYCOL(배열, LAMBDA(열, 계산식))",
    "summary": "표의 각 행(BYROW)/각 열(BYCOL)을 통째로 넘겨 한 줄당 값 하나로 요약한 배열을 돌려준다.",
    "intro": "BYROW는 표의 각 '행'을 통째로 LAMBDA에 넘겨, 한 행당 값 하나로 요약하고 그 결과를 세로 배열로 돌려줍니다. BYCOL은 각 '열'을 넘겨 한 열당 값 하나로 요약해 가로 배열로 돌려줍니다.\n\n예를 들어 사람별(행) 세 과목 점수 표가 있을 때 BYROW로 각 사람의 평균을 한 번에, 과목별(열) 평균은 BYCOL로 한 번에 구할 수 있습니다.\n\n꼭 기억할 규칙 하나: LAMBDA는 행(또는 열)마다 '값 하나(스칼라)'를 돌려줘야 합니다. 평균·합계·최댓값·개수, 또는 '이 행에 조건을 만족하는 게 하나라도 있나?' 같은 판정처럼 한 줄을 한 값으로 압축하는 계산에 적합합니다.\n\n한 줄을 여러 값으로 바꾸고 싶을 때는 BYROW/BYCOL이 아니라 MAP을 씁니다.",
    "params": [
      {
        "name": "배열",
        "required": true,
        "desc": "행 또는 열 단위로 계산할 표/범위."
      },
      {
        "name": "LAMBDA(행, 계산식) / LAMBDA(열, 계산식)",
        "required": true,
        "desc": "각 행(BYROW) 또는 각 열(BYCOL)을 인수로 받아 값 하나로 요약하는 규칙. 인수에는 그 행/열 전체가 배열로 들어온다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "행마다 평균 구하기(개인별 평균)",
        "formula": "=BYROW(B2:D4, LAMBDA(행, AVERAGE(행)))",
        "result": "각 행의 평균이 세로 배열로 아래로 스필(예: {82; 75; 90})",
        "explain": "B2:D4의 각 행(한 사람의 세 값)이 통째로 '행'에 들어오고, AVERAGE로 평균을 냅니다. 셀 하나에 수식을 넣으면 나머지 행 결과가 자동으로 채워집니다."
      },
      {
        "level": "basic",
        "title": "열마다 합계 구하기(과목별/월별 합계)",
        "formula": "=BYCOL(B2:D4, LAMBDA(열, SUM(열)))",
        "result": "각 열의 합계가 가로 배열로 오른쪽으로 스필",
        "explain": "이번에는 열 단위입니다. 각 열(한 과목/한 달의 값들)이 '열'에 들어오고 SUM으로 더합니다. 방향만 다를 뿐 BYROW와 사용법은 똑같습니다."
      },
      {
        "level": "advanced",
        "title": "행별 조건 판정(계약별 고액청구 표시)",
        "formula": "=BYROW(claim_amt, LAMBDA(행, IF(MAX(행)>1000000, \"주의\", \"정상\")))",
        "result": "계약마다 \"주의\" 또는 \"정상\"이 세로로 표시",
        "explain": "각 계약(행)의 청구액 중 하나라도 100만 원을 넘으면 '주의'로 표시합니다. 요약이 꼭 숫자일 필요는 없으며, 행을 하나의 판정 결과로 압축할 수도 있습니다."
      },
      {
        "level": "advanced",
        "title": "열별 조건 집계(상품별 해지 건수)",
        "formula": "=BYCOL(status, LAMBDA(열, SUM(--(열=\"해지\"))))",
        "result": "각 상품 열의 '해지' 건수가 가로로 스필",
        "explain": "각 상품(열) 안에서 '해지'와 같은 셀에 TRUE(=1)를 만들고 SUM으로 세어, COUNTIF를 열마다 반복한 효과를 냅니다. -- 는 TRUE/FALSE를 1/0으로 바꾸는 관용 기법입니다."
      },
      {
        "level": "advanced",
        "title": "행별 변동폭(최댓값-최솟값)",
        "formula": "=BYROW(B2:M2, LAMBDA(행, MAX(행)-MIN(행)))",
        "result": "각 상품/계약의 월별 변동폭(최대-최소)이 행마다 표시",
        "explain": "한 행 안에서 여러 함수를 조합할 수 있습니다. MAX와 MIN의 차이로 '월별 청구액이 얼마나 출렁였는지'를 한 줄당 하나의 값으로 요약합니다."
      }
    ],
    "tips": "LAMBDA는 반드시 행/열당 '한 개의 값'을 반환해야 합니다. 배열을 반환하면 #CALC! 오류가 납니다. 한 줄을 여러 값으로 변환하려면 MAP을, 위치 기반으로 새 표를 만들려면 MAKEARRAY를 쓰세요. 두 함수 모두 원본과 같은 개수만큼 결과가 스필되므로 출력 방향(BYROW=아래, BYCOL=오른쪽)에 빈 칸이 필요합니다.",
    "related": [
      "MAP",
      "REDUCE",
      "LAMBDA",
      "SUM",
      "AVERAGE"
    ]
  },
  {
    "id": "lambda",
    "name": "LAMBDA",
    "category": "lambda",
    "version": "2021",
    "weight": 2,
    "difficulty": 5,
    "syntax": "=LAMBDA(매개변수1, [매개변수2], …, 계산식)(인수1, [인수2], …)",
    "summary": "매개변수와 계산식으로 '나만의 함수'를 직접 만드는 함수 — 이름을 붙여 두면 SUM처럼 재사용 가능",
    "intro": "LAMBDA는 엑셀에서 여러분만의 함수를 직접 만들 수 있게 해 줍니다. 함수가 받을 입력값의 이름(매개변수)과, 그 값으로 무엇을 계산할지(계산식)를 적으면 새로운 함수 하나가 완성됩니다.\n\nLAMBDA 자체는 '이름 없는 함수'입니다. 그래서 두 가지 방법으로 씁니다. ① 만든 자리에서 바로 값을 넣어 실행하려면 뒤에 괄호를 하나 더 붙여 인수를 전달합니다(예: LAMBDA(x, x*2)(5)). ② 진짜 힘은 이름 관리자(수식 → 이름 관리자)에 등록해 이름을 붙일 때 나옵니다. 예를 들어 '부가세'라는 이름으로 등록하면 이후 어느 셀에서든 =부가세(50000)처럼 내장 함수처럼 부를 수 있습니다.\n\n또한 LAMBDA는 MAP·REDUCE·BYROW 같은 함수의 '재료'로 넘겨져, 각 값에 적용할 계산을 정의하는 데 쓰입니다. 처음엔 어렵게 느껴지지만, 반복되는 복잡한 수식을 하나의 이름으로 묶어 두는 강력한 도구입니다.",
    "params": [
      {
        "name": "매개변수1",
        "required": true,
        "desc": "함수가 받을 첫 번째 입력값의 이름. 계산식 안에서 이 이름으로 입력값을 부릅니다."
      },
      {
        "name": "매개변수2 …",
        "required": false,
        "desc": "필요한 만큼(최대 253개) 입력 이름을 추가할 수 있습니다."
      },
      {
        "name": "계산식",
        "required": true,
        "desc": "맨 마지막 인수. 매개변수들을 사용해 결과를 만드는 식입니다."
      },
      {
        "name": "(인수…)",
        "required": false,
        "desc": "LAMBDA 뒤에 괄호로 붙이는 실제 입력값. 셀에서 바로 테스트할 때 사용하며, 이름 관리자에 등록해 쓸 때는 붙이지 않습니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "만든 자리에서 바로 실행(제곱)",
        "formula": "=LAMBDA(x, x*x)(5)",
        "result": "25",
        "explain": "x를 받아 x*x를 돌려주는 함수를 만들고, 바로 뒤 괄호에 5를 넣어 실행합니다. LAMBDA가 '입력 → 계산 → 결과'를 어떻게 정의하는지 확인하는 가장 단순한 예입니다."
      },
      {
        "level": "basic",
        "title": "매개변수 두 개로 더하기",
        "formula": "=LAMBDA(a, b, a+b)(3, 4)",
        "result": "7",
        "explain": "입력을 두 개(a, b) 받는 함수입니다. 뒤 괄호에 3, 4를 순서대로 넣으면 a=3, b=4가 되어 7을 돌려줍니다. 매개변수가 여러 개일 때의 순서 규칙을 보여 줍니다."
      },
      {
        "level": "advanced",
        "title": "이름 관리자에 등록해 재사용(손해율)",
        "formula": "=손해율(claim_amt, premium)",
        "result": "청구액/보험료 = 예: 0.62 (미리 이름 관리자에 손해율 = LAMBDA(청구, 보험료, IF(보험료=0, \"\", 청구/보험료)) 등록)",
        "explain": "이름 관리자에 손해율 = LAMBDA(청구, 보험료, IF(보험료=0, \"\", 청구/보험료))를 등록해 두면, 이후 시트 어디서든 =손해율(...)로 내장 함수처럼 부를 수 있습니다. 0으로 나누는 오류 처리까지 함수 안에 담아 한 번만 관리합니다."
      },
      {
        "level": "advanced",
        "title": "MAP의 재료로 넘겨 배열 전체에 적용",
        "formula": "=MAP(premium, LAMBDA(p, ROUND(p*0.1, 0)))",
        "result": "보험료 범위의 각 값에 10%를 적용한 결과가 세로로 스필",
        "explain": "LAMBDA는 MAP·REDUCE 같은 함수의 계산 재료로 쓰일 때 진가를 발휘합니다. 여기서는 '보험료 p를 받아 10%를 반올림하는 계산'을 정의해 MAP에 넘기면, 범위의 모든 값에 한꺼번에 적용됩니다."
      }
    ],
    "related": [
      "LET",
      "MAP",
      "REDUCE",
      "SCAN",
      "BYROW",
      "BYCOL"
    ],
    "tips": "이름 관리자에 등록할 때는 뒤 괄호(인수)를 붙이지 않고 LAMBDA(...) 정의만 넣습니다. 자기 자신을 다시 부르는 재귀도 가능하지만(반복 로직), 이름을 등록해야 재귀가 동작하고 무한 반복에 빠지지 않도록 종료 조건을 반드시 넣어야 합니다."
  },
  {
    "id": "reduce",
    "name": "REDUCE",
    "category": "lambda",
    "version": "365",
    "weight": 2,
    "difficulty": 5,
    "syntax": "=REDUCE([초기값], 배열, LAMBDA(누적값, 현재값, 계산식))",
    "summary": "배열을 처음부터 끝까지 훑으며 값을 누적해, 하나의 최종 결과로 '줄이는(reduce)' 함수",
    "intro": "REDUCE는 배열의 값을 하나씩 순서대로 훑으면서 '누적값'을 계속 갱신해, 마지막에 단 하나의 결과로 만들어 줍니다. 눈덩이를 굴리듯, 앞까지의 결과(누적값)에 지금 값(현재값)을 합쳐 다음 누적값을 만드는 방식입니다.\n\n동작은 세 부분으로 이해합니다. ① 초기값 — 누적을 시작할 첫 값(합계면 0, 곱이면 1). ② 배열 — 훑어 갈 값들. ③ LAMBDA(누적값, 현재값, 계산식) — 지금까지의 누적값과 이번 값을 어떻게 합칠지 정하는 규칙입니다. 엑셀은 배열의 각 값마다 이 LAMBDA를 실행하며 누적값을 갱신합니다.\n\n단순 합계·곱은 SUM으로 충분하지만, REDUCE는 '조건에 따라 다르게 누적하기'나 'VSTACK과 함께 배열을 점점 쌓아 가기'처럼 일반 함수로 어려운 반복 로직을 표현할 때 강력합니다. 개념이 다소 추상적이라 난이도가 높은 편입니다.",
    "params": [
      {
        "name": "초기값",
        "required": false,
        "desc": "누적을 시작할 첫 값. 합계는 0, 곱은 1처럼 계산에 맞게 정합니다. 비워 두면 빈 값(0)에서 시작합니다."
      },
      {
        "name": "배열",
        "required": true,
        "desc": "처음부터 끝까지 훑어 가며 누적할 값들의 범위 또는 배열."
      },
      {
        "name": "LAMBDA(누적값, 현재값, 계산식)",
        "required": true,
        "desc": "누적 규칙. 첫 매개변수는 지금까지의 누적값, 둘째는 이번에 처리할 값이며, 계산식의 결과가 다음 누적값이 됩니다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "값들을 모두 더하기",
        "formula": "=REDUCE(0, {1,2,3,4}, LAMBDA(누적, 값, 누적+값))",
        "result": "10",
        "explain": "초기값 0에서 시작해 값을 하나씩 더해 갑니다: 0→1→3→6→10. 누적값에 현재값을 더하는 규칙이 어떻게 최종 하나의 결과로 줄어드는지 보여 주는 가장 기본 예입니다."
      },
      {
        "level": "basic",
        "title": "값들을 모두 곱하기",
        "formula": "=REDUCE(1, {1,2,3,4,5}, LAMBDA(a, v, a*v))",
        "result": "120",
        "explain": "곱셈은 초기값을 1로 둡니다(0이면 결과가 0이 되므로). 1×1×2×3×4×5 = 120. 초기값을 계산 종류에 맞게 정하는 것이 REDUCE의 핵심임을 보여 줍니다."
      },
      {
        "level": "advanced",
        "title": "기준 이상 고액 청구만 골라 합산",
        "formula": "=REDUCE(0, claim_amt, LAMBDA(합, c, 합 + IF(c>=1000000, c, 0)))",
        "result": "100만 원 이상 청구 건들의 합계(그 외는 더하지 않음)",
        "explain": "누적 규칙 안에 IF를 넣어 조건을 만족하는 값만 더합니다. SUMIF로도 가능하지만, REDUCE는 이렇게 '누적하면서 판단'하는 복잡한 로직을 자유롭게 표현할 수 있다는 점을 보여 줍니다."
      },
      {
        "level": "advanced",
        "title": "VSTACK과 함께 누적 합계(러닝 토탈) 배열 만들기",
        "formula": "=DROP(REDUCE(0, 금액범위, LAMBDA(누적, v, VSTACK(누적, INDEX(누적, ROWS(누적)) + v))), 1)",
        "result": "각 행까지의 누계가 위에서부터 차례로 쌓인 세로 배열",
        "explain": "REDUCE는 누적값으로 단일 숫자뿐 아니라 배열도 쓸 수 있습니다. VSTACK으로 이전 누계 아래에 '직전 누계+현재값'을 계속 쌓아 러닝 토탈을 만들고, 시작용 0 한 줄은 DROP으로 떼어 냅니다. 순수 누적 결과의 마지막 상태만 필요하면 REDUCE, 이렇게 중간 누적 과정을 배열로 남기고 싶으면 SCAN을 쓰는 것이 더 간단합니다."
      }
    ],
    "related": [
      "SCAN",
      "MAP",
      "LAMBDA",
      "VSTACK"
    ],
    "tips": "초기값은 계산 종류에 맞춰야 합니다 — 합계는 0, 곱은 1, 배열 쌓기는 시작 틀이 될 값입니다. 누적 '과정'까지 모두 배열로 보고 싶다면 REDUCE 대신 SCAN이 더 적합하며, 값마다 독립 변환은 MAP이 맞습니다."
  },
  {
    "id": "scan",
    "name": "SCAN",
    "category": "lambda",
    "version": "365",
    "weight": 2,
    "difficulty": 4,
    "syntax": "=SCAN(초깃값, 배열, LAMBDA(누계, 값, 계산식))",
    "summary": "배열을 앞에서부터 하나씩 누적 계산하고, 그 중간 과정을 전부 배열로 돌려준다(달리는 합계).",
    "intro": "SCAN은 배열(범위)의 값을 왼쪽부터 하나씩 순서대로 처리하면서 '누적 계산'을 하고, 그 중간 과정을 전부 배열로 돌려주는 함수입니다. 쉽게 말해 '달리는 합계(running total)'를 한 방에 만들어 줍니다.\n\n예를 들어 매달 청구액이 10, 20, 30이라면 SCAN은 10, 30, 60처럼 각 위치까지 쌓인 누적값을 보여 줍니다.\n\n작동 방식은 이렇습니다. 먼저 '누계'라는 저장 상자를 하나 두고, 그 안에 초깃값을 넣습니다. 그다음 배열에서 '값'을 하나씩 꺼내 여러분이 정한 계산식대로 누계를 갱신하고, 매 단계의 결과를 차곡차곡 배열로 남깁니다.\n\n중간 과정 전체가 필요하면 SCAN, 마지막 결과 하나만 필요하면 REDUCE를 씁니다. 둘은 형제 함수입니다.",
    "params": [
      {
        "name": "초깃값",
        "required": true,
        "desc": "누적을 시작하는 값. 합계 누적이면 보통 0, 곱(복리) 누적이면 1, 문자열 이어붙이기면 \"\"."
      },
      {
        "name": "배열",
        "required": true,
        "desc": "앞에서부터 순서대로 훑을 값들의 범위나 배열."
      },
      {
        "name": "LAMBDA(누계, 값, 계산식)",
        "required": true,
        "desc": "각 단계에서 실행할 규칙. 누계=지금까지 쌓인 값, 값=현재 꺼낸 값. 계산식이 새 누계가 된다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "숫자를 하나씩 더하는 누적 합계",
        "formula": "=SCAN(0, {10;20;30}, LAMBDA(누계,값, 누계+값))",
        "result": "세로 배열 {10; 30; 60}이 스필로 표시",
        "explain": "0에서 시작해 10 → 30 → 60으로 계속 더해 갑니다. 각 단계의 누적값이 그대로 배열로 나오는 게 SCAN의 핵심입니다."
      },
      {
        "level": "basic",
        "title": "월별 청구액의 누적 합계(범위 참조)",
        "formula": "=SCAN(0, B2:B13, LAMBDA(a,v, a+v))",
        "result": "1월부터 12월까지의 누적 청구액이 아래로 스필",
        "explain": "B2:B13에 월별 청구액이 있으면, 각 월까지 쌓인 누적 청구액을 한 번에 만들어 줍니다. 누계 열을 따로 드래그해서 만들 필요가 없습니다."
      },
      {
        "level": "advanced",
        "title": "누적 최고 청구액(MAX 누적)",
        "formula": "=SCAN(0, D2:D50, LAMBDA(a,v, MAX(a,v)))",
        "result": "그 시점까지 나온 가장 큰 청구액이 각 행마다 표시",
        "explain": "누계를 '더하기'가 아니라 'MAX'로 갱신하면, 지금까지 기록된 최고 청구액(신기록 추이)을 추적할 수 있습니다. 누계 상자에 무엇을 담고 어떻게 갱신할지 자유롭게 정할 수 있다는 점을 보여 줍니다."
      },
      {
        "level": "advanced",
        "title": "복리 누적 성장배수(곱 누적)",
        "formula": "=SCAN(1, 1+E2:E6, LAMBDA(a,v, a*v))",
        "result": "예: 이율 3%,5%,2%,4%,3% → 1.03, 1.0815, 1.1031, 1.1472, 1.1816 …",
        "explain": "E열에 연도별 수익률(0.03 등)이 있을 때, 1+수익률을 곱해 나가면 '원금 대비 누적 성장배수'가 나옵니다. 초깃값을 1로 두는 이유는 곱셈의 시작점이기 때문입니다."
      },
      {
        "level": "advanced",
        "title": "문자열을 단계별로 이어붙이기(경로 만들기)",
        "formula": "=SCAN(\"\", C2:C5, LAMBDA(a,v, IF(a=\"\", v, a & \" > \" & v)))",
        "result": "상품A / 상품A > 상품B / 상품A > 상품B > 상품C … 처럼 누적 연결",
        "explain": "누계는 숫자만 담는 게 아닙니다. 빈 문자열에서 시작해 값을 이어붙이면 '가입 순서 경로' 같은 진행 이력을 만들 수 있습니다. 첫 칸은 앞에 ' > '가 붙지 않도록 IF로 처리했습니다."
      }
    ],
    "tips": "SCAN은 과정 전체를, REDUCE는 최종 결과 하나만 돌려줍니다. LAMBDA의 누계·값 인수 이름은 자유롭게 지어도 되지만 '순서(누계 먼저, 값 나중)'는 지켜야 합니다. 결과가 원본 배열과 같은 크기로 스필되므로 아래(또는 옆) 칸이 비어 있어야 #SPILL! 오류가 나지 않습니다.",
    "related": [
      "REDUCE",
      "MAP",
      "LAMBDA",
      "MAKEARRAY",
      "SEQUENCE"
    ]
  },
  {
    "id": "isomitted",
    "name": "ISOMITTED",
    "category": "lambda",
    "version": "365",
    "weight": 1,
    "difficulty": 5,
    "syntax": "=ISOMITTED(인수)   ← LAMBDA 안에서 사용",
    "summary": "LAMBDA 함수의 인수를 사용자가 생략했는지 검사한다. 생략=TRUE, 값 있음=FALSE.",
    "intro": "ISOMITTED는 오직 LAMBDA(사용자 정의 함수) 안에서만 쓰는 함수로, '이 인수를 사용자가 넘겼는지, 아니면 비워 뒀는지'를 확인해 TRUE/FALSE를 돌려줍니다. TRUE는 '생략됨(안 넘김)', FALSE는 '값이 들어옴'입니다.\n\n이 함수의 진짜 쓸모는 '선택 인수(기본값이 있는 인수)'를 만드는 것입니다. 예를 들어 할인율을 안 적으면 자동으로 5%를 적용하고, 적으면 그 값을 쓰는 함수를 만들 수 있습니다.\n\n패턴은 거의 항상 IF와 짝을 이룹니다. IF(ISOMITTED(인수), 기본값, 넘어온값) 형태로, '생략됐으면 기본값, 아니면 받은 값'을 고릅니다.\n\n혼자서는 잘 쓰지 않고, LAMBDA를 이름 관리자에 저장해 나만의 함수를 만들 때 인수를 유연하게 다루는 고급 용도로 씁니다.",
    "params": [
      {
        "name": "인수",
        "required": true,
        "desc": "생략 여부를 검사할 LAMBDA 인수의 이름. 사용자가 그 자리를 비워 두면 TRUE, 값을 넣으면 FALSE를 반환한다."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "인수를 넘긴 경우(FALSE)",
        "formula": "=LAMBDA(a,b, IF(ISOMITTED(b), a+10, a+b))(1, 2)",
        "result": "3",
        "explain": "b에 2를 넘겼으므로 ISOMITTED(b)는 FALSE입니다. 따라서 a+b = 1+2 = 3이 계산됩니다. 뒤의 (1, 2)는 방금 정의한 LAMBDA를 곧바로 호출하는 부분입니다."
      },
      {
        "level": "basic",
        "title": "인수를 생략한 경우(TRUE)",
        "formula": "=LAMBDA(a,b, IF(ISOMITTED(b), a+10, a+b))(1, )",
        "result": "11",
        "explain": "b 자리를 비워 두면(콤마 뒤에 값 없음) ISOMITTED(b)가 TRUE가 되어 기본 로직 a+10 = 11이 적용됩니다. 같은 함수라도 인수를 넣고 빼는 것만으로 동작이 달라집니다."
      },
      {
        "level": "advanced",
        "title": "선택 할인율이 있는 보험료 함수(이름 정의)",
        "formula": "보험료 = LAMBDA(기본료, [할인율], 기본료*(1-IF(ISOMITTED(할인율), 0.05, 할인율)))",
        "result": "=보험료(100000) → 95000,  =보험료(100000, 0.1) → 90000",
        "explain": "이름 관리자에 '보험료'로 저장해 쓰는 사용자 정의 함수입니다. 할인율을 안 적으면 기본 5%(0.05), 적으면 그 값을 적용합니다. 선택 인수는 대괄호[]로 표기하고 보통 뒤쪽에 둡니다."
      },
      {
        "level": "advanced",
        "title": "여러 선택 인수에 각각 기본값 주기(이름 정의)",
        "formula": "이자계산 = LAMBDA(원금, [연이율], [개월], 원금*(IF(ISOMITTED(연이율),0.03,연이율))/12*IF(ISOMITTED(개월),12,개월))",
        "result": "=이자계산(1000000) → 30000(3%·12개월),  =이자계산(1000000, 0.05, 6) → 25000",
        "explain": "선택 인수가 두 개일 때는 각각 ISOMITTED로 검사해 기본값을 줍니다. 연이율을 생략하면 3%, 개월을 생략하면 12개월을 적용해, 인수를 얼마나 넣느냐에 따라 유연하게 계산합니다."
      }
    ],
    "tips": "ISOMITTED는 LAMBDA의 매개변수에만 쓸 수 있습니다(일반 셀 참조에는 쓸 수 없음). 선택 인수는 관례상 뒤쪽에 두고 이름에 대괄호[]를 붙여 표시합니다. 인수를 생략할 때는 마지막이면 그냥 값을 비우고, 중간이면 콤마로 자리를 유지해야 합니다. LET·이름 관리자와 함께 쓰면 재사용 가능한 나만의 함수를 깔끔하게 만들 수 있습니다.",
    "related": [
      "LAMBDA",
      "LET",
      "IF"
    ]
  },
  {
    "id": "makearray",
    "name": "MAKEARRAY",
    "category": "lambda",
    "version": "365",
    "weight": 1,
    "difficulty": 4,
    "syntax": "=MAKEARRAY(행수, 열수, LAMBDA(행, 열, 계산식))",
    "summary": "행수×열수 크기의 표를 만들고, 각 칸을 그 칸의 행·열 번호로 계산해 채운다.",
    "intro": "MAKEARRAY는 '정해진 크기(행수 × 열수)의 빈 표를 만들고, 각 칸을 계산식으로 채워 주는' 함수입니다.\n\n특별한 점은, 칸마다 그 칸의 행 번호와 열 번호를 LAMBDA에 넘겨 준다는 것입니다(둘 다 1부터 시작). 그래서 '3번째 행 4번째 열' 같은 위치 정보에 따라 서로 다른 값을 넣을 수 있습니다.\n\n대표적인 예가 구구단 표입니다. 각 칸에 '행 번호 × 열 번호'를 넣으면 곱셈표가 완성됩니다.\n\n기존 데이터를 변형하는 MAP과 달리, MAKEARRAY는 '아무것도 없는 상태에서 위치 규칙만으로 새 표를 생성'할 때 씁니다. 단위행렬, 요율표 격자, 체크무늬 같은 위치 기반 표에 잘 맞습니다.",
    "params": [
      {
        "name": "행수",
        "required": true,
        "desc": "만들 배열의 행 개수(세로 칸 수)."
      },
      {
        "name": "열수",
        "required": true,
        "desc": "만들 배열의 열 개수(가로 칸 수)."
      },
      {
        "name": "LAMBDA(행, 열, 계산식)",
        "required": true,
        "desc": "각 칸에서 실행할 규칙. 행=현재 칸의 행 번호(1부터), 열=현재 칸의 열 번호(1부터)."
      }
    ],
    "examples": [
      {
        "level": "basic",
        "title": "구구단(위치 곱하기)",
        "formula": "=MAKEARRAY(3, 3, LAMBDA(행,열, 행*열))",
        "result": "3×3 배열: 1 2 3 / 2 4 6 / 3 6 9",
        "explain": "각 칸에 그 칸의 '행 번호 × 열 번호'를 넣습니다. 행·열이 모두 1부터 세어진다는 점만 이해하면 MAKEARRAY의 기본 원리를 다 이해한 것입니다."
      },
      {
        "level": "basic",
        "title": "0으로 채운 빈 표 만들기",
        "formula": "=MAKEARRAY(2, 3, LAMBDA(행,열, 0))",
        "result": "2행 3열이 전부 0인 배열",
        "explain": "행·열 번호를 쓰지 않고 항상 0을 반환하면, 원하는 크기의 '0 채움 표'가 만들어집니다. 초기 틀을 잡거나 계산용 빈 격자를 만들 때 편리합니다."
      },
      {
        "level": "advanced",
        "title": "단위행렬(대각선만 1)",
        "formula": "=MAKEARRAY(4, 4, LAMBDA(행,열, IF(행=열, 1, 0)))",
        "result": "4×4 단위행렬(대각선 1, 나머지 0)",
        "explain": "행 번호와 열 번호가 같은 칸(대각선)에만 1을 넣습니다. 위치를 비교하는 조건을 넣을 수 있어, 통계·행렬 계산의 기초 재료를 손쉽게 만듭니다."
      },
      {
        "level": "advanced",
        "title": "보험료 요율표 격자(위치 기반 산출)",
        "formula": "=MAKEARRAY(5, 5, LAMBDA(행,열, 50000*(1+0.03*(행-1))*(1-0.01*(열-1))))",
        "result": "나이대(행)가 올라가면 오르고 납입기간(열)이 길수록 내려가는 5×5 보험료 격자",
        "explain": "기본료 50,000원에서 행이 커질수록 3%씩 가산, 열이 커질수록 1%씩 할인하도록 위치식을 넣었습니다. -1을 붙인 이유는 첫 칸(1행 1열)을 기준값 그대로 두기 위해서입니다."
      },
      {
        "level": "advanced",
        "title": "기존 표를 위치로 참조해 5% 인상표 만들기",
        "formula": "=MAKEARRAY(ROWS(rng), COLS(rng), LAMBDA(행,열, INDEX(rng, 행, 열)*1.05))",
        "result": "rng와 같은 크기이면서 모든 값이 5% 인상된 표",
        "explain": "행·열 번호를 INDEX에 넘겨 원본 rng의 해당 칸을 꺼내 1.05를 곱합니다. ROWS·COLS로 원본과 같은 크기를 자동으로 맞췄습니다. 위치가 필요할 때는 MAP 대신 MAKEARRAY가 유용합니다."
      }
    ],
    "tips": "행·열 번호는 항상 1부터 시작합니다. 결과가 커질수록(예: 1000×1000) 각 칸을 하나하나 계산하므로 무거워질 수 있으니 필요한 크기만 만드세요. 단순히 1,2,3…처럼 연속 숫자만 필요하면 SEQUENCE가, 기존 배열을 값 그대로 변형만 할 때는 MAP이 더 간단합니다.",
    "related": [
      "SEQUENCE",
      "MAP",
      "LAMBDA",
      "RANDARRAY",
      "INDEX"
    ]
  }
];
