import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, History, LineChart, Scale } from "lucide-react";
import { FSA_STATS } from "@/lib/japanFsa";
import { FSA_THEMES } from "@/data/japan-fsa/themes";
import { ThemeChip } from "@/components/feature/fsa/ThemeChip";

export const metadata: Metadata = {
  title: "해외 주요 보험 정보·자료 — Insurance Insights",
  description:
    "일본 금융청 심사사례, 일본 생명보험 동향·변천 등 해외 보험 자료를 사이트 일체형 페이지로 제공합니다.",
};

/**
 * 해외 자료 허브 — 각 자료가 "하나의 홈페이지"처럼 보이는 벤토 그리드.
 * 2026-06-13: iframe 문서 임베드 → 네이티브 섹션 전환.
 */
export default function GlobalHubPage() {
  const tileBase =
    "group relative flex flex-col rounded-cover border border-border bg-white p-6 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover";

  return (
    <div className="bg-[var(--page-bg)]">
      {/* 히어로 */}
      <section className="bg-actuarial-dots bg-watermark-curve border-b border-border">
        <div className="mx-auto max-w-container px-6 pb-10 pt-12 sm:pt-16">
          <div className="text-[13px] font-bold tracking-[0.16em] text-brand-sky">
            GLOBAL INSURANCE INSIGHTS
          </div>
          <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-tight text-foreground sm:text-[39px]">
            해외 주요 보험 정보·자료
          </h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-[1.8] text-tertiary">
            일본 금융청의 상품 심사사례부터 생명보험 시장의 동향·변천까지 —
            번역·구조화하고 한국 시장 맥락을 더해, 각 자료를 검색·분류가 가능한
            전용 페이지로 제공합니다.
          </p>
        </div>
      </section>

      {/* 벤토 그리드 */}
      <section className="mx-auto max-w-container px-6 py-10">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* 대형: FSA 심사사례 */}
          <Link
            href="/global/japan-fsa"
            className={`${tileBase} md:col-span-2 lg:row-span-2`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--chip-blue-bg)] text-[var(--chip-blue-fg)]">
                <Scale size={18} />
              </span>
              <span className="text-[11.5px] font-bold tracking-[0.14em] text-brand-sky">
                JAPAN FSA · 심사사례집 한국어판
              </span>
            </div>
            <h2 className="mt-4 text-[24px] font-semibold leading-snug text-foreground group-hover:text-primary sm:text-[27px]">
              일본 금융청 보험상품 심사사례
            </h2>
            <p className="mt-2 text-[15px] leading-[1.8] text-body">
              실제 상품 심사에서 금융청과 보험회사가 공유한 문제의식과 조치를
              사례별로 정리했습니다. 신청 내용 → 금융청 판단 → 배경 → 한국
              시장 맥락(유사 사례·현황·규정)의 흐름으로 읽고, 테마·기간·분야로
              탐색할 수 있습니다.
            </p>
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
              {[
                ["수록 호", `${FSA_STATS.periods}개`],
                ["총 사례", `${FSA_STATS.cases}건`],
                ["기간", `${FSA_STATS.from}~${FSA_STATS.to}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[12px] font-medium text-tertiary">
                    {k}
                  </dt>
                  <dd className="text-[17px] font-semibold text-foreground">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {FSA_THEMES.slice(0, 8).map((t) => (
                <ThemeChip key={t.id} themeId={t.id} />
              ))}
            </div>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13.5px] font-semibold text-primary">
              사례 탐색하기{" "}
              <ArrowRight
                size={15}
                className="transition-transform duration-tesla group-hover:translate-x-0.5"
              />
            </span>
          </Link>

          {/* 중형: 동향 2025 */}
          <Link href="/global/japan-life-trends" className={tileBase}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--chip-teal-bg)] text-[var(--chip-teal-fg)]">
                <LineChart size={18} />
              </span>
              <span className="text-[11.5px] font-bold tracking-[0.14em] text-brand-sky">
                MARKET TRENDS
              </span>
            </div>
            <h2 className="mt-4 text-[20px] font-semibold leading-snug text-foreground group-hover:text-primary">
              일본 생명보험의 동향 (2025년판)
            </h2>
            <p className="mt-2 text-[13.5px] leading-[1.75] text-body">
              신계약·보유계약·수지·자산운용까지 — 일본 생명보험 시장의 최근
              5개년 흐름을 데이터 표와 함께 정리한 연차 동향 보고서입니다.
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13.5px] font-semibold text-primary">
              보고서 읽기{" "}
              <ArrowRight
                size={15}
                className="transition-transform duration-tesla group-hover:translate-x-0.5"
              />
            </span>
          </Link>

          {/* 중형: 변천 가이드 */}
          <Link href="/global/japan-life" className={tileBase}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--chip-amber-bg)] text-[var(--chip-amber-fg)]">
                <History size={18} />
              </span>
              <span className="text-[11.5px] font-bold tracking-[0.14em] text-brand-sky">
                INDUSTRY HISTORY
              </span>
            </div>
            <h2 className="mt-4 text-[20px] font-semibold leading-snug text-foreground group-hover:text-primary">
              일본 생명보험회사 변천 가이드
            </h2>
            <p className="mt-2 text-[13.5px] leading-[1.75] text-body">
              버블 붕괴 이후의 파산·합병·재편 — 일본 생보사들이 어떻게
              바뀌어 왔는지 타임라인으로 따라갑니다.
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13.5px] font-semibold text-primary">
              타임라인 보기{" "}
              <ArrowRight
                size={15}
                className="transition-transform duration-tesla group-hover:translate-x-0.5"
              />
            </span>
          </Link>

          {/* 소형: 게시판 */}
          <Link
            href="/posts?category=global"
            className={`${tileBase} lg:col-span-1`}
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--chip-slate-bg)] text-[var(--chip-slate-fg)]">
                <BookOpen size={18} />
              </span>
              <span className="text-[11.5px] font-bold tracking-[0.14em] text-brand-sky">
                BOARD
              </span>
            </div>
            <h2 className="mt-4 text-[17px] font-semibold leading-snug text-foreground group-hover:text-primary">
              해외 자료 게시판
            </h2>
            <p className="mt-2 text-[14px] leading-[1.7] text-body">
              게시 카드 형식으로 전체 해외 자료 목록을 봅니다.
            </p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14px] font-semibold text-primary">
              게시판으로{" "}
              <ArrowRight
                size={14}
                className="transition-transform duration-tesla group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
