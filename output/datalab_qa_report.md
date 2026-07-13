# DataLab (데이터 예제/분석) — 통합 QA 리포트

- 작성: qa-integrator · 2026-07-13
- 대상: `/datalab` 섹션 (DB·API·UI·변환기·SQL)
- 계약 기준: `_workspace/datalab_design_spec.md`, `output/datalab_api_contract.json`
- 환경 한계: **DB 미적용**(라이브 테이블 없음). RLS·RPC는 정적 시나리오 리뷰로 대체.
  편집기↔변환기 왕복은 **실측**(dev 서버 + Playwright + 실제 변환기 실행)으로 검증.

## 종합 판정: **조건부 PASS (블로킹 없음, HIGH 이슈 1건 · MED 이슈 1건 수정 권고)**

빌드/타입/렌더/경계면 정합은 전부 통과. 다만 **웹 편집 저장 시 "임포트된 숫자 셀이 텍스트로 저장"되는
데이터 정합성 손상**(HIGH)과 **편집기 진입만으로 자동저장이 1회 발화(무편집 신규 버전 생성)**(HIGH) 두 건은
기능 불능은 아니지만 계약("숫자 보존")을 위반하고 원본을 열람만 해도 열화 버전이 current로 승격되므로 수정 권고.

> **갱신(2026-07-13, §L 라이브 검증):** DB 라이브 적용 + HIGH 이슈 2건 수정 완료 후 재검증 결과 **L1~L5 전부 PASS**,
> 정적 QA의 BLOCKED(뷰어 실데이터·조회수 RPC) **전부 해소**. **잔여 코드 이슈 0.**
> 다만 라이브에서 신규로 `nps-subscriber-sample` **시드 한글 모지바케(MED, 앱 코드 무관)** 1건 발견 — §L 참조.

---

## A. 편집기 → 저장 API → 변환기 왕복 실측 (최우선) — 부분 PASS

방법: `sample_auto_claims.xlsx`(2시트·수식 8)를 `public/_qa/`로 복사, 임시 페이지에 `WorkbookPane`(view)+
`WorkbookEditor`(가짜 postId) 마운트. dev 서버(3999)+Playwright로 실측. POST body를 fetch 인터셉트로 캡처
(`_workspace/datalab/qa_captured_sheets.json`), **실제** `lib/datalab-xlsx.ts`(typescript 트랜스파일, 로직 복제 없음)로
변환 후 exceljs로 재오픈 검증. 임시 파일 전부 삭제 후 `npm run build` 재통과 확인.

### A-1. fortune-sheet + luckyexcel React 19 런타임 첫 실측 — **PASS**
- 뷰어·편집기 **둘 다 정상 렌더**. 캔버스 2개, 시트 탭 `claims`/`summary` 표시.
- **fortune-sheet/luckyexcel 런타임 에러 0.** 콘솔의 유일한 실오류는 예상된 `401 /workbook`(관리자 아님).
  (그 외 `/_qa-workbook` 404는 QA 중 나의 최초 오탐 경로 — 언더스코어 폴더는 Next 비공개 폴더라 라우팅 제외됨. 코드 무관.)

### A-2. 자동저장·401 에러 경로 — **PASS**
- 편집기에서 저장 발화 시 상태칩이 **`저장 실패 (unauthorized) — 다시 시도`** 로 정확히 표시. 에러 경로 정상.
- 저장 POST body 실측 shape: `{ sheets:[...], baseName:"sample" }`, 시트 2개(`claims`,`summary`).

### A-3. 경계면 핵심 발견 — **`getAllSheets()`는 `data` 매트릭스를 반환(`celldata` 아님)**
- 실측 결과 각 시트에 **`celldata` 없음**, `data`(84×60 매트릭스)만 존재. `config`는 `{}`(merge/columnlen/rowlen 없음).
- 파서 `collectCells`(datalab-xlsx.ts:37)는 `celldata` 부재 시 `data` 매트릭스 경로로 폴백 → **실제 케이스 커버함(정상).**
- 단, 계약 문서(`api_contract.json` FortuneSheetJson "celldata 우선 사용", spec §3)는 마치 `celldata`가 주 경로인 것처럼
  기술 → **실물과 불일치(문서 정확성 이슈, 기능 무해).** 실제 저장 경로는 항상 `data` 매트릭스다.

