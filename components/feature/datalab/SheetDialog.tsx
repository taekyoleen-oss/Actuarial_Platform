"use client";

/**
 * 실행기 스프레드시트 팝업 — 두 가지로 쓰인다.
 * ① 직접 입력(view 없음): 엑셀에서 복사한 표를 그리드에 붙여넣고 이름을 지정해
 *    CSV 파일로 만든다(가상 파일시스템에 저장 → 로드 셀 자동 생성).
 * ② 미리보기(view 있음): 이미 로드된 데이터 파일(CSV·TXT·JSON·XLSX)을 표로 보여
 *    작업 전에 레이아웃·열 이름·값 형태를 확인한다(읽기 전용).
 * 모달 관례: Escape·오버레이·뒤로가기 닫힘, 스크롤락.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  decodeSmart,
  detectTextEncoding,
  parseDelimited,
  rowsFromText,
  toCsv,
  trimGrid,
} from "@/lib/sheetCsv";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";

const INIT_ROWS = 10;
const INIT_COLS = 6;
/** 미리보기 렌더 상한 — 표가 커도 브라우저가 버티도록 앞부분만 그린다 */
const VIEW_LIMIT = 300;

const emptyGrid = (rows: number, cols: number): string[][] =>
  Array.from({ length: rows }, () => Array<string>(cols).fill(""));

/** xlsx → 표. exceljs는 무거워 미리보기를 열 때만 동적으로 가져온다. */
async function rowsFromXlsx(bytes: Uint8Array): Promise<string[][]> {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes.slice().buffer as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return [];
  const out: string[][] = [];
  ws.eachRow({ includeEmpty: true }, (row) => {
    const vals: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value;
      vals.push(
        v === null || v === undefined
          ? ""
          : v instanceof Date
            ? v.toISOString().slice(0, 10)
            : typeof v === "object"
              ? String((v as { text?: string; result?: unknown }).text ??
                  (v as { result?: unknown }).result ??
                  "")
              : String(v)
      );
    });
    out.push(vals);
  });
  const width = out.reduce((m, r) => Math.max(m, r.length), 0);
  return out.map((r) => [...r, ...Array(Math.max(0, width - r.length)).fill("")]);
}

