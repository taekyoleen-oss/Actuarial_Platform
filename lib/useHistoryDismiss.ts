"use client";

import { useEffect, useRef } from "react";

/**
 * 팝업(모달)이 열려 있는 동안 브라우저 '뒤로가기'가 뒤 페이지로 이동하는 대신
 * 팝업만 닫도록 한다.
 *
 * - 열릴 때 history에 임시 항목(marker)을 push → 뒤로가기(popstate)가 그 항목을
 *   소비하며 onClose를 호출(뒤 페이지 이동 방지).
 * - 버튼·Esc·오버레이 클릭 등으로 직접 닫으면(= popstate가 아닌 경우) 남은 임시
 *   항목을 back()으로 되돌려 유령 히스토리 항목이 쌓이지 않게 한다.
 * - React StrictMode(dev의 effect 이중 실행)에서도 중복 push·오작동이 없도록
 *   현재 history.state의 marker 유무로 push를 멱등 처리한다.
 */
export function useHistoryDismiss(open: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closedByPop = useRef(false);
  const prevOpen = useRef(false);

  // 열림: marker push + popstate 구독
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const onPop = () => {
      closedByPop.current = true;
      onCloseRef.current();
    };
    const state = window.history.state as { __modalDismiss?: boolean } | null;
    if (!(state && state.__modalDismiss)) {
      window.history.pushState({ ...state, __modalDismiss: true }, "");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  // 닫힘 전이 처리: 직접 닫힘이면 남은 marker 항목을 되돌린다(유령 항목 방지).
  useEffect(() => {
    if (prevOpen.current && !open) {
      if (closedByPop.current) {
        closedByPop.current = false; // 뒤로가기로 이미 소비됨
      } else if (typeof window !== "undefined") {
        const state = window.history.state as
          | { __modalDismiss?: boolean }
          | null;
        if (state && state.__modalDismiss) window.history.back();
      }
    }
    prevOpen.current = open;
  }, [open]);
}
