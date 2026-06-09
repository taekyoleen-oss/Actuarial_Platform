"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { NEWS_CATEGORIES } from "@/types";

// 뉴스 카테고리 탭 + 검색. URL 쿼리로 상태 관리.
export function NewsFilters({
  current,
  q,
}: {
  current?: string;
  q?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`/news?${next.toString()}`);
    },
    [params, router]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Tab active={!current} onClick={() => setParam("category", null)}>
          전체
        </Tab>
        {NEWS_CATEGORIES.map((c) => (
          <Tab
            key={c}
            active={current === c}
            onClick={() => setParam("category", c)}
          >
            {c}
          </Tab>
        ))}
      </div>
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
          placeholder="뉴스 검색"
          className="h-10 w-full rounded border border-border bg-transparent px-3 text-sm placeholder:text-placeholder focus-visible:border-foreground focus-visible:outline-none"
        />
      </form>
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
