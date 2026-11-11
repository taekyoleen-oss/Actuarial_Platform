"use client";

/**
 * 카드뉴스 비교 보기 — [카드뉴스 | 모션 슬라이드] 두 형태. 등록부는 lib/cardnews.ts.
 * 카드뉴스: 4:5 슬라이드(components/feature/cardnews/<slug>.tsx), 활성 장의 [data-r]이 순서대로 나타남.
 *   넘기기: ‹ › 버튼 · 점 · 섹션 칩 · 키보드 ←/→ · 마우스 드래그 · 터치 스와이프(네이티브 스크롤).
 * 모션 슬라이드: slide_studio tkLeen 덱 엔진으로 빌드한 public/cardnews/<slug>/motion.html 임베드.
 */
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { CardNewsSet } from "@/lib/cardnews";
import type { Deck } from "./cardnews/parts";
import { heungkukFlexReturn100 } from "./cardnews/heungkuk-flexreturn100";

const DECKS: Record<string, Deck> = {
  "heungkuk-flexreturn100": heungkukFlexReturn100,
};

export function CardNews({ set }: { set: CardNewsSet }) {
  const deck = DECKS[set.slug];
  const [mode, setMode] = useState<"card" | "motion">("card");
  if (!deck) return null;
  const tab = (m: typeof mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-tesla ${mode === m ? "bg-primary text-white" : "text-body hover:text-primary"}`}
    >
      {label}
    </button>
  );
  return (
    <section aria-label="카드뉴스">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[18px] font-semibold text-foreground">한눈에 보기</h2>
        <div role="tablist" className="flex rounded-full border border-border bg-white p-0.5">
          {tab("card", "카드뉴스")}
          {tab("motion", "모션 슬라이드")}
        </div>
      </div>
      {mode === "card" ? <CardDeck deck={deck} /> : <MotionDeck src={`/cardnews/${set.slug}/motion.html`} />}
      <p className="mt-3 text-center text-[13px] text-tertiary">자세한 분석은 아래 보고서(PDF)에서 볼 수 있어요.</p>
    </section>
  );
}

function MotionDeck({ src }: { src: string }) {
  return (
    <div className="mt-3">
      <div className="aspect-video w-full overflow-hidden rounded-cover border border-border bg-white shadow-card">
        <iframe src={src} title="모션 슬라이드" className="h-full w-full" allow="fullscreen" />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px] text-tertiary">
        <span>슬라이드를 클릭한 뒤 → / Space 로 넘기기 · ← 이전</span>
        <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          새 창에서 크게 보기 <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function CardDeck({ deck }: { deck: Deck }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const count = deck.slides.length;

  // 스크롤 위치 → 현재 장 번호, 첫 장도 등장 모션이 보이도록 한 프레임 뒤 ready
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIdx(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    const raf = requestAnimationFrame(() => setReady(true));
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(count - 1, i)) * el.clientWidth, behavior: "smooth" });
  };

  // 마우스 드래그(터치는 네이티브 스크롤에 맡김)
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft };
    track.current.style.scrollSnapType = "none";
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d && track.current) track.current.scrollLeft = d.left - (e.clientX - d.x);
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

  const sec = [...deck.sections].reverse().find((s) => s.start <= idx);
  const btn =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white/90 text-foreground shadow-card transition-colors duration-tesla hover:text-primary disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="mx-auto mt-3 max-w-[600px]">
      <div className="flex flex-wrap items-center gap-1.5">
        {deck.sections.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => go(s.start)}
            className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors duration-tesla ${sec === s ? "border-primary bg-primary text-white" : "border-border bg-white text-body hover:text-primary"}`}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-[13px] tabular-nums text-tertiary">
          {idx + 1} / {count}
        </span>
      </div>

      <div
        className="relative mt-2"
        tabIndex={0}
        aria-roledescription="carousel"
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
          {deck.slides.map((s, i) => (
            <div
              key={i}
              aria-label={`${i + 1}/${count}`}
              className={`cn-slide w-full shrink-0 snap-start sm:aspect-square ${ready && i === idx ? "is-active" : ""}`}
            >
              {s}
            </div>
          ))}
        </div>

        <button type="button" aria-label="이전 카드" className={`${btn} -left-5`} disabled={idx === 0} onClick={() => go(idx - 1)}>
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" aria-label="다음 카드" className={`${btn} -right-5`} disabled={idx === count - 1} onClick={() => go(idx + 1)}>
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {deck.slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번 카드로`}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-[width,background-color] duration-tesla ${i === idx ? "w-5 bg-primary" : "w-2 bg-border hover:bg-tertiary"}`}
          />
        ))}
      </div>
    </div>
  );
}
