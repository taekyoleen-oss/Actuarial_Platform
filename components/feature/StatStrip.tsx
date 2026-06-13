"use client";

/**
 * 스탯 스트립 — 뷰포트 진입 시 숫자 카운트업. "살아있는 데이터 플랫폼" 인상.
 * prefers-reduced-motion이면 즉시 최종값 표시.
 */
import { useEffect, useRef, useState } from "react";

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  /** 숫자 대신 표기할 고정 텍스트 (카운트업 없음) */
  text?: string;
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
      {items.map((s) => (
        <div key={s.label} className="bg-white px-5 py-5 text-center sm:py-6">
          <dd className="text-[24px] font-bold tracking-tight text-foreground sm:text-[28px]">
            {s.text ?? <CountUp to={s.value} suffix={s.suffix} />}
          </dd>
          <dt className="mt-1 text-[12px] font-medium text-tertiary">
            {s.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
