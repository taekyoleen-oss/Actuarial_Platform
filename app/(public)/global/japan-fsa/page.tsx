import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { FSA_STATS } from "@/lib/japanFsa";
import { FsaExplorer } from "@/components/feature/fsa/FsaExplorer";

export const metadata: Metadata = {
  title: "일본 금융청 보험상품 심사사례 — 해외 주요 보험 정보·자료",
  description:
    "일본 금융청(FSA) 보험상품 심사사례집 한국어판 — 테마·기간·분야별 탐색, 용어 해설, 한국 시장 맥락(유사 사례·현황·규정) 제공.",
};

/** 사례집 안내(guide.html 본문의 네이티브 이식) */
function IntroCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-cover bg-white p-5 shadow-card">
        <div className="text-[12px] font-bold tracking-[0.12em] text-brand-sky">
          01 · 왜 공개하는가
        </div>
        <p className="mt-2 text-[13.5px] leading-[1.8] text-body">
          금융청의 입장을 명확히 함으로써 상품 심사에서 보험회사와 금융청
          사이에 <strong className="font-semibold">깊이 있는 양방향 논의</strong>가
          이루어지도록 하는 것이 목적입니다. 심사 과정에서 함께 인식하게 된
          쟁점(문제의식의 공유)과 참고할 만한 앞선 사례(선진적 사례의 안내)를
          요약해 전달합니다.
        </p>
      </div>
      <div className="rounded-cover bg-white p-5 shadow-card">
        <div className="text-[12px] font-bold tracking-[0.12em] text-brand-sky">
          02 · 읽을 때 유의할 점
        </div>
        <p className="mt-2 text-[13.5px] leading-[1.8] text-body">
          수록된 사례가{" "}
          <strong className="font-semibold">
            모든 보험회사에 그대로 해당하는 것은 아니며
          </strong>
          , 해결책이 수록 사례에 한정되는 것도 아닙니다. 각 호는 당해
          사무연도에 실시한 상품 심사 사례를 중심으로 작성되었습니다.
        </p>
      </div>
      <div className="rounded-cover bg-white p-5 shadow-card">
        <div className="text-[12px] font-bold tracking-[0.12em] text-brand-sky">
          03 · 사례를 나누는 기준
        </div>
        <p className="mt-2 text-[13.5px] leading-[1.8] text-body">
          공표 <strong className="font-semibold">연월(호)</strong>별로 모은 뒤
          법령 분야(생명보험/손해보험 × 약관·사업방법서/산출방법서)로 정리하고,
          개별 사례는{" "}
          <strong className="font-semibold">
            「사례(신청 내용)」와 「조치(심사 결과)」
          </strong>
          로 나누어 보여줍니다. 본 한국어판은 여기에 테마 분류·용어 해설·한국
          시장 맥락을 더했습니다.
        </p>
      </div>
    </div>
  );
}

export default function JapanFsaPage() {
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
              일본 금융청 심사사례
            </span>
          </nav>
          <div className="text-[13px] font-bold tracking-[0.16em] text-brand-sky">
            JAPAN FSA · 보험상품 심사사례집 한국어판
          </div>
          <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[37px]">
            일본 금융청 보험상품 심사사례
          </h1>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.8] text-tertiary">
            실제 상품 심사에서 금융청과 보험회사가 공유한 문제의식과 선진
            사례를 공개하는 자료입니다. 테마·기간·분야로 탐색하고, 어려운 일본
            제도 용어는 본문에서 바로 확인하세요. 각 사례에는{" "}
            <span className="font-medium text-foreground">
              한국의 유사 사례·현황·관련 규정
            </span>
            을 함께 정리했습니다.
          </p>
          {/* 스탯 */}
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {[
              ["수록 호", `${FSA_STATS.periods}개`],
              ["총 사례", `${FSA_STATS.cases}건`],
              ["수록 기간", `${FSA_STATS.from} ~ ${FSA_STATS.to}`],
              ["원자료", "금융청 감독국 보험과"],
            ].map(([k, v]) => (
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

      {/* 안내 카드 */}
      <section className="mx-auto max-w-container px-6 py-8">
        <IntroCards />
      </section>

      {/* 탐색기 */}
      <div className="mx-auto max-w-container px-6">
        <Suspense
          fallback={
            <div className="py-16 text-center text-sm text-tertiary">
              사례를 불러오는 중…
            </div>
          }
        >
          <FsaExplorer />
        </Suspense>
      </div>

      {/* 출처·고지 */}
      <footer className="mx-auto max-w-container px-6 pb-14 pt-4">
        <div className="rounded-cover border border-border bg-white/60 px-5 py-4 text-[12.5px] leading-relaxed text-tertiary">
          <span className="font-medium text-foreground">원자료</span> 금융청
          「보험상품 심사사례집」(각 호), 금융청 감독국 보험과. 본 페이지는
          일본어 원문을 한국어로 옮긴 번역본이며, 법령·조문 명칭은 일본
          보험업법·동법 시행규칙·감독지침의 표현을 따랐습니다. 「한국에서는」
          블록과 용어 해설은 본 사이트가 더한 편집 콘텐츠로, 정확한 내용은 각
          기관의 원문·법령을 확인하시기 바랍니다.
        </div>
      </footer>
    </div>
  );
}
