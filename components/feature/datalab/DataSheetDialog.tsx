"use client";

/**
 * 모델 적합 — 데이터 입력 스프레드 팝업.
 * ① 시트 단계: 붙여넣기 가능한 그리드(엑셀 TSV 자동 분해·행 자동 확장·셀 편집·
 *    행 추가·모두 지우기). ② 확인 단계: 형식 자동 감지 결과(근거 포함)를
 *    보여 주고 사용자가 확인/변경 후 확정한다(사용자 결정: 자동 감지+확인).
 * 모달 관례: Escape·오버레이·뒤로가기 닫힘, 스크롤락.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardPaste, Plus, Trash2, X } from "lucide-react";
import {
  buildFitData,
  detectFormat,
  splitClipboard,
  FIT_KIND_LABEL,
  type DetectResult,
  type FitData,
  type FitKind,
} from "@/lib/fitData";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";

const COLS = 3;
const INITIAL_ROWS = 12;

const emptyRows = (n: number): string[][] =>
  Array.from({ length: n }, () => Array<string>(COLS).fill(""));

export function DataSheetDialog({
  initialCells,
  onConfirm,
  onClose,
}: {
  /** 다시 열 때 기존 입력 복원 */
  initialCells?: string[][] | null;
  onConfirm: (data: FitData, cells: string[][]) => void;
  onClose: () => void;
}) {
  const [cells, setCells] = useState<string[][]>(() =>
    initialCells && initialCells.length > 0
      ? initialCells.map((r) => Array.from({ length: COLS }, (_, i) => r[i] ?? ""))
      : emptyRows(INITIAL_ROWS)
  );
  const [error, setError] = useState<string | null>(null);
  // 확인 단계 상태 — null이면 시트 단계
  const [det, setDet] = useState<DetectResult | null>(null);
  const [kind, setKind] = useState<FitKind>("individual");
  const gridRef = useRef<HTMLDivElement>(null);

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

  const setCell = (r: number, c: number, v: string) =>
    setCells((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = v;
      return next;
    });

  /** 붙여넣기 — 포커스된 셀(없으면 첫 셀)을 앵커로 TSV를 펼친다. */
  const handlePaste = (e: React.ClipboardEvent, r0 = 0, c0 = 0) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text || (!text.includes("\n") && !text.includes("\t"))) return; // 단일 값은 기본 동작
    e.preventDefault();
    const parsed = splitClipboard(text);
    setCells((prev) => {
      const needRows = r0 + parsed.length;
      const next = prev.map((row) => [...row]);
      while (next.length < needRows) next.push(Array<string>(COLS).fill(""));
      parsed.forEach((row, i) => {
        row.slice(0, COLS - c0).forEach((v, j) => {
          next[r0 + i][c0 + j] = v.trim();
        });
      });
      return next;
    });
    setError(null);
  };

  const usedRows = useMemo(
    () => cells.filter((r) => r.some((c) => c.trim() !== "")).length,
    [cells]
  );

  const runDetect = () => {
    try {
      const d = detectFormat(cells);
      setDet(d);
      setKind(d.kind);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const confirm = () => {
    if (!det) return;
    try {
      const data = buildFitData(det, kind);
      onConfirm(data, cells);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDet(null); // 형식 오류 → 시트로 복귀해 수정
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="데이터 입력"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:max-h-[86vh] sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-foreground">
              데이터 입력
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-tertiary">
              엑셀에서 복사한 데이터를 그리드에 붙여넣으세요(첫 행 이름 허용).
              1열=개별 값 · 2열=연도+값(빈도·심도) · 3열=최소·최대·건수(그룹).
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

        {det === null ? (
          <>
            {/* ── 시트 단계 ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div
                ref={gridRef}
                className="overflow-x-auto rounded border border-border"
                onPaste={(e) => {
                  // 포커스 셀 좌표를 data 속성에서 읽어 앵커로 사용
                  const t = e.target as HTMLElement;
                  const r = Number(t.dataset?.row ?? 0);
                  const c = Number(t.dataset?.col ?? 0);
                  handlePaste(e, Number.isFinite(r) ? r : 0, Number.isFinite(c) ? c : 0);
                }}
              >
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-surface text-tertiary">
                      <th className="w-10 border-b border-r border-border px-2 py-1.5 text-center font-medium">
                        #
                      </th>
                      {["1열", "2열", "3열"].map((h) => (
                        <th
                          key={h}
                          className="border-b border-r border-border px-2 py-1.5 text-left font-medium last:border-r-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cells.map((row, r) => (
                      <tr key={r}>
                        <td className="border-b border-r border-border bg-surface/60 px-2 py-0 text-center tabular-nums text-[11.5px] text-tertiary">
                          {r + 1}
                        </td>
                        {row.map((v, c) => (
                          <td
                            key={c}
                            className="border-b border-r border-border p-0 last:border-r-0"
                          >
                            <input
                              type="text"
                              value={v}
                              data-row={r}
                              data-col={c}
                              onChange={(e) => setCell(r, c, e.target.value)}
                              className="w-full min-w-[90px] bg-transparent px-2 py-1.5 text-foreground focus-visible:bg-[color-mix(in_srgb,var(--chip-blue-bg)_45%,white)] focus-visible:outline-none"
                              aria-label={`${r + 1}행 ${c + 1}열`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCells((prev) => [...prev, ...emptyRows(10)])}
                  className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[12.5px] text-tertiary hover:text-foreground"
                >
                  <Plus size={13} /> 행 10개 추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCells(emptyRows(INITIAL_ROWS));
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[12.5px] text-tertiary hover:text-foreground"
                >
                  <Trash2 size={13} /> 모두 지우기
                </button>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-tertiary">
                  <ClipboardPaste size={13} /> 입력 {usedRows}행
                </span>
              </div>

              {error ? (
                <p className="mt-3 rounded border border-[var(--chip-rose-fg)]/30 bg-[var(--chip-rose-bg)] px-3 py-2 text-[12.5px] text-[var(--chip-rose-fg)]">
                  {error}
                </p>
              ) : null}
            </div>

            <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-border px-4 py-1.5 text-[13px] text-tertiary hover:text-foreground"
              >
                취소
              </button>
              <button
                type="button"
                onClick={runDetect}
                disabled={usedRows < 2}
                className="rounded bg-foreground px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-40"
              >
                확인
              </button>
            </footer>
          </>
        ) : (
          <>
            {/* ── 확인 단계: 감지 결과 확인/변경 ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="rounded border border-border bg-surface/50 px-4 py-3.5">
                <p className="text-[13px] text-foreground">
                  감지된 형식:{" "}
                  <strong className="font-semibold">{FIT_KIND_LABEL[det.kind]}</strong>
                </p>
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[12.5px] text-tertiary">
                  {det.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                  <li>
                    데이터 {det.rows.length}행
                    {det.headers ? " (헤더 1행 제외)" : ""}
                  </li>
                </ul>
                {det.warnings.length > 0 ? (
                  <ul className="mt-2 space-y-0.5 text-[12.5px] text-[var(--chip-amber-fg)]">
                    {det.warnings.map((w) => (
                      <li key={w}>⚠ {w}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <label className="mt-4 block text-[12.5px] font-medium text-foreground">
                이 형식으로 처리합니다 — 다르면 변경하세요
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as FitKind)}
                  className="mt-1.5 block w-full rounded border border-border bg-white px-3 py-2 text-[13px] text-foreground focus-visible:border-foreground focus-visible:outline-none"
                >
                  {(Object.keys(FIT_KIND_LABEL) as FitKind[]).map((k) => (
                    <option key={k} value={k}>
                      {FIT_KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-[12px] leading-relaxed text-tertiary">
                연도+데이터값은 빈도(연도별 건수)와 심도(값)를 함께 적합하고,
                개별·그룹 데이터는 연속형(심도) 분포만 적합합니다.
              </p>

              {error ? (
                <p className="mt-3 rounded border border-[var(--chip-rose-fg)]/30 bg-[var(--chip-rose-bg)] px-3 py-2 text-[12.5px] text-[var(--chip-rose-fg)]">
                  {error}
                </p>
              ) : null}
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-border px-5 py-3">
              <button
                type="button"
                onClick={() => setDet(null)}
                className="rounded border border-border px-4 py-1.5 text-[13px] text-tertiary hover:text-foreground"
              >
                ← 데이터 수정
              </button>
              <button
                type="button"
                onClick={confirm}
                className="rounded bg-foreground px-4 py-1.5 text-[13px] font-medium text-white"
              >
                이 형식으로 확정
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
