"use client";

/**
 * 우측 상단 앱 런처(구글 앱 그리드 방식) — 2026-09-03 사용자 요청.
 * · PC(lg+): 기존 텍스트 메뉴는 유지하고, 맨 오른쪽 그리드 버튼 → 팝오버에
 *   홈페이지에서 링크하는 외부 앱(바로가기)들을 아이콘 타일로 표시.
 * · 모바일(<lg): 햄버거 대신 이 버튼 하나 — 팝업 상단에 사이트 메뉴(아이콘 포함),
 *   그 아래에 바로가기 타일(두 가지 결합).
 * · ✎ 편집: 타일의 ◀▶로 순서 변경 — localStorage(site:launcher:order:v1)에 기기별 저장.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  FileText,
  Globe,
  ImagePlus,
  Landmark,
  LayoutGrid,
  Newspaper,
  Pencil,
  PenLine,
  Presentation,
  Settings,
  ShieldCheck,
  Sigma,
  User,
  X,
} from "lucide-react";

type Icon = ComponentType<{ size?: number | string; className?: string }>;

interface LauncherLink {
  href: string;
  label: string;
  icon: Icon;
  /** 칩 팔레트 키(--chip-<color>-bg/fg) */
  color: string;
  external?: boolean;
}

/** 사이트 메뉴 항목 href → 아이콘·색 (SiteNav의 CATEGORIES/EXTRA와 키 일치) */
export const NAV_ICONS: Record<string, { icon: Icon; color: string }> = {
  "/posts?category=exclusive-rights": { icon: ShieldCheck, color: "blue" },
  "/global": { icon: Globe, color: "cyan" },
  "/posts?category=domestic": { icon: Landmark, color: "teal" },
  "/theory": { icon: BookOpen, color: "violet" },
  "/news": { icon: Newspaper, color: "amber" },
  "/apps": { icon: LayoutGrid, color: "rose" },
  "/datalab": { icon: BarChart3, color: "green" },
  "/about": { icon: User, color: "slate" },
  "/admin": { icon: Settings, color: "slate" },
};

/** 홈페이지(/apps)에서 링크하는 외부 앱 바로가기 — /apps 카드와 동일 링크 */
const QUICK_LINKS: LauncherLink[] = [
  {
    href: "https://life-matrix-flow-new-livid.vercel.app/",
    label: "보험료 산출",
    icon: Calculator,
    color: "blue",
    external: true,
  },
  {
    href: "https://machine-learning-auto-flow.vercel.app/",
    label: "ML 자동분석",
    icon: Brain,
    color: "violet",
    external: true,
  },
  {
    href: "https://lecture-assistant-chi.vercel.app/",
    label: "강의 지원",
    icon: Presentation,
    color: "amber",
    external: true,
  },
  {
    href: "https://pdf-master-lyart.vercel.app/",
    label: "PDF Master",
    icon: FileText,
    color: "rose",
    external: true,
  },
  {
    href: "https://pro-exam-calculator.vercel.app/",
    label: "계리 계산기",
    icon: Sigma,
    color: "teal",
    external: true,
  },
  {
    href: "https://actuarial-whiteboard.vercel.app/",
    label: "화이트보드",
    icon: PenLine,
    color: "cyan",
    external: true,
  },
  {
    href: "https://mathocr-formula-in-office-converter.vercel.app/",
    label: "수식 변환",
    icon: ImagePlus,
    color: "green",
    external: true,
  },
  {
    href: "https://md-la-te-x-studio.vercel.app/",
    label: "MD·LaTeX",
    icon: FileCode2,
    color: "slate",
    external: true,
  },
];

const ORDER_KEY = "site:launcher:order:v1";

function loadOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : null;
  } catch {
    return null;
  }
}

/** 저장된 순서 적용 — 없는 항목은 뒤에, 사라진 항목은 무시(링크 추가·삭제에 안전) */
function applyOrder(links: LauncherLink[], order: string[] | null): LauncherLink[] {
  if (!order) return links;
  const byHref = new Map(links.map((l) => [l.href, l]));
  const sorted = order.map((h) => byHref.get(h)).filter(Boolean) as LauncherLink[];
  for (const l of links) if (!order.includes(l.href)) sorted.push(l);
  return sorted;
}

