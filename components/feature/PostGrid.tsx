import { PostCard } from "./PostCard";
import type { PostListItem } from "@/types";

// 반응형: Mobile 1열 / Tablet 2열 / Desktop+ 3열
export function PostGrid({ posts }: { posts: PostListItem[] }) {
  if (posts.length === 0) {
    return (
      <p className="py-20 text-center text-sm text-tertiary">
        게시된 자료가 없습니다.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
