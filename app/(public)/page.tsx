import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Database,
  Globe2,
  LayoutGrid,
  Scale,
} from "lucide-react";
import { GlobeBackdrop } from "@/components/feature/GlobeBackdrop";
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

function SectionHeading({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <h2 className="flex items-center gap-3 text-[28px] font-semibold tracking-[-0.02em] text-foreground sm:text-[36px]">
      <span aria-hidden className="h-2.5 w-2.5 shrink-0 bg-brand-sky" />
      {children}
      {typeof count === "number" ? (
        <span className="rounded-full border border-foreground/15 px-2.5 py-0.5 text-[13px] font-medium tabular-nums text-tertiary">
          {count}
        </span>
      ) : null}
    </h2>
  );
}

// 콘텐츠 인덱스 한 줄 — 번호 · 분류 · 제목 · 설명 · 화살표 (괘선 행)
interface IndexRowProps {
  no: string;
  href: string;
  eyebrow: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  title: string;
  description: string;
  cta: string;
  extra?: React.ReactNode;
}

function IndexRow({ no, href, eyebrow, icon: I, color, title, description, cta, extra }: IndexRowProps) {
  return (
    <Link
      href={href}
      className="index-row group grid gap-4 border-b border-foreground/10 py-8 lg:grid-cols-[64px_minmax(0,1.15fr)_minmax(0,1fr)_48px] lg:items-start lg:gap-10"
    >
      <span className="text-[15px] font-medium tabular-nums text-tertiary">{no}</span>
      <div>
        <p className="flex items-center gap-2.5 text-[11.5px] font-bold tracking-[0.14em] text-brand-sky">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `var(--chip-${color}-bg)`, color: `var(--chip-${color}-fg)` }}
          >
            <I size={16} />
          </span>
          {eyebrow}
        </p>
        <h3 className="mt-4 text-[21px] font-semibold leading-snug tracking-[-0.01em] text-foreground group-hover:text-primary sm:text-[24px]">
          {title}
        </h3>
      </div>
      <div className="lg:pt-12">
        <p className="text-[14.5px] leading-[1.8] text-body">{description}</p>
        {extra}
        <span className="mt-3 inline-flex text-[13.5px] font-semibold text-primary lg:hidden">
          {cta} →
        </span>
      </div>
      <span
        aria-hidden
        className="index-arrow hidden h-12 w-12 items-center justify-center rounded-full border border-foreground/15 text-foreground lg:mt-10 lg:flex"
      >
        <ArrowUpRight size={18} />
      </span>
      <span className="sr-only">{cta}</span>
    </Link>
  );
}

