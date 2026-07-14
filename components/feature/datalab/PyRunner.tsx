"use client";

/**
 * 파이썬 실행기 — /datalab '분석 방법 사전' 하단. 주피터처럼 셀(단락) 단위 실행.
 * Pyodide(WebAssembly)로 브라우저 안에서 바로 실행: 서버 전송 없음, 최초 1회만
 * 런타임 다운로드(이후 캐시), 패키지는 import를 보고 자동 로딩(가볍게 동작).
 * - 셀 실행: 변수·데이터프레임이 셀 사이에 유지 — 앞 셀의 결과를 보고 다음 셀 진행
 *   (Shift+Enter = 현재 셀 실행). 사전 코드는 블록 제목(# ── ──) 기준 자동 분할.
 * - 드롭다운: 34개 분석 방법 코드 로드(+ 예제와 파일명이 맞는 샘플 데이터 생성기)
 * - 데이터: CSV·XLSX 업로드 → 가상 파일시스템에 기록, 코드에서 파일명 그대로 읽음
 * - 폴더 저장/불러오기(File System Access API, Chrome·Edge): analysis.py(셀은
 *   "# %%" 구분자로 이어붙인 실행 가능한 스크립트) + workspace.json + 데이터
 *   파일을 PC의 지정 폴더에 저장하고, 로드 시 코드와 데이터를 함께 복원한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  STAT_CATEGORIES,
  STAT_METHODS,
  methodFullCode,
} from "@/lib/statMethods";
import {
  getPyodide,
  isDataFileName,
  isPyodideRequested,
  listFsDataFiles,
  runPythonCode,
  writeDataFile,
  type RunPhase,
} from "@/lib/pyRunner";

const DATA_ACCEPT = ".csv,.xlsx,.xls,.txt,.json";

/* ───────────── File System Access API 최소 타입(비표준 — Chrome·Edge) ───────────── */

interface FsWritable {
  write(data: Blob | string): Promise<void>;
  close(): Promise<void>;
}
interface FsFileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FsWritable>;
}
interface FsDirHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterableIterator<FsFileHandle | FsDirHandle>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FsFileHandle>;
}
type DirPicker = (opts?: { mode?: "read" | "readwrite" }) => Promise<FsDirHandle>;

function dirPicker(): DirPicker | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { showDirectoryPicker?: DirPicker };
  return w.showDirectoryPicker ?? null;
}

async function writeToDir(
  dir: FsDirHandle,
  name: string,
  data: Blob | string
): Promise<void> {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(data);
  await w.close();
}

/* ───────────────────── 샘플 데이터 생성 코드(드롭다운 첫 항목) ───────────────────── */

const SAMPLE_ID = "__sample__";
const SAMPLE_LABEL = "샘플 보험 데이터 생성 — claims.xlsx · policy.xlsx";
const SAMPLE_CODE = `# ── 샘플 보험 데이터 생성 ──
# 사전의 예제 코드가 참조하는 claims.xlsx / policy.xlsx 를 즉석에서 만들어
# 가상 파일시스템에 저장합니다. 변수 df(=policy)·claims·policy 도 준비됩니다.
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
n = 600

policy = pd.DataFrame({
    "policy_id": [f"P{i:05d}" for i in range(1, n + 1)],
    "customer_id": [f"C{c:05d}" for c in rng.integers(1, 400, n)],
    "product": rng.choice(["종신", "정기", "암보험", "건강"], n, p=[0.35, 0.25, 0.2, 0.2]),
    "channel": rng.choice(["설계사", "방카", "다이렉트"], n, p=[0.5, 0.3, 0.2]),
    "region": rng.choice(["서울", "경기", "부산", "기타"], n),
    "sex": rng.choice(["M", "F"], n),
    "age": rng.integers(20, 75, n),
    "premium": rng.gamma(3.0, 30000, n).round(-2),
    "bmi": rng.normal(23.5, 3.2, n).round(1),
    "dependents": rng.integers(0, 4, n),
    "income": np.where(rng.random(n) < 0.12, np.nan, rng.gamma(4.0, 120000, n)).round(-3),
    "tenure_months": rng.integers(1, 240, n),
    "n_contracts": rng.integers(1, 5, n),
    "lapsed": rng.random(n) < 0.18,
})
policy["age_band"] = pd.cut(policy["age"], [0, 30, 40, 50, 60, 120],
                            labels=["20대", "30대", "40대", "50대", "60+"], right=False)
policy["premium_ratio"] = (policy["premium"] /
                           policy["income"].fillna(policy["income"].median())).round(3)

claims = policy[["policy_id", "product", "channel", "sex", "age", "age_band", "region"]].copy()
claims["claim_amt"] = rng.lognormal(13.2, 0.9, n).round(-3)
claims["claim_cnt"] = rng.poisson(0.8, n)
claims["prem_before"] = policy["premium"]
claims["prem_after"] = (policy["premium"] * rng.normal(1.05, 0.08, n)).round(-2)

claims.to_excel("claims.xlsx", index=False)
policy.to_excel("policy.xlsx", index=False)
df = policy   # 예제들이 쓰는 기본 이름

print(f"생성 완료: claims.xlsx / policy.xlsx (각 {n}행) — 변수 df·claims·policy 준비")
print(policy.head())`;

