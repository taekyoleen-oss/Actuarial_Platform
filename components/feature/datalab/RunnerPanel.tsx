"use client";

/**
 * '파이썬 코드 실행' 탭 — 파이썬 실행기(PyRunner)를 담는다. 실행기 상태(loadRequest)는
 * RunnerContext에서 받아, 다른 탭의 '실행기로 보내기'로 주입된 코드를 반영한다.
 */
import PyRunner from "@/components/feature/datalab/PyRunner";
import { useRunner } from "@/components/feature/datalab/RunnerContext";

export function RunnerPanel() {
  const runner = useRunner();
  return (
    <section aria-label="파이썬 코드 실행" className="mb-10">
      <PyRunner loadRequest={runner?.load ?? null} />
    </section>
  );
}
