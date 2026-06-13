import type {
  ChangeKind,
  LifeCompany,
  LifeDetail,
  LifeEvent,
  LifeInfoCard,
} from "@/data/japan-life/timeline";
import {
  BANKRUPTCY_ROWS,
  BANKRUPTCY_TABLE_HEAD,
  CASES_HEAD,
  COMPANY_CASES,
  CLOSED_CARDS,
  CLOSED_DETAILS,
  CLOSED_HEAD,
  CRISIS_CARDS,
  CRISIS_DETAILS,
  CRISIS_EVENTS,
  CRISIS_EVENTS_HEAD,
  CRISIS_HEAD,
  LIFE_LEGEND,
  TIMELINE_ERAS,
  TIMELINE_HEAD,
} from "@/data/japan-life/timeline";
import { LifeReveal } from "@/components/feature/global/LifeReveal";

/* ---------------------------------------------------------
   변천 유형 → globals.css --chip-* 뮤트 팔레트 매핑
   rename(사명변경)=teal · merge(합병·포괄이전)=amber · end(해산·소멸)=rose
   --------------------------------------------------------- */

const KIND_CHIP: Record<ChangeKind, string> = {
  rename: "bg-[var(--chip-teal-bg)] text-[var(--chip-teal-fg)]",
  merge: "bg-[var(--chip-amber-bg)] text-[var(--chip-amber-fg)]",
  end: "bg-[var(--chip-rose-bg)] text-[var(--chip-rose-fg)]",
};

const KIND_DOT: Record<ChangeKind, string> = {
  rename: "bg-[var(--chip-teal-fg)]",
  merge: "bg-[var(--chip-amber-fg)]",
  end: "bg-[var(--chip-rose-fg)]",
};

const KIND_STEP_BORDER: Record<ChangeKind, string> = {
  rename: "border-l-[var(--chip-teal-fg)]",
  merge: "border-l-[var(--chip-amber-fg)]",
  end: "border-l-[var(--chip-rose-fg)]",
};

function KindChip({ label, kind }: { label: string; kind: ChangeKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium ${KIND_CHIP[kind]}`}
    >
      {label}
    </span>
  );
}

/* ---------------------------------------------------------
   섹션 헤드 (타이틀 = text-brand-sky font-semibold)
   --------------------------------------------------------- */

function SectionHead({
  title,
  description,
  small,
}: {
  title: string;
  description?: string;
  small?: boolean;
}) {
  return (
    <div className="mb-6">
      <h2
        className={`font-semibold text-brand-sky ${
          small ? "text-[20px]" : "text-[23px] sm:text-[26px]"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-[15px] leading-[1.8] text-tertiary">
          {description}
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   연표 이벤트 카드 + 세로 레일
   --------------------------------------------------------- */

function EventCard({ event }: { event: LifeEvent }) {
  return (
    <div className="rounded-cover bg-white p-5 shadow-card transition-all duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover sm:p-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-[21px] font-semibold tabular-nums text-primary">
          {event.years}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <KindChip key={tag.label} label={tag.label} kind={tag.kind} />
          ))}
        </div>
      </div>
      <h3 className="mt-2 text-[15.5px] font-semibold leading-snug text-foreground">
        {event.title}
      </h3>
      {event.paragraphs.map((text) => (
        <p key={text} className="mt-2 text-[13.5px] leading-[1.85] text-body">
          {text}
        </p>
      ))}
    </div>
  );
}

/** 세로 레일 위 이벤트 노드 — 연도 점 색은 첫 태그의 유형을 따른다 */
function RailEvent({ event }: { event: LifeEvent }) {
  const kind = event.tags[0]?.kind ?? "rename";
  return (
    <li className="relative pl-8 sm:pl-10">
      <span
        aria-hidden
        className={`absolute left-[5px] top-7 h-3 w-3 -translate-x-1/2 rounded-full ring-4 ring-[var(--page-bg)] sm:left-[7px] ${KIND_DOT[kind]}`}
      />
      <LifeReveal>
        <EventCard event={event} />
      </LifeReveal>
    </li>
  );
}

/** 시대 구분 마커 (레일 위 구획 라벨) */
function EraMarker({ label, period }: { label: string; period: string }) {
  return (
    <li className="relative pl-8 pt-2 sm:pl-10">
      <span
        aria-hidden
        className="absolute left-[5px] top-[18px] h-[18px] w-[18px] -translate-x-1/2 rounded-full border-[3px] border-primary bg-white sm:left-[7px]"
      />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[16px] font-semibold text-foreground">
          {label}
        </span>
        <span className="text-[12.5px] font-medium tabular-nums text-tertiary">
          {period}
        </span>
      </div>
    </li>
  );
}

/* ---------------------------------------------------------
   회사별 변천 카드 (흐름도)
   --------------------------------------------------------- */

function CompanyCard({ company }: { company: LifeCompany }) {
  return (
    <LifeReveal className="h-full">
      <article className="flex h-full flex-col rounded-cover bg-white p-5 shadow-card transition-all duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover sm:p-6">
        <h3 className="text-[17px] font-semibold text-brand-sky">
          {company.name}
        </h3>
        <p className="mt-1.5 text-[14px] leading-[1.8] text-tertiary">
          {company.intro}
        </p>
        <ol className="mt-4 space-y-1.5">
          {company.route.map((step) => (
            <li
              key={step.text}
              className={`rounded-r-md border-l-[3px] bg-[var(--page-bg)] px-3 py-2 text-[14px] leading-[1.7] text-body ${
                step.kind ? KIND_STEP_BORDER[step.kind] : "border-l-border"
              }`}
            >
              {step.text}
            </li>
          ))}
        </ol>
      </article>
    </LifeReveal>
  );
}

