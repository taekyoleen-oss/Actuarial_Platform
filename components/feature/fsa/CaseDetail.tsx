"use client";

/**
 * FSA 사례 상세 — 읽기 흐름:
 * 메타(테마 칩·법령 배지) → 한 줄 핵심 → ❶ 신청·조회(Q) → ❷ 금융청 판단·조치(A)
 * → ❸ 배경·논점 → ❹ 한국에서는 → 이 사례의 용어 → 관련 사례.
 * 원문 텍스트 무손실 — 하이라이트·용어는 마크업 레이어.
 */
import {
  getGlossaryTerm,
  type FlatCase,
  type GlossaryTerm,
} from "@/lib/japanFsa";
import { HighlightedText } from "./highlight";
import { ThemeChip } from "./ThemeChip";
import { KoreaBlock } from "./KoreaBlock";

function SectionLabel({
  no,
  children,
}: {
  no: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-white">
        {no}
      </span>
      <span className="text-[13px] font-semibold tracking-wide text-foreground">
        {children}
      </span>
    </div>
  );
}

export function CaseDetail({
  fc,
  related,
  onSelectCase,
}: {
  fc: FlatCase;
  related: FlatCase[];
  onSelectCase: (id: string) => void;
}) {
  const { c, enrichment } = fc;
  const terms: GlossaryTerm[] = (enrichment?.terms ?? [])
    .map((t) => getGlossaryTerm(t))
    .filter((t): t is GlossaryTerm => Boolean(t));
  const keyPhrases = enrichment?.keyPhrases ?? [];

  return (
    <article className="space-y-6">
      {/* 메타 */}
      <header>
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="font-semibold text-brand-sky">
            {fc.periodLabel}
          </span>
          <span className="text-tertiary">·</span>
          <span className="text-tertiary">{fc.fieldTitle}</span>
        </div>
        <h2 className="mt-2 text-[22px] font-semibold leading-snug tracking-tight text-foreground sm:text-[26px]">
          {c.title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {(enrichment?.themes ?? []).map((t) => (
            <ThemeChip key={t} themeId={t} />
          ))}
          <span className="rounded border border-border bg-white px-2 py-0.5 text-[11.5px] text-tertiary">
            근거: {c.law}
          </span>
        </div>
      </header>

      {/* 한 줄 핵심 */}
      {enrichment?.tldr && (
        <div className="rounded-cover border-l-4 border-primary bg-white p-4 shadow-card sm:p-5">
          <div className="mb-1 text-[11.5px] font-semibold tracking-wide text-primary">
            한 줄 핵심
          </div>
          <p className="text-[15.5px] font-medium leading-relaxed text-foreground">
            {enrichment.tldr}
          </p>
        </div>
      )}

      {/* Q — 신청·조회 내용 */}
      <section className="rounded-cover bg-white p-5 shadow-card sm:p-6">
        <SectionLabel no="❶">신청·조회 내용</SectionLabel>
        <p className="text-[15px] leading-[1.9] text-body">
          <HighlightedText
            text={c.case}
            keyPhrases={keyPhrases}
            terms={terms}
          />
        </p>
      </section>

      {/* A — 금융청 판단·조치 */}
      <section
        className="rounded-cover p-5 shadow-card sm:p-6"
        style={{
          background: "var(--chip-blue-bg)",
          border: "1px solid #d3deef",
        }}
      >
        <SectionLabel no="❷">금융청 판단·조치</SectionLabel>
        <p className="text-[15px] font-medium leading-[1.9] text-foreground">
          <HighlightedText text={c.act} keyPhrases={keyPhrases} terms={terms} />
        </p>
      </section>

      {/* 배경·논점 */}
      {c.bg && (
        <section className="rounded-cover border border-dashed border-border bg-white p-5 sm:p-6">
          <SectionLabel no="❸">
            {c.bg.title ?? "배경·논점"}
          </SectionLabel>
          {c.bg.para && (
            <p className="text-[14.5px] leading-[1.85] text-body">
              <HighlightedText
                text={c.bg.para}
                keyPhrases={keyPhrases}
                terms={terms}
              />
            </p>
          )}
          {c.bg.list && (
            <ol className="ml-5 list-decimal space-y-2 text-[14.5px] leading-[1.85] text-body marker:font-medium marker:text-brand-sky">
              {c.bg.list.map((item, i) => (
                <li key={i}>
                  <HighlightedText
                    text={item}
                    keyPhrases={keyPhrases}
                    terms={terms}
                  />
                </li>
              ))}
            </ol>
          )}
          {c.bg.note && (
            <p className="mt-3 border-t border-border pt-3 text-[13px] leading-[1.8] text-tertiary">
              <HighlightedText
                text={c.bg.note}
                keyPhrases={keyPhrases}
                terms={terms}
              />
            </p>
          )}
        </section>
      )}

      {/* 한국에서는 */}
      {enrichment?.kr && <KoreaBlock kr={enrichment.kr} />}

      {/* 이 사례의 용어 */}
      {terms.length > 0 && (
        <section className="rounded-cover bg-white p-5 shadow-card sm:p-6">
          <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-foreground">
            이 사례의 용어
          </h3>
          <dl className="space-y-3">
            {terms.map((t) => (
              <div
                key={t.term}
                className="border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-[13.5px] font-semibold text-brand-sky">
                  {t.term}
                  {t.original && (
                    <span className="ml-2 font-normal text-tertiary">
                      {t.original}
                    </span>
                  )}
                </dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-body">
                  {t.definition}
                  {t.koreanEquivalent && (
                    <span className="mt-0.5 block text-tertiary">
                      <span className="font-medium text-brand-sky">
                        한국에서는
                      </span>{" "}
                      {t.koreanEquivalent}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* 관련 사례 */}
      {related.length > 0 && (
        <section>
          <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-foreground">
            같은 테마의 관련 사례
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.c.id}>
                <button
                  type="button"
                  onClick={() => onSelectCase(r.c.id)}
                  className="group block w-full rounded-cover border border-border bg-white px-4 py-3 text-left shadow-card transition-[box-shadow,transform,border-color] duration-tesla ease-tesla hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <span className="block text-[11.5px] text-tertiary">
                    {r.periodLabel}
                  </span>
                  <span className="mt-0.5 block text-[13.5px] font-medium leading-snug text-foreground group-hover:text-primary">
                    {r.c.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
