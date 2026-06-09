import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  Comment,
  PostDetail,
  PostListItem,
  SortOrder,
} from "@/types";

/** 카테고리 전체 (노출 순서) */
export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ib_categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

/** 게시판 목록 — 카테고리 필터 + 검색(제목·본문) + 정렬. is_published는 RLS가 보장. */
export async function listPosts(opts: {
  categorySlug?: string;
  q?: string;
  sort?: SortOrder;
}): Promise<PostListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ib_posts")
    .select("*, category:ib_categories!inner(slug, name)")
    .eq("is_published", true);

  if (opts.categorySlug) {
    query = query.eq("category.slug", opts.categorySlug);
  }
  if (opts.q && opts.q.trim()) {
    const term = `%${opts.q.trim()}%`;
    query = query.or(`title.ilike.${term},content.ilike.${term}`);
  }
  query =
    opts.sort === "popular"
      ? query.order("view_count", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data } = await query;
  return (data as PostListItem[]) ?? [];
}

/** 상세 — 카테고리 + 첨부 조인 */
export async function getPost(id: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ib_posts")
    .select("*, category:ib_categories(*), attachments:ib_attachments(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as PostDetail) ?? null;
}

/** 댓글 목록 (오래된 순) */
export async function listComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ib_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/** Storage 공개 URL */
export async function publicUrl(storagePath: string): Promise<string> {
  const supabase = await createClient();
  const { data } = supabase.storage
    .from("ib-attachments")
    .getPublicUrl(storagePath);
  return data.publicUrl;
}
