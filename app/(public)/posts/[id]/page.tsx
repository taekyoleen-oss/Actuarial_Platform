import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { CommentSection } from "@/components/feature/CommentSection";
import { PdfViewer } from "@/components/feature/PdfViewer";
import { SummaryPanel } from "@/components/feature/SummaryPanel";
import { ViewCounter } from "@/components/feature/ViewCounter";
import {
  getGlobalViewer,
  stripViewerMarker,
  viewerSlugFromContent,
} from "@/lib/global";
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
  const viewerSlug = viewerSlugFromContent(post.content);
  const viewer = viewerSlug ? getGlobalViewer(viewerSlug) : undefined;
  const bodyText = stripViewerMarker(post.content);
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
      <h1 className="mt-3 text-[30px] font-medium leading-snug text-foreground sm:text-[35px]">
        {post.title}
      </h1>
      <div className="mt-3 flex items-center gap-3 text-sm text-tertiary">
        {post.author_name && <span>{post.author_name}</span>}
        <span>{formatDate(post.created_at)}</span>
        <span>·</span>
        <span>조회 {post.view_count}</span>
      </div>

      <div className="mt-8">
        <SummaryPanel summary={post.summary} />
      </div>

      {bodyText ? (
        <div className="prose-tesla mt-8 whitespace-pre-wrap text-[16px] leading-relaxed text-body">
          {bodyText}
        </div>
      ) : null}

      {viewer ? (
        /* 2026-06-13: iframe 임베드 → 사이트 일체형 네이티브 페이지 연결 */
        <a
          href={viewer.nativePath}
          className="group mt-8 block rounded-cover border border-border bg-white p-6 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover"
        >
          <span className="text-[11.5px] font-semibold tracking-[0.12em] text-brand-sky">
            전용 페이지에서 보기
          </span>
          <span className="mt-1.5 block text-[20px] font-semibold text-foreground group-hover:text-primary">
            {viewer.title} →
          </span>
          <span className="mt-1 block text-[13.5px] leading-relaxed text-tertiary">
            검색·분류·용어 해설을 갖춘 사이트 일체형 페이지로 이동합니다.
          </span>
        </a>
      ) : null}

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