/* ---------------------------------------------------------
   불릿 카드 · 접이식 보충 설명 · 파산 요약표
   --------------------------------------------------------- */

function InfoCard({ card }: { card: LifeInfoCard }) {
  return (
    <LifeReveal className="h-full">
      <article className="h-full rounded-cover bg-white p-5 shadow-card transition-all duration-tesla ease-tesla hover:-translate-y-1 hover:shadow-card-hover sm:p-6">
        <h3 className="text-[16px] font-semibold text-foreground">
          {card.title}
        </h3>
        <ul className="mt-3 space-y-2.5">
          {card.items.map((item) => (
            <li key={item} className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              />
              <span className="text-[13.5px] leading-[1.85] text-body">
                {item}
              </span>
            </li>
          ))}
        </ul>
      </article>
    </LifeReveal>
  );
}

function DetailBox({ detail }: { detail: LifeDetail }) {
  return (
    <details className="group rounded-cover border border-border bg-white px-5 py-4">
      <summary className="cursor-pointer list-none text-[15px] font-semibold text-foreground">
        <span
          aria-hidden
          className="mr-2 inline-block text-primary transition-transform duration-tesla ease-tesla group-open:rotate-90"
        >
          ›
        </span>
        {detail.summary}
      </summary>
      <p className="mt-3 text-[13.5px] leading-[1.9] text-body">
        {detail.body}
      </p>
    </details>
  );
}

function BankruptcyTable() {
  return (
    <LifeReveal>
      <div className="overflow-x-auto rounded-cover bg-white shadow-card">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-[var(--chip-rose-fg)]/30 bg-[var(--chip-rose-bg)]/40">
              {BANKRUPTCY_TABLE_HEAD.columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-[12.5px] font-semibold text-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BANKRUPTCY_ROWS.map((row) => (
              <tr
                key={row.company}
                className="border-b border-border last:border-b-0"
              >
                <th
                  scope="row"
                  className="px-4 py-3 text-[13.5px] font-semibold text-foreground"
                >
                  {row.company}
                </th>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-[var(--chip-rose-bg)] px-2.5 py-0.5 text-[13px] font-medium tabular-nums text-[var(--chip-rose-fg)]">
                    {row.start}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13.5px] text-body">
                  {row.successor}
                </td>
                <td className="px-4 py-3 text-[14px] leading-[1.7] text-body">
                  {row.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LifeReveal>
  );
}

/* ---------------------------------------------------------
   본문 — 연표 / 회사별 변천 / 파산과 계약이전 / 소멸 회사
   --------------------------------------------------------- */

export function LifeTimeline() {
  return (
    <div className="space-y-14 pb-4">
      {/* §1 연표로 보는 주요 변천 */}
      <section id="timeline">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead
            title={TIMELINE_HEAD.title}
            description={TIMELINE_HEAD.description}
          />
          <div
            className="mb-6 flex flex-wrap gap-2"
            role="list"
            aria-label="범례"
          >
            {LIFE_LEGEND.map((item) => (
              <span
                key={item.label}
                role="listitem"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-[13px] text-body"
              >
                <span
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${KIND_DOT[item.kind]}`}
                />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <ol className="relative ml-1 space-y-5 border-l-2 border-border pb-1 sm:ml-2">
          {TIMELINE_ERAS.flatMap((era) => [
            <EraMarker
              key={era.id}
              label={era.label}
              period={era.period}
            />,
            ...era.events.map((event) => (
              <RailEvent key={event.years + event.title} event={event} />
            )),
          ])}
        </ol>
      </section>

      {/* §2 주요 회사별 변천 */}
      <section id="cases">
        <SectionHead
          title={CASES_HEAD.title}
          description={CASES_HEAD.description}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {/* 8개사 — 원본 company-grid 전량 */}
          {COMPANY_CASES.map((company) => (
            <CompanyCard key={company.name} company={company} />
          ))}
        </div>
      </section>

      {/* §3 파산과 계약이전 */}
      <section id="crisis">
        <SectionHead
          title={CRISIS_HEAD.title}
          description={CRISIS_HEAD.description}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {CRISIS_CARDS.map((card) => (
            <InfoCard key={card.title} card={card} />
          ))}
        </div>

        <div className="mt-10">
          <SectionHead
            small
            title={CRISIS_EVENTS_HEAD.title}
            description={CRISIS_EVENTS_HEAD.description}
          />
          <ol className="relative ml-1 space-y-5 border-l-2 border-border pb-1 sm:ml-2">
            {CRISIS_EVENTS.map((event) => (
              <RailEvent key={event.years + event.title} event={event} />
            ))}
          </ol>
        </div>

        <div className="mt-10">
          <SectionHead small title={BANKRUPTCY_TABLE_HEAD.title} />
          <BankruptcyTable />
        </div>

        <div className="mt-5 space-y-3">
          {CRISIS_DETAILS.map((detail) => (
            <DetailBox key={detail.summary} detail={detail} />
          ))}
        </div>
      </section>

      {/* §4 소멸 회사 */}
      <section id="closed">
        <SectionHead
          title={CLOSED_HEAD.title}
          description={CLOSED_HEAD.description}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {CLOSED_CARDS.map((card) => (
            <InfoCard key={card.title} card={card} />
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {CLOSED_DETAILS.map((detail) => (
            <DetailBox key={detail.summary} detail={detail} />
          ))}
        </div>
      </section>
    </div>
  );
}