function IconTile({ icon: I, color, size = 20 }: { icon: Icon; color: string; size?: number }) {
  return (
    <span
      className="flex h-11 w-11 items-center justify-center rounded-xl"
      style={{
        background: `var(--chip-${color}-bg)`,
        color: `var(--chip-${color}-fg)`,
      }}
    >
      <I size={size} />
    </span>
  );
}

export function AppLauncher({
  navItems,
  activeKey,
}: {
  /** 사이트 메뉴(모바일 팝업 상단) — SiteNav가 전달 */
  navItems: { key: string; href: string; name: string }[];
  activeKey: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<string[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrder(loadOrder());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = useMemo(() => applyOrder(QUICK_LINKS, order), [order]);

  const move = (href: string, dir: -1 | 1) => {
    const cur = links.map((l) => l.href);
    const i = cur.indexOf(href);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j], cur[i]];
    setOrder(cur);
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(cur));
    } catch {
      // 저장 실패(사생활 모드 등)는 무시 — 세션 동안만 유지
    }
  };

  const close = () => {
    setOpen(false);
    setEditing(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="바로가기·메뉴 열기"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-surface"
      >
        {open ? <X size={21} /> : <LayoutGrid size={21} />}
      </button>

      {open ? (
        <div className="fixed inset-x-0 top-14 z-40 max-h-[calc(100vh-72px)] overflow-y-auto rounded-b-cover border-b border-border bg-white p-4 shadow-card-hover lg:absolute lg:inset-x-auto lg:right-0 lg:top-full lg:mt-2 lg:w-[340px] lg:rounded-cover lg:border">
          {/* 사이트 메뉴 — 모바일에서만(햄버거 대체). PC는 상단 텍스트 메뉴가 담당 */}
          <div className="lg:hidden">
            <p className="px-1 pb-2 text-[12px] font-semibold text-tertiary">메뉴</p>
            <div className="grid grid-cols-2 gap-1">
              {navItems.map((m) => {
                const meta = NAV_ICONS[m.href] ?? { icon: LayoutGrid, color: "slate" };
                const I = meta.icon;
                const active = activeKey === m.key;
                return (
                  <Link
                    key={m.key}
                    href={m.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium ${
                      active
                        ? "bg-[var(--chip-blue-bg)] text-primary"
                        : "text-body hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: `var(--chip-${meta.color}-bg)`,
                        color: `var(--chip-${meta.color}-fg)`,
                      }}
                    >
                      <I size={15} />
                    </span>
                    <span className="min-w-0 truncate">{m.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="my-3 border-t border-border" />
          </div>

          {/* 바로가기(외부 앱) — PC·모바일 공통 */}
          <div className="flex items-center justify-between px-1 pb-2">
            <p className="text-[12px] font-semibold text-tertiary">앱 바로가기</p>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              title={editing ? "편집 완료" : "순서 편집 — ◀▶로 위치를 바꿉니다"}
              aria-label={editing ? "편집 완료" : "바로가기 순서 편집"}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                editing
                  ? "bg-[var(--chip-blue-bg)] text-primary"
                  : "text-tertiary hover:bg-surface hover:text-foreground"
              }`}
            >
              {editing ? <Check size={14} /> : <Pencil size={14} />}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {links.map((l) => (
              <span key={l.href} className="relative">
                <a
                  href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noopener noreferrer" : undefined}
                  onClick={editing ? (e) => e.preventDefault() : close}
                  className="flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center hover:bg-surface"
                >
                  <IconTile icon={l.icon} color={l.color} />
                  <span className="w-full truncate text-[12px] text-body">{l.label}</span>
                </a>
                {editing ? (
                  <span className="absolute inset-x-0 top-1 flex justify-between px-1">
                    <button
                      type="button"
                      onClick={() => move(l.href, -1)}
                      aria-label={`${l.label} 앞으로`}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-tertiary hover:text-foreground"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(l.href, 1)}
                      aria-label={`${l.label} 뒤로`}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-white text-tertiary hover:text-foreground"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
