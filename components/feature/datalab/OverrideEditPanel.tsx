"use client";

/**
 * 관리자 콘텐츠 편집 패널 — 팝업(분석 방법·엑셀 함수) 안에서 설명 텍스트를 수정한다.
 * 원본은 코드(lib/*.ts)에 있고, 여기서 저장하면 DB 오버라이드로 덮어써 표시된다.
 * 코드·수식(KaTeX)·예제 수식은 편집 대상이 아니다(텍스트 필드만).
 */
import { useState } from "react";

export interface OvEditField {
  id: string;
  label: string;
  /** 현재 표시값(오버라이드 반영) — 편집 시작값 */
  value: string;
  /** 원본(코드) 값 — 동일하게 되돌리면 오버라이드에서 제외 */
  original: string;
  rows?: number;
}

export function OverrideEditPanel({
  fields,
  hasOverride,
  onSave,
  onReset,
  onCancel,
}: {
  fields: OvEditField[];
  /** 이미 저장된 오버라이드가 있는지 — '원본 복원' 버튼 노출 */
  hasOverride: boolean;
  /** 편집값(id→text) 전달 — 부모가 diff를 만들어 저장 */
  onSave: (values: Record<string, string>) => Promise<void>;
  onReset: () => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, f.value]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "처리에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-primary">
          ✎ 관리자 편집 — 설명 텍스트만 수정됩니다(코드·수식 제외)
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(() => onSave(values))}
            className="rounded bg-primary px-2.5 py-1 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "저장 중…" : "저장"}
          </button>
          {hasOverride ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void run(onReset)}
              title="저장된 오버라이드를 삭제하고 코드의 원본 설명으로 되돌립니다"
              className="rounded border border-border bg-white px-2.5 py-1 text-[12px] font-medium text-tertiary hover:text-foreground disabled:opacity-40"
            >
              원본 복원
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded border border-border bg-white px-2.5 py-1 text-[12px] font-medium text-tertiary hover:text-foreground disabled:opacity-40"
          >
            취소
          </button>
        </div>
      </div>
      <p className="mt-1 text-[11.5px] leading-relaxed text-tertiary">
        문단은 빈 줄로 구분하고, 목록 줄은 &ldquo;- &rdquo;로 시작하면 화면에서
        글머리 목록으로 표시됩니다. 원본과 같은 값으로 돌려놓은 필드는 저장에서
        제외됩니다.
      </p>
      {error ? (
        <p className="mt-2 text-[12px] text-[#c4302b]">{error}</p>
      ) : null}
      <div className="mt-3 space-y-3">
        {fields.map((f) => (
          <div key={f.id}>
            <label
              htmlFor={`ov-${f.id}`}
              className="text-[12px] font-medium text-foreground"
            >
              {f.label}
              {values[f.id] !== f.original ? (
                <span className="ml-1.5 rounded-full bg-[color:var(--chip-amber-bg)] px-1.5 py-px text-[10px] font-semibold text-[color:var(--chip-amber-fg)]">
                  수정됨
                </span>
              ) : null}
            </label>
            <textarea
              id={`ov-${f.id}`}
              value={values[f.id] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [f.id]: e.target.value }))
              }
              rows={f.rows ?? 4}
              spellCheck={false}
              className="mt-1 block w-full resize-y rounded border border-border bg-white p-2.5 text-[13px] leading-[1.7] text-foreground focus-visible:border-primary focus-visible:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
