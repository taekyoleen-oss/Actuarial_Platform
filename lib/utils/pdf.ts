// PDF 텍스트 추출 (서버 전용). pdf-text-extract 스킬의 scripts/extract.mjs 이식.
// 결정적 작업(추출)은 코드가, 품질 판단(요약)은 LLM이 담당한다.
import pdf from "pdf-parse";

const MIN_MEANINGFUL_CHARS = 50; // 공백 제거 후 이 미만이면 추출 실패 → 폴백(본문만 요약)
const MAX_INPUT_CHARS = 24_000; // 요약 입력 상한(토큰 절약)

export async function extractPdfText(
  buffer: Buffer
): Promise<{ text: string; ok: boolean }> {
  try {
    const data = await pdf(buffer);
    const text = (data.text || "").trim();
    const meaningful = text.replace(/\s/g, "").length;
    const ok = meaningful >= MIN_MEANINGFUL_CHARS;
    return { text: ok ? text.slice(0, MAX_INPUT_CHARS) : "", ok };
  } catch {
    return { text: "", ok: false }; // 손상/암호화/스캔 PDF → 폴백
  }
}
