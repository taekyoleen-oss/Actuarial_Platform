"use client";

/**
 * 확률분포 카드 1종 — 접기/펼치기, 파라미터 슬라이더(실시간), PDF/CDF(또는
 * PMF/CDF) 그래프, KaTeX 수식, 통계량(수식+값), 파이썬 코드 팝업.
 */
import { useMemo, useState } from "react";
import { Code2 } from "lucide-react";
import {
  defaultParams,
  type Distribution,
  type DistParam,
  type Params,
  type StatValue,
} from "@/lib/distributions";
import { DistChart, type Pt } from "@/components/feature/datalab/DistChart";
import { DistCodeDialog } from "@/components/feature/datalab/DistCodeDialog";
import { Tex } from "@/components/feature/datalab/Tex";

const N_SAMPLES = 240;
const K_CAP = 220; // 이산형 그래프 안전 상한

/** 통계량 값 포맷 — ∞/지수표기/4자리 반올림. null은 호출부에서 처리. */
function fmtVal(v: number): string {
  if (!Number.isFinite(v)) return v > 0 ? "∞" : "−∞";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e5 || a < 1e-4) return v.toExponential(2);
  return String(Math.round(v * 1e4) / 1e4);
}

function ParamControl({
  param,
  value,
  onChange,
}: {
  param: DistParam;
  value: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => {
    let x = param.integer ? Math.round(v) : v;
    if (x < param.min) x = param.min;
    if (x > param.max) x = param.max;
    return x;
  };
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[12.5px] font-medium text-foreground">
          {param.label}
        </span>
        <input
          type="number"
          value={value}
          min={param.min}
          max={param.max}
          step={param.step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
          className="w-20 rounded border border-border bg-transparent px-2 py-0.5 text-right text-[12.5px] tabular-nums text-foreground focus-visible:border-foreground focus-visible:outline-none"
        />
      </span>
      <input
        type="range"
        value={value}
        min={param.min}
        max={param.max}
        step={param.step}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="h-1.5 w-full cursor-pointer accent-[var(--primary)]"
        aria-label={param.label}
      />
    </label>
  );
}

function StatTable({ stats }: { stats: StatValue[] }) {
  return (
    <div className="overflow-hidden rounded border border-border">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="bg-surface text-tertiary">
            <th className="px-3 py-1.5 text-left font-medium">통계량</th>
            <th className="px-3 py-1.5 text-left font-medium">수식</th>
            <th className="px-3 py-1.5 text-right font-medium">값</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.label} className="border-t border-border">
              <td className="whitespace-nowrap px-3 py-1.5 font-medium text-foreground">
                {s.label}
              </td>
              <td className="px-3 py-1.5">
                <Tex expr={s.tex} />
              </td>
              <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-foreground">
                {s.value !== null ? (
                  fmtVal(s.value)
                ) : (
                  <span className="text-tertiary" title={s.note}>
                    정의 안 됨
                    {s.note ? (
                      <span className="ml-1 text-[11px]">({s.note})</span>
                    ) : null}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DistCard({ dist }: { dist: Distribution }) {
  const [params, setParams] = useState<Params>(() => defaultParams(dist));
  const [showCode, setShowCode] = useState(false);

  const setParam = (key: string, v: number) =>
    setParams((prev) => ({ ...prev, [key]: v }));

  const chartData = useMemo<{ pdf?: Pt[]; pmf?: Pt[]; cdf: Pt[] }>(() => {
    if (dist.kind === "continuous") {
      const [xmin, xmax] = dist.domain(params);
      const span = xmax - xmin || 1;
      const pdf: Pt[] = [];
      const cdf: Pt[] = [];
      for (let i = 0; i < N_SAMPLES; i++) {
        const x = xmin + ((i + 0.5) / N_SAMPLES) * span; // 끝점 발산 회피
        pdf.push({ x, y: dist.pdf(x, params) });
        cdf.push({ x, y: dist.cdf(x, params) });
      }
      return { pdf, cdf };
    }
    const kMax = Math.min(K_CAP, Math.max(1, dist.kMax(params)));
    const pmf: Pt[] = [];
    const cdf: Pt[] = [];
    let acc = 0;
    for (let k = 0; k <= kMax; k++) {
      const y = dist.pmf(k, params);
      acc += y;
      pmf.push({ x: k, y });
      cdf.push({ x: k, y: Math.min(1, acc) });
    }
    return { pmf, cdf };
  }, [dist, params]);

  const stats = useMemo(() => dist.stats(params), [dist, params]);
  const code = useMemo(() => dist.python(params), [dist, params]);

  const chipBg = `var(--chip-${dist.color}-bg)`;
  const chipFg = `var(--chip-${dist.color}-fg)`;

  return (
    <div className="overflow-hidden rounded-cover border border-border bg-white shadow-card">
      {/* 제목 헤더(비대화형) — 선택된 분포 정보 */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <span
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-medium"
          style={{ background: chipBg, color: chipFg }}
        >
          {dist.kind === "continuous" ? "연속" : "이산"}
        </span>
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-semibold text-foreground">
            {dist.name}
          </span>
          <span className="text-[12.5px] text-tertiary">{dist.en}</span>
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="mb-4 text-[12.5px] leading-relaxed text-tertiary">
          {dist.blurb}
        </p>

        {/* 파라미터 */}
          <div className="mb-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {dist.params.map((p) => (
              <ParamControl
                key={p.key}
                param={p}
                value={params[p.key]}
                onChange={(v) => setParam(p.key, v)}
              />
            ))}
          </div>

          {/* 그래프 */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dist.kind === "continuous" ? (
              <>
                <DistChart variant="line" title="확률밀도함수 (PDF)" color="var(--primary)" points={chartData.pdf ?? []} />
                <DistChart variant="line" title="누적분포함수 (CDF)" color="var(--chip-teal-fg)" points={chartData.cdf} yDomain={[0, 1]} />
              </>
            ) : (
              <>
                <DistChart variant="stem" title="확률질량함수 (PMF)" color="var(--primary)" points={chartData.pmf ?? []} />
                <DistChart variant="step" title="누적분포함수 (CDF)" color="var(--chip-teal-fg)" points={chartData.cdf} yDomain={[0, 1]} />
              </>
            )}
          </div>

          {/* 수식 */}
          <div className="mb-5 space-y-3 rounded border border-border bg-surface/50 px-4 py-3.5">
            <div className="overflow-x-auto">
              <span className="mr-2 text-[12px] font-medium text-tertiary">
                {dist.kind === "continuous" ? "PDF" : "PMF"}
              </span>
              <Tex
                expr={dist.kind === "continuous" ? dist.pdfTex : dist.pmfTex}
                block
              />
            </div>
            <div className="overflow-x-auto">
              <span className="mr-2 text-[12px] font-medium text-tertiary">
                CDF
              </span>
              <Tex expr={dist.cdfTex} block />
            </div>
          </div>

          {/* 통계량 */}
          <div className="mb-4">
            <h4 className="mb-2 text-[12.5px] font-semibold text-foreground">
              통계량
            </h4>
            <StatTable stats={stats} />
          </div>

          <button
            type="button"
            onClick={() => setShowCode(true)}
            className="inline-flex items-center gap-1.5 rounded border border-border bg-white px-3 py-1.5 text-[12.5px] font-medium text-tertiary hover:text-foreground"
          >
            <Code2 size={14} /> 파이썬 코드 보기
          </button>
      </div>

      {showCode ? (
        <DistCodeDialog
          name={dist.name}
          en={dist.en}
          code={code}
          onClose={() => setShowCode(false)}
        />
      ) : null}
    </div>
  );
}
