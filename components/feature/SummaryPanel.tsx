import { Markdown } from "@/components/ui/markdown";

/**
 * AI 요약 표시 (공개·읽기 전용). 관리자가 작성/생성한 요약을 마크다운으로 렌더한다.
 * 생성·편집은 관리자 수정 화면에서만 수행한다. 요약이 없으면 표시하지 않는다.
 */
export function SummaryPanel({ summary }: { summary: string | null }) {
  if (!summary) return null;
  return (
    <section className="rounded-cover border border-border bg-white p-6 shadow-card">
      <h2 className="mb-2 text-[17px] font-medium text-foreground">AI 요약</h2>
      <Markdown text={summary} />
    </section>
  );
}
