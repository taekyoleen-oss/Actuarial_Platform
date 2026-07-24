import { BrandBackdrop } from "@/components/feature/BrandBackdrop";
import { Collapsible } from "@/components/feature/Collapsible";
import { PostBoard, type BoardItem } from "@/components/feature/PostBoard";
import { PostCard } from "@/components/feature/PostCard";
import { PostFilters } from "@/components/feature/PostFilters";
import { PostGrid } from "@/components/feature/PostGrid";
import { ResourceCard } from "@/components/feature/ResourceCard";
import { RandomLetterSwap } from "@/components/feature/RandomLetterSwap";
import { listDomesticProducts } from "@/lib/domesticProducts";
import { nativePathFromContent } from "@/lib/global";
import { groupPosts } from "@/lib/postSections";
import { listCategories, listPosts } from "@/lib/queries";
import { excerpt, formatDate } from "@/lib/utils";
import type { SortOrder } from "@/types";

export const revalidate = 30;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    sub?: string;
    view?: string;
  }>;
}) {
  const sp = await searchParams;
  const sort: SortOrder = sp.sort === "popular" ? "popular" : "latest";
  const view: "card" | "board" = sp.view === "board" ? "board" : "card";

  const [categories, posts] = await Promise.all([
    listCategories(),
    listPosts({ categorySlug: sp.category, q: sp.q, sort }),
  ]);

  // 자료실 → 선택한 메뉴 이름 + 서브타이틀(카테고리 설명)로 표시(2026-06-14 사용자 요청).
  const activeCategory = sp.category
    ? categories.find((c) => c.slug === sp.category)
    : undefined;
  const heading = activeCategory?.name ?? "자료실";
  const subtitle = activeCategory?.description;

  // 카테고리별 항목(subsection) 분류 — exclusive-rights / domestic 만 그룹핑.
  const grouped = groupPosts(sp.category, posts);

  // 국내 '상품 정보' 항목에 정적 상품 자료(12종)를 합류(iframe 뷰어로 연결).
  const q = sp.q?.trim().toLowerCase();
  const products = sp.category === "domestic" ? listDomesticProducts() : [];
  const extraProducts = q
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q)
      )
    : products;

  // 항목(서브카테고리) 탭 — 선택 항목만 노출(없으면 전체 항목).
  const subsections = grouped?.map((g) => g.title) ?? [];
  const visibleSections = grouped
    ? sp.sub
      ? grouped.filter((g) => g.title === sp.sub)
      : grouped
    : null;
  const groupedTotal = visibleSections
    ? visibleSections.reduce(
        (n, s) =>
          n +
          s.posts.length +
          (sp.category === "domestic"
            ? extraProducts.filter((p) => p.section === s.title).length
            : 0),
        0
      )
    : posts.length;

  // 배타적 사용권 목록 전용: tkLeen 마크 워터마크(홈에서 이전) + 글래스 카드.
  // 크기·드리프트는 .brand-backdrop, 카드 투명도는 .home-glass 기존 컨벤션 그대로.
  const isExclusive = sp.category === "exclusive-rights";

  return (
    <div
      className={`mx-auto max-w-container px-6 py-12${
        isExclusive ? " home-glass" : ""
      }`}
    >
      {isExclusive ? <BrandBackdrop /> : null}
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-[28px]">
          <RandomLetterSwap label={heading} />
        </h1>
        {subtitle ? (
          <p className="mt-2 text-[15px] leading-relaxed text-tertiary">
            {subtitle}
          </p>
        ) : null}
      </header>

      <PostFilters
        categories={categories}
        current={sp.category}
        q={sp.q}
        sort={sort}
        subsections={subsections}
        currentSub={sp.sub}
        showViewToggle={Boolean(grouped)}
        view={view}
      />

      <div className="mt-10">
        {visibleSections ? (
          groupedTotal === 0 ? (
            <p className="py-20 text-center text-sm text-tertiary">
              게시된 자료가 없습니다.
            </p>
          ) : (
            <div className="space-y-12">
              {visibleSections.map((section) => {
                const extras =
                  sp.category === "domestic"
                    ? extraProducts.filter((p) => p.section === section.title)
                    : [];
                if (section.posts.length === 0 && extras.length === 0)
                  return null;
                // 게시판 보기: 게시물·정적자료를 공통 BoardItem으로 펼쳐 위→아래 나열.
                const boardItems: BoardItem[] = [
                  ...section.posts.map((p) => ({
                    key: p.id,
                    href: nativePathFromContent(p.content) ?? `/posts/${p.id}`,
                    title: p.title,
                    description: excerpt(p.content, 200),
                    meta: `${formatDate(p.created_at)} · 조회 ${p.view_count}`,
                  })),
                  ...extras.map((p) => ({
                    key: p.base,
                    href: `/domestic/products/${p.base}`,
                    title: p.title,
                    description: p.description,
                    meta: p.subtitle,
                  })),
                ];
                return (
                  <Collapsible
                    key={section.title}
                    title={section.title}
                    count={section.posts.length + extras.length}
                    storageKey={`posts:${sp.category}:${section.title}`}
                  >
                    {view === "board" ? (
                      <PostBoard items={boardItems} />
                    ) : (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {section.posts.map((p) => (
                          <PostCard key={p.id} post={p} />
                        ))}
                        {extras.map((p) => (
                          <ResourceCard
                            key={p.base}
                            href={`/domestic/products/${p.base}`}
                            title={p.title}
                            subtitle={p.subtitle}
                            description={p.description}
                            badge={activeCategory?.name}
                          />
                        ))}
                      </div>
                    )}
                  </Collapsible>
                );
              })}
            </div>
          )
        ) : (
          <PostGrid posts={posts} />
        )}
      </div>
    </div>
  );
}
