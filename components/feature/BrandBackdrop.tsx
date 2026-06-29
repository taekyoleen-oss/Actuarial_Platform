"use client";

import { useEffect, useRef } from "react";
import { buildTkleenCells, TKLEEN_CELL } from "@/lib/tkleenMark";

// 홈 배경 워터마크 — tkLeen 마크를 크게 키워 화면 뒤에서 끊임없이
// 흩어졌다(리스크) 결집(보장)하는 풀링 모션을 무한 반복한다.
// 헤더 아이덴트(HeroIdent)와 같은 형상이지만, 1) 대형 2) 저불투명도
// 3) 무한 루프 4) 느린 드리프트라는 점이 다르다.
// 메인 페이지에서만 사용(fixed, 콘텐츠 뒤 -z-10, pointer-events:none).

const CELLS = buildTkleenCells();

// 루프 타이밍(ms)
const DISPERSE = 1500; // 결집 → 흩어짐(애니메이션)
const ASSEMBLE_HOLD = 5200; // 흩어짐 → 결집 + 결집 유지 시간

export function BrandBackdrop() {
  const rectsRef = useRef<Array<SVGRectElement | null>>([]);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const rects = rectsRef.current;
    const push = (id: number) => timersRef.current.push(id);

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduce) {
      // 모션 최소화: 결집된 정적 마크만 표시
      rects.forEach((rect) => {
        if (!rect) return;
        rect.style.opacity = "1";
        rect.style.transform = "none";
      });
      return;
    }

    // 흩어짐 — 무작위 위치·회전·축소로 분산(글리프 주변으로 적당히 퍼지게 user 단위)
    const disperse = (instant = false) => {
      rects.forEach((rect) => {
        if (!rect) return;
        const dx = (Math.random() - 0.5) * 170;
        const dy = (Math.random() - 0.5) * 170;
        const rot = (Math.random() - 0.5) * 240;
        rect.style.transformOrigin = "center";
        rect.style.setProperty("transform-box", "fill-box");
        rect.style.transition = instant
          ? "none"
          : "transform 1.4s cubic-bezier(0.55, 0, 0.68, 0.3), opacity 1.2s ease";
        rect.style.opacity = instant ? "0" : "0.12";
        rect.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(0.45)`;
      });
    };

    // 결집 — Ink(구조) 먼저, Sky(보장)가 흘러들어 모임
    const assemble = () => {
      rects.forEach((rect, i) => {
        if (!rect) return;
        const { r, tone } = CELLS[i];
        const base = tone === "ink" ? 120 : 620; // Ink 먼저, Sky 나중
        const delay = base + r * 42 + Math.random() * 260;
        rect.style.transition =
          `transform 1.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, ` +
          `opacity 1s ease ${delay}ms`;
        rect.style.opacity = "1";
        rect.style.transform = "translate(0,0) rotate(0deg) scale(1)";
      });
    };

    // 무한 루프: (흩어짐 → 결집 → 유지) 반복
    const cycle = () => {
      disperse(false);
      push(
        window.setTimeout(() => {
          assemble();
          push(window.setTimeout(cycle, ASSEMBLE_HOLD));
        }, DISPERSE)
      );
    };

    // 첫 진입: 즉시 흩뜨린 뒤 결집부터 시작
    disperse(true);
    rafRef.current = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        assemble();
        push(window.setTimeout(cycle, ASSEMBLE_HOLD));
      })
    );

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="brand-backdrop" aria-hidden>
      <div className="brand-backdrop-drift">
        <svg
          viewBox="10 40 120 120"
          className="brand-backdrop-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <g>
            {CELLS.map((cell, i) => (
              <rect
                key={i}
                ref={(el) => {
                  rectsRef.current[i] = el;
                }}
                className={`brand-backdrop-cell ${
                  cell.tone === "ink" ? "fill-foreground" : "fill-brand-sky"
                }`}
                width={TKLEEN_CELL}
                height={TKLEEN_CELL}
                x={cell.c * TKLEEN_CELL}
                y={cell.r * TKLEEN_CELL}
                style={{ opacity: 0 }}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
