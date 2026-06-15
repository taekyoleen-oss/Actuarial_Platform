import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Globe2,
  LayoutGrid,
  Newspaper,
  Scale,
  UserRound,
} from "lucide-react";
import { HeroSection } from "@/components/feature/HeroSection";
import { PostCard } from "@/components/feature/PostCard";
import { PostGrid } from "@/components/feature/PostGrid";
import { ResourceCard } from "@/components/feature/ResourceCard";
import { Reveal } from "@/components/feature/Reveal";
import { StatStrip } from "@/components/feature/StatStrip";
import { ThemeChip } from "@/components/feature/fsa/ThemeChip";
import { listDomesticProducts } from "@/lib/domesticProducts";
import { FSA_STATS } from "@/lib/japanFsa";
import { FSA_THEMES } from "@/data/japan-fsa/themes";
import { groupPosts } from "@/lib/postSections";
import { listCategories, listPosts } from "@/lib/queries";
import { THEORY_TOPICS, listTheoryItems } from "@/lib/theory";
import { excerpt } from "@/lib/utils";
import type { PostListItem } from "@/types";

export const revalidate = 60;

// 배타적사용권 공시 외부 자료 (협회 공식 페이지)
const RELATED_LINKS = [
  {
    title: "생명보험협회 배타적사용권 공시",
    description: "생명보험 신상품 배타적사용권 신청사항·심의결과",
    href: "https://www.klia.or.kr/member/exclUse/exclResult/list.do",
    domain: "klia.or.kr",
  },
  {
    title: "손해보험협회 배타적사용권 공시",
    description: "손해보험 신상품 배타적사용권 부여상품",
    href: "https://www.knia.or.kr/report/new-review/new-review02",
    domain: "knia.or.kr",
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-[22px] font-semibold text-foreground">
      <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
      {children}
    </h2>
  );
}

// 최신 자료 — 카테고리 항목(서브타이틀)별 최신 1건
type LatestCell =
  | { label: string; post: PostListItem; product?: undefined }
  | {
      label: string;
      product: { href: string; title: string; subtitle: string };
      post?: undefined;
    };

