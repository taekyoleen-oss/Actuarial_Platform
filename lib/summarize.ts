// AI 요약 파이프라인 (ai-summarizer). 서버 전용. Claude Sonnet 호출.
import Anthropic from "@anthropic-ai/sdk";
import { EXCLUSIVE_RIGHTS_SUMMARY_PROMPT } from "./summary-format";

const MODEL = "claude-sonnet-4-6";

// 요약 양식 단일 출처는 lib/summary-format.ts. 웹 "AI 생성"(API)과
// 스킬 기반 수동 작성이 동일 4단 포맷(총평/급부구조/의의/제안)을 공유한다.
export const SUMMARY_SYSTEM_PROMPT = EXCLUSIVE_RIGHTS_SUMMARY_PROMPT;

/**
 * 본문(+첨부 추출 텍스트)을 개조식 마크다운으로 요약한다.
 * @returns 요약 텍스트(마크다운). 실패 시 throw.
 */
export async function summarize(input: {
  title: string;
  content: string;
  attachmentText?: string;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const client = new Anthropic({ apiKey });

  const source = [
    `제목: ${input.title}`,
    `\n[본문]\n${input.content || "(본문 없음)"}`,
    input.attachmentText ? `\n[첨부 추출]\n${input.attachmentText}` : "",
  ].join("\n");

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 2048, // 잘림 방지를 위해 상향
    system: [
      {
        type: "text",
        text: SUMMARY_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      { role: "user", content: `다음 자료를 개조식으로 요약해 주세요.\n\n${source}` },
    ],
  });

  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();

  if (!text) throw new Error("empty summary");
  return text;
}
