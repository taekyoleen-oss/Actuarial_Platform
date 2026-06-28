"use client";

import { useSyncExternalStore } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 카테고리(섹션)를 접고 펼 수 있는 패널 — 헤더 클릭으로 토글, 기본 펼침(2026-06-28 사용자 요청).
// 상태는 storageKey 단위로 모듈 스토어 + localStorage에 공유되어, 같은 키의 패널이
// 여러 곳(카드/게시판 분기 등)에 있어도 항상 동기화되고 새로고침에도 유지된다.

const store = new Map<string, boolean>();
const listeners = new Set<() => void>();

function ensureInit(key: string, defaultOpen: boolean) {
  if (store.has(key)) return;
  let v = defaultOpen;
  try {
    const s = window.localStorage.getItem(`collapse:${key}`);
    if (s === "0") v = false;
    else if (s === "1") v = true;
  } catch {}
  store.set(key, v);
}

function setOpen(key: string, open: boolean) {
  store.set(key, open);
  try {
    window.localStorage.setItem(`collapse:${key}`, open ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function useCollapse(key: string, defaultOpen: boolean) {
  if (typeof window !== "undefined") ensureInit(key, defaultOpen);
  const open = useSyncExternalStore(
    subscribe,
    () => (store.has(key) ? store.get(key)! : defaultOpen),
    () => defaultOpen
  );
  return [open, () => setOpen(key, !(store.get(key) ?? defaultOpen))] as const;
}

export function Collapsible({
  title,
  count,
  storageKey,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  /** 상태 공유·저장 키(미지정 시 title). 페이지 간 충돌을 피하려면 접두사 권장(예: "theory:life") */
  storageKey?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, toggle] = useCollapse(storageKey ?? title, defaultOpen);
  return (
    <section>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="group mb-5 flex w-full items-center gap-2.5 text-left text-[19px] font-semibold text-foreground"
      >
        <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
        {title}
        {typeof count === "number" ? (
          <span className="text-sm font-normal text-tertiary">{count}</span>
        ) : null}
        <ChevronDown
          size={18}
          aria-hidden
          className={cn(
            "ml-0.5 text-tertiary transition-transform duration-tesla ease-tesla group-hover:text-foreground",
            open ? "" : "-rotate-90"
          )}
        />
      </button>
      <div className={cn(open ? "" : "hidden")}>{children}</div>
    </section>
  );
}
