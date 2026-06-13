"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/data/japan-life-trends/content";

/** 스티키 목차 — 현재 보고 있는 절 하이라이트(IntersectionObserver) */
export function TrendsToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [items]);

  const list = (
    <nav aria-label="목차" className="text-[13px]">
      <ul className="space-y-0.5">
        {items.map((it) => {
          const isActive = active === it.id;
          return (
            <li key={it.id}>
              {it.chapter && (
                <div className="mt-3 px-2 pb-1 text-[11px] font-bold tracking-wide text-brand-sky first:mt-0">
                  {it.chapter}
                </div>
              )}
              <a
                href={`#${it.id}`}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-2 py-1.5 leading-snug transition-colors ${
                  it.level >= 2 ? "pl-4" : ""
                } ${
                  isActive
                    ? "bg-white font-medium text-primary shadow-card"
                    : "text-tertiary hover:text-foreground"
                }`}
              >
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      {/* 데스크톱 스티키 */}
      <div className="hidden lg:block">
        <div className="sticky top-[5.5rem] max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          {list}
        </div>
      </div>
      {/* 모바일 접이식 */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="glass-panel sticky top-14 z-20 flex w-full items-center justify-between rounded-cover px-4 py-3 text-[14px] font-medium text-foreground shadow-float"
        >
          목차
          <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {open && (
          <div className="mt-2 rounded-cover border border-border bg-[var(--page-bg)] p-3">
            {list}
          </div>
        )}
      </div>
    </>
  );
}
