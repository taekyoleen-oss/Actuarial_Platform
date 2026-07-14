"use client";

/**
 * /datalab 상단 탭 — 데스크톱(md+)에서만 두 탭으로 분리:
 *  ① 데이터 분석: 워드클라우드 + 파이썬 실행기(analysis)
 *  ② 데이터 분석 예제: 검색·정렬 + 예제 카드(examples)
 * 모바일(<md)은 현재 상태 그대로 두 섹션을 세로로 함께 보여준다(탭 없음).
 * 각 섹션은 한 번만 렌더하고 반응형 클래스로 표시를 제어(실행기 상태·Pyodide 유지).
 */
import { useState, type ReactNode } from "react";

type TabKey = "analysis" | "examples";

export function DataLabTabs({
  analysis,
  examples,
}: {
  analysis: ReactNode;
  examples: ReactNode;
}) {
  const [tab, setTab] = useState<TabKey>("analysis");

  const tabBtn = (key: TabKey, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setTab(key)}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        tab === key
          ? "bg-foreground text-white"
          : "text-tertiary hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* 탭 바 — 데스크톱 전용 */}
      <div
        role="tablist"
        aria-label="데이터 분석 / 예제"
        className="mb-6 hidden w-fit items-center gap-1 rounded-full border border-border p-0.5 md:flex"
      >
        {tabBtn("analysis", "데이터 분석")}
        {tabBtn("examples", "데이터 분석 예제")}
      </div>

      {/* 모바일: 둘 다 표시(현재 상태) · 데스크톱: 선택된 탭만 표시 */}
      <div className={tab === "analysis" ? "md:block" : "md:hidden"}>
        {analysis}
      </div>
      <div className={tab === "examples" ? "md:block" : "md:hidden"}>
        {examples}
      </div>
    </div>
  );
}
