import { redirect } from "next/navigation";
import { AdminPostForm } from "@/components/feature/AdminPostForm";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/admin/login");

  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium text-foreground">새 게시물</h1>
      <AdminPostForm categories={categories} />
      <p className="mt-4 text-xs text-tertiary">
        게시 후 수정 화면에서 PDF 첨부를 추가할 수 있습니다.
      </p>
    </div>
  );
}
