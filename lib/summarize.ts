// AI 요약 파이프라인 (ai-summarizer). 서버 전용. Claude Sonnet 호출.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `당신은 보험 분야 전문 요약가입니다. 한국어 자료를 읽고 핵심을 구조화하여 요약합니다.
규칙:
- 보험 도메인 용어(배타적 사용권 등)를 정확히 보존한다.
- 3~5개의 핵심 포인트를 불릿으로 정리하고, 마지막에 한 줄 결론을 덧붙인다.
- 원문에 없는 내용을 추측해 추가하지 않는다.
- 자연스러운 한국어 문어체로 작성한다.`;

/**
 * 본문(+첨부 추출 텍스트)을 요약한다.
 * @returns 요약 텍스트. 실패 시 throw.
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
    max_tokens: 1024,
    system: [
      // 시스템 프롬프트는 안정적이므로 캐싱하여 반복 호출 비용 절감
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      { role: "user", content: `다음 자료를 요약해 주세요.\n\n${source}` },
    ],
  });

  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();

  if (!text) throw new Error("empty summary");
  return text;
}
