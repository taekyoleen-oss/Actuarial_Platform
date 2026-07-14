"use client";

/**
 * 통계·ML 파이썬 사전 — /datalab 상단.
 * PC(md+): 사분면 2차원 그래프 — 4개 카테고리가 각 사분면(카테고리 이름은 사각형 바깥),
 *   가로축=사용 빈도(중심 세로선에 가까울수록 자주), 세로축=난이도(중심 가로선에서 멀수록 어려움).
 * 모바일(md 미만): 카테고리 클러스터 워드클라우드 폴백.
 * 클릭 시 팝업: 코드+설명+주요 파라미터·옵션, 글자 확대/축소(가−/가+), 전체·블록별 복사.
 * 칩 색은 뮤트 팔레트(--chip-*) 한정 스코프(카테고리 고정색).
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, ClipboardCopy, X } from "lucide-react";
import {
  STAT_CATEGORIES,
  STAT_METHODS,
  methodFullCode,
  type MethodCategory,
  type MethodChipColor,
  type StatMethod,
} from "@/lib/statMethods";
import PyRunner, {
  type RunnerLoadRequest,
} from "@/components/feature/datalab/PyRunner";

/* 빈도(1~5) → 글자 크기·굵기 — 클수록 실무에서 자주 쓰는 방법 */
const SIZE: Record<number, { fs: number; fw: number }> = {
  1: { fs: 13, fw: 500 },
  2: { fs: 14.5, fw: 500 },
  3: { fs: 17, fw: 500 },
  4: { fs: 20.5, fw: 600 },
  5: { fs: 25, fw: 600 },
};

/* 웹 실행기 미지원 표시 — 실행 불가(none)는 회색, 일부만(partial)은 점선 밑줄 */
const WEB_NONE_COLOR = "#9a9ca1";
function webTermStyle(
  m: StatMethod,
  catColor: MethodChipColor
): { color: string; borderBottom?: string } {
  const support = m.webSupport ?? "full";
  return {
    color: support === "none" ? WEB_NONE_COLOR : `var(--chip-${catColor}-fg)`,
    borderBottom:
      support === "partial" ? "1.5px dashed currentColor" : undefined,
  };
}
const WEB_LIMITED = STAT_METHODS.filter((m) => (m.webSupport ?? "full") !== "full");

/* SSR 안전 결정적 해시 — 모바일 클러스터에서 크기가 섞여 보이게 */
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

/* ───────────────────────── 팝업 (코드+설명+파라미터) ───────────────────────── */

const FONT_SCALE_MIN = 0.8;
const FONT_SCALE_MAX = 1.6;

