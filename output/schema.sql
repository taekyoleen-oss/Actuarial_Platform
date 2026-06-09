-- =============================================================
-- Insurance Insights Board — schema.sql
-- 설계서 v1.1 §3 기준. db-architect / supabase-rls 스킬 적용.
-- 멱등(재실행 가능). Supabase SQL Editor에서 위→아래 순서로 실행.
-- 실행 순서: 1.extensions → 2.tables → 3.functions → 4.RLS/policies → 5.storage
--
-- [공존 정책] 기존 "보험 뉴스" 프로젝트(hkrxnkntapcychtbxpmv)에 ADDITIVE로 추가한다.
--   - 모든 객체는 ib_ 프리픽스 + 고유 버킷명(ib-attachments)으로 격리 → 기존 테이블과 무충돌.
--   - 이 스크립트는 기존 객체를 DROP/ALTER 하지 않는다(create if not exists / drop policy if exists는 ib_ 대상만).
--   - 향후 뉴스 데이터 합산 운영은 docs/domain/integration-news.md 참조(현재는 미연결).
-- =============================================================

-- 1. extensions ------------------------------------------------
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- 2. tables ----------------------------------------------------
create table if not exists ib_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists ib_posts (
  id                   uuid primary key default gen_random_uuid(),
  category_id          uuid not null references ib_categories(id) on delete restrict,
  title                text not null,
  content              text not null default '',
  summary              text,
  summary_generated_at timestamptz,
  view_count           int  not null default 0,
  author_name          text,
  is_published         boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists ib_posts_category_idx  on ib_posts(category_id);
create index if not exists ib_posts_published_idx on ib_posts(is_published, created_at desc);

create table if not exists ib_attachments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references ib_posts(id) on delete cascade,
  file_name    text not null,
  storage_path text not null,
  mime_type    text,
  file_size    bigint,
  created_at   timestamptz not null default now()
);
create index if not exists ib_attachments_post_idx on ib_attachments(post_id);

create table if not exists ib_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references ib_posts(id) on delete cascade,
  nickname   text not null,
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists ib_comments_post_idx on ib_comments(post_id, created_at);

create table if not exists ib_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거 (ib_posts)
create or replace function ib_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists ib_posts_touch on ib_posts;
create trigger ib_posts_touch before update on ib_posts
  for each row execute function ib_touch_updated_at();

-- 3. functions -------------------------------------------------
-- 관리자 판별: auth.uid()가 ib_admins에 존재하는가
create or replace function ib_is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from ib_admins where user_id = auth.uid());
$$;

-- 조회수 증가: 익명에게 ib_posts UPDATE 권한을 주지 않기 위한 우회 (게시된 글만)
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

-- 4. RLS + policies --------------------------------------------
-- ib_categories: 읽기 공개, 쓰기 관리자
alter table ib_categories enable row level security;
drop policy if exists ib_categories_select on ib_categories;
create policy ib_categories_select on ib_categories for select using (true);
drop policy if exists ib_categories_write on ib_categories;
create policy ib_categories_write on ib_categories for all
  using (ib_is_admin()) with check (ib_is_admin());

-- ib_posts: 공개는 게시글만, 관리자는 전체. 쓰기 관리자.
alter table ib_posts enable row level security;
drop policy if exists ib_posts_select on ib_posts;
create policy ib_posts_select on ib_posts for select
  using (is_published = true or ib_is_admin());
drop policy if exists ib_posts_write on ib_posts;
create policy ib_posts_write on ib_posts for all
  using (ib_is_admin()) with check (ib_is_admin());

-- ib_attachments: 읽기 공개, 쓰기 관리자
alter table ib_attachments enable row level security;
drop policy if exists ib_attachments_select on ib_attachments;
create policy ib_attachments_select on ib_attachments for select using (true);
drop policy if exists ib_attachments_write on ib_attachments;
create policy ib_attachments_write on ib_attachments for all
  using (ib_is_admin()) with check (ib_is_admin());

-- ib_comments: 읽기 공개, 익명 INSERT 허용, UPDATE 정책 없음(=수정 차단), DELETE 관리자만
alter table ib_comments enable row level security;
drop policy if exists ib_comments_select on ib_comments;
create policy ib_comments_select on ib_comments for select using (true);
drop policy if exists ib_comments_insert on ib_comments;
create policy ib_comments_insert on ib_comments for insert with check (true);
drop policy if exists ib_comments_delete on ib_comments;
create policy ib_comments_delete on ib_comments for delete using (ib_is_admin());
-- (UPDATE 정책 의도적 미생성 → 익명/사용자 댓글 수정 불가)

-- ib_admins: 관리자만 조회, 쓰기 정책 없음(service_role/SQL Editor 수동 시드)
alter table ib_admins enable row level security;
drop policy if exists ib_admins_select on ib_admins;
create policy ib_admins_select on ib_admins for select using (ib_is_admin());

-- 4b. table privileges -----------------------------------------
-- RLS는 "어떤 행"을, GRANT는 "어떤 동작 유형"을 통제한다. 둘 다 필요.
-- (Supabase 기본 권한과 중복되어도 무해 — 명시적으로 고정해 환경 의존성을 제거.)
grant usage on schema public to anon, authenticated;
grant select on ib_categories, ib_posts, ib_attachments, ib_comments to anon, authenticated;
grant insert on ib_comments to anon, authenticated;            -- 익명 댓글 작성
grant delete on ib_comments to authenticated;                  -- 행 제한은 RLS(ib_is_admin)
grant insert, update, delete on ib_categories, ib_posts, ib_attachments to authenticated;
grant select on ib_admins to authenticated;
-- ib_comments UPDATE 권한은 누구에게도 부여하지 않음(정책 부재 + 권한 부재 = 이중 차단).

-- 5. storage ---------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ib-attachments', 'ib-attachments', true)
on conflict (id) do nothing;

drop policy if exists ib_attach_read on storage.objects;
create policy ib_attach_read on storage.objects for select
  using (bucket_id = 'ib-attachments');

drop policy if exists ib_attach_write on storage.objects;
create policy ib_attach_write on storage.objects for all
  using (bucket_id = 'ib-attachments' and ib_is_admin())
  with check (bucket_id = 'ib-attachments' and ib_is_admin());
-- 경로 규칙: {category_slug}/{post_id}/{filename}
-- 서버 업로드는 service_role 키 사용(RLS 우회) — 클라이언트 노출 금지.
