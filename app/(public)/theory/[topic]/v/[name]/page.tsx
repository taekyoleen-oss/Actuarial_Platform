import Link from "next/link";
import { notFound } from "next/navigation";
import { PdfViewer } from "@/components/feature/PdfViewer";
import {
  THEORY_TOPICS,
  getTheoryItem,
  getTheoryTopic,
  listTheoryItems,
} from "@/lib/theory";

// 자료 열람 — HTML이 있으면 앱 프레임 안 임베드(뉴스 페이지 패턴), 없으면 PDF 뷰어.
export const dynamicParams = false;

// 라우트 파라미터는 환경에 따라 인코딩된 채 올 수 있다
function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export function generateStaticParams() {
  return THEORY_TOPICS.flatMap((t) =>
    listTheoryItems(t.slug).map((i) => ({ topic: t.slug, name: i.base }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string; name: string }>;
}) {
  const { topic, name } = await params;
  const t = getTheoryTopic(topic);
  const item = t ? getTheoryItem(t.slug, safeDecode(name)) : undefined;
  return {
    title: item
      ? `${item.title} — 보험이론 사전`
      : "보험이론 사전 | Insurance Insights Board",
  };
}

export default async function TheoryViewerPage({
  params,
}: {
  params: Promise<{ topic: string; name: string }>;
}) {
  const { topic, name } = await params;
  const t = getTheoryTopic(topic);
  if (!t) notFound();
  const item = getTheoryItem(t.slug, safeDecode(name));
  if (!item) notFound();

  // PDF만 있는 자료: 기존 PDF 뷰어로 열람
  if (!item.htmlPath) {
    return (
      <div className="mx-auto max-w-container px-6 py-12">
        <div className="mb-6 flex min-w-0 items-center gap-3">
          <Link
            href={`/theory/${t.slug}`}
            className="shrink-0 text-sm font-medium text-tertiary hover:text-foreground"
          >
            ← {t.name}
          </Link>
          <h1 className="truncate text-lg font-semibold text-brand-sky">
            {item.title}
          </h1>
        </div>
        <PdfViewer url={item.pdfPath!} fileName={`${item.title}.pdf`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-white px-6 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/theory/${t.slug}`}
            className="shrink-0 text-sm font-medium text-tertiary hover:text-foreground"
          >
            ← {t.name}
          </Link>
          <h1 className="truncate text-sm font-semibold text-brand-sky">
            {item.title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm font-medium">
          {item.pdfPath && (
            <a
              href={item.pdfPath}
              target="_blank"
              rel="noreferrer"
              className="text-tertiary hover:text-foreground"
            >
              PDF ↓
            </a>
          )}
          <a
            href={item.htmlPath}
            target="_blank"
            rel="noreferrer"
            className="text-primary"
          >
            새 탭에서 열기 ↗
          </a>
        </div>
      </div>
      <iframe
        src={item.htmlPath}
        title={item.title}
        className="w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
