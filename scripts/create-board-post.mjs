// 게시판(ib_posts)에 글을 등록한다. 본문은 plain-text(pre-wrap 렌더), 요약은 마크다운(AI 요약 패널).
// Anthropic API 미사용 — 에이전트가 작성한 본문/요약 파일을 그대로 DB에 기록.
// 사용: node scripts/create-board-post.mjs <category_slug> "<제목>" <본문.txt> <요약.md>
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
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

const [slug, title, contentPath, summaryPath] = process.argv.slice(2);
if (!slug || !title || !contentPath) {
  console.error('사용: node scripts/create-board-post.mjs <category_slug> "<제목>" <본문.txt> [요약.md]');
  process.exit(1);
}

const { data: cat } = await sb
  .from("ib_categories")
  .select("id")
  .eq("slug", slug)
  .maybeSingle();
if (!cat) {
  console.error("카테고리 없음:", slug);
  process.exit(1);
}

const content = readFileSync(contentPath, "utf8").trim();
const summary = summaryPath ? readFileSync(summaryPath, "utf8").trim() : null;

const { data: dup } = await sb
  .from("ib_posts")
  .select("id")
  .eq("title", title)
  .maybeSingle();
if (dup) {
  console.log("이미 존재:", dup.id);
  process.exit(0);
}

const { data, error } = await sb
  .from("ib_posts")
  .insert({
    category_id: cat.id,
    title,
    content,
    summary,
    summary_generated_at: summary ? new Date().toISOString() : null,
    author_name: "보험 인사이트 데스크",
    is_published: true,
  })
  .select("id")
  .single();
if (error) {
  console.error("ERR", error.message);
  process.exit(1);
}
console.log("[등록 완료] post_id =", data.id);
console.log("본문 " + content.length + "자 / 요약 " + (summary ? summary.length + "자" : "없음"));
