"use client";

/**
 * 파이썬 실행기 — /datalab '분석 방법 사전' 하단.
 * Pyodide(WebAssembly)로 브라우저 안에서 바로 실행: 서버 전송 없음, 최초 1회만
 * 런타임 다운로드(이후 캐시), 패키지는 import를 보고 자동 로딩(가볍게 동작).
 * - 드롭다운: 34개 분석 방법 코드 로드(+ 예제와 파일명이 맞는 샘플 데이터 생성기)
 * - 데이터: CSV·XLSX 업로드 → 가상 파일시스템에 기록, 코드에서 파일명 그대로 읽음
 * - 폴더 저장/불러오기(File System Access API, Chrome·Edge): analysis.py +
 *   workspace.json + 데이터 파일을 PC의 지정 폴더에 저장하고, 로드 시 코드와
 *   데이터를 함께 복원한다.
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

/* ───────────────────────────────── 컴포넌트 ───────────────────────────────── */

export interface RunnerLoadRequest {
  code: string;
  label: string;
  seq: number;
}

type Status =
  | { kind: "idle" }
  | { kind: "phase"; phase: RunPhase }
  | { kind: "done"; ms: number }
  | { kind: "error" };

const PHASE_LABEL: Record<RunPhase, string> = {
  boot: "파이썬 런타임 내려받는 중… (최초 1회, 수십 MB)",
  pkg: "필요 패키지 로딩 중…",
  run: "실행 중…",
};

