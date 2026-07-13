"use client";

import { useEffect, useRef } from "react";

/**
 * DataLab 상세 진입 시 1회 조회수 +1 (POST /api/datalab/[id]/view).
 * 실패는 조용히 무시(posts ViewCounter 패턴). 세션 중복은 sessionStorage로 최소화.
 */
export function DataViewCounter({ postId }: { postId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const key = `dataviewed:${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/datalab/${postId}/view`, { method: "POST" }).catch(() => {});
  }, [postId]);
  return null;
}
