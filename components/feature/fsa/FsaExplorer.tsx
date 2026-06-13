"use client";

/**
 * FSA 심사사례 파셋 탐색기 — 검색 + 호(연월) + 분야 + 테마 칩 멀티선택.
 * URL 파라미터(?q&ym&field&theme&case) 동기화: 필터=replace, 사례 선택=push(모바일 뒤로가기).
 * 데스크톱 lg+: 좌측 스티키 목록 + 우측 상세 / 모바일: 목록 ↔ 상세 전환.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, RotateCcw, Search } from "lucide-react";
import {
  FSA_PERIODS,
  getAllCases,
  themeCounts,
  fieldGroups,
  type FlatCase,
} from "@/lib/japanFsa";
import { FSA_THEMES } from "@/data/japan-fsa/themes";
import { ThemeChip } from "./ThemeChip";
import { CaseDetail } from "./CaseDetail";
import { GlossaryPanel } from "./GlossaryPanel";

function blobOf(fc: FlatCase): string {
  const { c, enrichment } = fc;
  const parts = [
    fc.periodLabel,
    fc.fieldTitle,
    c.chip,
    c.law,
    c.title,
    c.case,
    c.act,
    c.bg?.title,
    c.bg?.para,
    c.bg?.note,
    ...(c.bg?.list ?? []),
    enrichment?.tldr,
    enrichment?.kr?.note,
    ...(enrichment?.terms ?? []),
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function FsaExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const detailRef = useRef<HTMLDivElement>(null);

  const q = sp.get("q") ?? "";
  const ym = sp.get("ym") ?? "";
  const field = sp.get("field") ?? "";
  const themes = useMemo(
    () => (sp.get("theme") ? sp.get("theme")!.split(",").filter(Boolean) : []),
    [sp]
  );
  const caseId = sp.get("case") ?? "";

  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const all = useMemo(
    () => getAllCases().map((fc) => ({ fc, blob: blobOf(fc) })),
    []
  );
  const counts = useMemo(() => themeCounts(), []);
  const fields = useMemo(() => fieldGroups(), []);

  const setParams = (
    patch: Record<string, string | null>,
    mode: "replace" | "push" = "replace"
  ) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (mode === "push") router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter(({ fc, blob }) => {
        if (ym && fc.ym !== ym) return false;
        if (field && fc.fieldTitle !== field) return false;
        if (themes.length > 0) {
          const t = fc.enrichment?.themes ?? [];
          if (!themes.some((x) => t.includes(x))) return false;
        }
        if (needle && !blob.includes(needle)) return false;
        return true;
      })
      .map(({ fc }) => fc);
  }, [all, q, ym, field, themes]);

  const selected = useMemo(
    () => (caseId ? all.find(({ fc }) => fc.c.id === caseId)?.fc : undefined),
    [all, caseId]
  );

  const related = useMemo(() => {
    if (!selected) return [];
    const mainTheme = selected.enrichment?.themes?.[0];
    if (!mainTheme) return [];
    return getAllCases()
      .filter(
        (fc) =>
          fc.c.id !== selected.c.id &&
          fc.enrichment?.themes?.includes(mainTheme)
      )
      .slice(0, 4);
  }, [selected]);

  // 사례 변경 시 상세 상단으로
  useEffect(() => {
    if (caseId && detailRef.current) {
      const top =
        detailRef.current.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    }
  }, [caseId]);

  const hasFilter = Boolean(q || ym || field || themes.length);

  // 목록을 호 → 분야로 그룹화
  const grouped = useMemo(() => {
    const byPeriod = new Map<
      string,
      { label: string; fields: Map<string, FlatCase[]> }
    >();
    for (const fc of filtered) {
      if (!byPeriod.has(fc.ym)) {
        byPeriod.set(fc.ym, { label: fc.periodLabel, fields: new Map() });
      }
      const g = byPeriod.get(fc.ym)!;
      if (!g.fields.has(fc.fieldTitle)) g.fields.set(fc.fieldTitle, []);
      g.fields.get(fc.fieldTitle)!.push(fc);
    }
    return byPeriod;
  }, [filtered]);

  return (
    <div>
      {/* 글래스 스티키 필터바 */}
      <div className="glass-panel sticky top-14 z-30 -mx-6 px-6 py-3 shadow-float">
        <div className="mx-auto max-w-container">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1 sm:max-w-md">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setParams({ q: e.target.value, case: null })}
                placeholder="사례 검색 (제목·본문·용어·한국 맥락)"
                aria-label="사례 검색"
                className="w-full rounded-full border border-border bg-white py-2 pl-9 pr-4 text-[13.5px] outline-none focus:border-primary"
              />
            </div>
            <select
              value={ym}
              onChange={(e) => setParams({ ym: e.target.value, case: null })}
              aria-label="공표 호 선택"
              className="rounded-full border border-border bg-white px-3 py-2 text-[13px] text-body outline-none focus:border-primary"
            >
              <option value="">전체 호</option>
              {FSA_PERIODS.map((p) => (
                <option key={p.ym} value={p.ym}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={field}
              onChange={(e) =>
                setParams({ field: e.target.value, case: null })
              }
              aria-label="분야 선택"
              className="max-w-[220px] rounded-full border border-border bg-white px-3 py-2 text-[13px] text-body outline-none focus:border-primary"
            >
              <option value="">전체 분야</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <span className="text-[12.5px] font-medium text-tertiary">
              {filtered.length}건
            </span>
            <div className="ml-auto flex items-center gap-2">
              {hasFilter && (
                <button
                  type="button"
                  onClick={() =>
                    setParams({ q: null, ym: null, field: null, theme: null })
                  }
                  className="inline-flex items-center gap-1 text-[12.5px] font-medium text-tertiary hover:text-foreground"
                >
                  <RotateCcw size={13} /> 초기화
                </button>
              )}
              <button
                type="button"
                onClick={() => setGlossaryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-[13px] font-medium text-brand-sky hover:border-brand-sky"
              >
                <BookOpen size={14} /> 용어집
              </button>
            </div>
          </div>
          {/* 테마 칩 */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {FSA_THEMES.filter(
              (t) => (counts.get(t.id) ?? 0) > 0 || themes.includes(t.id)
            ).map((t) => (
              <ThemeChip
                key={t.id}
                themeId={t.id}
                count={counts.get(t.id) ?? 0}
                active={themes.includes(t.id)}
                onClick={() => {
                  const next = themes.includes(t.id)
                    ? themes.filter((x) => x !== t.id)
                    : [...themes, t.id];
                  setParams({
                    theme: next.length ? next.join(",") : null,
                    case: null,
                  });
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 본문: 목록 + 상세 */}
      <div
        ref={detailRef}
        className="mx-auto grid max-w-container gap-8 py-8 lg:grid-cols-[340px,1fr]"
      >
        {/* 목록 — 모바일에서는 상세 선택 시 숨김 */}
        <aside
          className={`${
            selected ? "hidden lg:block" : ""
          } lg:sticky lg:top-[10.5rem] lg:max-h-[calc(100vh-12rem)] lg:self-start lg:overflow-y-auto lg:pr-1`}
          aria-label="사례 목록"
        >
          {filtered.length === 0 ? (
            <div className="rounded-cover bg-white p-8 text-center text-sm text-tertiary shadow-card">
              조건에 맞는 사례가 없습니다.
              <button
                type="button"
                onClick={() =>
                  setParams({ q: null, ym: null, field: null, theme: null })
                }
                className="mt-2 block w-full text-[13px] font-medium text-primary"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            [...grouped.entries()].map(([pym, g]) => (
              <section key={pym} className="mb-5">
                <h3 className="sticky top-0 z-10 bg-[var(--page-bg)] py-1.5 text-[11.5px] font-bold tracking-[0.08em] text-brand-sky lg:static">
                  {g.label}
                </h3>
                {[...g.fields.entries()].map(([ft, cases]) => (
                  <div key={ft} className="mb-2">
                    <div className="px-1 py-1 text-[11.5px] font-medium text-tertiary">
                      {ft}
                    </div>
                    <ul className="space-y-1">
                      {cases.map((fc) => {
                        const active = fc.c.id === caseId;
                        return (
                          <li key={fc.c.id}>
                            <button
                              type="button"
                              onClick={() =>
                                setParams({ case: fc.c.id }, "push")
                              }
                              aria-current={active}
                              className={`block w-full rounded-lg border-l-[3px] px-3 py-2.5 text-left transition-colors ${
                                active
                                  ? "border-primary bg-white shadow-card"
                                  : "border-transparent hover:bg-white"
                              }`}
                            >
                              <span className="flex items-start gap-2">
                                <span
                                  className="mt-0.5 shrink-0 rounded px-1.5 py-px text-[10px] font-semibold"
                                  style={{
                                    background: "var(--chip-slate-bg)",
                                    color: "var(--chip-slate-fg)",
                                  }}
                                >
                                  {fc.c.chip}
                                </span>
                                <span
                                  className={`text-[13.5px] font-medium leading-snug ${
                                    active
                                      ? "text-primary"
                                      : "text-foreground"
                                  }`}
                                >
                                  {fc.c.title}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </section>
            ))
          )}
        </aside>

        {/* 상세 */}
        <main className={selected ? "" : "hidden lg:block"}>
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => router.back()}
                className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-2 text-[13px] font-medium text-foreground shadow-card lg:hidden"
              >
                <ArrowLeft size={14} /> 목록으로
              </button>
              <CaseDetail
                fc={selected}
                related={related}
                onSelectCase={(id) => setParams({ case: id }, "push")}
              />
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-cover border border-dashed border-border bg-white/60 p-10 text-center">
              <p className="text-[15px] font-medium text-foreground">
                왼쪽 목록에서 사례를 선택하세요
              </p>
              <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-tertiary">
                검색·호·분야·테마로 좁힐 수 있습니다. 각 사례는 신청 내용 →
                금융청 판단 → 배경 → 한국 시장 맥락 순으로 정리되어 있습니다.
              </p>
            </div>
          )}
        </main>
      </div>

      {glossaryOpen && <GlossaryPanel onClose={() => setGlossaryOpen(false)} />}
    </div>
  );
}
