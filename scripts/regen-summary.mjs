// 특정 게시물의 AI 요약을 새 개조식 프롬프트로 재산출 (테스트/운영 공용).
// 사용: node scripts/regen-summary.mjs "<제목 일부>"   (기본: 흥국화재)
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);

// 원본 콘솔 보존 후, pdf.js 폰트 경고를 전 구간 억제
const out = console.log.bind(console);
const err = console.error.bind(console);
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const pdf = require("pdf-parse"); // require로 로드(ESM import는 debug 모드 크래시)
const { createClient } = require("@supabase/supabase-js");
const Anthropic = require("@anthropic-ai/sdk");

const SYSTEM = `당신은 보험 분야 전문 요약가입니다. 자료를 읽고 핵심을 '개조식'으로 요약합니다.

작성 규칙(반드시 준수):
- 모든 항목을 '- '로 시작하는 글머리 기호(불릿)로 작성한다. 완전한 서술형 문장을 쓰지 않는다.
- 개조식: 각 불릿은 체언(명사)으로 종결한다. (예: "~ 보전(회당 50만·최대 3회)", "~ 업계 최초")
- 동사는 명사화·축약한다. (예: "차단한다"→"차단", "정조준했다"→"정조준", "부여받았다"→"부여")
- 핵심어는 **굵게**(마크다운)로 강조한다.
- 섹션 구분은 '## 제목' 형식을 사용한다. 권장 구성: ## 총평 / ## 강점 / ## 리스크 / ## 제안.
- 보험 도메인 용어(배타적사용권 등)를 정확히 보존한다.
- 원문에 없는 내용을 추측해 추가하지 않는다. 끝까지 완결된 형태로 마무리한다.`;

(async () => {
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] = m[2];
    }
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    const key = process.argv[2] || "흥국화재";

    const { data: post } = await sb
      .from("ib_posts")
      .select("id, title, content")
      .ilike("title", `%${key}%`)
      .limit(1)
      .single();
    if (!post) throw new Error("게시물 없음: " + key);

    let attachmentText = "";
    const { data: atts } = await sb
      .from("ib_attachments")
      .select("storage_path")
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
        attachmentText = (d.text || "").trim().slice(0, 24000);
      }
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `다음 자료를 개조식으로 요약해 주세요.\n\n제목: ${post.title}\n\n[본문]\n${post.content}\n\n[첨부 추출]\n${attachmentText}`,
        },
      ],
    });
    const summary = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    await sb
      .from("ib_posts")
      .update({ summary, summary_generated_at: new Date().toISOString() })
      .eq("id", post.id);

    out(`\n=== ${post.title} ===`);
    out(`stop_reason: ${res.stop_reason} | out_tokens: ${res.usage?.output_tokens}`);
    out("----- 생성된 요약(개조식 마크다운) -----\n");
    out(summary);
  } catch (e) {
    err("ERROR:", e?.message || e);
    process.exit(1);
  }
})();
