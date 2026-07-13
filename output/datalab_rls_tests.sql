-- =============================================================
-- Insurance Insights Board — datalab_rls_tests.sql  (savepoint 버전)
-- 대상: ib_data_posts / ib_data_files RLS·RPC 검증.
-- 사전: schema.sql + datalab_schema.sql 실행 완료.
--
-- ⚠ 실행법: 아래 전체를 "한 번에" 실행한다. 단일 트랜잭션 안에서
--   savepoint로 각 테스트를 격리하고, 마지막 rollback으로 전부 정리한다.
--   (PostgreSQL은 트랜잭션 중첩 불가 → savepoint로 준비 데이터 유지 + 테스트 롤백.)
--
-- 원리: 익명 동작은 `set local role anon`으로 흉내 낸다. SET LOCAL과 DML은
--   savepoint 복귀 시 함께 되돌아가므로, 준비 글(트랜잭션 시작부 INSERT)은 유지된다.
--   관리자(ib_is_admin) 동작은 라이브 anon/authed role로는 흉내 낼 수 없어(claims 부재)
--   'postgres'(테이블 소유자, RLS 우회 role)로 실행되는 준비/확인 구간에서 검증한다.
-- =============================================================

begin;

-- [준비] 게시/미게시 게이터 글 1건씩 + 파일 1건 (owner role = RLS 우회로 INSERT)
insert into ib_data_posts (id, slug, title, summary, is_published)
values ('00000000-0000-0000-0000-0000000000d1', '_rls_pub',   '공개 데이터글',   '공개 요약', true);
insert into ib_data_posts (id, slug, title, summary, is_published)
values ('00000000-0000-0000-0000-0000000000d2', '_rls_draft', '비공개 데이터초안', '초안 요약', false);
insert into ib_data_files (id, post_id, kind, file_name, storage_path, is_primary, version, is_current)
values ('00000000-0000-0000-0000-0000000000f1',
        '00000000-0000-0000-0000-0000000000d1', 'excel',
        'sample.xlsx', 'datalab/00000000-0000-0000-0000-0000000000d1/v1_sample.xlsx',
        true, 1, true);

-- D1: anon은 게시글만 본다 (기대: '공개 데이터글' 1행만 — d2 미노출)
savepoint d1;
  set local role anon;
  select slug, is_published from ib_data_posts
   where id in ('00000000-0000-0000-0000-0000000000d1',
                '00000000-0000-0000-0000-0000000000d2');
rollback to savepoint d1;

-- D2: anon 게시글 INSERT 차단 (기대: RLS 에러 — new row violates row-level security)
--   ※ 에러가 정상이라 savepoint를 즉시 복귀. (에러 발생 시 트랜잭션 중단 방지용 분리)
savepoint d2;
  set local role anon;
  -- 아래는 반드시 실패해야 한다. 성공하면 정책 결함.
  insert into ib_data_posts (slug, title) values ('_rls_anon', '익명작성 시도');
rollback to savepoint d2;

-- D3: anon 게시글 UPDATE 차단 (기대: UPDATE 0 — 쓰기 정책은 admin만)
savepoint d3;
  set local role anon;
  update ib_data_posts set title = '변조'
   where id = '00000000-0000-0000-0000-0000000000d1';
rollback to savepoint d3;

-- D4: anon 게시글 DELETE 차단 (기대: DELETE 0)
savepoint d4;
  set local role anon;
  delete from ib_data_posts where id = '00000000-0000-0000-0000-0000000000d1';
rollback to savepoint d4;

-- D5: anon 조회수 RPC 허용 + 게시글만 +1 (기대: d1.view_count=1, d2.view_count=0)
savepoint d5;
  set local role anon;
  select ib_increment_data_view('00000000-0000-0000-0000-0000000000d1');
  select ib_increment_data_view('00000000-0000-0000-0000-0000000000d2');
  reset role;  -- 결과 확인은 권한 role로
  select id, view_count from ib_data_posts
   where id in ('00000000-0000-0000-0000-0000000000d1',
                '00000000-0000-0000-0000-0000000000d2')
   order by id;   -- 기대: d1.view_count=1, d2.view_count=0
rollback to savepoint d5;

-- D6: ib_data_files 익명 읽기 허용 (기대: 1행 — 파일 메타는 공개)
savepoint d6;
  set local role anon;
  select file_name, kind from ib_data_files
   where id = '00000000-0000-0000-0000-0000000000f1';
rollback to savepoint d6;

-- D7: ib_data_files 익명 INSERT 차단 (기대: RLS 에러)
savepoint d7;
  set local role anon;
  insert into ib_data_files (post_id, kind, file_name, storage_path)
  values ('00000000-0000-0000-0000-0000000000d1', 'excel', 'x.xlsx', 'datalab/x/x.xlsx');
rollback to savepoint d7;

-- D8: ib_data_files 익명 UPDATE 차단 (기대: UPDATE 0)
savepoint d8;
  set local role anon;
  update ib_data_files set note = '변조'
   where id = '00000000-0000-0000-0000-0000000000f1';
rollback to savepoint d8;

-- D9: ib_data_files 익명 DELETE 차단 (기대: DELETE 0)
savepoint d9;
  set local role anon;
  delete from ib_data_files where id = '00000000-0000-0000-0000-0000000000f1';
rollback to savepoint d9;

-- D10: 클레임 없는 anon은 관리자 아님 (기대: false)
savepoint d10;
  set local role anon;
  select ib_is_admin() as should_be_false;
rollback to savepoint d10;

rollback;  -- 전체 정리 — 아무것도 커밋되지 않음

-- =============================================================
-- 관리자(admin) CUD 허용 확인 방법 (라이브 환경, 별도 수동):
--   관리자 세션(ib_admins에 등록된 user_id의 JWT)에서 anon 키가 아닌 인증된 클라이언트로
--   INSERT/UPDATE/DELETE ib_data_posts, ib_data_files 를 호출하면 통과해야 한다.
--   SQL Editor는 기본 postgres(RLS 우회)라 정책 통과 여부를 그대로 검증하지 못하므로,
--   앱의 Route Handler(requireAdmin + service_role) 경로 또는 실제 관리자 JWT로 확인한다.
--
-- 결과 기대표:
--   D1=1행(공개만) | D2=RLS에러 | D3=UPDATE 0 | D4=DELETE 0 | D5=d1:1,d2:0
--   D6=1행 | D7=RLS에러 | D8=UPDATE 0 | D9=DELETE 0 | D10=false
--   (D2/D7은 에러가 "정상". 성공하면 정책 결함 → datalab_schema.sql 재검토.)
-- 하나라도 불일치 시 datalab_schema.sql의 해당 정책/함수를 재검토한다.
-- =============================================================
