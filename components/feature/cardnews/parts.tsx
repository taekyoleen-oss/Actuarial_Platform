/**
 * 카드뉴스 모션 슬라이드 공용 조각.
 * 슬라이드가 활성(.is-active)이 되면 [data-r] 요소가 --i 순서대로 나타나고,
 * .cn-grow-x / .cn-grow-y 막대가 자라난다(globals.css, reduced-motion 존중).
 */
import type { CSSProperties, ReactNode } from "react";

export type DeckSection = { label: string; start: number };
export type Deck = { title: string; sections: DeckSection[]; slides: ReactNode[] };

/** 순서대로 나타나는 블록 */
export function R({ i = 0, className = "", children }: { i?: number; className?: string; children: ReactNode }) {
  return (
    <div data-r className={className} style={{ "--i": i } as CSSProperties}>
      {children}
    </div>
  );
}

/** 슬라이드 틀: 위 섹션 이름표 + 제목 + 본문 */
export function Slide({
  section,
  title,
  lead,
  children,
}: {
  section: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-white p-5 sm:p-7">
      <R i={0}>
        <span className="text-[12px] font-semibold tracking-[0.08em] text-primary">{section}</span>
      </R>
      <R i={1}>
        <h3 className="mt-1.5 text-[21px] font-bold leading-snug text-foreground sm:text-[23px]">{title}</h3>
      </R>
      {lead ? (
        <R i={2}>
          <p className="mt-2 text-[14px] leading-relaxed text-body">{lead}</p>
        </R>
      ) : null}
      <div className="mt-4 flex flex-1 flex-col justify-evenly gap-3 text-[13.5px] leading-relaxed text-body">{children}</div>
    </div>
  );
}

const TONES = {
  blue: "bg-[var(--chip-blue-bg)] text-[var(--chip-blue-fg)]",
  amber: "bg-[var(--chip-amber-bg)] text-[var(--chip-amber-fg)]",
  rose: "bg-[var(--chip-rose-bg)] text-[var(--chip-rose-fg)]",
  teal: "bg-[var(--chip-teal-bg)] text-[var(--chip-teal-fg)]",
  violet: "bg-[var(--chip-violet-bg)] text-[var(--chip-violet-fg)]",
  slate: "bg-[var(--chip-slate-bg)] text-[var(--chip-slate-fg)]",
} as const;
export type Tone = keyof typeof TONES;

export function Chip({ tone = "blue", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** 이름표 + 설명 한 덩어리 */
export function Item({ i, tag, tone = "blue", title, children }: { i: number; tag?: string; tone?: Tone; title: ReactNode; children: ReactNode }) {
  return (
    <R i={i} className="border-t border-border pt-2.5">
      <div className="flex items-center gap-2">
        {tag ? <Chip tone={tone}>{tag}</Chip> : null}
        <b className="text-[14.5px] font-semibold text-foreground">{title}</b>
      </div>
      <p className="mt-1">{children}</p>
    </R>
  );
}

/** 강조 상자 */
export function Note({ i, tone = "blue", children }: { i: number; tone?: Tone; children: ReactNode }) {
  return (
    <R i={i} className={`rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed ${TONES[tone]}`}>
      {children}
    </R>
  );
}
