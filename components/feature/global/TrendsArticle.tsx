import type { Block, TrendsSection } from "@/data/japan-life-trends/content";
import { TRENDS_SECTIONS } from "@/data/japan-life-trends/content";
import { InlineMarkup } from "./trendsMarkup";
import { DataTable } from "./DataTable";
import { MiniChart } from "./MiniChart";

function FigureCaption({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[13px] font-semibold text-brand-sky">
      {children}
    </div>
  );
}

function Notes({ notes }: { notes?: string[] }) {
  if (!notes?.length) return null;
  return (
    <div className="mt-2 space-y-1">
      {notes.map((n, i) => (
        <p key={i} className="text-[11.5px] leading-relaxed text-tertiary">
          <InlineMarkup text={n} />
        </p>
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "h":
      return (
        <h3 className="mt-6 text-[16px] font-semibold text-foreground">
          <InlineMarkup text={block.text} />
        </h3>
      );
    case "p":
      return (
        <p className="text-[14.5px] leading-[1.9] text-body">
          <InlineMarkup text={block.text} />
        </p>
      );
    case "twocol":
      return (
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {block.paragraphs.map((p, i) => (
            <p key={i} className="text-[14px] leading-[1.85] text-body">
              <InlineMarkup text={p} />
            </p>
          ))}
        </div>
      );
    case "bullet":
      return (
        <div className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
          />
          <p className="text-[14px] leading-[1.85] text-body">
            <InlineMarkup text={block.text} />
          </p>
        </div>
      );
    case "ref":
      return (
        <p className="text-[12px] text-tertiary">
          <InlineMarkup text={block.text} />
        </p>
      );
    case "note":
      return (
        <p className="text-[12px] leading-relaxed text-tertiary">
          <InlineMarkup text={block.text} />
        </p>
      );
    case "figure":
      return (
        <figure>
          {block.title && <FigureCaption>{block.title}</FigureCaption>}
          <MiniChart chart={block.chart} />
          <Notes notes={block.notes} />
        </figure>
      );
    case "table":
      return (
        <figure>
          {block.title && <FigureCaption>{block.title}</FigureCaption>}
          <DataTable table={block.table} />
          <Notes notes={block.notes} />
        </figure>
      );
    case "box":
      return (
        <div className="rounded-cover border border-border bg-white p-5 shadow-card">
          <div className="text-[14px] font-semibold text-brand-sky">
            <InlineMarkup text={block.title} />
          </div>
          <div className="mt-2 space-y-2">
            {block.paragraphs.map((p, i) => (
              <p key={i} className="text-[13.5px] leading-[1.85] text-body">
                <InlineMarkup text={p} />
              </p>
            ))}
          </div>
        </div>
      );
    case "footnotes":
      return (
        <div className="mt-3 space-y-1 border-t border-border pt-3">
          {block.items.map((it, i) => (
            <p key={i} className="text-[11.5px] leading-relaxed text-tertiary">
              <InlineMarkup text={it} />
            </p>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function SectionView({ section }: { section: TrendsSection }) {
  return (
    <section id={section.id} className="scroll-mt-28">
      {section.chapter && (
        <div className="mb-1 mt-4 text-[12px] font-bold tracking-[0.12em] text-brand-sky">
          {section.chapter}
        </div>
      )}
      {section.group && (
        <h2 className="text-[19px] font-bold text-foreground">
          <InlineMarkup text={section.group} />
        </h2>
      )}
      <h2
        className={`${
          section.level === 1
            ? "text-[20px] font-bold text-foreground"
            : "text-[17px] font-semibold text-foreground"
        } ${section.group ? "mt-1" : ""}`}
      >
        <InlineMarkup text={section.title} />
      </h2>
      <div className="mt-4 space-y-4">
        {section.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>
    </section>
  );
}

export function TrendsArticle() {
  return (
    <div className="space-y-12">
      {TRENDS_SECTIONS.map((s) => (
        <SectionView key={s.id} section={s} />
      ))}
    </div>
  );
}
