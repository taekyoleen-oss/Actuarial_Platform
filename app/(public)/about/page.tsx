import type { Metadata } from "next";
import { Award, FileText, Quote } from "lucide-react";
import { Reveal } from "@/components/feature/Reveal";

// "만든이" — AI4Insurance 프로젝트의 소개(about) 콘텐츠만 이식해 보드 테마로 재구성.
// 원본: AI4Insurance/app/about + content/{profile,research,site}.ts (2026-06-11)

export const metadata: Metadata = {
  title: "만든이 — 인태교 | Insurance Insights Board",
  description:
    "인태교 · 보험계리사 · 경영학 박사. 코리안리 30년 재보험 실무, KCI 논문 다수. 경력 타임라인과 연구 실적.",
};

const PROFILE = {
  name: "인태교",
  credentials: "보험계리사 · 경영학 박사 · 보험상품개발 및 재보험 경력",
  intro: [
    "보험업계에서 30년간 근무하며 보험 상품 개발과 리스크 분석을 전문적으로 수행해온 전문가입니다. 보험계리사 자격증과 경영학 박사 학위를 보유하고 있으며, 머신러닝과 통계 기법을 활용한 보험 및 재보험 프라이싱 모델링에 깊은 전문성을 갖추고 있습니다.",
    "생명보험, 손해보험뿐 아니라 금융재보험 등 다양한 재보험 분야에서도 실무 경험을 쌓아왔으며, 재보험 계약 구조와 수익성 분석에 능숙한 재보험 전문가입니다. 공공데이터 기반의 통계 분석에도 정통하며, 엑셀과 파이썬을 활용한 보험료 산출 및 자동화 시스템 구축에도 높은 역량을 보유하고 있습니다.",
    "현재는 보험사의 디지털 전환을 위한 교육과 컨설팅을 제공하며, 실무진들이 데이터 기반 의사결정을 효과적으로 수행할 수 있도록 지원하고 있습니다.",
  ],
  philosophy:
    "이론과 실무의 완벽한 결합을 통해 보험업계의 실질적인 문제를 해결할 수 있는 데이터 전문가를 양성하는 것이 저의 목표입니다. 복잡한 개념도 쉽게 이해할 수 있도록 실제 사례 중심의 교육을 제공합니다.",
};

const STATS = [
  { value: "30년", label: "코리안리 재보험 실무" },
  { value: "보험계리사", label: "2002년 자격 취득" },
  { value: "논문 8편", label: "KCI 등재 다수" },
  { value: "겸임교수", label: "보험계리" },
];

const TIMELINE: { period: string; title: string; detail?: string }[] = [
  {
    period: "1996 ~ 현재",
    title: "코리안리 근무",
    detail: "상품개발 및 계리업무를 중심으로 30년간 재보험 분야에 종사",
  },
  { period: "1997 ~ 2009", title: "상품개발 실무자", detail: "우량체 등 신상품 개발" },
  { period: "2002", title: "보험계리사 자격 취득" },
  {
    period: "2007",
    title: "스코르(SCOR) 재보험사 파견",
    detail: "글로벌 재보험 실무 경험 축적",
  },
  { period: "2009 ~ 2012", title: "리스크관리팀", detail: "DFA 구축 및 운영" },
  { period: "2012 ~ 2015", title: "장기자동차보험팀", detail: "장기업무 담당" },
  {
    period: "2015 ~ 2021",
    title: "선임계리사 선임",
    detail: "책임준비금 등 결산 및 지급여력 비율 검증",
  },
  { period: "2018", title: "금융감독원 표창 수상" },
  { period: "2020 ~ 2025", title: "상품개발팀장", detail: "신상품 개발 주도" },
  { period: "2016 ~ 현재", title: "한양대학교 보험계리학과 겸임교수" },
  {
    period: "현재",
    title: "보험 실무 앱 다수 개발",
    detail: "보험실무 앱, 머신러닝, 생명보험 보험료 산출 앱 등 다수 개발 진행중",
  },
];

const ACHIEVEMENTS = [
  "비비례재보험 모델링 및 시스템 도입 등 재보험 프라이싱",
  "간편보험(SI), 신규담보 등 국내 신상품 도입 및 확대",
  "생명 및 손해보험 빈도-심도 모델링 등 프라이싱 강화",
  "신용정보, 건강정보 데이터를 통한 건강상태/신용도별 건강나이 모형",
];

