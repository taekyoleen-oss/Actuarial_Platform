-- =============================================================
-- Insurance Insights Board — seed.sql
-- 카테고리 3개 시드 (설계서 §1). schema.sql 실행 후 실행.
-- 멱등: slug 충돌 시 이름/설명/순서 갱신.
-- =============================================================
insert into ib_categories (slug, name, description, sort_order) values
  ('exclusive-rights', '보험 배타적 사용권 분석', '신상품 배타적 사용권 관련 분석 자료', 1),
  ('global',           '해외 주요 보험 정보·자료', '해외 보험 시장·제도·연구 자료 분석',   2),
  ('domestic',         '국내 보험 정보·분석',     '국내 보험 관련 정보 및 분석',          3)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      sort_order = excluded.sort_order;

-- 관리자 시드(수동): auth.users에 계정 생성 후 user_id를 채워 실행.
-- insert into ib_admins (user_id, email)
-- values ('<auth.users.id>', '<admin email>')
-- on conflict (user_id) do nothing;
