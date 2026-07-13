---
name: datalab-publisher
description: "데이터 예제/분석(/datalab) 게시 자동화 스킬. 엑셀 워크북(+PDF·텍스트·이미지·코드 첨부)을 분석해 데이터 특성·레이아웃·분석 방법을 일관된 구조(content JSON)로 자동 작성하고, service_role 스크립트로 Supabase에 게시한다. '데이터 예제/분석에 게시/올려줘', 'datalab 게시', '엑셀 분석 게시', '데이터 분석 자료 올려줘', '이 엑셀 게시해줘' 요청 시 반드시 사용. 게시물 내용 수정·재작성, 첨부 추가, 워크북 새 버전 게시 요청 시에도 사용."
---

# datalab-publisher — 데이터 예제/분석 게시 자동화

엑셀로 정리·분석한 데이터를 `/datalab` 게시판에 **일관된 구조·톤**으로 게시한다.
게시는 DB(ib_data_posts/ib_data_files)+Storage(ib-attachments/datalab/…)만 사용 → **재배포 없이 즉시 반영**된다.

## 선행 조건 (최초 1회)

`ib_data_posts` 테이블이 없으면 게시 스크립트가 `[실패] 게시글 조회: Could not find the table 'public.ib_data_posts' in the schema cache` 로 중단된다(실측 확인, 이 시점엔 아무 것도 쓰지 않음).
→ `output/datalab_schema.sql`을 Supabase SQL Editor에서 실행하도록 사용자에게 안내하고 중단한다.

## 워크플로우

1. **입력 파악**: 사용자에게서 확보 —
   - 필수: 엑셀 파일 경로(.xlsx/.xlsm), 출처(source_name, source_url)
   - 선택: 첨부(pdf/텍스트/파이썬 코드/이미지), 분석 모델·도구 태그, 설명 메모
   - 출처를 파일/대화에서 추론 가능하면 추론하고 보고에 명시(추론 불가 시에만 질문).
2. **워크북 분석**: `node scripts/datalab-inspect.mjs <xlsx경로>` 실행
   → 시트·행열수·헤더·수식 개수·VBA 존재 여부(JSON). 필요 시 엑셀을 직접 열어(Read 불가 시 exceljs 원샷 스크립트) 헤더 아래 샘플 5행을 확인한다.
3. **content 자동 작성**: 아래 "content 작성 규칙"대로 `_workspace/datalab/<slug>.manifest.json` 생성.
4. **게시**: `node scripts/datalab-publish.mjs _workspace/datalab/<slug>.manifest.json`
   - slug 기존 존재 시 메타 update + 파일은 새 버전/첨부로 추가된다(덮어쓰기 아님).
5. **검증**: 스크립트가 출력한 URL 확인. 로컬 dev 서버가 떠 있으면 `/datalab/<slug>` 렌더 확인(선택).
6. **보고**: 게시 URL·파일 버전·content 섹션 구성 요약. 코드 변경이 없으므로 커밋 없음(변경 이력 표 갱신도 불필요). manifest는 `_workspace/datalab/`에 보존.

## manifest 형식 (scripts/datalab-publish.mjs 입력)

```json
{
  "slug": "kosis-population-2025",
  "title": "주민등록 인구 통계 (2025) — 연령별 분포 분석",
  "summary": "행안부 주민등록 인구를 연령 5세 구간으로 집계하고 피벗·SUMPRODUCT로 고령화 지표를 산출한 워크북",
  "source_name": "행정안전부 주민등록 인구통계",
  "source_url": "https://jumin.mois.go.kr/",
  "models": ["기술통계", "피벗 분석"],
  "tools": ["Excel 함수", "VBA"],
  "content": { "overview": "…", "dataTraits": [], "layout": [], "methods": [], "links": [], "notes": "" },
  "is_published": true,
  "files": [
    { "path": "C:/…/population.xlsm", "kind": "excel", "is_primary": true, "note": "원본 v1" },
    { "path": "C:/…/analysis.py", "kind": "code", "note": "별도 파이썬 분석 코드" }
  ]
}
```

