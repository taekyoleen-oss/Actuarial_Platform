-- =============================================================
-- Insurance Insights Board — rls_tests.sql  (savepoint 버전)
-- 사전: schema.sql + seed.sql 실행 완료(ib_categories 1건 이상 존재).
--
-- ⚠ 실행법: 아래 전체를 "한 번에" 실행한다. 단일 트랜잭션 안에서
--   savepoint로 각 테스트를 격리하고, 마지막 rollback으로 전부 정리한다.
--   (PostgreSQL은 트랜잭션 중첩 불가 → 과거의 begin/rollback 반복은
--    준비 데이터까지 롤백되어 FK 오류가 났다. savepoint로 해결.)
--
-- 원리: 익명 동작은 `set local role anon`으로 흉내 낸다. SET LOCAL과 DML은
--   savepoint 복귀 시 함께 되돌아가므로, 준비 글(트랜잭션 시작부 INSERT)은 유지된다.
-- =============================================================

begin;

-- [준비] 게시/미게시 글 1건씩 (첫 번째 카테고리 사용 — 슬러그 비의존)
insert into ib_posts (id, category_id, title, content, is_published)
select '00000000-0000-0000-0000-0000000000a1', c.id, '공개글', '본문', true
  from ib_categories c order by c.sort_order limit 1;
insert into ib_posts (id, category_id, title, content, is_published)
select '00000000-0000-0000-0000-0000000000a2', c.id, '비공개 초안', '본문', false
  from ib_categories c order by c.sort_order limit 1;

-- T1: anon은 게시글만 본다 (기대: '공개글' 1행만)
savepoint t1;
  set local role anon;
  select title, is_published from ib_posts
   where id in ('00000000-0000-0000-0000-0000000000a1',
                '00000000-0000-0000-0000-0000000000a2');
rollback to savepoint t1;

-- T2: anon 댓글 INSERT 허용 (기대: INSERT 0 1 = 성공)
savepoint t2;
  set local role anon;
  insert into ib_comments (post_id, nickname, content)
  values ('00000000-0000-0000-0000-0000000000a1', '익명', '테스트 댓글');
rollback to savepoint t2;

-- T3: anon 댓글 UPDATE 차단 (기대: UPDATE 0 — 정책 없음)
savepoint t3;
  set local role anon;
  update ib_comments set content = '변조';
rollback to savepoint t3;

-- T4: anon 댓글 DELETE 차단 (기대: DELETE 0 — 관리자만)
savepoint t4;
  set local role anon;
  delete from ib_comments;
rollback to savepoint t4;

-- T5: anon 게시물 UPDATE 차단 (기대: UPDATE 0)
savepoint t5;
  set local role anon;
  update ib_posts set title = '변조'
   where id = '00000000-0000-0000-0000-0000000000a1';
rollback to savepoint t5;

-- T7: anon 조회수 RPC 허용 + 게시글만 +1 (기대: a1=1, a2=0)
savepoint t7;
  set local role anon;
  select ib_increment_view('00000000-0000-0000-0000-0000000000a1');
  select ib_increment_view('00000000-0000-0000-0000-0000000000a2');
  reset role;  -- 결과 확인은 권한 role로
  select id, view_count from ib_posts
   where id in ('00000000-0000-0000-0000-0000000000a1',
                '00000000-0000-0000-0000-0000000000a2')
   order by id;   -- 기대: a1.view_count=1, a2.view_count=0
rollback to savepoint t7;

-- T9: 클레임 없는 anon은 관리자 아님 (기대: false)
savepoint t9;
  set local role anon;
  select ib_is_admin() as should_be_false;
rollback to savepoint t9;

rollback;  -- 전체 정리 — 아무것도 커밋되지 않음

-- =============================================================
-- 별도 수동 확인(에러가 정상이라 트랜잭션을 끊음 → 따로 1회 실행):
--   begin;
--     set local role anon;
--     insert into ib_posts (category_id, title)
--       values ((select id from ib_categories limit 1), '익명작성');
--     -- 기대: ERROR new row violates row-level security policy (T6: 익명 작성 차단)
--   rollback;
--
-- 결과 기대표: T1=1행 | T2=성공 | T3=0 | T4=0 | T5=0 | T7=a1:1,a2:0 | T9=false | T6=RLS 에러
-- 하나라도 불일치 시 schema.sql의 해당 정책/함수를 재검토한다.
-- =============================================================
