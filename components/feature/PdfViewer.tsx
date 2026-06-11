"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * PDF 인라인 뷰어 + 전체보기(전체화면 모달) + 다운로드.
 * 브라우저 내장 PDF 렌더(<object>)를 사용하고, 렌더 실패 시 다운로드 링크로 폴백한다.
 * "전체보기"는 다운로드 없이 화면 전체에서 PDF를 크게 열람(Esc/닫기로 종료).
 */
export function PdfViewer({ url, fileName }: { url: string; fileName: string }) {
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // 전체보기 동안 배경 스크롤 잠금 + Esc로 닫기
  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  return (
    <div className="rounded-cover border border-border bg-white shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="truncate text-sm font-medium text-foreground">
          {fileName}
        </span>
        <div className="flex shrink-0 gap-2">
          <Button type="button" size="sm" onClick={() => setFullscreen(true)}>
            전체보기
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={url} download={fileName} target="_blank" rel="noreferrer">
              다운로드
            </a>
          </Button>
        </div>
      </div>

      {failed ? (
        <div className="px-4 py-10 text-center text-sm text-tertiary">
          미리보기를 표시할 수 없습니다.{" "}
          <a href={url} className="text-primary" target="_blank" rel="noreferrer">
            다운로드하여 확인
          </a>
        </div>
      ) : (
        <object
          data={url}
          type="application/pdf"
          className="h-[82vh] w-full"
          onError={() => setFailed(true)}
        >
          <div className="px-4 py-10 text-center text-sm text-tertiary">
            미리보기 미지원 —{" "}
            <a href={url} className="text-primary" target="_blank" rel="noreferrer">
              다운로드
            </a>
          </div>
        </object>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="truncate text-sm font-medium text-foreground">
              {fileName}
            </span>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="secondary" size="sm">
                <a href={url} download={fileName} target="_blank" rel="noreferrer">
                  다운로드
                </a>
              </Button>
              <Button type="button" size="sm" onClick={() => setFullscreen(false)}>
                닫기
              </Button>
            </div>
          </div>
          <iframe
            src={url}
            title={fileName}
            className="w-full min-h-0 flex-1"
          />
        </div>
      )}
    </div>
  );
}
