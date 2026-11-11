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
  "71e9a894-8938-4677-b79c-d1b6d2adedf7": { slug: "hana-neurocognitive-test" }, // 하나손보 신경인지기능검사비
  "2dea70bf-f139-470c-ab89-52b397dcedfa": { slug: "hanwha-precocious-puberty-test" }, // 한화손보 성조숙증 진단검사지원비
  "03072970-4743-478f-9303-76a5cead8342": { slug: "hyundai-home-caregiver" }, // 현대해상 재택간병·프리미엄간병
  "6e27a4e1-1b81-4819-8c6d-35446957932d": { slug: "aia-mild-dementia-amyloid-pet" }, // AIA생명 특정최경도치매
  "ffcf0b9a-6671-4720-850a-f35e58ba3f5c": { slug: "kyobo-split-underwriting" }, // 교보생명 복합심사인수특약
  "3c4797c3-df5b-4ab8-88d5-492a742ba85e": { slug: "dbins-no-claim-term-extension" }, // DB손보 무사고 시 보험기간 연장
  "499e22f9-b6c6-434d-b5a0-e155d2fa065a": { slug: "hanwha-selective-cancer-treatment" }, // 한화생명 선별급여암주요치료
  "763438f1-cd7b-467b-bf79-dc705360c365": { slug: "samsung-family-premium-waiver" }, // 삼성생명 가족계약 납입면제·할인
  "1f5b8f7d-28e2-4c72-8398-00e076cdfbc5": { slug: "samsung-targeted-dementia-aria-h" }, // 삼성생명 통합표적치매(ARIA-H)
  "c914fdb7-d948-4812-ab94-4e4db6caf728": { slug: "db-ltc-plus" }, // DB생명 장기요양플러스
  "4123fa0e-1a61-436a-b0d7-a902de8a178d": { slug: "heungkuk-fire-dementia-mri" }, // 흥국화재 표적치매 MRI
  "c4e904fe-000c-4c5f-9ce4-93b36d70e932": { slug: "hyundai-antiviral-amniocentesis" },
  "2e7f92b0-0c0d-4e62-ae61-a400a7d58d0c": { slug: "hanwha-safe-location-sharing" },
  "a879f457-f0f2-4db2-b3ec-91c4873f7df0": { slug: "kyobo-stroke-unit-admission" },
  "cbce8bf6-72dc-481b-9ab0-c9a6b0def388": { slug: "lina-neuro-disease-diagnosis" },
  "817cfe5e-3620-4030-ba9b-9a95dbeb93cb": { slug: "shinhan-life-switching-savings" },
  "bf3df83f-7121-440b-a818-e1318a64f0ce": { slug: "hanwha-assistive-device-support" },
  "cb0ed5bb-15b3-411e-b289-47367396cb84": { slug: "heungkuk-fire-deferred-limit-treatment" },
  "29a9e889-43ea-4b0d-b27e-7c116ab7b7dc": { slug: "samsung-fire-organ-support-drug" },
};

export function getCardNews(postId: string): CardNewsSet | undefined {
  return CARDNEWS[postId];
}
