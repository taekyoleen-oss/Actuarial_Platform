import type { TableData } from "@/data/japan-life-trends/content";
import { InlineMarkup } from "./trendsMarkup";

/** 동향 보고서 표 — 다단 헤더(colSpan/rowSpan)·합계행 굵게 지원 */
export function DataTable({ table }: { table: TableData }) {
  const boldRows = new Set(table.boldRows ?? []);
  return (
    <div className="overflow-x-auto rounded-cover bg-white shadow-card">
      {table.caption && (
        <div className="px-4 pt-3 text-right text-[11.5px] text-tertiary">
          {table.caption}
        </div>
      )}
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          {table.headers.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-border bg-[var(--page-bg)]"
            >
              {row.map((cell, ci) => (
                <th
                  key={ci}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  scope="col"
                  className="px-3.5 py-2.5 text-[13px] font-semibold text-foreground"
                >
                  <InlineMarkup text={cell.label} />
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr
              key={ri}
              className={`border-b border-border last:border-b-0 ${
                boldRows.has(ri) ? "bg-[var(--page-bg)]" : ""
              }`}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3.5 py-2.5 text-[14px] ${
                    ci === 0 || table.plain
                      ? "text-left text-body"
                      : "text-right tabular-nums text-body"
                  } ${boldRows.has(ri) ? "font-semibold text-foreground" : ""}`}
                >
                  <InlineMarkup text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
