"use client";

/**
 * 확률분포 카드 1종 — 파라미터 슬라이더(실시간), PDF/CDF(또는 PMF/CDF) 그래프,
 * KaTeX 수식, 통계량(수식+값), 파이썬 코드 팝업.
 *
 * 부가 기능 2종:
 *  - 평균·중위수 마커: 두 그래프에 수직선(평균=앰버 파선, 중위수=로즈 점선). 기본 켜짐.
 *  - 비교 모드: 같은 종류(연속/이산) 안에서 B 분포·파라미터를 골라 A 위에 겹쳐 본다.
 *    B는 파선. 통계량은 A/B 두 열, 파이썬 코드도 두 분포를 겹쳐 그리는 코드로 바뀐다.
 */
import { useMemo, useState } from "react";
import { Code2, GitCompare } from "lucide-react";
import {
  comparePython,
  defaultParams,
  meanOf,
  medianOf,
  peersOf,
  singlePython,
  type Distribution,
  type DistParam,
  type Params,
  type StatValue,
} from "@/lib/distributions";
import {
  DistChart,
  fmtTick,
  type ChartMarker,
  type Pt,
  type Series,
} from "@/components/feature/datalab/DistChart";
import { DistCodeDialog } from "@/components/feature/datalab/DistCodeDialog";
import { Tex } from "@/components/feature/datalab/Tex";

const N_SAMPLES = 240;
const K_CAP = 220; // 이산형 그래프 안전 상한

const COLOR_A = "var(--primary)";
const COLOR_A_CDF = "var(--chip-teal-fg)"; // 단일 모드 CDF(기존 색)
const COLOR_B = "var(--chip-violet-fg)";
const COLOR_MEAN = "var(--chip-amber-fg)";
const COLOR_MEDIAN = "var(--chip-rose-fg)";
const DASH_MEAN = "4 2";
const DASH_MEDIAN = "1.5 2";

/** 평균≈중위수로 볼 x축 상대 거리 — 이보다 가까우면 선 하나로 합친다. */
const MERGE_RATIO = 0.015;

/** 통계량 값 포맷 — ∞/지수표기/4자리 반올림. null은 호출부에서 처리. */
function fmtVal(v: number): string {
  if (!Number.isFinite(v)) return v > 0 ? "∞" : "−∞";
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e5 || a < 1e-4) return v.toExponential(2);
  return String(Math.round(v * 1e4) / 1e4);
}

/** 분포 하나를 자기 도메인 안에서만 표본화 — 지지집합 밖 평가(발산)를 피한다. */
function sample(d: Distribution, p: Params): { main: Pt[]; cdf: Pt[] } {
  if (d.kind === "continuous") {
    const [xmin, xmax] = d.domain(p);
    const span = xmax - xmin || 1;
    const main: Pt[] = [];
    const cdf: Pt[] = [];
    for (let i = 0; i < N_SAMPLES; i++) {
      const x = xmin + ((i + 0.5) / N_SAMPLES) * span; // 끝점 발산 회피
      main.push({ x, y: d.pdf(x, p) });
      cdf.push({ x, y: d.cdf(x, p) });
    }
    return { main, cdf };
  }
  const kMax = Math.min(K_CAP, Math.max(1, d.kMax(p)));
  const main: Pt[] = [];
  const cdf: Pt[] = [];
  let acc = 0;
  for (let k = 0; k <= kMax; k++) {
    const y = d.pmf(k, p);
    acc += y;
    main.push({ x: k, y });
    cdf.push({ x: k, y: Math.min(1, acc) });
  }
  return { main, cdf };
}

