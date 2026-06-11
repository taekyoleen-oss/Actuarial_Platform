import Link from "next/link";
import { excerpt, formatDate, pastelFor } from "@/lib/utils";
import type { PostListItem } from "@/types";

// 파스텔 색감의 콘텐츠 카드 — 카테고리·제목·요약·메타를 카드 안에 정리.
// 색은 게시물 id로 자동·일관 배정되어 카드마다 약간씩 다른 색감.
// 입체감: 2단 소프트 섀도 + hover lift. 타이틀은 고딕 600·로고 블루로 본문과 구별.
export function PostCard({ post }: { post: PostListItem }) {
  const c = pastelFor(post.id);
  return (
    <Link href={`/posts/${post.id}`} className="group block h-full">
      <article
        className="flex h-full flex-col rounded-cover border p-5 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla group-hover:-translate-y-1 group-hover:shadow-card-hover"
        style={{ backgroundColor: c.bg, borderColor: c.border }}
      >
        <span className="inline-flex w-fit rounded bg-white/70 px-2 py-0.5 text-xs font-medium text-tertiary">
          {post.category?.name}
        </span>
        <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-sky group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
          {excerpt(post.content, 150)}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-tertiary">
          <span>{formatDate(post.created_at)}</span>
          <span>·</span>
          <span>조회 {post.view_count}</span>
        </div>
      </article>
    </Link>
  );
}
