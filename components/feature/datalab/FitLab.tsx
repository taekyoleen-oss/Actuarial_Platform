"use client";

/**
 * /datalab 4번째 탭 '모델 적합' 루트.
 * 흐름: 데이터 입력(스프레드 팝업, 형식 자동 감지+확인) → 좌 요약/우 empirical
 * PDF·CDF → (연도+값이면 빈도 블록) → 분포 선택(전체 선택/해제·적합불가 사유)
 * → 적합 실행(Pyodide scipy — 최초 1회 다운로드) → 결과 표(열 클릭 정렬·행
 * 선택=오버레이·QQ 팝업·파이썬 코드 팝업) → 몬테카를로 코드.
 */
import { useMemo, useState } from "react";
import { Code2, LineChart, Play, Table2 } from "lucide-react";
import {
  empiricalFromGroups,
  empiricalFromValues,
  frequencyFromYears,
  fmtNum,
  severityEligibility,
  FIT_KIND_LABEL,
  type EmpiricalCont,
  type FitData,
  type FreqEmpirical,
} from "@/lib/fitData";
import {
  runDistributionFit,
  type FitResultRow,
  type FitRunResult,
  type RunPhase,
} from "@/lib/pyFit";
import {
  frequencyFitCode,
  monteCarloCode,
  severityFitCode,
} from "@/lib/fitPython";
import {
  DistChart,
  type Series,
} from "@/components/feature/datalab/DistChart";
import { DataSheetDialog } from "@/components/feature/datalab/DataSheetDialog";
import { QqDialog } from "@/components/feature/datalab/QqDialog";
import { DistCodeDialog } from "@/components/feature/datalab/DistCodeDialog";

/* ─────────────────────── 분포 카탈로그(표시용) ─────────────────────── */

const SEV_DISTS: { id: string; name: string }[] = [
  { id: "normal", name: "정규" },
  { id: "lognormal", name: "로그정규" },
  { id: "exponential", name: "지수" },
  { id: "weibull", name: "와이블" },
  { id: "gamma", name: "감마" },
  { id: "beta", name: "베타" },
  { id: "pareto2", name: "파레토(2모수)" },
  { id: "pareto1", name: "파레토(1모수)" },
];

const FREQ_DISTS: { id: string; name: string }[] = [
  { id: "poisson", name: "포아송" },
  { id: "negbinom", name: "음이항" },
  { id: "binomial", name: "이항" },
];

const nameOf = (list: { id: string; name: string }[], id: string) =>
  list.find((d) => d.id === id)?.name ?? id;

const COLOR_EMP = "var(--primary)";
const COLOR_FIT = "var(--chip-rose-fg)";

/* ─────────────────────────── 정렬 ─────────────────────────── */

type SortKey = "aic" | "bic" | "logL" | "ksD" | "a2" | "chi2";

/** 열별 '좋음' 방향 — logL만 클수록 좋음(내림차순), 나머지 오름차순. */
const SORT_ASC: Record<SortKey, boolean> = {
  aic: true,
  bic: true,
  ksD: true,
  a2: true,
  chi2: true,
  logL: false,
};

function sortRows(rows: FitResultRow[], key: SortKey): FitResultRow[] {
  const asc = SORT_ASC[key];
  return [...rows].sort((a, b) => {
    const va = a.ok ? (a[key] as number | null) : null;
    const vb = b.ok ? (b[key] as number | null) : null;
    if (va === null || va === undefined) return 1;
    if (vb === null || vb === undefined) return -1;
    return asc ? va - vb : vb - va;
  });
}

/* ─────────────────────────── 샘플 데이터 ─────────────────────────── */