export default async function HomePage() {
  const [categories, recent] = await Promise.all([
    listCategories(),
    listPosts({ sort: "latest" }),
  ]);
  const theoryCount = THEORY_TOPICS.reduce(
    (s, t) => s + listTheoryItems(t.slug).length,
    0
  );
  const byCatSlug = new Map(categories.map((c) => [c.slug, c]));
  const exclusiveCat = byCatSlug.get("exclusive-rights");
  const domesticCat = byCatSlug.get("domestic");

  // 국내 '상품 정보' 항목의 정적 자료 — 건수 합산·최신 카드용
  const products = listDomesticProducts();
  const latestProduct = products[0];

  // 콘텐츠 카드용 최신 1건(배타적 사용권)
  const latestExclusive = recent.find(
    (p) => p.category.slug === "exclusive-rights"
  );

  // 최신 자료 — 각 카테고리 항목(서브타이틀)별 최신 1건
  const exclusiveGroups =
    groupPosts(
      "exclusive-rights",
      recent.filter((p) => p.category.slug === "exclusive-rights")
    ) ?? [];
  const domesticGroups =
    groupPosts(
      "domestic",
      recent.filter((p) => p.category.slug === "domestic")
    ) ?? [];

  const latestBySection: LatestCell[] = [];
  for (const g of exclusiveGroups) {
    if (g.posts[0]) latestBySection.push({ label: g.title, post: g.posts[0] });
  }
  for (const g of domesticGroups) {
    if (g.title === "상품 정보") {
      if (latestProduct)
        latestBySection.push({
          label: g.title,
          product: {
            href: `/domestic/products/${latestProduct.base}`,
            title: latestProduct.title,
            subtitle: latestProduct.subtitle,
          },
        });
    } else if (g.posts[0]) {
      latestBySection.push({ label: g.title, post: g.posts[0] });
    }
  }

  const tileBase =
    "group relative flex h-full flex-col rounded-cover border border-border bg-white p-6 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover";
  const tileEyebrow =
    "flex items-center gap-2.5 text-[11.5px] font-bold tracking-[0.14em] text-brand-sky";
  const tileIcon =
    "flex h-9 w-9 items-center justify-center rounded-lg";
  const tileCta =
    "mt-auto inline-flex items-center gap-1.5 pt-4 text-[13.5px] font-semibold text-primary";

  return (
    <>
      <HeroSection />
      <section className="mx-auto max-w-container px-6 pb-24 pt-10">
        {/* 스탯 스트립 — 카운트업 */}
        <Reveal>
          <StatStrip
            items={[
              {
                label: "게시 자료",
                value: recent.length + products.length,
                suffix: "건",
                href: "/posts?category=exclusive-rights",
              },
              {
                label: "일본 금융청 심사사례",
                value: FSA_STATS.cases,
                suffix: "건",
                href: "/global/japan-fsa",
              },
              {
                label: "보험이론 사전 문서",
                value: theoryCount,
                suffix: "편",
                href: "/theory",
              },
              {
                label: "KCI 연구 논문",
                value: 8,
                suffix: "편",
                href: "/about#research",
              },
            ]}
          />
        </Reveal>

        {/* 벤토 그리드 — 콘텐츠 한눈에 */}
        <div className="mt-16">
          <div className="mb-6 flex items-end justify-between">
            <SectionHeading>콘텐츠 한눈에</SectionHeading>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* 배타적 사용권 — 가장 최근 자료 */}
            <Reveal>
              <Link
                href={
                  latestExclusive
                    ? `/posts/${latestExclusive.id}`
                    : "/posts?category=exclusive-rights"
                }
                className={tileBase}
              >
                <div className={tileEyebrow}>
                  <span
                    className={tileIcon}
                    style={{
                      background: "var(--chip-rose-bg)",
                      color: "var(--chip-rose-fg)",
                    }}
                  >
                    <Scale size={18} />
                  </span>
                  EXCLUSIVE · 배타적 사용권
                </div>
                <h3 className="mt-4 text-[18px] font-semibold leading-snug text-foreground group-hover:text-primary">
                  {latestExclusive?.title ??
                    exclusiveCat?.name ??
                    "보험 배타적 사용권 분석"}
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.75] text-body">
                  {latestExclusive
                    ? excerpt(latestExclusive.content, 90)
                    : exclusiveCat?.description ??
                      "신상품 배타적사용권 심의 결과를 급부 구조 중심으로 분석합니다."}
                </p>
                <span className={tileCta}>
                  최신 분석 보기{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-tesla group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Reveal>

            {/* 국내 보험 정보·분석 — 상품정보 최신 자료 */}
            <Reveal delay={40}>
              <Link
                href={
                  latestProduct
                    ? `/domestic/products/${latestProduct.base}`
                    : "/posts?category=domestic"
                }
                className={tileBase}
              >
                <div className={tileEyebrow}>
                  <span
                    className={tileIcon}
                    style={{
                      background: "var(--chip-green-bg)",
                      color: "var(--chip-green-fg)",
                    }}
                  >
                    <LayoutGrid size={18} />
                  </span>
                  DOMESTIC · 국내 보험 정보·분석
                </div>
                <h3 className="mt-4 text-[18px] font-semibold leading-snug text-foreground group-hover:text-primary">
                  {latestProduct?.title ??
                    domesticCat?.name ??
                    "국내 보험 정보·분석"}
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.75] text-body">
                  {latestProduct?.subtitle ||
                    domesticCat?.description ||
                    "국내 보험 시장의 정보와 분석 자료를 제공합니다."}
                </p>
                <span className={tileCta}>
                  최신 상품정보 보기{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-tesla group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Reveal>

            {/* 뉴스 */}
            <Reveal delay={80}>
              <Link href="/news" className={tileBase}>
                <div className={tileEyebrow}>
                  <span
                    className={tileIcon}
                    style={{
                      background: "var(--chip-amber-bg)",
                      color: "var(--chip-amber-fg)",
                    }}
                  >
                    <Newspaper size={18} />
                  </span>
                  NEWS · 보험 뉴스
                </div>
                <h3 className="mt-4 text-[18px] font-semibold leading-snug text-foreground group-hover:text-primary">
                  보험 뉴스 대시보드
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.75] text-body">
                  생보·손보·헬스케어 뉴스를 매일 수집해 정리합니다.
                </p>
                <span className={tileCta}>
                  뉴스 보기{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-tesla group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Reveal>

            {/* 보험이론 사전 */}
            <Reveal delay={120}>
              <Link href="/theory" className={tileBase}>
                <div className={tileEyebrow}>
                  <span
                    className={tileIcon}
                    style={{
                      background: "var(--chip-teal-bg)",
                      color: "var(--chip-teal-fg)",
                    }}
                  >
                    <BookOpen size={18} />
                  </span>
                  THEORY · 보험이론 사전
                </div>
                <h3 className="mt-4 text-[20px] font-semibold leading-snug text-foreground group-hover:text-primary">
                  생명·손해·재보험·통계 {theoryCount}편 해설서
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.75] text-body">
                  이론과 한국 보험시장 현황을 함께 다루는 학습 해설서
                  모음입니다.
                </p>
                <span className={tileCta}>
                  사전 펼치기{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-tesla group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Reveal>

            {/* 대형: 해외 자료 */}
            <Reveal className="md:col-span-2" delay={60}>
              <Link href="/posts?category=global" className={tileBase}>
                <div className={tileEyebrow}>
                  <span
                    className={tileIcon}
                    style={{
                      background: "var(--chip-blue-bg)",
                      color: "var(--chip-blue-fg)",
                    }}
                  >
                    <Globe2 size={18} />
                  </span>
                  GLOBAL · 해외 주요 보험 정보·자료
                </div>
                <h3 className="mt-4 text-[22px] font-semibold leading-snug text-foreground group-hover:text-primary sm:text-[24px]">
                  일본 금융청 심사사례 {FSA_STATS.cases}건, 테마·기간·분야로
                  탐색
                </h3>
                <p className="mt-2 text-[15px] leading-[1.8] text-body">
                  금융청 심사사례집({FSA_STATS.periods}개 호)·생명보험
                  동향·변천 가이드를 사이트 일체형 페이지로 — 용어 해설과 한국
                  시장 맥락(유사 사례·현황·규정)까지 함께 제공합니다.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {FSA_THEMES.slice(0, 6).map((t) => (
                    <ThemeChip key={t.id} themeId={t.id} />
                  ))}
                </div>
                <span className={tileCta}>
                  해외 자료 보기{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-tesla group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Reveal>

            {/* 앱 */}
            <Reveal className="md:col-span-2" delay={60}>
              <Link href="/apps" className={tileBase}>
                <div className={tileEyebrow}>
                  <span
                    className={tileIcon}
                    style={{
                      background: "var(--chip-cyan-bg)",
                      color: "var(--chip-cyan-fg)",
                    }}
                  >
                    <LayoutGrid size={18} />
                  </span>
                  APPS · 모델분석/업무지원
                </div>
                <h3 className="mt-4 text-[20px] font-semibold leading-snug text-foreground group-hover:text-primary">
                  보험료 자동산출·머신러닝 플로우 등 실무 앱 7종
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.75] text-body">
                  모델분석 2종과 강의 지원·PDF·계산기·화이트보드·수식변환 등
                  업무지원 5종을 바로 사용할 수 있습니다.
                </p>
                <span className={tileCta}>
                  앱 모음 보기{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-tesla group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Reveal>

            {/* 만든이 */}
            <Reveal delay={120}>
              <Link href="/about" className={tileBase}>
                <div className={tileEyebrow}>
                  <span
                    className={tileIcon}
                    style={{
                      background: "var(--chip-violet-bg)",
                      color: "var(--chip-violet-fg)",
                    }}
                  >
                    <UserRound size={18} />
                  </span>
                  ABOUT · 만든이
                </div>
                <h3 className="mt-4 text-[18px] font-semibold leading-snug text-foreground group-hover:text-primary">
                  보험계리사 · 경영학 박사
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.75] text-body">
                  30년 재보험 실무, KCI 논문 8편 — 만든이의 경력과 연구를
                  소개합니다.
                </p>
                <span className={tileCta}>
                  소개 보기{" "}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-tesla group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </Reveal>
          </div>
        </div>

        {/* 최신 자료 — 항목(서브타이틀)별 최신 1건 */}
        <div className="mt-20">
          <div className="mb-6 flex items-end justify-between">
            <SectionHeading>최신 자료</SectionHeading>
            <Link href="/posts" className="text-sm font-medium text-primary">
              전체 보기
            </Link>
          </div>
          {latestBySection.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {latestBySection.map((cell) => (
                <div key={cell.label} className="flex flex-col">
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-brand-sky">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 bg-brand-sky"
                    />
                    {cell.label}
                  </p>
                  <div className="flex-1">
                    {cell.post ? (
                      <PostCard post={cell.post} />
                    ) : (
                      <ResourceCard
                        href={cell.product.href}
                        title={cell.product.title}
                        subtitle={cell.product.subtitle}
                        badge="국내 보험 정보·분석"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PostGrid posts={recent.slice(0, 6)} />
          )}
        </div>

        {/* 관련 링크 */}
        <div className="mt-20">
          <div className="mb-6">
            <SectionHeading>관련 링크</SectionHeading>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {RELATED_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-cover border border-border bg-white p-6 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:border-foreground hover:shadow-card-hover"
              >
                <h3 className="text-[18px] font-semibold text-brand-sky">
                  {l.title}
                </h3>
                <p className="mt-2 text-sm text-tertiary">{l.description}</p>
                <span className="mt-3 inline-block text-sm font-medium text-primary">
                  {l.domain} ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
