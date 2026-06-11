import Link from "next/link";
import { HeroSection } from "@/components/feature/HeroSection";
import { PostGrid } from "@/components/feature/PostGrid";
import { listCategories, listPosts } from "@/lib/queries";

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

export default async function HomePage() {
  const [categories, recent] = await Promise.all([
    listCategories(),
    listPosts({ sort: "latest" }),
  ]);

  return (
    <>
      <HeroSection />
      <section className="mx-auto max-w-container px-6 pb-24 pt-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="flex items-center gap-2.5 text-xl font-medium text-foreground">
            <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
            최신 자료
          </h2>
          <Link href="/posts" className="text-sm font-medium text-primary">
            전체 보기
          </Link>
        </div>
        <PostGrid posts={recent.slice(0, 6)} />

        <div className="mt-20">
          <h2 className="mb-6 flex items-center gap-2.5 text-xl font-medium text-foreground">
            <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
            카테고리
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/posts?category=${c.slug}`}
                className="group flex flex-col rounded-cover border border-border bg-white p-6 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:border-foreground hover:shadow-card-hover"
              >
                <h3 className="text-[17px] font-semibold text-brand-sky">
                  {c.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-tertiary">
                  {c.description}
                </p>
                <span className="mt-4 text-sm font-medium text-tertiary group-hover:text-primary">
                  바로가기 →
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-20">
          <h2 className="mb-6 flex items-center gap-2.5 text-xl font-medium text-foreground">
            <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
            관련 링크
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {RELATED_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-cover border border-border bg-white p-6 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:border-foreground hover:shadow-card-hover"
              >
                <h3 className="text-[17px] font-semibold text-brand-sky">
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
