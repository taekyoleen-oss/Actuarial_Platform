-- =============================================================
-- 통합 브리지 뷰 (DRAFT — 실행 금지)
-- 방향: 분리 + 브리지 뷰. 뉴스 원본 테이블은 유지하고, 합산 노출이 필요할 때만
--       게시판(ib_posts) + 뉴스를 union 하는 읽기 전용 뷰 ib_feed_v로 결합한다.
--
-- 상태: 뉴스 스키마 확인 완료(ins_news_articles). 아래 매핑은 적용 가능.
--       단, 현재 채택 UX는 "별도 /news 섹션"(직접 읽기)이므로 이 뷰는 선택사항이다.
--       게시판 글 + 뉴스를 "한 목록에 섞어" 보여줄 때만 이 뷰를 생성·사용한다.
-- =============================================================

-- 공통 피드 표시 계약 (feed contract)
--   id           text        : 'board:<uuid>' | 'news:<id>'  (소스 프리픽스로 전역 유일)
--   source       text        : 'board' | 'news'
--   title        text
--   summary      text        : 게시판=ib_posts.summary, 뉴스=요약/본문 발췌
--   url          text        : 게시판='/posts/'||id, 뉴스=원문 링크
--   published_at timestamptz

-- ※ 보안: PG15+에서 security_invoker=on 으로 두면 하위 테이블 RLS가 그대로 적용된다.
--    (게시판은 is_published, 뉴스는 공개 정책을 각각 따르게 하여 비공개 누출 방지)

create or replace view ib_feed_v
  with (security_invoker = on)  -- 하위 RLS 존중
as
-- ----- 게시판(확정) -----
select
  'board:' || p.id::text          as id,
  'board'::text                   as source,
  p.title                         as title,
  p.summary                       as summary,
  '/posts/' || p.id::text         as url,
  p.created_at                    as published_at
from ib_posts p
where p.is_published = true

union all

-- ----- 뉴스(ins_news_articles 매핑 — 스키마 확인 완료) -----
select
  'news:' || n.id::text              as id,
  'news'::text                       as source,
  n.title                            as title,         -- UI에서 <b>/엔티티 정리(cleanNewsText)
  coalesce(n.summary, n.snippet)     as summary,
  n.url                              as url,
  n.published_at                     as published_at
from ins_news_articles n
where n.is_representative = true      -- 대표 기사만(유사 기사 클러스터 제외)
;

-- 적용 후 사용 예 (UI는 source로 분기):
--   select * from ib_feed_v order by published_at desc limit 30;

-- =============================================================
-- 합산(통합 피드) 사용 전 체크리스트
--  ☑ 뉴스 테이블/컬럼 매핑 완료 (ins_news_articles)
--  ☑ published_at 타입 = timestamptz (캐스팅 불필요)
--  ☑ 공개 범위: ins_news_articles는 RLS "읽기 공개" → security_invoker로 일관
--  □ 성능: ins_news_articles published_at 정렬 — 필요 시 인덱스/머티리얼라이즈드 뷰
--  □ rls_tests.sql에 ib_feed_v 비공개 누출 차단 케이스 추가
--  □ UI에서 source='news' 카드의 title은 cleanNewsText로 정리
-- =============================================================
