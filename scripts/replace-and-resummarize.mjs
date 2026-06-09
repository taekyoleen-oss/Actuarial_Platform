// 교체된 로컬 PDF 4건을 Storage+메타에 반영하고, 새 PDF 텍스트로 AI 요약을 재생성한다.
// 대상: 혼재형/신규 4건(점수 섹션이 독립 페이지가 아니어서 strip 대상에서 제외됐던 보고서).
// 절차(파일별): Storage 원본 백업 → 로컬 PDF 업로드(upsert) → file_size 갱신
//              → 로컬 PDF 텍스트 추출 → Claude Sonnet 요약 → ib_posts.summary 갱신.
// 멱등 아님(매 실행 요약 재생성). 사용: node scripts/replace-and-resummarize.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const out = console.log.bind(console);
const errLog = console.error.bind(console);
// pdf-parse(pdf.js) 폰트 경고/디버그 출력 억제
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const pdf = require("pdf-parse"); // ESM import는 debug 모드 크래시 → require
const { createClient } = require("@supabase/supabase-js");
const Anthropic = require("@anthropic-ai/sdk");

const DIR = "content/exclusive-rights";
const BACKUP = path.join(DIR, "_backup_원본");
const FILES = [
  "분석보고서_하나손보_변호사선임_현물급부.pdf",
  "분석보고서_하나손보_신경인지기능검사비.pdf",
  "분석보고서_현대해상_재택간병_프리미엄간병.pdf",
  "분석보고서_흥국화재_표적치매MRI검사지원비.pdf",
];

// lib/summarize.ts 와 동일한 시스템 프롬프트(개조식)
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
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  if (!existsSync(BACKUP)) mkdirSync(BACKUP, { recursive: true });

  const results = [];
  for (const f of FILES) {
    const local = path.join(DIR, f);
    if (!existsSync(local)) {
      results.push(`[skip] 로컬 파일 없음: ${f}`);
      continue;
    }
    const buf = readFileSync(local);

    // 첨부/게시글 매핑
    const { data: att } = await sb
      .from("ib_attachments")
      .select("id, storage_path, post_id")
      .eq("file_name", f)
      .maybeSingle();
    if (!att) {
      results.push(`[error] 첨부 메타 없음: ${f}`);
      continue;
    }

    // 1) Storage 원본 백업(최초 1회만)
    const backupPath = path.join(BACKUP, f);
    if (!existsSync(backupPath)) {
      const { data: cur, error: de } = await sb.storage
        .from("ib-attachments")
        .download(att.storage_path);
      if (cur) {
        writeFileSync(backupPath, Buffer.from(await cur.arrayBuffer()));
      } else {
        results.push(`[warn] 원본 백업 실패(계속): ${f} ${de?.message ?? ""}`);
      }
    }

    // 2) 로컬 PDF 업로드(upsert) + 3) 메타 갱신
    const { error: ue } = await sb.storage
      .from("ib-attachments")
      .upload(att.storage_path, buf, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (ue) {
      results.push(`[error] Storage 업로드 실패(${ue.message}): ${f}`);
      continue;
    }
    await sb
      .from("ib_attachments")
      .update({ file_size: buf.length })
      .eq("id", att.id);

    // 4) 새 PDF 텍스트 추출
    let attachmentText = "";
    try {
      const d = await pdf(buf);
      attachmentText = (d.text || "").trim().slice(0, 24000);
    } catch (e) {
      results.push(`[warn] 추출 실패(본문만 요약): ${f} ${e?.message ?? ""}`);
    }

    // 5) 게시글 + 요약 재생성
    const { data: post } = await sb
      .from("ib_posts")
      .select("id, title, content")
      .eq("id", att.post_id)
      .single();

    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096, // 개조식 요약 잘림 방지(혼재형 보고서는 본문이 길어 2048 초과)
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `다음 자료를 개조식으로 요약해 주세요.\n\n제목: ${post.title}\n\n[본문]\n${post.content || "(본문 없음)"}\n\n[첨부 추출]\n${attachmentText}`,
        },
      ],
    });
    const summary = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    if (!summary) {
      results.push(`[error] 빈 요약: ${f}`);
      continue;
    }

    // 6) ib_posts 갱신
    await sb
      .from("ib_posts")
      .update({ summary, summary_generated_at: new Date().toISOString() })
      .eq("id", post.id);

    results.push(
      `[done] ${post.title}\n        PDF ${buf.length}B 업로드 · 추출 ${attachmentText.length}자 · 요약 ${summary.length}자(stop=${res.stop_reason})`
    );
  }

  console.log = out;
  out(results.join("\n"));
})().catch((e) => {
  console.error = errLog;
  errLog("ERROR:", e?.message || e);
  process.exit(1);
});
