import { HeroIdent } from "@/components/feature/HeroIdent";

// 컴팩트 인트로 밴드 — 화면을 적게 차지하고, 사이트 목적만 명확히 전달.
// v2: 격자점 + 정규분포 워터마크로 깊이감 (히어로 한정).
export function HeroSection() {
  return (
    <section className="border-b border-border bg-actuarial-dots bg-watermark-curve">
      <div className="mx-auto flex max-w-container items-center justify-between gap-8 px-6 py-8 sm:py-10">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground sm:text-[26px]">
            보험 배타적 사용권 · 국내외 보험 정보 자료실
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tertiary">
            신상품 배타적 사용권 분석과 해외·국내 보험 시장 자료를 정리해 제공합니다.
            PDF 자료 열람과 AI 요약을 지원합니다.
          </p>
        </div>
        {/* tkLeen 아이덴트 애니메이션 — PC(lg 이상) 전용 */}
        <div className="hidden shrink-0 lg:block">
          <HeroIdent className="h-24 w-24" />
        </div>
      </div>
    </section>
  );
}
