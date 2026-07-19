"use client";

/**
 * /datalab 코드 팝업 공용 프리미티브 — 클립보드 복사·복사 버튼·코드 블록·경량 하이라이트.
 * 분석 방법 사전(MethodCloud)과 확률분포 코드 팝업(DistCodeDialog)이 공유한다.
 *
 * 하이라이트 규칙(경량 정규식 — 라이브러리 없이):
 *  - 주석·문자열·숫자·키워드에 더해, 사용자 요청으로 '메서드/함수 호출'과
 *    '키워드 인자(파라미터 이름)'를 별도 색으로 구분한다.
 *  - kwarg 판정은 `이름=` (등호 앞뒤 공백 없음) — PEP8에서 대입은 ` = `이므로 충돌이 적다.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
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

/* ───────────────────── 파이썬 경량 구문 하이라이트 ───────────────────── */

const PY_KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break",
  "class", "continue", "def", "del", "elif", "else", "except", "finally",
  "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal",
  "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
]);

// 알터네이션 순서 = 우선순위: 주석 → 문자열 → 숫자 → kwarg(이름=) → 호출(이름() → 일반 식별자
const PY_TOKEN_RE =
  /(#.*$)|("""[\s\S]*?"""|'''[\s\S]*?'''|[rbfu]{0,2}"(?:\\.|[^"\\\n])*"|[rbfu]{0,2}'(?:\\.|[^'\\\n])*')|(\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)(?==[^=])|([A-Za-z_][A-Za-z0-9_]*)(?=\()|\b([A-Za-z_][A-Za-z0-9_]*)\b/gm;

/** 파이썬 코드 → 색 구분 노드 배열. 실패해도 원문 그대로 폴백(항상 안전). */
export function highlightPython(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  const push = (text: string, cls?: string) => {
    if (!text) return;
    out.push(
      cls ? (
        <span key={key++} className={cls}>
          {text}
        </span>
      ) : (
        text
      )
    );
  };
  try {
    for (const m of code.matchAll(PY_TOKEN_RE)) {
      const idx = m.index ?? 0;
      push(code.slice(last, idx));
      const [full, comment, str, num, kwarg, fn, ident] = m;
      if (comment != null) push(full, "py-tok-comment");
      else if (str != null) push(full, "py-tok-str");
      else if (num != null) push(full, "py-tok-num");
      else if (kwarg != null)
        push(full, PY_KEYWORDS.has(kwarg) ? "py-tok-kw" : "py-tok-kwarg");
      else if (fn != null)
        push(full, PY_KEYWORDS.has(fn) ? "py-tok-kw" : "py-tok-fn");
      else if (ident != null)
        push(full, PY_KEYWORDS.has(ident) ? "py-tok-kw" : undefined);
      else push(full);
      last = idx + full.length;
    }
    push(code.slice(last));
    return out;
  } catch {
    return [code];
  }
}

// 엑셀 수식 — 문자열·숫자·함수명(여는 괄호 앞)만 가볍게 구분
const XL_TOKEN_RE = /("(?:[^"]|"")*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z][A-Za-z0-9_.]*)(?=\()/g;

/** 엑셀 수식 → 색 구분 노드 배열(문자열·숫자·함수명). */
export function highlightExcel(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  try {
    for (const m of code.matchAll(XL_TOKEN_RE)) {
      const idx = m.index ?? 0;
      if (idx > last) out.push(code.slice(last, idx));
      const [full, str, num, fn] = m;
      const cls =
        str != null ? "py-tok-str" : num != null ? "py-tok-num" : fn != null ? "py-tok-fn" : "";
      out.push(
        <span key={key++} className={cls}>
          {full}
        </span>
      );
      last = idx + full.length;
    }
    if (last < code.length) out.push(code.slice(last));
    return out;
  } catch {
    return [code];
  }
}

export function CodeBlock({
  code,
  codeFz,
  lang = "python",
}: {
  code: string;
  codeFz: number;
  /** "python"/"excel"이면 구문 하이라이트, "plain"이면 원문 그대로 */
  lang?: "python" | "excel" | "plain";
}) {
  return (
    <div className="relative mt-2">
      <CopyButton text={code} className="absolute right-2 top-2 z-10" />
      <pre
        className="overflow-x-auto rounded border border-border bg-surface px-4 py-3.5 font-mono leading-[1.75] text-foreground"
        style={{ fontSize: codeFz }}
      >
        <code>
          {lang === "python"
            ? highlightPython(code)
            : lang === "excel"
            ? highlightExcel(code)
            : code}
        </code>
      </pre>
    </div>
  );
}

/* ─────────────── 간결 설명 렌더러 — "- " 불릿 줄 → 목록 ─────────────── */

/**
 * 사전 콘텐츠 규약: 문단은 "\n\n" 구분, 불릿 줄은 "- " 접두.
 * 문단 안에서 일반 줄은 <p>, 연속된 "- " 줄 묶음은 <ul>로 렌더한다.
 */
export function Prose({
  text,
  fz,
  className = "",
}: {
  text: string;
  fz: number;
  className?: string;
}) {
  const paras = text.split("\n\n").filter((p) => p.trim().length > 0);
  let key = 0;
  return (
    <div className={className} style={{ fontSize: fz }}>
      {paras.map((para) => {
        const lines = para.split("\n");
        const blocks: ReactNode[] = [];
        let bullets: string[] = [];
        const flush = () => {
          if (bullets.length === 0) return;
          blocks.push(
            <ul
              key={key++}
              className="mt-1.5 list-disc space-y-1 pl-5 leading-[1.75] marker:text-tertiary first:mt-0"
            >
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          );
          bullets = [];
        };
        for (const line of lines) {
          if (line.startsWith("- ")) bullets.push(line.slice(2));
          else {
            flush();
            if (line.trim())
              blocks.push(
                <p key={key++} className="mt-2 leading-[1.8] first:mt-0">
                  {line}
                </p>
              );
          }
        }
        flush();
        return (
          <div key={key++} className="mt-3 first:mt-0">
            {blocks}
          </div>
        );
      })}
    </div>
  );
}
