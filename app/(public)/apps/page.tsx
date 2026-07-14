import type { Metadata } from "next";
import Link from "next/link";
import { Database, ArrowRight } from "lucide-react";
import { Collapsible } from "@/components/feature/Collapsible";
import { PostBoard, type BoardItem } from "@/components/feature/PostBoard";
import { ViewSwitch } from "@/components/feature/ViewSwitch";
import { BrochureButton } from "@/components/feature/BrochureButton";
import { listDbs } from "@/lib/publicDb";
import { bluePastelFor } from "@/lib/utils";

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
    title: "생명보험 보험료 자동 산출",
    description:
      "생명보험 보험료 및 책임준비금을 모듈 형식으로 자동 산출하는 앱입니다. 간단한 클릭만으로 보험료를 산출할 수 있으며, 간결화된 방식으로 전체 흐름 및 산출결과를 파악할 수 있습니다.",
    features: [
      "모듈형 생명보험 보험료 산출",
      "책임준비금 자동 계산",
      "간결한 흐름 및 결과 조회",
      "클릭만으로 빠른 산출",
    ],
    link: "https://life-matrix-flow-new-livid.vercel.app/",
  },
  {
    title: "머신러닝 자동분석",
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
    link: "https://pdf-master-lyart.vercel.app/",
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

// featured: 모델분석 카드를 벤토 대형 타일로 (2026-06-13 입체화)
function AppCard({ app, featured = false }: { app: AppItem; featured?: boolean }) {
  const c = bluePastelFor(app.title);
  return (
    <a
      href={app.link}
      target="_blank"
      rel="noopener noreferrer"
      style={{ backgroundColor: c.bg, borderColor: c.border }}
      className={`flex h-full flex-col rounded-cover border shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover ${
        featured ? "p-7" : "p-6"
      }`}
    >
      <h3
        className={`font-semibold text-brand-sky ${
          featured ? "text-[21px]" : "text-[18px]"
        }`}
      >
        {app.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-body">{app.description}</p>
      <ul className="mt-3 flex-1 space-y-1.5">
        {app.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-[14px] leading-snug text-tertiary"
          >
            <span
              aria-hidden
              className="mt-[5px] h-1.5 w-1.5 shrink-0 bg-brand-sky"
            />
            {f}
          </li>
        ))}
      </ul>
      <span className="mt-4 text-sm font-medium text-primary">앱 열기 ↗</span>
    </a>
  );
}