const EXPERTISE = [
  "신규위험률 산출",
  "보험상품 개발",
  "보험분야 머신러닝",
  "프라이싱",
  "금융재보험",
  "엑셀 데이터 분석",
  "비비례재보험",
];

const RESEARCH: {
  authors: string;
  date: string;
  title: string;
  journal: string;
  detail?: string;
  kci?: boolean;
  pdf?: string;
}[] = [
  {
    authors: "인태교, 전희주",
    date: "2026. 1",
    title: "암 진단자의 특성에 따른 경과년도 별 주요치료율 차이 분석",
    journal: "보험학회지",
    detail: "제145호",
    kci: true,
    pdf: "암 진단자의 특성에 따른 경과년도 별 주요치료율 차이 분석.pdf",
  },
  {
    authors: "인태교, 전희주",
    date: "2025. 5",
    title: "노인코호트DB를 이용한 개인건강상태에 따른 노인장기요양등급 예측모형",
    journal: "한국데이터정보과학회지",
    detail: "36(3), 443-455",
    kci: true,
    pdf: "노인코호트DB를 이용한 개인건강상태에 따른 노인장기요양등급 예측모형.pdf",
  },
  {
    authors: "전희주, 인태교",
    date: "2025. 4",
    title:
      "간편고지보험 가입대상자 우량층 확대를 위한 요율차등화 연구: 질병입원발생 및 질병수술발생을 중심으로",
    journal: "보험학회지",
    detail: "제142호, 115-141",
    kci: true,
    pdf: "간편고지보험 가입대상자 우량층 확대를 위한 요율차등화 연구.pdf",
  },
  {
    authors: "전희주, 인태교",
    date: "2025. 4",
    title:
      "과거질병이력과 건강검진지표에 기반한 치매 발병 예측모형 개발 — 국민건강보험공단 노인코호트DB 사용",
    journal: "금융감독연구",
    detail: "제12권 1호, 1-23",
    kci: true,
    pdf: "과거질병이력과 건강검진지표에 기반한 치매 발병 예측모형 개발.pdf",
  },
  {
    authors: "전희주, 문기태, 인태교",
    date: "2024. 4",
    title:
      "건강상태에 따른 사망률 및 유병기간 분석과 건강여명을 활용한 건강나이 산출에 관한 연구",
    journal: "금융감독연구",
    detail: "제11권 1호, 33-66",
    kci: true,
    pdf: "건강상태에 따른 사망률 및 유병기간 분석과 건강여명을 활용한 건강나이 산출에 관한 연구.pdf",
  },
  {
    authors: "전희주, 인태교",
    date: "2024. 4",
    title: "간편고지보험 고지항목별 무사고기간에 따른 암 발생 및 치료 상대위험도 예측",
    journal: "보험학회지",
    detail: "제138호, 41-72",
    kci: true,
    pdf: "간편고지보험 고지항목별 무사고기간에 따른 암 발생 및 치료 상대위험도 예측.pdf",
  },
  {
    authors: "전희주, 인태교, 황용순",
    date: "2023. 7",
    title:
      "신용정보에 따른 입원 및 수술 발생 상대위험도 적용방안 연구: 신용정보원 데이터 이용",
    journal: "보험학회지",
    detail: "제135호, 101-125",
    pdf: "신용정보에 따른 입원 및 수술 발생 상대위험도 적용방안 연구.pdf",
  },
  {
    authors: "전희주, 인태교",
    date: "2022. 12",
    title:
      "국민건강보험 표본코호트2.0DB를 활용한 건강상태에 따른 암발생과 암수술건수 상대위험도 연구",
    journal: "리스크관리연구",
    detail: "제33권 4호, 53-83",
    pdf: "국민건강보험 표본코호트2.0DB를 활용한 건강상태에 따른 암발생과 암수술건수 상대위험도 연구.pdf",
  },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-medium text-foreground">
      <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
      {children}
    </h2>
  );
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-12">
      {/* 헤더 */}
      <p className="text-[13px] font-bold tracking-[0.14em] text-brand-sky">
        ABOUT · 만든이
      </p>
      <h1 className="mt-2 text-[28px] font-bold tracking-tight text-foreground sm:text-[35px]">
        {PROFILE.name}
      </h1>
      <p className="mt-1.5 text-sm text-tertiary">{PROFILE.credentials}</p>

      {/* 신뢰 지표 */}
      <div className="mt-8 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-cover border border-border bg-white p-4 shadow-card"
          >
            <div className="text-lg font-semibold text-brand-sky">{s.value}</div>
            <div className="mt-1 text-xs leading-snug text-tertiary">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* 소개 */}
      <div className="mt-12 max-w-3xl space-y-5 text-[16px] leading-relaxed text-body">
        {PROFILE.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* 경력 타임라인 */}
      <section className="mt-16">
        <SectionTitle>경력 타임라인</SectionTitle>
        <ol className="ml-1 mt-8 max-w-3xl border-l border-border pl-8">
          {TIMELINE.map((e, i) => (
            <li key={e.period + e.title} className="relative pb-8 last:pb-0">
              <span
                aria-hidden
                className="absolute -left-[2.32rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand-sky bg-white"
              />
              <Reveal delay={Math.min(i * 40, 240)}>
                <p className="text-xs font-semibold text-brand-sky">
                  {e.period}
                </p>
                <h3 className="mt-1 text-[16px] font-medium text-foreground">
                  {e.title}
                </h3>
                {e.detail && (
                  <p className="mt-1 text-sm leading-relaxed text-tertiary">
                    {e.detail}
                  </p>
                )}
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* 주요 성과 */}
      <section className="mt-16">
        <SectionTitle>주요 성과</SectionTitle>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a}
              className="flex items-start gap-3 rounded-cover border border-border bg-white p-5 shadow-card"
            >
              <Award size={18} className="mt-0.5 shrink-0 text-brand-sky" />
              <p className="text-sm leading-relaxed text-body">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 연구 실적 */}
      <section className="mt-16">
        <SectionTitle>연구 실적 · 논문 {RESEARCH.length}편</SectionTitle>
        <p className="mt-3 max-w-2xl text-sm text-tertiary">
          국민건강보험·신용정보 등 공공·금융 데이터를 활용한 보험 위험률 및
          예측모형 연구. 제목을 누르면 원문(PDF)을 볼 수 있습니다.
        </p>
        <ol className="mt-6 overflow-hidden rounded-cover border border-border bg-white shadow-card">
          {RESEARCH.map((p, i) => (
            <li
              key={p.title}
              className={`flex flex-col gap-1.5 p-5 sm:flex-row sm:items-baseline sm:gap-6 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="shrink-0 text-xs font-medium text-tertiary sm:w-20">
                {p.date}
              </div>
              <div className="flex-1">
                {p.pdf ? (
                  <a
                    href={`/published/${encodeURIComponent(p.pdf)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1.5 text-[16px] font-medium leading-snug text-foreground transition-colors hover:text-brand-sky"
                  >
                    <span className="underline decoration-border underline-offset-4 group-hover:decoration-brand-sky">
                      {p.title}
                    </span>
                    <FileText
                      size={15}
                      className="mt-0.5 shrink-0 text-tertiary transition-colors group-hover:text-brand-sky"
                      aria-label="PDF 원문"
                    />
                  </a>
                ) : (
                  <p className="text-[16px] font-medium leading-snug text-foreground">
                    {p.title}
                  </p>
                )}
                <p className="mt-1.5 text-sm text-tertiary">
                  {p.authors} · {p.journal}
                  {p.detail ? `, ${p.detail}` : ""}
                  {p.kci && (
                    <span className="ml-2 rounded bg-surface px-1.5 py-0.5 text-xs font-medium text-tertiary">
                      KCI
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 전문 분야 */}
      <section className="mt-16">
        <SectionTitle>전문 분야</SectionTitle>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {EXPERTISE.map((tag) => (
            <span
              key={tag}
              className="rounded border border-border bg-white px-4 py-2 text-sm font-medium text-body"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 교육 철학 */}
      <section className="mb-4 mt-16">
        <div className="mx-auto max-w-3xl rounded-cover border border-border bg-white p-8 shadow-card sm:p-10">
          <Quote size={28} className="text-brand-sky opacity-50" />
          <p className="mt-4 text-lg font-medium leading-relaxed text-foreground sm:text-xl">
            {PROFILE.philosophy}
          </p>
          <p className="mt-6 text-sm text-tertiary">
            — {PROFILE.name}, 보험계리사
          </p>
        </div>
      </section>
    </div>
  );
}
