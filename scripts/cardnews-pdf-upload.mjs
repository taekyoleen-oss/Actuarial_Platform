// _workspace/cardnews-pdf/<slug>/{cards,slides}.pdf → 비공개 버킷 ib-cardnews-pdf/<slug>/…  (관리자만 서명 URL로 내려받음)
// 실행: node scripts/cardnews-pdf-upload.mjs [slug...]
import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2]; }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BUCKET = "ib-cardnews-pdf", DIR = "_workspace/cardnews-pdf";
const { error: be } = await sb.storage.createBucket(BUCKET, { public: false });
if (be && !/already exists/i.test(be.message)) throw be;
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(DIR);
for (const slug of slugs) for (const f of ["cards.pdf", "slides.pdf"]) {
  const { error } = await sb.storage.from(BUCKET).upload(`${slug}/${f}`, readFileSync(`${DIR}/${slug}/${f}`), { contentType: "application/pdf", upsert: true });
  if (error) throw new Error(`${slug}/${f}: ${error.message}`);
  console.log("up", slug, f);
}
const { data: b } = await sb.storage.getBucket(BUCKET); console.log("bucket public =", b?.public);
