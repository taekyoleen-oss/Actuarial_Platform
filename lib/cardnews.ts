/**
 * 게시물 카드뉴스 등록부 — 등록된 게시물은 상세 페이지에서 AI 요약 대신
 * [카드뉴스 | 모션 슬라이드] 비교 보기가 나온다.
 * 원본 content/cardnews/<slug>/{cards,deck}.json → 전역 스킬 tkleen-cardnews 로 빌드한
 * public/cardnews/<slug>/{cards,motion}.html
 */
export type CardNewsSet = { slug: string };

const CARDNEWS: Record<string, CardNewsSet> = {
  "3e6fda61-0dd7-4cee-a21a-8e7ff736db37": { slug: "heungkuk-flexreturn100" }, // 흥국생명 플렉스 리턴100종신
  "5ee4ef84-d3fd-4b50-9971-6a76566f412a": { slug: "hana-lawyer-inkind" }, // 하나손보 변호사선임 현물급부
  "6aef77d3-8e21-44ee-941e-f07bc9c128a3": { slug: "samsung-retirement-etf-automata" }, // 삼성생명 퇴직연금 ETF 오토마타
  "620e910b-023e-4f92-a63a-ebd65a2179aa": { slug: "samsung-cancer-plus-whole-life" }, // 삼성생명 암치료플러스종신
  "17f6e35c-05b0-4589-8416-ea500b284bae": { slug: "abl-health-refund" }, // ABL생명 우리WON건강환급
  "7b44c5be-a96c-4177-be5a-498f082f7468": { slug: "hanwha-cartilife-surgery" }, // 한화생명 카티라이프 수술
  "63780600-1fc3-458e-9096-c571e1820060": { slug: "lina-mrd-wgs" }, // 라이나생명 미세잔존암 WGS
};

export function getCardNews(postId: string): CardNewsSet | undefined {
  return CARDNEWS[postId];
}
