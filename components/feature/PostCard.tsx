import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { excerpt, formatDate } from "@/lib/utils";
import type { PostListItem } from "@/types";

// 카드 썸네일: (b) 카테고리별 모노크롬 커버 + 본문 발췌 (설계 기본안)
export function PostCard({ post }: { post: PostListItem }) {
  return (
    <Link href={`/posts/${post.id}`} className="group block">
      <article className="overflow-hidden rounded-cover">
        <div className="cover-mono flex aspect-[16/9] items-end p-4">
          <span className="text-xs font-medium uppercase tracking-wide">
            {post.category?.name}
          </span>
        </div>
        <div className="py-4">
          <Badge>{post.category?.name}</Badge>
          <h3 className="mt-2 text-[17px] font-medium text-foreground group-hover:text-primary">
            {post.title}
          </h3>
          <p className="mt-1.5 text-sm text-tertiary">
            {excerpt(post.content)}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-tertiary">
            <span>{formatDate(post.created_at)}</span>
            <span>·</span>
            <span>조회 {post.view_count}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
