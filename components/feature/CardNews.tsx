"use client";

/**
 * 카드뉴스 비교 보기 — [카드뉴스 | 모션 슬라이드] 두 형태. 등록부는 lib/cardnews.ts.
 * 둘 다 tkleen-cardnews 스킬로 빌드한 단일 HTML(public/cardnews/<slug>/{cards,motion}.html)을 임베드한다.
 * 원본 JSON: content/cardnews/<slug>/{cards,deck}.json
 * 카드뉴스 iframe은 내용 높이를 postMessage(tkleen-cards-height)로 알려 와 모바일에서도 자연 높이를 유지한다.
 */
import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { CardNewsSet } from "@/lib/cardnews";

export function CardNews({ set }: { set: CardNewsSet }) {
  const [mode, setMode] = useState<"card" | "motion">("card");
  const base = `/cardnews/${set.slug}`;
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
      {mode === "card" ? <CardFrame src={`${base}/cards.html`} /> : <MotionDeck src={`${base}/motion.html`} />}
    </section>
  );
}

/** 카드 HTML은 좌우 22px 여백(넘김 버튼 자리)을 갖는다 — 모바일에선 그만큼 바깥으로 넓혀 카드 폭을 지킨다 */
function CardFrame({ src }: { src: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState(680);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source === ref.current?.contentWindow && e.data?.type === "tkleen-cards-height") setH(e.data.h);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  return (
    <iframe
      ref={ref}
      src={src}
      title="카드뉴스"
      style={{ height: h }}
      className="-mx-[22px] mt-3 block w-[calc(100%+44px)] sm:mx-auto sm:w-full sm:max-w-[644px]"
    />
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
