"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";
// @ts-expect-error luckyexcel ships no type declarations
import LuckyExcel from "luckyexcel";
import { Button } from "@/components/ui/button";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
// JSON 원문 15MB 서버 제한 대비 여유(14MB)에서 클라 중단.
const SIZE_LIMIT = 14 * 1024 * 1024;

type ExportJson = { sheets?: unknown[] };
type SaveState = "idle" | "saving" | "saved" | "error";

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

/**
 * 관리자 워크북 편집기 — 로드 경로는 뷰어와 동일 + allowEdit 활성.
 * 실제 사용자 변경만 4초 디바운스 자동저장 + 헤더 "저장" 버튼(즉시).
 * 저장 = ref.getAllSheets()를 가공 없이 { sheets, baseName }로 POST /api/datalab/[id]/workbook.
 *
 * 무편집 자동저장 방지: fortune-sheet는 초기 하이드레이션 시 onChange를 발화하므로,
 * 사용자 상호작용(포인터/키) 이전의 onChange는 전부 무시한다(버스트 개수·타이밍 무관).
 * 게다가 doSave는 dirty가 아니면 no-op이다(이중 방어).
 */
export default function WorkbookEditor({
  postId,
  fileUrl,
  fileName,
  baseName,
  version: initialVersion,
}: {
  postId: string;
  /** 상세 경로 slug (라우팅 컨텍스트 — 계약 유지). */
  slug: string;
  fileUrl: string;
  fileName: string;
  baseName: string;
  version: number;
}) {
  const [sheets, setSheets] = useState<unknown[] | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [version, setVersion] = useState(initialVersion);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  // 변경 감지 — 렌더용 state + 콜백 클로저용 ref 미러(동시 갱신).
  const [dirty, setDirty] = useState(false);

  const ref = useRef<WorkbookInstance | null>(null);
  const dirtyRef = useRef(false);
  // 사용자 상호작용 이전(초기 하이드레이션 등) onChange를 걸러내는 게이트.
  const interactedRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markDirty = useCallback((v: boolean) => {
    dirtyRef.current = v;
    setDirty(v);
  }, []);

  // 로드: fileUrl → File → luckyexcel → sheets
  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    setSheets(null);
    // 새 워크북을 로드하는 동안 상호작용/변경 상태 초기화(재로드 시 잔여 방지).
    interactedRef.current = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoadStatus((s) => (s === "loading" ? "error" : s));
    }, 30000);

    (async () => {
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error("fetch_failed");
        const blob = await res.blob();
        const file = new File([blob], fileName || "workbook.xlsx", {
          type: blob.type || XLSX_MIME,
        });
        LuckyExcel.transformExcelToLucky(file, (exportJson: ExportJson) => {
          if (cancelled) return;
          clearTimeout(timeout);
          const s = exportJson?.sheets;
          if (!s || s.length === 0) {
            setLoadStatus("error");
            return;
          }
          setSheets(s);
          setLoadStatus("ready");
        });
      } catch {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoadStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [fileUrl, fileName]);

  const doSave = useCallback(async () => {
    // 변경이 없으면 저장하지 않는다(자동·수동 공통 방어) — 무편집 신규 버전 방지.
    if (!dirtyRef.current) return;
    const inst = ref.current;
    if (!inst) return;
    let allSheets: unknown[];
    try {
      allSheets = inst.getAllSheets();
    } catch {
      setSaveState("error");
      setErrMsg("워크북을 읽지 못했습니다.");
      return;
    }
    const body = JSON.stringify({ sheets: allSheets, baseName });
    if (body.length > SIZE_LIMIT) {
      setSaveState("error");
      setErrMsg("파일이 너무 큽니다(14MB 초과). 원본을 직접 업로드해 주세요.");
      return;
    }
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setSaveState("saving");
    setErrMsg(null);
    try {
      const res = await fetch(`/api/datalab/${postId}/workbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j?.error ?? "save_failed");
      }
      const j = (await res.json()) as {
        file?: { version?: number };
        savedAt?: string;
      };
      markDirty(false);
      if (typeof j?.file?.version === "number") setVersion(j.file.version);
      setSavedAt(j?.savedAt ? new Date(j.savedAt) : new Date());
      setSaveState("saved");
    } catch (e) {
      // 실패 시 dirty 유지(재시도 가능).
      setSaveState("error");
      setErrMsg(
        e instanceof Error && e.message
          ? `저장 실패 (${e.message}) — 다시 시도`
          : "저장 실패 — 다시 시도"
      );
    }
  }, [postId, baseName, markDirty]);

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void doSave();
    }, 4000);
  }, [doSave]);

  // 사용자 상호작용 표시 — 이 이후의 onChange만 실제 변경으로 취급.
  const markInteracted = useCallback(() => {
    interactedRef.current = true;
  }, []);

  const onChange = useCallback(() => {
    // 초기 하이드레이션 등 상호작용 이전 onChange는 무시(무편집 자동저장 차단).
    if (!interactedRef.current) return;
    markDirty(true);
    scheduleSave();
  }, [scheduleSave, markDirty]);

  // 미저장 변경 이탈 경고 (dirty 기준)
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  // 언마운트 시 타이머 정리
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const statusLabel = (() => {
    if (saveState === "saving") return "저장 중…";
    if (saveState === "error") return errMsg ?? "저장 실패 — 다시 시도";
    if (dirty) return "변경됨 · 자동 저장 대기";
    if (saveState === "saved")
      return savedAt ? `저장됨 ${hhmm(savedAt)}` : "저장됨";
    return "변경 없음";
  })();

  const statusClass =
    saveState === "error"
      ? "text-[#c4302b]"
      : !dirty && saveState === "saved"
        ? "text-brand-sky"
        : "text-tertiary";

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-tertiary">
            현재 v{version}
          </span>
          <span className={statusClass}>{statusLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          {saveState === "error" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void doSave()}
            >
              다시 시도
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={() => void doSave()}
            disabled={!dirty || saveState === "saving" || loadStatus !== "ready"}
          >
            저장
          </Button>
        </div>
      </div>

      {loadStatus === "error" ? (
        <div className="flex h-[70vh] min-h-[480px] w-full flex-col items-center justify-center gap-2 rounded-cover border border-border bg-white text-center text-sm text-tertiary">
          <p>워크북을 불러오지 못했습니다.</p>
          <a
            href={fileUrl}
            download={fileName}
            className="font-medium text-primary"
          >
            원본을 다운로드해 확인해 주세요
          </a>
        </div>
      ) : loadStatus === "loading" || !sheets ? (
        <div className="h-[70vh] min-h-[480px] w-full animate-pulse rounded-cover border border-border bg-surface" />
      ) : (
        <div
          className="datalab-workbook relative h-[70vh] min-h-[480px] w-full overflow-hidden rounded-cover border border-border bg-white"
          onPointerDownCapture={markInteracted}
          onKeyDownCapture={markInteracted}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Workbook
            ref={ref as any}
            data={sheets as any}
            onChange={onChange}
            lang="en"
          />
        </div>
      )}
    </div>
  );
}