function CodeBlock({ code, codeFz }: { code: string; codeFz: number }) {
  return (
    <div className="relative mt-2">
      <CopyButton text={code} className="absolute right-2 top-2 z-10" />
      <pre
        className="overflow-x-auto rounded border border-border bg-surface px-4 py-3.5 font-mono leading-[1.75] text-foreground"
        style={{ fontSize: codeFz }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MethodDialog({
  method,
  color,
  categoryLabel,
  fontScale,
  onFontScale,
  onSendToRunner,
  onClose,
}: {
  method: StatMethod;
  color: MethodChipColor;
  categoryLabel: string;
  fontScale: number;
  onFontScale: Dispatch<SetStateAction<number>>;
  onSendToRunner: (m: StatMethod) => void;
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

  // 글자 확대/축소 — 본문·코드·파라미터에 적용
  const fz = (px: number) => ({ fontSize: Math.round(px * fontScale * 10) / 10 });
  // 함수형 업데이트 — 연속 클릭에도 최신 배율 기준으로 증감
  const step = (d: number) =>
    onFontScale((cur) =>
      Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round((cur + d) * 10) / 10))
    );

  // 전체 복사: 블록 제목을 주석으로 달아 모든 코드를 이어붙임
  const allCode = useMemo(() => methodFullCode(method), [method]);

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
            <div className="flex shrink-0 items-center gap-1.5">
              {/* 글자 확대/축소 */}
              <div className="flex items-center rounded border border-border">
                <button
                  type="button"
                  onClick={() => step(-0.1)}
                  disabled={fontScale <= FONT_SCALE_MIN}
                  aria-label="글자 작게"
                  className="px-2 py-1 text-[12px] font-medium text-tertiary hover:text-foreground disabled:opacity-40"
                >
                  가−
                </button>
                <button
                  type="button"
                  onClick={() => onFontScale(1)}
                  aria-label="글자 크기 원래대로"
                  title="원래 크기로"
                  className="min-w-[42px] border-x border-border px-1 py-1 text-center text-[11px] tabular-nums text-tertiary hover:text-foreground"
                >
                  {Math.round(fontScale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => step(0.1)}
                  disabled={fontScale >= FONT_SCALE_MAX}
                  aria-label="글자 크게"
                  className="px-2 py-1 text-[12px] font-medium text-tertiary hover:text-foreground disabled:opacity-40"
                >
                  가+
                </button>
              </div>
              <CopyButton text={allCode} label="전체 코드 복사" />
              <button
                type="button"
                onClick={() => onSendToRunner(method)}
                className="inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-1 text-[11.5px] font-medium text-tertiary hover:text-foreground"
                title="아래 파이썬 실행기에 이 코드를 담고 이동합니다"
              >
                ▶ 실행기로 보내기
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="ml-0.5 text-tertiary hover:text-foreground"
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
              className="mt-3 leading-[1.85] text-body first:mt-0"
              style={fz(14)}
            >
              {p}
            </p>
          ))}

          {method.sections.map((s, i) => (
            <div key={s.title} className="mt-6">
              <h3 className="font-semibold text-foreground" style={fz(14.5)}>
                {method.sections.length > 1 ? `${i + 1}. ` : ""}
                {s.title}
              </h3>
              {s.desc ? (
                <p className="mt-1 leading-[1.8] text-tertiary" style={fz(13)}>
                  {s.desc}
                </p>
              ) : null}
              <CodeBlock code={s.code.trim()} codeFz={12.5 * fontScale} />
            </div>
          ))}

          {method.params.length > 0 ? (
            <div className="mt-6">
              <h3 className="font-semibold text-foreground" style={fz(14.5)}>
                주요 파라미터·옵션
              </h3>
              <dl className="mt-2 divide-y divide-border rounded border border-border">
                {method.params.map((p) => (
                  <div key={p.name} className="px-3.5 py-2.5">
                    <dt>
                      <code
                        className="font-mono font-medium"
                        style={{
                          ...fz(12.5),
                          color: `var(--chip-${color}-fg)`,
                        }}
                      >
                        {p.name}
                      </code>
                    </dt>
                    <dd
                      className="mt-0.5 leading-[1.75] text-body"
                      style={fz(13)}
                    >
                      {p.desc}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {method.tips ? (
            <div className="mt-6 rounded bg-surface px-4 py-3">
              <p className="font-semibold text-foreground" style={fz(12.5)}>
                해석·주의 포인트
              </p>
              <p className="mt-1 leading-[1.8] text-body" style={fz(13)}>
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

/* ───────────────────────── 사분면 2차원 그래프 (md+) ───────────────────────── */

/** 표시 폭 추정 — CJK는 fontSize, 라틴·기호는 0.58배 + 좌우 패딩 */
function estWidth(name: string, fs: number): number {
  let w = 0;
  for (const ch of name) w += ch.charCodeAt(0) > 0x2e80 ? fs : fs * 0.58;
  return w + 10;
}

interface PlacedItem {
  m: StatMethod;
  color: MethodChipColor;
  x: number;
  y: number;
  fs: number;
  fw: number;
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/* 겹침 회피 이동 후보 — 총 변위(가로 가중 1.6배) 오름차순. 세로 이동 우선. */
const NUDGES: [number, number][] = (() => {
  const out: [number, number][] = [[0, 0]];
  for (let dy = 0; dy <= 150; dy += 10) {
    for (let dx = 0; dx <= 120; dx += 20) {
      if (dx === 0 && dy === 0) continue;
      if (dx === 0) out.push([0, dy], [0, -dy]);
      else if (dy === 0) out.push([dx, 0], [-dx, 0]);
      else out.push([dx, dy], [dx, -dy], [-dx, dy], [-dx, -dy]);
    }
  }
  out.sort(
    (a, b) =>
      Math.abs(a[0]) * 1.6 +
      Math.abs(a[1]) -
      (Math.abs(b[0]) * 1.6 + Math.abs(b[1]))
  );
  return out;
})();

/**
 * 사분면 배치 — 결정적(같은 크기면 같은 결과).
 * 가로: 중심 세로선에서의 거리 ∝ (5-빈도), 세로: 중심 가로선에서의 거리 ∝ 난이도.
 * 겹침은 NUDGES 후보 이동으로 회피, 축 라벨 자리는 장애물로 선점.
 */
function layoutQuadrants(w: number, h: number): PlacedItem[] {
  const cx = w / 2;
  const cy = h / 2;
  const boxes: Box[] = [];
  const overlaps = (r: Box) =>
    boxes.some(
      (b) => !(r.x2 < b.x1 || r.x1 > b.x2 || r.y2 < b.y1 || r.y1 > b.y2)
    );
  const boxAt = (x: number, y: number, bw: number, bh: number): Box => ({
    x1: x - bw / 2 - 4,
    y1: y - bh / 2 - 4,
    x2: x + bw / 2 + 4,
    y2: y + bh / 2 + 4,
  });

  // 축 라벨 자리 선점(어려움 ↑/↓, 자주 사용, 빈도 낮음 ×2)
  boxes.push(boxAt(cx, 13, 66, 18));
  boxes.push(boxAt(cx, h - 13, 66, 18));
  boxes.push(boxAt(cx, cy, 78, 22));
  boxes.push(boxAt(44, cy, 68, 18));
  boxes.push(boxAt(w - 44, cy, 68, 18));

  const items = STAT_CATEGORIES.flatMap((cat, qi) =>
    STAT_METHODS.filter((m) => m.category === cat.id).map((m) => ({
      m,
      color: cat.color,
      qi,
    }))
  );
  // 중심(고빈도)부터 배치해 밀려나는 쪽이 항상 저빈도가 되게
  items.sort(
    (a, b) =>
      b.m.weight - a.m.weight ||
      a.m.difficulty - b.m.difficulty ||
      a.m.id.localeCompare(b.m.id)
  );

  const out: PlacedItem[] = [];
  for (const { m, color, qi } of items) {
    const sX = qi % 2 === 0 ? -1 : 1;
    const sY = qi < 2 ? -1 : 1;
    const { fs, fw } = SIZE[m.weight];
    const tw = estWidth(m.name, fs);
    const th = fs * 1.35;

    // 사분면 내부 허용 범위(중심 십자·바깥 여백 회피)
    const xLo = sX < 0 ? 10 + tw / 2 : cx + 10 + tw / 2;
    const xHi = sX < 0 ? cx - 10 - tw / 2 : w - 10 - tw / 2;
    const yLo = sY < 0 ? 8 + th / 2 : cy + 8 + th / 2;
    const yHi = sY < 0 ? cy - 8 - th / 2 : h - 8 - th / 2;

    // 기준 위치 — 빈도(가로)·난이도(세로)
    const tFreq = (5 - m.weight) / 4;
    const tDiff = (m.difficulty - 1) / 4;
    const minOX = 40 + tw / 2;
    const maxOX = Math.max(minOX, cx - 14 - tw / 2);
    const minOY = 20 + th / 2;
    const maxOY = Math.max(minOY, cy - 12 - th / 2);
    const baseX = cx + sX * (minOX + tFreq * (maxOX - minOX));
    const baseY = cy + sY * (minOY + tDiff * (maxOY - minOY));

    const clamp = (v: number, lo: number, hi: number) =>
      lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));

    let px = clamp(baseX, xLo, xHi);
    let py = clamp(baseY, yLo, yHi);
    for (const [dx, dy] of NUDGES) {
      const x = clamp(baseX + dx, xLo, xHi);
      const y = clamp(baseY + dy, yLo, yHi);
      if (!overlaps(boxAt(x, y, tw, th))) {
        px = x;
        py = y;
        break;
      }
    }
    boxes.push(boxAt(px, py, tw, th));
    out.push({ m, color, x: px, y: py, fs, fw });
  }
  return out;
}

function CategoryTag({ cat, align }: { cat: MethodCategory; align: "l" | "r" }) {
  return (
    <div
      className={`flex items-baseline gap-2 ${align === "r" ? "flex-row-reverse text-right" : ""}`}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 self-center rounded-full"
        style={{ background: `var(--chip-${cat.color}-fg)` }}
        aria-hidden
      />
      <span className="text-[16px] font-semibold text-foreground">
        {cat.label}
      </span>
      <span className="hidden text-[13.5px] text-tertiary lg:inline">
        {cat.hint}
      </span>
    </div>
  );
}

function QuadrantChart({ onOpen }: { onOpen: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize((prev) => {
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        return prev.w === w && prev.h === h ? prev : { w, h };
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const placed = useMemo(
    () => (size.w > 0 && size.h > 0 ? layoutQuadrants(size.w, size.h) : []),
    [size]
  );

  const axisLabel =
    "pointer-events-none absolute z-10 whitespace-nowrap rounded-full bg-white/75 px-1.5 py-px text-[10.5px] text-tertiary";

  return (
    <div className="hidden md:block">
      {/* 카테고리 이름 — 사각형 바깥(위) */}
      <div className="mb-2 flex items-center justify-between px-1">
        <CategoryTag cat={STAT_CATEGORIES[0]} align="l" />
        <CategoryTag cat={STAT_CATEGORIES[1]} align="r" />
      </div>

      <div ref={ref} className="relative h-[500px] lg:h-[540px]">
        {/* 사분면 배경 — 카테고리 색, 십자 여백이 축 역할 */}
        {STAT_CATEGORIES.map((cat, qi) => (
          <div
            key={cat.id}
            className="absolute rounded-[10px]"
            style={{
              width: "calc(50% - 3px)",
              height: "calc(50% - 3px)",
              left: qi % 2 === 0 ? 0 : undefined,
              right: qi % 2 === 1 ? 0 : undefined,
              top: qi < 2 ? 0 : undefined,
              bottom: qi >= 2 ? 0 : undefined,
              background: `color-mix(in srgb, var(--chip-${cat.color}-bg) 55%, white)`,
            }}
            aria-hidden
          />
        ))}

        {/* 축 안내 라벨 */}
        <span className={`${axisLabel} left-1/2 top-1 -translate-x-1/2`}>
          어려움 ↑
        </span>
        <span className={`${axisLabel} bottom-1 left-1/2 -translate-x-1/2`}>
          어려움 ↓
        </span>
        <span
          className={`${axisLabel} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-border font-medium text-foreground`}
        >
          자주 사용
        </span>
        <span className={`${axisLabel} left-2 top-1/2 -translate-y-1/2`}>
          ← 빈도 낮음
        </span>
        <span className={`${axisLabel} right-2 top-1/2 -translate-y-1/2`}>
          빈도 낮음 →
        </span>

        {/* 항목 — 빈도(가로)·난이도(세로) 좌표 배치 */}
        {placed.map((p) => (
          <div
            key={p.m.id}
            className="absolute z-20"
            style={{
              left: p.x,
              top: p.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <button
              type="button"
              onClick={() => onOpen(p.m.id)}
              title={p.m.summary}
              className="method-term whitespace-nowrap rounded px-1 leading-none"
              style={{
                fontSize: p.fs,
                fontWeight: p.fw,
                ...webTermStyle(p.m, p.color),
              }}
            >
              {p.m.name}
            </button>
          </div>
        ))}
      </div>

      {/* 카테고리 이름 — 사각형 바깥(아래) */}
      <div className="mt-2 flex items-center justify-between px-1">
        <CategoryTag cat={STAT_CATEGORIES[2]} align="l" />
        <CategoryTag cat={STAT_CATEGORIES[3]} align="r" />
      </div>

      <p className="mt-3 text-center text-[12px] text-tertiary">
        가로축 — 중심 세로선에 가까울수록 자주 사용 · 세로축 — 중심 가로선에서
        위·아래로 멀수록 난이도 높음 (글자가 클수록 자주 쓰는 방법)
      </p>
    </div>
  );
}

/* ─────────────────── 모바일 폴백 — 카테고리 클러스터 클라우드 ─────────────────── */

function ClusterCloud({ onOpen }: { onOpen: (id: string) => void }) {
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

  return (
    <div className="grid gap-5 md:hidden">
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
            <span className="text-[14.5px] font-semibold tracking-wide text-foreground">
              {cat.label}
            </span>
          </div>
          <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 px-1 py-1.5">
            {methods.map((m) => {
              const { fs, fw } = SIZE[m.weight];
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onOpen(m.id)}
                  title={m.summary}
                  className="method-term rounded px-1 leading-snug"
                  style={{
                    fontSize: fs,
                    fontWeight: fw,
                    ...webTermStyle(m, cat.color),
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
  );
}

/* ───────────────────────────── 섹션 루트 ───────────────────────────── */

export function MethodCloud() {
  const [openId, setOpenId] = useState<string | null>(null);
  // 팝업 글자 배율 — 팝업을 닫았다 열어도 유지
  const [fontScale, setFontScale] = useState(1);
  // 파이썬 실행기에 코드 주입(팝업 "실행기로 보내기") — seq 증가로 재전송 감지
  const [runnerLoad, setRunnerLoad] = useState<RunnerLoadRequest | null>(null);

  const sendToRunner = (m: StatMethod) => {
    setRunnerLoad((prev) => ({
      code: `# ═══ ${m.name} (${m.en}) ═══\n${methodFullCode(m)}`,
      label: `${m.name} (${m.en})`,
      seq: (prev?.seq ?? 0) + 1,
    }));
    setOpenId(null);
  };

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
          클릭하면 코드·설명·파라미터 팝업이 열립니다
        </p>
      </div>

      <QuadrantChart onOpen={setOpenId} />
      <ClusterCloud onOpen={setOpenId} />

      {/* 웹 실행기 제한 안내 — 회색(실행 불가)·점선(일부만) 표시 설명 */}
      {WEB_LIMITED.length > 0 ? (
        <div className="mt-4 rounded border border-border bg-surface/60 px-4 py-3">
          <p className="text-[12.5px] font-semibold text-foreground">
            아래 파이썬 실행기(브라우저)에서 제한되는 방법
          </p>
          <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-tertiary">
            {WEB_LIMITED.map((m) => (
              <li key={m.id}>
                <span
                  className="font-medium text-body"
                  style={{
                    color:
                      m.webSupport === "none" ? WEB_NONE_COLOR : undefined,
                    borderBottom:
                      m.webSupport === "partial"
                        ? "1.5px dashed currentColor"
                        : undefined,
                  }}
                >
                  {m.name}
                </span>
                {" — "}
                {m.webNote}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[11.5px] text-tertiary">
            <span style={{ color: WEB_NONE_COLOR }}>회색 이름</span>은 브라우저
            실행기에서 실행할 수 없고(로컬 파이썬에서 이용),{" "}
            <span style={{ borderBottom: "1.5px dashed currentColor" }}>
              점선 밑줄
            </span>
            은 일부 블록만 실행됩니다. 그 밖의 방법은 아래 실행기에서 바로 돌려볼
            수 있습니다.
          </p>
        </div>
      ) : null}

      <PyRunner loadRequest={runnerLoad} />

      {open && openCat ? (
        <MethodDialog
          method={open}
          color={openCat.color}
          categoryLabel={openCat.label}
          fontScale={fontScale}
          onFontScale={setFontScale}
          onSendToRunner={sendToRunner}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </section>
  );
}
