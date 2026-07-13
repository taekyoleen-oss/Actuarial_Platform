"use client";

import dynamic from "next/dynamic";

// fortune-sheet/luckyexcel는 브라우저 전용(canvas·window). 서버 컴포넌트에서
// dynamic(ssr:false)는 금지되므로, 클라이언트 모듈인 이 파일에서 래핑해 노출한다.

function PaneSkeleton() {
  return (
    <div className="h-[520px] w-full animate-pulse rounded-cover border border-border bg-surface" />
  );
}

function EditorSkeleton() {
  return (
    <div className="h-[70vh] min-h-[480px] w-full animate-pulse rounded-cover border border-border bg-surface" />
  );
}

/** 공개 읽기전용 워크북 뷰어 (dynamic, ssr:false). */
export const WorkbookViewer = dynamic(() => import("./WorkbookPane"), {
  ssr: false,
  loading: () => <PaneSkeleton />,
});

/** 관리자 워크북 편집기 (dynamic, ssr:false). */
export const WorkbookEditorClient = dynamic(() => import("./WorkbookEditor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
