"use client";

/** 용어집 오버레이 — 전체 용어 검색·열람 */
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { FSA_GLOSSARY } from "@/lib/japanFsa";

export function GlossaryPanel({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const items = useMemo(() => {
    const sorted = [...FSA_GLOSSARY].sort((a, b) =>
      a.term.localeCompare(b.term, "ko")
    );
    const needle = q.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter((t) =>
      [t.term, t.original, t.definition, t.koreanEquivalent, t.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [q]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="용어집"
      onClick={onClose}
    >
      <div
        className="flex h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:h-[78vh] sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-foreground">
              일본 보험용어 사전
            </h2>
            <p className="mt-0.5 text-[12.5px] text-tertiary">
              사례 본문의 일본 제도·용어 {FSA_GLOSSARY.length}건 — 한국 대응
              개념 병기
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-tertiary hover:text-foreground"
          >
            <X size={20} />
          </button>
        </header>
        <div className="border-b border-border px-5 py-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="용어 검색 (예: 단신, MVA, 참고순율)"
            className="w-full rounded border border-border bg-white px-3.5 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-tertiary">
              일치하는 용어가 없습니다.
            </p>
          ) : (
            <dl className="space-y-4">
              {items.map((t) => (
                <div
                  key={t.term}
                  className="border-b border-border pb-4 last:border-0"
                >
                  <dt className="text-[14.5px] font-semibold text-brand-sky">
                    {t.term}
                    {t.original && (
                      <span className="ml-2 text-[14px] font-normal text-tertiary">
                        {t.original}
                      </span>
                    )}
                  </dt>
                  <dd className="mt-1.5 text-[13.5px] leading-[1.8] text-body">
                    {t.definition}
                    {t.koreanEquivalent && (
                      <span className="mt-1 block text-tertiary">
                        <span className="font-medium text-brand-sky">
                          한국에서는
                        </span>{" "}
                        {t.koreanEquivalent}
                      </span>
                    )}
                    {t.note && (
                      <span className="mt-1 block text-[12.5px] text-tertiary">
                        {t.note}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
