import type { ChartData, ValueFmt } from "@/data/japan-life-trends/content";

/* 시리즈 색 — globals.css 칩 팔레트 fg 8색 순환 (디자인 토큰 준수) */
const PALETTE = [
  "var(--chip-blue-fg)",
  "var(--chip-teal-fg)",
  "var(--chip-amber-fg)",
  "var(--chip-rose-fg)",
  "var(--chip-violet-fg)",
  "var(--chip-green-fg)",
  "var(--chip-cyan-fg)",
  "var(--chip-slate-fg)",
];
const PALETTE_BG = [
  "var(--chip-blue-bg)",
  "var(--chip-teal-bg)",
  "var(--chip-amber-bg)",
  "var(--chip-rose-bg)",
  "var(--chip-violet-bg)",
  "var(--chip-green-bg)",
  "var(--chip-cyan-bg)",
  "var(--chip-slate-bg)",
];

function fmt(v: number, f: ValueFmt = "int"): string {
  if (f === "none") return "";
  if (f === "fixed1") return v.toFixed(1);
  if (f === "cho-eok") return v.toLocaleString();
  return Math.round(v).toLocaleString();
}

function Legend({
  names,
  colors,
}: {
  names: string[];
  colors: string[];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {names.map((n, i) => (
        <span
          key={n + i}
          className="inline-flex items-center gap-1.5 text-[11.5px] text-tertiary"
        >
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-[2px]"
            style={{ background: colors[i % colors.length] }}
          />
          {n}
        </span>
      ))}
    </div>
  );
}

/* ── 구성 내역형(원본 도넛) → 가로 구성비 막대 + 내역 목록 ── */
function Composition({ chart }: { chart: ChartData }) {
  const items = chart.composition!;
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-md">
        {items.map((it, i) => (
          <div
            key={it.label + i}
            style={{
              width: `${it.percent}%`,
              background: PALETTE[i % PALETTE.length],
            }}
            title={`${it.label} ${it.percent}%`}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it, i) => (
          <li
            key={it.label + i}
            className="flex items-center justify-between gap-3 text-[12.5px]"
          >
            <span className="flex items-center gap-2 text-body">
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 rounded-[2px]"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              {it.label}
            </span>
            <span className="tabular-nums text-tertiary">
              {it.amount} · {it.percent}%
            </span>
          </li>
        ))}
      </ul>
      {chart.total && (
        <div className="mt-2 border-t border-border pt-2 text-right text-[12.5px] font-semibold text-foreground">
          합계 {chart.total}
        </div>
      )}
    </div>
  );
}

