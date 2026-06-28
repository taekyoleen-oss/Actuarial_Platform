import Link from "next/link";
import { notFound } from "next/navigation";
import { Collapsible } from "@/components/feature/Collapsible";
import { PoolIdent } from "@/components/feature/PoolIdent";
import { PostBoard, type BoardItem } from "@/components/feature/PostBoard";
import { ViewSwitch } from "@/components/feature/ViewSwitch";
import { bluePastelFor, cn } from "@/lib/utils";
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

  // 게시판 보기용 항목(제목·열람 링크).
  const boardItems: BoardItem[] = items.map((item) => ({
    key: item.base,
    href: `/theory/${t.slug}/v/${encodeURIComponent(item.base)}`,
    title: item.title,
  }));

  // 카드 격자 — 제목(상단) → 커버(하단). 제목·그림 클릭 = 본문 열람.
  const cardGrid = (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const viewerHref = `/theory/${t.slug}/v/${encodeURIComponent(item.base)}`;
        const c = bluePastelFor(item.base);
        return (
          <article
            key={item.base}
            style={{ backgroundColor: c.bg, borderColor: c.border }}
            className="flex flex-col overflow-hidden rounded-cover border shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover"
          >
            <div className="p-5">
              <h2 className="text-lg font-semibold leading-snug text-brand-sky">
                <Link href={viewerHref} className="hover:text-primary">
                  {item.title}
                </Link>
              </h2>
            </div>
            {item.coverPath && (
              <Link
                href={viewerHref}
                tabIndex={-1}
                aria-hidden="true"
                style={{ borderColor: c.border }}
                className="mt-auto block border-t"
              >
                <img
                  src={item.coverPath}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                />
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <div className="flex items-center justify-between gap-8">
        <div>
          <h1 className="text-2xl font-medium text-foreground">
            보험이론 사전
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tertiary">
            보험 이론·실무 기초 자료를 주제별로 정리했습니다. 제목이나 그림을
            누르면 본문을 바로 열람할 수 있습니다.
          </p>
        </div>
        {/* 풀링 아이덴트 (무질서→질서 상시 루프) — PC(lg 이상) 전용 */}
        <PoolIdent className="hidden shrink-0 lg:block" />
      </div>

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
        <div key={t.slug} className="tab-fade-in mt-8">
          {/* 카드 ↔ 게시판 전환 + 현재 주제 접기/펴기 */}
          <ViewSwitch
            card={
              <Collapsible
                title={t.name}
                count={items.length}
                storageKey={`theory:${t.slug}`}
              >
                {cardGrid}
              </Collapsible>
            }
            board={
              <Collapsible
                title={t.name}
                count={items.length}
                storageKey={`theory:${t.slug}`}
              >
                <PostBoard items={boardItems} />
              </Collapsible>
            }
          />
        </div>
      )}
    </div>
  );
}
