// 클라이언트 전용: Pyodide(WebAssembly 파이썬) 실행 래퍼 — /datalab 파이썬 실행기.
// 런타임은 CDN에서 최초 실행 시 1회 로드(이후 브라우저 캐시), 패키지는 코드의
// import 문을 보고 필요한 것만 로딩한다(가볍게 동작). 모든 실행·데이터는
// 브라우저 안에서만 처리되며 서버로 전송되지 않는다.

const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/";

/** 최소 Pyodide 타입 — 공식 타입 패키지 없이 사용하는 표면만 정의 */
interface PyProxyLike {
  toString(): string;
  toJs?: () => unknown;
  destroy?: () => void;
}

interface PyodideAPI {
  runPythonAsync(
    code: string,
    options?: { globals?: unknown; locals?: unknown }
  ): Promise<unknown>;
  loadPackagesFromImports(code: string): Promise<unknown>;
  loadPackage(pkg: string | string[]): Promise<unknown>;
  pyimport(name: string): { install(pkg: string): Promise<void> };
  setStdout(opts: { batched: (s: string) => void }): void;
  setStderr(opts: { batched: (s: string) => void }): void;
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
    readdir(path: string): string[];
    stat(path: string): { size: number };
  };
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideAPI>;
  }
}

export type RunPhase = "boot" | "pkg" | "run";

/** 실행기가 데이터 파일로 취급하는 확장자 */
export const DATA_EXTENSIONS = [".csv", ".xlsx", ".xls", ".txt", ".json"];

export function isDataFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return DATA_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

let pyodidePromise: Promise<PyodideAPI> | null = null;

async function loadScript(src: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("pyodide_script_load_failed"));
    document.head.appendChild(s);
  });
}

/** Pyodide 싱글턴 — 최초 1회 로드 후 재사용(재실행이 가벼운 이유). */
export async function getPyodide(): Promise<PyodideAPI> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      if (!window.loadPyodide) await loadScript(`${PYODIDE_INDEX_URL}pyodide.js`);
      if (!window.loadPyodide) throw new Error("pyodide_unavailable");
      const py = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
      // 부트스트랩: matplotlib은 화면 없는 AGG 백엔드로, 비대화형 경고는 숨김
      await py.runPythonAsync(
        [
          "import os, warnings",
          'os.environ["MPLBACKEND"] = "AGG"',
          'warnings.filterwarnings("ignore", message=".*non-interactive.*")',
          'warnings.filterwarnings("ignore", message=".*non-GUI backend.*")',
          'warnings.filterwarnings("ignore", message=".*cannot show the figure.*")',
          // 배포 예정 경고(Pyarrow 등)·미래 변경 경고는 학습용 실행에서 노이즈 → 숨김.
          // (Pyarrow 메시지가 개행으로 시작해 message 정규식으로는 안 잡혀 카테고리로 억제)
          'warnings.filterwarnings("ignore", category=DeprecationWarning)',
          'warnings.filterwarnings("ignore", category=FutureWarning)',
        ].join("\n")
      );
      return py;
    })().catch((e) => {
      pyodidePromise = null; // 실패 시 다음 시도에서 재로드
      throw e;
    });
  }
  return pyodidePromise;
}

/** 이미 로드됐는지(로딩 시작 여부) — UI 안내용 */
export function isPyodideRequested(): boolean {
  return pyodidePromise !== null;
}

/**
 * 실행기 '작업 탭'별 독립 네임스페이스 — 탭마다 자기만의 globals 딕셔너리를 쓴다.
 * 같은 Pyodide 런타임(모듈 캐시·가상 FS)은 공유하되, 변수(df 등)는 탭 사이에 섞이지
 * 않는다. nsKey가 없으면(기존 호출) 메인 globals에서 실행한다.
 */
const namespaces = new Map<string, PyProxyLike>();

async function getNamespaceGlobals(
  py: PyodideAPI,
  nsKey: string
): Promise<PyProxyLike> {
  let ns = namespaces.get(nsKey);
  if (!ns) {
    ns = (await py.runPythonAsync("dict()")) as PyProxyLike;
    namespaces.set(nsKey, ns);
  }
  return ns;
}

/** 작업 탭의 네임스페이스를 비운다(변수 초기화·탭 닫기·리셋). 런타임·FS는 유지. */
export function resetNamespace(nsKey: string): void {
  const ns = namespaces.get(nsKey);
  try {
    ns?.destroy?.();
  } catch {
    // 이미 파괴된 프록시 등은 무시
  }
  namespaces.delete(nsKey);
}

/**
 * Excel 입출력 지원(openpyxl) 보장 — 한 번만 설치.
 * 이 Pyodide 배포는 openpyxl을 loadPackage 번들로 제공하지 않을 수 있어(빌드마다
 * 다름) micropip로 PyPI에서 설치하는 경로를 폴백으로 둔다. 실패는 호출부로 던져
 * 사용자에게 명확한 오류를 보여 준다(조용한 실패 금지 — 파일이 안 만들어지는 원인).
 */
