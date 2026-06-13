"use client";

/**
 * "한국에서는" 블록 — 일본 사례에 대응하는 한국 현황·유사 사례·관련 규정·시사점.
 * 사례별 note + korea-kb 항목(kbRefs)으로 구성. 이 사이트의 핵심 목적 영역.
 */
import { useState } from "react";
import {
  getKbEntry,
  type CaseKoreaContext,
  type KoreaReg,
} from "@/lib/japanFsa";

function RegRow({ reg }: { reg: KoreaReg }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1.5">
      <span className="rounded bg-white px-2 py-0.5 text-[13px] font-semibold text-brand-sky ring-1 ring-border">
        {reg.name} {reg.ref}
      </span>
      <span className="text-[14px] leading-relaxed text-body">{reg.point}</span>
    </li>
  );
}

export function KoreaBlock({ kr }: { kr: CaseKoreaContext }) {
  const entries = kr.kbRefs
    .map((id) => getKbEntry(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));
  const [openId, setOpenId] = useState<string | null>(
    entries.length === 1 ? entries[0].id : null
  );

  const caseRegs = kr.regs ?? [];

  return (
    <section
      aria-label="한국 시장 맥락"
      className="overflow-hidden rounded-cover border border-[#d7e4ee] bg-[#f3f8fb] shadow-card"
    >
      <header className="flex items-center gap-2.5 border-b border-[#d7e4ee] px-5 py-3.5 sm:px-6">
        <span className="inline-flex h-6 items-center rounded bg-brand-sky px-2 text-[12px] font-semibold tracking-wide text-white">
          KOREA
        </span>
        <h3 className="text-[16px] font-semibold text-foreground">
          한국에서는 — 유사 사례·현황·규정
        </h3>
      </header>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {/* 사례 특이 맥락 */}
        <p className="text-[14.5px] leading-[1.85] text-body">{kr.note}</p>

        {/* 사례 직결 규정 */}
        {caseRegs.length > 0 && (
          <ul className="divide-y divide-[#e3edf4] rounded-lg bg-white/60 px-4 py-1.5 ring-1 ring-[#e3edf4]">
            {caseRegs.map((r, i) => (
              <RegRow key={i} reg={r} />
            ))}
          </ul>
        )}

        {/* 연결된 한국 KB 주제 (아코디언) */}
        {entries.map((e) => {
          const open = openId === e.id;
          return (
            <div
              key={e.id}
              className="overflow-hidden rounded-lg bg-white ring-1 ring-[#e3edf4]"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? null : e.id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <span className="text-[13.5px] font-semibold text-foreground">
                  {e.title}
                </span>
                <span
                  className={`shrink-0 text-tertiary transition-transform duration-tesla ${
                    open ? "rotate-180" : ""
                  }`}
                  aria-hidden
                >
                  ▾
                </span>
              </button>
              {open && (
                <div className="space-y-3.5 border-t border-[#eef4f8] px-4 pb-4 pt-3.5 text-[13.5px] leading-[1.8] text-body">
                  <div>
                    <div className="mb-1 text-[11.5px] font-semibold tracking-wide text-brand-sky">
                      한국 현황
                    </div>
                    <p>{e.status}</p>
                  </div>
                  <div>
                    <div className="mb-1 text-[11.5px] font-semibold tracking-wide text-brand-sky">
                      유사 사례·이슈
                    </div>
                    <p>{e.cases}</p>
                  </div>
                  {e.regs.length > 0 && (
                    <div>
                      <div className="mb-1 text-[11.5px] font-semibold tracking-wide text-brand-sky">
                        관련 규정
                      </div>
                      <ul className="divide-y divide-[#f0f4f8]">
                        {e.regs.map((r, i) => (
                          <RegRow key={i} reg={r} />
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="rounded-lg bg-[#f7fafc] px-3.5 py-3 ring-1 ring-[#eef4f8]">
                    <div className="mb-1 text-[11.5px] font-semibold tracking-wide text-brand-sky">
                      시사점
                    </div>
                    <p>{e.implication}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
