import { notFound, redirect } from "next/navigation";
import { AdminPostForm } from "@/components/feature/AdminPostForm";
import { requireAdmin } from "@/lib/auth";
import { getPost, listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/admin/login");

  const { id } = await params;
  const [categories, post] = await Promise.all([
    listCategories(),
    getPost(id),
  ]);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium text-foreground">게시물 수정</h1>
      <AdminPostForm
        categories={categories}
        post={post}
        attachments={post.attachments}
      />
    </div>
  );
}
