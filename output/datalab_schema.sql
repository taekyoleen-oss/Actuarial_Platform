-- =============================================================
-- Insurance Insights Board — datalab_schema.sql
-- 새 섹션 "데이터 예제/분석(DataLab)". 설계 스펙 _workspace/datalab_design_spec.md §1 기준.
-- db-architect / supabase-rls 스킬 적용. 멱등(재실행 가능).
--
-- ⚠ 선행 조건: 반드시 기존 output/schema.sql을 먼저 실행한 뒤 이 파일을 실행한다.
--   이 스크립트는 기존 함수 ib_touch_updated_at() (updated_at 트리거)와 ib_is_admin()
--   (관리자 판별)을 재사용하며 재정의하지 않는다. 두 함수는 schema.sql에 정의되어 있다.
--
-- 실행 방법: Supabase SQL Editor에서 위→아래 순서로 실행.
-- 실행 순서: 1.extensions → 2.tables → 3.functions(RPC) → 4.RLS/policies → 5.storage(주석)
--
-- [공존 정책] 기존 "보험 뉴스" 프로젝트(hkrxnkntapcychtbxpmv)에 ADDITIVE로 추가한다.
--   - 신규 객체는 ib_data_ 프리픽스(ib_ 격리 규칙 준수) → 기존 ib_/ins_ 테이블과 무충돌.
--   - 이 스크립트는 기존 객체를 DROP/ALTER/재정의 하지 않는다
--     (create if not exists / drop policy if exists 는 신규 ib_data_ 대상만).
--   - Storage 버킷은 신설하지 않고 기존 ib-attachments 를 재사용한다(5절 주석 참조).
-- =============================================================

-- 1. extensions ------------------------------------------------
create extension if not exists pgcrypto;  -- gen_random_uuid() (schema.sql와 중복 무해)

-- 2. tables ----------------------------------------------------
-- 데이터 예제/분석 게시글: 출처·모델·도구·구조화 content(jsonb)를 담는다.
create table if not exists ib_data_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,          -- URL용 kebab-case
  title        text not null,
  summary      text,                          -- 카드 "데이터 내용" 1~2줄
  source_name  text,                          -- 출처 표시명 (예: 통계청 KOSIS)
  source_url   text,
  models       text[] not null default '{}',  -- 분석 모델 태그 (예: 회귀분석, GLM)
  tools        text[] not null default '{}',  -- 도구 태그 (예: Excel 함수, VBA, Python in Excel)
  content      jsonb not null default '{}',   -- DataPostContent 구조 (spec §2)
  view_count   int not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- 인덱스: 목록 조회(공개 + 최신순). slug 는 unique 제약으로 조회 커버.
create index if not exists ib_data_posts_published_idx
  on ib_data_posts(is_published, created_at desc);

-- 게시글에 연결된 파일(엑셀 워크북/첨부). 엑셀은 버전링(원본 v1 보존 + 웹 저장본 v2+).
create table if not exists ib_data_files (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references ib_data_posts(id) on delete cascade,
  kind         text not null check (kind in ('excel','pdf','image','text','code','other')),
  file_name    text not null,
  storage_path text not null,                 -- ib-attachments 버킷 내 경로 (datalab/{post_id}/…)
  mime_type    text,
  file_size    bigint,
  is_primary   boolean not null default false, -- 대표 엑셀 워크북 여부
  version      int not null default 1,         -- primary excel 버전 (첨부는 항상 1)
  is_current   boolean not null default true,  -- primary excel 최신 버전 플래그
  note         text,
  created_at   timestamptz not null default now()
);
-- 인덱스: 게시글별 파일 조회, 현재 대표 워크북(is_primary && is_current) 조회.
create index if not exists ib_data_files_post_idx on ib_data_files(post_id);
create index if not exists ib_data_files_primary_idx
  on ib_data_files(post_id, is_primary, is_current);

-- updated_at 자동 갱신 트리거 — 기존 함수 ib_touch_updated_at() 재사용(재정의 금지).
--   (함수는 schema.sql에 정의됨. 선행 실행 필수.)
drop trigger if exists ib_data_posts_touch on ib_data_posts;
create trigger ib_data_posts_touch before update on ib_data_posts
  for each row execute function ib_touch_updated_at();

-- 3. functions (RPC) -------------------------------------------
-- 조회수 증가: 익명에게 ib_data_posts UPDATE 권한을 주지 않기 위한 우회 (게시된 글만).
--   기존 ib_increment_view 와 동일 패턴(security definer + search_path 고정).
create or replace function ib_increment_data_view(p_post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update ib_data_posts set view_count = view_count + 1
  where id = p_post_id and is_published = true;
$$;
grant execute on function ib_increment_data_view(uuid) to anon, authenticated;

-- 4. RLS + policies --------------------------------------------
-- ib_data_posts: 공개는 게시글만, 관리자는 전체. 쓰기 관리자(ib_is_admin 재사용).
alter table ib_data_posts enable row level security;
drop policy if exists ib_data_posts_select on ib_data_posts;
create policy ib_data_posts_select on ib_data_posts for select
  using (is_published = true or ib_is_admin());
drop policy if exists ib_data_posts_write on ib_data_posts;
create policy ib_data_posts_write on ib_data_posts for all
  using (ib_is_admin()) with check (ib_is_admin());

-- ib_data_files: 읽기 공개(파일 메타는 공개 열람), 쓰기 관리자.
alter table ib_data_files enable row level security;
drop policy if exists ib_data_files_select on ib_data_files;
create policy ib_data_files_select on ib_data_files for select using (true);
drop policy if exists ib_data_files_write on ib_data_files;
create policy ib_data_files_write on ib_data_files for all
  using (ib_is_admin()) with check (ib_is_admin());

-- 4b. table privileges -----------------------------------------
-- RLS는 "어떤 행"을, GRANT는 "어떤 동작 유형"을 통제한다. 둘 다 필요.
-- (schema.sql §4b 패턴 준수. Supabase 기본 권한과 중복되어도 무해 — 명시적으로 고정.)
grant usage on schema public to anon, authenticated;
grant select on ib_data_posts, ib_data_files to anon, authenticated;
-- 쓰기 동작 유형은 authenticated에만 부여하고, "관리자만"이라는 행 제한은 RLS(ib_is_admin)가 담당.
grant insert, update, delete on ib_data_posts, ib_data_files to authenticated;

-- 5. storage ---------------------------------------------------
-- 신규 버킷 없음 — 기존 ib-attachments 버킷과 그 정책을 재사용한다.
--   기존 정책(schema.sql 5절)은 경로에 무관하게 버킷 단위로 적용된다:
--     - ib_attach_read : bucket_id = 'ib-attachments' 이면 SELECT 공개
--     - ib_attach_write: bucket_id = 'ib-attachments' AND ib_is_admin() 이면 CUD
--   따라서 datalab/{post_id}/{filename} 경로의 객체도 자동으로 커버된다(추가 정책 불필요).
--   서버 업로드는 service_role 키 사용(RLS 우회) — 클라이언트 노출 금지.
--   경로 규칙: datalab/{post_id}/v{n}_{base}.xlsx (웹 저장본) / datalab/{post_id}/att_{ts}_{name} (첨부)
-- =============================================================