export default function PyRunner({
  loadRequest,
}: {
  loadRequest: RunnerLoadRequest | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dataBytes = useRef<Map<string, Uint8Array>>(new Map());

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loadedLabel, setLoadedLabel] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [output, setOutput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [dataFiles, setDataFiles] = useState<{ name: string; size: number }[]>([]);
  const [folderMsg, setFolderMsg] = useState<string | null>(null);
  const [fsSupported, setFsSupported] = useState(false);

  useEffect(() => {
    setFsSupported(dirPicker() !== null);
  }, []);

  // 팝업 "실행기로 보내기" — 코드 주입 + 패널 열고 스크롤
  useEffect(() => {
    if (!loadRequest) return;
    setOpen(true);
    setCode(loadRequest.code);
    setLoadedLabel(loadRequest.label);
    setSelectedId("");
    requestAnimationFrame(() =>
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }, [loadRequest]);

  const loadById = useCallback((id: string) => {
    setSelectedId(id);
    if (!id) return;
    if (id === SAMPLE_ID) {
      setCode(SAMPLE_CODE);
      setLoadedLabel(SAMPLE_LABEL);
      return;
    }
    const m = STAT_METHODS.find((x) => x.id === id);
    if (!m) return;
    setCode(`# ═══ ${m.name} (${m.en}) ═══\n${methodFullCode(m)}`);
    setLoadedLabel(`${m.name} (${m.en})`);
  }, []);

  /** 업로드·복원된 데이터 파일을 (로드돼 있으면) 가상 FS에 반영 */
  const syncDataToFs = useCallback(async () => {
    if (!isPyodideRequested()) return;
    const py = await getPyodide();
    for (const [name, bytes] of dataBytes.current) writeDataFile(py, name, bytes);
  }, []);

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
      await syncDataToFs();
    },
    [syncDataToFs]
  );

  const busy = status.kind === "phase";

  const run = useCallback(async () => {
    if (busy || !code.trim()) return;
    setOutput("");
    setImages([]);
    try {
      // 업로드 데이터를 실행 직전에 FS에 반영(런타임 최초 로드 포함)
      setStatus({ kind: "phase", phase: "boot" });
      const py = await getPyodide();
      for (const [name, bytes] of dataBytes.current) writeDataFile(py, name, bytes);

      const { images: figs, elapsedMs } = await runPythonCode(
        code,
        (s) => setOutput((prev) => prev + s),
        (phase) => setStatus({ kind: "phase", phase })
      );
      setImages(figs);
      setStatus({ kind: "done", ms: elapsedMs });
    } catch (e) {
      // 파이썬 트레이스백 포함 — 출력창에 그대로 보여 준다
      const msg = e instanceof Error ? e.message : String(e);
      setOutput((prev) => `${prev}${prev ? "\n" : ""}${msg}\n`);
      setStatus({ kind: "error" });
    }
  }, [busy, code]);

  /** 폴더에 저장 — analysis.py + workspace.json + 데이터 파일 일체 */
  const saveToFolder = useCallback(async () => {
    const picker = dirPicker();
    if (!picker) return;
    try {
      const dir = await picker({ mode: "readwrite" });
      // 코드로 생성된 파일(FS)과 업로드 파일을 합쳐 저장(FS 우선)
      const merged = new Map(dataBytes.current);
      if (isPyodideRequested()) {
        const py = await getPyodide();
        for (const f of listFsDataFiles(py)) merged.set(f.name, f.bytes);
      }
      await writeToDir(dir, "analysis.py", code);
      await writeToDir(
        dir,
        "workspace.json",
        JSON.stringify(
          {
            app: "ai4insurance-datalab-py",
            savedAt: new Date().toISOString(),
            label: loadedLabel,
            dataFiles: Array.from(merged.keys()),
          },
          null,
          2
        )
      );
      for (const [name, bytes] of merged) {
        await writeToDir(dir, name, new Blob([bytes as BlobPart]));
      }
      setFolderMsg(
        `저장 완료 — ${dir.name}/ (analysis.py + 데이터 ${merged.size}개)`
      );
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return; // 사용자 취소
      console.error("[datalab] 폴더 저장 실패:", e);
      setFolderMsg("폴더 저장에 실패했습니다.");
    }
  }, [code, loadedLabel]);

  /** 폴더에서 불러오기 — 코드와 데이터를 함께 복원 */
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
        setCode(nextCode);
        setLoadedLabel(label ?? `${dir.name}/analysis.py`);
        setSelectedId("");
      }
      if (restored.length > 0) await addDataFiles(restored);
      setFolderMsg(
        nextCode === null && restored.length === 0
          ? "폴더에서 analysis.py·데이터 파일을 찾지 못했습니다."
          : `불러오기 완료 — 코드${nextCode !== null ? " 1개" : " 없음"} · 데이터 ${restored.length}개`
      );
    } catch (e) {
      if ((e as { name?: string })?.name === "AbortError") return;
      console.error("[datalab] 폴더 불러오기 실패:", e);
      setFolderMsg("폴더 불러오기에 실패했습니다.");
    }
  }, [addDataFiles]);

  const statusText = (() => {
    if (status.kind === "phase") return PHASE_LABEL[status.phase];
    if (status.kind === "done")
      return `완료 (${(status.ms / 1000).toFixed(status.ms < 10000 ? 1 : 0)}초)`;
    if (status.kind === "error") return "오류 — 아래 출력의 트레이스백을 확인하세요.";
    return null;
  })();

  return (
    <div ref={rootRef} className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-semibold text-foreground">
            파이썬 실행기
          </h3>
          <p className="mt-0.5 text-[12.5px] text-tertiary">
            사전의 코드를 브라우저 안에서 바로 실행합니다 — 설치·서버 없음,
            데이터는 PC를 벗어나지 않습니다.
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

          {(dataFiles.length > 0 || folderMsg) && (
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
              {folderMsg ? (
                <span className="text-tertiary">{folderMsg}</span>
              ) : null}
            </div>
          )}

          {loadedLabel ? (
            <p className="mt-2 text-[12.5px] text-tertiary">
              불러온 코드: <span className="font-medium text-body">{loadedLabel}</span>
            </p>
          ) : null}

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                e.preventDefault();
                const el = e.currentTarget;
                const { selectionStart: s, selectionEnd: en, value } = el;
                setCode(`${value.slice(0, s)}    ${value.slice(en)}`);
                requestAnimationFrame(() => {
                  el.selectionStart = el.selectionEnd = s + 4;
                });
              }
            }}
            spellCheck={false}
            placeholder={'위 드롭다운에서 분석 코드를 불러오거나 직접 입력하세요.\n예: print("hello", 1 + 1)'}
            aria-label="파이썬 코드 편집기"
            className="mt-2 min-h-[240px] w-full rounded border border-border bg-white p-3 font-mono text-[12.5px] leading-[1.7] text-foreground focus-visible:border-foreground focus-visible:outline-none"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={() => void run()} disabled={busy}>
              {busy ? "실행 중…" : "▶ 실행"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setOutput("");
                setImages([]);
                setStatus({ kind: "idle" });
              }}
              disabled={busy}
            >
              출력 지우기
            </Button>
            {statusText ? (
              <span
                className={`text-[12.5px] ${
                  status.kind === "error" ? "text-[#c4302b]" : "text-tertiary"
                }`}
                role="status"
              >
                {statusText}
              </span>
            ) : null}
          </div>

          {output ? (
            <pre className="mt-3 max-h-[340px] overflow-auto whitespace-pre-wrap rounded border border-border bg-surface p-3 font-mono text-[12px] leading-[1.65] text-foreground">
              {output}
            </pre>
          ) : null}
          {images.map((b64, i) => (
            // 실행 결과 그림 — 데이터 URI라 next/image 대상 아님
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={`data:image/png;base64,${b64}`}
              alt={`그래프 출력 ${i + 1}`}
              className="mt-3 max-w-full rounded border border-border bg-white"
            />
          ))}

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
              <strong>폴더에 저장</strong>은 analysis.py + workspace.json +
              데이터 파일을 PC의 선택한 폴더에 저장하고,{" "}
              <strong>폴더에서 불러오기</strong>는 코드와 데이터를 함께
              복원합니다.
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

const DATA_ACCEPT = ".csv,.xlsx,.xls,.txt,.json";
