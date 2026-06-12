import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** YYYY.MM.DD 한국어 날짜 표기 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** 본문에서 카드 발췌 텍스트 생성 */
export function excerpt(text: string, max = 120): string {
  const clean = text
    .replace(/\[\[viewer:[a-z0-9-]+\]\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

/** 카드용 파스텔 팔레트 (배경/테두리). 어두운 본문 텍스트와 대비 충분(WCAG AA). */
const CARD_PASTELS = [
  { bg: "#EEF4FF", border: "#DCE6FB" }, // blue
  { bg: "#ECFDF5", border: "#D4F3E4" }, // mint
  { bg: "#FFF1F2", border: "#FBDCE0" }, // rose
  { bg: "#FFF7ED", border: "#FAE7D2" }, // peach
  { bg: "#FEFCE8", border: "#F3EDC4" }, // lemon
  { bg: "#F5F3FF", border: "#E6E0FB" }, // lavender
  { bg: "#F0FDFA", border: "#D2F1EB" }, // teal
  { bg: "#FDF2F8", border: "#F7DDEB" }, // pink
] as const;

/** 시드 문자열(예: 게시물 id)로 파스텔 색을 자동·일관 배정한다. */
export function pastelFor(seed: string): { bg: string; border: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return CARD_PASTELS[Math.abs(h) % CARD_PASTELS.length];
}

/** 네이버 뉴스 제목의 <b> 태그·HTML 엔티티 정리 (뉴스 연동용) */
export function cleanNewsText(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/<\/?[^>]+>/g, "") // 태그 제거
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}
