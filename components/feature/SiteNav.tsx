import Link from "next/link";

// 화이트/프로스트 글래스 sticky 내비, 그림자 없음.
export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-container items-center justify-between px-6">
        <Link href="/" className="text-[15px] font-medium text-foreground">
          Insurance Insights
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href="/posts" className="text-tertiary hover:text-foreground">
            자료실
          </Link>
          <Link href="/news" className="text-tertiary hover:text-foreground">
            보험 뉴스
          </Link>
          <Link href="/admin" className="text-tertiary hover:text-foreground">
            관리자
          </Link>
        </div>
      </nav>
    </header>
  );
}
