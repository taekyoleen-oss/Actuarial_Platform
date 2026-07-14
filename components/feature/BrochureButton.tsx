"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";

/**
 * 브로셔(PDF) 팝업 뷰어 — 이름 + '브로셔 보기' 버튼을 누르면 모달로 인라인 열람.
 * 브라우저 내장 PDF 렌더(<object>/<iframe>) 사용, 실패 시 다운로드 폴백.
 * 뒤로가기(popstate)로 모달만 닫힌다(뒤 페이지 이동 방지).
 */
export function BrochureButton({
  title,
  url,
  fileName,
  belongsTo,
}: {
  /** 화면에 노출되는 브로셔 이름 */
  title: string;
  /** PDF 경로(public 정적 자산) */
  url: string;
  /** 다운로드 파일명 */
  fileName: string;
  /** 어떤 앱/항목의 브로셔인지(라벨) */
  belongsTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  useHistoryDismiss(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="rounded-cover border border-border bg-white p-4 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[var(--chip-blue-bg)] text-[var(--chip-blue-fg)]"
        >
          <FileText size={18} />
        </span>
        <div className="min-w-0">
          {belongsTo ? (
            <p className="text-[12px] font-medium text-tertiary">{belongsTo}</p>
          ) : null}
          <p className="text-[15px] font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-tertiary">
            버튼을 누르면 브로셔를 웹에서 바로 열람할 수 있습니다.
          </p>
        </div>
      </div>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          브로셔 보기
        </Button>
        <Button asChild variant="secondary" size="sm">
          <a href={url} download={fileName} target="_blank" rel="noreferrer">
            다운로드
          </a>
        </Button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-foreground/40 p-0 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 브로셔`}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-white shadow-card-hover sm:mx-auto sm:max-w-5xl sm:rounded-cover"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <span className="truncate text-sm font-medium text-foreground">
                {title}
              </span>
              <div className="flex shrink-0 gap-2">
                <Button asChild variant="secondary" size="sm">
                  <a href={url} download={fileName} target="_blank" rel="noreferrer">
                    다운로드
                  </a>
                </Button>
                <Button type="button" size="sm" onClick={() => setOpen(false)}>
                  닫기
                </Button>
              </div>
            </div>
            {failed ? (
              <div className="flex flex-1 items-center justify-center px-4 py-10 text-center text-sm text-tertiary">
                <span>
                  미리보기를 표시할 수 없습니다.{" "}
                  <a
                    href={url}
                    className="text-primary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    다운로드하여 확인
                  </a>
                </span>
              </div>
            ) : (
              <object
                data={url}
                type="application/pdf"
                className="w-full min-h-0 flex-1"
                onError={() => setFailed(true)}
              >
                <iframe src={url} title={title} className="h-full w-full min-h-0 flex-1" />
              </object>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