// 최신 자료 — 카테고리 항목(서브타이틀)별 최신 1건
type LatestCell =
  | { label: string; post: PostListItem; product?: undefined }
  | {
      label: string;
      product: {
        href: string;
        title: string;
        subtitle: string;
        description: string;
      };
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

  // 국내 정적 자료 — 건수 합산·최신 카드용
  const products = listDomesticProducts();
  const coverageProducts = products.filter((p) => p.section === "보장내용 분석");
  // 벤토 '국내' 카드: '보장내용 분석' 항목의 대표 자료
  const latestProduct = coverageProducts[0];

  // 배타적 사용권 게시물 — 콘텐츠 카드·스탯용
  const exclusivePosts = recent.filter(
    (p) => p.category.slug === "exclusive-rights"
  );
  const latestExclusive = exclusivePosts[0];

  // 최신 자료 — 각 카테고리 항목(서브타이틀)별 최신 1건
  const exclusiveGroups =
    groupPosts("exclusive-rights", exclusivePosts) ?? [];
  const domesticGroups =
    groupPosts(
      "domestic",
      recent.filter((p) => p.category.slug === "domestic")
    ) ?? [];

  // 스탯: 배타적 사용권 분석 건수 / 보장내용 분석 건수(상품 자료 + 상품 게시물)
  const exclusiveCount = exclusivePosts.length;
  const coverageGroup = domesticGroups.find((g) => g.title === "보장내용 분석");
  const coverageCount =
    (coverageGroup?.posts.length ?? 0) + coverageProducts.length;

  const latestBySection: LatestCell[] = [];
  for (const g of exclusiveGroups) {
    if (g.posts[0]) latestBySection.push({ label: g.title, post: g.posts[0] });
  }
  for (const g of domesticGroups) {
    // 항목별 최신 1건: DB 게시물 우선, 없으면 해당 항목의 정적 자료
    if (g.posts[0]) {
      latestBySection.push({ label: g.title, post: g.posts[0] });
    } else {
      const secProduct = products.find((p) => p.section === g.title);
      if (secProduct)
        latestBySection.push({
          label: g.title,
          product: {
            href: `/domestic/products/${secProduct.base}`,
            title: secProduct.title,
            subtitle: secProduct.subtitle,
            description: secProduct.description,
          },
        });
    }
  }

  return (
    <>
      {/* 배경: 회전 지구본 워터마크 — 보험료 규모 Top10 + 흐름 아크(홈 전용) */}
      <GlobeBackdrop />
      <HeroSection />
      <section className="home-glass mx-auto max-w-container px-6 pb-28 pt-12">
        {/* 스탯 스트립 — 카운트업 */}
        <Reveal>
          <StatStrip
            items={[
              {
                label: "배타적 사용권 분석",
                value: exclusiveCount,
                suffix: "건",
                href: "/posts?category=exclusive-rights",
              },
              {
                label: "보장내용 분석",
                value: coverageCount,
                suffix: "건",
                href: "/posts?category=domestic",
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
            ]}
          />
        </Reveal>

        {/* 콘텐츠 인덱스 — 괘선 행 목록 (링크·내용은 기존 벤토와 동일) */}
        <div className="mt-20">
          <SectionHeading count={6}>콘텐츠 한눈에</SectionHeading>
          <div className="index-panel mt-8 border-t border-foreground/10">
            <Reveal>
              <IndexRow
                no="01"
                href={latestExclusive ? `/posts/${latestExclusive.id}` : "/posts?category=exclusive-rights"}
                eyebrow="EXCLUSIVE · 배타적 사용권"
                icon={Scale}
                color="rose"
                title={latestExclusive?.title ?? exclusiveCat?.name ?? "보험 배타적 사용권 분석"}
                description={
                  latestExclusive
                    ? excerpt(latestExclusive.content, 110)
                    : exclusiveCat?.description ??
                      "신상품 배타적사용권 심의 결과를 급부 구조 중심으로 분석합니다."
                }
                cta="최신 분석 보기"
              />
            </Reveal>
            <Reveal>
              <IndexRow
                no="02"
                href={latestProduct ? `/domestic/products/${latestProduct.base}` : "/posts?category=domestic"}
                eyebrow="DOMESTIC · 국내 보험 정보·분석"
                icon={LayoutGrid}
                color="green"
                title={latestProduct?.title ?? domesticCat?.name ?? "국내 보험 정보·분석"}
                description={
                  latestProduct?.subtitle ||
                  domesticCat?.description ||
                  "국내 보험 시장의 정보와 분석 자료를 제공합니다."
                }
                cta="최신 상품정보 보기"
              />
            </Reveal>
            <Reveal>
              <IndexRow
                no="03"
                href="/posts?category=global"
                eyebrow="GLOBAL · 해외 주요 보험 정보·자료"
                icon={Globe2}
                color="blue"
                title={`일본 금융청 심사사례 ${FSA_STATS.cases}건, 테마·기간·분야로 탐색`}
                description={`금융청 심사사례집(${FSA_STATS.periods}개 호)·생명보험 동향·변천 가이드를 사이트 일체형 페이지로 — 용어 해설과 한국 시장 맥락까지 함께 제공합니다.`}
                cta="해외 자료 보기"
                extra={
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {FSA_THEMES.slice(0, 4).map((t) => (
                      <ThemeChip key={t.id} themeId={t.id} />
                    ))}
                  </div>
                }
              />
            </Reveal>
            <Reveal>
              <IndexRow
                no="04"
                href="/theory"
                eyebrow="THEORY · 보험이론 사전"
                icon={BookOpen}
                color="teal"
                title={`생명·연금·손해·재보험·위험·금융·통계 ${theoryCount}편 해설서`}
                description="이론과 한국 보험시장 현황을 함께 다루는 학습 해설서 모음입니다."
                cta="사전 펼치기"
              />
            </Reveal>
            <Reveal>
              <IndexRow
                no="05"
                href="/datalab"
                eyebrow="DATALAB · 데이터 예제/분석"
                icon={Database}
                color="slate"
                title="엑셀 함수·VBA·Python으로 정리·분석한 데이터 예제"
                description="산재된 데이터를 정리·분석해 보관하고, 워크북을 웹에서 바로 열람하거나 다운로드할 수 있는 공간입니다."
                cta="데이터 살펴보기"
              />
            </Reveal>
            <Reveal>
              <IndexRow
                no="06"
                href="/apps"
                eyebrow="APPS · 모델분석/업무지원"
                icon={LayoutGrid}
                color="cyan"
                title="보험 실무 앱 모음"
                description="보험료 산출·머신러닝·DFA 등 모델분석 4종과 강의 지원·PDF·계산기·화이트보드 등 업무지원 7종. 우측 상단 앱 메뉴에서도 바로 열 수 있습니다."
                cta="앱 모음 보기"
              />
            </Reveal>
          </div>
        </div>

        {/* 사진 + 소개 — 보험 증권·통계 그래프 (Unsplash License) */}
        <div className="mt-24 grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-14">
          <Reveal className="lg:col-span-7">
            <div className="media-zoom relative aspect-[4/3] overflow-hidden rounded-cover bg-surface">
              <Image
                src="/images/insurance-policy.jpg"
                alt="보험 증권 서류 위에 놓인 돋보기"
                fill
                sizes="(min-width: 1024px) 56vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal className="index-panel rounded-cover p-6 lg:col-span-5 lg:p-8" delay={80}>
            <p className="text-[11.5px] font-bold tracking-[0.14em] text-brand-sky">
              ABOUT THE BOARD
            </p>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.3] tracking-[-0.02em] text-foreground sm:text-[34px]">
              출처가 분명한 자료를,
              <br />
              근거와 함께 읽습니다
            </h2>
            <p className="mt-5 text-[15px] leading-[1.85] text-body">
              협회 공시와 원문 PDF, 해외 감독기관 자료를 출처와 함께 정리하고, 보험이론
              해설과 데이터 예제로 해석을 돕습니다.
            </p>
            <div className="media-zoom relative mt-8 aspect-[3/2] overflow-hidden rounded-cover bg-surface">
              <Image
                src="/images/statistics-graph.jpg"
                alt="자와 펜 옆에 손으로 그린 통계 그래프"
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover"
              />
            </div>
            <Link
              href="/about"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full border border-foreground/25 px-5 text-[14px] font-semibold text-foreground hover:border-foreground hover:bg-foreground hover:text-white"
            >
              만든이 소개 <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>

        {/* 최신 자료 — 항목(서브타이틀)별 최신 1건 */}
        <div className="mt-24">
          <div className="mb-8 flex items-end justify-between">
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
                        description={cell.product.description}
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

        {/* 관련 링크 — 괘선 행 */}
        <div className="mt-24">
          <SectionHeading>관련 링크</SectionHeading>
          <ul className="index-panel mt-8 grid border-t border-foreground/10 sm:grid-cols-2 sm:gap-x-10">
            {RELATED_LINKS.map((l) => (
              <li key={l.href} className="border-b border-foreground/10">
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="index-row group flex items-start justify-between gap-6 py-6"
                >
                  <span>
                    <span className="block text-[18px] font-semibold text-foreground group-hover:text-primary">
                      {l.title}
                    </span>
                    <span className="mt-1.5 block text-sm text-tertiary">{l.description}</span>
                    <span className="mt-2 block text-[13px] font-medium text-primary">{l.domain}</span>
                  </span>
                  <span
                    aria-hidden
                    className="index-arrow flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-foreground/15"
                  >
                    <ArrowUpRight size={16} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
