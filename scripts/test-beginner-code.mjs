// 초급 코드 실행 검증 — lib/beginnerCode/*.ts 의 모든 항목을 로컬 파이썬으로 실행한다.
// 사용: node scripts/test-beginner-code.mjs [파일명필터(예: plot)] [id필터]
// 분석 방법은 블록을 순서대로 한 프로세스에서(실행기 셀 순차 실행과 동일),
// 그래프·핸들링 조각은 df(policy)·policy·claims를 미리 만든 뒤 실행한다.
import { spawn } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const [fileFilter, idFilter] = process.argv.slice(2);
const files = { methodsStat: "m", methodsMl: "m", methodsAct: "m", wrangle: "s", plot: "s" };

const dir = mkdtempSync(join(tmpdir(), "beginner-"));
for (const f of readdirSync(join(root, "public/datalab/samples")))
  cpSync(join(root, "public/datalab/samples", f), join(dir, f));

const SETUP = `import pandas as pd
pd.read_excel("policy.xlsx").to_csv("data.csv", index=False)
pd.read_excel("policy.xlsx").to_excel("data.xlsx", index=False)
pd.read_excel("policy.xlsx").head(20).to_json("data.json", orient="records", force_ascii=False)
`;
const MPL = `import matplotlib\nmatplotlib.use("Agg")\nimport warnings\nwarnings.filterwarnings("ignore")\n`;
const DF = `import pandas as pd\ndf = pd.read_excel("policy.xlsx")\npolicy = df.copy()\nclaims = pd.read_excel("claims.xlsx")\n`;

function runPy(code) {
  return new Promise((res) => {
    const p = spawn("python", ["-"], {
      cwd: dir,
      env: { ...process.env, PYTHONIOENCODING: "utf-8", MPLBACKEND: "Agg" },
    });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.stdout.on("data", () => {});
    const t = setTimeout(() => p.kill(), 180000);
    p.on("close", (c) => {
      clearTimeout(t);
      res({ ok: c === 0, err });
    });
    p.stdin.end(code);
  });
}

await runPy(SETUP);
const jobs = [];
for (const [f, kind] of Object.entries(files)) {
  if (fileFilter && !f.toLowerCase().includes(fileFilter.toLowerCase())) continue;
  const { DATA } = await import(pathToFileURL(join(root, "lib/beginnerCode", f + ".ts")).href);
  for (const [id, blocks] of Object.entries(DATA)) {
    if (idFilter && id !== idFilter) continue;
    const body = blocks.map((b) => b.code).join("\n\n");
    jobs.push({ key: `${f}:${id}`, code: MPL + (kind === "s" ? DF : "") + body, blocks });
  }
}

let fail = 0;
const lint = [];
for (const j of jobs) {
  for (const b of j.blocks) {
    const lines = b.code.trim().split("\n").length;
    if (lines > 16) lint.push(`${j.key} "${b.title}" ${lines}줄`);
  }
}
const POOL = 6;
let i = 0;
await Promise.all(
  Array.from({ length: POOL }, async () => {
    while (i < jobs.length) {
      const j = jobs[i++];
      const r = await runPy(j.code);
      if (!r.ok) {
        fail++;
        console.log(`FAIL ${j.key}\n${r.err.split("\n").slice(-6).join("\n")}`);
      }
    }
  })
);
console.log(`\n${jobs.length - fail}/${jobs.length} ok`);
if (lint.length) console.log(`길이 경고(>16줄):\n  ${lint.join("\n  ")}`);
process.exit(fail ? 1 : 0);
