"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * PDF 인라인 뷰어 + 다운로드. 브라우저 내장 PDF 렌더(<object>)를 사용하고,
 * 렌더 실패 시 다운로드 링크로 폴백한다. (커스텀 렌더가 필요하면 pdfjs-dist로 교체 가능)
 */
export function PdfViewer({ url, fileName }: { url: string; fileName: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="rounded-cover border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="truncate text-sm font-medium text-foreground">
          {fileName}
        </span>
        <Button asChild variant="secondary" size="sm">
          <a href={url} download={fileName} target="_blank" rel="noreferrer">
            다운로드
          </a>
        </Button>
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
          className="h-[70vh] w-full"
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
    </div>
  );
}