/** 평균·중위수 마커 — 정의 안 되면 생략, 두 값이 가까우면 한 줄로 합친다. */
function markersFor(
  d: Distribution,
  p: Params,
  xSpan: number,
  prefix: string,
  faint: boolean
): ChartMarker[] {
  const mean = meanOf(d, p);
  const median = medianOf(d, p);
  if (
    mean !== null &&
    median !== null &&
    Math.abs(mean - median) < xSpan * MERGE_RATIO
  ) {
    return [
      {
        x: mean,
        label: `${prefix}평균=중위수 ${fmtTick(mean)}`,
        color: COLOR_MEAN,
        dash: DASH_MEAN,
        faint,
      },
    ];
  }
  const out: ChartMarker[] = [];
  if (mean !== null) {
    out.push({
      x: mean,
      label: `${prefix}평균 ${fmtTick(mean)}`,
      color: COLOR_MEAN,
      dash: DASH_MEAN,
      faint,
    });
  }
  if (median !== null) {
    out.push({
      x: median,
      label: `${prefix}중위수 ${fmtTick(median)}`,
      color: COLOR_MEDIAN,
      dash: DASH_MEDIAN,
      faint,
    });
  }
  return out;
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

function ParamGrid({
  d,
  values,
  onChange,
}: {
  d: Distribution;
  values: Params;
  onChange: (key: string, v: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {d.params.map((p) => (
        <ParamControl
          key={p.key}
          param={p}
          value={values[p.key]}
          onChange={(v) => onChange(p.key, v)}
        />
      ))}
    </div>
  );
}

/** 통계량 값 셀 — 정의 안 되는 적률은 조건을 함께 알린다. */
function StatCell({ s }: { s?: StatValue }) {
  if (!s) return <span className="text-tertiary">—</span>;
  if (s.value === null) {
    return (
      <span className="text-tertiary" title={s.note}>
        정의 안 됨
        {s.note ? <span className="ml-1 text-[11px]">({s.note})</span> : null}
      </span>
    );
  }
  return <>{fmtVal(s.value)}</>;
}

function StatTable({ stats }: { stats: StatValue[] }) {
  return (
    <div className="overflow-x-auto rounded border border-border">
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
                <StatCell s={s} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 비교 모드 통계량 — A·B 값을 나란히. 같은 분포끼리면 수식이 공통이라 수식 열을
 * 두고, 다른 분포면 수식이 서로 달라 열을 생략한다(수식은 아래 수식 섹션에 A·B 각각).
 */
function CompareStatTable({
  a,
  b,
  shareTex,
}: {
  a: StatValue[];
  b: StatValue[];
  shareTex: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="bg-surface text-tertiary">
            <th className="px-3 py-1.5 text-left font-medium">통계량</th>
            {shareTex ? (
              <th className="px-3 py-1.5 text-left font-medium">수식</th>
            ) : null}
            <th
              className="px-3 py-1.5 text-right font-medium"
              style={{ color: COLOR_A }}
            >
              A 값
            </th>
            <th
              className="px-3 py-1.5 text-right font-medium"
              style={{ color: COLOR_B }}
            >
              B 값
            </th>
          </tr>
        </thead>
        <tbody>
          {a.map((s, i) => (
            <tr key={s.label} className="border-t border-border">
              <td className="whitespace-nowrap px-3 py-1.5 font-medium text-foreground">
                {s.label}
              </td>
              {shareTex ? (
                <td className="px-3 py-1.5">
                  <Tex expr={s.tex} />
                </td>
              ) : null}
              <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-foreground">
                <StatCell s={s} />
              </td>
              <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-foreground">
                <StatCell s={b[i]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormulaBlock({
  d,
  side,
  color,
}: {
  d: Distribution;
  side?: string;
  color?: string;
}) {
  return (
    <div className="space-y-3 rounded border border-border bg-surface/50 px-4 py-3.5">
      {side ? (
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold" style={{ color }}>
            {side}
          </span>
          <span className="text-[12.5px] font-medium text-foreground">
            {d.name}
          </span>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <span className="mr-2 text-[12px] font-medium text-tertiary">
          {d.kind === "continuous" ? "PDF" : "PMF"}
        </span>
        <Tex expr={d.kind === "continuous" ? d.pdfTex : d.pmfTex} block />
      </div>
      <div className="overflow-x-auto">
        <span className="mr-2 text-[12px] font-medium text-tertiary">CDF</span>
        <Tex expr={d.cdfTex} block />
      </div>
    </div>
  );
}

/** 비교 모드 범례 — 선 모양(실선/파선)과 분포명. */
function LegendLine({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg width="18" height="8" aria-hidden className="shrink-0">
      <line
        x1="0"
        y1="4"
        x2="18"
        y2="4"
        stroke={color}
        strokeWidth="2"
        strokeDasharray={dashed ? "5 3" : undefined}
      />
    </svg>
  );
}

export function DistCard({ dist }: { dist: Distribution }) {
  const [params, setParams] = useState<Params>(() => defaultParams(dist));
  const [showCode, setShowCode] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);
  const [compare, setCompare] = useState(false);
  const [distB, setDistB] = useState<Distribution>(dist);
  const [paramsB, setParamsB] = useState<Params>(() => defaultParams(dist));

  const peers = peersOf(dist);

  const setParam = (key: string, v: number) =>
    setParams((prev) => ({ ...prev, [key]: v }));
  const setParamB = (key: string, v: number) =>
    setParamsB((prev) => ({ ...prev, [key]: v }));

  // 비교를 켤 때 B는 A의 현재 분포·파라미터 복사본에서 출발한다.
  const toggleCompare = () => {
    if (!compare) {
      setDistB(dist);
      setParamsB({ ...params });
    }
    setCompare(!compare);
  };

  const changeDistB = (id: string) => {
    const next = peers.find((d) => d.id === id) ?? dist;
    setDistB(next);
    setParamsB(next.id === dist.id ? { ...params } : defaultParams(next));
  };

  const dataA = useMemo(() => sample(dist, params), [dist, params]);
  const dataB = useMemo(
    () => (compare ? sample(distB, paramsB) : null),
    [compare, distB, paramsB]
  );

  const isContinuous = dist.kind === "continuous";

  const mainSeries = useMemo<Series[]>(() => {
    const s: Series[] = [
      {
        points: dataA.main,
        color: COLOR_A,
        variant: isContinuous ? "line" : "stem",
      },
    ];
    if (dataB) {
      s.push({
        points: dataB.main,
        color: COLOR_B,
        variant: isContinuous ? "line" : "stem",
        dashed: true,
      });
    }
    return s;
  }, [dataA, dataB, isContinuous]);

  const cdfSeries = useMemo<Series[]>(() => {
    const s: Series[] = [
      {
        points: dataA.cdf,
        color: compare ? COLOR_A : COLOR_A_CDF,
        variant: isContinuous ? "line" : "step",
      },
    ];
    if (dataB) {
      s.push({
        points: dataB.cdf,
        color: COLOR_B,
        variant: isContinuous ? "line" : "step",
        dashed: true,
      });
    }
    return s;
  }, [dataA, dataB, compare, isContinuous]);

  const markers = useMemo<ChartMarker[]>(() => {
    if (!showMarkers) return [];
    const xs = [...dataA.main, ...(dataB?.main ?? [])].map((p) => p.x);
    const xSpan = Math.max(...xs) - Math.min(...xs) || 1;
    if (!compare) return markersFor(dist, params, xSpan, "", false);
    return [
      ...markersFor(dist, params, xSpan, "A ", false),
      ...markersFor(distB, paramsB, xSpan, "B ", true),
    ];
  }, [showMarkers, compare, dist, params, distB, paramsB, dataA, dataB]);

  const stats = useMemo(() => dist.stats(params), [dist, params]);
  const statsB = useMemo(
    () => (compare ? distB.stats(paramsB) : null),
    [compare, distB, paramsB]
  );

  const code = useMemo(
    () =>
      compare
        ? comparePython(dist, params, distB, paramsB)
        : singlePython(dist, params),
    [compare, dist, params, distB, paramsB]
  );

  const sameDist = distB.id === dist.id;
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
          {isContinuous ? "연속" : "이산"}
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

        {/* 파라미터 상단 컨트롤 — 비교 토글 · 마커 토글 */}
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={toggleCompare}
            aria-pressed={compare}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              compare
                ? "border-foreground bg-foreground text-white"
                : "border-border text-tertiary hover:border-foreground hover:text-foreground"
            }`}
          >
            <GitCompare size={14} aria-hidden /> 비교
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] text-tertiary">
            <input
              type="checkbox"
              checked={showMarkers}
              onChange={(e) => setShowMarkers(e.target.checked)}
              className="h-3.5 w-3.5 cursor-pointer accent-[var(--primary)]"
            />
            평균·중위수 표시
          </label>
          {compare ? (
            <span className="text-[12px] text-tertiary">
              B 분포·파라미터를 바꿔 A(실선) 위에 겹쳐 봅니다
            </span>
          ) : null}
        </div>

        {/* 파라미터 — 단일은 한 벌, 비교는 A/B 두 벌 */}
        {compare ? (
          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className="rounded border border-l-[3px] border-border px-3.5 py-3"
              style={{ borderLeftColor: COLOR_A }}
            >
              <div className="mb-2.5 flex flex-wrap items-baseline gap-x-2">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: COLOR_A }}
                >
                  A
                </span>
                <span className="text-[13px] font-medium text-foreground">
                  {dist.name}
                </span>
              </div>
              <ParamGrid d={dist} values={params} onChange={setParam} />
            </div>

            <div
              className="rounded border border-l-[3px] border-border px-3.5 py-3"
              style={{ borderLeftColor: COLOR_B }}
            >
              <div className="mb-2.5 flex flex-wrap items-center gap-x-2">
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: COLOR_B }}
                >
                  B
                </span>
                <select
                  value={distB.id}
                  onChange={(e) => changeDistB(e.target.value)}
                  aria-label="비교할 분포 선택"
                  className="rounded border border-border bg-white px-2 py-1 text-[13px] font-medium text-foreground focus-visible:border-foreground focus-visible:outline-none"
                >
                  {peers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <ParamGrid
                key={distB.id}
                d={distB}
                values={paramsB}
                onChange={setParamB}
              />
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <ParamGrid d={dist} values={params} onChange={setParam} />
          </div>
        )}

        {/* 범례 — 비교 모드에서만 */}
        {compare ? (
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
            <span className="inline-flex items-center gap-1.5">
              <LegendLine color={COLOR_A} />
              <span className="text-foreground">A · {dist.name}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LegendLine color={COLOR_B} dashed />
              <span className="text-foreground">B · {distB.name}</span>
            </span>
          </div>
        ) : null}

        {/* 그래프 */}
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DistChart
            series={mainSeries}
            title={isContinuous ? "확률밀도함수 (PDF)" : "확률질량함수 (PMF)"}
            markers={markers}
          />
          <DistChart
            series={cdfSeries}
            title="누적분포함수 (CDF)"
            yDomain={[0, 1]}
            markers={markers}
          />
        </div>

        {/* 수식 — 비교 중 서로 다른 분포면 A·B 각각 */}
        {compare && !sameDist ? (
          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <FormulaBlock d={dist} side="A" color={COLOR_A} />
            <FormulaBlock d={distB} side="B" color={COLOR_B} />
          </div>
        ) : (
          <div className="mb-5">
            <FormulaBlock d={dist} />
          </div>
        )}

        {/* 통계량 */}
        <div className="mb-4">
          <h4 className="mb-2 text-[12.5px] font-semibold text-foreground">
            통계량
          </h4>
          {compare && statsB ? (
            <CompareStatTable a={stats} b={statsB} shareTex={sameDist} />
          ) : (
            <StatTable stats={stats} />
          )}
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
          name={compare ? `${dist.name} vs ${distB.name}` : dist.name}
          en={compare ? `${dist.en} vs ${distB.en}` : dist.en}
          code={code}
          onClose={() => setShowCode(false)}
        />
      ) : null}
    </div>
  );
}
