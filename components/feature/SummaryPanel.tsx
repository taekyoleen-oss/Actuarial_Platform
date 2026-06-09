"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/badge";

/** AI 요약 패널 — "요약 보기" 클릭 시 /summarize 호출(캐시 우선). */
export function SummaryPanel({
  postId,
  initialSummary,
}: {
  postId: string;
  initialSummary: string | null;
}) {
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/posts/${postId}/summarize`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-cover bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-medium text-foreground">AI 요약</h2>
        {!summary && !loading && (
          <Button size="sm" onClick={load}>
            요약 보기
          </Button>
        )}
      </div>

      {loading && (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      )}
      {error && (
        <p className="mt-4 text-sm text-tertiary">
          요약 생성에 실패했습니다.{" "}
          <button onClick={load} className="text-primary">
            다시 시도
          </button>
        </p>
      )}
      {summary && !loading && (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-body">
          {summary}
        </p>
      )}
    </section>
  );
}
