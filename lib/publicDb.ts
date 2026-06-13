// 주요 공공DB 섹션 데이터 — SQL_Builder 카탈로그(ERD)와 웹 리서치 기반 DB 특성.
// ERD 원천: SQL_Builder/src/dbcodegen/catalog/{nsc2,hps}.yaml(erd_payload) + nps(HIRA) 작성.
//   → data/public-db-erd.json (Python core.erd_payload 무손실 덤프 + nps 메타).
// 특성(profile)은 공식 기관 자료 웹 리서치로 작성하고 출처를 함께 표기한다.

import erdData from "@/data/public-db-erd.json";

export interface DbColumn {
  name: string;
  key: boolean;
  desc: string;
}
export interface DbTable {
  id: string;
  name: string;
  label: string;
  unit: string;
  col: number;
  group: string;
  columns: DbColumn[];
}
export interface DbRelation {
  from: string;
  to: string;
  via: string;
  label: string;
}
export interface DbErd {
  source: string;
  display_name: string;
  code_system: string;
  keys: Record<string, string>;
  tables: DbTable[];
  relations: DbRelation[];
}

const ERD = erdData as unknown as Record<string, DbErd>;

export interface DbFact {
  label: string;
  value: string;
}
export interface DbSource {
  label: string;
  url: string;
}
export interface DbProfile {
  id: string; // nsc2 | nps | hps
  shortName: string; // 카드·탭 표기
  fullName: string;
  provider: string;
  tagline: string; // 한 줄 요약
  structure: string; // 종단 / 횡단 등 (배지)
  summary: string[]; // 개요 문단
  facts: DbFact[]; // 핵심 제원
  strengths: string[];
  cautions: string[];
  uses: string[];
  sources: DbSource[];
}

export const DB_ORDER = ["nsc2", "nps", "hps"] as const;

