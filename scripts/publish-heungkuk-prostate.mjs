// 흥국생명 전립선암 생분해성 물질주입술 보장특약 분석 — 배타권 자료 1건 게시.
// 절차: ib_posts 생성 → Storage(ib-attachments) PDF 업로드 → ib_attachments 메타 →
//       요약(4단 포맷) 기록. setup-admin-and-import.mjs 와 동일 컨벤션. 멱등(제목 중복 시 스킵/보강).
// 사용: node scripts/publish-heungkuk-prostate.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const TITLE = "흥국생명 전립선암 생분해성 물질주입술 보장특약 분석";
const FILE = "분석보고서_흥국생명_전립선암생분해성물질주입술.pdf";
const CONTENT = readFileSync("_workspace/heungkuk_prostate_content.txt", "utf8").trim();
const SUMMARY = readFileSync("_workspace/summary_heungkuk_prostate.md", "utf8").trim();

// 요약 양식 가드(set-summary.mjs 와 동일)
const sections = ["## 총평", "## 급부구조", "## 의의", "## 제안"];
const missing = sections.filter((s) => !SUMMARY.includes(s));
if (missing.length) {
  console.error("필수 섹션 누락:", missing.join(", "));
  process.exit(1);
}
if (/약\s*\d+\s*\/\s*100|\d+~\d+점|독창성\s*\d+\s*·\s*진보성|추정\s*(종합|평점|합계)/.test(SUMMARY)) {
  console.error("추정 점수 문구 포함 — 제거 후 재실행");
  process.exit(1);
}

const { data: cat } = await sb
  .from("ib_categories")
  .select("id")
  .eq("slug", "exclusive-rights")
  .single();
if (!cat) { console.error("exclusive-rights 카테고리 없음"); process.exit(1); }

// 1) 게시물 (제목 중복 시 재사용)
let postId;
const { data: dup } = await sb
  .from("ib_posts")
  .select("id")
  .eq("title", TITLE)
  .maybeSingle();
if (dup) {
  postId = dup.id;
  await sb
    .from("ib_posts")
    .update({
      content: CONTENT,
      summary: SUMMARY,
      summary_generated_at: new Date().toISOString(),
      is_published: true,
    })
    .eq("id", postId);
  console.log("[update] 기존 게시물 갱신:", postId);
} else {
  const { data: post, error: pe } = await sb
    .from("ib_posts")
    .insert({
      category_id: cat.id,
      title: TITLE,
      content: CONTENT,
      summary: SUMMARY,
      summary_generated_at: new Date().toISOString(),
      author_name: "보험상품 분석팀",
      is_published: true,
    })
    .select("id")
    .single();
  if (pe) { console.error("ERR insert post:", pe.message); process.exit(1); }
  postId = post.id;
  console.log("[insert] 게시물 등록:", postId);
}

// 2) Storage 업로드 (ASCII 키, 표시명은 원본 유지)
const storagePath = `exclusive-rights/${postId}/doc.pdf`;
const buf = readFileSync(path.join("content/exclusive-rights", FILE));
const { error: ue } = await sb.storage
  .from("ib-attachments")
  .upload(storagePath, buf, { contentType: "application/pdf", upsert: true });
if (ue) { console.error("ERR upload:", ue.message); process.exit(1); }
console.log("[storage] 업로드:", storagePath, `(${buf.length}B)`);

// 3) 첨부 메타 (post당 1건 보장 — 있으면 갱신)
const { data: att } = await sb
  .from("ib_attachments")
  .select("id")
  .eq("post_id", postId)
  .eq("mime_type", "application/pdf")
  .maybeSingle();
if (att) {
  await sb
    .from("ib_attachments")
    .update({ file_name: FILE, storage_path: storagePath, file_size: buf.length })
    .eq("id", att.id);
  console.log("[attach] 메타 갱신:", att.id);
} else {
  const { error: ae } = await sb.from("ib_attachments").insert({
    post_id: postId,
    file_name: FILE,
    storage_path: storagePath,
    mime_type: "application/pdf",
    file_size: buf.length,
  });
  if (ae) { console.error("ERR insert attach:", ae.message); process.exit(1); }
  console.log("[attach] 메타 등록");
}

console.log("\n[완료]", TITLE);
console.log("본문", CONTENT.length + "자 · 요약", SUMMARY.length + "자 · PDF", buf.length + "B");
