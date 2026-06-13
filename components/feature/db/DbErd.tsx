"use client";

// DB 구조(ERD) 뷰어 — 컬럼 그룹별 테이블 박스 + 조인 연결선(SVG) + 테이블 클릭 시 컬럼 설명.
// 원천: SQL_Builder 'DB 구조(ERD)' 뷰를 보드 디자인(v2)으로 재구성. 데이터는 lib/publicDb.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import type { DbErd, DbTable } from "@/lib/publicDb";

interface Conn {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  active: boolean;
}

export function DbErdView({ erd }: { erd: DbErd }) {
  const [selected, setSelected] = useState<string>(erd.tables[0]?.name ?? "");
  const canvasRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [conns, setConns] = useState<Conn[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  const selectedTable = erd.tables.find((t) => t.name === selected) ?? null;

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
      const x1 = ar.left - cr.left + c.scrollLeft + ar.width / 2;
      const y1 = ar.top - cr.top + c.scrollTop + ar.height / 2;
      const x2 = br.left - cr.left + c.scrollLeft + br.width / 2;
      const y2 = br.top - cr.top + c.scrollTop + br.height / 2;
      next.push({
        key: `${rel.from}-${rel.to}-${rel.via}`,
        x1,
        y1,
        x2,
        y2,
        active: rel.from === selected || rel.to === selected,
      });
    }
    setConns(next);
  }, [erd.relations, selected]);

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
      {/* 조인키 범례 */}
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
      </div>

      {/* ERD 캔버스 — 가로 스크롤(데스크톱 다컬럼), SVG 연결선은 박스 뒤(z-0) */}
      <div
        ref={canvasRef}
        className="relative overflow-x-auto rounded-cover border border-border bg-surface/40 p-5"
      >
        <svg
          className="pointer-events-none absolute left-0 top-0 z-0 hidden md:block"
          width={svgSize.w || "100%"}
          height={svgSize.h || "100%"}
          aria-hidden
        >
          {conns.map((c) => (
            <line
              key={c.key}
              x1={c.x1}
              y1={c.y1}
              x2={c.x2}
              y2={c.y2}
              stroke={c.active ? "var(--brand-sky)" : "var(--text-tertiary)"}
              strokeOpacity={c.active ? 0.9 : 0.28}
              strokeWidth={c.active ? 2 : 1.2}
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
      {selectedTable && <ColumnDetail table={selectedTable} />}
    </div>
  );
}

function ErdBox({
  table,
  selected,
  onSelect,
  refCb,
}: {
  table: DbTable;
  selected: boolean;
  onSelect: () => void;
  refCb: (el: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={refCb}
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full rounded-cover border bg-white p-3 text-left shadow-card transition-[border-color,box-shadow] ${
        selected
          ? "border-brand-sky shadow-card-hover ring-1 ring-brand-sky/40"
          : "border-border hover:border-foreground"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[14px] font-semibold text-foreground">
          {table.label}
        </span>
      </div>
      <p className="mt-0.5 font-mono text-[11px] text-placeholder">
        {table.name} · {table.unit}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1">
        {table.columns.map((c) => (
          <li
            key={c.name}
            className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${
              c.key
                ? "bg-chip-blue-bg font-semibold text-chip-blue-fg"
                : "bg-surface text-tertiary"
            }`}
          >
            {c.name}
          </li>
        ))}
      </ul>
    </button>
  );
}

function ColumnDetail({ table }: { table: DbTable }) {
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
        {table.columns.map((c) => (
          <div key={c.name} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-4">
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
            </dt>
            <dd className="text-[14px] leading-relaxed text-body">{c.desc}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
