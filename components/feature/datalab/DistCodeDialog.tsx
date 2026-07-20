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
import { usePinnableDialog } from "@/components/feature/datalab/usePinnableDialog";

const FONT_SCALE_MIN = 0.8;
const FONT_SCALE_MAX = 1.6;

export interface CodeTab {
  key: string;
  label: string;
  code: string;
  /** 코드 위에 표시할 안내(선택) — 문자열 또는 글머리 목록 */
  note?: string | string[];
}

export function DistCodeDialog({
  name,
  en,
  code,
  tabs,
  subtitle,
  hideFooter,
  onClose,
}: {
  name: string;
  en: string;
  /** 단일 코드(기존 호출부) — tabs가 있으면 무시 */
  code?: string;
  /** 탭 구성(예: 모델 적합 / 시뮬레이션) */
  tabs?: CodeTab[];
  /** 헤더 아래 설명(미지정 시 확률분포용 기본 문구) */
  subtitle?: string;
  /** 확률분포용 하단 안내(matplotlib·dist.stats) 숨김 — 데이터 핸들링 스니펫 등 */
  hideFooter?: boolean;
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
  // 글자 확대/축소 — 코드·안내에 적용(창 크기와 독립)
  const [fontScale, setFontScale] = useState(1);
  const step = (d: number) =>
    setFontScale((cur) =>
      Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, Math.round((cur + d) * 10) / 10))
    );
  // 고정(pin) — 크롬·엣지: 별도 창(다른 앱 위), 그 외: 뷰포트 내 축소창
  const pin = usePinnableDialog({
    onClose,
    ariaLabel: `${name} 파이썬 코드`,
    panelClassName:
      "pointer-events-auto flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-cover bg-white shadow-card-hover sm:max-h-[84vh] sm:rounded-cover",
    pipTitle: name,
  });

  useHistoryDismiss(true, onClose);

  useEffect(() => {
    if (pin.pinned) return; // 고정 중엔 배경 상호작용 유지
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, pin.pinned]);

  return pin.render(
    <>
        <header
          className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6"
          {...pin.dragHandleProps}
        >
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
              {subtitle ??
                "현재 파라미터 값이 반영된 scipy.stats 코드입니다. 복사해 데이터 분석 탭의 파이썬 실행기나 로컬에서 활용하세요."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {pin.CollapseButton()}
            {pin.PinButton()}
            {/* 글자 확대/축소 — 창 크기 조절과 별개로 폰트만 변경 */}
            <div className="flex items-center rounded border border-border">
              <button
                type="button"
                onClick={() => step(-0.1)}
                disabled={fontScale <= FONT_SCALE_MIN}
                aria-label="글자 작게"
                className="px-2 py-1 text-[12px] font-medium text-tertiary hover:text-foreground disabled:opacity-40"
              >
                가−
              </button>
              <button
                type="button"
                onClick={() => setFontScale(1)}
                aria-label="글자 크기 원래대로"
                title="원래 크기로"
                className="min-w-[42px] border-x border-border px-1 py-1 text-center text-[11px] tabular-nums text-tertiary hover:text-foreground"
              >
                {Math.round(fontScale * 100)}%
              </button>
              <button
                type="button"
                onClick={() => step(0.1)}
                disabled={fontScale >= FONT_SCALE_MAX}
                aria-label="글자 크게"
                className="px-2 py-1 text-[12px] font-medium text-tertiary hover:text-foreground disabled:opacity-40"
              >
                가+
              </button>
            </div>
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
              className="mb-4 rounded px-4 py-3 text-body"
              style={{
                fontSize: Math.round(13 * fontScale * 10) / 10,
                background: "color-mix(in srgb, var(--chip-cyan-bg) 55%, white)",
              }}
            >
              <span className="font-semibold text-foreground">
                엑셀의 Python(=PY())에서 쓰는 법
              </span>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 leading-[1.7] marker:text-tertiary">
                {(Array.isArray(active.note) ? active.note : [active.note]).map(
                  (b, i) => (
                    <li key={i}>{b}</li>
                  )
                )}
              </ul>
            </div>
          ) : null}
          <CodeBlock code={active.code} codeFz={13.5 * fontScale} />
        </div>

        {hideFooter ? null : (
          <footer className="border-t border-border px-5 py-2.5 text-[12px] text-tertiary sm:px-6">
            그래프 축 라벨은 matplotlib 한글 폰트 이슈로 영문입니다.
            <code className="mx-1 font-mono">dist.stats(moments=&quot;mvsk&quot;)</code>
            로 평균·분산·왜도·첨도를 한 번에 얻습니다.
          </footer>
        )}
    </>
  );
}
