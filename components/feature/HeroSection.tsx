import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroIdent } from "@/components/feature/HeroIdent";

// 홈 히어로 — 전면 사진(보험수리 숫자표, Unsplash License) + 대형 타이포.
// 디자인 비협상 준수: 그라데이션 없이 단색 반투명 덧칠로 가독성 확보, 강조색은 --primary 1색.
// 모션: 사진 천천히 정착(.hero-settle) + 제목 줄 단위 마스크 리빌(.line-rise) — reduced-motion 시 정지.
const LINES = ["보험의 숫자를", "읽고, 정리하고, 나눕니다"];

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-dark-surface text-white">
      <Image
        src="/images/hero-actuarial-table.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-settle -z-10 object-cover grayscale"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[rgba(16,19,26,0.72)]" />

      <div className="mx-auto flex min-h-[min(78svh,760px)] max-w-container flex-col justify-end px-6 pb-12 pt-24 sm:pb-16">
        <p className="line-rise text-[13px] font-semibold tracking-[0.18em] text-white/70">
          INSURANCE INSIGHTS BOARD
        </p>
        <h1 className="mt-5 text-[40px] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[60px] lg:text-[76px]">
          {LINES.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.06em]">
              <span
                className="line-rise block"
                style={{ animationDelay: `${150 + i * 120}ms` }}
              >
                {line}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-10 flex flex-col gap-8 border-t border-white/20 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <p
            className="line-rise max-w-xl text-[16px] leading-[1.8] text-white/80"
            style={{ animationDelay: "450ms" }}
          >
            신상품 배타적 사용권 분석과 해외·국내 보험 시장 자료, 보험이론 해설과 데이터
            예제를 한곳에 정리했습니다. PDF 자료 열람과 AI 요약을 지원합니다.
          </p>
          <div
            className="line-rise flex flex-wrap items-center gap-3"
            style={{ animationDelay: "550ms" }}
          >
            <Link
              href="/posts?category=exclusive-rights"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-foreground hover:bg-white/85"
            >
              배타적 사용권 분석
              <ArrowRight size={16} className="transition-transform duration-tesla group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/theory"
              className="inline-flex h-12 items-center rounded-full border border-white/40 px-6 text-[15px] font-semibold text-white hover:border-white hover:bg-white/10"
            >
              보험이론 사전
            </Link>
            {/* tkLeen 아이덴트 — PC 전용, 잉크색이 보이도록 흰 타일 위 */}
            <span className="ml-2 hidden h-12 w-12 items-center justify-center rounded-xl bg-white lg:flex">
              <HeroIdent className="h-9 w-9" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
