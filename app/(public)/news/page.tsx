import { NewsCard } from "@/components/feature/NewsCard";
import { NewsFilters } from "@/components/feature/NewsFilters";
import { listNews } from "@/lib/news";

export const revalidate = 300; // 뉴스는 크론 수집 → 5분 캐시

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const articles = await listNews({ category: sp.category, q: sp.q });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-medium text-foreground">보험 뉴스</h1>
        <p className="mt-1.5 text-sm text-tertiary">
          국내 보험 뉴스를 자동 수집·요약하여 제공합니다.
        </p>
      </header>

      <NewsFilters current={sp.category} q={sp.q} />

      <div className="mt-8">
        {articles.length === 0 ? (
          <p className="py-20 text-center text-sm text-tertiary">
            표시할 뉴스가 없습니다.
          </p>
        ) : (
          articles.map((a) => <NewsCard key={a.id} article={a} />)
        )}
      </div>
    </div>
  );
}
