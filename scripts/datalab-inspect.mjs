// DataLab 워크북 검사기 — 시트/행열수·헤더(1행)·수식·병합·VBA 유무 요약 JSON을 stdout 출력.
// 사용: node scripts/datalab-inspect.mjs <xlsx경로>
// datalab-publisher 스킬이 content 초안을 작성하기 전 데이터 구조를 파악하는 데 사용.
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

    // 수식 개수
    let formulaCount = 0;
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (cell.formula) formulaCount++;
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
  };

  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

main().catch((e) => {
  console.error("검사 실패:", e && e.message ? e.message : e);
  process.exit(1);
});
