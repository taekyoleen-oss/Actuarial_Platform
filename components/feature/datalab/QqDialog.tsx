"use client";

/**
 * 모델 적합 — QQ-plot 팝업. 이론 분위수(가로) vs 경험 분위수(세로) 산점도와
 * 45° 기준선. 점이 기준선에 가까울수록 적합이 좋다(꼬리 이탈에 주목).
 * 모달 관례: Escape·오버레이·뒤로가기 닫힘, 스크롤락.
 */
import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { fmtNum } from "@/lib/fitData";
import type { FitParamOut } from "@/lib/pyFit";
import { fmtTick } from "@/components/feature/datalab/DistChart";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";

const S = 340; // 정사각 viewBox
const PAD = 40;

/** 45° 기준선 QQ 산점도 — 모델 적합(데이터 vs 적합)과 확률분포 탭(분포 vs 분포) 공용. */
export function QqChart({
  theo,
  samp,
  xLabel = "이론 분위수 (fitted)",
  yLabel = "경험 분위수 (data)",
}: {
  theo: number[];
  samp: number[];
  xLabel?: string;
  yLabel?: string;
}) {
  const g = useMemo(() => {
    const all = [...theo, ...samp].filter((v) => Number.isFinite(v));
    if (all.length === 0) return null;
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    const pad = (hi - lo || 1) * 0.05;
    lo -= pad;
    hi += pad;
    const span = hi - lo || 1;
    const sc = (v: number) => PAD + ((v - lo) / span) * (S - PAD - 14);
    return { lo, hi, sc };
  }, [theo, samp]);

  if (!g) return null;
  const { lo, hi, sc } = g;
  // y는 위가 큰 값 — 화면 좌표 반전
  const sy = (v: number) => S - 26 - (sc(v) - PAD);

  const ticks = [lo, (lo + hi) / 2, hi];

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width="100%"
      role="img"
      aria-label="QQ-plot"
      className="mx-auto block max-w-[420px]"
    >
      {/* 축 */}
      <line x1={PAD} y1={S - 26} x2={S - 14} y2={S - 26} stroke="var(--border)" strokeWidth={0.8} />
      <line x1={PAD} y1={14} x2={PAD} y2={S - 26} stroke="var(--border)" strokeWidth={0.8} />
      {/* 45° 기준선 */}
      <line
        x1={sc(lo)}
        y1={sy(lo)}
        x2={sc(hi)}
        y2={sy(hi)}
        stroke="var(--chip-slate-fg)"
        strokeWidth={1}
        strokeDasharray="5 4"
      />
      {/* 점 */}
      {theo.map((t, i) => (
        <circle
          key={i}
          cx={sc(t)}
          cy={sy(samp[i])}
          r={2.6}
          fill="var(--primary)"
          fillOpacity={0.75}
        />
      ))}
      {/* 눈금 */}
      {ticks.map((t, i) => (
        <g key={i}>
          <text
            x={sc(t)}
            y={S - 10}
            textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
            className="fill-[var(--text-tertiary)]"
            style={{ fontSize: 9.5 }}
          >
            {fmtTick(t)}
          </text>
          <text
            x={PAD - 5}
            y={sy(t) + 3}
            textAnchor="end"
            className="fill-[var(--text-tertiary)]"
            style={{ fontSize: 9.5 }}
          >
            {fmtTick(t)}
          </text>
        </g>
      ))}
      {/* 축 라벨 */}
      <text
        x={(PAD + S - 14) / 2}
        y={S - 0.5}
        textAnchor="middle"
        className="fill-[var(--text-tertiary)]"
        style={{ fontSize: 10 }}
      >
        {xLabel}
      </text>
      <text
        x={10}
        y={(14 + S - 26) / 2}
        textAnchor="middle"
        transform={`rotate(-90 10 ${(14 + S - 26) / 2})`}
        className="fill-[var(--text-tertiary)]"
        style={{ fontSize: 10 }}
      >
        {yLabel}
      </text>
    </svg>
  );
}

export function QqDialog({
  name,
  params,
  qq,
  note,
  onClose,
}: {
  name: string;
  params: FitParamOut[];
  qq: { theo: number[]; samp: number[] };
  /** 추가 캡션 — 예: 면책·한도 반영 조건부 분위수·검열 n건 제외 */
  note?: string;
  onClose: () => void;
}) {
  useHistoryDismiss(true, onClose);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} QQ-plot`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-foreground">
              QQ-plot — {name}
            </h2>
            <p className="mt-1 text-[12.5px] text-tertiary">
              {params.map((q) => `${q.name}=${fmtNum(q.value)}`).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 text-tertiary hover:text-foreground"
          >
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4">
          <QqChart theo={qq.theo} samp={qq.samp} />
          {note ? (
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-[var(--chip-amber-fg)]">
              {note}
            </p>
          ) : null}
          <p className="mt-2 text-[12px] leading-relaxed text-tertiary">
            점이 점선(45°)에 가까울수록 적합이 좋습니다. 오른쪽 위(큰 손해
            구간)에서 점이 선 위로 벗어나면 실제 꼬리가 모형보다 두껍다는
            신호입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
