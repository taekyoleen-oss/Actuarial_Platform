"use client";

/**
 * /datalab 사전 콘텐츠 오버라이드 클라이언트 — 관리자 팝업 편집(2026-07-19).
 * 정적 사전(lib/*.ts) 위에 DB 오버라이드(ib_datalab_overrides)를 덮어 표시한다.
 * 모듈 캐시 + 구독으로 페이지당 1회만 fetch, 저장·삭제 시 즉시 반영.
 */
import { useCallback, useEffect, useState } from "react";
import type { StatMethod } from "@/lib/statMethods";
import type { ExcelFunction } from "@/lib/excelFunctions";

export interface OverrideData {
  intro?: string;
  tips?: string;
  summary?: string;
  definition?: string;
  usage?: string;
  interpretation?: string;
  /** sections[i].desc 덮어쓰기 — null이면 해당 섹션은 원본 유지 */
  sectionDescs?: (string | null)[];
  /** examples[i].explain 덮어쓰기 */
  exampleExplains?: (string | null)[];
}

interface OvState {
  overrides: Record<string, OverrideData>;
  isAdmin: boolean;
  loaded: boolean;
}

let state: OvState = { overrides: {}, isAdmin: false, loaded: false };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function load(): Promise<void> {
  if (state.loaded) return;
  if (!inflight) {
    inflight = fetch("/api/datalab/overrides")
      .then(async (r) => {
        if (r.ok) {
          const j = (await r.json()) as {
            overrides?: Record<string, OverrideData>;
            isAdmin?: boolean;
          };
          state = {
            overrides: j.overrides ?? {},
            isAdmin: !!j.isAdmin,
            loaded: true,
          };
        } else {
          state = { ...state, loaded: true };
        }
      })
      .catch(() => {
        state = { ...state, loaded: true };
      })
      .finally(() => {
        inflight = null;
        emit();
      });
  }
  return inflight;
}

export function useDatalabOverrides() {
  const [, tick] = useState(0);
  useEffect(() => {
    const l = () => tick((t) => t + 1);
    listeners.add(l);
    void load();
    return () => {
      listeners.delete(l);
    };
  }, []);

  const save = useCallback(async (key: string, data: OverrideData) => {
    const r = await fetch("/api/datalab/overrides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, data }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => null)) as {
        error?: string;
        detail?: string;
      } | null;
      throw new Error(
        j?.error === "db_error"
          ? `저장 실패(DB): ${j.detail ?? ""} — output/datalab_overrides_schema.sql 적용 여부를 확인하세요.`
          : j?.error === "unauthorized"
            ? "관리자 로그인이 필요합니다."
            : "저장에 실패했습니다."
      );
    }
    state = {
      ...state,
      overrides: { ...state.overrides, [key]: data },
    };
    emit();
  }, []);

  const remove = useCallback(async (key: string) => {
    const r = await fetch(
      `/api/datalab/overrides?key=${encodeURIComponent(key)}`,
      { method: "DELETE" }
    );
    if (!r.ok) throw new Error("초기화에 실패했습니다.");
    const next = { ...state.overrides };
    delete next[key];
    state = { ...state, overrides: next };
    emit();
  }, []);

  return {
    overrides: state.overrides,
    isAdmin: state.isAdmin,
    loaded: state.loaded,
    save,
    remove,
  };
}

/* ───────────────────────── 병합 유틸 ───────────────────────── */

export function mergeMethod(m: StatMethod, o?: OverrideData): StatMethod {
  if (!o) return m;
  return {
    ...m,
    summary: o.summary ?? m.summary,
    intro: o.intro ?? m.intro,
    tips: o.tips ?? m.tips,
    sections: o.sectionDescs
      ? m.sections.map((s, i) =>
          o.sectionDescs![i] ? { ...s, desc: o.sectionDescs![i]! } : s
        )
      : m.sections,
  };
}

export function mergeExcelFn(f: ExcelFunction, o?: OverrideData): ExcelFunction {
  if (!o) return f;
  return {
    ...f,
    summary: o.summary ?? f.summary,
    intro: o.intro ?? f.intro,
    tips: o.tips ?? f.tips,
    examples: o.exampleExplains
      ? f.examples.map((e, i) =>
          o.exampleExplains![i] ? { ...e, explain: o.exampleExplains![i]! } : e
        )
      : f.examples,
  };
}

export interface TheoryTexts {
  definition: string;
  usage: string;
  interpretation: string;
}

export function mergeTheory<T extends TheoryTexts>(t: T, o?: OverrideData): T {
  if (!o) return t;
  return {
    ...t,
    definition: o.definition ?? t.definition,
    usage: o.usage ?? t.usage,
    interpretation: o.interpretation ?? t.interpretation,
  };
}
