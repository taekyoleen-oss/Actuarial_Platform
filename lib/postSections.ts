import type { PostListItem } from "@/types";

/**
 * 카테고리별 "항목(subsection)" 정의 — 코드 내 고정 매핑(2026-06-14 사용자 결정).
 * ib_posts에 분류 컬럼을 추가하지 않고(수정 최소화) 제목 키워드로 분류한다.
 * 향후 새 게시물은 default 항목으로 떨어지며, 분류가 필요하면 match 키워드를 보완한다.
 */
export interface SectionDef {
  /** 항목 제목 */
  title: string;
  /** 이 항목으로 분류할 제목 키워드(정규식). default 항목은 생략. */
  match?: RegExp;
  /** 다른 항목에 매칭되지 않은 게시물이 모이는 항목 */
  isDefault?: boolean;
}

export const POST_SECTIONS: Record<string, SectionDef[]> = {
  "exclusive-rights": [
    { title: "질병 관련", isDefault: true },
    {
      title: "기타 (비용 등)",
      match: /연금|톤틴|환급|간병|변호사|법률|장기요양|요양/,
    },
  ],
  domestic: [
    { title: "보험사 매각정보", match: /매각/ },
    { title: "상품 정보", isDefault: true },
  ],
};

export interface GroupedSection {
  title: string;
  posts: PostListItem[];
}

/** 게시물을 항목별로 분류. 비(非)default 항목을 먼저 평가하고, 남으면 default로. */
export function groupPosts(
  categorySlug: string | undefined,
  posts: PostListItem[]
): GroupedSection[] | null {
  if (!categorySlug) return null;
  const sections = POST_SECTIONS[categorySlug];
  if (!sections) return null;

  const buckets = new Map<string, PostListItem[]>(
    sections.map((s) => [s.title, []])
  );
  const def = sections.find((s) => s.isDefault) ?? sections[0];

  for (const p of posts) {
    const hit = sections.find((s) => s.match && s.match.test(p.title));
    buckets.get((hit ?? def).title)!.push(p);
  }

  return sections.map((s) => ({ title: s.title, posts: buckets.get(s.title)! }));
}
