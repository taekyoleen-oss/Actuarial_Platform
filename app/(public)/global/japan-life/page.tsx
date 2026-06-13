import Link from "next/link";
import type { Metadata } from "next";
import {
  LIFE_HERO,
  LIFE_OVERVIEW,
  BANKRUPTCY_ROWS,
  TIMELINE_ERAS,
  COMPANY_CASES,
} from "@/data/japan-life/timeline";
import { LifeTimeline } from "@/components/feature/global/LifeTimeline";

export const metadata: Metadata = {
  title: "일본 생명보험회사 변천 가이드 — 해외 주요 보험 정보·자료",
  description:
    "일본 생명보험회사의 사명 변경·합병·파산·소멸 과정을 연표와 흐름도로 정리한 변천 가이드.",
};

export default function JapanLifePage() {
  const eventCount = TIMELINE_ERAS.reduce((s, e) => s + e.events.length, 0);
  const stats: [string, string][] = [
    ["주요 변천 이벤트", `${eventCount}건`],
    ["회사별 변천", `${COMPANY_CASES.length}개사`],
    ["파산·계약이전", `${BANKRUPTCY_ROWS.length}개사`],
    ["구분", "사명변경·합병·소멸"],
  ];

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
              일본 생명보험회사 변천 가이드
            </span>
          </nav>
          <div className="text-[13px] font-bold tracking-[0.16em] text-brand-sky">
            INDUSTRY HISTORY · {LIFE_HERO.eyebrow}
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[37px]">
            일본 생명보험회사 변천 가이드
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.8] text-tertiary">
            {LIFE_HERO.headline} {LIFE_HERO.lead}
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {stats.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11.5px] font-medium text-tertiary">
                  {k}
                </dt>
                <dd className="mt-0.5 text-[16px] font-semibold text-foreground">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 보는 법 */}
      <section className="mx-auto max-w-container px-6 py-8">
        <div className="rounded-cover bg-white p-6 shadow-card">
          <h2 className="text-[17px] font-semibold text-brand-sky">
            {LIFE_OVERVIEW.title}
          </h2>
          <p className="mt-2 text-[15px] leading-[1.8] text-body">
            {LIFE_OVERVIEW.note.pre}
            <strong className="font-semibold text-foreground">
              {LIFE_OVERVIEW.note.strong}
            </strong>
            {LIFE_OVERVIEW.note.post}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {LIFE_OVERVIEW.stats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-[var(--page-bg)] p-3.5"
              >
                <dd className="text-[17px] font-semibold text-foreground">
                  {s.value}
                </dd>
                <dt className="mt-1 text-[13px] leading-snug text-tertiary">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 타임라인 본문 */}
      <section className="mx-auto max-w-container px-6 pb-8">
        <LifeTimeline />
      </section>

      {/* 출처 */}
      <footer className="mx-auto max-w-container px-6 pb-14 pt-2">
        <div className="rounded-cover border border-border bg-white/60 px-5 py-4 text-[12.5px] leading-relaxed text-tertiary">
          <span className="font-medium text-foreground">원자료</span> 별첨
          「생명보험회사 변천도」의 기재 내용을 읽기 쉽게 재구성한 해설
          페이지입니다. 회사명·연도 등 사실관계는 원 도표를 따랐습니다.
        </div>
      </footer>
    </div>
  );
}
