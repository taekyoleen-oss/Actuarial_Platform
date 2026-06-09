"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Category, SortOrder } from "@/types";

// CategoryTabs + SearchBar + SortSelect 통합. URL 쿼리로 상태 관리(서버 렌더와 동기).
export function PostFilters({
  categories,
  current,
  q,
  sort,
}: {
  categories: Category[];
  current?: string;
  q?: string;
  sort: SortOrder;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/posts?${next.toString()}`);
    },
    [params, router]
  );

  return (
    <div className="space-y-5">
      {/* CategoryTabs */}
      <div className="flex flex-wrap gap-2">
        <Tab active={!current} onClick={() => setParam("category", null)}>
          전체
        </Tab>
        {categories.map((c) => (
          <Tab
            key={c.id}
            active={current === c.slug}
            onClick={() => setParam("category", c.slug)}
          >
            {c.name}
          </Tab>
        ))}
      </div>

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
