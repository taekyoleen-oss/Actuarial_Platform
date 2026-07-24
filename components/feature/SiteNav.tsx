"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Menu, X } from "lucide-react";
import { HeroIdent } from "@/components/feature/HeroIdent";
import { RandomLetterSwap } from "@/components/feature/RandomLetterSwap";

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

// 현재 경로 → 활성 메뉴 키(카테고리 slug 또는 EXTRA href).
// /posts는 category 쿼리로 구분, /domestic/**(국내 상품 정적 자료)은 '국내' 카테고리로 귀속.
function activeKeyOf(pathname: string, category: string | null): string | null {
  if (pathname === "/posts") {
    return category === "exclusive-rights" || category === "domestic"
      ? category
      : null;
  }
  if (pathname === "/global" || pathname.startsWith("/global/")) {
    return "global";
  }
  if (pathname.startsWith("/domestic")) {
    return "domestic";
  }
  const extra = EXTRA.find(
    (e) => pathname === e.href || pathname.startsWith(`${e.href}/`),
  );
  return extra ? extra.href : null;
}

// useSearchParams는 정적 렌더 시 Suspense 경계 필요(Next 15) — 파일 내부에서 감싼다.
// 폴백은 활성 표시 없는 동일 내비(하이드레이션 직후 활성 필이 채워짐).
export function SiteNav() {
  return (
    <Suspense fallback={<NavBar activeKey={null} />}>
      <NavBarWithRoute />
    </Suspense>
  );
}

function NavBarWithRoute() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <NavBar activeKey={activeKeyOf(pathname, searchParams.get("category"))} />
  );
}

function NavBar({ activeKey }: { activeKey: string | null }) {
  const [open, setOpen] = useState(false);

  // 필(pill) 색은 globals.css .nav-pill/.nav-pill-active — hover 연블루 틴트+primary 텍스트,
  // 활성은 저채도 필(--chip-blue-bg). 색 전환은 전역 0.33s 트랜지션 규칙 사용(별도 모션 없음).
  const desktopLink = "nav-pill whitespace-nowrap px-1.5 py-1 2xl:px-2";
  // 모바일: -mx-3+px-3으로 텍스트 정렬은 유지한 채 필 배경만 좌우로 확장
  const mobileLink = "nav-pill -mx-3 block px-3 py-2.5 text-sm font-medium";
  const withActive = (base: string, active: boolean) =>
    active ? `${base} nav-pill-active` : base;

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

        {/* 데스크톱 — lg(1024px)부터 풀 메뉴(메뉴 9개), 그 아래는 햄버거.
            필 도입 폭 산술(2026-07-17, Pretendard 실측 — _workspace/navtest.html):
            · lg 1024(내부폭 976): 필 px-1.5(+6px×2×9=108) vs gap-2→0(−8px×8=64) = 순증 +44
              → 내비 총폭 902→946px(여유 30px, 한 줄 유지)
            · xl 1280: px-1.5(+108) vs gap-3→1(−8px×8=64) → 총폭 1034px(여유 198px)
            · 2xl(컨테이너 1440, 내부폭 1392): px-2(+8px×2×9=144) vs gap-4→1.5(−10px×8=80)
              → 내비 총폭 964→1028px, 브랜드 포함 1197px(여유 ~195px)
            글자 크기는 기존 유지: lg 12px → xl 13px → 2xl 15px(text-sm 커스텀) */}
        <div className="hidden items-center gap-0 text-[12px] font-medium lg:flex xl:gap-1 xl:text-[13px] 2xl:gap-1.5 2xl:text-sm">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={c.href}
              className={withActive(desktopLink, activeKey === c.slug)}
              aria-current={activeKey === c.slug ? "page" : undefined}
            >
              <RandomLetterSwap label={c.name} />
            </Link>
          ))}
          {EXTRA.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className={withActive(desktopLink, activeKey === e.href)}
              aria-current={activeKey === e.href ? "page" : undefined}
            >
              <RandomLetterSwap label={e.name} />
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

      {/* 드롭다운 패널 (lg 미만) — 활성 표시는 데스크톱과 동일한 .nav-pill-active */}
      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <div className="mx-auto max-w-container px-6 py-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={c.href}
                className={withActive(mobileLink, activeKey === c.slug)}
                aria-current={activeKey === c.slug ? "page" : undefined}
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
                className={withActive(mobileLink, activeKey === e.href)}
                aria-current={activeKey === e.href ? "page" : undefined}
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
