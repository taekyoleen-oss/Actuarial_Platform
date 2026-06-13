/**
 * 일본 금융청(FSA) 보험상품 심사사례 — 데이터 로더·타입 (서버/클라 공용)
 *
 * 원문(cases.json)은 public/global/japan-fsa/cases.html DATA에서 무손실 추출
 * (_workspace/extract_fsa_data.mjs · verify_fsa_data.mjs).
 * enrichment.json(분류·한줄핵심·한국 맥락)은 원문과 분리된 부가 레이어 — 원문 불변.
 */
import casesJson from "@/data/japan-fsa/cases.json";
import enrichmentJson from "@/data/japan-fsa/enrichment.json";
import glossaryJson from "@/data/japan-fsa/glossary.json";
import koreaKbJson from "@/data/japan-fsa/korea-kb.json";
import { FSA_THEMES, THEME_BY_ID, type FsaTheme } from "@/data/japan-fsa/themes";

/* ---------- 원문 타입 (cases.html DATA와 동형) ---------- */

export interface FsaCaseBg {
  title?: string;
  para?: string;
  list?: string[];
  note?: string;
}

export interface FsaCase {
  /** `${ym}-${fieldNo}-${idx}` — 추출 시 부여 */
  id: string;
  /** 짧은 주제 마커 (원문) */
  chip: string;
  /** 근거 법령 (원문) */
  law: string;
  title: string;
  /** 신청·조회 내용 (Q) */
  case: string;
  /** 금융청 판단·조치 (A) */
  act: string;
  /** 배경·논점 */
  bg?: FsaCaseBg;
}

export interface FsaField {
  no: string;
  title: string;
  cases: FsaCase[];
}

export interface FsaPeriod {
  ym: string;
  year: number;
  month: number;
  label: string;
  sub: string;
  fields: FsaField[];
}

/* ---------- 인리치먼트 타입 (부가 레이어) ---------- */

export interface KoreaReg {
  /** 규정명 (예: 보험업감독규정) */
  name: string;
  /** 조항 (예: §7-60) */
  ref: string;
  /** 해당 사례와의 연결 포인트 */
  point: string;
}

export interface CaseKoreaContext {
  /** 사례 특이 한국 맥락 (2~4문장) */
  note: string;
  /** korea-kb.json 항목 id 참조 */
  kbRefs: string[];
  /** 사례 직결 규정 (선택 — KB 규정의 부분집합/보강) */
  regs?: KoreaReg[];
}

export interface CaseEnrichment {
  /** 한 줄 핵심 */
  tldr: string;
  /** themes.ts id 1~3개 */
  themes: string[];
  /** glossary.json term 참조 */
  terms: string[];
  /** 원문 내 핵심 구절 (렌더 시 문자열 매칭 하이라이트 — 원문 불변) */
  keyPhrases: string[];
  kr: CaseKoreaContext;
}

export interface GlossaryTerm {
  /** 표기 (본문 매칭 키) */
  term: string;
  /** 일본어 원어 (있으면) */
  original?: string;
  definition: string;
  /** 한국의 대응 개념 */
  koreanEquivalent?: string;
  note?: string;
  /** 본문 매칭용 동의 표기 */
  aliases?: string[];
}

export interface KoreaKbEntry {
  id: string;
  title: string;
  /** 연결 테마 id */
  themeIds: string[];
  /** 한국 현황 */
  status: string;
  /** 한국의 유사 사례·이슈 */
  cases: string;
  regs: KoreaReg[];
  /** 시사점 */
  implication: string;
  /** 리서치 출처 URL */
  sources?: string[];
}

/* ---------- 로더 ---------- */

export const FSA_PERIODS = casesJson as unknown as FsaPeriod[];
export const FSA_ENRICHMENT = enrichmentJson as unknown as Record<
  string,
  CaseEnrichment
>;
export const FSA_GLOSSARY = glossaryJson as unknown as GlossaryTerm[];
export const FSA_KOREA_KB = koreaKbJson as unknown as KoreaKbEntry[];
export { FSA_THEMES, THEME_BY_ID };
export type { FsaTheme };

export interface FlatCase {
  c: FsaCase;
  ym: string;
  periodLabel: string;
  fieldNo: string;
  fieldTitle: string;
  enrichment?: CaseEnrichment;
}

let _flat: FlatCase[] | null = null;

/** 전 사례 평탄화 (호 최신순 → 분야 순) */
export function getAllCases(): FlatCase[] {
  if (_flat) return _flat;
  const out: FlatCase[] = [];
  for (const p of FSA_PERIODS) {
    for (const f of p.fields) {
      for (const c of f.cases) {
        out.push({
          c,
          ym: p.ym,
          periodLabel: p.label,
          fieldNo: f.no,
          fieldTitle: f.title,
          enrichment: FSA_ENRICHMENT[c.id],
        });
      }
    }
  }
  _flat = out;
  return out;
}

export function getCaseById(id: string): FlatCase | undefined {
  return getAllCases().find((x) => x.c.id === id);
}

const KB_BY_ID = new Map(FSA_KOREA_KB.map((e) => [e.id, e]));
export function getKbEntry(id: string): KoreaKbEntry | undefined {
  return KB_BY_ID.get(id);
}

const GLOSSARY_BY_TERM = new Map(FSA_GLOSSARY.map((g) => [g.term, g]));
export function getGlossaryTerm(term: string): GlossaryTerm | undefined {
  return GLOSSARY_BY_TERM.get(term);
}

/** 테마별 사례 수 (허브·필터 분포 표시용) */
export function themeCounts(): Map<string, number> {
  const m = new Map<string, number>();
  for (const fc of getAllCases()) {
    for (const t of fc.enrichment?.themes ?? []) {
      m.set(t, (m.get(t) ?? 0) + 1);
    }
  }
  return m;
}

/** 분야 대분류 (생보 약관 / 생보 산출 / 손보 약관 / 손보 산출 ...) */
export function fieldGroups(): string[] {
  const s = new Set<string>();
  for (const p of FSA_PERIODS) for (const f of p.fields) s.add(f.title);
  return [...s];
}

export const FSA_STATS = (() => {
  const periods = FSA_PERIODS.length;
  const cases = FSA_PERIODS.reduce(
    (s, p) => s + p.fields.reduce((t, f) => t + f.cases.length, 0),
    0
  );
  const sorted = [...FSA_PERIODS].sort(
    (a, b) => a.year - b.year || a.month - b.month
  );
  return {
    periods,
    cases,
    from: sorted[0]?.label ?? "",
    to: sorted[sorted.length - 1]?.label ?? "",
  };
})();
