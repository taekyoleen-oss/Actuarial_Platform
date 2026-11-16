"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/input";
import type { FacetKey } from "@/lib/exclusiveFacets";

type Opt = { value: string; count: number };

const FIELDS: { key: FacetKey; label: string }[] = [
  { key: "line", label: "보험 종류" },
  { key: "co", label: "회사" },
  { key: "cov", label: "보장" },
];

/** 배타적사용권 목록 필터 — 보험 종류·회사·보장 콤보박스(동시 적용) + 리셋. URL 쿼리(line·co·cov)로 상태 유지. */
export function ExclusiveFacets({
  options,
  selected,
}: {
  options: Record<FacetKey, Opt[]>;
  selected: Partial<Record<FacetKey, string>>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const push = (edit: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    edit(next);
    router.push(`/posts?${next.toString()}`, { scroll: false });
  };
  const anySel = FIELDS.some((f) => selected[f.key]);

  return (
    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end">
      {FIELDS.map(({ key, label }) => (
        <label key={key} className="flex flex-col gap-1">
          <span className="text-[13px] font-medium text-tertiary">{label}</span>
          <Select
            value={selected[key] ?? ""}
            onChange={(e) => push((p) => (e.target.value ? p.set(key, e.target.value) : p.delete(key)))}
            aria-label={label}
            className="bg-white"
          >
            <option value="">전체</option>
            {options[key]
              .filter((o) => o.count > 0 || selected[key] === o.value)
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value} ({o.count})
                </option>
              ))}
          </Select>
        </label>
      ))}
      <button
        type="button"
        disabled={!anySel}
        onClick={() => push((p) => FIELDS.forEach((f) => p.delete(f.key)))}
        className="h-10 rounded border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground"
      >
        ↺ 리셋
      </button>
    </div>
  );
}
