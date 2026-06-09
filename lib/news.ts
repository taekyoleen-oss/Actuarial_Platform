import { createClient } from "@/lib/supabase/server";
import type { NewsArticle } from "@/types";

/**
 * 보험 뉴스 조회 — 기존 뉴스 대시보드의 ins_news_articles(읽기 공개)를 직접 읽는다.
 * 데이터 복제 없이 단일 출처. 대표 기사(is_representative=true)만 노출.
 */
export async function listNews(opts: {
  category?: string;
  q?: string;
  limit?: number;
}): Promise<NewsArticle[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ins_news_articles")
    .select(
      "id, title, url, summary, summary_short, snippet, source, published_at, category, edition, edition_date, is_representative"
    )
    .eq("is_representative", true)
    .order("published_at", { ascending: false })
    .limit(opts.limit ?? 40);

  if (opts.category) query = query.eq("category", opts.category);
  if (opts.q && opts.q.trim()) {
    const term = `%${opts.q.trim()}%`;
    query = query.or(`title.ilike.${term},summary.ilike.${term},snippet.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) return [];
  return (data as NewsArticle[]) ?? [];
}
