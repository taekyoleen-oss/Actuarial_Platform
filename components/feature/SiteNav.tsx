"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

// 상단 카테고리(ib_categories 시드와 일치). 카테고리 관리 UI는 v2.0.
const CATEGORIES = [
  { slug: "exclusive-rights", name: "보험 배타적 사용권 분석" },
  { slug: "global", name: "해외 주요 보험 정보·자료" },
  { slug: "domestic", name: "국내 보험 정보·분석" },
];

const EXTRA = [
  { href: "/news", name: "보험 뉴스" },
  { href: "/admin", name: "관리자" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  const desktopLink =
    "text-tertiary hover:text-foreground whitespace-nowrap";
  const mobileLink =
    "block py-2.5 text-sm font-medium text-tertiary hover:text-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-container items-center justify-between px-6">
        <Link
          href="/"
          className="text-[15px] font-medium text-foreground"
          onClick={() => setOpen(false)}
        >
          Insurance Insights
        </Link>

        {/* 데스크톱 (lg 이상) — 카테고리 폴더명 */}
        <div className="hidden items-center gap-5 text-sm font-medium lg:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/posts?category=${c.slug}`}
              className={desktopLink}
            >
              {c.name}
            </Link>
          ))}
          {EXTRA.map((e) => (
            <Link key={e.href} href={e.href} className={desktopLink}>
              {e.name}
            </Link>
          ))}
        </div>

        {/* 모바일 햄버거 (lg 미만) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기/닫기"
          aria-expanded={open}
          className="text-foreground lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* 모바일 드롭다운 패널 */}
      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <div className="mx-auto max-w-container px-6 py-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/posts?category=${c.slug}`}
                className={mobileLink}
                onClick={() => setOpen(false)}
              >
                {c.name}
              </Link>
            ))}
            <div className="my-1 border-t border-border" />
            {EXTRA.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className={mobileLink}
                onClick={() => setOpen(false)}
              >
                {e.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