/* ───────────────────────────── 셀 분할·직렬화 ───────────────────────────── */

/** 주석·빈 줄뿐인 청크인지 — 헤더 코멘트만 있는 첫 청크는 다음 셀에 합친다 */
function isCommentOnly(chunk: string): boolean {
  return chunk
    .split("\n")
    .every((ln) => ln.trim() === "" || ln.trim().startsWith("#"));
}

/**
 * 코드 → 셀 목록. 우선순위: ① "# %%" 명시 구분자(주피터·VSCode 관례)
 * ② 사전 코드의 블록 제목(# ── 제목 ──) ③ 통짜 한 셀.
 */
function splitIntoCells(code: string): string[] {
  const text = code.replace(/\r\n/g, "\n").trim();
  if (!text) return [""];

  if (/^# ?%%/m.test(text)) {
    const parts = text
      .split(/^# ?%%.*$/m)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : [text];
  }

  const marker = /^# ── .+ ──$/;
  if (text.split("\n").some((ln) => marker.test(ln))) {
    const cells: string[] = [];
    let cur: string[] = [];
    for (const ln of text.split("\n")) {
      if (marker.test(ln) && cur.length > 0) {
        cells.push(cur.join("\n").trim());
        cur = [ln];
      } else {
        cur.push(ln);
      }
    }
    if (cur.length > 0) cells.push(cur.join("\n").trim());
    const nonEmpty = cells.filter(Boolean);
    // 첫 청크가 헤더 주석뿐이면(# ═══ 제목 ═══) 다음 셀 앞에 붙인다
    if (nonEmpty.length > 1 && isCommentOnly(nonEmpty[0])) {
      nonEmpty[1] = `${nonEmpty[0]}\n${nonEmpty[1]}`;
      nonEmpty.shift();
    }
    return nonEmpty.length > 0 ? nonEmpty : [text];
  }

  return [text];
}

/** 셀 → analysis.py 직렬화 — "# %%" 구분자라 그대로도 실행 가능한 스크립트 */
function joinCells(codes: string[]): string {
  return codes
    .map((c) => c.trim())
    .filter(Boolean)
    .join("\n\n# %%\n");
}

/* ───────────────────────────────── 컴포넌트 ───────────────────────────────── */

export interface RunnerLoadRequest {
  code: string;
  label: string;
  seq: number;
}

type CellStatus = "idle" | "running" | "done" | "error";

interface Cell {
  id: number;
  code: string;
  output: string;
  images: string[];
  status: CellStatus;
  ms?: number;
  phase?: RunPhase;
}

const PHASE_LABEL: Record<RunPhase, string> = {
  boot: "파이썬 런타임 내려받는 중… (최초 1회, 수십 MB)",
  pkg: "필요 패키지 로딩 중…",
  run: "실행 중…",
};

const CELL_BTN =
  "inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-0.5 text-[11.5px] font-medium text-tertiary hover:text-foreground disabled:opacity-40";

function autoSize(el: HTMLTextAreaElement): void {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight + 2, 460)}px`;
}

export default function PyRunner({
  loadRequest,
}: {
  loadRequest: RunnerLoadRequest | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dataBytes = useRef<Map<string, Uint8Array>>(new Map());
  const nextId = useRef(1);
  const busyRef = useRef(false);

  const newCell = useCallback(
    (code: string): Cell => ({
      id: nextId.current++,
      code,
      output: "",
      images: [],
      status: "idle",
    }),
    []
  );

  const [open, setOpen] = useState(false);
  const [cells, setCells] = useState<Cell[]>(() => [
    {
      id: 0,
      code: "",
      output: "",
      images: [],
      status: "idle",
    },
  ]);
  const cellsRef = useRef<Cell[]>(cells);
  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);

  const [loadedLabel, setLoadedLabel] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [dataFiles, setDataFiles] = useState<{ name: string; size: number }[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [fsSupported, setFsSupported] = useState(false);

  useEffect(() => {
    setFsSupported(dirPicker() !== null);
  }, []);

  const setCellsFromCode = useCallback(
    (code: string, label: string | null) => {
      setCells(splitIntoCells(code).map((c) => newCell(c)));
      setLoadedLabel(label);
    },
    [newCell]
  );

  // 팝업 "실행기로 보내기" — 셀 분할 주입 + 패널 열고 스크롤
  useEffect(() => {
    if (!loadRequest) return;
    setOpen(true);
    setCellsFromCode(loadRequest.code, loadRequest.label);
    setSelectedId("");
    requestAnimationFrame(() =>
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }, [loadRequest, setCellsFromCode]);

  const loadById = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (!id) return;
      if (id === SAMPLE_ID) {
        setCellsFromCode(SAMPLE_CODE, SAMPLE_LABEL);
        return;
      }
      const m = STAT_METHODS.find((x) => x.id === id);
      if (!m) return;
      setCellsFromCode(
        `# ═══ ${m.name} (${m.en}) ═══\n${methodFullCode(m)}`,
        `${m.name} (${m.en})`
      );
    },
    [setCellsFromCode]
  );

  const addDataFiles = useCallback(
    async (files: FileList | { name: string; bytes: Uint8Array }[]) => {
      const items: { name: string; bytes: Uint8Array }[] = [];
      if (files instanceof FileList) {
        for (const f of Array.from(files)) {
          items.push({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
        }
      } else {
        items.push(...files);
      }
      for (const it of items) dataBytes.current.set(it.name, it.bytes);
      setDataFiles(
        Array.from(dataBytes.current.entries()).map(([name, b]) => ({
          name,
          size: b.length,
        }))
      );
      if (isPyodideRequested()) {
        const py = await getPyodide();
        for (const [name, bytes] of dataBytes.current) writeDataFile(py, name, bytes);
      }
    },
    []
  );

  const patchCell = useCallback((id: number, patch: Partial<Cell>) => {
    setCells((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  /** 셀 하나 실행 — 성공 여부 반환(전체 실행에서 오류 시 중단용) */
  const runCell = useCallback(
    async (id: number): Promise<boolean> => {
      if (busyRef.current) return false;
      const cell = cellsRef.current.find((c) => c.id === id);
      if (!cell || !cell.code.trim()) return true;
      busyRef.current = true;
      setBusy(true);
      patchCell(id, { output: "", images: [], status: "running", phase: "boot" });
      try {
        const py = await getPyodide();
        // 업로드·복원 데이터를 실행 직전에 가상 FS에 반영(멱등)
        for (const [name, bytes] of dataBytes.current) writeDataFile(py, name, bytes);

        const { images, elapsedMs } = await runPythonCode(
          cell.code,
          (s) =>
            setCells((prev) =>
              prev.map((c) => (c.id === id ? { ...c, output: c.output + s } : c))
            ),
          (phase) => patchCell(id, { phase })
        );
        patchCell(id, { status: "done", ms: elapsedMs, images, phase: undefined });
        return true;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setCells((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  output: `${c.output}${c.output ? "\n" : ""}${msg}`,
                  status: "error",
                  phase: undefined,
                }
              : c
          )
        );
        return false;
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [patchCell]
  );

  /** 전체 실행 — 위에서부터 순서대로, 오류 셀에서 중단 */
  const runAll = useCallback(async () => {
    if (busyRef.current) return;
    for (const c of [...cellsRef.current]) {
      if (!c.code.trim()) continue;
      const ok = await runCell(c.id);
      if (!ok) break;
    }
  }, [runCell]);

  /** 세션 변수 초기화 — 사용자 정의 변수만 제거(데이터 파일·런타임은 유지) */
  const resetVars = useCallback(async () => {
    if (busyRef.current) return;
    if (!isPyodideRequested()) {
      setNotice("아직 실행한 적이 없어 초기화할 변수가 없습니다.");
      return;
    }
    const py = await getPyodide();
    await py.runPythonAsync(
      [
        "for _k in [k for k in list(globals().keys()) if not k.startswith('__')]:",
        "    del globals()[_k]",
      ].join("\n")
    );
    setNotice("세션 변수를 초기화했습니다 — 데이터 파일은 유지됩니다.");
  }, []);

  const clearOutputs = useCallback(() => {
    setCells((prev) =>
      prev.map((c) => ({ ...c, output: "", images: [], status: "idle", ms: undefined }))
    );
  }, []);

  const addCellBelow = useCallback(
    (id: number) => {
      setCells((prev) => {
        const i = prev.findIndex((c) => c.id === id);
        const next = [...prev];
        next.splice(i + 1, 0, newCell(""));
        return next;
      });
    },
    [newCell]
  );

  const removeCell = useCallback(
    (id: number) => {
      setCells((prev) => {
        const next = prev.filter((c) => c.id !== id);
        return next.length > 0 ? next : [newCell("")];
      });
    },
    [newCell]
  );

  /** 폴더에 저장 — analysis.py(# %% 셀 구분) + workspace.json + 데이터 파일 일체 */
  const saveToFolder = useCallback(async () => {
    const picker = dirPicker();
    if (!picker) return;
    try {
      const dir = await picker({ mode: "readwrite" });
      const merged = new Map(dataBytes.current);
      if (isPyodideRequested()) {
        const py = await getPyodide();
        for (const f of listFsDataFiles(py)) merged.set(f.name, f.bytes);
      }
      await writeToDir(dir, "analysis.py", joinCells(cellsRef.current.map((c) => c.code)));
      await writeToDir(
        dir,
        "workspace.json",
        JSON.stringify(
          {
            app: "ai4insurance-datalab-py",
            savedAt: new Date().toISOString(),
            label: loadedLabel,
            cellCount: cellsRef.current.filter((c) => c.code.trim()).length,
            dataFiles: Array.from(merged.keys()),
          },
          null,
          2
        )
      );
      for (const [name, bytes] of merged) {
        await writeToDir(dir, name, new Blob([bytes as BlobPart]));
      }
      setNotice(`저장 완료 — ${dir.name}/ (analysis.py + 데이터 ${merged.size}개)`);
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return; // 사용자 취소
      console.error("[datalab] 폴더 저장 실패:", e);
      setNotice("폴더 저장에 실패했습니다.");
    }
  }, [loadedLabel]);

  /** 폴더에서 불러오기 — 코드(셀 복원)와 데이터를 함께 복원 */
  const loadFromFolder = useCallback(async () => {
    const picker = dirPicker();
    if (!picker) return;
    try {
      const dir = await picker({ mode: "read" });
      let nextCode: string | null = null;
      let label: string | null = null;
      const restored: { name: string; bytes: Uint8Array }[] = [];
      for await (const entry of dir.values()) {
        if (entry.kind !== "file") continue;
        if (entry.name === "analysis.py") {
          nextCode = await (await entry.getFile()).text();
        } else if (entry.name === "workspace.json") {
          try {
            const meta = JSON.parse(await (await entry.getFile()).text()) as {
              label?: string | null;
            };
            label = meta.label ?? null;
          } catch {
            // 메타 손상은 무시 — 코드·데이터만 복원
          }
        } else if (isDataFileName(entry.name)) {
          restored.push({
            name: entry.name,
            bytes: new Uint8Array(await (await entry.getFile()).arrayBuffer()),
          });
        }
      }
      if (nextCode !== null) {
        setCellsFromCode(nextCode, label ?? `${dir.name}/analysis.py`);
        setSelectedId("");
      }
      if (restored.length > 0) await addDataFiles(restored);
      setNotice(
        nextCode === null && restored.length === 0
          ? "폴더에서 analysis.py·데이터 파일을 찾지 못했습니다."
          : `불러오기 완료 — 코드${nextCode !== null ? " 1개" : " 없음"} · 데이터 ${restored.length}개`
      );
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return;
      console.error("[datalab] 폴더 불러오기 실패:", e);
      setNotice("폴더 불러오기에 실패했습니다.");
    }
  }, [addDataFiles, setCellsFromCode]);

  const cellStatusText = (c: Cell): string | null => {
    if (c.status === "running") return c.phase ? PHASE_LABEL[c.phase] : "실행 중…";
    if (c.status === "done" && c.ms != null)
      return `완료 (${(c.ms / 1000).toFixed(c.ms < 10000 ? 1 : 0)}초)`;
    if (c.status === "error") return "오류 — 트레이스백 확인";
    return null;
  };

  return (
    <div ref={rootRef} className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-semibold text-foreground">
            파이썬 실행기
          </h3>
          <p className="mt-0.5 text-[12.5px] text-tertiary">
            사전의 코드를 브라우저 안에서 셀(단락) 단위로 실행합니다 —
            변수가 셀 사이에 유지되고, 데이터는 PC를 벗어나지 않습니다.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={open ? "secondary" : "primary"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "접기" : "실행기 열기"}
        </Button>
      </div>

      {open ? (
        <div className="mt-4">
          {/* 툴바 — 코드 로드 · 데이터 · 폴더 저장/불러오기 */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedId}
              onChange={(e) => loadById(e.target.value)}
              aria-label="분석 코드 불러오기"
              className="h-9 max-w-full rounded border border-border bg-white px-2 text-[13px] text-foreground"
            >
              <option value="">분석 코드 불러오기…</option>
              <option value={SAMPLE_ID}>{SAMPLE_LABEL}</option>
              {STAT_CATEGORIES.map((cat) => (
                <optgroup key={cat.id} label={cat.label}>
                  {STAT_METHODS.filter((m) => m.category === cat.id).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.en})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <label className="inline-flex h-9 cursor-pointer items-center rounded border border-border bg-white px-3 text-[13px] font-medium text-body hover:text-foreground">
              데이터 업로드 (CSV·XLSX)
              <input
                type="file"
                multiple
                accept={DATA_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) void addDataFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>

            {fsSupported ? (
              <>
                <button
                  type="button"
                  onClick={() => void saveToFolder()}
                  className="inline-flex h-9 items-center rounded border border-border bg-white px-3 text-[13px] font-medium text-body hover:text-foreground"
                >
                  폴더에 저장
                </button>
                <button
                  type="button"
                  onClick={() => void loadFromFolder()}
                  className="inline-flex h-9 items-center rounded border border-border bg-white px-3 text-[13px] font-medium text-body hover:text-foreground"
                >
                  폴더에서 불러오기
                </button>
              </>
            ) : (
              <span className="text-[12px] text-tertiary">
                폴더 저장·불러오기는 Chrome·Edge에서 지원됩니다.
              </span>
            )}
          </div>

          {(dataFiles.length > 0 || notice) && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
              {dataFiles.map((f) => (
                <span
                  key={f.name}
                  className="inline-flex items-center rounded-full bg-surface px-2.5 py-0.5 font-mono text-[11.5px] text-body"
                  title={`${(f.size / 1024).toFixed(1)} KB — 코드에서 "${f.name}" 그대로 읽기`}
                >
                  {f.name}
                </span>
              ))}
              {notice ? <span className="text-tertiary">{notice}</span> : null}
            </div>
          )}

          {/* 실행 컨트롤 */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => void runAll()} disabled={busy}>
              {busy ? "실행 중…" : "▶▶ 전체 실행"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={clearOutputs}
              disabled={busy}
            >
              출력 지우기
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void resetVars()}
              disabled={busy}
            >
              변수 초기화
            </Button>
            {loadedLabel ? (
              <span className="text-[12.5px] text-tertiary">
                불러온 코드:{" "}
                <span className="font-medium text-body">{loadedLabel}</span>
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-[12px] text-tertiary">
            셀마다 <strong>▶ 실행</strong>(또는 셀 안에서 Shift+Enter) — 앞 셀에서
            만든 변수·데이터프레임을 다음 셀에서 그대로 쓸 수 있습니다.
          </p>

          {/* 셀 목록 */}
          {cells.map((c, i) => (
            <div key={c.id} className="mt-3 rounded border border-border bg-white">
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-2.5 py-1.5">
                <span className="w-9 text-[11px] font-medium text-tertiary">
                  [{i + 1}]
                </span>
                <button
                  type="button"
                  onClick={() => void runCell(c.id)}
                  disabled={busy}
                  className={`${CELL_BTN} text-primary`}
                >
                  ▶ 실행
                </button>
                <span
                  className={`text-[11.5px] ${
                    c.status === "error" ? "text-[#c4302b]" : "text-tertiary"
                  }`}
                  role="status"
                >
                  {cellStatusText(c)}
                </span>
                <span className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => addCellBelow(c.id)}
                    className={CELL_BTN}
                    title="아래에 새 셀 추가"
                  >
                    + 셀
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCell(c.id)}
                    disabled={busy}
                    className={CELL_BTN}
                    title="이 셀 삭제"
                  >
                    ✕
                  </button>
                </span>
              </div>
              <textarea
                value={c.code}
                onChange={(e) => {
                  patchCell(c.id, { code: e.target.value });
                  autoSize(e.currentTarget);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.shiftKey) {
                    e.preventDefault();
                    void runCell(c.id);
                    return;
                  }
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const { selectionStart: s, selectionEnd: en, value } = el;
                    patchCell(c.id, {
                      code: `${value.slice(0, s)}    ${value.slice(en)}`,
                    });
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = s + 4;
                    });
                  }
                }}
                ref={(el) => {
                  if (el) autoSize(el);
                }}
                spellCheck={false}
                placeholder={
                  i === 0
                    ? '위 드롭다운에서 분석 코드를 불러오거나 직접 입력하세요.\n예: print("hello", 1 + 1)'
                    : undefined
                }
                aria-label={`파이썬 코드 셀 ${i + 1}`}
                className="block min-h-[76px] w-full resize-none rounded-b border-0 bg-transparent p-3 font-mono text-[12.5px] leading-[1.7] text-foreground focus-visible:outline-none"
              />
              {c.output ? (
                <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap border-t border-border bg-surface p-3 font-mono text-[12px] leading-[1.65] text-foreground">
                  {c.output}
                </pre>
              ) : null}
              {c.images.map((b64, j) => (
                // 실행 결과 그림 — 데이터 URI라 next/image 대상 아님
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={j}
                  src={`data:image/png;base64,${b64}`}
                  alt={`셀 ${i + 1} 그래프 출력 ${j + 1}`}
                  className="mx-3 my-3 max-w-[calc(100%-24px)] rounded border border-border bg-white"
                />
              ))}
            </div>
          ))}

          <button
            type="button"
            onClick={() => addCellBelow(cells[cells.length - 1].id)}
            className="mt-3 w-full rounded border border-dashed border-border py-1.5 text-[12px] text-tertiary hover:text-foreground"
          >
            + 셀 추가
          </button>

          <ul className="mt-4 list-disc space-y-1 pl-5 text-[12px] leading-relaxed text-tertiary">
            <li>
              실행은 전부 브라우저 안(Pyodide·WebAssembly)에서 이루어집니다 —
              코드·데이터가 서버로 전송되지 않습니다.
            </li>
            <li>
              첫 실행 시 파이썬 런타임과 패키지(수십 MB)를 내려받아 시간이
              걸리고, 이후에는 캐시로 빠르게 실행됩니다.
            </li>
            <li>
              변수는 셀 사이에 유지됩니다(주피터와 동일). 처음부터 다시 하려면{" "}
              <strong>변수 초기화</strong>를 누르세요. 붙여넣은 코드는{" "}
              <strong># %%</strong> 줄 또는 사전 코드의 블록 제목 기준으로 셀이
              나뉩니다.
            </li>
            <li>
              numpy · pandas · scipy · statsmodels · scikit-learn · matplotlib
              지원. lifelines·xgboost·lightgbm 등 일부 패키지는 브라우저에서
              실행되지 않습니다.
            </li>
            <li>
              업로드하거나 샘플로 생성한 데이터는 코드에서 파일명 그대로
              읽습니다 — 예: pd.read_excel(&quot;claims.xlsx&quot;). 먼저{" "}
              <strong>샘플 보험 데이터 생성</strong>을 한 번 실행하면 사전의
              예제 대부분을 그대로 돌려볼 수 있습니다.
            </li>
            <li>
              <strong>폴더에 저장</strong>은 analysis.py(셀을 # %% 구분자로 이은
              실행 가능한 스크립트) + workspace.json + 데이터 파일을 PC의 선택한
              폴더에 저장하고, <strong>폴더에서 불러오기</strong>는 셀 구성과
              데이터를 함께 복원합니다.
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
