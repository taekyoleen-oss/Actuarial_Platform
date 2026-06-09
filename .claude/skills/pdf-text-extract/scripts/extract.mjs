// PDF 텍스트 추출 유틸 (서버 전용). lib/utils/pdf.ts 로 이식해 사용한다.
// 의존성: pdf-parse  (npm i pdf-parse)
// 결정적 작업(추출)은 코드가, 품질 판단(요약)은 LLM이 담당한다.

import pdf from 'pdf-parse';

const MIN_MEANINGFUL_CHARS = 50; // 공백 제거 후 이 미만이면 추출 실패로 간주 → 폴백
const MAX_INPUT_CHARS = 24000;   // 요약 입력 상한(토큰 절약). 초과 시 앞부분만.

/**
 * @param {Buffer} buffer  Storage에서 받은 PDF 바이트
 * @returns {Promise<{ text: string, ok: boolean }>}
 */
export async function extractPdfText(buffer) {
  try {
    const data = await pdf(buffer);
    const text = (data.text || '').trim();
    const meaningful = text.replace(/\s/g, '').length;
    const ok = meaningful >= MIN_MEANINGFUL_CHARS;
    return { text: ok ? text.slice(0, MAX_INPUT_CHARS) : '', ok };
  } catch {
    // 손상/암호화 PDF 등 — 폴백(본문만 요약)
    return { text: '', ok: false };
  }
}
