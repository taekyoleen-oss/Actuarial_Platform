import { PostFilters } from "@/components/feature/PostFilters";
import { PostGrid } from "@/components/feature/PostGrid";
import { listCategories, listPosts } from "@/lib/queries";
import type { SortOrder } from "@/types";

export const revalidate = 30;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const sort: SortOrder = sp.sort === "popular" ? "popular" : "latest";

  const [categories, posts] = await Promise.all([
    listCategories(),
    listPosts({ categorySlug: sp.category, q: sp.q, sort }),
  ]);

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium text-foreground">자료실</h1>
      <PostFilters
        categories={categories}
        current={sp.category}
        q={sp.q}
        sort={sort}
      />
      <div className="mt-10">
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}
