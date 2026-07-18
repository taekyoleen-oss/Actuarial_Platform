import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataPostCard } from "@/components/feature/datalab/DataPostCard";
import { DataLabTabs } from "@/components/feature/datalab/DataLabTabs";
import { ExcelFunctionCloud } from "@/components/feature/datalab/ExcelFunctionCloud";
import { MethodCloud } from "@/components/feature/datalab/MethodCloud";
import { RunnerPanel } from "@/components/feature/datalab/RunnerPanel";
import { DistributionLab } from "@/components/feature/datalab/DistributionLab";
import { FitLab } from "@/components/feature/datalab/FitLab";
import { listDataPosts } from "@/lib/datalab";
import type { SortOrder } from "@/types";

export const revalidate = 30;

export default async function DataLabPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const sort: SortOrder = sp.sort === "popular" ? "popular" : "latest";
  const q = sp.q?.trim() || undefined;

  const posts = await listDataPosts({ q, sort });

  // 정렬 링크 — 현재 검색어 유지
  const sortHref = (s: SortOrder) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s !== "latest") p.set("sort", s);
    const qs = p.toString();
    return qs ? `/datalab?${qs}` : "/datalab";
  };

  const sortTab = (label: string, active: boolean, href: string) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-sm transition-colors ${
        active
          ? "bg-foreground text-white"
          : "text-tertiary hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-[28px]">
          데이터 예제/분석
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-tertiary">
          산재된 데이터를 엑셀 함수·VBA·Python으로 정리·분석해 보관하고
          업데이트하는 공간입니다.
        </p>
      </header>

      <DataLabTabs
        excel={<ExcelFunctionCloud />}
        pyrun={<RunnerPanel />}
        analysis={<MethodCloud />}
        distributions={<DistributionLab />}
        fitting={<FitLab />}
        examples={
          <>
            <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
              <form method="get" className="flex items-center gap-2">
                {sort !== "latest" ? (
                  <input type="hidden" name="sort" value={sort} />
                ) : null}
                <input
                  type="search"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="데이터·출처 검색"
                  aria-label="데이터 검색"
                  className="h-10 w-full min-w-[220px] max-w-sm rounded border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-placeholder focus-visible:border-foreground focus-visible:outline-none"
                />
                <Button type="submit" size="sm">
                  검색
                </Button>
                {q ? (
                  <Link
                    href={
                      sort !== "latest" ? `/datalab?sort=${sort}` : "/datalab"
                    }
                    className="text-sm text-tertiary hover:text-foreground"
                  >
                    초기화
                  </Link>
                ) : null}
              </form>

              <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                {sortTab("최신순", sort === "latest", sortHref("latest"))}
                {sortTab("인기순", sort === "popular", sortHref("popular"))}
              </div>
            </div>

            {posts.length === 0 ? (
              <p className="py-24 text-center text-sm text-tertiary">
                {q
                  ? "검색 결과가 없습니다."
                  : "아직 게시된 데이터가 없습니다. 첫 데이터를 준비 중입니다."}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <DataPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </>
        }
      />
    </div>
  );
}
