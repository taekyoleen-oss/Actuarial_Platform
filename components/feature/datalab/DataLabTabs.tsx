"use client";

/**
 * /datalab 상단 탭 — 모바일·데스크톱 모두 다섯 탭으로 분리:
 *  ① 엑셀 분석함수: 엑셀 함수 사전(사분면+LET/LAMBDA)(excel)
 *  ② 파이썬 데이터 분석방법: 워드클라우드 + 파이썬 실행기(analysis)
 *  ③ 데이터 분석 예제: 검색·정렬 + 예제 카드(examples)
 *  ④ 확률분포: 분포별 PDF/CDF 그래프·통계량·파이썬 코드(distributions)
 *  ⑤ 모델 적합: 데이터 입력→분포 적합·검정·QQ·몬테카를로(fitting)
 * 좁은 화면에서 한 줄에 들어가도록 라벨은 모바일에서 짧게 바뀌고, 넘치면 탭바가 가로 스크롤된다.
 * 각 섹션은 한 번만 렌더하고 display만 토글(실행기 상태·Pyodide 유지).
 */
import { useState, type ReactNode } from "react";

type TabKey = "excel" | "analysis" | "examples" | "distributions" | "fitting";

const TABS: { key: TabKey; short: string; long: string }[] = [
  { key: "excel", short: "엑셀", long: "엑셀 분석함수" },
  { key: "analysis", short: "파이썬", long: "파이썬 데이터 분석방법" },
  { key: "examples", short: "예제", long: "데이터 분석 예제" },
  { key: "distributions", short: "분포", long: "확률분포" },
  { key: "fitting", short: "적합", long: "모델 적합" },
];

export function DataLabTabs({
  excel,
  analysis,
  examples,
  distributions,
  fitting,
}: {
  excel: ReactNode;
  analysis: ReactNode;
  examples: ReactNode;
  distributions: ReactNode;
  fitting: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("excel");

  const panel = (key: TabKey, node: ReactNode) => (
    <div className={tab === key ? "block" : "hidden"}>{node}</div>
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="엑셀 분석함수 / 파이썬 데이터 분석방법 / 예제 / 확률분포 / 모델 적합"
        className="mb-6 flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border p-0.5"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors md:px-4 md:text-sm ${
              tab === t.key
                ? "bg-foreground text-white"
                : "text-tertiary hover:text-foreground"
            }`}
          >
            <span className="md:hidden">{t.short}</span>
            <span className="hidden md:inline">{t.long}</span>
          </button>
        ))}
      </div>

      {panel("excel", excel)}
      {panel("analysis", analysis)}
      {panel("examples", examples)}
      {panel("distributions", distributions)}
      {panel("fitting", fitting)}
    </div>
  );
}
