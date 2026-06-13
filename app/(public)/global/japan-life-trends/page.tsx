import Link from "next/link";
import type { Metadata } from "next";
import {
  TRENDS_META,
  TRENDS_STATS,
  TRENDS_TOC,
  TRENDS_COUNTS,
} from "@/data/japan-life-trends/content";
import { TrendsArticle } from "@/components/feature/global/TrendsArticle";
import { TrendsToc } from "@/components/feature/global/TrendsToc";

export const metadata: Metadata = {
  title: "일본 생명보험의 동향 (2025년판) — 해외 주요 보험 정보·자료",
  description:
    "일본 생명보험협회 『2025년판 생명보험의 동향』 한국어판 — 계약·손익·자산운용 동향을 표·차트와 함께 정리.",
};

export default function JapanLifeTrendsPage() {
  return (
    <div className="bg-[var(--page-bg)]">
      {/* 히어로 */}
      <section className="bg-actuarial-dots bg-watermark-curve border-b border-border">
        <div className="mx-auto max-w-container px-6 pb-8 pt-10 sm:pt-14">
          <nav className="mb-4 flex items-center gap-2 text-[12.5px] text-tertiary">
            <Link href="/global" className="hover:text-foreground">
              해외 주요 보험 정보·자료
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">
              일본 생명보험의 동향
            </span>
          </nav>
          <div className="text-[13px] font-bold tracking-[0.16em] text-brand-sky">
            MARKET TRENDS · {TRENDS_META.edition}
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[37px]">
            {TRENDS_META.title}
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.8] text-tertiary">
            {TRENDS_META.publisher} 발행({TRENDS_META.publishedAt}). 일본
            생명보험 시장의 계약·손익·자산운용 동향을 {TRENDS_COUNTS.charts}개
            도표와 {TRENDS_COUNTS.tables}개 표로 정리한 연차 보고서입니다.
          </p>
          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:flex-wrap">
            {TRENDS_STATS.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11.5px] font-medium text-tertiary">
                  {k}
                </dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-foreground">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* TOC + 본문 */}
      <div className="mx-auto max-w-container px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
          <aside>
            <TrendsToc items={TRENDS_TOC} />
          </aside>
          <div className="min-w-0">
            <TrendsArticle />
            {/* 출처 */}
            <footer className="mt-12 rounded-cover border border-border bg-white/60 px-5 py-4 text-[13px] leading-relaxed text-tertiary">
              <span className="font-medium text-foreground">고지</span>{" "}
              {TRENDS_META.disclaimer}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
