import Link from "next/link";
import { formatDate, pastelFor } from "@/lib/utils";
import type { DataPostListItem } from "@/types";
import { DataChip } from "./DataChip";

/**
 * 데이터 예제/분석 카드 — PostCard 톤(파스텔·엘리베이션·hover lift·로고블루 타이틀).
 * 상단 배지줄(출처·XLSX) → 제목 → 요약(3줄 clamp) → 모델·도구 칩(최대 4+N) → 날짜·조회수.
 */
export function DataPostCard({ post }: { post: DataPostListItem }) {
  const c = pastelFor(post.id);
  const files = post.files ?? [];
  const hasExcel = files.some((f) => f.kind === "excel");
  const tags = [...(post.models ?? []), ...(post.tools ?? [])];
  const shown = tags.slice(0, 4);
  const extra = tags.length - shown.length;

  return (
    <Link href={`/datalab/${post.slug}`} className="group block h-full">
      <article
        className="flex h-full flex-col rounded-cover border p-5 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla group-hover:-translate-y-1 group-hover:shadow-card-hover"
        style={{ backgroundColor: c.bg, borderColor: c.border }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {post.source_name ? (
            <span className="inline-flex w-fit rounded bg-white/70 px-2 py-0.5 text-xs font-medium text-tertiary">
              {post.source_name}
            </span>
          ) : null}
          {hasExcel ? (
            <span className="inline-flex w-fit rounded bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-brand-sky">
              XLSX
            </span>
          ) : null}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-sky group-hover:text-primary">
          {post.title}
        </h3>

        {post.summary ? (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-body">
            {post.summary}
          </p>
        ) : (
          <span className="flex-1" />
        )}

        {tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shown.map((t, i) => (
              <DataChip key={`${t}-${i}`} label={t} />
            ))}
            {extra > 0 ? (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium text-tertiary">
                +{extra}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2 text-xs text-tertiary">
          <span>{formatDate(post.created_at)}</span>
          <span>·</span>
          <span>조회 {post.view_count}</span>
        </div>
      </article>
    </Link>
  );
}
