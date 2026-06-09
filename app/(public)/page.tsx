import Link from "next/link";
import { HeroSection } from "@/components/feature/HeroSection";
import { PostGrid } from "@/components/feature/PostGrid";
import { listCategories, listPosts } from "@/lib/queries";

export const revalidate = 60;

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
          <h2 className="text-xl font-medium text-foreground">최신 자료</h2>
          <Link href="/posts" className="text-sm font-medium text-primary">
            전체 보기
          </Link>
        </div>
        <PostGrid posts={recent.slice(0, 6)} />

        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/posts?category=${c.slug}`}
              className="rounded-cover border border-border p-6 hover:border-foreground"
            >
              <h3 className="text-[17px] font-medium text-foreground">
                {c.name}
              </h3>
              <p className="mt-2 text-sm text-tertiary">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
