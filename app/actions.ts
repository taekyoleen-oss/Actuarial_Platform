"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

/** 게시물 생성 (관리자). 성공 시 상세로 리다이렉트. */
export async function createPost(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/admin/login");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ib_posts")
    .insert({
      title: String(formData.get("title") || "").trim(),
      content: String(formData.get("content") || ""),
      category_id: String(formData.get("category_id") || ""),
      author_name: String(formData.get("author_name") || "") || null,
      is_published: formData.get("is_published") === "on",
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message || "create failed");
  revalidatePath("/posts");
  revalidatePath("/admin");
  redirect(`/posts/${data.id}`);
}

/** 게시물 수정 (관리자). */
export async function updatePost(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("ib_posts")
    .update({
      title: String(formData.get("title") || "").trim(),
      content: String(formData.get("content") || ""),
      category_id: String(formData.get("category_id") || ""),
      author_name: String(formData.get("author_name") || "") || null,
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/posts/${id}`);
  revalidatePath("/admin");
  redirect(`/posts/${id}`);
}

/** 게시물 삭제 (관리자). 첨부·댓글은 FK cascade. */
export async function deletePost(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("ib_posts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/posts");
  revalidatePath("/admin");
  redirect("/admin");
}

/** 댓글 삭제 (관리자). */
export async function deleteComment(formData: FormData) {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/admin/login");

  const id = String(formData.get("id") || "");
  const postId = String(formData.get("post_id") || "");
  const supabase = await createClient();
  const { error } = await supabase.from("ib_comments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (postId) revalidatePath(`/posts/${postId}`);
  revalidatePath("/admin");
}

/** 로그아웃 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
