"use client";

/**
 * 확률분포 그래프 — 의존성 없이 SVG로 직접 렌더.
 * 시리즈는 여러 개를 겹칠 수 있고(비교 모드: A 실선 + B 파선), 각 시리즈는
 *  - line : 연속형 PDF/CDF 곡선
 *  - stem : 이산형 PMF(수직선 + 점)
 *  - step : 이산형 CDF(계단, where=post)
 * markers는 평균·중위수 같은 수직 기준선(라벨 포함). 고정 viewBox + width:100%.
 */
import { useMemo, type ReactNode } from "react";

export interface Pt {
  x: number;
  y: number;
}

export interface Series {
  points: Pt[];
  color: string;
  variant: "line" | "stem" | "step";
  dashed?: boolean;
}

/** 평균·중위수 등 수직 기준선. x가 그래프 범위 밖이면 그리지 않는다. */
export interface ChartMarker {
  x: number;
  label: string;
  color: string;
  dash: string; // strokeDasharray (평균=파선, 중위수=점선)
  faint?: boolean; // 비교 모드의 B — 연하게
}

const W = 320;
const H = 200;
const PAD_L = 38;
const PAD_R = 12;
const PAD_T = 18;
const PAD_T_MARK = 30; // 마커 라벨 자리 확보
const PAD_B = 26;
const MARK_FZ = 8.5;
const MARK_ROW_H = 9;
const MARK_ROWS = 3;

/** 축 눈금 숫자 포맷 — 큰 수는 k/M, 소수는 1~2자리. */
export function fmtTick(v: number): string {
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e6) return `${Math.round(v / 1e5) / 10}M`;
  if (a >= 1e3) return `${Math.round(v / 100) / 10}k`;
  if (Number.isInteger(v)) return String(v);
  if (a >= 10) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1);
  return v.toFixed(2);
}

/**
 * 좌표 2자리 반올림 — pdf/pmf는 Math.exp·lgamma를 거치는데 그 결과가 Node와
 * 브라우저에서 1 ULP 다를 수 있어(서버/클라이언트 하이드레이션 불일치),
 * 좌표를 옮길 때 반올림해 양쪽 문자열을 일치시킨다.
 */
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** 라벨 폭 추정 — 한글은 1em, 나머지는 0.55em(측정 없이 겹침 판정용). */
function approxWidth(s: string, fz: number): number {
  let w = 0;
  for (const ch of s) w += /[가-힣ㄱ-ㅎ]/.test(ch) ? fz : fz * 0.55;
  return w;
}

/** 상단 y범위 산정 — 발산(끝점) 스파이크를 97분위로 클리핑해 본체가 보이게. */
function yMaxOf(ys: number[]): number {
  const finite = ys.filter((y) => Number.isFinite(y) && y > 0).sort((a, b) => a - b);
  if (finite.length === 0) return 1;
  const p97 = finite[Math.min(finite.length - 1, Math.floor(finite.length * 0.97))];
  const max = finite[finite.length - 1];
  // 스파이크가 본체의 2배 이상이면 분위수로 캡, 아니면 최댓값
  return (max > p97 * 2 ? p97 * 1.3 : max) * 1.08;
}

