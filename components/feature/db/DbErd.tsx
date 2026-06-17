"use client";

// DB 구조(ERD) 뷰어 — 컬럼 그룹별 테이블 박스 + 조인 연결선(SVG) + 테이블 클릭 시 컬럼 설명.
// 원천: SQL_Builder 'DB 구조(ERD)' 뷰를 보드 디자인(v2)으로 재구성. 데이터는 lib/publicDb.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Filter } from "lucide-react";
import type { DbErd, DbTable, RiskFieldSpec } from "@/lib/publicDb";

interface Conn {
  key: string;
  /** 박스 모서리에서 모서리로 잇는 베지어 path(d) */
  d: string;
  active: boolean;
  dim: boolean;
}

export function DbErdView({
  erd,
  riskSpec,
}: {
  erd: DbErd;
  riskSpec?: RiskFieldSpec | null;
}) {
  const [selected, setSelected] = useState<string>(erd.tables[0]?.name ?? "");
  const [riskOnly, setRiskOnly] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [conns, setConns] = useState<Conn[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  const selectedTable = erd.tables.find((t) => t.name === selected) ?? null;

  // 위험률 개발 필드 집합 — "table.col" 키. riskSpec 없으면 빈 집합.
  const riskCols = useMemo(() => {
    const s = new Set<string>();
    if (riskSpec) {
      for (const [t, cols] of Object.entries(riskSpec.fields)) {
        for (const c of cols) s.add(`${t}.${c}`);
      }
    }
    return s;
  }, [riskSpec]);
  const riskTables = useMemo(
    () => new Set(Object.keys(riskSpec?.fields ?? {})),
    [riskSpec]
  );
  const active = Boolean(riskSpec) && riskOnly;

  const compute = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    setSvgSize({ w: c.scrollWidth, h: c.scrollHeight });
    const next: Conn[] = [];
    for (const rel of erd.relations) {
      const a = boxRefs.current[rel.from];
      const b = boxRefs.current[rel.to];
      if (!a || !b) continue;
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      // 캔버스 콘텐츠 좌표(스크롤 포함)
      const sx = ar.left - cr.left + c.scrollLeft;
      const sy = ar.top - cr.top + c.scrollTop;
      const tx = br.left - cr.left + c.scrollLeft;
      const ty = br.top - cr.top + c.scrollTop;
      const sw = ar.width;
      const sh = ar.height;
      const tw = br.width;
      const th = br.height;
      const sMid = sy + sh / 2;
      const tMid = ty + th / 2;
      // 박스 '모서리'에서 시작·도착하도록 앵커 — 선이 박스 뒤로 숨지 않게.
      let x1: number, y1: number, x2: number, y2: number, c1x: number, c2x: number;
      if (tx >= sx + sw - 6) {
        // 타깃이 오른쪽 컬럼: 소스 우변 → 타깃 좌변
        x1 = sx + sw;
        y1 = sMid;
        x2 = tx;
        y2 = tMid;
        const dx = Math.max(26, (x2 - x1) * 0.45);
        c1x = x1 + dx;
        c2x = x2 - dx;
      } else if (sx >= tx + tw - 6) {
        // 타깃이 왼쪽 컬럼: 소스 좌변 → 타깃 우변
        x1 = sx;
        y1 = sMid;
        x2 = tx + tw;
        y2 = tMid;
        const dx = Math.max(26, (x1 - x2) * 0.45);
        c1x = x1 - dx;
        c2x = x2 + dx;
      } else {
        // 같은 컬럼(세로 인접): 여백이 더 넓은 쪽으로 볼록한 브래킷(가장자리 잘림 방지)
        y1 = sMid;
        y2 = tMid;
        const rightRoom = c.scrollWidth - Math.max(sx + sw, tx + tw);
        const leftRoom = Math.min(sx, tx);
        if (rightRoom >= leftRoom) {
          x1 = sx + sw;
          x2 = tx + tw;
          const bulge =
            Math.max(sx + sw, tx + tw) + Math.min(30, Math.max(8, rightRoom - 4));
          c1x = bulge;
          c2x = bulge;
        } else {
          x1 = sx;
          x2 = tx;
          const bulge = Math.min(sx, tx) - Math.min(30, Math.max(8, leftRoom - 4));
          c1x = bulge;
          c2x = bulge;
        }
      }
      const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${c1x.toFixed(1)} ${y1.toFixed(1)} ${c2x.toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      next.push({
        key: `${rel.from}-${rel.to}-${rel.via}`,
        d,
        active: rel.from === selected || rel.to === selected,
        // 위험률 강조 모드: 양 끝이 모두 위험률 테이블인 연결만 살리고 나머지는 흐리게.
        dim: active && !(riskTables.has(rel.from) && riskTables.has(rel.to)),
      });
    }
    setConns(next);
  }, [erd.relations, selected, active, riskTables]);

  useLayoutEffect(() => {
    compute();
  }, [compute]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => compute());
    ro.observe(c);
    window.addEventListener("resize", compute);
    // 폰트 로딩 후 위치 보정
    const t = window.setTimeout(compute, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
      window.clearTimeout(t);
    };
  }, [compute]);

  // 컬럼(col) 그룹화 — 좌→우
  const cols = Array.from(new Set(erd.tables.map((t) => t.col))).sort(
    (a, b) => a - b
  );

  return (
    <div>
      {/* 조인키 범례 + 위험률 필드 강조 토글 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px]">
        <span className="inline-flex items-center gap-1 font-medium text-tertiary">
          <KeyRound size={13} className="text-brand-sky" /> 조인키
        </span>
        {Object.entries(erd.keys).map(([role, col]) => (
          <span
            key={role}
            className="rounded border border-border bg-white px-2 py-0.5 font-mono text-[12px] text-body"
            title={role}
          >
            {col}
          </span>
        ))}
        {riskSpec && (
          <button
            type="button"
            onClick={() => setRiskOnly((v) => !v)}
            aria-pressed={active}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors ${
              active
                ? "border-brand-sky bg-brand-sky text-white"
                : "border-border bg-white text-tertiary hover:border-brand-sky hover:text-brand-sky"
            }`}
          >
            <Filter size={13} />
            {active ? "위험률 개발 필드만 보는 중" : "위험률 개발 필드 강조"}
          </button>
        )}
      </div>

      {/* 위험률 강조 안내 배너 */}
      {active && riskSpec && (
        <div className="mb-4 rounded-cover border border-brand-sky/30 bg-chip-blue-bg px-4 py-3 text-[13px] leading-relaxed text-chip-blue-fg">
          <p className="font-semibold">{riskSpec.label} 강조 중</p>
          <p className="mt-1 text-foreground/80">{riskSpec.criterion}</p>
          <p className="mt-1 text-foreground/70">→ {riskSpec.builds}</p>
        </div>
      )}

      {/* ERD 캔버스 — 가로 스크롤(데스크톱 다컬럼), SVG 연결선은 박스 뒤(z-0) */}
      <div
        ref={canvasRef}
        className="relative overflow-x-auto rounded-cover border border-border bg-surface/40 p-5"
      >
        <svg
          className="pointer-events-none absolute left-0 top-0 z-0 block"
          width={svgSize.w || "100%"}
          height={svgSize.h || "100%"}
          aria-hidden
        >
          <defs>
            <marker
              id="erd-arrow"
              markerWidth="9"
              markerHeight="9"
              refX="6.5"
              refY="3.2"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L7,3.2 L0,6.4 Z" fill="var(--text-tertiary)" />
            </marker>
            <marker
              id="erd-arrow-on"
              markerWidth="10"
              markerHeight="10"
              refX="6.8"
              refY="3.4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0 L7.5,3.4 L0,6.8 Z" fill="var(--brand-sky)" />
            </marker>
          </defs>
          {conns.map((c) => (
            <path
              key={c.key}
              d={c.d}
              fill="none"
              stroke={c.active ? "var(--brand-sky)" : "var(--text-tertiary)"}
              strokeOpacity={c.dim ? 0.07 : c.active ? 0.95 : 0.5}
              strokeWidth={c.active ? 2.4 : 1.6}
              markerEnd={
                c.dim
                  ? undefined
                  : `url(#${c.active ? "erd-arrow-on" : "erd-arrow"})`
              }
            />
          ))}
        </svg>

        <div className="relative z-[1] flex items-start gap-7 md:gap-10">
          {cols.map((col) => {
            const inCol = erd.tables.filter((t) => t.col === col);
            const groupTitle = inCol[0]?.group ?? "";
            return (
              <div key={col} className="flex min-w-[210px] flex-col gap-4">
                <p className="text-[12px] font-semibold tracking-wide text-tertiary">
                  {groupTitle}
                </p>
                {inCol.map((t) => (
                  <ErdBox
                    key={t.name}
                    table={t}
                    selected={t.name === selected}
                    onSelect={() => setSelected(t.name)}
                    refCb={(el) => (boxRefs.current[t.name] = el)}
                    riskOn={active}
                    isRiskTable={riskTables.has(t.name)}
                    riskCols={riskCols}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 연계관계 범례 (모바일·접근성) */}
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {erd.relations.map((r) => (
          <li
            key={`${r.from}-${r.to}-${r.via}`}
            className="flex items-center gap-2 text-[13px] text-tertiary"
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sky"
            />
            <span className="font-mono text-foreground">{r.from}</span>
            <span aria-hidden>→</span>
            <span className="font-mono text-foreground">{r.to}</span>
            <span className="text-placeholder">·</span>
            <span>{r.label}</span>
          </li>
        ))}
      </ul>

      {/* 선택 테이블 컬럼 설명 */}
      {selectedTable && (
        <ColumnDetail
          table={selectedTable}
          riskOn={active}
          riskCols={riskCols}
        />
      )}
    </div>
  );
}

function ErdBox({
  table,
  selected,
  onSelect,
  refCb,
  riskOn,
  isRiskTable,
  riskCols,
}: {
  table: DbTable;
  selected: boolean;
  onSelect: () => void;
  refCb: (el: HTMLButtonElement | null) => void;
  riskOn: boolean;
  isRiskTable: boolean;
  riskCols: Set<string>;
}) {
  // 위험률 강조 모드인데 위험률 테이블이 아니면 박스 전체를 흐리게.
  const tableDimmed = riskOn && !isRiskTable;
  return (
    <button
      ref={refCb}
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-cover border bg-white p-3 text-left shadow-card transition-[border-color,box-shadow,opacity] ${
        selected
          ? "border-brand-sky shadow-card-hover ring-1 ring-brand-sky/40"
          : "border-border hover:border-foreground"
      } ${tableDimmed ? "opacity-40" : ""} ${
        riskOn && isRiskTable ? "ring-1 ring-brand-sky/30" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] font-semibold text-foreground">
          {table.label}
        </span>
        {riskOn && isRiskTable && (
          <span className="rounded-full bg-brand-sky px-1.5 py-0.5 text-[9.5px] font-bold text-white">
            위험률
          </span>
        )}
      </div>
      <p className="mt-0.5 font-mono text-[11px] text-placeholder">
        {table.name} · {table.unit}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1">
        {table.columns.map((c) => {
          const isRisk = riskCols.has(`${table.name}.${c.name}`);
          // 강조 모드: 위험률 필드는 sky로 부각, 나머지는 흐리게.
          const cls = riskOn
            ? isRisk
              ? "bg-brand-sky font-semibold text-white"
              : "bg-surface text-tertiary opacity-35"
            : c.key
              ? "bg-chip-blue-bg font-semibold text-chip-blue-fg"
              : "bg-surface text-tertiary";
          return (
            <li
              key={c.name}
              className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${cls}`}
            >
              {c.name}
            </li>
          );
        })}
      </ul>
    </button>
  );
}

function ColumnDetail({
  table,
  riskOn,
  riskCols,
}: {
  table: DbTable;
  riskOn: boolean;
  riskCols: Set<string>;
}) {
  return (
    <div className="mt-6 rounded-cover border border-border bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h4 className="text-[16px] font-semibold text-foreground">
          {table.label}
        </h4>
        <span className="font-mono text-[12px] text-placeholder">
          {table.name}
        </span>
        <span className="text-[13px] text-tertiary">· {table.group}</span>
      </div>
      <dl className="mt-4 divide-y divide-border">
        {table.columns.map((c) => {
          const isRisk = riskCols.has(`${table.name}.${c.name}`);
          const dimmed = riskOn && !isRisk;
          return (
            <div
              key={c.name}
              className={`flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-4 ${
                dimmed ? "opacity-40" : ""
              } ${riskOn && isRisk ? "-mx-2 rounded bg-chip-blue-bg px-2" : ""}`}
            >
              <dt className="flex shrink-0 items-center gap-1.5 sm:w-44">
                {c.key && (
                  <KeyRound size={12} className="shrink-0 text-brand-sky" />
                )}
                <span
                  className={`font-mono text-[13px] ${
                    c.key ? "font-semibold text-chip-blue-fg" : "text-foreground"
                  }`}
                >
                  {c.name}
                </span>
                {riskOn && isRisk && (
                  <span className="rounded-full bg-brand-sky px-1.5 py-0.5 text-[9px] font-bold text-white">
                    위험률
                  </span>
                )}
              </dt>
              <dd className="text-[14px] leading-relaxed text-body">{c.desc}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
