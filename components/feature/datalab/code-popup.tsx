"use client";

/**
 * /datalab 코드 팝업 공용 프리미티브 — 클립보드 복사·복사 버튼·코드 블록.
 * 분석 방법 사전(MethodCloud)과 확률분포 코드 팝업(DistCodeDialog)이 공유한다.
 */
import { useEffect, useRef, useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";

/** 클립보드 복사 — 실패 시 textarea + execCommand 폴백. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({
  text,
  label = "복사",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(text);
        setState(ok ? "done" : "fail");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 1800);
      }}
      className={`inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-1 text-[11.5px] font-medium text-tertiary hover:text-foreground ${className}`}
    >
      {state === "done" ? <Check size={13} /> : <ClipboardCopy size={13} />}
      {state === "done" ? "복사됨" : state === "fail" ? "복사 실패" : label}
    </button>
  );
}

export function CodeBlock({ code, codeFz }: { code: string; codeFz: number }) {
  return (
    <div className="relative mt-2">
      <CopyButton text={code} className="absolute right-2 top-2 z-10" />
      <pre
        className="overflow-x-auto rounded border border-border bg-surface px-4 py-3.5 font-mono leading-[1.75] text-foreground"
        style={{ fontSize: codeFz }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
