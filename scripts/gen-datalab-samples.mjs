// /datalab 샘플 데이터셋 생성 — public/datalab/samples/{policy,claims}.xlsx
// 실행기 '샘플 데이터셋 불러오기'와 사전 예제(policy.xlsx·claims.xlsx)의 열 스키마를
// 그대로 갖춘 합성 보험 데이터(600행). 결정적 PRNG로 재현 가능.
//   node scripts/gen-datalab-samples.mjs
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "datalab", "samples");
const N = 600;

// ── 결정적 PRNG(mulberry32) ─────────────────────────────────────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const uniform = (lo, hi) => lo + (hi - lo) * rnd();
const randint = (lo, hi) => Math.floor(uniform(lo, hi + 1)); // [lo, hi]
function choice(items, weights) {
  if (!weights) return items[Math.floor(rnd() * items.length)];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
// 표준정규(Box-Muller)
function normal(mu = 0, sigma = 1) {
  const u1 = Math.max(rnd(), 1e-12);
  const u2 = rnd();
  return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
// 정수 shape 감마 = 지수합 (scale)
function gamma(shape, scale) {
  let s = 0;
  for (let i = 0; i < shape; i++) s += -Math.log(Math.max(rnd(), 1e-12));
  return s * scale;
}
const lognormal = (mu, sigma) => Math.exp(normal(mu, sigma));
function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rnd();
  } while (p > L);
  return k - 1;
}
const round = (x, digits = 0) => {
  const f = Math.pow(10, digits);
  return Math.round(x * f) / f;
};
function ageBand(age) {
  if (age < 30) return "20대";
  if (age < 40) return "30대";
  if (age < 50) return "40대";
  if (age < 60) return "50대";
  return "60+";
}

// ── 행 생성 ──────────────────────────────────────────────────────────────
const policy = [];
const claims = [];
for (let i = 1; i <= N; i++) {
  const product = choice(["종신", "정기", "암보험", "건강"], [0.35, 0.25, 0.2, 0.2]);
  const channel = choice(["설계사", "방카", "다이렉트"], [0.5, 0.3, 0.2]);
  const region = choice(["서울", "경기", "부산", "기타"]);
  const sex = choice(["M", "F"]);
  const age = randint(20, 74);
  const band = ageBand(age);
  const premium = round(gamma(3, 30000), -2);
  const bmi = round(normal(23.5, 3.2), 1);
  const dependents = randint(0, 3);
  const income = rnd() < 0.12 ? null : round(gamma(4, 120000), -3);
  const tenure = randint(1, 239);
  const nContracts = randint(1, 4);
  const lapsed = rnd() < 0.18;

  policy.push({
    policy_id: `P${String(i).padStart(5, "0")}`,
    customer_id: `C${String(randint(1, 399)).padStart(5, "0")}`,
    product,
    channel,
    region,
    sex,
    age,
    premium,
    bmi,
    dependents,
    income,
    tenure_months: tenure,
    n_contracts: nContracts,
    lapsed,
    age_band: band,
  });

  claims.push({
    policy_id: `P${String(i).padStart(5, "0")}`,
    product,
    channel,
    sex,
    age,
    age_band: band,
    region,
    claim_amt: round(lognormal(13.2, 0.9), -3),
    claim_cnt: poisson(0.8),
    prem_before: premium,
    prem_after: round(premium * normal(1.05, 0.08), -2),
  });
}
// premium_ratio: 결측 income은 중앙값으로 대체 후 계산(예제와 동일)
const incomes = policy.map((p) => p.income).filter((v) => v != null).sort((a, b) => a - b);
const medIncome = incomes[Math.floor(incomes.length / 2)];
for (const p of policy) {
  p.premium_ratio = round(p.premium / (p.income ?? medIncome), 3);
}

// ── xlsx 쓰기 ────────────────────────────────────────────────────────────
async function writeSheet(rows, file) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sheet1");
  ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k }));
  for (const r of rows) ws.addRow(r);
  const path = resolve(OUT_DIR, file);
  await wb.xlsx.writeFile(path);
  console.log(`  ${file}: ${rows.length}행 × ${ws.columns.length}열 → ${path}`);
}

mkdirSync(OUT_DIR, { recursive: true });
console.log("샘플 데이터 생성:");
await writeSheet(policy, "policy.xlsx");
await writeSheet(claims, "claims.xlsx");
console.log("완료.");
