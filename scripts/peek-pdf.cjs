// PDF 앞부분 텍스트를 파일로 추출 (pdf-text-extract 스킬).
// pdf.js의 폰트 경고(console.log)를 억제하고, 결과만 output/_pdf_peek.txt에 기록.
// 사용: node scripts/peek-pdf.cjs <chars>   (content/exclusive-rights/*.pdf 전체)
const fs = require("fs");
const path = require("path");

// pdf.js 경고 억제
const origLog = console.log;
const origWarn = console.warn;
console.log = () => {};
console.warn = () => {};

const pdf = require("pdf-parse");

(async () => {
  const chars = parseInt(process.argv[2] || "1200", 10);
  const dir = "content/exclusive-rights";
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
  const out = [];
  for (const f of files) {
    const data = await pdf(fs.readFileSync(path.join(dir, f)));
    const text = (data.text || "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    out.push(`### ${f}\npages=${data.numpages} textLen=${text.length}\n---\n${text.slice(0, chars)}\n`);
  }
  fs.writeFileSync("output/_pdf_peek.txt", out.join("\n==========\n\n"));
  console.log = origLog;
  origLog("WROTE output/_pdf_peek.txt :", files.length, "files");
})();
