# 보험 뉴스 DB 통합 준비 (Insurance Insights Board ↔ 기존 뉴스 프로젝트)

## 현황
- 대상 프로젝트: `https://hkrxnkntapcychtbxpmv.supabase.co` (기존 = 보험 뉴스 제공 DB)
- 기존 앱: `c:\00 App Project\insurance-article` (`insurance-news-dashboard`, Next 16 + Tailwind 4, Vercel 배포 + 크론 수집). **그대로 유지**.
- 뉴스 데이터: `ins_news_articles` 테이블 (RLS **읽기 공개**). 컬럼: id, title, url, summary, summary_short, snippet, source, published_at, category(생명보험/손해보험/제도·규제/상품/기타), edition(08:00/14:00), edition_date, cluster_id, is_representative.
- 본 게시판은 이 **동일 프로젝트에 ADDITIVE로 추가**(`ib_` 격리, 충돌 없음).

## 구현됨 (2026-06-09): 보드 내 "보험 뉴스" 섹션
- 보드 앱에 내비 항목 "보험 뉴스" + `/news` 페이지 추가.
- `lib/news.ts`의 `listNews()`가 **공유 anon 클라이언트로 `ins_news_articles`를 직접 읽음**(대표 기사만, 카테고리/검색 필터). 데이터 복제 없음 = 단일 출처.
- 뉴스 앱은 계속 수집(크론), 보드는 읽기만 → 같이 작동. Next/Tailwind 버전 충돌 없음(앱 이식 안 함).
- 제목은 `cleanNewsText()`로 `<b>`/HTML 엔티티 정리.

## 공존 안전성 (이미 충족)
| 항목 | 격리 방식 |
|------|----------|
| 테이블 | `ib_categories/posts/attachments/comments/admins` |
| 함수 | `ib_is_admin()`, `ib_increment_view()` |
| 정책 | `ib_*` 이름 |
| 버킷 | `ib-attachments` |
| 마이그레이션 | 기존 객체 DROP/ALTER 없음 (ib_ 대상만 생성) |

→ `output/schema.sql`을 기존 프로젝트 SQL Editor에서 실행해도 뉴스 테이블은 영향 없음.

## 향후 합산 운영 — 결정: **분리 + 브리지 뷰 (B)**
실제 설계는 **뉴스 스키마 읽기 권한 확보 후** db-architect가 확정한다. 현재는 준비만.

### B. 분리 + 브리지 뷰 (채택)
뉴스는 원본 테이블 유지, 게시판은 별도. 합산 노출이 필요할 때만 `union` 뷰로 결합.
- **지금 준비됨**: 공통 표시 필드(id, source, title, summary, url, published_at)를 정의한 `ib_feed_v` 뷰 **초안** → `output/integration_bridge_view.draft.sql` (실행 금지, 뉴스 측은 플레이스홀더).
- ib_posts 스키마는 **변경하지 않음**(source/external_ref 컬럼 미추가). 결합도 최소.
- 보안: PG15+ `security_invoker = on`으로 하위 테이블 RLS 존중(비공개 누출 방지). UI는 `source`로 분기.

### (참고) 대안 A — 통합 콘텐츠 모델
뉴스를 `ib_posts`(source='news')로 ETL하여 단일 테이블화. 목록/검색 UI 재사용에 유리하나 결합도가 높아 이번엔 미채택. 필요 시 재검토.

## 다음 액션(합산 결정 시)
1. 뉴스 프로젝트 스키마 읽기(anon/service 키 또는 MCP) → 테이블·컬럼 매핑표 작성
2. 위 A/B 중 택1로 db-architect가 마이그레이션/뷰 설계
3. RLS 재검토(뉴스 테이블 공개 범위 ↔ ib_ 정책 일관성)
4. `supabase-sync` 스킬로 적용 + `rls_tests.sql` 확장