export const PROFILES: Record<string, DbProfile> = {
  nsc2: {
    id: "nsc2",
    shortName: "표본코호트",
    fullName: "국민건강보험공단 표본코호트 2.2 DB",
    provider: "국민건강보험공단(NHIS) · 국민건강보험자료 공유서비스(NHISS)",
    tagline:
      "전 국민의 약 2% 표본을 2002년부터 추적하는 종단(panel) 코호트 — 자격·진료·검진·사망·장기요양을 개인키로 연계한다.",
    structure: "종단(longitudinal) panel · 동일인 추적",
    summary: [
      "국민건강보험공단이 보유한 자격·진료·검진 자료를 무작위 층화추출하여 구축한 종단 코호트로, 동일인을 장기간 추적할 수 있도록 익명 개인고유번호(RN_INDI)로 자격·출생사망·진료·건강검진·노인장기요양을 하나로 연계한다.",
      "진료자료는 의과·보건기관(M)·치과(D)·한방(K)·약국(P) 서식으로 구성되며, 명세서(T20)를 허브로 진료내역(T30)·상병내역(T40)·처방전상세(T60)가 청구고유번호(RN_KEY)로 연결된다. 통계청 사망원인 자료가 연계되어 사망연월·사인(KCD)까지 포함한다.",
    ],
    facts: [
      { label: "자료 성격", value: "종단(panel) — 동일인 장기 추적" },
      {
        label: "표본 규모",
        value: "약 100만 명(전 국민의 약 2%, 무작위 층화추출)",
      },
      { label: "관찰 기간", value: "2002 ~ 2019 (2.2 기준)" },
      { label: "상병코드", value: "KCD(한국표준질병사인분류)" },
      { label: "연계", value: "통계청 사망원인 DB(사망연월·사인)" },
      {
        label: "구성",
        value: "자격·보험료 / 진료(명세서·내역·상병·처방) / 건강검진 / 요양기관 / 노인장기요양",
      },
    ],
    strengths: [
      "동일인 장기 추적 → 발생률·생존분석·질병 자연사 연구 가능",
      "소득분위·장애·건강검진 수치(혈압·혈당·BMI·간기능 등)까지 포함 → 위험요인 분석",
      "사망 연계로 사망원인별 분석·관찰 절단(censoring) 처리 가능",
    ],
    cautions: [
      "약 2% 표본이라 희귀질환·소집단 분석은 검정력에 한계",
      "청구 기반 — 청구상병과 실제 진단의 불일치·비급여 누락 가능",
      "폐쇄망(분석센터) 내 분석 원칙, 원자료 반출 제한",
    ],
    uses: [
      "신규 위험률·발생률 산출",
      "만성질환 역학·의료이용·의료비 분석",
      "건강나이·예측모형 등 위험요인 모델링",
    ],
    sources: [
      {
        label: "NHISS — 표본연구DB 세부내역",
        url: "https://nhiss.nhis.or.kr/bd/ab/bdaba009cv.do",
      },
      {
        label: "보건의료연구를 위한 건강보험 자료의 효과적 활용방법 (J Health Info Stat, 2022)",
        url: "https://www.e-jhis.org/upload/pdf/jhis-2022-47-S2-S31.pdf",
      },
    ],
  },
  nps: {
    id: "nps",
    shortName: "심평원 환자표본(HIRA-NPS)",
    fullName: "건강보험심사평가원 환자표본자료 (HIRA-NPS)",
    provider: "건강보험심사평가원(HIRA) · 보건의료 빅데이터 개방시스템",
    tagline:
      "전체 환자의 약 3%(약 140만 명)를 연령·성별 층화 무작위추출한 연 단위 횡단 표본 — 명세서를 허브로 진료·상병·처방·기관을 연결한다.",
    structure: "횡단(cross-section) · 연도별 독립 표본",
    summary: [
      "건강보험심사평가원이 심사·청구 자료에서 연령·성별로 층화하여 무작위추출한 환자표본자료로, 한 해(자료연도) 동안의 전국 의료이용 단면을 가중치(SamplingWeight)로 추정할 수 있도록 설계되었다. 전체 환자의 약 3%, 약 140만 명 규모이며 대표성 검증을 거친다.",
      "명세서일반(T200)을 허브로 진료내역(T300)·상병내역(T400)·처방내역(T530)이 명세서일련번호(SPEC_ID_SNO)로 연결되고, 요양기관(YKIHO)은 요양기관ID(YID)로 연결된다. 환자ID(JID)는 자료연도 내에서만 유효하다.",
    ],
    facts: [
      { label: "자료 성격", value: "횡단 — 연도별 독립 표본(동일인 연간 추적 불가)" },
      { label: "표본 규모", value: "약 140만 명(전체 환자의 약 3%)" },
      { label: "추출", value: "연령·성별 층화 무작위추출 + 대표성 검증" },
      { label: "관찰 기간", value: "연 단위 (앱 카탈로그 기준 2009 ~ 2019)" },
      { label: "상병코드", value: "KCD" },
      { label: "가중치", value: "SamplingWeight — 전국 추정 시 필수" },
    ],
    strengths: [
      "단년도 전국 의료이용 단면을 가중추정 → 유병·이용·진료비 단면 통계",
      "청구 명세서 전 구성요소(상병·행위/수가·약제·기관) 포함",
      "표본 규모가 커 단면 분석의 안정성이 높음",
    ],
    cautions: [
      "횡단 — 환자ID(JID)가 연도 내만 유효해 최초발생률·washout·코호트 추적 불가",
      "반드시 가중치(SamplingWeight)를 적용하고 표본오차를 고려",
      "청구 기반 한계(비급여 누락 등)",
    ],
    uses: [
      "연도별 유병률·의료이용률·진료비 단면 분석",
      "약물 사용 패턴·처방 분석",
      "질병·시술별 의료이용 규모 추정",
    ],
    sources: [
      {
        label: "건강보험심사평가원 환자표본자료(HIRA-NPS)의 소개 (HIRA OAK)",
        url: "https://repository.hira.or.kr/handle/2019.oak/894",
      },
      {
        label: "새로운 환자표본자료 표본 추출 및 대표성 검증 (HIRA Research, 2021)",
        url: "https://repository.hira.or.kr/bitstream/2019.oak/2593/1/2021%20HIRA%20Research%201%EA%B6%8C%202%ED%98%B8%206.pdf",
      },
      {
        label: "보건의료 빅데이터 개방시스템",
        url: "https://opendata.hira.or.kr/home.do",
      },
    ],
  },
  hps: {
    id: "hps",
    shortName: "환자조사",
    fullName: "보건복지부 환자조사 마이크로데이터 (2016)",
    provider: "보건복지부 승인통계 · 통계청 MDIS 제공",
    tagline:
      "전국 의료기관 표본을 대상으로 외래·퇴원 환자 기록을 수집하는 횡단 표본조사 — 승수(가중)로 전국 모집단을 추정한다.",
    structure: "횡단 표본조사 · 기관/환자 record-level",
    summary: [
      "보건복지부 승인통계인 환자조사는 전국 의료기관을 표본으로 추출해 의료기관의 시설·인력과 환자(외래·퇴원)의 임상정보를 함께 수집하는 횡단 조사로, 승수(wt)를 곱해 전국 모집단으로 확대 추정한다. 통계청 마이크로데이터 통합서비스(MDIS)를 통해 제공된다.",
      "기관 조사표(INST)를 허브로 외래환자(OUT)·퇴원환자(DIS) 기록이 연결번호(num)로 1:N 연결되며, 진료과 코드(DEPT)를 참조한다. 진단은 KCD-7, 수술은 ICD-9-CM 체계를 사용한다.",
    ],
    facts: [
      { label: "자료 성격", value: "횡단 표본조사(record-level)" },
      { label: "추정", value: "승수(wt) 가중 → 전국 모집단 추정" },
      { label: "조사표", value: "기관 / 외래환자 / 퇴원환자 (+진료과 코드)" },
      { label: "코드", value: "진단 KCD-7 · 수술 ICD-9-CM" },
      { label: "기준연도", value: "2016 (앱 레이아웃 기준)" },
    ],
    strengths: [
      "의료기관 시설·인력·병상 + 환자(외래/퇴원) 임상정보를 동시 확보",
      "청구자료로 잡기 어려운 재원일수·치료결과·입원경로·ADL 등 조사항목 제공",
      "전국 의료자원·의료이용 행태를 가중추정 가능",
    ],
    cautions: [
      "횡단 표본조사 — 개인 추적 불가, 반드시 승수(wt) 적용",
      "record-level(환자 1건=1행)이라 동일 환자 중복 가능",
      "부수술코드 등 일부 항목은 2016 마이크로데이터에서 미제공",
    ],
    uses: [
      "의료이용 행태·질병구조 분석",
      "재원일수·치료결과 등 입원 환자 분석",
      "의료자원(병상·인력) 분포 분석",
    ],
    sources: [
      {
        label: "통계청 마이크로데이터 통합서비스(MDIS)",
        url: "https://mdis.kostat.go.kr/",
      },
      {
        label: "보건복지부 — 환자조사(승인통계)",
        url: "https://www.mohw.go.kr/",
      },
    ],
  },
};

export function listDbs(): DbProfile[] {
  return DB_ORDER.map((id) => PROFILES[id]);
}

export function getDb(
  id: string
): { profile: DbProfile; erd: DbErd } | null {
  const profile = PROFILES[id];
  const erd = ERD[id];
  if (!profile || !erd) return null;
  return { profile, erd };
}
