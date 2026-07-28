// lib/ipynb.ts 자체 점검 — node _workspace/test-ipynb.mjs
// 주피터가 실제로 쓰는 형태(줄 배열 source, stream·execute_result·display_data·error 출력)를
// 읽어 셀 모델로 바꾸고, 다시 .ipynb로 써서 왕복이 깨지지 않는지 확인한다.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const src = readFileSync(new URL("../lib/ipynb.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = join(mkdtempSync(join(tmpdir(), "ipynb-")), "ipynb.mjs");
writeFileSync(tmp, js);
const { parseIpynb, toIpynb } = await import(`file://${tmp.replace(/\\/g, "/")}`);

const NB = {
  cells: [
    { cell_type: "markdown", metadata: {}, source: ["# 제목\n", "설명 문장"] },
    {
      cell_type: "code",
      execution_count: 3,
      metadata: {},
      source: ["import pandas as pd\n", "df.head()"],
      outputs: [
        { output_type: "stream", name: "stdout", text: ["행·열: (600, 16)\n"] },
        {
          output_type: "execute_result",
          execution_count: 3,
          data: { "text/plain": ["   age  premium\n", "0   41    12000"] },
          metadata: {},
        },
        { output_type: "display_data", data: { "image/png": "iVBORw0KGgo=" }, metadata: {} },
      ],
    },
    {
      cell_type: "code",
      execution_count: 4,
      metadata: {},
      source: ["df['없는열']"],
      outputs: [
        {
          output_type: "error",
          ename: "KeyError",
          evalue: "'없는열'",
          traceback: ["[31mKeyError[0m: '없는열'"],
        },
      ],
    },
    { cell_type: "code", execution_count: null, metadata: {}, source: [], outputs: [] },
  ],
  metadata: {},
  nbformat: 4,
  nbformat_minor: 4,
};

const cells = parseIpynb(JSON.stringify(NB));
assert.equal(cells.length, 4);

assert.equal(cells[0].kind, "markdown");
assert.equal(cells[0].source, "# 제목\n설명 문장");

assert.equal(cells[1].kind, "code");
assert.equal(cells[1].source, "import pandas as pd\ndf.head()");
assert.equal(cells[1].execOrder, 3);
assert.equal(cells[1].output, "행·열: (600, 16)\n   age  premium\n0   41    12000\n");
assert.deepEqual(cells[1].images, ["iVBORw0KGgo="]);
assert.equal(cells[1].error, false);

assert.equal(cells[2].error, true);
assert.equal(cells[2].output, "KeyError: '없는열'", "ANSI 색상코드가 제거돼야 한다");

assert.equal(cells[3].source, "");

// 왕복: 다시 .ipynb로 써서 파싱하면 같은 셀 모델이어야 한다
const round = parseIpynb(toIpynb(cells));
assert.deepEqual(
  round.map((c) => ({ kind: c.kind, source: c.source, output: c.output, images: c.images })),
  cells.map((c) => ({ kind: c.kind, source: c.source, output: c.output, images: c.images }))
);
assert.equal(round[1].execOrder, 3);

// 주피터가 읽을 수 있는 최소 형태인지
const out = JSON.parse(toIpynb(cells));
assert.equal(out.nbformat, 4);
assert.deepEqual(out.cells[0].source, ["# 제목\n", "설명 문장"]);
assert.equal(out.cells[1].outputs[1].data["image/png"], "iVBORw0KGgo=");
assert.equal(out.cells[3].execution_count, null);

// 잘못된 파일은 명확히 실패
assert.throws(() => parseIpynb('{"foo":1}'), /cells/);

console.log("ok — ipynb 왕복 6종 통과");
