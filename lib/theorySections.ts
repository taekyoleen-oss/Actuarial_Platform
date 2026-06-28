import type { TheoryItem, TheoryTopicSlug } from "./theory";

/**
 * 보험이론 사전 — 주제(대 카테고리) 안의 "서브카테고리" 정의(2026-06-28 사용자 요청).
 * lib/postSections.ts 패턴을 따른다: ib/폴더에 분류 컬럼을 두지 않고 제목·파일명 키워드로
 * 코드에서 분류한다. 매칭은 `base + " " + title`(한글 표제어 + 영문 병기)에 대해 수행하며,
 * 비(非)default 섹션을 배열 순서대로 먼저 평가하고 남으면 default로 떨어진다.
 * 새 자료는 키워드에 걸리지 않으면 default 섹션으로 모인다(분류가 필요하면 match 보완).
 */
export interface TheorySectionDef {
  title: string;
  /** 이 섹션으로 분류할 키워드(정규식). default 섹션은 생략. */
  match?: RegExp;
  /** 매칭되지 않은 항목이 모이는 섹션 */
  isDefault?: boolean;
}

export const THEORY_SECTIONS: Record<string, TheorySectionDef[]> = {
  life: [
    {
      title: "생명표·생존모형",
      match:
        /생명표|사망법칙|곰페르츠|드무아브르|고장률|생존분석|평균잔여수명|프레일티|렉시스|코호트|경쟁위험|중도절단|탈퇴|보정평활|더빗/,
    },
    { title: "보험료·준비금·이익", isDefault: true },
    {
      title: "상품·보장",
      match:
        /건강보험|질병보험|상해보험|장기간병|소득보상|단체생명|변액보험|보험가능성|옵션과 ?보증/,
    },
    { title: "계약관리·재보험", match: /실효|해약|계약변경|생명재보험/ },
  ],
  pension: [
    {
      title: "연금제도·기금·급여",
      match: /연금제도|사회보장|기금의자산|종업원급여|재무위험회계/,
    },
    { title: "연금수리·잉여금", isDefault: true },
  ],
  general: [
    {
      title: "보종·상품",
      match:
        /자동차보험|화재보험|해상보험|항공보험|지진보험|홍수|농작물|양식보험|도난보험|여행보험|재물보험|주택종합|영업용종합|배상책임|사용자배상|고용관행|산업재해|실업보험|금융보험|모기지보험|신원보증|이행보증|캡티브|자가보험/,
    },
    {
      title: "요율·가격산정",
      match:
        /요율산정|위험분류|경험요율|익스포저|파레토 ?요율|버닝코스트|베일리|보너스|분리법|사후정산보험료|언더라이팅 ?사이클|손해율|합산비율|사업비율|발생.?노출/,
    },
    {
      title: "준비금 산정",
      match:
        /준비금|연쇄사다리|본후터|베이지안|칼만|신뢰도법|손해사정비|ALAE|종결 ?클레임/,
    },
    {
      title: "담보·약관",
      match: /^담보 |담보 \(|자기부담금|보험증권|간접손해|^전손|재조달가액/,
    },
    { title: "시장·규제·경영·기타", isDefault: true },
  ],
  reinsurance: [
    {
      title: "비비례 재보험",
      match: /비비례|초과손해액|초과손해율|워킹커버|ECOMOR|최대클레임/,
    },
    { title: "비례 재보험", match: /비례재보험|비례할당|초과액특약|공동보험/ },
    { title: "프로그램·요율·감독", isDefault: true },
  ],
  risk: [
    {
      title: "파산이론·위험과정",
      match:
        /파산|룬드베리|크라메르|조정계수|잉여금과정|위험과정|적분꼬리|비크만|확산근사|운영 ?시간|암메터/,
    },
    {
      title: "손실분포·집합위험",
      match:
        /총손실|집합위험|개별위험|복합|합성분포|드프릴|순트|헤크만|클레임|인플레이션|준지수/,
    },
    {
      title: "위험측도·자본·지급여력",
      match:
        /위험가치|위험측도|위험순서화|위험기반자본|자본배분|지급여력|지급불능|변동준비금|보험규제와감독|동태적재무|DFA/,
    },
    { title: "효용·의사결정·위험분담", isDefault: true },
  ],
  finance: [
    {
      title: "시장·자산가격결정",
      match:
        /금융시장|시장균형|시장모형|균형이론|완비시장|불완비시장|효율적시장|차익거래|풀링균형/,
    },
    {
      title: "파생상품·헤징",
      match: /블랙|이항모형|파생|변동성|헤징|위험최소화|재해파생|금융공학/,
    },
    {
      title: "금리·채권·자산부채",
      match: /금리|듀레이션|볼록성|채권|매칭|자산부채/,
    },
    {
      title: "투자·포트폴리오",
      match:
        /포트폴리오|자산운용|집합투자|확률적투자|윌키|효용극대화|확률최적화|확률제어|거래비용|레버리지/,
    },
    { title: "보험재무·신용·기타", isDefault: true },
  ],
  statistics: [
    { title: "극단값·꼬리", match: /극단값|안정성/ },
    {
      title: "확률과정",
      match:
        /확률과정|시뮬레이션|마르코프|마팅게일|포아송 ?과정|가우스 ?과정|브라운|확산과정|점 ?과정|계수과정|재생|샷노이즈|정상과정|랜덤워크|디리클레|대기행렬|위상법|장기기억|여과|측도변환|커플링/,
    },
    {
      title: "확률분포",
      match: /분포|코퓰러|합성곱|이산화|감마함수|베타함수/,
    },
    {
      title: "확률론·확률변수",
      match: /확률론|확률변수|중심극한정리|조합론|와링정리|의사결정이론/,
    },
    { title: "추정·통계모형", isDefault: true },
  ],
};

export interface GroupedTheorySection {
  title: string;
  items: TheoryItem[];
}

/** 주제의 자료를 서브카테고리로 분류. 비어 있는 서브카테고리는 제외. */
export function groupTheoryItems(
  topicSlug: TheoryTopicSlug,
  items: TheoryItem[]
): GroupedTheorySection[] {
  const secs = THEORY_SECTIONS[topicSlug];
  if (!secs) return items.length ? [{ title: "전체", items }] : [];

  const buckets = new Map<string, TheoryItem[]>(secs.map((s) => [s.title, []]));
  const def = secs.find((s) => s.isDefault) ?? secs[secs.length - 1];

  for (const it of items) {
    const hay = `${it.base} ${it.title}`;
    const hit = secs.find((s) => s.match && s.match.test(hay));
    buckets.get((hit ?? def).title)!.push(it);
  }

  return secs
    .map((s) => ({ title: s.title, items: buckets.get(s.title)! }))
    .filter((g) => g.items.length > 0);
}