/* ── 가로 100% 누적(구성비, %) ── */
function HorizontalStacked({ chart }: { chart: ChartData }) {
  const rows = chart.labels;
  return (
    <div className="space-y-2.5">
      {rows.map((label, ri) => {
        const vals = chart.series.map((s) => s.data[ri] ?? 0);
        const total = vals.reduce((a, b) => a + b, 0) || 1;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-right text-[11.5px] tabular-nums text-tertiary">
              {label}
            </span>
            <div className="flex h-6 flex-1 overflow-hidden rounded">
              {vals.map((v, si) => {
                const pct = (v / total) * 100;
                return (
                  <div
                    key={si}
                    className="flex items-center justify-center text-[10px] text-white/95"
                    style={{
                      width: `${pct}%`,
                      background: PALETTE[si % PALETTE.length],
                    }}
                    title={`${chart.series[si].name} ${pct.toFixed(1)}%`}
                  >
                    {pct >= 9 ? `${Math.round(pct)}` : ""}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Legend names={chart.series.map((s) => s.name)} colors={PALETTE} />
    </div>
  );
}

/* ── 세로 막대(단일/그룹/누적) + 선택적 꺾은선(우축) ── */
function VerticalBars({ chart }: { chart: ChartData }) {
  const W = 680;
  const H = 240;
  const padL = 20;
  const padR = chart.line ? 36 : 20;
  const padT = 24;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = chart.labels.length;
  const stacked = chart.stacked;
  const ns = chart.series.length;

  // 막대 영역 최대값
  const colTotals = chart.labels.map((_, ci) =>
    stacked
      ? chart.series.reduce((s, ser) => s + (ser.data[ci] ?? 0), 0)
      : Math.max(...chart.series.map((ser) => ser.data[ci] ?? 0))
  );
  const maxV = Math.max(...colTotals, 0.0001) * 1.12;
  const slot = plotW / n;
  const barGroupW = slot * 0.62;

  // 우축 라인 스케일
  const lineMax = chart.line
    ? Math.max(...chart.line.data, 0.0001) * 1.15
    : 1;
  const lineMin = chart.line ? Math.min(...chart.line.data, 0) * 0.9 : 0;
  const yLine = (v: number) =>
    padT + plotH - ((v - lineMin) / (lineMax - lineMin || 1)) * plotH;

  const showTotals = chart.showTotals ?? stacked;

  return (
    <div>
      {(chart.unit || chart.unitRight) && (
        <div className="mb-1 flex justify-between text-[11px] text-tertiary">
          <span>{chart.unit}</span>
          <span>{chart.unitRight}</span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="막대 그래프"
      >
        {/* 베이스라인 */}
        <line
          x1={padL}
          y1={padT + plotH}
          x2={W - padR}
          y2={padT + plotH}
          stroke="var(--border)"
        />
        {chart.labels.map((label, ci) => {
          const cx = padL + slot * ci + slot / 2;
          let acc = 0;
          return (
            <g key={label}>
              {chart.series.map((ser, si) => {
                const v = ser.data[ci] ?? 0;
                if (stacked) {
                  const h = (v / maxV) * plotH;
                  const y = padT + plotH - acc - h;
                  acc += h;
                  return (
                    <rect
                      key={si}
                      x={cx - barGroupW / 2}
                      y={y}
                      width={barGroupW}
                      height={Math.max(h, 0)}
                      fill={PALETTE[si % PALETTE.length]}
                    >
                      <title>{`${ser.name} ${label}: ${fmt(
                        v,
                        chart.valueFmt
                      )}`}</title>
                    </rect>
                  );
                }
                const bw = barGroupW / ns;
                const h = (v / maxV) * plotH;
                const x = cx - barGroupW / 2 + bw * si;
                return (
                  <rect
                    key={si}
                    x={x}
                    y={padT + plotH - h}
                    width={bw * 0.86}
                    height={Math.max(h, 0)}
                    fill={PALETTE[si % PALETTE.length]}
                  >
                    <title>{`${ser.name} ${label}: ${fmt(
                      v,
                      chart.valueFmt
                    )}`}</title>
                  </rect>
                );
              })}
              {showTotals && (
                <text
                  x={cx}
                  y={padT + plotH - acc - 5}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ fontSize: 10.5, fontWeight: 600 }}
                >
                  {fmt(colTotals[ci], chart.totalFmt ?? chart.valueFmt)}
                </text>
              )}
              <text
                x={cx}
                y={H - 10}
                textAnchor="middle"
                className="fill-tertiary"
                style={{ fontSize: 10.5 }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* 꺾은선(우축) */}
        {chart.line &&
          (() => {
            const ln = chart.line;
            return (
              <>
                <polyline
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  points={ln.data
                    .map(
                      (v, ci) => `${padL + slot * ci + slot / 2},${yLine(v)}`
                    )
                    .join(" ")}
                />
                {ln.data.map((v, ci) => (
                  <g key={ci}>
                    <circle
                      cx={padL + slot * ci + slot / 2}
                      cy={yLine(v)}
                      r={2.8}
                      fill="var(--primary)"
                    />
                    <text
                      x={padL + slot * ci + slot / 2}
                      y={yLine(v) - 7}
                      textAnchor="middle"
                      className="fill-primary"
                      style={{ fontSize: 10, fontWeight: 600 }}
                    >
                      {fmt(v, ln.fmt)}
                    </text>
                  </g>
                ))}
              </>
            );
          })()}
      </svg>
      <Legend
        names={[
          ...chart.series.map((s) => s.name),
          ...(chart.line ? [chart.line.name] : []),
        ]}
        colors={[...PALETTE, "var(--primary)"]}
      />
    </div>
  );
}

/* ── 꺾은선 그래프 ── */
function LineChart({ chart }: { chart: ChartData }) {
  const W = 680;
  const H = 240;
  const padL = 20;
  const padR = 20;
  const padT = 24;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = chart.labels.length;
  const all = chart.series.flatMap((s) => s.data);
  const maxV = Math.max(...all) * 1.1;
  const minV = Math.min(...all, 0) * 0.95;
  const x = (i: number) => padL + (plotW / Math.max(n - 1, 1)) * i;
  const y = (v: number) =>
    padT + plotH - ((v - minV) / (maxV - minV || 1)) * plotH;

  return (
    <div>
      {chart.unit && (
        <div className="mb-1 text-[11px] text-tertiary">{chart.unit}</div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="꺾은선 그래프"
      >
        <line
          x1={padL}
          y1={padT + plotH}
          x2={W - padR}
          y2={padT + plotH}
          stroke="var(--border)"
        />
        {chart.series.map((ser, si) => (
          <g key={ser.name}>
            <polyline
              fill="none"
              stroke={PALETTE[si % PALETTE.length]}
              strokeWidth={2}
              points={ser.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
            {ser.data.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={2.6}
                fill={PALETTE[si % PALETTE.length]}
              >
                <title>{`${ser.name} ${chart.labels[i]}: ${fmt(
                  v,
                  chart.valueFmt
                )}`}</title>
              </circle>
            ))}
          </g>
        ))}
        {chart.labels.map((label, i) => (
          <text
            key={label}
            x={x(i)}
            y={H - 10}
            textAnchor="middle"
            className="fill-tertiary"
            style={{ fontSize: 10.5 }}
          >
            {label}
          </text>
        ))}
      </svg>
      <Legend names={chart.series.map((s) => s.name)} colors={PALETTE} />
    </div>
  );
}

export function MiniChart({ chart }: { chart: ChartData }) {
  let body: React.ReactNode;
  if (chart.composition) body = <Composition chart={chart} />;
  else if (chart.horizontal) body = <HorizontalStacked chart={chart} />;
  else if (chart.type === "line") body = <LineChart chart={chart} />;
  else body = <VerticalBars chart={chart} />;

  return (
    <div className="rounded-cover bg-white p-4 shadow-card sm:p-5">{body}</div>
  );
}

export { PALETTE_BG };
