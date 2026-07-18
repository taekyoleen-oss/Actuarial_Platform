"use client";

/**
 * 모델 적합 — 꼬리 진단 팝업(심도 데이터 전용). 정렬된 표본만으로 JS에서 계산해
 * (Pyodide 불필요) 꼬리 두께를 3가지 그림으로 보여 준다:
 *  ① 평균초과 e(u) — 우상향 직선이면 파레토성(두꺼운 꼬리)
 *  ② log-log 생존함수 — 직선이면 멱법칙(power-law) 꼬리
 *  ③ Hill plot — 상위 k개로 추정한 꼬리지수 α̂, 안정 구간의 값이 α 추정치
 * 모달 관례: Escape·오버레이·뒤로가기 닫힘, 스크롤락(다른 팝업과 동일).
 */
import { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { tailDiagnostics } from "@/lib/fitData";
import {
  DistChart,
  type Series,
} from "@/components/feature/datalab/DistChart";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";

const LINE = "var(--primary)";

function Panel({
  title,
  desc,
  series,
  xLabel,
  yDomain,
}: {
  title: string;
  desc: string;
  series: Series[];
  xLabel?: string;
  yDomain?: [number, number];
}) {
  return (
    <div className="rounded-cover border border-border bg-white p-3.5">
      <DistChart series={series} title={title} xLabel={xLabel} yDomain={yDomain} />
      <p className="mt-2 text-[11.5px] leading-relaxed text-tertiary">{desc}</p>
    </div>
  );
}

export function TailDiagnosticsDialog({
  values,
  valueLabel,
  onClose,
}: {
  values: number[];
  valueLabel?: string;
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

  const diag = useMemo(() => tailDiagnostics(values), [values]);

  const meSeries = useMemo<Series[]>(
    () =>
      diag
        ? [{ variant: "line", dots: true, color: LINE, points: diag.meanExcess }]
        : [],
    [diag]
  );
  const llSeries = useMemo<Series[]>(
    () =>
      diag
        ? [{ variant: "line", dots: true, color: LINE, points: diag.logLogSurvival }]
        : [],
    [diag]
  );
  const hillSeries = useMemo<Series[]>(
    () =>
      diag
        ? [{ variant: "line", dots: true, color: LINE, points: diag.hill }]
        : [],
    [diag]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="꼬리 진단"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-foreground">
              꼬리 진단 — 두꺼운 꼬리 여부 살펴보기
            </h2>
            <p className="mt-1 text-[12.5px] text-tertiary">
              적합 전에 데이터의 꼬리가 얼마나 두꺼운지(대형 손해 위험) 세 그림으로
              가늠합니다. 파레토·GPD 같은 두꺼운 꼬리 후보 선택에 참고하세요.
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
          {!diag ? (
            <p className="py-10 text-center text-[13px] text-tertiary">
              꼬리 진단에는 표본이 8개 이상 필요합니다.
            </p>
          ) : (
            <div className="space-y-4">
              <Panel
                title="① 평균초과 e(u) = E[X−u | X>u]"
                xLabel={valueLabel ? `임계값 u (${valueLabel})` : "임계값 u"}
                series={meSeries}
                desc="임계값 u를 넘는 손해들이 평균적으로 u를 얼마나 초과하는지. 오른쪽으로 갈수록 우상향(증가)하면 두꺼운 꼬리(파레토·GPD ξ>0)의 신호이고, 평평하면 지수분포(무기억성), 우하향하면 얇은 꼬리를 시사합니다."
              />
              {diag.positiveOnly ? (
                <>
                  <Panel
                    title="② log-log 생존함수 (log x vs −log S)"
                    xLabel="log(값)"
                    series={llSeries}
                    desc="생존확률 S=P(X>x)를 로그-로그 축에 그린 것. 오른쪽 꼬리 구간이 직선(일정 기울기)에 가까우면 멱법칙(power-law) 꼬리 — 기울기가 꼬리지수 α에 대응합니다. 위로 급히 꺾여 내려가면 꼬리가 그보다 얇습니다."
                  />
                  <Panel
                    title="③ Hill plot — 꼬리지수 α̂ vs 상위 k개"
                    xLabel="상위 순서통계 개수 k"
                    series={hillSeries}
                    desc="상위 k개 극단값으로 추정한 꼬리지수 α̂=1/H_k. k가 작으면 분산이 크고, k가 크면 본체가 섞여 편향됩니다 — 중간에 값이 평평하게 안정되는 구간이 있으면 그 높이가 α 추정치입니다. α가 작을수록(≈1~2) 꼬리가 두껍습니다(α≤2면 분산 무한, α≤1이면 평균 무한)."
                  />
                </>
              ) : (
                <p className="rounded border border-dashed border-border bg-surface/60 px-4 py-3 text-[12px] leading-relaxed text-tertiary">
                  log-log 생존함수·Hill plot은 양수 데이터에서만 정의됩니다(로그 사용).
                  현재 데이터에 0 이하 값이 있어 평균초과 그림만 표시합니다.
                </p>
              )}
              <p className="text-[11.5px] leading-relaxed text-tertiary">
                ※ 세 그림 모두 표본 기반 진단이라 우측 끝(극단 소수 표본)은 노이즈가
                큽니다 — 전반적 경향으로 판단하세요. 두꺼운 꼬리로 보이면 아래 분포
                후보에서 파레토(2모수)·파레토(1모수)·GPD를 함께 적합해 비교해 보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
