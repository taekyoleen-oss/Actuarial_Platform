import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { currentWorkbook, dataFileUrl, getDataPost } from "@/lib/datalab";
import { deriveBase } from "@/lib/datalab-files";
import { WorkbookEditorClient } from "@/components/feature/datalab/WorkbookLoaders";

export default async function DataLabEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 관리자 전용 — 이중 방어의 서버 측
  const admin = await requireAdmin();
  if (!admin.ok) redirect(`/datalab/${slug}`);

  const post = await getDataPost(slug);
  if (!post) redirect("/datalab");

  const current = currentWorkbook(post.files ?? []);
  if (!current) redirect(`/datalab/${slug}`);

  const fileUrl = await dataFileUrl(current.storage_path);
  const baseName = deriveBase(undefined, current.file_name);

  return (
    <div className="mx-auto max-w-container px-4 py-6">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Link
          href={`/datalab/${slug}`}
          className="text-sm font-medium text-tertiary hover:text-foreground"
        >
          ← 상세로
        </Link>
        <h1 className="text-lg font-semibold text-foreground">
          {post.title} · 웹 편집
        </h1>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-tertiary">
        웹 편집 저장본은 셀 값·수식 수준만 보존됩니다(새 버전으로 저장). VBA·차트·피벗이
        포함된 원본(v1)은 절대 덮어쓰지 않으며 상세 페이지에서 별도로 받을 수 있습니다.
      </p>

      <WorkbookEditorClient
        postId={post.id}
        slug={slug}
        fileUrl={fileUrl}
        fileName={current.file_name}
        baseName={baseName}
        version={current.version}
      />
    </div>
  );
}
