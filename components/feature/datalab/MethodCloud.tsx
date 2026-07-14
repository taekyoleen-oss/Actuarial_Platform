"use client";

/**
 * 통계·ML 파이썬 사전 워드클라우드 — /datalab 상단.
 * 카테고리별 클러스터에 분석 방법 이름을 사용 빈도(weight)에 비례한 크기로 배치.
 * 호버 시 살짝 확대(.method-term), 클릭 시 파이썬 코드+설명 팝업(전체·블록별 복사).
 * 칩 색은 뮤트 팔레트(--chip-*) 한정 스코프(카테고리 고정색).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ClipboardCopy, X } from "lucide-react";
import {
  STAT_CATEGORIES,
  STAT_METHODS,
  type MethodChipColor,
  type StatMethod,
} from "@/lib/statMethods";

/* 빈도(1~5) → 글자 크기·굵기 — 클수록 실무에서 자주 쓰는 방법 */
const SIZE: Record<number, { fontSize: string; fontWeight: number }> = {
  1: { fontSize: "13px", fontWeight: 500 },
  2: { fontSize: "14.5px", fontWeight: 500 },
  3: { fontSize: "17px", fontWeight: 500 },
  4: { fontSize: "20.5px", fontWeight: 600 },
  5: { fontSize: "25px", fontWeight: 600 },
};

/* SSR 안전 결정적 해시 — 클러스터 내 크기가 섞여 워드클라우드처럼 보이게 */
function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* 클립보드 복사 — 실패 시 textarea 폴백 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopyButton({
  text,
  label = "복사",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(text);
        setState(ok ? "done" : "fail");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 1800);
      }}
      className={`inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-1 text-[11.5px] font-medium text-tertiary hover:text-foreground ${className}`}
    >
      {state === "done" ? <Check size={13} /> : <ClipboardCopy size={13} />}
      {state === "done" ? "복사됨" : state === "fail" ? "복사 실패" : label}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative mt-2">
      <CopyButton text={code} className="absolute right-2 top-2 z-10" />
      <pre className="overflow-x-auto rounded border border-border bg-surface px-4 py-3.5 font-mono text-[12.5px] leading-[1.75] text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MethodDialog({
  method,
  color,
  categoryLabel,
  onClose,
}: {
  method: StatMethod;
  color: MethodChipColor;
  categoryLabel: string;
  onClose: () => void;
}) {
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

  // 전체 복사: 블록 제목을 주석으로 달아 모든 코드를 이어붙임
  const allCode = useMemo(
    () =>
      method.sections
        .map((s) => `# ── ${s.title} ──\n${s.code.trim()}`)
        .join("\n\n\n"),
    [method]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${method.name} 파이썬 코드와 설명`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:max-h-[84vh] sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                  style={{
                    background: `var(--chip-${color}-bg)`,
                    color: `var(--chip-${color}-fg)`,
                  }}
                >
                  {categoryLabel}
                </span>
                <h2 className="text-[18px] font-semibold text-foreground">
                  {method.name}
                </h2>
                <span className="text-[13px] text-tertiary">{method.en}</span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-tertiary">
                {method.summary}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CopyButton text={allCode} label="전체 코드 복사" />
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="text-tertiary hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {method.intro.split("\n\n").map((p, i) => (
            <p
              key={i}
              className="mt-3 text-[14px] leading-[1.85] text-body first:mt-0"
            >
              {p}
            </p>
          ))}

          {method.sections.map((s, i) => (
            <div key={s.title} className="mt-6">
              <h3 className="text-[14.5px] font-semibold text-foreground">
                {method.sections.length > 1 ? `${i + 1}. ` : ""}
                {s.title}
              </h3>
              {s.desc ? (
                <p className="mt-1 text-[13px] leading-[1.8] text-tertiary">
                  {s.desc}
                </p>
              ) : null}
              <CodeBlock code={s.code.trim()} />
            </div>
          ))}

          {method.tips ? (
            <div className="mt-6 rounded bg-surface px-4 py-3">
              <p className="text-[12.5px] font-semibold text-foreground">
                해석·주의 포인트
              </p>
              <p className="mt-1 text-[13px] leading-[1.8] text-body">
                {method.tips}
              </p>
            </div>
          ) : null}
        </div>

        <footer className="border-t border-border px-5 py-2.5 text-[12px] text-tertiary sm:px-6">
          블록의 &lsquo;복사&rsquo;는 해당 코드만, &lsquo;전체 코드 복사&rsquo;는
          모든 블록을 복사합니다. 텍스트를 드래그하면 필요한 부분만 복사할 수도
          있습니다.
        </footer>
      </div>
    </div>
  );
}

export function MethodCloud() {
  const [openId, setOpenId] = useState<string | null>(null);

  // 카테고리별 클러스터 — 크기(weight)가 섞이도록 id 해시로 결정적 셔플
  const clusters = useMemo(
    () =>
      STAT_CATEGORIES.map((cat) => ({
        cat,
        methods: STAT_METHODS.filter((m) => m.category === cat.id).sort(
          (a, b) => hashOf(a.id) - hashOf(b.id)
        ),
      })),
    []
  );

  const open = openId ? STAT_METHODS.find((m) => m.id === openId) : undefined;
  const openCat = open
    ? STAT_CATEGORIES.find((c) => c.id === open.category)
    : undefined;

  return (
    <section
      aria-label="통계·머신러닝 파이썬 사전"
      className="mb-10 rounded-cover bg-white p-6 shadow-card sm:p-8"
    >
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[17px] font-semibold text-foreground">
          분석 방법 사전 — 파이썬 코드
        </h2>
        <p className="text-[12.5px] text-tertiary">
          글자가 클수록 자주 쓰는 방법입니다 · 클릭하면 코드와 설명이 열립니다
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {clusters.map(({ cat, methods }) => (
          <div
            key={cat.id}
            className="rounded-cover px-4 py-4"
            style={{
              background: `color-mix(in srgb, var(--chip-${cat.color}-bg) 55%, white)`,
            }}
          >
            <div className="mb-2.5 flex items-baseline gap-2">
              <span
                className="h-2 w-2 shrink-0 self-center rounded-full"
                style={{ background: `var(--chip-${cat.color}-fg)` }}
                aria-hidden
              />
              <span className="text-[12.5px] font-semibold tracking-wide text-foreground">
                {cat.label}
              </span>
              <span className="hidden text-[11.5px] text-tertiary sm:inline">
                {cat.hint}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 px-1 py-1.5">
              {methods.map((m) => {
                const size = SIZE[m.weight];
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setOpenId(m.id)}
                    title={m.summary}
                    className="method-term rounded px-1 leading-snug"
                    style={{
                      fontSize: size.fontSize,
                      fontWeight: size.fontWeight,
                      color: `var(--chip-${cat.color}-fg)`,
                    }}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {open && openCat ? (
        <MethodDialog
          method={open}
          color={openCat.color}
          categoryLabel={openCat.label}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </section>
  );
}
