"use client";

/**
 * 확률분포 그래프 — 의존성 없이 SVG로 직접 렌더.
 *  - line : 연속형 PDF/CDF 곡선
 *  - stem : 이산형 PMF(수직선 + 점)
 *  - step : 이산형 CDF(계단, where=post)
 * 고정 viewBox + width:100%로 반응형 자동 스케일.
 */
import { useMemo, type ReactNode } from "react";

export interface Pt {
  x: number;
  y: number;
}

const W = 320;
const H = 200;
const PAD_L = 38;
const PAD_R = 12;
const PAD_T = 18;
const PAD_B = 26;

/** 축 눈금 숫자 포맷 — 큰 수는 k/M, 소수는 1~2자리. */
function fmtTick(v: number): string {
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e6) return `${Math.round(v / 1e5) / 10}M`;
  if (a >= 1e3) return `${Math.round(v / 100) / 10}k`;
  if (Number.isInteger(v)) return String(v);
  if (a >= 10) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1);
  return v.toFixed(2);
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
  variant,
  points,
  title,
  color,
  yDomain,
  xLabel,
}: {
  variant: "line" | "stem" | "step";
  points: Pt[];
  title: string;
  color: string;
  yDomain?: [number, number];
  xLabel?: string;
}) {
  const g = useMemo(() => {
    if (points.length === 0) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs);
    const yMax = yDomain ? yDomain[1] : yMaxOf(ys);
    const xSpan = xmax - xmin || 1;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const baseY = H - PAD_B;
    const sx = (x: number) => PAD_L + ((x - xmin) / xSpan) * plotW;
    const sy = (y: number) => {
      const v = Math.max(0, Math.min(yMax, y));
      return baseY - (v / yMax) * plotH;
    };
    return { xs, ys, xmin, xmax, yMax, baseY, sx, sy };
  }, [points, yDomain]);

  if (!g) return null;

  const { xmin, xmax, yMax, baseY, sx, sy } = g;

  // 시리즈 경로
  let series: ReactNode = null;
  if (variant === "line") {
    const d = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(2)},${sy(p.y).toFixed(2)}`)
      .join(" ");
    const area = `${d} L${sx(points[points.length - 1].x).toFixed(2)},${baseY} L${sx(points[0].x).toFixed(2)},${baseY} Z`;
    series = (
      <>
        <path d={area} fill={color} fillOpacity={0.08} stroke="none" />
        <path d={d} fill="none" stroke={color} strokeWidth={1.8} />
      </>
    );
  } else if (variant === "stem") {
    series = (
      <>
        {points.map((p, i) => (
          <line
            key={i}
            x1={sx(p.x)}
            y1={baseY}
            x2={sx(p.x)}
            y2={sy(p.y)}
            stroke={color}
            strokeWidth={points.length > 30 ? 1.1 : 1.6}
          />
        ))}
        {points.length <= 40
          ? points.map((p, i) => (
              <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.1} fill={color} />
            ))
          : null}
      </>
    );
  } else {
    // step (CDF, where=post): 각 점의 값이 다음 점까지 수평 유지
    let d = `M${sx(points[0].x).toFixed(2)},${sy(points[0].y).toFixed(2)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L${sx(points[i].x).toFixed(2)},${sy(points[i - 1].y).toFixed(2)}`;
      d += ` L${sx(points[i].x).toFixed(2)},${sy(points[i].y).toFixed(2)}`;
    }
    series = <path d={d} fill="none" stroke={color} strokeWidth={1.8} />;
  }

  const xTicks = [xmin, (xmin + xmax) / 2, xmax];
  const yTicks = [0, yMax / 2, yMax];

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
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={baseY} stroke="var(--border)" strokeWidth={0.8} />

        {series}

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
