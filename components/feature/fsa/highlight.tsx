"use client";

/**
 * FSA 사례 본문 렌더 — 핵심 구절 하이라이트 + 용어 팝오버 트리거.
 * 원문 문자열은 불변: keyPhrases/용어를 문자열 매칭으로 찾아 마크업만 입힌다.
 */
import { useEffect, useRef, useState } from "react";
import type { GlossaryTerm } from "@/lib/japanFsa";

interface Range {
  start: number;
  end: number;
  type: "mark" | "term";
  term?: GlossaryTerm;
}

function overlaps(ranges: Range[], start: number, end: number): boolean {
  return ranges.some((r) => start < r.end && end > r.start);
}

/** keyPhrase(전 출현) 우선 → 용어(블록당 첫 출현)로 비중첩 매칭 범위 구성 */
export function buildRanges(
  text: string,
  keyPhrases: string[],
  terms: GlossaryTerm[]
): Range[] {
  const ranges: Range[] = [];
  const phrases = [...keyPhrases].sort((a, b) => b.length - a.length);
  for (const p of phrases) {
    if (!p) continue;
    let i = text.indexOf(p);
    while (i !== -1) {
      if (!overlaps(ranges, i, i + p.length)) {
        ranges.push({ start: i, end: i + p.length, type: "mark" });
      }
      i = text.indexOf(p, i + p.length);
    }
  }
  for (const t of terms) {
    const keys = [t.term, ...(t.aliases ?? [])].sort(
      (a, b) => b.length - a.length
    );
    let placed = false;
    for (const k of keys) {
      if (!k || placed) continue;
      let i = text.indexOf(k);
      while (i !== -1 && !placed) {
        if (!overlaps(ranges, i, i + k.length)) {
          ranges.push({ start: i, end: i + k.length, type: "term", term: t });
          placed = true;
        }
        i = text.indexOf(k, i + k.length);
      }
    }
  }
  return ranges.sort((a, b) => a.start - b.start);
}

function TermTrigger({ text, term }: { text: string; term: GlossaryTerm }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <span ref={ref} className="relative inline">
      <button
        type="button"
        className="term-trigger text-inherit"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`용어 설명: ${term.term}`}
      >
        {text}
      </button>
      {open && (
        <span className="absolute left-0 top-full z-30 mt-1.5 block w-[300px] max-w-[78vw] rounded-cover border border-border bg-white p-4 text-left shadow-float">
          <span className="block text-sm font-semibold text-foreground">
            {term.term}
            {term.original && (
              <span className="ml-2 font-normal text-tertiary">
                {term.original}
              </span>
            )}
          </span>
          <span className="mt-1.5 block text-[13px] leading-relaxed text-body">
            {term.definition}
          </span>
          {term.koreanEquivalent && (
            <span className="mt-2 block border-t border-border pt-2 text-[12.5px] leading-relaxed text-tertiary">
              <span className="font-medium text-brand-sky">한국에서는</span>{" "}
              {term.koreanEquivalent}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export function HighlightedText({
  text,
  keyPhrases = [],
  terms = [],
}: {
  text: string;
  keyPhrases?: string[];
  terms?: GlossaryTerm[];
}) {
  const ranges = buildRanges(text, keyPhrases, terms);
  if (ranges.length === 0) return <>{text}</>;

  const out: React.ReactNode[] = [];
  let pos = 0;
  ranges.forEach((r, idx) => {
    if (r.start > pos) out.push(text.slice(pos, r.start));
    const seg = text.slice(r.start, r.end);
    if (r.type === "mark") {
      out.push(
        <mark key={idx} className="key-phrase">
          {seg}
        </mark>
      );
    } else if (r.term) {
      out.push(<TermTrigger key={idx} text={seg} term={r.term} />);
    }
    pos = r.end;
  });
  if (pos < text.length) out.push(text.slice(pos));
  return <>{out}</>;
}
