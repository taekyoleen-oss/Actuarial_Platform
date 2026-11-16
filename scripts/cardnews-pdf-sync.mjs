// 바뀐 카드뉴스만 PDF 재생성 + 비공개 버킷 업로드. cards.html·motion.html 해시를 매니페스트와 비교.
// 실행: node scripts/cardnews-pdf-sync.mjs   (git post-commit 훅이 public/cardnews 변경 시 자동 실행)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
const DIR = "public/cardnews", MAN = "_workspace/cardnews-pdf/manifest.json";
const hash = (f) => (existsSync(f) ? createHash("sha1").update(readFileSync(f)).digest("hex") : "");
const man = existsSync(MAN) ? JSON.parse(readFileSync(MAN, "utf8")) : {};
const cur = {};
for (const s of readdirSync(DIR)) cur[s] = hash(`${DIR}/${s}/cards.html`) + ":" + hash(`${DIR}/${s}/motion.html`);
const changed = Object.keys(cur).filter((s) => man[s] !== cur[s] && !cur[s].startsWith(":"));
if (process.argv.includes("--seed")) changed.length = 0; // 현재 상태를 기준선으로만 기록
if (changed.length) {
  console.log("[cardnews-pdf] 변경:", changed.join(", "));
  for (const cmd of [["scripts/cardnews-pdf.cjs"], ["scripts/cardnews-pdf-upload.mjs"]]) {
    const r = spawnSync("node", [...cmd, ...changed], { stdio: "inherit" });
    if (r.status !== 0) { console.error("[cardnews-pdf] 실패 — 다음 실행 때 재시도"); process.exit(1); }
  }
} else console.log("[cardnews-pdf] 변경 없음");
mkdirSync("_workspace/cardnews-pdf", { recursive: true });
writeFileSync(MAN, JSON.stringify({ ...man, ...cur }, null, 1));
