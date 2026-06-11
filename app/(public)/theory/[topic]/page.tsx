import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  THEORY_TOPICS,
  getTheoryTopic,
  listTheoryItems,
} from "@/lib/theory";

// 폴더 기반 정적 섹션 — 빌드 시 public/theory/* 를 읽는다. 자료 추가는 재배포 시 반영.
export const dynamicParams = false;

export function generateStaticParams() {
  return THEORY_TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const t = getTheoryTopic(topic);
  return { title: `보험이론 사전 — ${t?.name ?? ""} | Insurance Insights Board` };
}

export default async function TheoryTopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const t = getTheoryTopic(topic);
  if (!t) notFound();
  const items = listTheoryItems(t.slug);

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <h1 className="text-2xl font-medium text-foreground">보험이론 사전</h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tertiary">
        보험 이론·실무 기초 자료를 주제별로 정리했습니다. 각 자료는 HTML로 바로
        열람하거나 PDF로 내려받을 수 있습니다.
      </p>

      {/* 주제 탭 (상단 주제별 정리) */}
      <div className="mt-8 flex flex-wrap gap-2">
        {THEORY_TOPICS.map((x) => (
          <Link
            key={x.slug}
            href={`/theory/${x.slug}`}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium",
              x.slug === t.slug
                ? "bg-foreground text-white"
                : "bg-surface text-tertiary hover:text-foreground"
            )}
          >
            {x.name}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="py-20 text-center text-sm text-tertiary">
          아직 등록된 자료가 없습니다.
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.base}
              className="flex flex-col rounded-cover border border-border bg-white p-5 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover"
            >
              <h2 className="flex-1 font-serif text-lg font-semibold leading-snug text-brand-navy">
                <Link
                  href={`/theory/${t.slug}/v/${encodeURIComponent(item.base)}`}
                  className="hover:text-primary"
                >
                  {item.title}
                </Link>
              </h2>
              <div className="mt-4 flex items-center gap-3 text-sm font-medium">
                <Link
                  href={`/theory/${t.slug}/v/${encodeURIComponent(item.base)}`}
                  className="text-primary"
                >
                  {item.htmlPath ? "HTML 열람" : "PDF 열람"}
                </Link>
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
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
