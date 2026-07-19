"use client";

/**
 * /datalab 상단 탭 — 여섯 탭:
 *  ① 엑셀 분석함수(excel) ② 파이썬 분석코드(analysis) ③ 확률분포(distributions)
 *  ④ 모델 적합(fitting) ⑤ 파이썬 코드 실행(pyrun·실행기) ⑥ 예제 데이터 분석(examples)
 * 실행기(PyRunner)는 pyrun 탭에 있고, 상태(loadRequest)는 여기서 소유해 RunnerContext로 공유한다.
 * analysis 탭 방법 팝업의 '실행기로 보내기' → sendToRunner가 코드를 주입하고 pyrun 탭으로 전환.
 * 각 섹션은 한 번만 렌더하고 display만 토글(실행기·Pyodide 상태 유지).
 * 탭바는 좁은 화면(모바일)에서 가로 스크롤 대신 여러 줄로 줄바꿈해 모든 탭을 노출한다(md+는 한 줄 알약).
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { RunnerContext } from "@/components/feature/datalab/RunnerContext";
import type { RunnerLoadRequest } from "@/components/feature/datalab/PyRunner";

/** 마지막 사용 탭 저장 키 — localStorage(기기·브라우저별, 서버 전송 없음) */
const TAB_STORE_KEY = "datalab:lastTab:v1";

type TabKey =
  | "excel"
  | "pyrun"
  | "analysis"
  | "distributions"
  | "fitting"
  | "examples";

const TABS: { key: TabKey; short: string; long: string }[] = [
  { key: "excel", short: "엑셀", long: "엑셀 분석함수" },
  { key: "analysis", short: "분석", long: "파이썬 분석코드" },
  { key: "distributions", short: "분포", long: "확률분포" },
  { key: "fitting", short: "적합", long: "모델 적합" },
  { key: "pyrun", short: "실행", long: "파이썬 코드 실행" },
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

  // 마지막 사용 탭 복원 — SSR 마크업 불일치를 피하려 effect에서 하이드레이션(기기별 적용)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_STORE_KEY) as TabKey | null;
      if (saved && TABS.some((t) => t.key === saved)) setTab(saved);
    } catch {
      /* 프라이빗 모드 등 저장 불가 시 기본 탭 유지 */
    }
  }, []);

  // 탭 선택 = 즉시 저장 — 다음 방문 시 이 탭이 먼저 보인다
  const selectTab = useCallback((k: TabKey) => {
    setTab(k);
    try {
      localStorage.setItem(TAB_STORE_KEY, k);
    } catch {
      /* 저장 실패는 무시 */
    }
  }, []);

  // 실행기 로드 요청 — analysis 탭의 '실행기로 보내기'로 주입되어 pyrun 탭 실행기에 반영
  const [load, setLoad] = useState<RunnerLoadRequest | null>(null);
  const sendToRunner = useCallback(
    (code: string, label: string) => {
      setLoad((prev) => ({ code, label, seq: (prev?.seq ?? 0) + 1 }));
      selectTab("pyrun");
    },
    [selectTab]
  );

  const panel = (key: TabKey, node: ReactNode) => (
    <div className={tab === key ? "block" : "hidden"}>{node}</div>
  );

  return (
    <RunnerContext.Provider value={{ sendToRunner, load }}>
      <div>
        <div
          role="tablist"
          aria-label="엑셀 분석함수 / 파이썬 분석코드 / 확률분포 / 모델 적합 / 파이썬 코드 실행 / 예제 데이터 분석"
          className="mb-6 flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-border p-1 md:w-fit md:max-w-full md:flex-nowrap md:justify-start md:overflow-x-auto md:rounded-full md:p-0.5"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => selectTab(t.key)}
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
        {panel("distributions", distributions)}
        {panel("fitting", fitting)}
        {panel("pyrun", pyrun)}
        {panel("examples", examples)}
      </div>
    </RunnerContext.Provider>
  );
}
