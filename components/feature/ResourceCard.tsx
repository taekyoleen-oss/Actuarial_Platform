import Link from "next/link";
import { pastelFor } from "@/lib/utils";

/**
 * 파일 기반(정적 HTML) 자료 카드 — PostCard와 동일한 톤(파스텔·엘리베이션·로고블루 타이틀).
 * DB 게시물이 아니라 뷰어 경로로 직접 연결한다(조회수·날짜 메타 없음).
 */
export function ResourceCard({
  href,
  title,
  subtitle,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  const c = pastelFor(title);
  return (
    <Link href={href} className="group block h-full">
      <article
        className="flex h-full flex-col rounded-cover border p-5 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla group-hover:-translate-y-1 group-hover:shadow-card-hover"
        style={{ backgroundColor: c.bg, borderColor: c.border }}
      >
        {badge ? (
          <span className="inline-flex w-fit rounded bg-white/70 px-2 py-0.5 text-xs font-medium text-tertiary">
            {badge}
          </span>
        ) : null}
        <h3 className="mt-3 text-lg font-semibold leading-snug text-brand-sky group-hover:text-primary">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
            {subtitle}
          </p>
        ) : (
          <span className="flex-1" />
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
          자료 보기 →
        </span>
      </article>
    </Link>
  );
}