### A-4. 변환 왕복 수치 (실제 변환기 실행 결과) — **셀·수식·시트 PASS / 숫자 타입 FAIL**
변환 결과: `sheetCount 2 · cellCount 41 · formulaCount 8 · mergeCount 0 · skippedCells 0`.
exceljs 재오픈 검증:

| 항목 | 결과 | 판정 |
|------|------|------|
| 시트 | `claims`,`summary` 2개 보존 | PASS |
| 텍스트 값 | 연도·담보·사고건수·지급보험금·평균지급액·대인·대물·지표·값·총 사고건수·총 지급보험금 전부 보존 | PASS |
| 수식 | 8/8 보존 (`=D2/C2`…`=D7/C7`, `SUM(claims!C2:C7)`, `SUM(claims!D2:D7)`), `=` 접두 정상 제거 | PASS |
| 수식 캐시값 | **없음**("no cached result") — luckyexcel가 `f`만 주고 `v`/`m` 미제공 | 주의(아래) |
| 편집 셀 반영 | 편집한 C3=`987654`가 body에 반영 → 변환 후 **Number 987654** 로 정확 저장 | PASS |
| **숫자 타입** | 원본-임포트 숫자셀 **18개 중 17개가 String("1200"/"3600000000"…)으로 저장** | **FAIL** |

---

## 🔴 이슈 1 (HIGH · 데이터 정합성) — 임포트된 숫자 셀이 웹 저장 시 텍스트로 저장됨

- **파일:라인:** `lib/datalab-xlsx.ts:61-72` (`cellValue`)
- **근거(실측):** luckyexcel가 xlsx에서 임포트한 숫자 셀은 `{ tb:1, v:"1200" }` 형태 — **`v`가 숫자문자열이고 `ct`가 없음.**
  반면 `cellValue`의 숫자 보존 분기는 `cell.ct && cell.ct.t === "n"` 를 요구 → **분기 미발화 → `raw`(문자열) 그대로 반환.**
  변환 후 exceljs 재오픈 시 `C2="1200"(String)`, `D2="3600000000"(String)` … (기대: Number).
- **영향:** Excel에서 텍스트 숫자는 `=SUM(claims!C2:C7)` 같은 **집계 수식이 0을 반환**(SUM은 텍스트 무시).
  정렬/필터/차트도 텍스트로 처리. 계약 명시("값 v.v — 숫자는 숫자로 보존", spec §3 / contract $mapping)를 위반.
- **정밀도:** 사용자가 셀을 직접 재입력하면 fortune-sheet가 `ct:{t:"n"}`+`m`을 부여 → 그 셀만 Number로 저장됨(편집한 C3만 정상).
  즉 **사용자가 손대지 않은 임포트 셀 전부가 열화** (본 샘플: 18개 중 17개).
- **권고 수정(적용하지 않음, 제안만):**

```ts
// lib/datalab-xlsx.ts  cellValue() — ct 부재 luckyexcel 셀도 숫자 보존
function cellValue(cell: FsCell): string | number | boolean | null {
  const raw = cell.v;
  if (raw === undefined || raw === null || raw === "") return cell.m ?? null;
  if (typeof raw === "number" || typeof raw === "boolean") return raw;
  // 명시적 텍스트(ct.t==='s' 또는 quotePrefix qp===1)면 문자열 유지, 그 외 숫자문자열은 수치 보존
  const forcedText = (cell.ct && cell.ct.t === "s") || (cell as { qp?: unknown }).qp === 1;
  if (!forcedText && typeof raw === "string" && raw.trim() !== "" && !isNaN(Number(raw))) {
    return Number(raw);
  }
  return raw;
}
```
  - 하위호환: `ct.t==='n'` 케이스도 동일하게 Number 처리(회귀 없음). `qp===1`(강제 텍스트, 예: "007")은 문자열 유지.
  - 대안: 저장 전 클라이언트에서 fortune-sheet에 전체 recalc/normalize를 태우는 방법도 있으나 변환기 수정이 최소·확실.

## 🔴 이슈 2 (HIGH · 저장 오작동) — 편집기 진입만으로 자동저장 1회 발화(무편집 신규 버전 생성)

- **파일:라인:** `components/feature/datalab/WorkbookEditor.tsx:157-161`(`onChange`) + `99-148`(`doSave`)
- **근거(실측):** `/qa-workbook` 로드 직후(내가 아무것도 클릭하기 전) **`POST /workbook`가 자동 발화**(콘솔 401).
  fortune-sheet가 초기 `data` 프롭 하이드레이션 시 `onChange`를 호출 → `dirty=true`+4초 디바운스 → `doSave()`.
  `doSave`는 `dirty` 여부를 확인하지 않고 **항상** `getAllSheets()`를 POST.