/** 결정적 PRG — 샘플 버튼용(로그정규 심도 + 포아송 빈도 흉내). */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleCells(): string[][] {
  const rnd = mulberry32(20260716);
  const normal = () => {
    const u = Math.max(rnd(), 1e-12);
    const v = rnd();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const rows: string[][] = [["연도", "보험금"]];
  for (let year = 2016; year <= 2025; year++) {
    // 연간 건수 ~ 대략 포아송(18)
    let n = 0;
    let acc = Math.exp(-18);
    let cum = acc;
    const u = rnd();
    while (cum < u && n < 60) {
      n++;
      acc *= 18 / n;
      cum += acc;
    }
    for (let i = 0; i < n; i++) {
      const x = Math.exp(7.2 + 0.85 * normal()); // 로그정규 심도
      rows.push([String(year), String(Math.round(x))]);
    }
  }
  return rows;
}

/* ─────────────────────────── 하위 UI 조각 ─────────────────────────── */

function SummaryCard({
  emp,
  data,
}: {
  emp: EmpiricalCont;
  data: FitData;
}) {
  const s = emp.summary;
  const rows: [string, string][] = [
    ["표본 수 n", s.n.toLocaleString()],
    ["평균", fmtNum(s.mean)],
    ["표준편차", fmtNum(s.sd)],
    ["변동계수 CV", fmtNum(s.cv)],
    ["왜도", fmtNum(s.skew)],
    ["최소 / 최대", `${fmtNum(s.min)} / ${fmtNum(s.max)}`],
    ["사분위 Q1·중위·Q3", `${fmtNum(s.q1)} · ${fmtNum(s.median)} · ${fmtNum(s.q3)}`],
  ];
  return (
    <div className="rounded-cover border border-border bg-white p-4 shadow-card">
      <h4 className="mb-2 text-[13px] font-semibold text-foreground">
        데이터 요약{s.approx ? " (구간 중간값 근사)" : ""}
      </h4>
      <dl className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className="text-[12.5px] text-tertiary">{k}</dt>
            <dd className="text-[12.5px] font-medium tabular-nums text-foreground">
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-border pt-2 text-[11.5px] leading-relaxed text-tertiary">
        형식: {FIT_KIND_LABEL[data.kind]}
        {data.valueLabel ? ` · 값 열 "${data.valueLabel}"` : ""}
      </p>
    </div>
  );
}

/** GoF 값 셀 */
function Cell({ v, digits = 2 }: { v: number | null | undefined; digits?: number }) {
  if (v === null || v === undefined || !Number.isFinite(v))
    return <span className="text-tertiary">—</span>;
  const a = Math.abs(v);
  return (
    <>{a >= 1e6 || (a > 0 && a < 1e-4) ? v.toExponential(2) : v.toFixed(digits)}</>
  );
}

function PhaseNote({ phase }: { phase: RunPhase | null }) {
  if (!phase) return null;
  const msg =
    phase === "boot"
      ? "파이썬 런타임(Pyodide) 로딩 중 — 최초 1회만 다운로드합니다…"
      : phase === "pkg"
        ? "scipy·numpy 패키지 로딩 중…"
        : "scipy로 적합 계산 중…";
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-tertiary">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-[var(--primary)]" />
      {msg}
    </span>
  );
}

/* ─────────────────────────── 결과 표 ─────────────────────────── */

