// .ipynb(주피터 노트북) 읽기·쓰기 — nbformat 4 최소 구현.
// 실행기의 셀 모델(코드·마크다운 + 출력 텍스트·PNG)과 상호 변환한다.
// 주피터·코랩에서 만든 노트북을 셀 구성 그대로 열고, 다시 .ipynb로 저장해
// 원래 도구에서 이어서 쓸 수 있다(마크다운 셀·저장된 출력·In [n] 유지).

export interface NbCell {
  kind: "code" | "markdown";
  source: string;
  /** 코드 셀에 저장돼 있던 출력(stdout·실행 결과·트레이스백을 이어붙인 텍스트) */
  output?: string;
  /** 저장된 그림 — base64 PNG(접두사 없음, 실행기 images와 같은 형식) */
  images?: string[];
  /** In [n] 실행 순서 */
  execOrder?: number;
  /** 저장된 출력이 에러였는지 */
  error?: boolean;
}

/** 터미널 색상 이스케이프 — 트레이스백에 섞여 있어 화면 표시 전에 제거 */
const ANSI = new RegExp("\\u001b\\[[0-9;]*m", "g");

/** nbformat의 source·text는 문자열 또는 줄 배열(개행 포함) */
function txt(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").join("");
  return "";
}

export function parseIpynb(text: string): NbCell[] {
  const nb = JSON.parse(text) as { cells?: unknown };
  if (!Array.isArray(nb.cells)) throw new Error("셀(cells)이 없는 파일입니다.");

  return (nb.cells as Record<string, unknown>[]).map((c) => {
    const source = txt(c.source).replace(/\r\n/g, "\n");
    if (c.cell_type !== "code") return { kind: "markdown" as const, source };

    const out: string[] = [];
    const images: string[] = [];
    let error = false;
    const outputs = Array.isArray(c.outputs)
      ? (c.outputs as Record<string, unknown>[])
      : [];
    for (const o of outputs) {
      const data = (o.data ?? {}) as Record<string, unknown>;
      if (o.output_type === "stream") {
        out.push(txt(o.text));
      } else if (o.output_type === "execute_result" || o.output_type === "display_data") {
        const png = data["image/png"];
        if (typeof png === "string") images.push(png.replace(/\s/g, ""));
        const plain = txt(data["text/plain"]);
        if (plain) out.push(plain.endsWith("\n") ? plain : `${plain}\n`);
      } else if (o.output_type === "error") {
        error = true;
        // traceback은 줄 배열이지만 개행을 포함하지 않는 커널이 많다
        const tb = Array.isArray(o.traceback)
          ? (o.traceback as unknown[]).filter((x) => typeof x === "string").join("\n")
          : txt(o.traceback);
        out.push(
          (tb || `${String(o.ename ?? "Error")}: ${String(o.evalue ?? "")}`).replace(ANSI, "")
        );
      }
    }
    const n = c.execution_count;
    return {
      kind: "code" as const,
      source,
      output: out.join(""),
      images,
      error,
      execOrder: typeof n === "number" ? n : undefined,
    };
  });
}

/** 문자열 → nbformat 관례의 줄 배열(각 줄 끝에 개행, 마지막 줄은 개행 없음) */
function lines(s: string): string[] {
  if (!s) return [];
  const parts = s.split("\n");
  const out = parts.map((l, i) => (i < parts.length - 1 ? `${l}\n` : l));
  if (out[out.length - 1] === "") out.pop();
  return out;
}

function codeOutputs(c: NbCell): Record<string, unknown>[] {
  const outs: Record<string, unknown>[] = [];
  if (c.output?.trim()) {
    outs.push({
      output_type: "stream",
      name: c.error ? "stderr" : "stdout",
      text: lines(c.output),
    });
  }
  for (const b64 of c.images ?? []) {
    outs.push({
      output_type: "display_data",
      data: { "image/png": b64 },
      metadata: {},
    });
  }
  return outs;
}

export function toIpynb(cells: NbCell[]): string {
  return JSON.stringify(
    {
      cells: cells.map((c) =>
        c.kind === "markdown"
          ? { cell_type: "markdown", metadata: {}, source: lines(c.source) }
          : {
              cell_type: "code",
              execution_count: c.execOrder ?? null,
              metadata: {},
              outputs: codeOutputs(c),
              source: lines(c.source),
            }
      ),
      metadata: {
        kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
        language_info: { name: "python", version: "3.12" },
      },
      nbformat: 4,
      // 4.5부터 셀마다 id가 필수라 4로 쓴다(주피터·코랩 모두 읽는다)
      nbformat_minor: 4,
    },
    null,
    1
  );
}
