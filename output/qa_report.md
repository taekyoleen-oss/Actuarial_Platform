# QA 리포트 — DB/RLS 마일스톤

검증자: qa-integrator 역할 · 검증 방식: 정적 교차 비교(설계서 §3 ↔ `schema.sql`) + RLS 시나리오 리뷰
(라이브 Supabase 자격증명 부재 → 실제 쿼리 실행 대신 정적 검증. 적용 시 `rls_tests.sql`로 동적 확인 필요.)

## 1. 스키마 ↔ 설계서 §3 대조 (통과)
| 테이블 | 설계서 컬럼 | schema.sql | 결과 |
|--------|------------|-----------|------|
| ib_categories | id/slug uniq/name/description/sort_order/created_at | 동일 | ✅ |
| ib_posts | id/category_id FK/title/content/summary?/summary_generated_at?/view_count d0/author_name?/is_published d-true/created_at/updated_at | 동일 + updated_at 트리거 + 인덱스 | ✅ |
| ib_attachments | id/post_id FK/file_name/storage_path/mime_type/file_size bigint/created_at | 동일 (post 삭제 시 cascade) | ✅ |
| ib_comments | id/post_id FK/nickname/content/created_at (비밀번호 컬럼 없음) | 동일 | ✅ |
| ib_admins | user_id PK→auth.users/email/created_at | 동일 | ✅ |

## 2. RLS 정책 ↔ 설계서 §3 표 대조 (통과)
| 테이블 | SELECT | INSERT | UPDATE | DELETE | 결과 |
|--------|--------|--------|--------|--------|------|
| ib_categories | 공개 | 관리자 | 관리자 | 관리자 | ✅ |
| ib_posts | published 공개/관리자 전체 | 관리자 | 관리자 | 관리자 | ✅ |
| ib_attachments | 공개 | 관리자 | 관리자 | 관리자 | ✅ |
| ib_comments | 공개 | **익명 허용** | **차단(정책+권한 부재)** | 관리자 | ✅ |
| ib_admins | 관리자 | 금지 | 금지 | 금지 | ✅ |

## 3. RPC / 함수 (통과)
- `ib_is_admin()` — security definer, `search_path` 고정 ✅
- `ib_increment_view(uuid)` — security definer, 게시글만 +1, `anon/authenticated`에 execute grant ✅ (익명 UPDATE 권한 없이 조회수 증가 우회 — 설계서 §3 의도 충족)

## 4. 발견·수정 사항
- **[수정됨] 테이블 GRANT 누락**: 초안은 RLS 정책만 있고 테이블 레벨 GRANT가 없었음. RLS는 행을, GRANT는 동작 유형을 통제하므로 둘 다 필요. `schema.sql §4b`에 명시적 GRANT 추가(anon: select+댓글 insert / authenticated: 쓰기, 행 제한은 RLS). 환경(Supabase 기본 권한) 의존성 제거.
- **[확인] ib_comments UPDATE 이중 차단**: UPDATE 정책 미생성 + UPDATE 권한 미부여 → 익명/사용자 댓글 수정 불가.
- **[확인] Storage**: `ib-attachments` public read, 쓰기는 `ib_is_admin()`. 서버 업로드는 service_role(RLS 우회) — 클라이언트 노출 금지 주석 명시.

## 4b. 적용 중 발견·수정 (2026-06-09)
- **[수정됨] rls_tests.sql 트랜잭션 구조 결함**: 초판은 각 테스트를 `begin…rollback`으로 감쌌으나, PostgreSQL은 트랜잭션 중첩 불가 → 첫 `rollback`이 준비 데이터(게시물 a1/a2)까지 롤백 → T2 댓글 INSERT가 FK 위반(`23503`). **savepoint 기반으로 재작성**(단일 트랜잭션 + 테스트별 savepoint + 최종 rollback)하여 준비 데이터 보존. 스키마/RLS 정책 자체는 정상.
- 교훈: Supabase SQL Editor는 멀티 스테이트먼트를 한 트랜잭션처럼 다루므로, 역할 전환 테스트는 savepoint로 격리해야 한다.

## 5. 잔존 한계 (적용 단계에서 해소)
- 동적 RLS 검증 미실행(자격증명 부재). 적용 후 `rls_tests.sql` T1~T9를 SQL Editor에서 실행해 기대표와 대조할 것.
- 댓글 길이 제한·IP rate limit은 DB가 아닌 Route Handler 책임(api-designer 단계). RLS로 처리하지 않음.

## 결론
DB/RLS 산출물(`schema.sql`/`seed.sql`/`rls_tests.sql`)은 설계서 §3과 1:1 일치. 정적 검증 **통과**. 적용 후 동적 테스트 1회 권장.
