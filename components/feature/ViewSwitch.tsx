"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// 카드 ↔ 게시판 보기 전환(클라이언트 상태) — 정적 페이지(/theory·/apps)에서 사용.
// 두 분기를 모두 마운트한 채 hidden으로 전환해 카드 뷰의 iframe(아이덴트) 상태를 보존한다.
// (/posts 는 URL ?view 기반 토글을 별도로 사용)
export function ViewSwitch({
  card,
  board,
  defaultView = "card",
}: {
  card: React.ReactNode;
  board: React.ReactNode;
  defaultView?: "card" | "board";
}) {
  const [view, setView] = useState<"card" | "board">(defaultView);
  return (
    <>
      <div className="mb-6 flex justify-end">
        <div
          role="group"
          aria-label="보기 방식"
          className="inline-flex rounded bg-surface p-0.5"
        >
          <Btn active={view === "card"} onClick={() => setView("card")}>
            카드
          </Btn>
          <Btn active={view === "board"} onClick={() => setView("board")}>
            게시판
          </Btn>
        </div>
      </div>
      <div className={cn(view === "board" && "hidden")}>{card}</div>
      <div className={cn(view === "card" && "hidden")}>{board}</div>
    </>
  );
}

function Btn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-[3px] px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-white text-foreground shadow-card"
          : "text-tertiary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