- **영향:** 실 관리자 세션에서는 **편집 페이지를 열기만 해도** 4초 뒤 새 버전(v n+1)이 생성되고 `is_current`가 이동.
  그 신규 버전은 이슈 1로 **숫자→텍스트 열화본** → 열람만 해도 열화본이 current로 승격 + 스토리지/버전 누적 팽창.
- **권고 수정(제안):** 초기 하이드레이션 onChange 무시. 예) 로드 완료 후 `hydratedRef` 를 짧게 지연 세팅하고
  `onChange`에서 `if (!hydratedRef.current) return;` 로 사용자 유래 변경만 수용. 추가로 `doSave` 진입 시 `if (!dirty.current) return;` 방어.

## 🟡 이슈 3 (LOW · 문서) — 계약의 `celldata 우선` 표기가 실물과 불일치
- **파일:** `output/datalab_api_contract.json`(FortuneSheetJson `celldata` "우선 사용"), spec §3.
- 실측상 `getAllSheets()`는 `data` 매트릭스만 반환. 파서는 폴백으로 커버하나, 계약 문서는 `data`가 실제 주 경로임을 명시하는 게 정확. 기능 무해.

## 🟡 이슈 4 (LOW · 주의) — 웹 저장본 수식에 캐시 결과 없음
- luckyexcel가 수식 셀에 `f`만 주고 `v`/`m` 미제공 → 변환기가 `{formula}`만 기록(결과 없음).
- Excel/폰트시트는 재계산하므로 대개 무해하나, 텍스트-숫자(이슈1)와 겹치면 `SUM`이 0으로 재계산됨. **이슈1 수정 시 자연 완화.**

---

## B. 코드 경계면 교차 검토 (정적) — PASS

| # | 검증 | 결과 |
|---|------|------|
| B1 | 편집기 전송 `{sheets,baseName}`(WorkbookEditor.tsx:110) ↔ workbook route 파서 필드 | **PASS.** route는 `body.sheets` 검증 후 `fortuneSheetsToXlsx`로 전달. 실물 body는 `celldata` 없이 `data` 매트릭스 → 파서 `collectCells` 폴백 경로가 커버(§A-3). `config.merge/columnlen/rowlen` 처리도 존재(본 샘플엔 미포함). |
| B2 | UI `DataFile`/`DataPost` 필드 ↔ `types/index.ts` ↔ `datalab_schema.sql` 3자 | **PASS.** DataPost 13필드·DataFile 12필드 전부 컬럼과 1:1 일치(이름·널가능성). DataPostContent 키(overview/dataTraits/layout{sheet,columns{name,type,desc}}/methods{title,body,tool}/images/links{label,url}/notes) 일치. |
| B3 | DataViewCounter → view route → RPC명 ↔ schema 함수명 | **PASS.** `POST /api/datalab/{id}/view`(DataViewCounter.tsx:17) → `rpc("ib_increment_data_view",{p_post_id})`(view/route.ts:14) → schema `ib_increment_data_view(p_post_id uuid)`(datalab_schema.sql:73). 3자 일치. |
| B4 | `dataFileUrl` async ↔ await 누락 | **PASS.** `dataFileUrl`은 `publicUrl`(내부 `await createClient()`)을 감싼 진짜 async. 호출부(상세: currentUrl/originalUrl/images/attachments, edit: fileUrl) **전부 await**. 누락 없음. |
| B5 | edit 페이지 requireAdmin redirect | **PASS.** `if(!admin.ok) redirect('/datalab/'+slug)`(edit/page.tsx:17) — spec §4.4 일치. 추가로 post 없음→`/datalab`, current 워크북 없음→상세로 리다이렉트(안전). |

부가: SiteNav에 `{href:"/datalab", name:"데이터 예제/분석"}` 존재(SiteNav.tsx:28). WorkbookEditor는 `slug` 프롭을 타입상 요구하나 미사용(계약 유지용, 무해).

---

## C. SQL 리뷰 — PASS (라이브 미실행, 정적)

