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
  /** ERD가 원본 스키마가 아니라 공개자료 기반 추정(논리) 모델일 때 true → '추정 ERD' 표시 */
  estimated?: boolean;
  /** 네이티브 ERD(JSON) 대신 완성형 HTML 문서를 ERD로 임베드할 때의 경로(public 기준) */
  embedHtml?: string;
}

export const DB_ORDER = ["nsc2", "nps", "hps", "knhanes", "knhanes_cod", "jmdc"] as const;

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
      "건강보험 청구(명세서) 행정자료에서 연령·성별 층화 무작위추출한 환자 표본(약 3%·140만 명, 심평원). 명세서를 허브로 진료·상병·처방·기관을 연결한다.",
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
      "청구자료가 아닌, 전국 의료기관을 대상으로 외래·퇴원 환자 기록을 직접 수집하는 표본조사(보건복지부·통계청). 시설·인력까지 포함해 승수로 전국을 추정한다.",
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
  knhanes: {
    id: "knhanes",
    shortName: "국민건강영양조사",
    fullName: "국민건강영양조사 제9기(2022-2024) 원시자료 (KNHANES)",
    provider: "질병관리청(KDCA) · 국민건강영양조사 누리집(knhanes.kdca.go.kr)",
    tagline:
      "전국 가구 표본의 1세 이상 가구원을 대상으로 건강설문·검진·영양을 함께 조사하는 복합표본 조사 — 개인(ID)으로 기본 DB와 식품섭취 DB를 연계한다.",
    structure: "횡단 복합표본조사(순환표본) · 가구→개인",
    summary: [
      "질병관리청이 매년 시행하는 국가 승인통계로, 인구주택총조사 기반 층화집락 표본(조사구→가구)에서 1세 이상 가구원을 대상으로 건강설문조사·검진조사·영양조사를 함께 수행한다. 2007년(제4기) 순환표본조사를 도입해 연중 조사하며, 목표모집단(대한민국 국민)으로 확대 해석하려면 복합표본설계 요소(가중치·층·집락)를 반영해 분석해야 한다.",
      "원시자료는 개인당 1행인 기본 DB(HNYR_ALL, YR=연도 2자리)와, 24시간 회상법 식품섭취조사 DB(HNYR_24RC, 개인·끼니·음식·식품재료별 다행)로 구성된다. 두 파일은 개인고유번호(ID)로 연계하며, 검진(HE_*)·영양 요약(N_*) 변수는 기본 DB에 포함된다.",
    ],
    facts: [
      { label: "자료 성격", value: "횡단 복합표본조사(순환표본·연중)" },
      {
        label: "표본",
        value: "연간 약 1만 명(층화집락: 조사구→가구→1세 이상 가구원)",
      },
      { label: "기간(9기)", value: "2022 ~ 2024 (연도별 파일)" },
      { label: "조사부문", value: "건강설문 · 검진 · 영양(식생활·식품섭취)" },
      { label: "측정", value: "검진 HE_* · 영양 N_* · 식품섭취 24시간 회상" },
      {
        label: "복합표본",
        value: "가중치(wt_itvex·wt_ntr·wt_tot) · 층(kstrata) · 집락(psu)",
      },
    ],
    strengths: [
      "검진 실측치(혈압·혈당·지질·체격) + 건강행태·이환 + 식이 섭취를 한 사람 단위로 동시 확보",
      "24시간 회상 식품섭취조사로 영양소 1일 섭취량 산출 가능",
      "국가 대표 표본 — 가중치 적용 시 전국민 단면 추정",
    ],
    cautions: [
      "횡단 — 개인 추적 불가(코호트 아님), 발생률 산출에는 부적합",
      "복합표본설계 분석 필수 — 가중치·층·집락 미반영 시 추정·표준오차 왜곡",
      "식품섭취 DB(HNYR_24RC)는 개인당 다행(1:N) — 1인 1행 기본 DB와 분석 단위 구분",
      "자가보고(건강설문)·1일 회상(식이)의 측정 한계",
    ],
    uses: [
      "만성질환 유병률·위험요인(비만·고혈압·당뇨·이상지질) 단면 분석",
      "식이·영양소 섭취와 건강지표 연관성 분석",
      "국가·지역 건강지표 산출, 보험 위험요인 기초통계",
    ],
    sources: [
      {
        label: "국민건강영양조사 누리집 (질병관리청) — 원시자료·이용지침서",
        url: "https://knhanes.kdca.go.kr/",
      },
      {
        label: "국민건강통계 제9기 1차년도(2022) 주요 결과 (정책브리핑)",
        url: "https://www.korea.kr/archive/expDocView.do?docId=40757",
      },
    ],
  },
  knhanes_cod: {
    id: "knhanes_cod",
    shortName: "건강영양–사망원인 연계",
    fullName: "국민건강영양조사–사망원인통계 연계자료 (ver 2.2)",
    provider: "질병관리청(건강영양조사분석과) + 통계청 사망원인통계(MDIS 연계)",
    tagline:
      "국민건강영양조사 단면 자료에 통계청 사망원인통계를 붙여 사망여부·사인·사망시점을 추적하는 연계(준코호트) 자료 — 검진·식이·건강행태를 사망 결과와 잇는 생존분석이 가능해진다.",
    structure: "단면조사 + 사망 추적 연계(준코호트) · 개인(ID_New)",
    summary: [
      "질병관리청이 국민건강영양조사 참여자 중 사망원인통계 연계에 동의하고 주민등록번호가 유효한 19세 이상을 통계청 사망원인통계와 연계한 자료다. 2007~2018년 조사참여자 약 7.2만 명 중 약 7.0만 명(97.5%)이 최종 연계되었고, 사망 추적은 2007~2023년까지 이어진다. 단면 조사인 국민건강영양조사에 사망여부·사인·사망시점이 더해져, 검진·식이·건강행태를 사망 결과와 연결하는 생존분석이 가능해진다.",
      "자료는 2007–2018년 국민건강영양조사 원시자료와 사망원인통계 변수를 하나의 기본DB(개인 1행)로 묶어 제공하며, 분석용 개인키 ID_New를 새로 부여한다(기존 ID·나이 등은 제외). 식품섭취조사(24시간 회상)는 개인당 여러 행이므로 별도 DB로 분리되어 같은 ID_New로 연계된다.",
    ],
    facts: [
      { label: "자료 성격", value: "단면조사 + 사망 추적 연계(준코호트)" },
      {
        label: "연계 대상",
        value: "2007–2018 KNHANES 참여자(19세+), 약 7.0만 명(연계율 97.5%)",
      },
      { label: "사망 추적", value: "2007–2023 통계청 사망원인통계" },
      { label: "연계키", value: "ID_New(연계 전용 개인키)" },
      { label: "사망 변수", value: "사망여부 · 사망원인(KCD) · 사망 연·월(+장소)" },
      { label: "구성", value: "기본DB(개인 1행) + 식품섭취조사(개인 N행, 별도)" },
    ],
    strengths: [
      "검진 실측·식이·건강행태(KNHANES) ↔ 사망/사인(통계청)을 개인 단위로 연결 → 위험요인-사망 생존분석",
      "사인별(암·순환기 등) 사망 분석, 추적기간 기반 사망률·생존함수 산출",
      "건강나이·건강여명 등 위험요인 기반 사망모형 구축에 적합",
    ],
    cautions: [
      "19세 이상·연계동의·주민번호 유효자 한정(선택편의 가능), 복합표본 가중치 고려",
      "주민등록번호 기반 나이라 KNHANES 조사나이와 차이 가능",
      "사망원인통계 버전(소수점)에 따라 추적기간이 달라짐 — 버전 명시 필요",
      "표본 규모상 희귀 사인 분석은 검정력 한계",
    ],
    uses: [
      "건강위험요인-사망 연관 분석(생존분석·Cox 모형)",
      "사인별 사망률·건강여명·건강나이 산출",
      "보험 사망·건강나이 위험률 연구 기초",
    ],
    sources: [
      {
        label: "국민건강영양조사 누리집 (질병관리청) — 연계자료 이용지침서",
        url: "https://knhanes.kdca.go.kr/",
      },
      {
        label: "통계청 마이크로데이터 통합서비스(MDIS) — 사망원인통계 연계",
        url: "https://mdis.kostat.go.kr/",
      },
    ],
  },
  jmdc: {
    id: "jmdc",
    shortName: "JMDC 클레임DB(일본)",
    fullName: "JMDC Claims Database (일본 민간 의료데이터) — 추정 논리 ERD",
    provider: "JMDC, Inc.(일본) · 한일 구조 비교 레퍼런스",
    tagline:
      "일본 건강보험조합(직장가입) 기반 민간 의료 빅데이터 — 가입자 고유 ID 하나로 레세프트(청구)·건강검진·DPC·PHR을 결합한다. 본 ERD는 공개 자료로 재구성한 논리(추정) 모델이다.",
    structure: "민간 클레임(청구) 결합 DB · 추정 논리 ERD",
    estimated: true,
    embedHtml: "/db/jmdc-korea-erd.html",
    summary: [
      "JMDC Claims Database는 일본의 다수 건강보험조합(직장가입)에서 수집한 민간 의료 빅데이터로, 가입자 대장을 허브로 레세프트(입원·외래·DPC·조제)·건강검진·특정보건지도·PHR을 단일 가입자 ID(加入者ID)로 결합한다. 한국 국민건강보험공단(NHIS) 자료와 구조가 유사해, 위험률·예측모형 연구의 해외 비교 기준으로 자주 인용된다.",
      "아래 임베드한 ERD는 JMDC의 실제 물리 스키마가 아니라, 공개된 데이터 구성 설명과 일본 레세프트(진료보수청구) 전산 표준 포맷을 바탕으로 5개 레이어·15개 엔티티로 재구성한 논리(개념) 모델이다. 실제 컬럼명·키는 비공개(NDA) 데이터 사양서와 다를 수 있다. 같은 문서에 한국 NHIS 대응 매핑(자격·진료·검진·요양기관 DB)과 비교 시 유의점을 함께 정리했다.",
    ],
    facts: [
      { label: "자료 성격", value: "민간 클레임(청구) 결합 DB — 가입자 ID 종단 결합" },
      { label: "ERD 구성", value: "5개 레이어 · 15개 엔티티 (논리·추정 모델)" },
      { label: "연결키", value: "加入者ID(가입자 ID) 단일 허브" },
      { label: "청구유형", value: "입원 · 외래 · DPC · 조제 (4종)" },
      { label: "코드체계", value: "상병 ICD-10 / 약물 YJ코드 (↔ KCD / 주성분코드)" },
      { label: "ERD 출처", value: "공개자료 기반 재구성 — 추정 논리모델(원본 아님)" },
    ],
    strengths: [
      "가입자 ID로 레세프트·건강검진이 결합 → 치료이력과 건강상태(검진수치)를 함께 보는 분석 가능(한국 NHIS와 동일 강점)",
      "입원 DPC·원외 조제·문진/특정보건지도까지 포함해 진료 전 과정을 추적",
      "한국 NHIS 자료와 구조가 유사 → 한일 비교·해외 위험률 벤치마크에 적합",
    ],
    cautions: [
      "본 ERD는 실제 스키마가 아닌 공개자료 기반 추정 논리모델 — 실제 신청 시 데이터 사양서(データ仕様書)로 검증 필요",
      "건보조합(직장) 기반이라 은퇴 후 고령자 데이터가 단절 → 고령질환 종단분석에 한계",
      "일본 DPC(입원 포괄)는 한국 DRG(7개 질병군 부분적용)와 입자도가 달라 입원 비교 시 주의",
      "특정보건지도·PHR 레이어는 한국 공단 DB에 직접 대응이 약함(마이헬스웨이 등 별도 체계)",
    ],
    uses: [
      "한일 의료데이터 구조 비교·해외 위험률 벤치마크",
      "검진–청구 결합 기반 질병 자연사·의료이용 분석 설계 참조",
      "ICD/KCD·ATC 표준 레벨 매핑을 통한 국가 간 분석 호환성 검토",
    ],
    sources: [
      {
        label: "JMDC, Inc. — 医療ビッグデータ(JMDC Claims Database)",
        url: "https://www.jmdc.co.jp/",
      },
    ],
  },
};

export function listDbs(): DbProfile[] {
  return DB_ORDER.map((id) => PROFILES[id]);
}

export function getDb(
  id: string
): { profile: DbProfile; erd: DbErd | null } | null {
  const profile = PROFILES[id];
  if (!profile) return null;
  const erd = ERD[id] ?? null;
  // 네이티브 ERD(JSON)가 없어도 임베드 HTML이 있으면 유효(JMDC 추정 ERD 등).
  if (!erd && !profile.embedHtml) return null;
  return { profile, erd };
}
