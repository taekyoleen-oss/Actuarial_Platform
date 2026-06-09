"use client";

import { useEffect, useRef } from "react";

/** 상세 진입 시 1회 조회수 +1. (세션 중복 방지는 sessionStorage로 최소화) */
export function ViewCounter({ postId }: { postId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const key = `viewed:${postId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {});
  }, [postId]);
  return null;
}
