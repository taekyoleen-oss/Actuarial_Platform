import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "@/components/feature/CommentSection";
import { PdfViewer } from "@/components/feature/PdfViewer";
import { SummaryPanel } from "@/components/feature/SummaryPanel";
import { ViewCounter } from "@/components/feature/ViewCounter";
import { getPost, listComments, publicUrl } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post || !post.is_published) notFound();

  const comments = await listComments(id);
  const pdfs = await Promise.all(
    post.attachments
      .filter((a) => a.mime_type === "application/pdf")
      .map(async (a) => ({
        url: await publicUrl(a.storage_path),
        fileName: a.file_name,
        id: a.id,
      }))
  );

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <ViewCounter postId={id} />

      <Badge>{post.category?.name}</Badge>
      <h1 className="mt-3 text-[28px] font-medium leading-snug text-foreground sm:text-[32px]">
        {post.title}
      </h1>
      <div className="mt-3 flex items-center gap-3 text-sm text-tertiary">
        {post.author_name && <span>{post.author_name}</span>}
        <span>{formatDate(post.created_at)}</span>
        <span>·</span>
        <span>조회 {post.view_count}</span>
      </div>

      <div className="mt-8">
        <SummaryPanel postId={id} initialSummary={post.summary} />
      </div>

      <div className="prose-tesla mt-8 whitespace-pre-wrap text-[15px] leading-relaxed text-body">
        {post.content}
      </div>

      {pdfs.length > 0 && (
        <div className="mt-10 space-y-6">
          {pdfs.map((p) => (
            <PdfViewer key={p.id} url={p.url} fileName={p.fileName} />
          ))}
        </div>
      )}

      <hr className="my-12 border-border" />
      <CommentSection postId={id} initialComments={comments} />
    </article>
  );
}
