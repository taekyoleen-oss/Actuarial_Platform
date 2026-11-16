import type { PostListItem } from "@/types";

/**
 * 배타적사용권 목록 필터(보험 종류·회사·보장) — 제목에서 분류한다(ib_posts 스키마 미변경, postSections와 같은 방식).
 * 새 게시물이 엉뚱하게 분류되면 아래 정규식만 보완한다.
 */
export const LINES = ["생명", "장기", "일반", "자동차"] as const;

export const COVERAGES: { label: string; match: RegExp }[] = [
  { label: "암", match: /암/ },
  { label: "치매·신경", match: /치매|신경|인지|아밀로이드|ARIA/ },
  { label: "뇌·심장·응급", match: /뇌졸중|뇌출혈|심폐|제세동|응급/ },
  { label: "수술·치료", match: /수술|치료|주입술|약물/ },
  { label: "검사·진단", match: /검사|진단|MRI|WGS|PET/ },
  { label: "여성·소아", match: /자궁|융모막|양수|성조숙/ },
  { label: "간병·요양", match: /간병|요양|보조기기/ },
  { label: "종신·연금·저축", match: /종신|연금|저축|펀드|ETF|톤틴|환급|페이백/ },
  { label: "심사·할인 제도", match: /심사|언더라이팅|납입면제|할인|무사고|감액|한도이연/ },
  { label: "서비스·현물", match: /변호사|위치|코칭|현물|서비스/ },
];

export const companyOf = (title: string) => title.trim().split(/\s+/)[0];

export function lineOf(title: string): (typeof LINES)[number] {
  const co = companyOf(title);
  if (/생명|라이프/.test(co)) return "생명";
  const rest = title.slice(co.length);
  if (/자동차|운전자/.test(rest)) return "자동차";
  if (/배상|화재보험|여행|재물|일반/.test(rest)) return "일반";
  return "장기";
}

export const coveragesOf = (title: string) =>
  COVERAGES.filter((c) => c.match.test(title)).map((c) => c.label);

export type FacetKey = "line" | "co" | "cov";
export type FacetSel = Partial<Record<FacetKey, string>>;

function hit(p: PostListItem, key: FacetKey, v: string) {
  if (key === "line") return lineOf(p.title) === v;
  if (key === "co") return companyOf(p.title) === v;
  return coveragesOf(p.title).includes(v);
}

export function applyFacets(posts: PostListItem[], sel: FacetSel, skip?: FacetKey) {
  return posts.filter((p) =>
    (Object.keys(sel) as FacetKey[]).every((k) => k === skip || !sel[k] || hit(p, k, sel[k]!))
  );
}

/** 각 항목의 선택지와 건수 — 건수는 '다른' 필터를 적용한 상태 기준(표준 패싯 방식). */
export function facetOptions(posts: PostListItem[], sel: FacetSel) {
  const count = (key: FacetKey, values: string[]) => {
    const base = applyFacets(posts, sel, key);
    return values.map((v) => ({ value: v, count: base.filter((p) => hit(p, key, v)).length }));
  };
  const companies = [...new Set(posts.map((p) => companyOf(p.title)))].sort((a, b) => a.localeCompare(b, "ko"));
  return {
    line: count("line", [...LINES]),
    co: count("co", companies),
    cov: count("cov", COVERAGES.map((c) => c.label)),
  };
}

// 자가 점검: node --experimental-strip-types lib/exclusiveFacets.ts
if (typeof process !== "undefined" && process.argv[1]?.endsWith("exclusiveFacets.ts")) {
  const eq = (a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`); };
  eq(lineOf("하나손해보험 자동차사고 변호사선임 현물급부 담보 분석"), "자동차");
  eq(lineOf("흥국화재 표적치매약물 치료 중 MRI 검사지원비 담보 분석"), "장기");
  eq(lineOf("신한라이프 신한톤틴연금보험(생존자 재분배) 분석"), "생명");
  eq(companyOf("흥국생명 (무)플렉스 리턴100종신보험"), "흥국생명");
  eq(coveragesOf("교보생명 급여뇌졸중집중치료실입원치료특약"), ["뇌·심장·응급", "수술·치료"]);
  console.log("exclusiveFacets ok");
}
