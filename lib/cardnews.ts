/**
 * 게시물 카드뉴스 등록부 — tools/cardnews-kit 으로 만든 1080×1350 카드를
 * public/cardnews/<slug>/01.png… 에 두고 게시물 id 를 여기에 등록한다.
 * 등록된 게시물은 상세 페이지에서 AI 요약 대신 카드뉴스 슬라이더가 나온다.
 */
export type CardNewsSet = { slug: string; count: number };

const CARDNEWS: Record<string, CardNewsSet> = {
  // 흥국생명 (무)플렉스 리턴100종신보험
  "3e6fda61-0dd7-4cee-a21a-8e7ff736db37": { slug: "heungkuk-flexreturn100", count: 18 },
};

export function getCardNews(postId: string): CardNewsSet | undefined {
  return CARDNEWS[postId];
}
