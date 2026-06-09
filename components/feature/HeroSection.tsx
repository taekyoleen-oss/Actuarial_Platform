import Link from "next/link";
import { Button } from "@/components/ui/button";

// 풀뷰포트 히어로 — "한 화면에 한 메시지". 여백·타이포 중심.
export function HeroSection() {
  return (
    <section className="flex min-h-[72vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="max-w-3xl text-[40px] font-medium leading-tight text-foreground">
        보험 배타적 사용권과
        <br />
        국내외 보험 정보를 한 곳에서
      </h1>
      <p className="mt-5 max-w-xl text-[15px] text-tertiary">
        신상품 배타적 사용권 분석, 해외·국내 보험 시장 자료를 정리해
        제공합니다. PDF 자료 열람과 AI 요약을 지원합니다.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/posts">자료 둘러보기</Link>
        </Button>
      </div>
    </section>
  );
}
