// /datalab 샘플 데이터셋 생성 — public/datalab/samples/
//   {policy,claims}.xlsx          : 사전 예제 열 스키마의 합성 보험 데이터(600행)
//   experience.xlsx               : 경험데이터(생존분석·위험률 산출용, ~800행)
//   triangle.xlsx                 : 런오프 누적 지급보험금 삼각형(지급준비금용, 2016~2023 × dev 1~8)
//   mortality_table.xlsx          : 생명표 qx(보험료 산출·보정용, 0~100세, Gompertz-Makeham 근사)
// 결정적 PRNG로 재현 가능(신규 3종은 별도 시드 스트림 — 기존 policy·claims 출력 불변).
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

// ── 신규 3종용 독립 PRNG 헬퍼(기존 rnd 스트림과 분리 — 기존 파일 출력 불변) ──
function rngHelpers(seed) {
  const r = mulberry32(seed);
  const uniform = (lo, hi) => lo + (hi - lo) * r();
  const randint = (lo, hi) => Math.floor(uniform(lo, hi + 1)); // [lo, hi]
  const choice = (items, weights) => {
    if (!weights) return items[Math.floor(r() * items.length)];
    const total = weights.reduce((a, b) => a + b, 0);
    let x = r() * total;
    for (let i = 0; i < items.length; i++) {
      x -= weights[i];
      if (x <= 0) return items[i];
    }
    return items[items.length - 1];
  };
  const normal = (mu = 0, sigma = 1) => {
    const u1 = Math.max(r(), 1e-12);
    const u2 = r();
    return mu + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const lognormal = (mu, sigma) => Math.exp(normal(mu, sigma));
  const exponential = (rate) => -Math.log(Math.max(r(), 1e-12)) / rate;
  return { r, uniform, randint, choice, normal, lognormal, exponential };
}

// ── Gompertz-Makeham 위험률 — 신규 3종 공용 ──────────────────────────────
// mu(x) = A + B·e^(g·x). 누적위험 H(t | 가입연령 e) = A·t + (B/g)·e^(g·e)·(e^(g·t) − 1)
const GM = {
  male: { A: 0.0005, B: 0.00007, g: Math.log(1.09) },
  female: { A: 0.00035, B: 0.00004, g: Math.log(1.09) },
};
/** 역변환 표본: H(t) = −ln(u) 를 이분법으로 풀어 사망까지 시간 t를 얻는다 */
function gmDeathTime(entryAge, u, { A, B, g }) {
  const target = -Math.log(Math.max(u, 1e-12));
  const H = (t) => A * t + (B / g) * Math.exp(g * entryAge) * (Math.exp(g * t) - 1);
  let lo = 0;
  let hi = 120;
  if (H(hi) < target) return hi; // 관찰 범위 밖(사실상 검열)
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (H(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ── experience.xlsx — 경험데이터(생존분석·위험률 산출용, ~800행) ────────────
// 사망시간은 Gompertz-Makeham(성별 모수 차이 → 연령·성별에 따라 사망률 상이),
// 검열은 중도해지(지수) vs 관찰종료(균등) 중 먼저 오는 쪽. event 1=사망, 0=검열.
const expRng = rngHelpers(2026);
const experience = [];
let expEvents = 0;
for (let i = 1; i <= 800; i++) {
  const sex = expRng.choice(["M", "F"]);
  const product = expRng.choice(["종신", "정기", "건강"], [0.4, 0.35, 0.25]);
  const entryAge = expRng.randint(25, 70);
  const tDeath = gmDeathTime(entryAge, expRng.r(), GM[sex === "M" ? "male" : "female"]);
  const tLapse = expRng.exponential(0.045); // 중도해지 — 평균 약 22년
  const tObsEnd = expRng.uniform(4, 16); // 관찰종료(계약별 관찰창)
  const tCensor = Math.min(tLapse, tObsEnd);
  const event = tDeath <= tCensor ? 1 : 0;
  const duration = Math.max(0.02, round(Math.min(tDeath, tCensor), 2));
  if (event === 1) expEvents++;
  experience.push({
    policy_id: `E${String(i).padStart(5, "0")}`,
    product,
    sex,
    entry_age: entryAge,
    duration_years: duration,
    event,
  });
}

// ── triangle.xlsx — 런오프 누적 지급보험금 삼각형(단위: 백만원) ─────────────
// accident_year(2016~2023) 행 × dev_1~dev_8 열. 누적 지급액(개발연도 진행에 따라 증가),
// 우하단(미래 개발연도)은 미관측 → 빈 셀.
const triRng = rngHelpers(777);
const DEV_PATTERN = [0.32, 0.58, 0.74, 0.84, 0.905, 0.95, 0.98, 1.0]; // 누적 지급 비율
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const triangle = YEARS.map((year, i) => {
  const ultimate = 5200 * Math.pow(1.06, i) * triRng.lognormal(0, 0.06); // 규모 추세 + 변동
  const row = { accident_year: year };
  let cum = 0;
  for (let j = 0; j < 8; j++) {
    const incr =
      ultimate * (DEV_PATTERN[j] - (j === 0 ? 0 : DEV_PATTERN[j - 1])) * triRng.lognormal(0, 0.08);
    cum += incr;
    // 사고연도 i(0=2016)는 dev 1~(8−i)까지만 관측 — 그 뒤는 빈 셀(null)
    row[`dev_${j + 1}`] = j < 8 - i ? Math.round(cum) : null;
  }
  return row;
});
// 누적 단조증가 검증(관측 셀)
for (const row of triangle) {
  let prev = -Infinity;
  for (let j = 1; j <= 8; j++) {
    const v = row[`dev_${j}`];
    if (v == null) continue;
    if (v <= prev) throw new Error(`triangle 누적 단조 위반: AY ${row.accident_year} dev_${j}`);
    prev = v;
  }
}

// ── mortality_table.xlsx — 생명표 qx(0~100세, Gompertz-Makeham 근사) ────────
// qx = 1 − exp(−∫ mu) = 1 − exp(−(A + (B/g)·e^(g·x)·(e^g − 1))). 결정적(난수 없음).
function gmQx(x, { A, B, g }) {
  return round(1 - Math.exp(-(A + (B / g) * Math.exp(g * x) * (Math.exp(g) - 1))), 6);
}
const mortality = [];
for (let age = 0; age <= 100; age++) {
  mortality.push({
    age,
    qx_male: gmQx(age, GM.male),
    qx_female: gmQx(age, GM.female),
  });
}
// 단조증가·범위 검증
for (const key of ["qx_male", "qx_female"]) {
  for (let i = 1; i < mortality.length; i++) {
    if (!(mortality[i][key] > mortality[i - 1][key]))
      throw new Error(`${key} 단조증가 위반: age ${mortality[i].age}`);
  }
  const last = mortality[mortality.length - 1][key];
  if (!(last > 0 && last < 1)) throw new Error(`${key} 범위 위반: ${last}`);
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
await writeSheet(experience, "experience.xlsx");
console.log(`    experience: 사망(event=1) ${expEvents}건 / ${experience.length}행`);
await writeSheet(triangle, "triangle.xlsx");
await writeSheet(mortality, "mortality_table.xlsx");
console.log("완료.");
