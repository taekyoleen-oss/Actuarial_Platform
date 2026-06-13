/** 해외 주요 보험 정보·자료 — public/global/ 정적 HTML 뷰어 레지스트리 */

export interface GlobalViewer {
  slug: string;
  title: string;
  /** public/ 기준 경로 — 레거시 정적 문서(보존, 딥링크 호환) */
  htmlPath: string;
  /** 사이트 일체형 네이티브 페이지 경로 (2026-06-13 iframe → 네이티브 전환) */
  nativePath: string;
}

export const GLOBAL_VIEWERS: GlobalViewer[] = [
  {
    slug: "japan-fsa-cases",
    title: "일본 금융청 보험상품 심사사례 (기간별 종합)",
    htmlPath: "/global/japan-fsa/cases.html",
    nativePath: "/global/japan-fsa",
  },
  {
    slug: "japan-fsa-guide",
    title: "일본 금융청 보험상품 심사사례집 안내",
    htmlPath: "/global/japan-fsa/guide.html",
    nativePath: "/global/japan-fsa",
  },
  {
    slug: "japan-life-insurer-timeline",
    title: "일본 생명보험회사 변천 가이드",
    htmlPath: "/global/japan-life/timeline.html",
    nativePath: "/global/japan-life",
  },
  {
    slug: "japan-life-trends-2025",
    title: "일본 생명보험의 동향 (2025년판)",
    htmlPath: "/global/japan-life-trends/index.html",
    nativePath: "/global/japan-life-trends",
  },
];

/** 게시물 content의 뷰어 마커 → 네이티브 페이지 경로 (없으면 null) */
export function nativePathFromContent(content: string): string | null {
  const slug = viewerSlugFromContent(content);
  if (!slug) return null;
  return getGlobalViewer(slug)?.nativePath ?? null;
}

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
