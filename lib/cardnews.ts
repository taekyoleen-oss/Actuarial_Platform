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
  "33ac0bab-7da4-407e-a5d3-c67e4ee1b6c5": { slug: "shinhan-tontine-annuity" }, // 신한라이프 톤틴연금
  "422cdc31-55ac-4e78-a4a9-4ff5e4f3f186": { slug: "kyobo-cpr-defib" }, // 교보생명 심폐소생술·제세동
  "00d9ac3f-bdfa-4509-9ac8-0c603e40cac7": { slug: "kyobo-uterine-disease" }, // 교보생명 특정자궁질환
  "5500e79b-9bda-4722-b14c-999466b2a4d2": { slug: "samsung-er-retransfer" }, // 삼성생명 응급실내원(재이송)
  "8081d75d-5124-4bcd-9132-f3d47cf80360": { slug: "heungkuk-prostate-biodegradable" }, // 흥국생명 전립선암 생분해성 물질주입술
  "a31ffb08-e253-45d4-8efe-c530b5e1c18f": { slug: "db-ai-lifecare-cancer" }, // DB AI라이프케어암
};

export function getCardNews(postId: string): CardNewsSet | undefined {
  return CARDNEWS[postId];
}