## content 작성 규칙 (일관성 비협상)

구조는 `types/index.ts`의 `DataPostContent`. 섹션 순서 고정: overview → dataTraits → layout → methods → images → links → notes.

- **톤**: 객관 서술체(…이다/…한다). 1인칭·감탄 금지. 검증되지 않은 수치 금지(정성 서술로 대체).
- **summary** (카드의 "데이터 내용"): 1~2문장 — ①무슨 데이터인지 ②엑셀에서 무엇을 했는지.
- **overview**: 마크다운 3~6문장 — 데이터 취득 배경, 범위(기간·단위·건수), 어떤 질문에 답하는 분석인지.
- **dataTraits**: bullet 3~6개 — 행 단위(무엇이 1행인가), 기간/범위, 결측·이상치 특이사항, 갱신 주기.
- **layout**: inspect 결과 헤더 기반, 시트별 `{ sheet, columns: [{name, type, desc}] }`.
  type은 샘플 값으로 추론(text/number/date/percent/formula). 분석용 파생 컬럼은 desc에 "파생: 수식 요지" 명시.
  시트가 5개 초과면 데이터 시트만 상세, 나머지는 desc 한 줄 요약.
- **methods**: 분석 단계별 `{ title, body, tool }` — tool은 "Excel 함수"|"VBA"|"Python in Excel"|"Python"|"피벗".
  body에 핵심 수식/코드 요지를 백틱 코드로 포함(예: `` `=SUMPRODUCT((AGE>=65)*POP)/SUM(POP)` ``).
  inspect가 수식·VBA를 감지하면 사용자 메모가 없어도 수식 샘플을 읽어 단계를 재구성한다.
- **notes**: .xlsm(VBA 포함)이면 반드시 포함 — "웹 편집 저장본(v2+)은 셀 값·수식 수준만 보존하며 VBA 매크로·차트는 원본(v1)에서만 유지된다."
- **images**: 이미지는 manifest `files[]`에 `kind:"image"`로 넣으면 업로드·상세페이지 이미지 섹션에 자동 노출된다(content.images는 외부 URL 이미지에만 사용).
- **slug**: 영문 kebab-case(출처-주제-연도), 한글 금지.
- **models/tools**: 각 1~4개 짧은 명사구. models=분석 기법(회귀분석, GLM, 기술통계…), tools=수단(Excel 함수, VBA, Python in Excel, Python).

## 기존 게시물 수정·버전 추가

- 내용 수정: 같은 slug로 manifest의 메타/content만 채워 재실행(files 생략 가능) → update.
- 워크북 새 버전: files에 excel(is_primary true) 포함 재실행 → v(n+1) 추가·is_current 이동, 원본 v1 보존.
- 첨부만 추가: files에 첨부만 넣고 재실행.
- 삭제·비공개: is_published를 false로(삭제는 SQL Editor 안내).

## 에러 핸들링

| 상황 | 대응 |
|------|------|
| `Could not find the table 'public.ib_data_posts' in the schema cache` | output/datalab_schema.sql SQL Editor 실행 안내 후 중단 (게시글 조회 단계 — 쓰기 전이라 안전) |
| 파일 20MB 초과 | 업로드 불가 안내 — 데이터 축소/분할 제안 |
| .xls(구형)·암호화 파일 | inspect 실패 → xlsx 재저장 요청 |
| 출처 불명 | 게시는 진행하되 source_name "출처 미확인"으로 두지 말고 사용자에게 확인(출처는 카드 노출 항목) |
| storage 업로드 성공 후 DB insert 실패 | 스크립트가 단계 표시 — 재실행 시 slug upsert라 중복 게시물은 생기지 않음. 고아 파일 경로를 보고에 명시 |
