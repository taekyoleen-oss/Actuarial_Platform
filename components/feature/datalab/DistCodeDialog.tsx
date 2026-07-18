"use client";

/**
 * 확률분포/모델 적합 파이썬 코드 팝업 — 현재 파라미터가 반영된 scipy.stats
 * 코드를 보여주고 복사한다. tabs를 주면 탭 전환(예: 모델 적합 / 시뮬레이션)
 * 팝업이 되고, 복사는 현재 탭의 코드를 복사한다. MethodDialog와 같은 모달
 * 관례(Escape·오버레이·스크롤락·뒤로가기 닫힘)를 따른다.
 */
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { CodeBlock, CopyButton } from "@/components/feature/datalab/code-popup";
import { useHistoryDismiss } from "@/lib/useHistoryDismiss";
import { toExcelPython, PIE_CODE_NOTE } from "@/lib/methodExcelCode";

export interface CodeTab {
  key: string;
  label: string;
  code: string;
  /** 코드 위에 표시할 안내(선택) — '엑셀 적용 코드' 탭 등 */
  note?: string;
}

export function DistCodeDialog({
  name,
  en,
  code,
  tabs,
  onClose,
}: {
  name: string;
  en: string;
  /** 단일 코드(기존 호출부) — tabs가 있으면 무시 */
  code?: string;
  /** 탭 구성(예: 모델 적합 / 시뮬레이션) */
  tabs?: CodeTab[];
  onClose: () => void;
}) {
  const baseTabs: CodeTab[] = useMemo(
    () =>
      tabs && tabs.length > 0
        ? tabs
        : [{ key: "py", label: "파이썬 코드", code: code ?? "" }],
    [tabs, code]
  );
  // '엑셀 적용 코드' 탭 자동 추가 — 첫 코드를 Python in Excel용으로 변환
  const allTabs: CodeTab[] = useMemo(
    () => [
      ...baseTabs,
      {
        key: "__excel",
        label: "엑셀 코드 적용",
        code: toExcelPython(baseTabs[0].code),
        note: PIE_CODE_NOTE,
      },
    ],
    [baseTabs]
  );
  const [tabKey, setTabKey] = useState<string>(baseTabs[0].key);
  const active = allTabs.find((t) => t.key === tabKey) ?? allTabs[0];

  useHistoryDismiss(true, onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${name} 파이썬 코드`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:max-h-[84vh] sm:rounded-cover"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl" aria-hidden>
                🐍
              </span>
              <h2 className="text-[18px] font-semibold text-foreground">
                {name}
              </h2>
              <span className="text-[13px] text-tertiary">{en}</span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-tertiary">
              현재 파라미터 값이 반영된 scipy.stats 코드입니다. 복사해 데이터
              분석 탭의 파이썬 실행기나 로컬에서 활용하세요.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <CopyButton text={active.code} label="전체 복사" />
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="ml-0.5 text-tertiary hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div
          role="tablist"
          aria-label="코드 종류"
          className="flex items-center gap-1 border-b border-border px-5 pt-2 sm:px-6"
        >
          {allTabs.map((t) => {
            const isActive = active.key === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTabKey(t.key)}
                className={`rounded-t border-b-2 px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "border-[var(--primary)] text-foreground"
                    : "border-transparent text-tertiary hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {active.note ? (
            <div
              className="mb-4 rounded px-4 py-3 leading-[1.8] text-body"
              style={{
                fontSize: 12.5,
                background: "color-mix(in srgb, var(--chip-cyan-bg) 55%, white)",
              }}
            >
              <span className="font-semibold text-foreground">
                엑셀의 Python(=PY())에서 쓰는 법
              </span>
              <br />
              {active.note}
            </div>
          ) : null}
          <CodeBlock code={active.code} codeFz={12.5} />
        </div>

        <footer className="border-t border-border px-5 py-2.5 text-[12px] text-tertiary sm:px-6">
          그래프 축 라벨은 matplotlib 한글 폰트 이슈로 영문입니다.
          <code className="mx-1 font-mono">dist.stats(moments=&quot;mvsk&quot;)</code>
          로 평균·분산·왜도·첨도를 한 번에 얻습니다.
        </footer>
      </div>
    </div>
  );
}
