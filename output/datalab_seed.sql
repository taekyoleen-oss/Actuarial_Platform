-- =============================================================
-- Insurance Insights Board — datalab_seed.sql
-- 데이터 예제/분석(DataLab) 데모 게시물 1건. datalab_schema.sql 실행 후 실행.
-- 멱등: slug 충돌 시 아무것도 하지 않는다(on conflict (slug) do nothing).
--
-- 주의: 실제 스토리지 파일이 없으므로 ib_data_files row는 넣지 않는다.
--   상세페이지 워크북 패널은 파일이 없으면 "열람 가능한 워크북 없음" 상태로 폴백해야 한다.
--   (파일은 datalab-publisher 스킬/관리자 업로드로 datalab/{post_id}/… 경로에 추가.)
-- =============================================================

insert into ib_data_posts (slug, title, summary, source_name, source_url, models, tools, content, is_published)
values (
  'nps-subscriber-sample',
  '국민연금 가입자 통계 샘플 분석',
  '공개된 국민연금 가입자 통계를 엑셀로 정리하고 연령대·지역별 추이를 살펴본 샘플 분석입니다.',
  '통계청 KOSIS · 국민연금공단',
  'https://kosis.kr',
  array['기술통계','추세분석','피벗 집계'],
  array['Excel 함수','피벗테이블','Python in Excel'],
  $json$
  {
    "overview": "국민연금 **가입자 통계**를 연도·연령대·지역별로 정리한 샘플 데이터셋입니다. 원자료의 코드값을 사람이 읽을 수 있는 레이블로 매핑하고, 결측·중복을 정리한 뒤 피벗으로 집계해 추세를 살펴봅니다. 본 게시물은 DataLab 섹션의 구조(개요 · 레이아웃 · 분석 방법)를 보여주기 위한 데모이며, 실제 워크북 파일은 첨부되어 있지 않습니다.",
    "dataTraits": [
      "관측 단위: (연도 × 연령대 × 지역) 조합별 가입자 수",
      "기간: 2019~2024년 (연 단위)",
      "지역: 17개 시·도, 연령대: 10세 구간 6개 그룹",
      "결측: 일부 (연도 × 소규모 지역) 조합 누락 → 0이 아닌 NULL로 구분",
      "단위: 명(정수). 천 단위 구분기호는 표시서식으로만 적용"
    ],
    "layout": [
      {
        "sheet": "raw",
        "columns": [
          { "name": "year",        "type": "정수",   "desc": "기준 연도 (예: 2024)" },
          { "name": "region_code", "type": "문자",   "desc": "행정구역 코드 (KOSIS 원자료)" },
          { "name": "region",      "type": "문자",   "desc": "시·도명 (코드 매핑 결과)" },
          { "name": "age_band",    "type": "문자",   "desc": "연령대 구간 (예: 30-39)" },
          { "name": "subscribers", "type": "정수",   "desc": "해당 조합의 가입자 수(명)" }
        ]
      },
      {
        "sheet": "pivot",
        "columns": [
          { "name": "region",   "type": "문자", "desc": "행 레이블: 시·도" },
          { "name": "2019~2024", "type": "정수", "desc": "열 레이블: 연도별 가입자 합계" },
          { "name": "CAGR",     "type": "백분율", "desc": "연평균 증가율 (RATE/POWER 수식)" }
        ]
      }
    ],
    "methods": [
      {
        "title": "1) 코드값 레이블 매핑",
        "tool": "Excel 함수",
        "body": "`region_code`를 매핑 표(`XLOOKUP`)로 `region` 컬럼에 변환합니다. 매칭 실패 코드는 `IFNA`로 표시해 원자료 이상치를 즉시 식별합니다."
      },
      {
        "title": "2) 결측·중복 정리",
        "tool": "피벗테이블",
        "body": "(연도 × 지역 × 연령대) 키 중복을 제거하고, 누락 조합은 0이 아닌 NULL로 두어 '가입자 0명'과 '데이터 없음'을 구분합니다."
      },
      {
        "title": "3) 지역·연도 추세 집계",
        "tool": "피벗테이블",
        "body": "행=지역, 열=연도, 값=`subscribers` 합계로 피벗을 구성하고, 우측에 `CAGR = (마지막/처음)^(1/n)-1` 수식 열을 붙여 증가율을 계산합니다."
      },
      {
        "title": "4) 시각화·요약",
        "tool": "Python in Excel",
        "body": "`=PY()` 셀에서 pandas로 상위/하위 증가 지역을 정렬하고 간단한 막대그래프로 확인합니다. (웹 저장본에서는 Python 셀·차트가 소실될 수 있으므로 원본 워크북을 별도 보존)"
      }
    ],
    "links": [
      { "label": "KOSIS 국민연금 가입 현황", "url": "https://kosis.kr" }
    ],
    "notes": "데모용 샘플입니다. 실제 수치·워크북 파일은 포함되어 있지 않으며, 게시 자동화는 datalab-publisher 스킬로 수행합니다."
  }
  $json$::jsonb,
  true
)
on conflict (slug) do nothing;

-- ib_data_files: (의도적으로 없음) 스토리지 파일 미첨부 → row 생략.
-- =============================================================
