import Link from "next/link";
import { notFound } from "next/navigation";
import { GLOBAL_VIEWERS, getGlobalViewer } from "@/lib/global";

export const dynamicParams = false;

export function generateStaticParams() {
  return GLOBAL_VIEWERS.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getGlobalViewer(slug);
  return {
    title: item
      ? `${item.title} — 해외 주요 보험 정보·자료`
      : "해외 주요 보험 정보·자료",
  };
}

export default async function GlobalViewerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getGlobalViewer(slug);
  if (!item) notFound();

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-white px-6 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/posts?category=global"
            className="shrink-0 text-sm font-medium text-tertiary hover:text-foreground"
          >
            ← 해외 주요 보험 정보·자료
          </Link>
          <h1 className="truncate text-sm font-semibold text-brand-sky">
            {item.title}
          </h1>
        </div>
        <a
          href={item.htmlPath}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-sm font-medium text-primary"
        >
          새 탭에서 열기 ↗
        </a>
      </div>
      <iframe
        src={item.htmlPath}
        title={item.title}
        className="w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
