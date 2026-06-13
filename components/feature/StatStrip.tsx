"use client";

/**
 * 스탯 스트립 — 뷰포트 진입 시 숫자 카운트업. "살아있는 데이터 플랫폼" 인상.
 * prefers-reduced-motion이면 즉시 최종값 표시.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  /** 숫자 대신 표기할 고정 텍스트 (카운트업 없음) */
  text?: string;
  /** 지정 시 셀 전체가 해당 경로로 이동하는 링크가 된다 */
  href?: string;
}

function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started.current) return;
        started.current = true;
        if (reduced) {
          setVal(to);
          return;
        }
        const dur = 1100;
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min((t - t0) / dur, 1);
          // easeOutCubic
          const e = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(to * e));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <span ref={ref} className="tabular-nums">
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-cover border border-border bg-border shadow-card sm:grid-cols-4">
      {items.map((s) => {
        const inner = (
          <>
            <dd className="text-[26px] font-bold tracking-tight text-foreground transition-colors duration-tesla group-hover:text-primary sm:text-[30px]">
              {s.text ?? <CountUp to={s.value} suffix={s.suffix} />}
            </dd>
            <dt className="mt-1 text-[13px] font-medium text-tertiary">
              {s.label}
            </dt>
          </>
        );
        if (s.href) {
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group block bg-white px-5 py-5 text-center transition-colors duration-tesla hover:bg-[var(--page-bg)] sm:py-6"
            >
              {inner}
            </Link>
          );
        }
        return (
          <div key={s.label} className="bg-white px-5 py-5 text-center sm:py-6">
            {inner}
          </div>
        );
      })}
    </dl>
  );
}