export function SheetDialog({
  view,
  onSave,
  onClose,
}: {
  /** 미리보기 대상 — 없으면 직접 입력 모드 */
  view?: { name: string; bytes: Uint8Array } | null;
  /** 직접 입력 확정 — CSV 텍스트를 파일로 만든다 */
  onSave?: (name: string, csv: string) => void;
  onClose: () => void;
}) {
  const isView = !!view;
  const [cells, setCells] = useState<string[][]>(() => emptyGrid(INIT_ROWS, INIT_COLS));
  const [fileName, setFileName] = useState("data.csv");
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<"loading" | "ready" | "error">(
    isView ? "loading" : "ready"
  );
  const nameRef = useRef<HTMLInputElement>(null);

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

  // 미리보기 — 파일 형식에 맞춰 표로 읽는다
  useEffect(() => {
    if (!view) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = /\.xlsx?$/i.test(view.name)
          ? await rowsFromXlsx(view.bytes)
          : rowsFromText(view.name, decodeSmart(view.bytes));
        if (cancelled) return;
        setCells(rows);
        setViewState("ready");
      } catch (e) {
        if (cancelled) return;
        console.error("[datalab] 데이터 미리보기 실패:", e);
        setViewState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view]);

  const setCell = (r: number, c: number, v: string) =>
    setCells((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = v;
      return next;
    });

  /** 붙여넣기 — 포커스된 셀을 앵커로 엑셀 표(TSV·CSV)를 펼치고 부족한 행·열은 늘린다 */
  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text || (!text.includes("\n") && !text.includes("\t"))) return; // 단일 값은 기본 동작
    e.preventDefault();
    const t = e.target as HTMLElement;
    const r0 = Number(t.dataset?.row ?? 0) || 0;
    const c0 = Number(t.dataset?.col ?? 0) || 0;
    const parsed = parseDelimited(text);
    setCells((prev) => {
      const cols = Math.max(prev[0]?.length ?? 0, c0 + (parsed[0]?.length ?? 0));
      const next = prev.map((row) => [
        ...row,
        ...Array(Math.max(0, cols - row.length)).fill(""),
      ]);
      while (next.length < r0 + parsed.length) next.push(Array<string>(cols).fill(""));
      parsed.forEach((row, i) =>
        row.forEach((v, j) => {
          next[r0 + i][c0 + j] = v;
        })
      );
      return next;
    });
    setError(null);
  };

  const usedRows = useMemo(
    () => cells.filter((r) => r.some((c) => (c ?? "").trim() !== "")).length,
    [cells]
  );

  const save = useCallback(() => {
    const grid = trimGrid(cells);
    if (grid.length < 2) {
      setError("표에 값이 없습니다 — 엑셀에서 복사해 붙여넣으세요(첫 행 = 열 이름).");
      return;
    }
    let name = fileName.trim().replace(/[\\/:*?"<>|]/g, "_") || "data.csv";
    if (!/\.csv$/i.test(name)) name = `${name.replace(/\.[^.]*$/, "")}.csv`;
    onSave?.(name, toCsv(grid));
  }, [cells, fileName, onSave]);

  const shown = isView ? cells.slice(0, VIEW_LIMIT) : cells;
  const encNote = view ? detectTextEncoding(view.bytes) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={isView ? "데이터 미리보기" : "데이터 직접 입력"}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:max-h-[88vh] sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold text-foreground">
              {isView ? `데이터 미리보기 — ${view!.name}` : "데이터 직접 입력"}
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-tertiary">
              {isView ? (
                <>
                  작업 전에 열 이름·자료형·값의 형태를 확인하세요. 첫 행이 열 이름으로
                  읽힙니다(pandas 기본).
                  {encNote === "cp949" ? " 이 파일은 CP949(한글 Windows)로 읽습니다." : ""}
                </>
              ) : (
                <>
                  엑셀에서 복사한 표를 그리드에 붙여넣고(Ctrl+V) 이름을 지정하면 CSV
                  파일로 만들어 바로 분석에 사용합니다. 첫 행은 열 이름입니다.
                </>
              )}
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

        <div className="flex-1 overflow-auto px-5 py-4">
          {viewState === "loading" ? (
            <p className="py-10 text-center text-[13px] text-tertiary">표로 읽는 중…</p>
          ) : viewState === "error" ? (
            <p className="py-10 text-center text-[13px] text-tertiary">
              이 파일은 표로 미리 보여 줄 수 없습니다 — 실행기에서 pandas로 읽어 확인하세요.
            </p>
          ) : (
            <div
              className="overflow-auto rounded border border-border"
              onPaste={isView ? undefined : handlePaste}
            >
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-surface text-tertiary">
                    <th className="sticky left-0 z-10 w-10 border-b border-r border-border bg-surface px-2 py-1.5 text-center font-medium">
                      #
                    </th>
                    {(shown[0] ?? []).map((h, c) => (
                      <th
                        key={c}
                        className="whitespace-nowrap border-b border-r border-border px-2 py-1.5 text-left font-medium last:border-r-0"
                      >
                        {isView ? h || `열 ${c + 1}` : `${c + 1}열`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(isView ? shown.slice(1) : shown).map((row, r) => (
                    <tr key={r}>
                      <td className="sticky left-0 z-10 border-b border-r border-border bg-surface/60 px-2 py-0 text-center text-[11.5px] tabular-nums text-tertiary">
                        {r + 1}
                      </td>
                      {row.map((v, c) => (
                        <td
                          key={c}
                          className="border-b border-r border-border p-0 last:border-r-0"
                        >
                          {isView ? (
                            <span className="block max-w-[280px] truncate px-2 py-1.5 text-foreground">
                              {v}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={v}
                              data-row={r}
                              data-col={c}
                              onChange={(e) => setCell(r, c, e.target.value)}
                              className="w-full min-w-[110px] bg-transparent px-2 py-1.5 text-foreground focus-visible:bg-[color-mix(in_srgb,var(--chip-blue-bg)_45%,white)] focus-visible:outline-none"
                              aria-label={`${r + 1}행 ${c + 1}열`}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isView ? (
            viewState === "ready" ? (
              <p className="mt-2 text-[12px] text-tertiary">
                행 {Math.max(0, cells.length - 1)} · 열 {cells[0]?.length ?? 0}
                {cells.length > VIEW_LIMIT
                  ? ` — 앞 ${VIEW_LIMIT - 1}행만 표시합니다`
                  : ""}
              </p>
            ) : null
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCells((prev) => [
                    ...prev,
                    ...emptyGrid(10, prev[0]?.length ?? INIT_COLS),
                  ])
                }
                className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[12.5px] text-tertiary hover:text-foreground"
              >
                <Plus size={13} /> 행 10개 추가
              </button>
              <button
                type="button"
                onClick={() => setCells((prev) => prev.map((r) => [...r, ""]))}
                className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[12.5px] text-tertiary hover:text-foreground"
              >
                <Plus size={13} /> 열 추가
              </button>
              <button
                type="button"
                onClick={() => {
                  setCells(emptyGrid(INIT_ROWS, INIT_COLS));
                  setError(null);
                }}
                className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-[12.5px] text-tertiary hover:text-foreground"
              >
                <Trash2 size={13} /> 모두 지우기
              </button>
              <span className="ml-auto text-[12px] text-tertiary">입력 {usedRows}행</span>
            </div>
          )}

          {error ? (
            <p className="mt-3 rounded border border-[var(--chip-rose-fg)]/30 bg-[var(--chip-rose-bg)] px-3 py-2 text-[12.5px] text-[var(--chip-rose-fg)]">
              {error}
            </p>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">
          {isView ? null : (
            <label className="mr-auto flex items-center gap-2 text-[12.5px] text-tertiary">
              파일 이름
              <input
                ref={nameRef}
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                }}
                className="h-8 w-44 rounded border border-border bg-white px-2 font-mono text-[12.5px] text-foreground focus-visible:border-foreground focus-visible:outline-none"
                aria-label="CSV 파일 이름"
              />
            </label>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-4 py-1.5 text-[13px] text-tertiary hover:text-foreground"
          >
            {isView ? "닫기" : "취소"}
          </button>
          {isView ? null : (
            <button
              type="button"
              onClick={save}
              className="rounded bg-foreground px-4 py-1.5 text-[13px] font-medium text-white"
            >
              CSV로 저장하고 사용
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
