// AI 요약 파이프라인 (ai-summarizer). 서버 전용. Claude Sonnet 호출.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-6";

// 개조식(체언 종결) + 글머리 기호 + 마크다운 강조. 서술형 문장 금지.
export const SUMMARY_SYSTEM_PROMPT = `당신은 보험 분야 전문 요약가입니다. 자료를 읽고 핵심을 '개조식'으로 요약합니다.

작성 규칙(반드시 준수):
- 모든 항목을 '- '로 시작하는 글머리 기호(불릿)로 작성한다. 완전한 서술형 문장을 쓰지 않는다.
- 개조식: 각 불릿은 체언(명사)으로 종결한다. (예: "~ 보전(회당 50만·최대 3회)", "~ 업계 최초")
- 동사는 명사화·축약한다. (예: "차단한다"→"차단", "정조준했다"→"정조준", "부여받았다"→"부여")
- 핵심어는 **굵게**(마크다운)로 강조한다.
- 섹션 구분은 '## 제목' 형식을 사용한다. 권장 구성: ## 총평 / ## 강점 / ## 리스크 / ## 제안.
- 보험 도메인 용어(배타적사용권 등)를 정확히 보존한다.
- 원문에 없는 내용을 추측해 추가하지 않는다. 끝까지 완결된 형태로 마무리한다.`;

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