function ResultsTable({
  title,
  rows,
  dists,
  isGrouped,
  selectedId,
  onSelect,
  onQq,
  onCode,
}: {
  title: string;
  rows: FitResultRow[];
  dists: { id: string; name: string }[];
  /** χ² 표시(그룹·빈도) 여부 — 아니면 KS·A² */
  isGrouped: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onQq: (row: FitResultRow) => void;
  onCode: (row: FitResultRow) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("aic");
  const sorted = useMemo(() => sortRows(rows, sortKey), [rows, sortKey]);

  const th = (key: SortKey, label: string) => (
    <th
      className={`cursor-pointer whitespace-nowrap px-2.5 py-1.5 text-right font-medium hover:text-foreground ${
        sortKey === key ? "text-foreground" : ""
      }`}
      onClick={() => setSortKey(key)}
      title={`${label} 기준 정렬`}
    >
      {label}
      {sortKey === key ? (SORT_ASC[key] ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div className="mb-6">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h4 className="text-[13.5px] font-semibold text-foreground">{title}</h4>
        <span className="text-[12px] text-tertiary">
          열 이름을 누르면 그 기준으로 순위 정렬 · 행을 누르면 위 그래프에 겹쳐
          표시
        </span>
      </div>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-surface text-tertiary">
              <th className="w-10 px-2.5 py-1.5 text-center font-medium">순위</th>
              <th className="px-2.5 py-1.5 text-left font-medium">분포</th>
              <th className="px-2.5 py-1.5 text-left font-medium">파라미터</th>
              {th("logL", "logL")}
              {th("aic", "AIC")}
              {th("bic", "BIC")}
              {isGrouped ? (
                <>
                  {th("chi2", "χ²")}
                  <th className="whitespace-nowrap px-2.5 py-1.5 text-right font-medium">
                    χ² p
                  </th>
                </>
              ) : (
                <>
                  {th("ksD", "KS D")}
                  <th className="whitespace-nowrap px-2.5 py-1.5 text-right font-medium">
                    KS p
                  </th>
                  {th("a2", "A²")}
                </>
              )}
              <th className="px-2.5 py-1.5 text-center font-medium">QQ</th>
              <th className="px-2.5 py-1.5 text-center font-medium">코드</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const active = r.ok && r.id === selectedId;
              return (
                <tr
                  key={r.id}
                  onClick={() => (r.ok ? onSelect(r.id) : undefined)}
                  className={`border-t border-border transition-colors ${
                    r.ok ? "cursor-pointer" : "opacity-55"
                  } ${active ? "bg-[color-mix(in_srgb,var(--chip-blue-bg)_55%,white)]" : "hover:bg-surface/60"}`}
                  aria-selected={active}
                >
                  <td className="px-2.5 py-1.5 text-center tabular-nums text-tertiary">
                    {r.ok ? i + 1 : "—"}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-1.5 font-medium text-foreground">
                    {nameOf(dists, r.id)}
                    {active ? (
                      <span className="ml-1.5 text-[10.5px] font-semibold text-[var(--primary)]">
                        표시 중
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2.5 py-1.5 text-tertiary">
                    {r.ok
                      ? r.params
                          ?.map((q) => `${q.name}=${fmtNum(q.value)}`)
                          .join(", ")
                      : `적합 실패: ${r.error ?? "알 수 없음"}`}
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums">
                    <Cell v={r.logL} />
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums">
                    <Cell v={r.aic} />
                  </td>
                  <td className="px-2.5 py-1.5 text-right tabular-nums">
                    <Cell v={r.bic} />
                  </td>
                  {isGrouped ? (
                    <>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <Cell v={r.chi2} />
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <Cell v={r.chi2P} digits={4} />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <Cell v={r.ksD} digits={4} />
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <Cell v={r.ksP} digits={4} />
                      </td>
                      <td className="px-2.5 py-1.5 text-right tabular-nums">
                        <Cell v={r.a2} />
                      </td>
                    </>
                  )}
                  <td className="px-2 py-1.5 text-center">
                    {r.ok && r.qq ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onQq(r);
                        }}
                        className="rounded border border-border px-2 py-0.5 text-[11.5px] text-tertiary hover:text-foreground"
                      >
                        QQ
                      </button>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {r.ok ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCode(r);
                        }}
                        className="rounded border border-border px-2 py-0.5 text-[11.5px] text-tertiary hover:text-foreground"
                      >
                        <Code2 size={12} className="inline" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── 루트 ─────────────────────────── */

export function FitLab() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cells, setCells] = useState<string[][] | null>(null);
  const [data, setData] = useState<FitData | null>(null);

  const [selSev, setSelSev] = useState<Set<string>>(
    () => new Set(SEV_DISTS.map((d) => d.id))
  );
  const [selFreq, setSelFreq] = useState<Set<string>>(
    () => new Set(FREQ_DISTS.map((d) => d.id))
  );

  const [phase, setPhase] = useState<RunPhase | null>(null);
  const [fitError, setFitError] = useState<string | null>(null);
  const [results, setResults] = useState<FitRunResult | null>(null);
  const [overlaySev, setOverlaySev] = useState<string | null>(null);
  const [overlayFreq, setOverlayFreq] = useState<string | null>(null);

  const [qqTarget, setQqTarget] = useState<{
    row: FitResultRow;
    group: "sev" | "freq";
  } | null>(null);
  const [codeDialog, setCodeDialog] = useState<{
    name: string;
    en: string;
    code: string;
  } | null>(null);

  /* empirical — 데이터 확정 시 JS로 즉시 계산 */
  const emp = useMemo<EmpiricalCont | null>(() => {
    if (!data) return null;
    return data.kind === "grouped"
      ? empiricalFromGroups(data.groups ?? [])
      : empiricalFromValues(data.values);
  }, [data]);

  const freqEmp = useMemo<FreqEmpirical | null>(() => {
    if (!data || data.kind !== "yearValue" || !data.years) return null;
    return frequencyFromYears(data.years);
  }, [data]);

  /* 오버레이 x그리드(적합 호출과 공유) */
  const grid = useMemo<number[]>(() => {
    if (!emp) return [];
    const [lo, hi] = emp.range;
    const n = 160;
    return Array.from({ length: n }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / n);
  }, [emp]);

  const kGrid = useMemo<number[]>(() => {
    if (!freqEmp) return [];
    return Array.from({ length: freqEmp.kMax + 3 }, (_, k) => k);
  }, [freqEmp]);

  const eligibility = useMemo(() => {
    if (!data) return new Map<string, { ok: boolean; reason?: string }>();
    return new Map(
      SEV_DISTS.map((d) => [d.id, severityEligibility(d.id, data)])
    );
  }, [data]);

  const confirmData = (d: FitData, c: string[][]) => {
    setData(d);
    setCells(c);
    setSheetOpen(false);
    setResults(null);
    setOverlaySev(null);
    setOverlayFreq(null);
    setFitError(null);
  };

  const runFit = async () => {
    if (!data || !emp || phase) return;
    const sevIds = SEV_DISTS.filter(
      (d) => selSev.has(d.id) && eligibility.get(d.id)?.ok
    ).map((d) => d.id);
    const freqIds = freqEmp
      ? FREQ_DISTS.filter((d) => selFreq.has(d.id)).map((d) => d.id)
      : [];
    if (sevIds.length === 0 && freqIds.length === 0) {
      setFitError("적합할 분포를 하나 이상 선택하세요.");
      return;
    }
    setFitError(null);
    setResults(null);
    try {
      const res = await runDistributionFit(
        {
          mode: data.kind === "grouped" ? "grouped" : "individual",
          values: data.kind === "grouped" ? undefined : data.values,
          groups:
            data.kind === "grouped"
              ? {
                  lo: (data.groups ?? []).map((g) => g.lo),
                  hi: (data.groups ?? []).map((g) => g.hi),
                  n: (data.groups ?? []).map((g) => g.count),
                }
              : undefined,
          grid,
          sevDists: sevIds,
          freq: freqEmp
            ? { counts: freqEmp.counts, dists: freqIds, kGrid }
            : null,
        },
        setPhase
      );
      setResults(res);
      // 기본 오버레이 = AIC 1위
      const bestSev = sortRows(res.severity.filter((r) => r.ok), "aic")[0];
      setOverlaySev(bestSev?.id ?? null);
      const bestFreq = sortRows(res.frequency.filter((r) => r.ok), "aic")[0];
      setOverlayFreq(bestFreq?.id ?? null);
    } catch (e) {
      setFitError(
        `적합 실행 오류: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setPhase(null);
    }
  };

  /* 차트 시리즈 — empirical + 선택 오버레이 */
  const sevRow = results?.severity.find((r) => r.id === overlaySev && r.ok);
  const freqRow = results?.frequency.find((r) => r.id === overlayFreq && r.ok);

  const pdfSeries = useMemo<Series[]>(() => {
    if (!emp) return [];
    const s: Series[] = [
      {
        variant: "bar",
        color: COLOR_EMP,
        points: emp.bars.map((b) => ({
          x: (b.x0 + b.x1) / 2,
          x0: b.x0,
          x1: b.x1,
          y: b.y,
        })),
      },
    ];
    if (sevRow?.pdfY) {
      s.push({
        variant: "line",
        color: COLOR_FIT,
        points: grid
          .map((x, i) => ({ x, y: sevRow.pdfY![i] }))
          .filter((p): p is { x: number; y: number } => Number.isFinite(p.y as number))
          .map((p) => ({ x: p.x, y: p.y as number })),
      });
    }
    return s;
  }, [emp, sevRow, grid]);

  const cdfSeries = useMemo<Series[]>(() => {
    if (!emp) return [];
    const s: Series[] = [
      { variant: "step", color: COLOR_EMP, points: emp.ecdf },
    ];
    if (sevRow?.cdfY) {
      s.push({
        variant: "line",
        color: COLOR_FIT,
        points: grid
          .map((x, i) => ({ x, y: sevRow.cdfY![i] }))
          .filter((p): p is { x: number; y: number } => Number.isFinite(p.y as number))
          .map((p) => ({ x: p.x, y: p.y as number })),
      });
    }
    return s;
  }, [emp, sevRow, grid]);

  const pmfSeries = useMemo<Series[]>(() => {
    if (!freqEmp) return [];
    const s: Series[] = [
      { variant: "stem", color: COLOR_EMP, points: freqEmp.pmf },
    ];
    if (freqRow?.pmfY) {
      s.push({
        variant: "stem",
        color: COLOR_FIT,
        dashed: true,
        points: kGrid
          .map((k, i) => ({ x: k, y: freqRow.pmfY![i] }))
          .filter((p): p is { x: number; y: number } => Number.isFinite(p.y as number))
          .map((p) => ({ x: p.x, y: p.y as number })),
      });
    }
    return s;
  }, [freqEmp, freqRow, kGrid]);

  /* 코드 팝업 헬퍼 */
  const openSevCode = (row: FitResultRow) => {
    if (!data) return;
    setCodeDialog({
      name: `${nameOf(SEV_DISTS, row.id)} 적합`,
      en: row.id,
      code: severityFitCode(row.id, nameOf(SEV_DISTS, row.id), data),
    });
  };
  const openFreqCode = (row: FitResultRow) => {
    if (!freqEmp) return;
    setCodeDialog({
      name: `${nameOf(FREQ_DISTS, row.id)} 빈도 적합`,
      en: row.id,
      code: frequencyFitCode(row.id, nameOf(FREQ_DISTS, row.id), freqEmp.counts),
    });
  };
  const openMcCode = () => {
    const sev = sevRow ?? sortRows(results?.severity.filter((r) => r.ok) ?? [], "aic")[0];
    if (!sev?.params) return;
    const freq = freqRow?.params ? freqRow : null;
    setCodeDialog({
      name: "몬테카를로 시뮬레이션",
      en: freq ? "compound model" : "severity sampling",
      code: monteCarloCode(
        { id: sev.id, name: nameOf(SEV_DISTS, sev.id), params: sev.params },
        freq?.params
          ? { id: freq.id, name: nameOf(FREQ_DISTS, freq.id), params: freq.params }
          : null
      ),
    });
  };

  /* 체크박스 그룹 */
  const distPicker = (
    title: string,
    dists: { id: string; name: string }[],
    sel: Set<string>,
    setSel: (s: Set<string>) => void,
    elig?: Map<string, { ok: boolean; reason?: string }>
  ) => (
    <div className="rounded border border-border bg-white px-3.5 py-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] font-semibold text-foreground">
          {title}
        </span>
        <button
          type="button"
          onClick={() =>
            setSel(new Set(dists.filter((d) => elig?.get(d.id)?.ok !== false).map((d) => d.id)))
          }
          className="rounded border border-border px-2 py-0.5 text-[11.5px] text-tertiary hover:text-foreground"
        >
          전체 선택
        </button>
        <button
          type="button"
          onClick={() => setSel(new Set())}
          className="rounded border border-border px-2 py-0.5 text-[11.5px] text-tertiary hover:text-foreground"
        >
          전체 해제
        </button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {dists.map((d) => {
          const e = elig?.get(d.id);
          const disabled = e ? !e.ok : false;
          return (
            <label
              key={d.id}
              className={`inline-flex items-center gap-1.5 text-[12.5px] ${
                disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"
              }`}
              title={disabled ? e?.reason : undefined}
            >
              <input
                type="checkbox"
                checked={sel.has(d.id) && !disabled}
                disabled={disabled}
                onChange={(ev) => {
                  const next = new Set(sel);
                  if (ev.target.checked) next.add(d.id);
                  else next.delete(d.id);
                  setSel(next);
                }}
                className="h-3.5 w-3.5 accent-[var(--primary)]"
              />
              <span className="text-foreground">{d.name}</span>
              {disabled ? (
                <span className="text-[11px] text-tertiary">({e?.reason})</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <section aria-label="모델 적합" className="mb-10">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[17px] font-semibold text-foreground">
          모델 적합 — 데이터로 분포 찾기
        </h2>
        <p className="text-[12.5px] text-tertiary">
          데이터를 붙여넣으면 empirical 분포를 그리고, scipy(브라우저 파이썬)로
          후보 분포를 적합해 AIC·BIC 등으로 비교합니다
        </p>
      </div>

      {/* 데이터 입력 헤더 */}
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center gap-1.5 rounded bg-foreground px-4 py-2 text-[13px] font-medium text-white"
        >
          <Table2 size={15} /> 데이터 입력
        </button>
        {!data ? (
          <button
            type="button"
            onClick={() => {
              setCells(sampleCells());
              setSheetOpen(true);
            }}
            className="rounded border border-border px-3 py-2 text-[12.5px] text-tertiary hover:text-foreground"
          >
            샘플 데이터로 체험
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--chip-blue-bg)_55%,white)] px-3 py-1 text-[12px] font-medium text-[var(--primary)]">
            {FIT_KIND_LABEL[data.kind]} ·{" "}
            {data.kind === "grouped"
              ? `${data.groups?.length}구간 ${data.groups?.reduce((a, g) => a + g.count, 0).toLocaleString()}건`
              : `${data.values.length.toLocaleString()}건`}
          </span>
        )}
      </div>

      {!data || !emp ? (
        <div className="rounded-cover border border-dashed border-border bg-white/60 px-6 py-14 text-center">
          <LineChart size={28} className="mx-auto mb-3 text-tertiary" aria-hidden />
          <p className="text-[13.5px] text-foreground">
            아직 데이터가 없습니다 — 위 버튼으로 데이터를 입력하세요.
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-tertiary">
            개별 값 1열, 연도+값 2열(빈도·심도 동시 분석), 최소·최대·건수
            3열(그룹)을 지원합니다. 형식은 자동으로 감지해 확인을 받습니다.
          </p>
        </div>
      ) : (
        <>
          {/* 좌 요약 / 우 empirical */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <SummaryCard emp={emp} data={data} />
            <div className="rounded-cover border border-border bg-white p-4 shadow-card">
              <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                <span className="font-semibold text-foreground">
                  Empirical 분포{data.valueLabel ? ` — ${data.valueLabel}` : ""}
                </span>
                <span className="inline-flex items-center gap-1.5 text-tertiary">
                  <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[var(--primary)] opacity-40" />
                  empirical
                </span>
                {sevRow ? (
                  <span className="inline-flex items-center gap-1.5 text-tertiary">
                    <span className="inline-block h-0.5 w-4 bg-[var(--chip-rose-fg)]" />
                    적합: {nameOf(SEV_DISTS, sevRow.id)}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DistChart
                  series={pdfSeries}
                  title="확률분포 (밀도)"
                  xLabel={data.valueLabel}
                />
                <DistChart
                  series={cdfSeries}
                  title="누적확률분포"
                  yDomain={[0, 1]}
                  xLabel={data.valueLabel}
                />
              </div>
            </div>
          </div>

          {/* 빈도 블록(연도+값) */}
          {freqEmp ? (
            <div className="mb-6 rounded-cover border border-border bg-white p-4 shadow-card">
              <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                <span className="font-semibold text-foreground">
                  빈도 — 연도별 사고건수
                </span>
                <span className="text-tertiary">
                  {freqEmp.years.length}개 연도 · 연평균 {fmtNum(freqEmp.mean)}건
                  · 분산 {fmtNum(freqEmp.variance)}
                  {freqEmp.variance > freqEmp.mean
                    ? " (분산>평균 — 과산포, 음이항 후보)"
                    : ""}
                  {freqEmp.zeroFilled > 0
                    ? ` · 무사고 연도 ${freqEmp.zeroFilled}개는 0건으로 처리`
                    : ""}
                </span>
                {freqRow ? (
                  <span className="inline-flex items-center gap-1.5 text-tertiary">
                    <span className="inline-block h-0.5 w-4 bg-[var(--chip-rose-fg)]" />
                    적합: {nameOf(FREQ_DISTS, freqRow.id)}
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1.4fr]">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="bg-surface text-tertiary">
                        <th className="px-2 py-1 text-left font-medium">연도</th>
                        <th className="px-2 py-1 text-right font-medium">건수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {freqEmp.years.map((r) => (
                        <tr key={r.year} className="border-t border-border">
                          <td className="px-2 py-1 tabular-nums text-foreground">
                            {r.year}
                          </td>
                          <td className="px-2 py-1 text-right tabular-nums text-foreground">
                            {r.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <DistChart
                  series={pmfSeries}
                  title="연간 건수 분포 P(N=k)"
                  xLabel="연간 건수 k"
                />
              </div>
            </div>
          ) : null}

          {/* 분포 선택 + 적합 실행 */}
          <div className="mb-6 space-y-3">
            {distPicker(
              "적합할 심도(연속형) 분포",
              SEV_DISTS,
              selSev,
              setSelSev,
              eligibility
            )}
            {freqEmp
              ? distPicker("적합할 빈도(이산형) 분포", FREQ_DISTS, selFreq, setSelFreq)
              : null}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={runFit}
                disabled={phase !== null}
                className="inline-flex items-center gap-1.5 rounded bg-[var(--primary)] px-5 py-2 text-[13.5px] font-medium text-white disabled:opacity-50"
              >
                <Play size={15} /> 적합 실행
              </button>
              <PhaseNote phase={phase} />
              {fitError ? (
                <span className="text-[12.5px] text-[var(--chip-rose-fg)]">
                  {fitError}
                </span>
              ) : null}
            </div>
          </div>

          {/* 결과 */}
          {results ? (
            <>
              <ResultsTable
                title="심도 적합 결과"
                rows={results.severity}
                dists={SEV_DISTS}
                isGrouped={data.kind === "grouped"}
                selectedId={overlaySev}
                onSelect={(id) =>
                  setOverlaySev((cur) => (cur === id ? null : id))
                }
                onQq={(row) => setQqTarget({ row, group: "sev" })}
                onCode={openSevCode}
              />
              {results.frequency.length > 0 ? (
                <ResultsTable
                  title="빈도 적합 결과"
                  rows={results.frequency}
                  dists={FREQ_DISTS}
                  isGrouped
                  selectedId={overlayFreq}
                  onSelect={(id) =>
                    setOverlayFreq((cur) => (cur === id ? null : id))
                  }
                  onQq={(row) => setQqTarget({ row, group: "freq" })}
                  onCode={openFreqCode}
                />
              ) : null}

              <p className="mb-5 text-[11.5px] leading-relaxed text-tertiary">
                ※ KS·χ² p값은 파라미터를 같은 데이터에서 추정했으므로 근사값입니다
                (실제보다 관대). AIC·BIC는 작을수록, logL은 클수록 좋습니다. A²는
                꼬리 적합에 민감한 Anderson-Darling 통계량입니다.
              </p>

              {/* 몬테카를로 */}
              <div className="rounded-cover border border-border bg-[color-mix(in_srgb,var(--chip-blue-bg)_35%,white)] px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-[13.5px] font-semibold text-foreground">
                      몬테카를로 시뮬레이션으로 이어가기
                    </h4>
                    <p className="mt-0.5 text-[12.5px] text-tertiary">
                      {freqEmp
                        ? "적합된 빈도·심도로 연간 총손해 S=X₁+…+X_N을 시뮬레이션하는 코드(VaR·TVaR 포함) — 선택된 분포가 반영됩니다."
                        : "적합된 심도분포에서 표본을 추출해 분위수를 계산하는 코드 — 선택된 분포가 반영됩니다."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openMcCode}
                    className="inline-flex items-center gap-1.5 rounded border border-border bg-white px-3.5 py-1.5 text-[12.5px] font-medium text-tertiary hover:text-foreground"
                  >
                    <Code2 size={14} /> 코드 보기
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* 팝업들 */}
      {sheetOpen ? (
        <DataSheetDialog
          initialCells={cells}
          onConfirm={confirmData}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
      {qqTarget?.row.qq ? (
        <QqDialog
          name={nameOf(
            qqTarget.group === "sev" ? SEV_DISTS : FREQ_DISTS,
            qqTarget.row.id
          )}
          params={qqTarget.row.params ?? []}
          qq={qqTarget.row.qq}
          onClose={() => setQqTarget(null)}
        />
      ) : null}
      {codeDialog ? (
        <DistCodeDialog
          name={codeDialog.name}
          en={codeDialog.en}
          code={codeDialog.code}
          onClose={() => setCodeDialog(null)}
        />
      ) : null}
    </section>
  );
}