let excelReady: Promise<void> | null = null;
export async function ensureExcelSupport(py: PyodideAPI): Promise<void> {
  if (!excelReady) {
    excelReady = (async () => {
      try {
        await py.loadPackage("openpyxl");
        // 번들에 있더라도 import 가능해야 성공으로 간주
        await py.runPythonAsync("import openpyxl");
        return;
      } catch {
        // 번들 로더 실패 → micropip 폴백
      }
      await py.loadPackage("micropip");
      const micropip = py.pyimport("micropip");
      await micropip.install("openpyxl");
      await py.runPythonAsync("import openpyxl");
    })().catch((e) => {
      excelReady = null; // 실패 시 다음 실행에서 재시도
      throw e;
    });
  }
  return excelReady;
}

/** 데이터 파일을 Pyodide 가상 파일시스템(작업 디렉터리)에 기록 */
export function writeDataFile(py: PyodideAPI, name: string, bytes: Uint8Array): void {
  py.FS.writeFile(name, bytes);
}

/**
 * matplotlib 한글 폰트(나눔고딕) 보장 — 한 번만 등록.
 * Pyodide 기본 matplotlib은 DejaVu Sans만 있어 차트 제목·라벨의 한글이 □(두부)로
 * 깨진다. public/fonts/의 나눔고딕(OFL)을 같은 출처에서 받아 가상 FS에 쓰고
 * font_manager에 등록한 뒤 rcParams 기본 폰트로 지정한다. NanumGothic에 없는
 * 유니코드 마이너스(U+2212)는 DejaVu Sans 폴백 + axes.unicode_minus=False로 처리.
 * 확장자가 .ttf라 listFsDataFiles(데이터 파일 목록)에는 잡히지 않는다.
 */
