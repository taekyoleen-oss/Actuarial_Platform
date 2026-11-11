"use client";

/**
 * 카드뉴스 슬라이더 — 등록부는 lib/cardnews.ts.
 * 넘기기: ‹ › 버튼 · 점 · 키보드 ←/→ · 마우스 드래그 · 터치 스와이프(네이티브 스크롤).
 */
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CardNewsSet } from "@/lib/cardnews";

export function CardNews({ set }: { set: CardNewsSet }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [idx, setIdx] = useState(0);

  // 스크롤 위치 → 현재 장 번호
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIdx(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const srcs = Array.from(
    { length: set.count },
    (_, i) => `/cardnews/${set.slug}/${String(i + 1).padStart(2, "0")}.png`
  );

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = Math.max(0, Math.min(set.count - 1, i));
    el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  // 마우스 드래그(터치는 네이티브 스크롤에 맡김)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
    track.current.style.scrollSnapType = "none";
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !track.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    track.current.scrollLeft = d.left - dx;
  };
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    const el = track.current;
    if (!d || !el) return;
    drag.current = null;
    el.style.scrollSnapType = "";
    const dx = e.clientX - d.x;
    const base = Math.round(d.left / el.clientWidth);
    go(Math.abs(dx) > el.clientWidth * 0.15 ? base + (dx < 0 ? 1 : -1) : base);
  };

  const btn =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 text-foreground shadow-card transition-colors duration-tesla hover:text-primary disabled:pointer-events-none disabled:opacity-0";

  return (
    <section aria-roledescription="carousel" aria-label="카드뉴스">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold text-foreground">카드뉴스로 먼저 보기</h2>
        <span className="text-[13px] tabular-nums text-tertiary">
          {idx + 1} / {set.count}
        </span>
      </div>

      <div
        className="relative mx-auto mt-3 max-w-[480px]"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
        }}
      >
        <div
          ref={track}
          className="flex cursor-grab select-none snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-cover border border-border shadow-card [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={(e) => drag.current && endDrag(e)}
        >
          {srcs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={`카드뉴스 ${i + 1}/${set.count}`}
              width={1080}
              height={1350}
              draggable={false}
              loading={i < 2 ? "eager" : "lazy"}
              className="block h-auto w-full shrink-0 snap-start"
            />
          ))}
        </div>

        <button type="button" aria-label="이전 카드" className={`${btn} -left-5`} disabled={idx === 0} onClick={() => go(idx - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" aria-label="다음 카드" className={`${btn} -right-5`} disabled={idx === set.count - 1} onClick={() => go(idx + 1)}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-1.5">
        {srcs.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`${i + 1}번 카드로`}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-[width,background-color] duration-tesla ${i === idx ? "w-5 bg-primary" : "w-2 bg-border hover:bg-tertiary"}`}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-[13px] text-tertiary">
        자세한 분석은 아래 보고서(PDF)에서 볼 수 있어요.
      </p>
    </section>
  );
}
