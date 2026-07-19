-- /datalab 사전 콘텐츠 오버라이드 — 관리자 팝업 편집(2026-07-19)
-- 정적 TS 사전(statMethods·methodTheory·excelFunctionsData) 위에 덮어쓰는 텍스트 필드 저장.
-- 컨벤션: ib_ 프리픽스 additive, 공개 SELECT + 관리자 전용 CUD(ib_admins), 기존 객체 무변경.
-- 적용: Supabase SQL Editor(프로젝트 hkrxnkntapcychtbxpmv)에서 실행.

create table if not exists public.ib_datalab_overrides (
  -- 'method:<id>' | 'excel:<id>' | 'theory:<id>'  (예: method:regularized)
  key text primary key
    check (key ~ '^(method|excel|theory):[a-z0-9-]{1,64}$'),
  -- 편집 가능한 텍스트 필드만 담는다(코드·수식은 제외):
  -- { intro?, tips?, summary?, sectionDescs?: (text|null)[],
  --   definition?, usage?, interpretation?, exampleExplains?: (text|null)[] }
  data jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);

comment on table public.ib_datalab_overrides is
  '/datalab 사전(분석 방법·엑셀 함수·이론) 텍스트 설명의 관리자 오버라이드. 원본은 코드(lib/*.ts), 이 표는 덮어쓰기 레이어.';

alter table public.ib_datalab_overrides enable row level security;

-- 공개 읽기(게시된 사전 설명은 공개 콘텐츠)
drop policy if exists "ib_datalab_overrides_select_all" on public.ib_datalab_overrides;
create policy "ib_datalab_overrides_select_all"
  on public.ib_datalab_overrides for select
  using (true);

-- 관리자 전용 쓰기 — ib_admins 등록 + 로그인 세션(auth.uid()) 이중 확인
drop policy if exists "ib_datalab_overrides_admin_insert" on public.ib_datalab_overrides;
create policy "ib_datalab_overrides_admin_insert"
  on public.ib_datalab_overrides for insert
  with check (exists (select 1 from public.ib_admins a where a.user_id = auth.uid()));

drop policy if exists "ib_datalab_overrides_admin_update" on public.ib_datalab_overrides;
create policy "ib_datalab_overrides_admin_update"
  on public.ib_datalab_overrides for update
  using (exists (select 1 from public.ib_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.ib_admins a where a.user_id = auth.uid()));

drop policy if exists "ib_datalab_overrides_admin_delete" on public.ib_datalab_overrides;
create policy "ib_datalab_overrides_admin_delete"
  on public.ib_datalab_overrides for delete
  using (exists (select 1 from public.ib_admins a where a.user_id = auth.uid()));

-- 익명은 조회만(테이블 UPDATE 권한 금지 컨벤션)
grant select on public.ib_datalab_overrides to anon;
grant select, insert, update, delete on public.ib_datalab_overrides to authenticated;
