// 특정 배타권 게시글의 '작성 입력'(제목·본문·현재 첨부 PDF 추출 텍스트)을 출력한다.
// 에이전트가 4단 포맷 요약을 직접 작성하기 위한 원천 자료. Anthropic API 미사용.
// 사용: node scripts/dump-source.mjs "<제목 일부>"
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const out = console.log.bind(console);
const err = console.error.bind(console);
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const pdf = require("pdf-parse"); // ESM import는 debug 모드 크래시 → require
const { createClient } = require("@supabase/supabase-js");

(async () => {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const key = process.argv[2];
  if (!key) throw new Error('사용: node scripts/dump-source.mjs "<제목 일부>"');

  const { data: posts } = await sb
    .from("ib_posts")
    .select("id, title, content")
    .ilike("title", `%${key}%`)
    .limit(2);
  if (!posts?.length) throw new Error("게시물 없음: " + key);
  if (posts.length > 1)
    throw new Error("여러 건 일치: " + posts.map((p) => p.title).join(" / "));
  const post = posts[0];

  let pdfText = "";
  const { data: atts } = await sb
    .from("ib_attachments")
    .select("storage_path, file_name")
    .eq("post_id", post.id)
    .eq("mime_type", "application/pdf")
    .limit(1);
  if (atts?.[0]) {
    const { data: file } = await sb.storage
      .from("ib-attachments")
      .download(atts[0].storage_path);
    if (file) {
      const buf = Buffer.from(await file.arrayBuffer());
      const d = await pdf(buf);
      pdfText = (d.text || "").trim();
    }
  }

  console.log = out;
  out(`# TITLE\n${post.title}\n`);
  out(`# CONTENT\n${post.content || "(본문 없음)"}\n`);
  out(`# PDF_TEXT (${pdfText.length}자)\n${pdfText}`);
})().catch((e) => {
  console.error = err;
  err("ERROR:", e?.message || e);
  process.exit(1);
});