### C1. `datalab_schema.sql` ↔ `schema.sql` 교차 — PASS
- **재정의 충돌 없음.** 신규 객체는 전부 `ib_data_` 프리픽스. 기존 `ib_touch_updated_at()`·`ib_is_admin()`을 **재사용만**(재정의 없음).
- **실행 순서 전제 명확:** 헤더에 "반드시 `schema.sql` 선행 실행" 명시(두 함수 의존). 트리거/정책/GRANT는 신규 대상만.
- RPC `ib_increment_data_view`는 `ib_increment_view`와 동일 패턴(security definer·search_path 고정·`is_published=true` 조건·anon/authenticated grant). 정상.
- Storage: 신규 버킷 없음, 기존 `ib-attachments` 버킷 정책(경로 무관 버킷 단위)이 `datalab/...` 경로 커버 — 주석으로 명시. 정상.

### C2. `datalab_rls_tests.sql` 시나리오 ↔ 실제 정책 — PASS (기존 스위트와 동일 패턴)
- D1(공개만)·D5(조회수 RPC, 게시글만)·D6(파일 익명 읽기)·D10(anon≠admin): 정책과 정확히 부합.
- D2/D7(anon INSERT 차단, RLS 에러 기대): savepoint로 격리 후 `rollback to savepoint`로 회복 — 유효한 구성.
- **주의(LOW):** D3/D4/D8/D9는 "UPDATE/DELETE 0" 을 기대. 이는 anon이 해당 테이블 write **권한을 (Supabase 기본 grant로) 보유**하여
  RLS가 0행으로 거른다는 전제. 스키마의 명시 GRANT는 anon에 SELECT만 부여하므로, Supabase 기본권한이 없다면
  "permission denied"가 날 수 있음. **다만 이는 기존 `output/rls_tests.sql`(T3/T5 등)과 동일한 전제/표기** →
  기존 스위트가 라이브에서 통과한다면 datalab도 동일하게 통과. 어느 경우든 **동작은 차단(보안 정상).** 표기 정합만 라이브 확인 권장.

### C3. `datalab_seed.sql` content ↔ `DataPostContent` — PASS
- seed content 키(overview·dataTraits·layout[{sheet,columns[{name,type,desc}]}]·methods[{title,tool,body}]·links[{label,url}]·notes)가
  타입 정의와 **완전 일치**. `images` 생략(선택 필드). `on conflict (slug) do nothing`으로 멱등. 파일 row는 의도적으로 없음(상세 워크북 패널은 파일 없으면 미표시 — 코드상 `current && currentUrl` 가드 확인).

---

## D. 이미 검증됨(중복 안 함) — tsc 0에러, 최초 build 통과, 내비 1024/1019, 빈상태, 없는 slug 404, publish 에러경로.

## 재검증 후 상태
- 임시 QA 산출물(`public/_qa`, `app/(public)/qa-workbook`) **전부 삭제**, `npm run build` **재통과**(datalab 3라우트 정상, qa-workbook 라우트 없음).
- 캡처 실물: `_workspace/datalab/qa_captured_sheets.json` (편집 셀 987654 포함, 재현용 보존).

---

## DB 적용 후 사용자 확인 잔여 체크리스트
1. **RLS 라이브 실행:** `datalab_rls_tests.sql` 전체 1회 실행 → D1~D10 기대표 대조(특히 D3/D4/D8/D9가 "0행"인지 "permission denied"인지 표기 확인). — *미해소(SQL Editor 수동 실행 필요)*
2. ~~**뷰어 실데이터 렌더**~~ — **해소(라이브 §L 참조): 실 storage 파일 로드·셀값 렌더 확인.**
3. ~~**관리자 편집 자동저장** (무편집 신규버전)~~ — **이슈2 수정 해소(무조작 15초 POST 0건, 코디네이터 실측). 관리자 실편집 저장은 잔여.**
4. ~~**다운로드 링크(최신본)**~~ — **해소(라이브 §L: 최신본 v1 storage GET 200).** 원본 v2≠v1 케이스·첨부 목록은 데이터 생기면 잔여.
5. **숫자 정합(이슈1):** 이슈1 수정(18/18 Number, 코디네이터 실측)으로 코드 해소. 웹 저장본(v2) Excel 집계 검증은 실편집 발생 시 최종 확인 권장. — *실편집 잔여*
6. ~~**조회수 RPC**~~ — **해소(라이브 §L: POST /view ×3 → 200, view_count 0→4 증가).**

---

## L. 라이브 검증 (2026-07-13) — DB 적용 후 실데이터 런타임

