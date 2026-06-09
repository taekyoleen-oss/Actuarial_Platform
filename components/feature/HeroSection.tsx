// 컴팩트 인트로 밴드 — 화면을 적게 차지하고, 사이트 목적만 명확히 전달.
export function HeroSection() {
  return (
    <section className="border-b border-border bg-surface/60">
      <div className="mx-auto max-w-container px-6 py-7">
        <h1 className="text-xl font-medium text-foreground sm:text-2xl">
          보험 배타적 사용권 · 국내외 보험 정보 자료실
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tertiary">
          신상품 배타적 사용권 분석과 해외·국내 보험 시장 자료를 정리해 제공합니다.
          PDF 자료 열람과 AI 요약을 지원합니다.
        </p>
      </div>
    </section>
  );
}
