"use client";

/**
 * 확률분포 탭 — 분포 QQ-plot 팝업. 데이터가 없는 이론 탐색 탭이므로 기준은
 *  - 단일 모드: 평균·표준편차를 맞춘 정규분포(모멘트 미정의 시 중위수·IQR 정합)
 *  - 비교 모드: A 분위수(가로) vs B 분위수(세로)
 * 차트는 모델 적합 탭과 같은 QqChart(45° 기준선)를 재사용한다.
 * 모달 관례: Escape·오버레이·뒤로가기 닫힘, 스크롤락.
 */
import { useEffect } from "react";
import { X } from "lucide-react";
import { QqChart } from "@/components/feature/datalab/QqDialog";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";

export function DistQqDialog({
  title,
  subtitle,
  theo,
  samp,
  xLabel,
  yLabel,
  notes,
  onClose,
}: {
  title: string;
  subtitle: string;
  theo: number[];
  samp: number[];
  xLabel: string;
  yLabel: string;
  /** 해석 안내(불릿) */
  notes: string[];
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
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-[12.5px] text-tertiary">{subtitle}</p>
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
          {theo.length > 1 ? (
            <QqChart theo={theo} samp={samp} xLabel={xLabel} yLabel={yLabel} />
          ) : (
            <p className="py-10 text-center text-[12.5px] text-tertiary">
              분위수를 계산할 수 없습니다.
            </p>
          )}
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-tertiary">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
