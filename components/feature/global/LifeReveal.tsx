"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * 스크롤 진입 리빌 래퍼 — globals.css의 .reveal-fade / .in 사용.
 * IntersectionObserver로 뷰포트 진입 시 .in을 1회 부여한다.
 * (prefers-reduced-motion은 globals.css에서 처리)
 */
export function LifeReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal-fade ${className ?? ""}`}>
      {children}
    </div>
  );
}
