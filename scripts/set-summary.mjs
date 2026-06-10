// 에이전트가 직접 작성한 4단 포맷 요약(마크다운)을 ib_posts.summary 에 기록한다.
// Anthropic API 미사용 — 결정적 DB 쓰기 전용. 스킬 exclusive-rights-summary 의 마지막 단계.
//
// 사용:
//   node scripts/set-summary.mjs "<제목 일부>" <요약.md 경로>
//   node scripts/set-summary.mjs "<제목 일부>" --check     # 현재 요약만 출력(미수정)
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
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
  const arg = process.argv[3];
  if (!key || !arg) {
    console.error('사용: node scripts/set-summary.mjs "<제목 일부>" <요약.md | --check>');
    process.exit(1);
  }

  const { data: post, error } = await sb
    .from("ib_posts")
    .select("id, title, summary")
    .ilike("title", `%${key}%`)
    .limit(2);
  if (error) throw error;
  if (!post?.length) throw new Error("게시물 없음: " + key);
  if (post.length > 1)
    throw new Error(
      "제목 '" + key + "' 가 여러 건과 일치: " + post.map((p) => p.title).join(" / ")
    );
  const p = post[0];

  if (arg === "--check") {
    console.log(`=== ${p.title} ===\n`);
    console.log(p.summary ?? "(요약 없음)");
    return;
  }

  const summary = readFileSync(arg, "utf8").trim();
  if (!summary) throw new Error("요약 파일이 비어 있음: " + arg);
  // 양식 가드: 4개 섹션 제목과 점수 문구 미포함을 확인
  const sections = ["## 총평", "## 급부구조", "## 의의", "## 제안"];
  const missing = sections.filter((s) => !summary.includes(s));
  if (missing.length)
    throw new Error("필수 섹션 누락: " + missing.join(", "));
  if (/약\s*\d+\s*\/\s*100|\d+~\d+점|독창성\s*\d+\s*·\s*진보성|추정\s*(종합|평점|합계)/.test(summary))
    throw new Error("추정 점수 문구가 포함됨 — 제거 후 다시 저장하세요.");

  await sb
    .from("ib_posts")
    .update({ summary, summary_generated_at: new Date().toISOString() })
    .eq("id", p.id);

  console.log(`[done] ${p.title}  요약 ${summary.length}자 저장`);
})().catch((e) => {
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
