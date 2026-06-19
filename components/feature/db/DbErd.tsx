"use client";

// DB 구조(ERD) 뷰어 — 컬럼 그룹별 테이블 박스 + 조인 연결선(SVG) + 테이블 클릭 시 컬럼 설명.
// 원천: SQL_Builder 'DB 구조(ERD)' 뷰를 보드 디자인(v2)으로 재구성. 데이터는 lib/publicDb.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Filter, RotateCcw } from "lucide-react";
import type { DbErd, DbTable, RiskFieldSpec } from "@/lib/publicDb";

interface Conn {
  key: string;
  /** 박스 모서리에서 모서리로 잇는 베지어 path(d) */
  d: string;
  /** 조인키(연결에 사용된 키값) — 화살표 중앙에 라벨로 표시 */
  via: string;
  /** 라벨 위치(베지어 중점) */
  mx: number;
  my: number;
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
  // 초기 선택 = 연결이 가장 많은 허브 테이블(예: 명세서·가입자 대장) → 핵심 연결을 먼저 보여줌
  const [selected, setSelected] = useState<string>(() => {
    const cnt: Record<string, number> = {};
    for (const r of erd.relations) {
      cnt[r.from] = (cnt[r.from] ?? 0) + 1;
      cnt[r.to] = (cnt[r.to] ?? 0) + 1;
    }
    let best = erd.tables[0]?.name ?? "";
    let max = -1;
    for (const t of erd.tables) {
      const c = cnt[t.name] ?? 0;
      if (c > max) {
        max = c;
        best = t.name;
      }
    }
    return best;
  });
  const [riskOnly, setRiskOnly] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [conns, setConns] = useState<Conn[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  // 드래그 이동량(테이블별 transform 오프셋) — 박스를 자유롭게 옮길 수 있게.
  const [offsets, setOffsets] = useState<Record<string, { x: number; y: number }>>({});
  // 더블클릭으로 확대(모든 필드 표시)된 테이블 이름
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleDrag = useCallback((name: string, x: number, y: number) => {
    setOffsets((prev) => ({ ...prev, [name]: { x, y } }));
  }, []);
  // 테이블 선택 — 확대된 다른 테이블이 있으면 원래 크기로 되돌린다.
  const handleSelect = useCallback((name: string) => {
    setSelected(name);
    setExpanded((prev) => (prev && prev !== name ? null : prev));
  }, []);
  const toggleExpand = useCallback((name: string) => {
    setExpanded((prev) => (prev === name ? null : name));
    setSelected(name);
  }, []);
  const resetLayout = useCallback(() => {
    setOffsets({});
    setExpanded(null);
  }, []);
  const hasMoved = Object.keys(offsets).length > 0 || expanded !== null;

  const selectedTable = erd.tables.find((t) => t.name === selected) ?? null;

  // 선택한 테이블과 직접 연결된 테이블 집합 — 박스 부각용.
  const neighbors = useMemo(() => {
    const s = new Set<string>();
    for (const r of erd.relations) {
      if (r.from === selected) s.add(r.to);
      if (r.to === selected) s.add(r.from);
    }
    return s;
  }, [erd.relations, selected]);

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
      // 베지어 t=0.5 중점 — 키값 라벨 위치
      const mx = 0.125 * x1 + 0.375 * c1x + 0.375 * c2x + 0.125 * x2;
      const my = 0.5 * y1 + 0.5 * y2;
      next.push({
        key: `${rel.from}-${rel.to}-${rel.via}`,
        d,
        via: rel.via,
        mx,
        my,
        active: rel.from === selected || rel.to === selected,
        // 위험률 강조 모드: 양 끝이 모두 위험률 테이블인 연결만 살리고 나머지는 흐리게.
        dim: active && !(riskTables.has(rel.from) && riskTables.has(rel.to)),
      });
    }
    setConns(next);
  }, [erd.relations, selected, active, riskTables]);

  useLayoutEffect(() => {
    compute();
  }, [compute, offsets, expanded]);

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
        <span className="hidden text-[12px] text-placeholder sm:inline">
          · 박스를 끌어 옮기고, 더블클릭하면 모든 필드가 펼쳐집니다
        </span>
        {hasMoved && (
          <button
            type="button"
            onClick={resetLayout}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[12px] font-medium text-tertiary transition-colors hover:border-brand-sky hover:text-brand-sky"
          >
            <RotateCcw size={12} /> 위치 초기화
          </button>
        )}
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
        onPointerDown={(e) => {
          // 박스 바깥(캔버스 여백)을 누르면 확대된 박스를 원래대로 되돌린다.
          if (!(e.target as HTMLElement).closest("[data-erd-box]")) {
            setExpanded(null);
          }
        }}
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
          {conns.map((c) =>
            // 선택된 테이블의 강조 연결선은 박스 위(앞) 오버레이에서 그린다.
            c.active && !c.dim ? null : (
              <path
                key={c.key}
                d={c.d}
                fill="none"
                stroke="var(--text-tertiary)"
                strokeOpacity={c.dim ? 0.06 : 0.3}
                strokeWidth={1.3}
                markerEnd={c.dim ? undefined : "url(#erd-arrow)"}
              />
            )
          )}
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
                    isNeighbor={neighbors.has(t.name)}
                    onSelect={() => handleSelect(t.name)}
                    refCb={(el) => (boxRefs.current[t.name] = el)}
                    riskOn={active}
                    isRiskTable={riskTables.has(t.name)}
                    riskCols={riskCols}
                    offset={offsets[t.name] ?? { x: 0, y: 0 }}
                    onDrag={(x, y) => handleDrag(t.name, x, y)}
                    expanded={expanded === t.name}
                    onToggleExpand={() => toggleExpand(t.name)}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* 강조 연결선 오버레이 — 선택 테이블의 연결선을 박스 위(z-[2])에 다시 그려 다른 DB에 가려지지 않게. */}
        <svg
          className="pointer-events-none absolute left-0 top-0 z-[2] block"
          width={svgSize.w || "100%"}
          height={svgSize.h || "100%"}
          aria-hidden
        >
          {conns.map((c) =>
            !c.active || c.dim ? null : (
              <path
                key={`on-${c.key}`}
                d={c.d}
                fill="none"
                stroke="var(--brand-sky)"
                strokeOpacity={0.95}
                strokeWidth={2.6}
                markerEnd="url(#erd-arrow-on)"
              />
            )
          )}
        </svg>

        {/* 조인키 라벨 — 각 연결선(화살표) 중앙에 연결 키값 pill (강조선 위 z-[3]) */}
        <div
          className="pointer-events-none absolute left-0 top-0 z-[3]"
          style={{ width: svgSize.w || "100%", height: svgSize.h || "100%" }}
          aria-hidden
        >
          {/* 키값 라벨은 '선택한 테이블'의 연결에만 표시(클릭 시 노출) */}
          {conns.map((c) =>
            !c.active || c.dim ? null : (
              <span
                key={`lbl-${c.key}`}
                style={{ left: c.mx, top: c.my }}
                className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-brand-sky bg-brand-sky px-1.5 py-px font-mono text-[10px] font-medium text-white shadow-card"
              >
                {c.via}
              </span>
            )
          )}
        </div>
      </div>

      {/* 선택한 테이블의 연결 목록 — 클릭한 DB(테이블)에 대해서만 표시 */}
      {(() => {
        const rels = erd.relations.filter(
          (r) => r.from === selected || r.to === selected
        );
        return (
          <div className="mt-4">
            <p className="mb-2 text-[12.5px] text-tertiary">
              <span className="font-semibold text-foreground">
                {selectedTable?.label ?? selected}
              </span>
              <span className="text-placeholder"> 의 연결</span> — 키값으로 이어지는
              테이블 {rels.length}개
            </p>
            {rels.length === 0 ? (
              <p className="text-[13px] text-placeholder">
                이 테이블에서 직접 연결되는 다른 테이블이 없습니다.
              </p>
            ) : (
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {rels.map((r) => {
                  const other = r.from === selected ? r.to : r.from;
                  const outgoing = r.from === selected;
                  return (
                    <li
                      key={`${r.from}-${r.to}-${r.via}`}
                      className="flex items-center gap-2 text-[13px] text-tertiary"
                    >
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-sky"
                      />
                      <span aria-hidden>{outgoing ? "→" : "←"}</span>
                      <span className="font-mono text-foreground">{other}</span>
                      <span className="rounded bg-chip-blue-bg px-1.5 py-0.5 font-mono text-[11px] font-semibold text-chip-blue-fg">
                        {r.via}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })()}

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
  isNeighbor,
  onSelect,
  refCb,
  riskOn,
  isRiskTable,
  riskCols,
  offset,
  onDrag,
  expanded,
  onToggleExpand,
}: {
  table: DbTable;
  selected: boolean;
  isNeighbor: boolean;
  onSelect: () => void;
  refCb: (el: HTMLButtonElement | null) => void;
  riskOn: boolean;
  isRiskTable: boolean;
  riskCols: Set<string>;
  offset: { x: number; y: number };
  onDrag: (x: number, y: number) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  // 위험률 강조 모드인데 위험률 테이블이 아니면 박스 전체를 흐리게.
  const tableDimmed = riskOn && !isRiskTable;
  // 드래그 상태 — pointer 기준. 임계값 이상 움직이면 클릭(선택) 대신 이동으로 처리.
  const drag = useRef<{
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    // 누르는 즉시 선택(드래그로 이어져도 해당 DB가 선택되어 연결이 보이도록).
    onSelect();
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 4) return; // 임계값 미만은 무시(클릭 보호)
    d.moved = true;
    setDragging(true);
    onDrag(d.baseX + dx, d.baseY + dy);
  };
  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (drag.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    }
    // 버튼을 놓으면 즉시 드래그 종료 — 이동이 따라오지 않게 상태를 모두 초기화.
    drag.current = null;
    setDragging(false);
  };
  // 한글 병기(ko)가 있는 DB(JMDC 등)는 평소에도 모든 필드를 표시.
  const bilingual = table.columns.some((c) => c.ko);
  // 확대(더블클릭) 또는 한글병기 DB → 모든 필드를 세로 목록으로.
  const showAllFields = expanded || bilingual;

  return (
    <button
      ref={refCb}
      data-erd-box=""
      onDoubleClick={onToggleExpand}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      aria-pressed={selected}
      title={expanded ? "더블클릭: 원래 크기로" : "끌어서 이동 · 더블클릭: 모든 필드 펼치기"}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${expanded ? 1.12 : 1})`,
        transformOrigin: "top left",
        zIndex: expanded ? 30 : dragging ? 20 : undefined,
        position: "relative",
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      className={`w-full select-none rounded-cover border bg-white p-3 text-left shadow-card transition-[border-color,box-shadow,opacity] ${
        expanded
          ? "border-brand-sky shadow-card-hover ring-2 ring-brand-sky/50"
          : selected
            ? "border-brand-sky shadow-card-hover ring-1 ring-brand-sky/40"
            : isNeighbor
              ? "border-brand-sky/60 shadow-card-hover ring-1 ring-brand-sky/25"
              : "border-border hover:border-foreground"
      } ${tableDimmed ? "opacity-40" : ""} ${
        riskOn && isRiskTable && !expanded ? "ring-1 ring-brand-sky/30" : ""
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
        {expanded && (
          <span className="text-brand-sky"> · 전체 {table.columns.length}필드</span>
        )}
      </p>
      {showAllFields ? (
        // 모든 필드를 세로 목록으로(한글병기 DB 상시 / 그 외는 확대 시).
        <ul className="mt-1.5 space-y-px">
          {table.columns.map((c) => {
            const isRisk = riskCols.has(`${table.name}.${c.name}`);
            const dim = riskOn && !isRisk;
            return (
              <li
                key={c.name}
                className={`leading-snug ${dim ? "opacity-30" : ""}`}
              >
                <span
                  className={`font-mono ${expanded ? "text-[10.5px]" : "text-[9.5px]"} ${
                    riskOn && isRisk
                      ? "font-semibold text-brand-sky"
                      : c.key
                        ? "font-semibold text-chip-blue-fg"
                        : "text-foreground"
                  }`}
                >
                  {c.key ? "● " : ""}
                  {c.name}
                </span>
                {c.ko && (
                  <span
                    className={`ml-1 text-tertiary ${expanded ? "text-[9.5px]" : "text-[8.5px]"}`}
                  >
                    {c.ko}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        // 평소엔 컴팩트하게 — 키 컬럼(위험률 모드엔 위험률 필드)만 칩으로.
        (() => {
          const shown = riskOn
            ? table.columns.filter((c) => riskCols.has(`${table.name}.${c.name}`))
            : table.columns.filter((c) => c.key);
          const hidden = table.columns.length - shown.length;
          const chipCls = riskOn
            ? "bg-brand-sky font-semibold text-white"
            : "bg-chip-blue-bg font-semibold text-chip-blue-fg";
          return (
            <ul className="mt-2 flex flex-wrap items-center gap-1">
              {shown.map((c) => (
                <li
                  key={c.name}
                  className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${chipCls}`}
                >
                  {c.name}
                </li>
              ))}
              {hidden > 0 && (
                <li className="rounded px-1.5 py-0.5 font-mono text-[11px] text-placeholder">
                  +{hidden}
                </li>
              )}
            </ul>
          );
        })()
      )}
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
              <dt className="flex shrink-0 flex-col gap-0.5 sm:w-48">
                <span className="flex items-center gap-1.5">
                  {c.key && (
                    <KeyRound size={12} className="shrink-0 text-brand-sky" />
                  )}
                  <span
                    className={`font-mono text-[13px] ${
                      c.key
                        ? "font-semibold text-chip-blue-fg"
                        : "text-foreground"
                    }`}
                  >
                    {c.name}
                  </span>
                  {riskOn && isRisk && (
                    <span className="rounded-full bg-brand-sky px-1.5 py-0.5 text-[9px] font-bold text-white">
                      위험률
                    </span>
                  )}
                </span>
                {c.ko && (
                  <span className="text-[11.5px] text-tertiary">{c.ko}</span>
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