function AppGrid({ apps, featured = false }: { apps: AppItem[]; featured?: boolean }) {
  return (
    <div
      className={
        featured
          ? "grid grid-cols-1 gap-6 md:grid-cols-2"
          : "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      }
    >
      {apps.map((app) => (
        <AppCard key={app.title} app={app} featured={featured} />
      ))}
    </div>
  );
}

// 모델 파이프라인 아이덴트 — 애니메이션 파일을 카드 옆에 임베드.
// 애니메이션을 크게(위주) 보여주고 하단에 간단한 설명을 둔다(2026-06-14 사용자 요청).
function PipelineIdentCell({
  src,
  title,
  caption,
  heightClass = "h-[360px] md:h-[440px]",
}: {
  src: string;
  title: string;
  caption: string;
  /** 애니메이션 종횡비에 맞춘 iframe 높이 (와이드형은 낮게) */
  heightClass?: string;
}) {
  // 카드 없이 페이지 배경(크림)에 녹아드는 아이덴트 (2026-06-14 사용자 요청)
  // 모바일에서는 대표 아이덴트(상단 모듈러 빌드)만 남기고 파이프라인 2종은 숨김(2026-06-15).
  return (
    <div className="hidden h-full flex-col md:flex">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        scrolling="no"
        className={`w-full flex-1 border-0 bg-transparent ${heightClass}`}
      />
      <p className="px-1 pt-3 text-[13px] leading-relaxed text-tertiary">
        {caption}
      </p>
    </div>
  );
}

// 공공DB 카드 1장.
function DbCard({ db }: { db: ReturnType<typeof listDbs>[number] }) {
  const c = bluePastelFor(db.id);
  return (
    <Link
      href={`/apps/db/${db.id}`}
      style={{ backgroundColor: c.bg, borderColor: c.border }}
      className="flex flex-col rounded-cover border p-6 shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover"
    >
      <Database size={20} className="text-brand-sky" />
      <h3 className="mt-3 text-[18px] font-semibold text-brand-sky">
        {db.shortName}
      </h3>
      <p className="mt-0.5 text-[13px] text-placeholder">{db.fullName}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
        {db.tagline}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="w-fit rounded bg-[var(--chip-blue-bg)] px-2 py-0.5 text-[12px] font-medium text-[var(--chip-blue-fg)]">
          {db.structure}
        </span>
        {db.estimated && (
          <span className="w-fit rounded bg-[var(--chip-amber-bg)] px-2 py-0.5 text-[12px] font-semibold text-[var(--chip-amber-fg)]">
            추정 ERD
          </span>
        )}
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
        DB 구조 보기 <ArrowRight size={15} />
      </span>
    </Link>
  );
}

export default function AppsPage() {
  const dbs = listDbs();

  // 게시판(목록) 보기용 항목 — 앱은 외부 링크(새 탭), 공공DB는 내부 링크.
  const modelBoard: BoardItem[] = MODEL_APPS.map((a) => ({
    key: a.title,
    href: a.link,
    title: a.title,
    description: a.description,
    external: true,
  }));
  const workBoard: BoardItem[] = WORK_APPS.map((a) => ({
    key: a.title,
    href: a.link,
    title: a.title,
    description: a.description,
    external: true,
  }));
  const dbBoard: BoardItem[] = dbs.map((db) => ({
    key: db.id,
    href: `/apps/db/${db.id}`,
    title: db.shortName,
    description: db.tagline,
    meta: db.fullName,
  }));

  // 카드 보기 — 기존 레이아웃(지그재그 아이덴트·그리드) 유지.
  const cardView = (
    <>
      <Collapsible title="모델분석" count={MODEL_APPS.length} storageKey="apps:model">
        {/* 지그재그 배치(md+): 보험료 카드 ↔ 파이프라인 / 파이프라인 ↔ ML 카드 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-stretch">
          <AppCard app={MODEL_APPS[0]} featured />
          <PipelineIdentCell
            src="/idents/tkleen-lifematrix-pipeline-theme.html"
            title="보험료 자동산출 파이프라인 아이덴트"
            caption="보험료 자동산출 파이프라인 — 계약정보·위험률·생존/사망·계산기수·순/영업보험료·준비금까지 13개 모듈이 순차 점등되며 월납 보험료가 산출됩니다."
          />
          <PipelineIdentCell
            src="/idents/tkleen-ml-training-pipeline.html"
            title="머신러닝 학습 파이프라인 아이덴트"
            caption="머신러닝 학습 파이프라인 — 데이터 적재·전처리·학습·평가까지 보험 예측 모델의 학습 과정이 자동으로 흐릅니다."
            heightClass="h-[300px] md:h-[340px]"
          />
          <AppCard app={MODEL_APPS[1]} featured />
        </div>

        {/* 머신러닝 자동분석 브로셔 — 버튼 클릭 시 팝업으로 웹에서 바로 열람 */}
        <div className="mt-6">
          <BrochureButton
            belongsTo="머신러닝 자동분석"
            title="ML Auto Flow 브로셔"
            url="/apps/ml-auto-flow-brochure.pdf"
            fileName="ML_Auto_Flow_브로셔.pdf"
          />
        </div>
      </Collapsible>

      <div className="mt-16">
        <Collapsible title="업무지원" count={WORK_APPS.length} storageKey="apps:work">
          <AppGrid apps={WORK_APPS} />
        </Collapsible>
      </div>

      {/* 주요 공공DB — 위험률·모형 산출에 쓰는 공공 의료데이터의 특성 + DB 구조(ERD) */}
      <div className="mt-16 pb-8">
        <Collapsible title="주요 공공DB" count={dbs.length} storageKey="apps:db">
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-tertiary">
            보험 위험률·예측모형 산출에 활용하는 공공 의료데이터입니다. 카드를
            누르면 DB 특성과 테이블 구조(ERD)를 볼 수 있습니다.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dbs.map((db) => (
              <DbCard key={db.id} db={db} />
            ))}
          </div>
        </Collapsible>
      </div>
    </>
  );

  // 게시판 보기 — 위→아래 목록(타임라인). 아이덴트는 카드 보기 전용.
  const boardView = (
    <>
      <Collapsible title="모델분석" count={MODEL_APPS.length} storageKey="apps:model">
        <PostBoard items={modelBoard} />
      </Collapsible>
      <div className="mt-16">
        <Collapsible title="업무지원" count={WORK_APPS.length} storageKey="apps:work">
          <PostBoard items={workBoard} />
        </Collapsible>
      </div>
      <div className="mt-16 pb-8">
        <Collapsible title="주요 공공DB" count={dbs.length} storageKey="apps:db">
          <PostBoard items={dbBoard} />
        </Collapsible>
      </div>
    </>
  );

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <h1 className="text-2xl font-medium text-foreground">
        모델분석 · 업무지원 앱
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-tertiary">
        보험 실무에 바로 쓸 수 있는 자체 개발 앱 모음입니다. 카드를 누르면 새
        탭에서 앱이 열립니다.
      </p>

      {/* 모듈러 빌드 아이덴트 — 대표 아이덴트(모바일 포함 노출, 2026-06-15) */}
      <div className="mt-10 block">
        <iframe
          src="/idents/tkleen-modular-build-animation.html"
          title="모듈 조립 아이덴트"
          loading="lazy"
          scrolling="no"
          className="mx-auto block h-[420px] w-full max-w-2xl border-0 bg-transparent"
        />
      </div>

      <div className="mt-6">
        <ViewSwitch card={cardView} board={boardView} />
      </div>
    </div>
  );
}
