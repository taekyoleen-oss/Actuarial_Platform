"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { HeroIdent } from "@/components/feature/HeroIdent";

// 상단 카테고리(ib_categories 시드와 일치). 카테고리 관리 UI는 v2.0.
// 해외 자료는 네이티브 허브(/global)가 진입점 (2026-06-13 전환).
const CATEGORIES = [
  {
    slug: "exclusive-rights",
    name: "보험 배타적 사용권 분석",
    href: "/posts?category=exclusive-rights",
  },
  { slug: "global", name: "해외 주요 보험 정보·자료", href: "/global" },
  {
    slug: "domestic",
    name: "국내 보험 정보·분석",
    href: "/posts?category=domestic",
  },
];

const EXTRA = [
  { href: "/theory", name: "보험이론 사전" },
  { href: "/news", name: "보험 뉴스" },
  { href: "/apps", name: "모델분석/업무지원앱" },
  { href: "/datalab", name: "데이터 예제/분석" },
  { href: "/about", name: "만든이" },
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
          className="flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          {/* 모바일: 실행 시 결집 애니메이션 마크 / 데스크톱: 정적 마크(히어로에 아이덴트 표시) */}
          <HeroIdent className="h-7 w-7 shrink-0 lg:hidden" />
          <img
            src="/brand/tkleen-mark.svg"
            alt="tkLeen"
            width={28}
            height={28}
            className="hidden h-7 w-7 shrink-0 lg:block"
          />
          <span className="text-[16px] font-medium text-foreground">
            Insurance Insights
          </span>
        </Link>

        {/* 데스크톱 — lg(1024px)부터 풀 메뉴(메뉴 9개라 lg~xl 구간은 글자·간격 더 압축:
            lg 12px·gap-2 → xl 13px·gap-3 → 2xl 15px·gap-4), 그 아래는 햄버거 */}
        <div className="hidden items-center gap-2 text-[12px] font-medium lg:flex xl:gap-3 xl:text-[13px] 2xl:gap-4 2xl:text-sm">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={c.href} className={desktopLink}>
              {c.name}
            </Link>
          ))}
          {EXTRA.map((e) => (
            <Link key={e.href} href={e.href} className={desktopLink}>
              {e.name}
            </Link>
          ))}
        </div>

        {/* 햄버거 (lg 미만) */}
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

      {/* 드롭다운 패널 (lg 미만) */}
      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <div className="mx-auto max-w-container px-6 py-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
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
