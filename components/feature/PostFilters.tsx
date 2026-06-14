"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category, SortOrder } from "@/types";

// CategoryTabs(미선택 시) / 서브카테고리(항목) 탭(카테고리 선택 시) + SearchBar + SortSelect.
// URL 쿼리로 상태 관리(서버 렌더와 동기). 카테고리는 상단 내비로 이동하므로
// 카테고리 선택 후에는 전체 카테고리 탭 대신 해당 카테고리의 항목 탭을 노출(2026-06-14 사용자 요청).
export function PostFilters({
  categories,
  current,
  q,
  sort,
  subsections,
  currentSub,
}: {
  categories: Category[];
  current?: string;
  q?: string;
  sort: SortOrder;
  /** 선택한 카테고리의 항목(subsection) 목록 — 있으면 카테고리 탭 대신 표시 */
  subsections?: string[];
  /** 현재 선택된 항목 */
  currentSub?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const setParams = useCallback(
    (entries: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(entries)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      router.push(`/posts?${next.toString()}`);
    },
    [params, router]
  );
  const setParam = useCallback(
    (key: string, value: string | null) => setParams({ [key]: value }),
    [setParams]
  );

  const showSub = Boolean(current && subsections && subsections.length > 0);

  return (
    <div className="space-y-5">
      {/* 카테고리 선택 시: 항목(서브카테고리) 탭 / 미선택 시: 카테고리 탭 */}
      {showSub ? (
        <div className="flex flex-wrap gap-2">
          <Tab active={!currentSub} onClick={() => setParam("sub", null)}>
            전체
          </Tab>
          {subsections!.map((s) => (
            <Tab
              key={s}
              active={currentSub === s}
              onClick={() => setParam("sub", s)}
            >
              {s}
            </Tab>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Tab
            active={!current}
            onClick={() => setParams({ category: null, sub: null })}
          >
            전체
          </Tab>
          {categories.map((c) => (
            <Tab
              key={c.id}
              active={current === c.slug}
              onClick={() => setParams({ category: c.slug, sub: null })}
            >
              {c.name}
            </Tab>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* SearchBar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget).get("q");
            setParam("q", String(v || "") || null);
          }}
          className="w-full sm:max-w-xs"
        >
          <input
            name="q"
            defaultValue={q}
            placeholder="제목·본문 검색"
            className="h-10 w-full rounded border border-border bg-transparent px-3 text-sm placeholder:text-placeholder focus-visible:border-foreground focus-visible:outline-none"
          />
        </form>

        {/* SortSelect */}
        <Select
          defaultValue={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="w-36"
          aria-label="정렬"
        >
          <option value="latest">최신순</option>
          <option value="popular">인기순</option>
        </Select>
      </div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded px-3 py-1.5 text-sm font-medium",
        active
          ? "bg-foreground text-white"
          : "bg-surface text-tertiary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
