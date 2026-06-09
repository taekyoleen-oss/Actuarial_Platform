# RLS 패턴 상세 — Insurance Insights Board

5개 테이블의 전체 정책 세트. `output/schema.sql` 작성 시 이 순서를 따른다.

## 실행 순서
1. extensions (`pgcrypto` for `gen_random_uuid()`)
2. tables
3. functions (`ib_is_admin`, `ib_increment_view`)
4. enable RLS + policies
5. storage bucket + policies
6. seed (별도 `output/seed.sql`)

## ib_categories
```sql
alter table ib_categories enable row level security;
drop policy if exists ib_categories_select on ib_categories;
create policy ib_categories_select on ib_categories for select using (true);
drop policy if exists ib_categories_write on ib_categories;
create policy ib_categories_write on ib_categories for all
  using (ib_is_admin()) with check (ib_is_admin());
```

## ib_posts
공개는 `is_published = true`만, 관리자는 전체 (SKILL.md 본문 참조). UPDATE 권한은 관리자 정책으로만 부여되고, 익명 조회수 증가는 `ib_increment_view` RPC로 우회한다.

## ib_attachments
```sql
alter table ib_attachments enable row level security;
drop policy if exists ib_attachments_select on ib_attachments;
create policy ib_attachments_select on ib_attachments for select using (true);
drop policy if exists ib_attachments_write on ib_attachments;
create policy ib_attachments_write on ib_attachments for all
  using (ib_is_admin()) with check (ib_is_admin());
```

## ib_comments
읽기 공개, 익명 INSERT 허용, UPDATE 정책 없음(차단), DELETE는 관리자만 (SKILL.md 본문 참조).
입력 검증(길이 제한, rate limit)은 RLS가 아니라 Route Handler에서 처리한다 — RLS는 SQL 레벨 길이 검사에 부적합하고, IP 기반 rate limit은 DB에서 알 수 없기 때문.

## ib_admins
```sql
alter table ib_admins enable row level security;
drop policy if exists ib_admins_select on ib_admins;
create policy ib_admins_select on ib_admins for select using (ib_is_admin());
-- INSERT/UPDATE/DELETE 정책 없음: service_role 또는 SQL Editor에서 수동 시드
```

## Storage 버킷 (ib-attachments)
```sql
insert into storage.buckets (id, name, public)
values ('ib-attachments', 'ib-attachments', true)
on conflict (id) do nothing;

-- 공개 읽기
drop policy if exists ib_attach_read on storage.objects;
create policy ib_attach_read on storage.objects for select
  using (bucket_id = 'ib-attachments');
-- 관리자만 업로드/삭제 (서버는 service_role로 RLS 우회)
drop policy if exists ib_attach_write on storage.objects;
create policy ib_attach_write on storage.objects for all
  using (bucket_id = 'ib-attachments' and ib_is_admin())
  with check (bucket_id = 'ib-attachments' and ib_is_admin());
```
경로 규칙: `{category_slug}/{post_id}/{filename}`.

## 흔한 함정
- RLS를 enable 했는데 정책이 하나도 없으면 **모든 접근이 차단**된다(관리자 포함). 최소 SELECT 정책을 항상 건다.
- `security definer` 함수에 `set search_path`를 빠뜨리면 스키마 하이재킹 위험. 항상 고정한다.
- `grant execute`를 빠뜨리면 anon이 RPC를 호출하지 못한다.
- service_role 키는 RLS를 우회한다 → 서버 코드에서만 사용하고 클라이언트에 절대 노출하지 않는다.
