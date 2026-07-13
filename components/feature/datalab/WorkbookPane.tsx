"use client";

import { useEffect, useState } from "react";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
// @ts-expect-error luckyexcel ships no type declarations
import LuckyExcel from "luckyexcel";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type ExportJson = { sheets?: unknown[] };

/**
 * 워크북 임베드 뷰어(공개, 읽기전용).
 * fileUrl(public) → fetch → File → luckyexcel transformExcelToLucky → fortune-sheet <Workbook allowEdit=false>.
 * 실패/빈 시트 시 다운로드 링크 폴백. (SSR 없이 dynamic ssr:false 로더로만 로드됨)
 */
export default function WorkbookPane({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName: string;
}) {
  const [sheets, setSheets] = useState<unknown[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setSheets(null);
    const timeout = setTimeout(() => {
      if (!cancelled) setStatus((s) => (s === "loading" ? "error" : s));
    }, 30000);

    (async () => {
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("fetch_failed");
        const blob = await res.blob();
        const file = new File([blob], fileName || "workbook.xlsx", {
          type: blob.type || XLSX_MIME,
        });
        LuckyExcel.transformExcelToLucky(file, (exportJson: ExportJson) => {
          if (cancelled) return;
          clearTimeout(timeout);
          const s = exportJson?.sheets;
          if (!s || s.length === 0) {
            setStatus("error");
            return;
          }
          setSheets(s);
          setStatus("ready");
        });
      } catch {
        if (!cancelled) {
          clearTimeout(timeout);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [fileUrl, fileName]);

  if (status === "error") {
    return (
      <div className="flex h-[520px] w-full flex-col items-center justify-center gap-2 rounded-cover border border-border bg-white text-center text-sm text-tertiary">
        <p>미리보기를 표시할 수 없습니다.</p>
        <a
          href={fileUrl}
          download={fileName}
          className="font-medium text-primary"
        >
          다운로드로 확인해 주세요
        </a>
      </div>
    );
  }

  if (status === "loading" || !sheets) {
    return (
      <div className="h-[520px] w-full animate-pulse rounded-cover border border-border bg-surface" />
    );
  }

  return (
    <div className="datalab-workbook relative h-[520px] w-full overflow-hidden rounded-cover border border-border bg-white">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Workbook
        data={sheets as any}
        allowEdit={false}
        showToolbar={false}
        lang="en"
      />
    </div>
  );
}
