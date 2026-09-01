// lib/sheetCsv.ts 자체 점검 — node scripts/test-sheetcsv.mjs
// 엑셀 붙여넣기(TSV)·CSV(따옴표 안 콤마/줄바꿈)·JSON·그리드 정리·CSV 왕복을 확인한다.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";

const src = readFileSync(new URL("../lib/sheetCsv.ts", import.meta.url), "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const tmp = join(mkdtempSync(join(tmpdir(), "sheetcsv-")), "sheetCsv.mjs");
writeFileSync(tmp, js);
const { parseDelimited, rowsFromText, toCsv, trimGrid } = await import(
  `file://${tmp.replace(/\\/g, "/")}`
);

// 1) 엑셀 복사 = TSV. 값 안의 콤마가 열을 쪼개면 안 된다.
assert.deepEqual(parseDelimited("이름\t금액\n김,철수\t1,200"), [
  ["이름", "금액"],
  ["김,철수", "1,200"],
]);

// 2) CSV — 따옴표 안의 콤마·줄바꿈·"" 이스케이프
assert.deepEqual(parseDelimited('a,b\n"x,1","he said ""hi""\ny"'), [
  ["a", "b"],
  ["x,1", 'he said "hi"\ny'],
]);

// 3) 짧은 행은 빈 칸으로 채워 길이를 맞춘다(표로 그릴 때 어긋나지 않게)
assert.deepEqual(parseDelimited("a,b,c\n1,2"), [
  ["a", "b", "c"],
  ["1", "2", ""],
]);

// 4) 세미콜론 CSV(유럽 엑셀)
assert.deepEqual(parseDelimited("a;b\n1;2"), [
  ["a", "b"],
  ["1", "2"],
]);

// 5) JSON records / columns (pandas to_json)
assert.deepEqual(rowsFromText("d.json", '[{"age":40,"sex":"M"},{"age":51,"sex":"F"}]'), [
  ["age", "sex"],
  ["40", "M"],
  ["51", "F"],
]);
assert.deepEqual(rowsFromText("d.json", '{"age":{"0":40,"1":51}}'), [
  ["age"],
  ["40"],
  ["51"],
]);

// 6) 그리드 정리 — 끝의 빈 행·빈 열 제거
assert.deepEqual(
  trimGrid([
    ["a", "b", "", ""],
    ["1", "2", "", ""],
    ["", "", "", ""],
  ]),
  [
    ["a", "b"],
    ["1", "2"],
  ]
);

// 7) CSV 왕복 — 콤마·따옴표·줄바꿈이 든 값이 그대로 돌아온다
const grid = [
  ["상품", "메모"],
  ["종신,정기", '따옴표 "포함"'],
  ["암보험", "두 줄\n메모"],
];
assert.deepEqual(parseDelimited(toCsv(grid), ","), grid);

// 8) 한글 헤더 + 빈 값
assert.deepEqual(parseDelimited("가입금액_구분,건수\n1억,\n2억,3"), [
  ["가입금액_구분", "건수"],
  ["1억", ""],
  ["2억", "3"],
]);

console.log("sheetCsv 점검 통과 (8/8)");
