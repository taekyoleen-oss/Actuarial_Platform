/**
 * 일본 FSA 심사사례 테마 분류 체계 (파셋 탐색 1축)
 * 칩 색은 globals.css의 --chip-* 뮤트 팔레트(8색)를 참조 — FSA 탐색기 한정 스코프.
 */
export interface FsaTheme {
  id: string;
  /** 칩·필터 표시명 */
  name: string;
  /** 짧은 설명 (필터 툴팁·허브 타일) */
  description: string;
  /** globals.css --chip-{color}-bg/-fg */
  color:
    | "blue"
    | "teal"
    | "amber"
    | "rose"
    | "violet"
    | "green"
    | "slate"
    | "cyan";
}

export const FSA_THEMES: FsaTheme[] = [
  {
    id: "consumer-protection",
    name: "계약자 보호·해지환급금",
    description: "무·저해지환급금형, MVA, 해지 시 불이익 비교형량 등 계약자 보호 논점",
    color: "rose",
  },
  {
    id: "pricing",
    name: "요율·산출방법",
    description: "예정이율·위험률·참고순율·요율 세분화 등 산출방법서 심사",
    color: "blue",
  },
  {
    id: "tech-data",
    name: "신기술·데이터",
    description: "텔레매틱스, 스마트폰 데이터, 자율주행, 빅데이터 활용 상품",
    color: "cyan",
  },
  {
    id: "group-credit",
    name: "단체보험·단신",
    description: "단체신용생명보험(団信), 페어론, 단체성 요건",
    color: "slate",
  },
  {
    id: "moral-risk",
    name: "모럴리스크·역선택",
    description: "도덕적 해이·역선택 방지 장치, 부정 청구 대비",
    color: "amber",
  },
  {
    id: "social-change",
    name: "사회·제도 변화 대응",
    description: "법 개정·새 제도(자가용차 활용사업 등)·사회 변화에 따른 상품 대응",
    color: "green",
  },
  {
    id: "disclosure",
    name: "정보제공·공시",
    description: "비용 공시, 설명자료, 주의환기 등 고객에 대한 정보제공 충실화",
    color: "violet",
  },
  {
    id: "benefit-design",
    name: "급부 설계·상품성",
    description: "급부 구조의 분야(1·2·3분야) 정리, 건강환부금·톤틴 등 상품성 논점",
    color: "teal",
  },
  {
    id: "third-sector",
    name: "제3분야·건강",
    description: "의료·암·간병·치매·취업불능 등 제3분야 상품",
    color: "blue",
  },
  {
    id: "new-products",
    name: "파라메트릭·신상품",
    description: "인덱스(지수형)·파라메트릭, 펫보험 등 새로운 유형의 상품",
    color: "teal",
  },
  {
    id: "fx-variable",
    name: "외화·변액·자산형성",
    description: "외화건 보험, 변액보험, 자산형성형 상품의 심사 논점",
    color: "violet",
  },
  {
    id: "channel",
    name: "채널·모집",
    description: "모집 방식, 포인트 부여, 비교사이트, 페이퍼리스 등 판매 채널",
    color: "slate",
  },
  {
    id: "etc",
    name: "기타",
    description: "위 분류에 속하지 않는 사례",
    color: "green",
  },
];

export const THEME_BY_ID = new Map(FSA_THEMES.map((t) => [t.id, t]));
