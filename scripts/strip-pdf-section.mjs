// 배타적 사용권 분석 PDF에서 "심사기준 매핑(점수)" 섹션 페이지를 제거.
// 점수 섹션이 독립 페이지인 7개 보고서만 대상(혼재형 4개는 제외).
// 원본은 content/exclusive-rights/_backup_원본/ 에 백업, 로컬+Storage 모두 교체.
// 멱등: 이미 처리(페이지수 감소)된 파일은 건너뜀. 삭제 전 해당 페이지가 점수 섹션인지 재확인.
// 사용: node scripts/strip-pdf-section.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const require = createRequire(import.meta.url);
const origLog = console.log.bind(console);
console.log = () => {};
console.warn = () => {};
const pdfParse = require("pdf-parse");
const { createClient } = require("@supabase/supabase-js");

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const DIR = "content/exclusive-rights";
const BACKUP = path.join(DIR, "_backup_원본");

// file → { page(1-based 삭제 대상), origPages(원본 총 페이지, 멱등 가드) }
const TARGETS = [
  { file: "분석보고서_ABL생명_우리WON건강환급보험.pdf", page: 10, origPages: 16 },
  { file: "분석보고서_교보생명_심폐소생술급여보장특약외1종.pdf", page: 10, origPages: 16 },
  { file: "분석보고서_교보생명_특정자궁질환보장특약.pdf", page: 10, origPages: 16 },
  { file: "분석보고서_라이나생명_미세잔존암WGS검사지원형.pdf", page: 10, origPages: 17 },
  { file: "분석보고서_신한라이프_신한톤틴연금보험.pdf", page: 10, origPages: 16 },
  { file: "분석보고서_DB생명_장기요양플러스보장특약.pdf", page: 14, origPages: 20 },
  { file: "분석보고서_한화생명_카티라이프수술보장특약.pdf", page: 13, origPages: 19 },
];

// 삭제 대상 페이지의 텍스트가 실제 점수 섹션인지 확인 (오삭제 방지)
async function isScorePage(buf, page1) {
  const pages = [];
  function render(pd) {
    return pd.getTextContent().then((tc) => {
      pages.push(tc.items.map((i) => i.str).join(" "));
      return "";
    });
  }
  await pdfParse(buf, { pagerender: render });
  const t = (pages[page1 - 1] || "").replace(/\s+/g, " ");
  const hasAxis = /독창성/.test(t) && /노력도/.test(t);
  const hasScoreCtx =
    /(배타적사용권 4축|심사기준 매핑|추정 평점|배점|진보성 35·유용성 35)/.test(t);
  return hasAxis && hasScoreCtx;
}

(async () => {
  if (!existsSync(BACKUP)) mkdirSync(BACKUP, { recursive: true });
  let done = 0;
  const results = [];

  for (const t of TARGETS) {
    const local = path.join(DIR, t.file);
    if (!existsSync(local)) {
      results.push(`[skip] 파일 없음: ${t.file}`);
      continue;
    }
    const bytes = readFileSync(local);
    const doc = await PDFDocument.load(bytes);
    const count = doc.getPageCount();

    if (count !== t.origPages) {
      results.push(
        `[skip] 이미 처리됨(또는 페이지수 불일치 ${count}p≠${t.origPages}p): ${t.file}`
      );
      continue;
    }

    // 안전 확인: 삭제 대상 페이지가 점수 섹션인지
    const ok = await isScorePage(bytes, t.page);
    if (!ok) {
      results.push(`[ABORT] p${t.page}가 점수 섹션이 아님 — 건너뜀: ${t.file}`);
      continue;
    }

    // 원본 백업(최초 1회만)
    const backupPath = path.join(BACKUP, t.file);
    if (!existsSync(backupPath)) writeFileSync(backupPath, bytes);

    // 페이지 삭제 → 저장
    doc.removePage(t.page - 1);
    const out = await doc.save();
    const outBuf = Buffer.from(out);
    writeFileSync(local, outBuf);

    // Storage + 메타 교체
    const { data: att } = await sb
      .from("ib_attachments")
      .select("id, storage_path, post_id")
      .eq("file_name", t.file)
      .maybeSingle();
    if (!att) {
      results.push(`[warn] 첨부 메타 없음(로컬만 교체): ${t.file}`);
      continue;
    }
    const { error: ue } = await sb.storage
      .from("ib-attachments")
      .upload(att.storage_path, outBuf, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (ue) {
      results.push(`[error] Storage 업로드 실패(${ue.message}): ${t.file}`);
      continue;
    }
    await sb
      .from("ib_attachments")
      .update({ file_size: outBuf.length })
      .eq("id", att.id);

    done++;
    results.push(
      `[done] ${t.file}  ${count}p → ${doc.getPageCount()}p (p${t.page} 삭제, Storage 교체)`
    );
  }

  console.log = origLog;
  console.log(results.join("\n"));
  console.log(`\n완료: ${done}건 처리. 원본 백업: ${BACKUP}/`);
})().catch((e) => {
  console.log = origLog;
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
