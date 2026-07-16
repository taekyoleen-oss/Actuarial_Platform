"use client";

/**
 * /datalab 상단 탭 — 모바일·데스크톱 모두 세 탭으로 분리:
 *  ① 데이터 분석: 워드클라우드 + 파이썬 실행기(analysis)
 *  ② 데이터 분석 예제: 검색·정렬 + 예제 카드(examples)
 *  ③ 확률분포: 분포별 PDF/CDF 그래프·통계량·파이썬 코드(distributions)
 * 좁은 화면에서 한 줄에 들어가도록 라벨은 모바일에서 짧게 바뀐다.
 * 각 섹션은 한 번만 렌더하고 display만 토글(실행기 상태·Pyodide 유지).
 */
import { useState, type ReactNode } from "react";

type TabKey = "analysis" | "examples" | "distributions";

const TABS: { key: TabKey; short: string; long: string }[] = [
  { key: "analysis", short: "분석", long: "데이터 분석" },
  { key: "examples", short: "예제", long: "데이터 분석 예제" },
  { key: "distributions", short: "확률분포", long: "확률분포" },
];

export function DataLabTabs({
  analysis,
  examples,
  distributions,
}: {
  analysis: ReactNode;
  examples: ReactNode;
  distributions: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("analysis");

  const panel = (key: TabKey, node: ReactNode) => (
    <div className={tab === key ? "block" : "hidden"}>{node}</div>
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="데이터 분석 / 예제 / 확률분포"
        className="mb-6 flex w-fit items-center gap-1 rounded-full border border-border p-0.5"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors md:px-4 md:text-sm ${
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

      {panel("analysis", analysis)}
      {panel("examples", examples)}
      {panel("distributions", distributions)}
    </div>
  );
}
