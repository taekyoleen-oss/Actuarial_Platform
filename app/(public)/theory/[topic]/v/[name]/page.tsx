import Link from "next/link";
import { notFound } from "next/navigation";
import {
  THEORY_TOPICS,
  getTheoryItem,
  getTheoryTopic,
  listTheoryItems,
} from "@/lib/theory";

// 자료 열람 — HTML 본문을 앱 프레임 안에 임베드(뉴스 페이지 패턴).
// PDF는 폴더에 보관만 하고 노출하지 않는다(2026-06-11 사용자 결정).
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
  if (!item?.htmlPath) notFound();

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
