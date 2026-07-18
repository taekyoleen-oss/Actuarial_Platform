"use client";

/**
 * /datalab 상단 탭 — 여섯 탭:
 *  ① 엑셀 분석함수(excel) ② 파이썬 코드 실행(pyrun·실행기) ③ 파이썬 데이터 분석방법(analysis)
 *  ④ 확률분포(distributions) ⑤ 모델 적합(fitting) ⑥ 예제 데이터 분석(examples)
 * 실행기(PyRunner)는 pyrun 탭에 있고, 상태(loadRequest)는 여기서 소유해 RunnerContext로 공유한다.
 * analysis 탭 방법 팝업의 '실행기로 보내기' → sendToRunner가 코드를 주입하고 pyrun 탭으로 전환.
 * 각 섹션은 한 번만 렌더하고 display만 토글(실행기·Pyodide 상태 유지). 넘치면 탭바가 가로 스크롤.
 */
import { useCallback, useState, type ReactNode } from "react";
import { RunnerContext } from "@/components/feature/datalab/RunnerContext";
import type { RunnerLoadRequest } from "@/components/feature/datalab/PyRunner";

type TabKey =
  | "excel"
  | "pyrun"
  | "analysis"
  | "distributions"
  | "fitting"
  | "examples";

const TABS: { key: TabKey; short: string; long: string }[] = [
  { key: "excel", short: "엑셀", long: "엑셀 분석함수" },
  { key: "pyrun", short: "실행", long: "파이썬 코드 실행" },
  { key: "analysis", short: "방법", long: "파이썬 데이터 분석방법" },
  { key: "distributions", short: "분포", long: "확률분포" },
  { key: "fitting", short: "적합", long: "모델 적합" },
  { key: "examples", short: "예제", long: "예제 데이터 분석" },
];

export function DataLabTabs({
  excel,
  pyrun,
  analysis,
  examples,
  distributions,
  fitting,
}: {
  excel: ReactNode;
  pyrun: ReactNode;
  analysis: ReactNode;
  examples: ReactNode;
  distributions: ReactNode;
  fitting: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("excel");
  // 실행기 로드 요청 — analysis 탭의 '실행기로 보내기'로 주입되어 pyrun 탭 실행기에 반영
  const [load, setLoad] = useState<RunnerLoadRequest | null>(null);
  const sendToRunner = useCallback((code: string, label: string) => {
    setLoad((prev) => ({ code, label, seq: (prev?.seq ?? 0) + 1 }));
    setTab("pyrun");
  }, []);

  const panel = (key: TabKey, node: ReactNode) => (
    <div className={tab === key ? "block" : "hidden"}>{node}</div>
  );

  return (
    <RunnerContext.Provider value={{ sendToRunner, load }}>
      <div>
        <div
          role="tablist"
          aria-label="엑셀 분석함수 / 파이썬 코드 실행 / 파이썬 데이터 분석방법 / 확률분포 / 모델 적합 / 예제 데이터 분석"
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
        {panel("pyrun", pyrun)}
        {panel("analysis", analysis)}
        {panel("distributions", distributions)}
        {panel("fitting", fitting)}
        {panel("examples", examples)}
      </div>
    </RunnerContext.Provider>
  );
}
