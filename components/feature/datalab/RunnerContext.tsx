"use client";

/**
 * 파이썬 실행기 공유 컨텍스트 — '파이썬 분석코드' 탭(MethodCloud)에서
 * '실행기로 보내기'를 누르면 '파이썬 코드 실행' 탭의 실행기로 코드를 보내고
 * 그 탭으로 전환한다. 실행기 상태는 DataLabTabs가 소유하고 탭 전환도 담당한다.
 */
import { createContext, useContext } from "react";
import type { RunnerLoadRequest } from "@/components/feature/datalab/PyRunner";

export interface RunnerCtx {
  /** 코드를 '파이썬 코드 실행' 탭 실행기로 보내고 그 탭으로 전환 */
  sendToRunner: (code: string, label: string) => void;
  /** 현재 실행기에 주입할 로드 요청(없으면 null) */
  load: RunnerLoadRequest | null;
}

export const RunnerContext = createContext<RunnerCtx | null>(null);

export function useRunner(): RunnerCtx | null {
  return useContext(RunnerContext);
}
