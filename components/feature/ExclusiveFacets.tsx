"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { FacetKey } from "@/lib/exclusiveFacets";

type Opt = { value: string; count: number };

/** 배타적사용권 목록 필터 — 보험 종류·회사·보장. 같은 값을 다시 누르면 해제, URL 쿼리(line·co·cov)로 상태 유지. */
export function ExclusiveFacets({
  options,
  selected,
}: {
  options: Record<FacetKey, Opt[]>;
  selected: Partial<Record<FacetKey, string>>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const set = (key: FacetKey, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/posts?${next.toString()}`, { scroll: false });
  };
  const anySel = Boolean(selected.line || selected.co || selected.cov);

  const row = (key: FacetKey, label: string, opts: Opt[], keepZero = false) => (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <span className="w-20 shrink-0 pt-1.5 text-[13px] font-medium text-tertiary">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {opts
          .filter((o) => keepZero || o.count > 0 || selected[key] === o.value)
          .map((o) => {
            const on = selected[key] === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={on}
                disabled={o.count === 0 && !on}
                onClick={() => set(key, on ? null : o.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[13px] font-medium transition-colors disabled:cursor-default disabled:opacity-40",
                  on
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:border-primary hover:text-primary"
                )}
              >
                {o.value}
                <span className={cn("ml-1 tabular-nums", on ? "text-white/80" : "text-tertiary")}>{o.count}</span>
              </button>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className="mt-5 space-y-3 glass-card rounded-cover border border-border bg-white p-4 shadow-card">
      {row("line", "보험 종류", options.line, true)}
      {row("co", "회사", options.co)}
      {row("cov", "보장", options.cov)}
      {anySel ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              ["line", "co", "cov"].forEach((k) => next.delete(k));
              router.push(`/posts?${next.toString()}`, { scroll: false });
            }}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            필터 초기화
          </button>
        </div>
      ) : null}
    </div>
  );
}
