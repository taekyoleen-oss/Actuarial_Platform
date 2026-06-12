/** 해외 주요 보험 정보·자료 — public/global/ 정적 HTML 뷰어 레지스트리 */

export interface GlobalViewer {
  slug: string;
  title: string;
  /** public/ 기준 경로 (예: /global/japan-fsa/cases.html) */
  htmlPath: string;
}

export const GLOBAL_VIEWERS: GlobalViewer[] = [
  {
    slug: "japan-fsa-cases",
    title: "일본 금융청 보험상품 심사사례 (2026년 1월)",
    htmlPath: "/global/japan-fsa/cases.html",
  },
  {
    slug: "japan-fsa-guide",
    title: "일본 금융청 보험상품 심사사례집 안내",
    htmlPath: "/global/japan-fsa/guide.html",
  },
  {
    slug: "japan-life-insurer-timeline",
    title: "일본 생명보험회사 변천 가이드",
    htmlPath: "/global/japan-life/timeline.html",
  },
];

const VIEWER_MARKER = /\[\[viewer:([a-z0-9-]+)\]\]/i;

/** 게시물 본문에서 임베드 뷰어 slug 추출 */
export function viewerSlugFromContent(content: string): string | null {
  const m = content.match(VIEWER_MARKER);
  return m?.[1] ?? null;
}

/** 카드·목록용 본문 — 뷰어 마커 제거 */
export function stripViewerMarker(content: string): string {
  return content.replace(VIEWER_MARKER, "").trim();
}

export function getGlobalViewer(slug: string): GlobalViewer | undefined {
  return GLOBAL_VIEWERS.find((v) => v.slug === slug);
}
