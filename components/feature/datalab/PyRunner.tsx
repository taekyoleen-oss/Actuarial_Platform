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
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  STAT_CATEGORIES,
  STAT_METHODS,
  methodFullCode,
} from "@/lib/statMethods";
import {
  collectDataSchema,
  getPyodide,
  isDataFileName,
  isPyodideRequested,
  listFsDataFiles,
  resetNamespace,
  runPythonCode,
  writeDataFile,
  type RunPhase,
} from "@/lib/pyRunner";
import { WRANGLE_SNIPPET_GROUPS, snippetInsertCode } from "@/lib/wrangleSnippets";
import { PLOT_SNIPPET_GROUPS, plotInsertCode } from "@/lib/plotSnippets";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";
import {
  loadTabs,
  saveTabs,
  loadWorkspace,
  saveWorkspace,
  removeWorkspace,
  bytesToB64,
  b64ToBytes,
} from "@/lib/pyRunnerStore";

/** AI 어시스턴트 호출(서버 라우트) — 실패 시 사용자용 메시지로 throw. */
async function callAssist(body: {
  mode: "fix" | "generate" | "edit" | "vars";
  code?: string;
  error?: string;
  request?: string;
  schema?: string;
  priorCode?: string;
}): Promise<{ code: string; explanation: string }> {
  const res = await fetch("/api/datalab/py-assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    if (err.error === "ai_not_configured")
      throw new Error("AI 기능이 아직 설정되지 않았습니다(관리자에게 문의).");
    throw new Error("AI 응답을 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  return (await res.json()) as { code: string; explanation: string };
}

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

/** 사이트에 호스팅된 샘플 데이터셋(public/datalab/samples/) — 코드에서 파일명 그대로 읽음 */
const SAMPLE_DATASETS: { file: string; label: string }[] = [
  { file: "policy.xlsx", label: "policy.xlsx — 계약·고객 (600행)" },
  { file: "claims.xlsx", label: "claims.xlsx — 청구·손해액 (600행)" },
  {
    file: "experience.xlsx",
    label: "experience.xlsx — 경험데이터 (800행) · 위험률 산출·생존분석(KM)용",
  },
  {
    file: "triangle.xlsx",
    label: "triangle.xlsx — 런오프 누적 삼각형 (2016~2023) · 지급준비금(chain-ladder)용",
  },
  {
    file: "mortality_table.xlsx",
    label: "mortality_table.xlsx — 생명표 qx (0~100세) · 보험료 산출·위험률 보정용",
  },
];

/* ───────────────────────────── 셀 분할·직렬화 ───────────────────────────── */

/** 주석·빈 줄뿐인 청크인지 — 헤더 코멘트만 있는 첫 청크는 다음 셀에 합친다 */
function isCommentOnly(chunk: string): boolean {
  return chunk
    .split("\n")
    .every((ln) => ln.trim() === "" || ln.trim().startsWith("#"));
}

/** 특정 열·필드 이름을 코드에 쓰는(=사용자 판단 필요한) 줄인지 판정하는 패턴 */
const SPECIFIC_COL =
  /\[\s*["'][^"']*["']|\[\s*\[|\.(groupby|pivot_table|pivot|sort_values|merge|join|agg|drop|rename|query|melt|set_index|crosstab|nlargest|nsmallest|value_counts|map|apply|isin|between|str)\s*[(.]/;
/** 데이터 전체 수준의 일반 확인(특정 열 미지정) — 로드·확인 단계에 남겨도 되는 줄 */
const GENERIC_INSPECT =
  /\b[\w.]+\.(describe|head|tail|info|dtypes|shape|columns|sample|nunique|memory_usage)\b/;

type LineKind = "neutral" | "setup" | "load" | "inspect" | "analysis";

function classifyLine(line: string): LineKind {
  const t = line.trim();
  if (t === "" || t.startsWith("#")) return "neutral";
  if (/^(import |from )\S/.test(t)) return "setup";
  if (/=\s*(?:pd\.)?read_(excel|csv|table|json|parquet|fwf)\s*\(/.test(t))
    return "load";
  if (SPECIFIC_COL.test(t)) return "analysis";
  if (GENERIC_INSPECT.test(t)) return "inspect";
  return "analysis"; // 그 밖의 대입·연산은 판단이 필요한 분석으로 간주
}

/** 셀 코드가 데이터 로드(read_*) 줄을 포함하는지 — 업로드 시 로드 셀 교체 판정 */
function cellHasLoad(code: string): boolean {
  return code.split("\n").some((l) => classifyLine(l) === "load");
}

/** 로드 줄들에서 데이터프레임 변수명(들)을 추출 — 열 목록 자동 출력에 사용 */
function detectDfVars(lines: string[]): string[] {
  const vars: string[] = [];
  for (const l of lines) {
    const m = l.match(/^\s*(\w+)\s*=\s*(?:pd\.)?read_/);
    if (m && !vars.includes(m[1])) vars.push(m[1]);
  }
  return vars;
}

/** 파일 확장자 → pandas 로드 호출 문자열 */
function loadCallFor(name: string): string {
  const l = name.toLowerCase();
  if (l.endsWith(".xlsx") || l.endsWith(".xls")) return `pd.read_excel("${name}")`;
  if (l.endsWith(".json")) return `pd.read_json("${name}")`;
  if (l.endsWith(".txt")) return `pd.read_csv("${name}", sep=None, engine="python")`;
  return `pd.read_csv("${name}")`;
}

/** 업로드/신규 데이터용 '로드 · 속성 확인' 셀 자동 생성(실제 파일명 인식) */
function buildLoadCell(name: string): string {
  return [
    "# ── 데이터 로드 · 속성 확인 ──",
    "import pandas as pd",
    `df = ${loadCallFor(name)}`,
    "",
    "# 다음 단계로 가기 전에 아래 결과로 열 이름·자료형을 확인하세요",
    'print("행·열:", df.shape)',
    'print("열 이름:", df.columns.tolist())',
    "print(df.dtypes)",
    "df.head()",
  ].join("\n");
}

/** 블록 제목(# ── 제목 ──) 기준 분할 — 헤더 주석만 있는 첫 청크는 다음 셀에 병합 */
function splitByBlockTitles(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  const marker = /^# ── .+ ──$/;
  if (!t.split("\n").some((ln) => marker.test(ln))) return [t];
  const cells: string[] = [];
  let cur: string[] = [];
  for (const ln of t.split("\n")) {
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
  return nonEmpty.length > 0 ? nonEmpty : [t];
}

const ANALYSIS_BANNER =
  "# ▸ 분석 단계 — 위에서 확인한 실제 열 이름에 맞게 수정한 뒤 실행하세요";

/**
 * 코드 → 셀 목록. 우선순위:
 * ① "# %%" 명시 구분자(주피터·VSCode 관례) — 사용자 의도 최우선.
 * ② 데이터 로드가 있으면 단계 분리: [로드·속성 확인] → [분석(특정 열 이름 사용)].
 *    경계는 '특정 열 이름을 코드에 처음 쓰는 줄'(describe·columns 등 일반 확인 다음).
 *    로드 셀이 열 목록을 안 찍으면 자동으로 열 이름 출력을 덧붙인다.
 * ③ 그 외에는 블록 제목(# ── ──) 기준, 없으면 통짜 한 셀.
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

  const lines = text.split("\n");
  const hasLoad = lines.some((l) => classifyLine(l) === "load");

  if (hasLoad) {
    let boundary = -1;
    for (let i = 0; i < lines.length; i++) {
      if (classifyLine(lines[i]) === "analysis") {
        boundary = i;
        break;
      }
    }
    if (boundary > 0) {
      // 경계 직전의 주석·빈 줄(분석을 설명하는 헤더)은 분석 셀로 넘긴다
      let sep = boundary;
      while (sep > 0) {
        const prev = lines[sep - 1].trim();
        if (prev === "" || prev.startsWith("#")) sep--;
        else break;
      }
      if (sep === 0) sep = boundary; // 안전장치(로드가 head에 남도록)

      let loadCell = lines.slice(0, sep).join("\n").trim();
      const vars = detectDfVars(lines.slice(0, sep));
      if (vars.length > 0 && !/\.columns\b/.test(loadCell)) {
        const prints = vars
          .map((v) => `print("${v} 열:", ${v}.columns.tolist())`)
          .join("\n");
        loadCell += `\n\n# 다음 단계 전에 실제 열 이름을 확인하세요\n${prints}`;
      }

      const analysisCells = splitByBlockTitles(lines.slice(sep).join("\n"));
      if (analysisCells.length > 0) {
        analysisCells[0] = `${ANALYSIS_BANNER}\n${analysisCells[0]}`;
      }
      return [loadCell, ...analysisCells];
    }
  }

  const byTitle = splitByBlockTitles(text);
  return byTitle.length > 0 ? byTitle : [text];
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
  methodId?: string;
}

type CellStatus = "idle" | "running" | "done" | "error";

interface AiProposal {
  code: string;
  explanation: string;
}

interface Cell {
  id: number;
  code: string;
  output: string;
  images: string[];
  status: CellStatus;
  ms?: number;
  phase?: RunPhase;
  aiBusy?: boolean;
  aiError?: string | null;
  proposal?: AiProposal | null;
  /** 셀별 'AI 제안' 요청 입력 영역 활성화 여부 */
  aiInputOpen?: boolean;
  aiRequest?: string;
  /** '변수 반영' 변수 선택 드롭다운 */
  varPickerOpen?: boolean;
  varOptions?: string[];
  /** 마지막 실행 순서(In [n]) — 실행할 때마다 증가(주피터 실행 카운터) */
  execOrder?: number;
  /** 코드 되돌리기(취소·Ctrl+Z) 스냅샷 스택 — 삽입·타이핑 버스트 직전 코드 */
  undo?: string[];
}

interface ErrModalState {
  cellId: number;
  errorSummary: string;
  errorFull: string;
  explanation: string;
  originalCode: string;
  fixedCode: string;
}

/** 트레이스백에서 한 줄 에러 요약 추출(마지막 'XxxError: …' 우선) */
function errorSummaryOf(output: string): string {
  const lines = output
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^[A-Za-z_][\w.]*(Error|Exception|Warning):/.test(lines[i])) return lines[i];
  }
  return lines[lines.length - 1] ?? "오류";
}


const PHASE_LABEL: Record<RunPhase, string> = {
  boot: "파이썬 런타임 내려받는 중… (최초 1회, 수십 MB)",
  pkg: "필요 패키지 로딩 중…",
  run: "실행 중…",
};

const CELL_BTN =
  "inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-0.5 text-[11.5px] font-medium text-tertiary hover:text-foreground disabled:opacity-40";

/** 셀 순서 배지 색 — 실행 상태를 색으로 구분(대기·실행·완료·오류) */
const CELL_STATUS_STYLE: Record<CellStatus, { background: string; color: string }> = {
  idle: { background: "var(--surface-alt)", color: "var(--text-tertiary)" },
  running: { background: "var(--chip-blue-bg)", color: "var(--chip-blue-fg)" },
  done: { background: "var(--chip-green-bg)", color: "var(--chip-green-fg)" },
  error: { background: "var(--chip-rose-bg)", color: "var(--chip-rose-fg)" },
};

function autoSize(el: HTMLTextAreaElement): void {
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight + 2, 460)}px`;
}

/**
 * 파이썬 실행기 — 상단에 '작업 탭'을 두어 독립 노트북을 여러 개 만든다.
 * 각 탭은 자기만의 셀·데이터 목록·파이썬 네임스페이스(nsKey)를 가져 변수가 섞이지
 * 않는다(Pyodide 런타임·모듈 캐시·가상 FS는 공유). 모든 탭을 마운트한 채 표시만
 * 토글해 탭을 오가도 각 탭의 상태(셀·출력)가 유지된다.
 */
export default function PyRunner({
  loadRequest,
  onLoadMethod,
}: {
  loadRequest: RunnerLoadRequest | null;
  onLoadMethod?: (methodId: string | null) => void;
}) {
  const [workspaces, setWorkspaces] = useState<{ id: number; name: string }[]>([
    { id: 1, name: "작업 1" },
  ]);
  const [activeId, setActiveId] = useState(1);
  const wsCounter = useRef(1);
  // 들어온 '실행기로 보내기' 요청을 그 시점의 활성 탭으로만 라우팅(탭 전환 시 재주입 방지)
  const [pending, setPending] = useState<Record<number, RunnerLoadRequest | null>>(
    {}
  );
  const routedSeq = useRef(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  // ── 브라우저 영속(localStorage) — 작업 탭 목록·활성 탭 복원(기기·브라우저 단위) ──
  const [tabsHydrated, setTabsHydrated] = useState(false);
  useEffect(() => {
    const t = loadTabs();
    if (t) {
      setWorkspaces(t.workspaces);
      setActiveId(
        t.workspaces.some((w) => w.id === t.activeId)
          ? t.activeId
          : t.workspaces[0].id
      );
      wsCounter.current = Math.max(t.wsCounter ?? 1, ...t.workspaces.map((w) => w.id));
    }
    setTabsHydrated(true);
  }, []);
  useEffect(() => {
    if (!tabsHydrated) return;
    saveTabs({ workspaces, activeId, wsCounter: wsCounter.current });
  }, [workspaces, activeId, tabsHydrated]);

  useEffect(() => {
    if (loadRequest && loadRequest.seq !== routedSeq.current) {
      routedSeq.current = loadRequest.seq;
      setPending((p) => ({ ...p, [activeId]: loadRequest }));
    }
  }, [loadRequest, activeId]);

  const addWorkspace = () => {
    const id = ++wsCounter.current;
    setWorkspaces((ws) => [...ws, { id, name: `작업 ${id}` }]);
    setActiveId(id);
  };

  const closeWorkspace = (id: number) => {
    setWorkspaces((ws) => {
      if (ws.length <= 1) return ws;
      const idx = ws.findIndex((w) => w.id === id);
      const next = ws.filter((w) => w.id !== id);
      if (id === activeId) {
        const fallback = next[Math.max(0, idx - 1)] ?? next[0];
        setActiveId(fallback.id);
      }
      return next;
    });
    resetNamespace(`ws-${id}`); // 닫은 탭의 파이썬 네임스페이스 해제
    removeWorkspace(`ws-${id}`); // 저장된 셀·데이터도 제거
  };

  const commitRename = () => {
    if (editingId != null) {
      const name = draftName.trim();
      if (name)
        setWorkspaces((ws) =>
          ws.map((w) => (w.id === editingId ? { ...w, name } : w))
        );
    }
    setEditingId(null);
  };

  return (
    <div
      className="mt-8 rounded-cover border border-[color:var(--chip-blue-fg)]/20 p-5 sm:p-6"
      style={{ background: "color-mix(in srgb, var(--chip-blue-bg) 60%, white)" }}
    >
      <div>
        <h3 className="text-[16px] font-semibold text-foreground">
          🐍 파이썬 실행기
        </h3>
        <p className="mt-0.5 text-[12.5px] text-tertiary">
          작업 탭마다 데이터를 불러오고 셀(단락) 단위로 독립 실행합니다 — 변수는 탭
          사이에 섞이지 않고, 데이터는 PC를 벗어나지 않습니다.
        </p>
      </div>

      {/* 작업 탭 바 — 여러 개의 독립 노트북(＋ 새 작업 · 더블클릭 이름변경 · × 닫기) */}
      <div
        role="tablist"
        aria-label="파이썬 실행기 작업 탭"
        className="mt-3 flex flex-wrap items-center gap-1.5"
      >
        {workspaces.map((w) => {
          const active = w.id === activeId;
          return (
            <div
              key={w.id}
              className={`inline-flex items-center gap-0.5 rounded-full border pl-1 pr-0.5 ${
                active
                  ? "border-[var(--primary)] bg-white"
                  : "border-border bg-white/70"
              }`}
            >
              {editingId === w.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  aria-label="작업 탭 이름"
                  className="w-24 rounded-full px-2 py-1 text-[12.5px] text-foreground focus-visible:outline-none"
                />
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveId(w.id)}
                  onDoubleClick={() => {
                    setEditingId(w.id);
                    setDraftName(w.name);
                  }}
                  title="더블클릭하면 이름을 바꿀 수 있습니다"
                  className={`rounded-full px-2.5 py-1 text-[12.5px] font-medium ${
                    active
                      ? "text-[var(--primary)]"
                      : "text-tertiary hover:text-foreground"
                  }`}
                >
                  {w.name}
                </button>
              )}
              {workspaces.length > 1 ? (
                <button
                  type="button"
                  onClick={() => closeWorkspace(w.id)}
                  aria-label={`${w.name} 탭 닫기`}
                  className="rounded-full p-1 text-tertiary hover:text-foreground"
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          onClick={addWorkspace}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-[12.5px] font-medium text-tertiary hover:text-foreground"
        >
          ＋ 새 작업
        </button>
      </div>

      {/* 작업 탭별 독립 워크스페이스(전부 마운트, 표시만 토글해 상태 유지).
          loadRequest는 라우팅으로 활성 탭에만 채워지므로 onLoadMethod는 전 탭에
          동일하게 넘겨 탭 전환 시 주입 effect가 재실행되지 않게 한다(사용자 편집 보존). */}
      {workspaces.map((w) => (
        <div key={w.id} className={w.id === activeId ? "block" : "hidden"}>
          <RunnerWorkspace
            nsKey={`ws-${w.id}`}
            loadRequest={pending[w.id] ?? null}
            onLoadMethod={onLoadMethod}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * 하나의 '작업 탭' = 독립 노트북. nsKey로 파이썬 네임스페이스가 탭마다 분리되어
 * 변수(df 등)가 탭 사이에 섞이지 않는다(런타임·데이터 파일은 공유).
 */
function RunnerWorkspace({
  nsKey,
  loadRequest,
  onLoadMethod,
}: {
  nsKey: string;
  loadRequest: RunnerLoadRequest | null;
  onLoadMethod?: (methodId: string | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dataBytes = useRef<Map<string, Uint8Array>>(new Map());
  const nextId = useRef(1);
  const execCounter = useRef(0);
  // 셀별 마지막 타이핑 시각 — Ctrl+Z 되돌리기 단위(버스트) 판정용
  const typingRef = useRef<Map<number, number>>(new Map());
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
  const [urlInput, setUrlInput] = useState("");
  const [dataBusy, setDataBusy] = useState(false);

  useEffect(() => {
    setFsSupported(dirPicker() !== null);
  }, []);

  // ── 브라우저 영속(localStorage) — 새로고침·재접속 후에도 이 탭의 셀·데이터 복원 ──
  const [wsHydrated, setWsHydrated] = useState(false);
  useEffect(() => {
    const p = loadWorkspace(nsKey);
    if (p && p.cells?.length) {
      setCells(
        p.cells.map((c) => ({
          id: c.id,
          code: c.code,
          output: c.output ?? "",
          images: c.images ?? [],
          // 런타임이 초기화되므로 '실행 중'으로 저장된 셀은 대기로 되돌린다
          status: c.status === "running" ? "idle" : c.status ?? "idle",
          ms: c.ms,
          execOrder: c.execOrder,
        }))
      );
      setLoadedLabel(p.loadedLabel ?? null);
      nextId.current =
        p.nextId ?? Math.max(0, ...p.cells.map((c) => c.id)) + 1;
      execCounter.current = p.execCounter ?? 0;
      if (p.files?.length) {
        const map = new Map<string, Uint8Array>();
        for (const f of p.files) {
          try {
            map.set(f.name, b64ToBytes(f.b64));
          } catch {
            // 손상된 항목은 건너뜀
          }
        }
        dataBytes.current = map;
        setDataFiles(
          [...map.entries()].map(([name, b]) => ({ name, size: b.length }))
        );
      }
    }
    setWsHydrated(true);
  }, [nsKey]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!wsHydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const files = [...dataBytes.current.entries()].map(([name, bytes]) => ({
        name,
        b64: bytesToB64(bytes),
      }));
      saveWorkspace(nsKey, {
        cells: cells.map((c) => ({
          id: c.id,
          code: c.code,
          output: c.output,
          images: c.images,
          status: c.status,
          ms: c.ms,
          execOrder: c.execOrder,
        })),
        loadedLabel,
        files,
        execCounter: execCounter.current,
        nextId: nextId.current,
      });
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [cells, loadedLabel, dataFiles, wsHydrated, nsKey]);

  const setCellsFromCode = useCallback(
    (code: string, label: string | null) => {
      setCells(splitIntoCells(code).map((c) => newCell(c)));
      setLoadedLabel(label);
    },
    [newCell]
  );

  // 팝업 "실행기로 보내기" — 셀 분할 주입 + 스크롤 + 워드클라우드 강조
  useEffect(() => {
    if (!loadRequest) return;
    setCellsFromCode(loadRequest.code, loadRequest.label);
    setSelectedId(loadRequest.methodId ?? "");
    if (loadRequest.methodId) onLoadMethod?.(loadRequest.methodId);
    requestAnimationFrame(() =>
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  }, [loadRequest, setCellsFromCode, onLoadMethod]);

  const loadById = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (!id) {
        onLoadMethod?.(null);
        return;
      }
      if (id === SAMPLE_ID) {
        setCellsFromCode(SAMPLE_CODE, SAMPLE_LABEL);
        onLoadMethod?.(null);
        return;
      }
      const m = STAT_METHODS.find((x) => x.id === id);
      if (!m) return;
      setCellsFromCode(
        `# ═══ ${m.name} (${m.en}) ═══\n${methodFullCode(m)}`,
        `${m.name} (${m.en})`
      );
      // 콤보박스에서 방법을 고르면 워드클라우드에서 해당 방법을 강조 표시
      onLoadMethod?.(m.id);
    },
    [setCellsFromCode, onLoadMethod]
  );

  const addDataFiles = useCallback(
    async (
      files: FileList | { name: string; bytes: Uint8Array }[],
      opts: { generateLoadCell?: boolean } = {}
    ) => {
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

      // 업로드 시 실제 파일명을 인식해 '로드·속성 확인' 셀을 만든다.
      // 기존 로드 셀이 있으면 그 자리를 교체해 중복을 막고(분석 셀은 유지),
      // 없으면 맨 위에 추가한다.
      if (opts.generateLoadCell) {
        const primary = items.find((it) =>
          /\.(csv|xlsx|xls|json|txt)$/i.test(it.name)
        );
        if (primary) {
          const loadCode = buildLoadCell(primary.name);
          const replacing = cellsRef.current.some((c) => cellHasLoad(c.code));
          setCells((prev) => {
            const idx = prev.findIndex((c) => cellHasLoad(c.code));
            if (idx >= 0) {
              return prev.map((c, i) =>
                i === idx
                  ? {
                      ...c,
                      code: loadCode,
                      output: "",
                      images: [],
                      status: "idle",
                      ms: undefined,
                      phase: undefined,
                    }
                  : c
              );
            }
            const onlyEmpty = prev.length === 1 && !prev[0].code.trim();
            const loadCell = newCell(loadCode);
            return onlyEmpty ? [loadCell] : [loadCell, ...prev];
          });
          setSelectedId("");
          setLoadedLabel(`업로드 데이터: ${primary.name}`);
          setNotice(
            replacing
              ? `「${primary.name}」에 맞춰 로드 셀을 교체했습니다 — 실행해 열 이름을 확인한 뒤 아래 분석 셀의 열 이름을 맞추세요.`
              : `「${primary.name}」 로드·속성 확인 셀을 추가했습니다 — 먼저 실행해 열 이름을 확인하세요.`
          );
        }
      }
    },
    [newCell]
  );

  /** URL·샘플 파일을 브라우저에서 가져와 가상 FS에 넣고 로드 셀을 만든다(fetch) */
  const fetchDataInto = useCallback(
    async (url: string, name: string) => {
      setDataBusy(true);
      setNotice(null);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bytes = new Uint8Array(await res.arrayBuffer());
        await addDataFiles([{ name, bytes }], { generateLoadCell: true });
      } catch (e) {
        setNotice(
          `데이터를 불러오지 못했습니다(${
            e instanceof Error ? e.message : String(e)
          }). 외부 URL은 서버가 CORS를 허용해야 합니다.`
        );
      } finally {
        setDataBusy(false);
      }
    },
    [addDataFiles]
  );

  const loadSampleDataset = useCallback(
    (file: string) => {
      if (file) void fetchDataInto(`/datalab/samples/${file}`, file);
    },
    [fetchDataInto]
  );

  const loadFromUrl = useCallback(() => {
    const url = urlInput.trim();
    if (!url) return;
    const clean = url.split("#")[0].split("?")[0];
    let name = clean.substring(clean.lastIndexOf("/") + 1) || "data.csv";
    if (!isDataFileName(name)) name += ".csv";
    void fetchDataInto(url, name);
  }, [urlInput, fetchDataInto]);

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
      patchCell(id, {
        output: "",
        images: [],
        status: "running",
        phase: "boot",
        execOrder: ++execCounter.current,
      });
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
          (phase) => patchCell(id, { phase }),
          nsKey
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
    [patchCell, nsKey]
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

  /** 이 작업 탭의 변수 초기화 — 탭의 네임스페이스만 비운다(데이터 파일·런타임은 유지) */
  const resetVars = useCallback(() => {
    if (busyRef.current) return;
    if (!isPyodideRequested()) {
      setNotice("아직 실행한 적이 없어 초기화할 변수가 없습니다.");
      return;
    }
    resetNamespace(nsKey);
    setNotice("이 작업 탭의 변수를 초기화했습니다 — 데이터 파일은 유지됩니다.");
  }, [nsKey]);

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

  /** 셀 위/아래 이동(순서 바꾸기) */
  const moveCell = useCallback((id: number, dir: -1 | 1) => {
    setCells((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  /** 데이터 핸들링 스니펫을 이 셀에 삽입(빈 셀=대입, 내용 있으면 아래에 이어붙임).
   *  삽입 직전 코드를 undo 스택에 넣어 '취소'·Ctrl+Z로 되돌릴 수 있게 한다. */
  const insertSnippet = useCallback((id: number, code: string) => {
    if (!code) return;
    setCells((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const base = c.code.replace(/\s+$/, "");
        const next = base ? `${base}\n\n${code}` : code;
        return { ...c, code: next, undo: [...(c.undo ?? []), c.code].slice(-100) };
      })
    );
  }, []);

  /** 코드 되돌리기 — undo 스택에서 직전 스냅샷 복원('취소' 버튼·Ctrl+Z 공용) */
  const undoCell = useCallback((id: number) => {
    typingRef.current.delete(id);
    setCells((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const st = c.undo ?? [];
        if (st.length === 0) return c;
        return { ...c, code: st[st.length - 1], undo: st.slice(0, -1) };
      })
    );
  }, []);

  const priorCodeOf = useCallback((id: number): string => {
    const idx = cellsRef.current.findIndex((c) => c.id === id);
    return cellsRef.current
      .slice(0, Math.max(0, idx))
      .map((c) => c.code.trim())
      .filter(Boolean)
      .join("\n\n# ---\n");
  }, []);

  /**
   * 셀 AI 제안(edit)·변수 반영(vars) — 제안 패널로 검토 후 적용.
   * vars에 targetVar를 주면 그 변수로 대체(변수 선택 드롭다운에서 고른 값).
   */
  const runCellAssist = useCallback(
    async (id: number, mode: "vars" | "edit", targetVar?: string) => {
      const cell = cellsRef.current.find((c) => c.id === id);
      if (!cell || cell.aiBusy) return;
      if (mode === "edit" && !(cell.aiRequest ?? "").trim()) return;
      patchCell(id, {
        aiBusy: true,
        aiError: null,
        proposal: null,
        varPickerOpen: false,
      });
      try {
        const schema = await collectDataSchema(nsKey);
        const result = await callAssist({
          mode,
          code: cell.code,
          request:
            mode === "edit"
              ? (cell.aiRequest ?? "").trim()
              : targetVar || undefined,
          schema,
          priorCode: priorCodeOf(id),
        });
        if (!result.code) {
          patchCell(id, {
            aiBusy: false,
            aiError:
              result.explanation ||
              "제안할 코드를 만들지 못했습니다. 요청을 더 구체적으로 적어 보세요.",
          });
          return;
        }
        patchCell(id, {
          aiBusy: false,
          proposal: { code: result.code, explanation: result.explanation },
          aiInputOpen: mode === "edit" ? false : cell.aiInputOpen,
          aiRequest: mode === "edit" ? "" : cell.aiRequest,
        });
      } catch (e) {
        patchCell(id, {
          aiBusy: false,
          aiError: e instanceof Error ? e.message : "AI 요청에 실패했습니다.",
        });
      }
    },
    [patchCell, priorCodeOf, nsKey]
  );

  /** 변수 반영 — 세션의 실제 DataFrame 변수 목록을 열어 그중 하나를 고르게 한다 */
  const openVarPicker = useCallback(
    async (id: number) => {
      const cell = cellsRef.current.find((c) => c.id === id);
      if (!cell || cell.aiBusy) return;
      if (cell.varPickerOpen) {
        patchCell(id, { varPickerOpen: false });
        return;
      }
      patchCell(id, { aiBusy: true, aiError: null });
      try {
        const schema = await collectDataSchema(nsKey);
        let vars: string[] = [];
        try {
          const parsed = JSON.parse(schema) as {
            vars?: Record<string, { columns?: unknown }>;
          };
          vars = Object.entries(parsed.vars ?? {})
            .filter(([, v]) => v && Array.isArray(v.columns))
            .map(([k]) => k);
        } catch {
          vars = [];
        }
        if (vars.length === 0) {
          patchCell(id, {
            aiBusy: false,
            aiError:
              "앞에서 만든 변수가 없습니다. 먼저 데이터 로드 셀을 실행해 변수(예: df)를 만든 뒤 사용하세요.",
          });
          return;
        }
        patchCell(id, { aiBusy: false, varOptions: vars, varPickerOpen: true });
      } catch (e) {
        patchCell(id, {
          aiBusy: false,
          aiError: e instanceof Error ? e.message : "변수 목록을 불러오지 못했습니다.",
        });
      }
    },
    [patchCell, nsKey]
  );

  /** 에러분석 — 팝업으로 에러·수정안을 안내(반영 여부 확인) */
  const [errModal, setErrModal] = useState<ErrModalState | null>(null);
  // 에러분석 팝업 열림 중 뒤로가기 → 뒤 페이지 이동 대신 팝업만 닫기
  useHistoryDismiss(!!errModal, () => setErrModal(null));

  const runErrorAnalysis = useCallback(
    async (id: number) => {
      const cell = cellsRef.current.find((c) => c.id === id);
      if (!cell || cell.aiBusy || cell.status !== "error") return;
      patchCell(id, { aiBusy: true, aiError: null });
      try {
        const schema = await collectDataSchema(nsKey);
        const result = await callAssist({
          mode: "fix",
          code: cell.code,
          error: cell.output,
          schema,
          priorCode: priorCodeOf(id),
        });
        patchCell(id, { aiBusy: false });
        if (!result.code) {
          patchCell(id, {
            aiError:
              result.explanation ||
              "수정안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.",
          });
          return;
        }
        setErrModal({
          cellId: id,
          errorSummary: errorSummaryOf(cell.output),
          errorFull: cell.output,
          explanation: result.explanation,
          originalCode: cell.code,
          fixedCode: result.code,
        });
      } catch (e) {
        patchCell(id, {
          aiBusy: false,
          aiError: e instanceof Error ? e.message : "AI 요청에 실패했습니다.",
        });
      }
    },
    [patchCell, priorCodeOf, nsKey]
  );

  /** 에러 팝업 '반영' — 기존(오류) 셀은 위에 그대로 두고, 수정된 코드만 담은
   *  새 셀을 바로 아래에 추가한다(원본을 다시 주석으로 넣지 않음). */
  const applyErrModal = useCallback(() => {
    if (!errModal) return;
    const m = errModal;
    setCells((prev) => {
      const i = prev.findIndex((c) => c.id === m.cellId);
      const next = [...prev];
      next.splice(i + 1, 0, newCell(m.fixedCode.trim()));
      return next;
    });
    setErrModal(null);
  }, [errModal, newCell]);

  const applyProposal = useCallback(
    (id: number, target: "replace" | "new") => {
      const cell = cellsRef.current.find((c) => c.id === id);
      if (!cell?.proposal) return;
      const code = cell.proposal.code;
      if (target === "replace") {
        patchCell(id, {
          code,
          proposal: null,
          output: "",
          images: [],
          status: "idle",
          ms: undefined,
        });
      } else {
        setCells((prev) => {
          const i = prev.findIndex((c) => c.id === id);
          const next = prev.map((c) =>
            c.id === id ? { ...c, proposal: null } : c
          );
          next.splice(i + 1, 0, newCell(code));
          return next;
        });
      }
    },
    [newCell, patchCell]
  );

  // 요청 기반 코드 생성(러너 레벨)
  const [genRequest, setGenRequest] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const aiGenerate = useCallback(async () => {
    const request = genRequest.trim();
    if (!request || genBusy) return;
    setGenBusy(true);
    setGenError(null);
    try {
      const schema = await collectDataSchema();
      const priorCode = cellsRef.current
        .map((c) => c.code.trim())
        .filter(Boolean)
        .join("\n\n# ---\n");
      const result = await callAssist({
        mode: "generate",
        request,
        schema,
        priorCode,
      });
      if (!result.code) {
        setGenError(
          result.explanation || "코드를 생성하지 못했습니다. 요청을 바꿔 보세요."
        );
        setGenBusy(false);
        return;
      }
      // 설명을 주석으로 얹어 새 셀로 추가
      const header = result.explanation
        ? `# ▸ AI 생성: ${result.explanation.replace(/\s+/g, " ").slice(0, 120)}`
        : "# ▸ AI 생성";
      const newC = newCell(`${header}\n${result.code}`);
      setCells((prev) => [...prev, newC]);
      setGenRequest("");
      setGenBusy(false);
      setNotice("AI가 새 셀에 코드를 생성했습니다 — 확인 후 실행하세요.");
      requestAnimationFrame(() =>
        rootRef.current
          ?.querySelector(`[data-cell-id="${newC.id}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "AI 요청에 실패했습니다.");
      setGenBusy(false);
    }
  }, [genRequest, genBusy, newCell, nsKey]);

  /** 이 작업 탭 전체 리셋 — 셀·데이터 목록·출력·변수를 처음 상태로(런타임·FS는 유지) */
  const resetWorkspace = useCallback(() => {
    if (busyRef.current) return;
    resetNamespace(nsKey);
    dataBytes.current.clear();
    execCounter.current = 0;
    setCells([newCell("")]);
    setLoadedLabel(null);
    setSelectedId("");
    setDataFiles([]);
    setUrlInput("");
    setGenRequest("");
    setGenError(null);
    setErrModal(null);
    setNotice("이 작업 탭을 리셋했습니다 — 데이터 파일·런타임은 유지됩니다.");
  }, [nsKey, newCell]);

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
    <div ref={rootRef}>
      <div className="mt-2">
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
              {/* 데이터 핸들링(wrangle)은 통짜 로드에서 제외 — 각 셀 콤보박스로 삽입 */}
              {STAT_CATEGORIES.filter((cat) => cat.id !== "wrangle").map((cat) => (
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
                  if (e.target.files?.length)
                    void addDataFiles(e.target.files, { generateLoadCell: true });
                  e.target.value = "";
                }}
              />
            </label>

            {/* 샘플 데이터셋 — 사이트에 호스팅된 파일을 가져와 바로 사용 */}
            <select
              value=""
              onChange={(e) => {
                loadSampleDataset(e.target.value);
                e.target.value = "";
              }}
              disabled={dataBusy}
              aria-label="샘플 데이터셋 불러오기"
              className="h-9 max-w-full rounded border border-border bg-white px-2 text-[13px] text-foreground disabled:opacity-50"
            >
              <option value="">
                {dataBusy ? "불러오는 중…" : "샘플 데이터셋 불러오기…"}
              </option>
              {SAMPLE_DATASETS.map((d) => (
                <option key={d.file} value={d.file}>
                  {d.label}
                </option>
              ))}
            </select>

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

          {/* URL로 불러오기 — 링크(CSV·XLSX)를 붙여넣어 데이터를 바로 가져온다 */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  loadFromUrl();
                }
              }}
              placeholder="데이터 URL 붙여넣기 (예: https://.../data.csv)"
              aria-label="데이터 URL"
              className="h-9 min-w-[240px] flex-1 rounded border border-border bg-white px-3 text-[13px] text-foreground placeholder:text-placeholder focus-visible:border-foreground focus-visible:outline-none"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={loadFromUrl}
              disabled={dataBusy || !urlInput.trim()}
            >
              URL로 불러오기
            </Button>
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
              onClick={resetVars}
              disabled={busy}
            >
              변수 초기화
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={resetWorkspace}
              disabled={busy}
              title="이 작업 탭의 셀·데이터·변수를 처음 상태로 되돌립니다"
            >
              ↺ 리셋
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
            만든 변수·데이터프레임을 다음 셀에서 그대로 쓸 수 있습니다.{" "}
            <strong>1단계(데이터 로드·열 이름 확인)</strong>를 먼저 실행해 실제
            열 이름을 본 뒤, 다음 분석 셀의 열 이름을 맞춰 실행하세요.
          </p>

          {/* AI 코드 생성 — 요청을 입력하면 앞서 실행한 데이터를 읽어 코드를 작성 */}
          <div className="mt-3 rounded border border-[color:var(--primary)]/25 bg-white p-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-medium text-foreground">
                ✦ AI에게 코드 요청
              </span>
              <input
                type="text"
                value={genRequest}
                onChange={(e) => setGenRequest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void aiGenerate();
                  }
                }}
                placeholder="예: 지역별 평균 보험료를 막대그래프로 그려줘"
                aria-label="AI 코드 생성 요청"
                className="h-9 min-w-[220px] flex-1 rounded border border-border bg-white px-3 text-[13px] text-foreground placeholder:text-placeholder focus-visible:border-foreground focus-visible:outline-none"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => void aiGenerate()}
                disabled={genBusy || !genRequest.trim()}
              >
                {genBusy ? "생성 중…" : "코드 생성"}
              </Button>
            </div>
            <p className="mt-1 text-[11.5px] text-tertiary">
              먼저 데이터 로드 셀을 실행해 두면, AI가 그 데이터의 실제 열 이름을
              읽어 코드를 만들어 새 셀로 추가합니다.
            </p>
            {genError ? (
              <p className="mt-1 text-[12px] text-[#c4302b]">{genError}</p>
            ) : null}
          </div>

          {/* 셀 목록 — 코드 입력부는 다크 에디터로 뚜렷이 구분 */}
          {cells.map((c, i) => (
            <div
              key={c.id}
              data-cell-id={c.id}
              className="mt-3 overflow-hidden rounded border border-border border-l-[3px] border-l-[color:var(--primary)] bg-white"
            >
              <div className="flex flex-wrap items-center gap-2 border-b border-border bg-white px-2.5 py-1.5">
                {/* 순서(위치) 번호 — 실행 상태를 색으로 구분 */}
                <span
                  className="inline-flex h-5 min-w-[24px] items-center justify-center rounded px-1 text-[11px] font-semibold tabular-nums"
                  style={CELL_STATUS_STYLE[c.status]}
                  title={
                    c.status === "done"
                      ? "실행 완료"
                      : c.status === "error"
                        ? "실행 오류"
                        : c.status === "running"
                          ? "실행 중"
                          : "미실행"
                  }
                >
                  {i + 1}
                </span>
                {/* 실행 순서(주피터 In [n]) — 실행 여부·순서를 숫자로 */}
                <span
                  className="w-[52px] text-[11px] tabular-nums text-tertiary"
                  title="실행 순서(실행할 때마다 증가)"
                >
                  {c.status === "running"
                    ? "In [*]"
                    : c.execOrder
                      ? `In [${c.execOrder}]`
                      : "In [ ]"}
                </span>
                <button
                  type="button"
                  onClick={() => void runCell(c.id)}
                  disabled={busy}
                  className={`${CELL_BTN} text-primary`}
                >
                  ▶ 실행
                </button>
                {/* 셀 위/아래 이동 */}
                <span className="inline-flex">
                  <button
                    type="button"
                    onClick={() => moveCell(c.id, -1)}
                    disabled={i === 0}
                    title="위로 이동"
                    aria-label="셀 위로 이동"
                    className={`${CELL_BTN} rounded-r-none`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCell(c.id, 1)}
                    disabled={i === cells.length - 1}
                    title="아래로 이동"
                    aria-label="셀 아래로 이동"
                    className={`${CELL_BTN} -ml-px rounded-l-none`}
                  >
                    ▼
                  </button>
                </span>
                {/* 데이터 핸들링 삽입 — 세분화 스니펫을 이 셀에 넣는다 */}
                <select
                  value=""
                  onChange={(e) => {
                    const [gid, sid] = e.target.value.split("::");
                    const grp = WRANGLE_SNIPPET_GROUPS.find((g) => g.id === gid);
                    const sn = grp?.snippets.find((s) => s.id === sid);
                    if (sn) insertSnippet(c.id, snippetInsertCode(sn));
                    e.target.value = "";
                  }}
                  aria-label="데이터 핸들링 삽입"
                  title="데이터 핸들링 코드 조각을 이 셀에 삽입합니다"
                  className="h-6 max-w-[152px] rounded border border-border bg-white px-1 text-[11px] text-body"
                >
                  <option value="">데이터 핸들링 ▾</option>
                  {WRANGLE_SNIPPET_GROUPS.map((g) => (
                    <optgroup key={g.id} label={g.label}>
                      {g.snippets.map((s) => (
                        <option key={s.id} value={`${g.id}::${s.id}`}>
                          {s.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {/* 그래프 삽입 — matplotlib 그래프 조각을 이 셀에 넣는다 */}
                <select
                  value=""
                  onChange={(e) => {
                    const [gid, sid] = e.target.value.split("::");
                    const grp = PLOT_SNIPPET_GROUPS.find((g) => g.id === gid);
                    const sn = grp?.snippets.find((s) => s.id === sid);
                    if (sn) insertSnippet(c.id, plotInsertCode(sn));
                    e.target.value = "";
                  }}
                  aria-label="그래프 삽입"
                  title="matplotlib 그래프 코드 조각을 이 셀에 삽입합니다"
                  className="h-6 max-w-[152px] rounded border border-border bg-white px-1 text-[11px] text-body"
                >
                  <option value="">그래프 ▾</option>
                  {PLOT_SNIPPET_GROUPS.map((g) => (
                    <optgroup key={g.id} label={g.label}>
                      {g.snippets.map((s) => (
                        <option key={s.id} value={`${g.id}::${s.id}`}>
                          {s.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {/* 취소 — 방금 삽입/입력을 되돌림(Ctrl+Z와 동일 undo 스택) */}
                <button
                  type="button"
                  onClick={() => undoCell(c.id)}
                  disabled={!c.undo || c.undo.length === 0}
                  title="방금 삽입·입력을 되돌립니다 (Ctrl+Z)"
                  aria-label="코드 되돌리기"
                  className={`${CELL_BTN} px-1.5`}
                >
                  ↶ 취소
                </button>
                {/* 변수 반영 — 앞에서 쓴 실제 변수 목록을 열어 그중 하나로 대체 */}
                <span className="relative inline-flex">
                  <button
                    type="button"
                    onClick={() => void openVarPicker(c.id)}
                    disabled={!!c.aiBusy}
                    title="앞 셀에서 만든 실제 변수 중 하나를 골라 이 셀의 변수를 대체합니다"
                    className={`${CELL_BTN} ${c.varPickerOpen ? "border-primary" : ""}`}
                  >
                    변수 반영 ▾
                  </button>
                  {c.varPickerOpen && c.varOptions && c.varOptions.length > 0 ? (
                    <span className="absolute left-0 top-full z-30 mt-1 flex min-w-[160px] flex-col rounded border border-border bg-white py-1 shadow-card-hover">
                      <span className="px-2.5 py-1 text-[10.5px] text-tertiary">
                        대체할 변수 선택
                      </span>
                      {c.varOptions.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => void runCellAssist(c.id, "vars", v)}
                          className="px-2.5 py-1 text-left font-mono text-[12px] text-foreground hover:bg-surface"
                        >
                          {v}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => void runCellAssist(c.id, "vars")}
                        className="mt-0.5 border-t border-border px-2.5 py-1 text-left text-[11.5px] text-primary hover:bg-surface"
                      >
                        AI 자동 선택
                      </button>
                    </span>
                  ) : null}
                </span>
                {/* 에러분석 — 팝업으로 안내, '반영' 시 원본을 '# 에러내용'으로 주석 + 수정본 */}
                <button
                  type="button"
                  onClick={() => void runErrorAnalysis(c.id)}
                  disabled={!!c.aiBusy || c.status !== "error"}
                  title={
                    c.status === "error"
                      ? "오류 내용과 수정안을 팝업으로 안내합니다(반영 여부 확인)"
                      : "오류가 있는 셀에서 사용할 수 있습니다"
                  }
                  className={`${CELL_BTN} ${
                    c.status === "error" ? "border-[#c4302b]/40 text-[#c4302b]" : ""
                  }`}
                >
                  에러분석
                </button>
                {/* AI 제안 — 우측 입력 영역을 활성화해 이 셀에 대한 요청을 받는다 */}
                <button
                  type="button"
                  onClick={() =>
                    patchCell(c.id, { aiInputOpen: !c.aiInputOpen, aiError: null })
                  }
                  disabled={!!c.aiBusy}
                  title="이 셀에 대한 수정·추가 요청을 입력하면 코드를 생성합니다"
                  className={`${CELL_BTN} text-primary ${
                    c.aiInputOpen ? "border-primary" : ""
                  }`}
                >
                  ✦ AI 제안
                </button>

                {c.aiInputOpen ? (
                  <span className="flex min-w-[200px] flex-1 items-center gap-1.5">
                    <input
                      type="text"
                      value={c.aiRequest ?? ""}
                      onChange={(e) =>
                        patchCell(c.id, { aiRequest: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void runCellAssist(c.id, "edit");
                        }
                      }}
                      autoFocus
                      placeholder="이 셀에 대한 요청 (예: 결측치 제거하고 상위 10개만)"
                      aria-label={`셀 ${i + 1} AI 요청`}
                      className="h-7 min-w-0 flex-1 rounded border border-border bg-white px-2 text-[12px] text-foreground placeholder:text-placeholder focus-visible:border-primary focus-visible:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void runCellAssist(c.id, "edit")}
                      disabled={!!c.aiBusy || !(c.aiRequest ?? "").trim()}
                      className="rounded bg-primary px-2 py-1 text-[11.5px] font-medium text-white hover:opacity-90 disabled:opacity-40"
                    >
                      생성
                    </button>
                    <button
                      type="button"
                      onClick={() => patchCell(c.id, { aiInputOpen: false })}
                      className={CELL_BTN}
                    >
                      취소
                    </button>
                  </span>
                ) : (
                  <span
                    className={`text-[11.5px] ${
                      c.status === "error" ? "text-[#c4302b]" : "text-tertiary"
                    }`}
                    role="status"
                  >
                    {c.aiBusy ? "AI 분석 중…" : cellStatusText(c)}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => addCellBelow(c.id)}
                    className={CELL_BTN}
                    title="현재 셀 바로 아래에 새 셀 추가"
                  >
                    + 셀(아래에)
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
                  const nextVal = e.target.value;
                  const now = Date.now();
                  const last = typingRef.current.get(c.id) ?? 0;
                  typingRef.current.set(c.id, now);
                  // 유휴 700ms 후 첫 입력에서만 스냅샷 → Ctrl+Z 되돌리기 단위(버스트)
                  const boundary = now - last > 700;
                  patchCell(
                    c.id,
                    boundary
                      ? { code: nextVal, undo: [...(c.undo ?? []), c.code].slice(-100) }
                      : { code: nextVal }
                  );
                  autoSize(e.currentTarget);
                }}
                onKeyDown={(e) => {
                  // 되돌리기(Ctrl+Z / Cmd+Z) — 컨트롤드 textarea라 커스텀 undo 스택 사용
                  if (
                    (e.ctrlKey || e.metaKey) &&
                    !e.shiftKey &&
                    (e.key === "z" || e.key === "Z")
                  ) {
                    e.preventDefault();
                    undoCell(c.id);
                    return;
                  }
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
                className="block min-h-[76px] w-full resize-none border-0 bg-[#2f3540] p-3 font-mono text-[12.5px] leading-[1.7] text-[#e9ecf1] caret-[#8ab4ff] placeholder:text-[#8a8f98] focus-visible:outline-none"
              />
              {c.output || c.images.length > 0 ? (
                <div className="border-t border-border">
                  {c.output ? (
                    <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap bg-surface px-3 py-3 font-mono text-[12px] leading-[1.65] text-foreground">
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
              ) : null}

              {c.aiError ? (
                <p className="border-t border-border px-3 py-2 text-[12px] text-[#c4302b]">
                  {c.aiError}
                </p>
              ) : null}

              {/* AI 제안 — 검토 후 적용/새 셀/닫기 */}
              {c.proposal ? (
                <div className="border-t-2 border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-primary">
                      ✦ AI 제안
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyProposal(c.id, "replace")}
                        className="rounded bg-primary px-2.5 py-1 text-[11.5px] font-medium text-white hover:opacity-90"
                      >
                        이 셀에 적용
                      </button>
                      <button
                        type="button"
                        onClick={() => applyProposal(c.id, "new")}
                        className={CELL_BTN}
                      >
                        아래 새 셀로
                      </button>
                      <button
                        type="button"
                        onClick={() => patchCell(c.id, { proposal: null })}
                        className={CELL_BTN}
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                  {c.proposal.explanation ? (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-body">
                      {c.proposal.explanation}
                    </p>
                  ) : null}
                  <pre className="mt-2 max-h-[300px] overflow-auto whitespace-pre-wrap rounded border border-border bg-[#2f3540] p-3 font-mono text-[12px] leading-[1.65] text-[#e9ecf1]">
                    {c.proposal.code}
                  </pre>
                </div>
              ) : null}
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
              <strong>작업 탭·셀·데이터는 이 브라우저에 자동 저장</strong>되어
              새로고침·브라우저 종료·PC 재부팅 뒤에도 그대로 복원됩니다. 서버로
              보내지 않으므로 <strong>기기·브라우저마다 별도</strong>로 유지됩니다
              (모바일·PC·다른 PC 각각). 단, 실행된 파이썬 변수는 메모리라 복원되지
              않으니 셀을 다시 실행하세요.
            </li>
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
              <strong>변수 초기화</strong>를 누르세요.
            </li>
            <li>
              코드를 불러오면 <strong>1단계(데이터 로드·describe 등 속성 확인)</strong>가
              먼저 한 셀로 분리되고, 특정 열 이름을 쓰는 <strong>분석 코드는 다음
              셀</strong>로 나뉩니다. 로드 셀에는 실제 열 이름이 자동으로 출력되니,
              그 결과를 보고 이후 셀의 열 이름·조건을 맞춘 뒤 실행하세요. 직접
              붙여넣을 때는 <strong># %%</strong> 줄로 셀 경계를 지정할 수 있습니다.
            </li>
            <li>
              <strong>✦ AI 도움(셀별)</strong> — <strong>변수 반영 ▾</strong>은 앞
              셀에서 만든 실제 변수 목록을 열어, 고른 변수로 이 셀의 변수를
              대체합니다(로직·열 이름은 유지). <strong>에러분석</strong>(오류
              셀에서 활성화)은 에러 내용과 수정안을 <strong>팝업</strong>으로
              안내하고, <strong>반영</strong>을 누르면 기존 셀은 위에 그대로 두고
              수정된 코드를 바로 아래 새 셀로 추가합니다.{" "}
              <strong>✦ AI 제안</strong>을 누르면
              오른쪽에 입력창이 열려, 이 셀에 대한 수정·추가 요청을 적으면 코드를
              생성합니다(검토 후 적용). 위의 <strong>AI에게 코드 요청</strong>은
              새 셀로 코드를 만들어 줍니다. AI에는 코드와 데이터의 열
              이름·자료형 요약만 전달되며 실제 데이터 값은 전송되지 않습니다.
            </li>
            <li>
              numpy · pandas · scipy · statsmodels · scikit-learn · matplotlib
              지원. lifelines·xgboost·lightgbm 등 일부 패키지는 브라우저에서
              실행되지 않습니다.
            </li>
            <li>
              <strong>데이터 불러오기</strong>는 세 가지입니다 —{" "}
              <strong>샘플 데이터셋</strong>(사이트에 호스팅된 policy·claims와
              계리용 experience·triangle·mortality_table.xlsx),{" "}
              <strong>내 파일 업로드</strong>, <strong>URL로 불러오기</strong>(CSV·XLSX
              링크). 모두 로드·속성 확인 셀(shape·columns·dtypes·head)이 자동으로
              만들어지니 먼저 실행해 열 이름을 확인하세요. 코드에서는 파일명을
              그대로 읽습니다. 사전 예제를 코드로 재현하려면{" "}
              <strong>분석 코드 불러오기 → 샘플 보험 데이터 생성</strong>도 있습니다.
            </li>
            <li>
              각 셀의 <strong>데이터 핸들링 ▾</strong> 콤보박스에서 Join(left/right
              등)·합치기·Split·Groupby·필터 같은 pandas 조각을 골라 그 셀에 바로
              삽입할 수 있습니다 — 삽입 코드 <strong>상단에 무슨 코드인지 설명
              주석(#)</strong>이 붙고, 중간에도 단계별 설명이 들어갑니다. 옆의{" "}
              <strong>↶ 취소</strong> 버튼이나 <strong>Ctrl+Z</strong>로 방금
              삽입·입력을 되돌릴 수 있습니다. 셀은 <strong>▲/▼</strong>로 순서를
              바꿀 수 있고, 왼쪽 번호는 위치, <strong>In [n]</strong>은 실행
              순서(색으로 실행 상태)입니다.
            </li>
            <li>
              각 셀의 <strong>그래프 ▾</strong> 콤보박스에서 matplotlib 그래프
              조각을 골라 삽입할 수 있습니다 — <strong>탐색(EDA)</strong>(히스토그램
              +KDE·박스/바이올린·산점도+회귀선·상관 히트맵·산점도 행렬)은 샘플
              <code>df</code> 기준이고, <strong>모델 진단</strong>(잔차·학습/검증곡선
              ·ROC·PR·캘리브레이션·리프트/게인)과 <strong>해석</strong>(변수 중요도·
              순열 중요도·PDP·ICE)은 <strong>자체 완결</strong>이라 조각 안에서 빠른
              모델까지 함께 적합합니다(이미 적합한 <code>model</code>이 있으면 조각
              첫 줄 안내대로 준비 블록만 지우세요).
            </li>
            <li>
              <strong>폴더에 저장</strong>은 analysis.py(셀을 # %% 구분자로 이은
              실행 가능한 스크립트) + workspace.json + 데이터 파일을 PC의 선택한
              폴더에 저장하고, <strong>폴더에서 불러오기</strong>는 셀 구성과
              데이터를 함께 복원합니다.
            </li>
          </ul>
        </div>

      {errModal ? (
        <ErrorFixModal
          state={errModal}
          onApply={applyErrModal}
          onClose={() => setErrModal(null)}
        />
      ) : null}
    </div>
  );
}

/* ─────────────── 에러분석 팝업 — 에러 안내 + 반영 확인 ─────────────── */

function ErrorFixModal({
  state,
  onApply,
  onClose,
}: {
  state: ErrModalState;
  onApply: () => void;
  onClose: () => void;
}) {
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
      aria-label="에러 분석"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:max-h-[84vh] sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-foreground">
              에러 분석
            </h2>
            <p className="mt-0.5 font-mono text-[12.5px] text-[#c4302b]">
              {state.errorSummary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-tertiary hover:text-foreground"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="text-[13px] font-semibold text-foreground">진단·수정 방향</h3>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-body">
            {state.explanation || "수정안을 준비했습니다. 아래 미리보기를 확인하세요."}
          </p>

          <h3 className="mt-4 text-[13px] font-semibold text-foreground">
            수정된 코드
          </h3>
          <p className="mt-0.5 text-[12px] text-tertiary">
            기존 셀은 위에 그대로 두고, 아래 수정된 코드를 바로 다음 새 셀로
            추가합니다.
          </p>
          <pre className="mt-2 max-h-[320px] overflow-auto whitespace-pre-wrap rounded border border-border bg-[#2f3540] p-3 font-mono text-[12px] leading-[1.65] text-[#e9ecf1]">
            {state.fixedCode.trim()}
          </pre>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button type="button" onClick={onClose} className={CELL_BTN}>
            닫기
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded bg-primary px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
          >
            반영
          </button>
        </footer>
      </div>
    </div>
  );
}
