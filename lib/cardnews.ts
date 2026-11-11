/**
 * 게시물 카드뉴스 등록부 — 등록된 게시물은 상세 페이지에서 AI 요약 대신
 * [카드뉴스 | 모션 슬라이드] 비교 보기가 나온다.
 *  - 카드뉴스: components/feature/cardnews/<slug>.tsx (CardNews.tsx 의 DECKS 에 연결)
 *  - 모션 슬라이드: slide_studio deck_build.py 로 빌드한 public/cardnews/<slug>/motion.html
 */
export type CardNewsSet = { slug: string };

const CARDNEWS: Record<string, CardNewsSet> = {
  // 흥국생명 (무)플렉스 리턴100종신보험
  "3e6fda61-0dd7-4cee-a21a-8e7ff736db37": { slug: "heungkuk-flexreturn100" },
};

export function getCardNews(postId: string): CardNewsSet | undefined {
  return CARDNEWS[postId];
}
