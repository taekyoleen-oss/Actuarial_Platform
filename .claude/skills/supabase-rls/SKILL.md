---
name: supabase-rls
description: "Supabase RLS 정책과 SECURITY DEFINER RPC를 안전하게 작성하는 스킬. 공개 SELECT + 관리자 전용 CUD + 익명 댓글 INSERT 허용/수정·삭제 차단 패턴, 관리자 판별 함수, 권한 우회 RPC(조회수 증가)를 생성·검토한다. RLS 정책, 마이그레이션, 권한, 익명 쓰기, SECURITY DEFINER, 조회수 RPC 작업이나 정책 보안 검토 시 반드시 사용. 정책 수정·재작성·보완 요청 시에도 사용."
---

# supabase-rls — RLS 정책 & SECURITY DEFINER RPC

Insurance Insights Board(`ib_` 프리픽스)의 행 수준 보안을 안전하게 작성한다. 핵심은 **최소 권한**: 익명 사용자에게 테이블 UPDATE 권한을 직접 주지 않고, 필요한 변경은 SECURITY DEFINER 함수로 우회한다.

## 언제 무엇을 적용하는가

| 상황 | 패턴 |
|------|------|
| 누구나 읽기 | `SELECT` 정책 `using (true)` 또는 조건부(`is_published = true`) |
| 관리자만 쓰기 | `INSERT/UPDATE/DELETE` 정책에 `ib_is_admin()` |
| 익명이 댓글 작성 | `INSERT` 정책 `with check (true)`, 단 `UPDATE/DELETE` 정책은 **만들지 않음**(= 차단) |
| 익명이 조회수 +1 | 테이블 UPDATE 권한 대신 `SECURITY DEFINER` RPC |

## 핵심 원칙 (Why)

- **RLS는 1차 방어선일 뿐**이다. Route Handler에서 권한·입력을 재검증한다(이중 방어). RLS만 믿고 서버 검증을 생략하지 않는다.
- **정책이 없으면 차단된다**: RLS 활성 테이블은 매칭되는 정책이 없는 동작은 거부된다. 익명 댓글 수정/삭제를 막으려면 해당 정책을 "안 만들면" 된다 — 별도 deny 정책 불필요.
- **SECURITY DEFINER는 함수 소유자 권한으로 실행**된다. 그래서 익명도 조회수를 올릴 수 있다. 대신 함수 본문을 좁게(한 행, 한 컬럼만 증가) 작성해 오남용을 막는다. `search_path`를 고정해 함수 하이재킹을 예방한다.

## 관리자 판별 함수

```sql
create or replace function ib_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from ib_admins where user_id = auth.uid());
$$;
```

## 조회수 증가 RPC (익명 UPDATE 권한 없이)

```sql
create or replace function ib_increment_view(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update ib_posts set view_count = view_count + 1
  where id = p_post_id and is_published = true;
$$;
grant execute on function ib_increment_view(uuid) to anon, authenticated;
```

## 정책 작성 패턴 (테이블별)

각 테이블은 `alter table ... enable row level security;` 후 정책을 건다. 멱등 작성을 위해 `drop policy if exists`를 선행한다.

```sql
-- ib_posts: 공개는 게시된 글만, 관리자는 전체
alter table ib_posts enable row level security;
drop policy if exists ib_posts_select on ib_posts;
create policy ib_posts_select on ib_posts for select
  using (is_published = true or ib_is_admin());
drop policy if exists ib_posts_write on ib_posts;
create policy ib_posts_write on ib_posts for all
  using (ib_is_admin()) with check (ib_is_admin());

-- ib_comments: 읽기 공개, 익명 INSERT 허용, UPDATE/DELETE 정책 없음(=차단), 삭제는 관리자만
alter table ib_comments enable row level security;
drop policy if exists ib_comments_select on ib_comments;
create policy ib_comments_select on ib_comments for select using (true);
drop policy if exists ib_comments_insert on ib_comments;
create policy ib_comments_insert on ib_comments for insert with check (true);
drop policy if exists ib_comments_delete on ib_comments;
create policy ib_comments_delete on ib_comments for delete using (ib_is_admin());
-- (UPDATE 정책을 만들지 않음 → 익명/사용자 수정 불가)
```

> `ib_categories`, `ib_attachments`는 `select using(true)` + `for all using(ib_is_admin())`. `ib_admins`는 `select using(ib_is_admin())`, 쓰기 정책 없음(시드/수동).

## 검증 쿼리 (반드시 함께 산출)

정책마다 통과/차단 케이스를 `output/rls_tests.sql`에 남긴다. `set role anon;` / `set local "request.jwt.claims"`로 역할을 흉내 내거나, 라이브 환경에서 anon 키로 실제 호출하여 확인한다.

| 케이스 | 기대 |
|--------|------|
| anon SELECT `ib_posts`(published) | 통과 |
| anon SELECT `ib_posts`(미게시) | 0행 |
| anon INSERT `ib_comments` | 통과 |
| anon UPDATE/DELETE `ib_comments` | 차단(0행/오류) |
| anon UPDATE `ib_posts` | 차단 |
| anon `select ib_increment_view(id)` | 통과 + view_count +1 |

## 상세 패턴

테이블별 전체 정책 세트와 엣지 케이스는 `references/rls-patterns.md`를 필요 시 Read 한다.
