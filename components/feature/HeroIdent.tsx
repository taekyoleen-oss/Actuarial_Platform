"use client";

import { useCallback, useEffect, useRef } from "react";

// tkLeen 아이덴트 — "흩어진 리스크 → 하나의 보장"
// tkleen-hero-animation.html의 픽셀 맵·애니메이션 타이밍을 그대로 이식.
// 색상만 브랜드 토큰으로 매핑: Ink → --foreground, Sky → --brand-sky.
// 마운트 시 1회 재생: 히어로(PC)·헤더(모바일) 어디든 className으로 크기만 지정.

const CELL = 10;

type Tone = "ink" | "sky";

interface IdentCell {
  c: number;
  r: number;
  tone: Tone;
}

/* tkLeen 픽셀 맵 (20×20 그리드, col/row 단위)
   T 크로스바: rows 4–5 (Ink) · 공유 스템 col 4–5:
   y60–100 Ink → y100–160 Sky · K 대각 암: y100에서 방사 (Sky) */
const CELLS: IdentCell[] = (() => {
  const cells: IdentCell[] = [];
  // T 크로스바 (Ink)
  for (let r = 4; r <= 5; r++)
    for (let c = 1; c <= 9; c++) cells.push({ c, r, tone: "ink" });
  // 스템 상단 (Ink)
  for (let r = 6; r <= 9; r++)
    for (let c = 4; c <= 5; c++) cells.push({ c, r, tone: "ink" });
  // 스템 하단 (Sky — 시그니처)
  for (let r = 10; r <= 15; r++)
    for (let c = 4; c <= 5; c++) cells.push({ c, r, tone: "sky" });
  // K 위쪽 대각 암 (Sky)
  for (let i = 0; i <= 5; i++) {
    cells.push({ c: 6 + i, r: 9 - i, tone: "sky" });
    cells.push({ c: 7 + i, r: 9 - i, tone: "sky" });
  }
  // K 아래쪽 대각 암 (Sky)
  for (let i = 0; i <= 5; i++) {
    cells.push({ c: 6 + i, r: 10 + i, tone: "sky" });
    cells.push({ c: 7 + i, r: 10 + i, tone: "sky" });
  }
  return cells;
})();

export function HeroIdent({ className = "h-24 w-24" }: { className?: string }) {
  const rectsRef = useRef<Array<SVGRectElement | null>>([]);
  const ringRef = useRef<SVGCircleElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);

  const play = useCallback(() => {
    const ring = ringRef.current;
    const rects = rectsRef.current;

    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    window.cancelAnimationFrame(rafRef.current);

    ring?.classList.remove("fire");
    void ring?.getBoundingClientRect(); // 링 keyframe 재시동(강제 리플로우)

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rects.forEach((rect) => {
        if (!rect) return;
        rect.style.opacity = "1";
        rect.style.transform = "none";
        rect.classList.add("pulsing");
      });
      return;
    }

    // 1단계: 흩어진 리스크 입자 — 무작위 위치·미세 크기·반투명
    rects.forEach((rect) => {
      if (!rect) return;
      rect.classList.remove("pulsing");
      const dx = (Math.random() - 0.5) * 420;
      const dy = (Math.random() - 0.5) * 420;
      const rot = (Math.random() - 0.5) * 180;
      rect.style.transition = "none";
      rect.style.opacity = "0";
      rect.style.transformOrigin = "center";
      rect.style.setProperty("transform-box", "fill-box");
      rect.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(0.4)`;
    });

    // 2단계: 풀링 — Ink(구조)가 먼저, Sky(보장)가 흘러들어 결집
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = window.requestAnimationFrame(() => {
        rects.forEach((rect, i) => {
          if (!rect) return;
          const { r, tone } = CELLS[i];
          const base = tone === "ink" ? 200 : 900; // Ink 먼저, Sky 나중
          const delay = base + r * 45 + Math.random() * 250;
          rect.style.transition =
            `transform 1.3s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, ` +
            `opacity 0.9s ease ${delay}ms`;
          rect.style.opacity = "1";
          rect.style.transform = "translate(0,0) rotate(0deg) scale(1)";
        });
      });
    });

    // 3단계: 보장 링 확산 + 잔잔한 호흡 펄스
    timersRef.current.push(
      window.setTimeout(() => ring?.classList.add("fire"), 2600),
      window.setTimeout(() => {
        rects.forEach((rect, i) => {
          if (!rect) return;
          rect.style.transition = "none";
          rect.style.animationDelay = `${(i % 12) * 0.12}s`;
          rect.classList.add("pulsing");
        });
      }, 3200),
    );
  }, []);

  useEffect(() => {
    play();
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [play]);

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="tkLeen"
      className={`overflow-visible ${className}`}
    >
      <circle
        ref={ringRef}
        className="hero-ident-ring"
        cx="80"
        cy="100"
        r="30"
      />
      <g>
        {CELLS.map((cell, i) => (
          <rect
            key={i}
            ref={(el) => {
              rectsRef.current[i] = el;
            }}
            className={`hero-ident-cell ${
              cell.tone === "ink" ? "fill-foreground" : "fill-brand-sky"
            }`}
            width={CELL}
            height={CELL}
            x={cell.c * CELL}
            y={cell.r * CELL}
            style={{ opacity: 0 }}
          />
        ))}
      </g>
    </svg>
  );
}