export function DistChart({
  series,
  title,
  yDomain,
  xLabel,
  markers,
}: {
  series: Series[];
  title: string;
  yDomain?: [number, number];
  xLabel?: string;
  markers?: ChartMarker[];
}) {
  const marks = useMemo(() => markers ?? [], [markers]);

  const g = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    if (all.length === 0) return null;
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    const yMax = yDomain ? yDomain[1] : yMaxOf(ys);
    const xSpan = xmax - xmin || 1;
    const padT = marks.length > 0 ? PAD_T_MARK : PAD_T;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - padT - PAD_B;
    const baseY = H - PAD_B;
    const sx = (x: number) => round2(PAD_L + ((x - xmin) / xSpan) * plotW);
    const sy = (y: number) => {
      const v = Math.max(0, Math.min(yMax, y));
      return round2(baseY - (v / yMax) * plotH);
    };
    return { xmin, xmax, yMax, padT, baseY, sx, sy };
  }, [series, yDomain, marks]);

  /** 라벨 배치 — x순으로 훑으며 겹치지 않는 첫 행에. 자리 없으면 라벨만 생략. */
  const labels = useMemo(() => {
    if (!g) return [];
    const rows: { x0: number; x1: number }[][] = Array.from(
      { length: MARK_ROWS },
      () => []
    );
    const out: { key: string; text: string; cx: number; y: number; color: string; faint: boolean }[] =
      [];
    const inRange = marks
      .filter((m) => Number.isFinite(m.x) && m.x >= g.xmin && m.x <= g.xmax)
      .sort((a, b) => a.x - b.x);
    for (const m of inRange) {
      const w = approxWidth(m.label, MARK_FZ);
      const cx = round2(
        Math.min(Math.max(g.sx(m.x), PAD_L + w / 2), W - PAD_R - w / 2)
      );
      const box = { x0: cx - w / 2 - 2, x1: cx + w / 2 + 2 };
      const row = rows.findIndex((r) =>
        r.every((b) => box.x1 < b.x0 || box.x0 > b.x1)
      );
      if (row === -1) continue;
      rows[row].push(box);
      out.push({
        key: m.label,
        text: m.label,
        cx,
        y: 8 + row * MARK_ROW_H,
        color: m.color,
        faint: !!m.faint,
      });
    }
    return out;
  }, [g, marks]);

  if (!g) return null;

  const { xmin, xmax, yMax, padT, baseY, sx, sy } = g;

  const drawSeries = (s: Series, i: number): ReactNode => {
    const dash = s.dashed ? "5 3" : undefined;
    if (s.variant === "line") {
      const d = s.points
        .map((p, j) => `${j === 0 ? "M" : "L"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`)
        .join(" ");
      const last = s.points[s.points.length - 1];
      const area = `${d} L${sx(last.x).toFixed(2)},${baseY} L${sx(s.points[0].x).toFixed(2)},${baseY} Z`;
      return (
        <g key={i}>
          {/* 겹칠 때 아래 곡선이 비치도록 면은 A(첫 시리즈)에만 */}
          {i === 0 ? (
            <path d={area} fill={s.color} fillOpacity={0.08} stroke="none" />
          ) : null}
          <path d={d} fill="none" stroke={s.color} strokeWidth={1.8} strokeDasharray={dash} />
        </g>
      );
    }
    if (s.variant === "stem") {
      const shift = series.length > 1 ? (i === 0 ? -0.9 : 0.9) : 0; // 비교 시 살짝 엇갈리게
      return (
        <g key={i}>
          {s.points.map((p, j) => (
            <line
              key={j}
              x1={sx(p.x) + shift}
              y1={baseY}
              x2={sx(p.x) + shift}
              y2={sy(p.y)}
              stroke={s.color}
              strokeWidth={s.points.length > 30 ? 1.1 : 1.6}
              strokeOpacity={i === 0 ? 1 : 0.8}
            />
          ))}
          {s.points.length <= 40
            ? s.points.map((p, j) => (
                <circle
                  key={j}
                  cx={sx(p.x) + shift}
                  cy={sy(p.y)}
                  r={2.1}
                  fill={s.color}
                />
              ))
            : null}
        </g>
      );
    }
    // step (CDF, where=post): 각 점의 값이 다음 점까지 수평 유지
    let d = `M${sx(s.points[0].x).toFixed(2)},${sy(s.points[0].y).toFixed(2)}`;
    for (let j = 1; j < s.points.length; j++) {
      d += ` L${sx(s.points[j].x).toFixed(2)},${sy(s.points[j - 1].y).toFixed(2)}`;
      d += ` L${sx(s.points[j].x).toFixed(2)},${sy(s.points[j].y).toFixed(2)}`;
    }
    return (
      <path
        key={i}
        d={d}
        fill="none"
        stroke={s.color}
        strokeWidth={1.8}
        strokeDasharray={dash}
      />
    );
  };

  const xTicks = [xmin, (xmin + xmax) / 2, xmax];
  const yTicks = [0, yMax / 2, yMax];
  const markLines = marks.filter(
    (m) => Number.isFinite(m.x) && m.x >= xmin && m.x <= xmax
  );

  return (
    <figure className="m-0">
      <figcaption className="mb-1 text-center text-[12px] font-medium text-tertiary">
        {title}
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={`${title} 그래프`}
        className="block"
      >
        {/* 격자·축 */}
        {yTicks.map((t, i) => (
          <line
            key={`gy${i}`}
            x1={PAD_L}
            y1={sy(t)}
            x2={W - PAD_R}
            y2={sy(t)}
            stroke="var(--border)"
            strokeWidth={0.6}
            strokeDasharray={i === 0 ? undefined : "2 3"}
          />
        ))}
        <line x1={PAD_L} y1={padT} x2={PAD_L} y2={baseY} stroke="var(--border)" strokeWidth={0.8} />

        {series.map(drawSeries)}

        {/* 평균·중위수 수직선 */}
        {markLines.map((m, i) => (
          <line
            key={`mk${i}`}
            x1={sx(m.x)}
            y1={padT}
            x2={sx(m.x)}
            y2={baseY}
            stroke={m.color}
            strokeWidth={1.1}
            strokeDasharray={m.dash}
            strokeOpacity={m.faint ? 0.5 : 0.9}
          />
        ))}
        {labels.map((l, i) => (
          <text
            key={`ml${i}`}
            x={l.cx}
            y={l.y}
            textAnchor="middle"
            fill={l.color}
            fillOpacity={l.faint ? 0.6 : 1}
            style={{ fontSize: MARK_FZ, fontWeight: 500 }}
          >
            {l.text}
          </text>
        ))}

        {/* 눈금 라벨 */}
        {xTicks.map((t, i) => (
          <text
            key={`xt${i}`}
            x={sx(t)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
            className="fill-[var(--text-tertiary)]"
            style={{ fontSize: 9 }}
          >
            {fmtTick(t)}
          </text>
        ))}
        {yTicks.map((t, i) => (
          <text
            key={`yt${i}`}
            x={PAD_L - 4}
            y={sy(t) + 3}
            textAnchor="end"
            className="fill-[var(--text-tertiary)]"
            style={{ fontSize: 9 }}
          >
            {fmtTick(t)}
          </text>
        ))}
        {xLabel ? (
          <text
            x={(PAD_L + W - PAD_R) / 2}
            y={H - 0.5}
            textAnchor="middle"
            className="fill-[var(--text-tertiary)]"
            style={{ fontSize: 8.5 }}
          >
            {xLabel}
          </text>
        ) : null}
      </svg>
    </figure>
  );
}
