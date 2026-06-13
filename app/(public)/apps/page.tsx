import type { Metadata } from "next";
import { ModelSelectIdent } from "@/components/feature/ModelSelectIdent";

// 모델분석·업무지원 앱 모음 — App Collecter 프로젝트의 카드 데이터 중
// 사용자가 지정한 7종만 이식(2026-06-11). 카드는 보드 공통 카드 시스템과 동일.

export const metadata: Metadata = {
  title: "모델분석·업무지원 앱 | Insurance Insights Board",
  description:
    "보험료 자동산출, 머신러닝 자동 플로우 등 모델분석 앱과 강의 지원, PDF Master 등 업무지원 앱 모음.",
};

interface AppItem {
  title: string;
  description: string;
  features: string[];
  link: string;
}

const MODEL_APPS: AppItem[] = [
  {
    title: "보험료 자동산출 시스템",
    description:
      "생명보험 보험료 및 책임준비금을 모듈 형식으로 자동 산출하는 앱입니다. 간단한 클릭만으로 보험료를 산출할 수 있으며, 간결화된 방식으로 전체 흐름 및 산출결과를 파악할 수 있습니다.",
    features: [
      "모듈형 생명보험 보험료 산출",
      "책임준비금 자동 계산",
      "간결한 흐름 및 결과 조회",
      "클릭만으로 빠른 산출",
    ],
    link: "https://life-matrix-flow-new.vercel.app/",
  },
  {
    title: "머신러닝 자동 플로우",
    description:
      "머신러닝을 모듈화하고 이를 파이썬으로 구현하여 검증이 가능하고 다양한 모델을 조합하여 산출이 가능합니다.",
    features: [
      "머신러닝 모듈화 및 파이썬 구현",
      "다양한 모델 조합 산출",
      "결과 검증 기능",
      "자동화된 ML 워크플로우",
    ],
    link: "https://machine-learning-auto-flow.vercel.app/",
  },
];

const WORK_APPS: AppItem[] = [
  {
    title: "강의 지원 앱",
    description:
      "PDF 파일에 대해 전체보기 및 펜, 네모, 원 등 다양한 시각적 요소를 추가해 강의를 지원하는 앱입니다.",
    features: [
      "PDF 파일 페이지 이동 및 전체보기 지원",
      "펜, 네모, 원 등 다양한 그리기 도구",
      "직관적인 시각적 요소를 통한 강조 표시",
      "효율적인 강의 진행을 돕는 보조 도구 모음",
    ],
    link: "https://lecture-assistant-chi.vercel.app/",
  },
  {
    title: "PDF Master",
    description:
      "PDF 파일을 손쉽게 관리하세요. 여러 PDF를 하나로 합치거나, 필요한 페이지만 추출하거나, 불필요한 페이지를 삭제할 수 있습니다.",
    features: [
      "여러 PDF 파일 합치기",
      "PDF 페이지 분할 및 추출",
      "특정 페이지 삭제",
      "빠르고 간편한 처리",
    ],
    link: "https://pdf-master-8bzg.vercel.app/",
  },
  {
    title: "Actuary Pro Calc",
    description:
      "계리사 시험 1차에서 사용 가능한 계산기입니다. 시험에서 허용하는 계산기를 사용하여 수식을 계산하고 이에 대한 계산과정을 보여줍니다.",
    features: [
      "대상: 카시오(JS-40B/JS-40GT), 샤프(EL-N942X), 캐논(LS-1200V/TS-1200TG) 계산기",
      "M+, M- 기능 활용 가능",
      "시험환경에 적합한 계산 기능",
      "계산과정의 직관적인 설명",
    ],
    link: "https://pro-exam-calculator.vercel.app/",
  },
  {
    title: "보험수리 화이트보드",
    description:
      "보험수리 계산을 편리하게 할 수 있는 보드로써 수리 기호 등이 포함되어 있습니다.",
    features: [
      "보험수리 계산용 화이트보드",
      "수리 기호·KaTeX 수식 입력",
      "타임라인·화살표 등 도형 지원",
      "PNG 내보내기·저장",
    ],
    link: "https://actuarial-whiteboard.vercel.app/",
  },
  {
    title: "이미지 수식변환기",
    description:
      "이미지나 간단한 텍스트를 LaTeX, PPT, Word 수식으로 변환해 드립니다. 논문·보고서·발표 자료 작성에 활용할 수 있습니다.",
    features: [
      "이미지를 LaTeX, PPT, Word 수식으로 변환",
      "간단한 텍스트를 LaTeX, PPT, Word 수식으로 변환",
      "다양한 출력 형식 지원",
      "수식 복사·붙여넣기 편의",
    ],
    link: "https://mathocr-formula-in-office-converter.vercel.app/",
  },
];

// featured: 모델분석 2종을 벤토 대형 타일로 (2026-06-13 입체화)
function AppGrid({
  apps,
  featured = false,
}: {
  apps: AppItem[];
  featured?: boolean;
}) {
  return (
    <div
      className={
        featured
          ? "grid grid-cols-1 gap-6 md:grid-cols-2"
          : "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      }
    >
      {apps.map((app) => (
        <a
          key={app.title}
          href={app.link}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex flex-col rounded-cover border border-border bg-white shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:border-foreground hover:shadow-card-hover ${
            featured ? "p-7" : "p-6"
          }`}
        >
          <h3
            className={`font-semibold text-brand-sky ${
              featured ? "text-[19px]" : "text-[17px]"
            }`}
          >
            {app.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-body">
            {app.description}
          </p>
          <ul className="mt-3 flex-1 space-y-1.5">
            {app.features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 text-[13px] leading-snug text-tertiary"
              >
                <span
                  aria-hidden
                  className="mt-[5px] h-1.5 w-1.5 shrink-0 bg-brand-sky"
                />
                {f}
              </li>
            ))}
          </ul>
          <span className="mt-4 text-sm font-medium text-primary">
            앱 열기 ↗
          </span>
        </a>
      ))}
    </div>
  );
}

export default function AppsPage() {
  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <h1 className="text-2xl font-medium text-foreground">
        모델분석 · 업무지원 앱
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tertiary">
        보험 실무에 바로 쓸 수 있는 자체 개발 앱 모음입니다. 카드를 누르면 새
        탭에서 앱이 열립니다.
      </p>

      {/* 모델선택 아이덴트 — 데이터 흐름 → 최적 분류기 선택 (PC 전용) */}
      <div className="mt-10 hidden lg:block">
        <ModelSelectIdent className="mx-auto max-w-4xl" />
      </div>

      <section className="mt-10">
        <h2 className="mb-6 flex items-center gap-2.5 text-xl font-medium text-foreground">
          <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
          모델분석
        </h2>
        <AppGrid apps={MODEL_APPS} featured />
      </section>

      <section className="mt-16 pb-8">
        <h2 className="mb-6 flex items-center gap-2.5 text-xl font-medium text-foreground">
          <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
          업무지원
        </h2>
        <AppGrid apps={WORK_APPS} />
      </section>
    </div>
  );
}
