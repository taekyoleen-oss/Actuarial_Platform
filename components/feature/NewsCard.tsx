import { Badge } from "@/components/ui/badge";
import { cleanNewsText, excerpt, formatDate } from "@/lib/utils";
import type { NewsArticle } from "@/types";

// 뉴스 카드 — 원문 링크는 외부(새 탭). 보드 Tesla 스타일 유지.
export function NewsCard({ article }: { article: NewsArticle }) {
  const title = cleanNewsText(article.title);
  const body = cleanNewsText(article.summary || article.snippet);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-b border-border py-5"
    >
      <div className="flex items-center gap-2 text-xs text-tertiary">
        {article.category && <Badge>{article.category}</Badge>}
        {article.source && <span>{article.source}</span>}
        {article.published_at && (
          <>
            <span>·</span>
            <span>{formatDate(article.published_at)}</span>
          </>
        )}
      </div>
      <h3 className="mt-2 text-[17px] font-medium text-foreground group-hover:text-primary">
        {title}
      </h3>
      {body && (
        <p className="mt-1.5 text-sm text-tertiary">{excerpt(body, 160)}</p>
      )}
    </a>
  );
}
