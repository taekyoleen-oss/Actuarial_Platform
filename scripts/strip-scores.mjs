// 배타적 사용권 카드의 content·summary에서 "배타적사용권 추정 점수" 내용만 제거.
// 실제 부여된 배타권 기간(예: "6개월 배타권 부여")은 보존, 추정 점수/배점만 삭제.
// 멱등(이미 제거된 경우 무변경). 사용: node scripts/strip-scores.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// content(설명)에서 제거할 추정 점수 문구 — 명시적 문자열(특수문자 없음, 안전).
const CONTENT_REMOVALS = [
  " 정성 추정 78~86점, 배타적사용권 6~12개월 기대.", // 하나손보 변호사선임
  ", 정성 추정 약 78점", // ABL
  " 종합 추정 약 75점.", // 교보 심폐
  ", 종합 추정 약 76점", // 교보 자궁
  " 종합 추정 약 80점.", // 라이나
  ", 종합 추정 약 87점", // 신한
];

// summary(AI 요약)에서 제거할 "점수 배점 섹션" — 헤딩 일부 문자열로 식별, 해당 불릿 그룹째 삭제.
const SUMMARY_BLOCK_HEADINGS = [
  "배타권 심사 추정",
  "배타권 심사 적합성",
  "배타적사용권 평점 세부",
  "배타적사용권 평가",
  "배타권 심사 4축 추정 평점",
  "배타적사용권 심사 매핑",
];

// summary 총평 등의 "종합점수" 단일 불릿 — 줄 단위 삭제.
const SUMMARY_LINE_SUBSTRS = [
  "배타권 심사 4축 추정 점수",
  "종합 추정 평점",
  "종합 추정 점수",
  "배타적사용권 추정 종합 점수",
  "분석 추정 종합점수",
];

function removeBlock(text, headingSubstr) {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.includes(headingSubstr));
  if (i === -1) return text;
  let j = i + 1;
  while (j < lines.length) {
    const t = lines[j].trim();
    if (t === "" || t.startsWith("##") || t.startsWith("---")) break;
    j++;
  }
  lines.splice(i, j - i);
  return lines.join("\n");
}

function removeLine(text, substr) {
  return text.split("\n").filter((l) => !l.includes(substr)).join("\n");
}

function cleanSummary(s) {
  if (!s) return s;
  let out = s;
  for (const h of SUMMARY_BLOCK_HEADINGS) out = removeBlock(out, h);
  for (const sub of SUMMARY_LINE_SUBSTRS) out = removeLine(out, sub);
  return out.replace(/\n{3,}/g, "\n\n");
}

function cleanContent(c) {
  if (!c) return c;
  let out = c;
  for (const r of CONTENT_REMOVALS) out = out.split(r).join("");
  return out;
}

(async () => {
  const { data: cat } = await sb
    .from("ib_categories")
    .select("id")
    .eq("slug", "exclusive-rights")
    .single();
  const { data: posts } = await sb
    .from("ib_posts")
    .select("id,title,content,summary")
    .eq("category_id", cat.id)
    .order("created_at", { ascending: true });

  let changed = 0;
  for (const p of posts) {
    const newContent = cleanContent(p.content);
    const newSummary = cleanSummary(p.summary);
    const cChanged = newContent !== p.content;
    const sChanged = newSummary !== p.summary;
    if (!cChanged && !sChanged) {
      console.log(`[skip] 변경 없음: ${p.title}`);
      continue;
    }
    const patch = {};
    if (cChanged) patch.content = newContent;
    if (sChanged) patch.summary = newSummary;
    const { error } = await sb.from("ib_posts").update(patch).eq("id", p.id);
    if (error) throw error;
    changed++;
    console.log(
      `[update] ${p.title}  (content:${cChanged ? "수정" : "-"} / summary:${sChanged ? "수정" : "-"})`
    );
  }
  console.log(`\n완료: ${changed}건 수정.`);
})();