const KOREAN_FONT_FILE = "NanumGothic-Regular.ttf";
let koreanFontReady: Promise<void> | null = null;
export async function ensureKoreanFont(py: PyodideAPI): Promise<void> {
  if (!koreanFontReady) {
    koreanFontReady = (async () => {
      const res = await fetch(`/fonts/${KOREAN_FONT_FILE}`);
      if (!res.ok) throw new Error(`korean_font_fetch_failed_${res.status}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      py.FS.writeFile(KOREAN_FONT_FILE, bytes);
      await py.runPythonAsync(
        [
          "import matplotlib",
          "from matplotlib import font_manager as _fm",
          `_fm.fontManager.addfont(${JSON.stringify(KOREAN_FONT_FILE)})`,
          "import matplotlib.pyplot as _plt",
          // 나눔고딕 우선 + DejaVu Sans 폴백(라틴·마이너스 글리프)
          '_plt.rcParams["font.family"] = ["NanumGothic", "DejaVu Sans"]',
          '_plt.rcParams["axes.unicode_minus"] = False',
        ].join("\n")
      );
    })().catch((e) => {
      koreanFontReady = null; // 실패 시 다음 실행에서 재시도(폰트 없이도 코드는 실행)
      throw e;
    });
  }
  return koreanFontReady;
}

/**
 * 현재 세션의 데이터 스키마를 수집한다 — 로드된 DataFrame/Series 변수의
 * 열 이름·자료형·크기와 작업 폴더의 데이터 파일 목록(JSON 문자열).
 * AI 어시스턴트가 '앞의 데이터'를 읽고 실제 열 이름으로 코드를 쓰도록 하는 컨텍스트.
 * 아직 아무것도 실행되지 않았으면 파일 목록만(또는 빈 값) 반환.
 */
export async function collectDataSchema(nsKey?: string): Promise<string> {
  if (!isPyodideRequested()) return '{"vars":{},"files":[]}';
  const py = await getPyodide();
  const runOpts = nsKey
    ? { globals: await getNamespaceGlobals(py, nsKey) }
    : undefined;
  const snippet = [
    "import json as _json",
    "def _collect_schema():",
    "    import os",
    "    out = {}",
    "    try:",
    "        import pandas as pd",
    "        g = globals()",
    "        for k in list(g.keys()):",
    "            if k.startswith('_'):",
    "                continue",
    "            v = g.get(k)",
    "            try:",
    "                if isinstance(v, pd.DataFrame):",
    "                    out[k] = {",
    '                        "shape": list(v.shape),',
    '                        "columns": [str(c) for c in v.columns][:80],',
    '                        "dtypes": {str(c): str(t) for c, t in list(v.dtypes.items())[:80]},',
    "                    }",
    "                elif isinstance(v, pd.Series):",
    '                    out[k] = {"series_dtype": str(v.dtype), "len": int(v.shape[0])}',
    "            except Exception:",
    "                pass",
    "    except Exception:",
    "        pass",
    "    try:",
    "        files = [f for f in os.listdir('.') if not f.startswith('.')]",
    "    except Exception:",
    "        files = []",
    '    return _json.dumps({"vars": out, "files": files}, ensure_ascii=False)',
    "_collect_schema()",
  ].join("\n");
  try {
    const res = await py.runPythonAsync(snippet, runOpts);
    return typeof res === "string" ? res : String(res);
  } catch {
    return '{"vars":{},"files":[]}';
  }
}

/** 작업 디렉터리의 데이터 파일 목록(폴더 저장용) — 코드로 생성된 파일 포함 */
export function listFsDataFiles(py: PyodideAPI): { name: string; bytes: Uint8Array }[] {
  const out: { name: string; bytes: Uint8Array }[] = [];
  for (const name of py.FS.readdir(".")) {
    if (name === "." || name === "..") continue;
    if (!isDataFileName(name)) continue;
    try {
      out.push({ name, bytes: py.FS.readFile(name) });
    } catch {
      // 디렉터리 등 읽기 불가 항목은 건너뜀
    }
  }
  return out;
}

export interface RunResult {
  /** matplotlib 그림들(PNG base64) */
  images: string[];
  /** 실행 소요(ms) — 패키지 로딩 제외 */
  elapsedMs: number;
}

/**
 * 파이썬 코드 실행 — stdout/stderr는 onOutput으로 스트리밍, 마지막 표현식 값은
 * None이 아니면 repr로 출력, matplotlib 그림은 PNG로 수집해 반환한다.
 * 오류(트레이스백)는 예외로 던져진다(메시지에 트레이스백 포함).
 */
export async function runPythonCode(
  code: string,
  onOutput: (s: string) => void,
  onPhase: (p: RunPhase) => void,
  nsKey?: string
): Promise<RunResult> {
  onPhase("boot");
  const py = await getPyodide();
  // 작업 탭별 네임스페이스(있으면) — 없으면 메인 globals에서 실행
  const runOpts = nsKey
    ? { globals: await getNamespaceGlobals(py, nsKey) }
    : undefined;

  onPhase("pkg");
  try {
    await py.loadPackagesFromImports(code);
  } catch {
    // 미지원 패키지는 실행 시 ImportError로 표면화 — 여기서는 무시
  }
  // pandas의 엑셀 입출력은 openpyxl을 지연 import — 코드가 엑셀을 다루면 선로딩.
  // 실패는 던져서 사용자에게 노출(조용히 넘기면 파일이 안 만들어져 원인 파악 불가).
  if (/read_excel|to_excel|ExcelWriter|\.xlsx|\.xls\b/.test(code)) {
    await ensureExcelSupport(py);
  }
  // pandas의 스피어만·켄달 상관은 내부적으로 scipy를 지연 import한다.
  // 코드에 scipy import가 없어도(=.corr(method="spearman") 등) 미리 로드해 둔다.
  if (/method\s*=\s*["'](spearman|kendall)["']/.test(code)) {
    try {
      await py.loadPackage("scipy");
    } catch {
      // 로드 실패 시 실행 단계에서 ImportError로 표면화
    }
  }
  // matplotlib을 쓰면 한글 폰트를 등록해 차트 제목·라벨의 한글 깨짐(□)을 막는다.
  // 폰트 등록 실패(네트워크 등)는 무시 — 폰트 없이도 코드는 정상 실행되어야 한다.
  if (/matplotlib|pyplot/.test(code)) {
    try {
      await ensureKoreanFont(py);
    } catch {
      // 폰트 미등록 시 한글은 □로 나오지만 실행은 계속
    }
  }

  py.setStdout({ batched: (s) => onOutput(`${s}\n`) });
  py.setStderr({ batched: (s) => onOutput(`${s}\n`) });

  onPhase("run");
  const t0 = performance.now();
  const result = await py.runPythonAsync(code, runOpts);
  const elapsedMs = performance.now() - t0;

  if (result !== undefined && result !== null) {
    const proxy = result as PyProxyLike;
    const text =
      typeof result === "object" ? proxy.toString() : String(result);
    if (text && text !== "None") onOutput(`${text}\n`);
    if (typeof result === "object") proxy.destroy?.();
  }

  // matplotlib 그림 수집(있을 때만) — AGG 백엔드라 화면 대신 PNG로 반환
  const figProxy = (await py.runPythonAsync(
    [
      "import sys",
      "_pngs = []",
      'if "matplotlib" in sys.modules:',
      "    import base64, io",
      "    import matplotlib.pyplot as plt",
      "    for _n in plt.get_fignums():",
      "        _buf = io.BytesIO()",
      '        plt.figure(_n).savefig(_buf, format="png", dpi=110, bbox_inches="tight")',
      '        _pngs.append(base64.b64encode(_buf.getvalue()).decode("ascii"))',
      '    plt.close("all")',
      "_pngs",
    ].join("\n")
  )) as PyProxyLike;
  let images: string[] = [];
  if (figProxy && typeof figProxy === "object") {
    images = (figProxy.toJs?.() as string[]) ?? [];
    figProxy.destroy?.();
  }

  return { images, elapsedMs };
}
