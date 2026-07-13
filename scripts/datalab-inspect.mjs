// DataLab 워크북 검사기 — 시트/행열수·헤더(1행)·수식·병합·VBA 유무 + 사용 함수 통계 JSON을 stdout 출력.
// 사용: node scripts/datalab-inspect.mjs <xlsx경로>
// datalab-publisher 스킬이 content 초안(레이아웃·keyFunctions·pythonAnalysis)을 작성하기 전 구조 파악에 사용.
// functions: 워크북 전체에서 사용된 함수명별 {count, samples[]} (샘플은 함수당 최대 3개 수식, 주소 포함).
// PY( 수식(Python in Excel)은 pythonCells로 별도 수집(코드 원문 포함) — 웹 저장본에선 소실되므로 원본에서 실행할 것.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const ExcelJS = require("exceljs");

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("사용: node scripts/datalab-inspect.mjs <xlsx경로>");
    process.exit(1);
  }

  const abs = path.resolve(target);
  let raw;
  try {
    raw = readFileSync(abs);
  } catch (e) {
    console.error("파일을 읽을 수 없습니다:", abs, "-", e.message);
    process.exit(1);
  }

  const ext = (abs.split(".").pop() || "").toLowerCase();
  // 확장자 또는 zip(xlsx/xlsm) 내부에 vbaProject.bin 존재 → VBA 매크로 포함
  const hasVBA = ext === "xlsm" || raw.includes(Buffer.from("vbaProject.bin"));

  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(raw);
  } catch (e) {
    console.error("xlsx 파싱 실패:", e.message);
    process.exit(1);
  }

  // 워크북 전체 함수 사용 통계 — 함수명(대문자) → { count, samples: ["Sheet!A1: =수식", …] }
  const functions = {};
  const pythonCells = [];
  const FN_RE = /([A-Z][A-Z0-9_.]*)\s*\(/gi;
  // 신형 함수 내부 표기(_xlfn.XLOOKUP, _xlws.FILTER 등) → 표시 함수명으로 정규화
  function normalizeFnName(raw) {
    let n = raw.toUpperCase();
    while (/^(XLFN\.|XLWS\.|XLPM\.|_)/.test(n)) {
      n = n.replace(/^(XLFN\.|XLWS\.|XLPM\.|_)/, "");
    }
    return n;
  }
  function tallyFormula(sheetName, address, formula) {
    const f = String(formula);
    const seenInCell = new Set();
    let m;
    FN_RE.lastIndex = 0;
    while ((m = FN_RE.exec(f)) !== null) {
      const name = normalizeFnName(m[1]);
      if (!name) continue;
      if (seenInCell.has(name)) continue;
      seenInCell.add(name);
      if (!functions[name]) functions[name] = { count: 0, samples: [] };
      functions[name].count++;
      if (functions[name].samples.length < 3) {
        functions[name].samples.push(
          `${sheetName}!${address}: =${f.length > 160 ? f.slice(0, 160) + "…" : f}`
        );
      }
    }
    // Python in Excel — =PY("code";…) 셀은 코드 원문을 별도 수집(_xlfn 표기 포함)
    if (/^(?:_xl\w+\.)*PY\s*\(/i.test(f.trim())) {
      pythonCells.push({ sheet: sheetName, address, formula: f.slice(0, 2000) });
    }
  }

  const sheets = wb.worksheets.map((ws) => {
    const colCount = ws.columnCount || 0;
    const rowCount = ws.rowCount || 0;

    // 헤더(1행) 값
    const headers = [];
    if (rowCount > 0) {
      const first = ws.getRow(1);
      for (let c = 1; c <= colCount; c++) {
        const t = first.getCell(c).text;
        headers.push(t === undefined || t === null ? "" : String(t).trim());
      }
    }

    // 수식 개수 + 함수 사용 집계
    let formulaCount = 0;
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.formula) {
          formulaCount++;
          tallyFormula(ws.name, cell.address, cell.formula);
        }
      });
    });

    // 병합 개수 (_merges는 master 주소로 키잉 → 병합 1개당 1항목)
    const mergeCount = ws._merges ? Object.keys(ws._merges).length : 0;

    return {
      name: ws.name,
      rowCount,
      colCount,
      headers,
      formulaCount,
      mergeCount,
    };
  });

  const result = {
    file: path.basename(abs),
    ext,
    hasVBA,
    sheetCount: sheets.length,
    sheets,
    // 사용 빈도 내림차순 함수 목록 — keyFunctions 작성의 근거
    functions: Object.fromEntries(
      Object.entries(functions).sort((a, b) => b[1].count - a[1].count)
    ),
    pythonCells,
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((e) => {
  console.error("검사 실패:", e && e.message ? e.message : e);
  process.exit(1);
});