전제: 코디네이터가 ① `datalab_schema.sql`·`datalab_seed.sql` 라이브 적용(테이블 2·RPC 1·정책 4·RLS on),
② HIGH 이슈 2건 수정(숫자 판별 재작성 18/18 Number / 편집기 상호작용 게이트+dirty 가드 무조작 POST 0),
③ 데모 2건(`nps-subscriber-sample` 파일 0, `sample-auto-claims-demo` 워크북 v1 포함) 게시 완료.
방법: dev 서버(3999, 라이브 Supabase 연결) + Playwright. 임시 파일 없음(스크린샷·아티팩트 삭제 완료).

| # | 항목 | 결과 | 판정 |
|---|------|------|------|
| L1 | `/datalab` 목록 | 카드 **2건 렌더**. `sample-auto-claims-demo`: 제목·출처배지("합성 샘플 데이터")·모델/도구 칩·**XLSX 배지**·조회 0 정상. 검색 `q=클레임` → **1건 필터**(demo만). **콘솔 에러 0.** | PASS |
| L2 | `/datalab/sample-auto-claims-demo` 상세 | 섹션 개요·레이아웃(테이블 2)·분석방법(2단계)·notes 렌더. 조회수 표시. **워크북 임베드 뷰어가 실 storage 파일 로드**(GET `…/v1_sample_auto_claims.xlsx` **200**), fortune-sheet 라이브 모델에 **실 셀값 확인**(claims: 연도·담보·사고건수·2021·대인·1200·3600000000·대물·3400 / summary: 지표·값·총 사고건수·총 지급보험금). "최신본 다운로드 (v1)" storage URL **200**. 한계 고지문 노출. **비관리자 → "웹에서 편집" 버튼 미노출.** **콘솔 심각 에러 0.** | PASS |
| L3 | `/datalab/nps-subscriber-sample` 상세 | 파일 0 → **워크북 패널 없음**(정상), content 섹션(개요·레이아웃 테이블 2·분석방법 4단계·관련링크) 구조 렌더. 다운로드 링크 0. | PASS(구조) / 데이터 이슈(L-이슈5) |
| L4 | `/datalab/[slug]/edit` 비관리자 | `…/edit` 진입 → **`/datalab/sample-auto-claims-demo`로 redirect**(requireAdmin). | PASS |
| L5 | 조회수 RPC 왕복 | `POST /api/datalab/{id}/view` ×3 → **모두 200 `{ok:true}`**(anon RPC 정상). 캐시 우회 재조회 시 `조회 0→4` **증가 확인**(auto 1 + 수동 3). | PASS |

### 🟠 라이브 신규 이슈 5 (MED · 데이터 품질) — `nps-subscriber-sample` 시드 한글 모지바케
- **근거(실측):** 목록 카드·상세 h1의 한글이 **리터럴 `?`(U+003F, codepoint 0x3f) 로 저장**됨(예: 제목 "국민연금 가입자 통계 샘플 분석" → "???? ??? ?? ?? ??" 13자 전부 `?`). content의 JSON **구조는 온전**(레이아웃 테이블 2·분석 4단계 렌더) → **문자열 값만 손상**.
- **원인:** 앱/코드 아님. `datalab_seed.sql`의 **실행 경로 인코딩 손실**(SQL Editor 붙여넣기 등에서 비-Latin1 문자를 `?`로 치환). **대조군:** 같은 파이프라인의 `sample-auto-claims-demo`(publish 스크립트 경유)는 한글 정상 → 시드 SQL 실행 방식에 국한.
- **원본 파일 무결:** `output/datalab_seed.sql` 자체는 정상 UTF-8(정적 확인). 즉 파일이 아니라 **적용 방식**의 문제.
- **권고:** `nps-subscriber-sample` 행을 UTF-8 안전 경로로 재삽입(psql `client_encoding=UTF8` 또는 `datalab-publish.mjs` manifest 경유). 또는 실 데모(`sample-auto-claims-demo`)가 이미 있으므로 시드 데모 행 삭제. **앱 코드 무관(수정 불요).**

### 라이브 판정 요약
- **L1~L5 전부 PASS**(L3는 구조 PASS + 데이터 모지바케 별건). 정적 QA의 **BLOCKED(뷰어 실데이터·조회수 RPC) 전부 해소.**
- 이전 HIGH 이슈 1·2는 코디네이터 수정으로 코드 반영됨(실측치 인용). **잔여 코드 이슈 0**, 신규는 시드 데이터 품질(MED, 코드 무관) 1건.
