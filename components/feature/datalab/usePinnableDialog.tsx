"use client";

/**
 * /datalab 팝업 공용 '고정'(pin) 훅 — 사용자 요청(2026-07-19, PiP·collapse 2026-07-20).
 *
 * 3-모드:
 *  - modal  : 가운데 모달(오버레이). 기본 상태.
 *  - pip    : 별도 OS 창(Document Picture-in-Picture). 크롬·엣지에서 '다른 앱(엑셀 등)
 *             위에도 항상 표시'되고 OS 창이라 자유 이동·크기조절. 창 내부에는 별도
 *             React 루트를 띄워(크로스-도큐먼트 이벤트 보장) 탭·복사·글자배율이 동작.
 *  - inline : PiP 미지원(Firefox·Safari)/실패 시 폴백. 뷰포트 내 fixed 축소창 +
 *             헤더 드래그 이동 + 4모퉁이 크기조절(기존 동작 보존).
 *
 * 단일 버튼: modal에서 지원 시 pip, 미지원 시 inline. 고정 상태에서 누르면 modal 복귀.
 * 고정(pip·inline) 상태에서는 '숨기기'로 제목만 남기고 접고('보이기'로 복원) — pip는
 * 창을 제목 높이로 리사이즈, inline은 패널을 제목 높이로 줄인다.
 * MethodDialog · FunctionDialog(엑셀) · DistCodeDialog가 공유한다.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as RPointerEvent,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { Pin, PinOff, ExternalLink, Minimize2, Maximize2, X } from "lucide-react";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se";
type PinMode = "modal" | "inline" | "pip";

const MIN_W = 300;
const MIN_H = 220;
// PiP 창 초기 크기(브라우저가 화면에 맞게 클램프)
const PIP_W = 620;
const PIP_H = 680;
// 접었을 때(제목만) 높이
const COLLAPSED_H = 44;

interface UsePinnableDialogOptions {
  /** 팝업 전체 닫기 — OS 창 X로 PiP 창을 닫으면 이 콜백으로 닫는다 */
  onClose: () => void;
  /** 오버레이 aria-label */
  ariaLabel: string;
  /** 패널(모달·inline) className — 팝업마다 max-w만 다르다 */
  panelClassName: string;
  /** PiP 창 제목 겸 '숨기기' 상태에서 보일 제목 */
  pipTitle?: string;
}

/**
 * 메인 문서의 스타일(Tailwind·globals.css 토큰·KaTeX 등)을 PiP 창으로 복제.
 *
 * <link>를 cloneNode로 옮기면 개발 모드(<style> 인라인)에선 즉시 적용되지만,
 * 프로덕션(CSS가 <link href=/_next/...>)에선 PiP 문서가 스타일시트를 비동기로
 * 다시 받아 첫 렌더가 무스타일 → flex/justify-between이 안 먹어 헤더·탭이 왼쪽으로
 * 뭉쳐 보였다(사용자 보고). 그래서 MDN 권장대로 same-origin 시트는 cssRules 텍스트를
 * 그대로 인라인 <style>로 복제(동기·무플래시)하고, 못 읽는(cross-origin) 시트만
 * 절대 URL <link>로 폴백한다.
 */
function injectPipStyles(pip: Window) {
  const head = pip.document.head;
  for (const sheet of Array.from(document.styleSheets)) {
    let rulesText: string | null = null;
    try {
      rulesText = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join("\n");
    } catch {
      rulesText = null; // cross-origin — 규칙 접근 불가
    }
    if (rulesText !== null) {
      const style = pip.document.createElement("style");
      style.textContent = rulesText;
      if (sheet.media?.mediaText) style.media = sheet.media.mediaText;
      head.appendChild(style);
    } else if (sheet.href) {
      const link = pip.document.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href; // styleSheet.href는 절대 URL
      if (sheet.media?.mediaText) link.media = sheet.media.mediaText;
      const owner = sheet.ownerNode as HTMLElement | null;
      const co = owner?.getAttribute?.("crossorigin");
      if (co !== null && co !== undefined) link.setAttribute("crossorigin", co);
      head.appendChild(link);
    }
  }
}

/** PiP document의 html/body를 메인과 정렬(폰트·토큰 상속)하고 레이아웃 설정 */
function preparePipDocument(pip: Window, title?: string) {
  const doc = pip.document;
  doc.documentElement.lang = document.documentElement.lang || "ko";
  doc.documentElement.className = document.documentElement.className;
  doc.body.className = document.body.className;
  // :root 인라인 커스텀 프로퍼티(테마 등)가 있으면 복사
  const rootInline = document.documentElement.getAttribute("style");
  if (rootInline) doc.documentElement.setAttribute("style", rootInline);
  doc.body.style.margin = "0";
  doc.body.style.height = "100vh";
  doc.body.style.overflow = "hidden";
  doc.body.style.background = "var(--page-bg, #fff)";
  if (title) doc.title = title;
}

/** 접힘(제목만) 바 — inline은 드래그로 이동, pip는 OS 창이 이동 담당 */
function CollapsedBar({
  title,
  onExpand,
  onClose,
  dragProps,
}: {
  title?: string;
  onExpand: () => void;
  onClose: () => void;
  dragProps?: Record<string, unknown>;
}) {
  return (
    <div
      className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-white px-3"
      {...(dragProps || {})}
    >
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
        {title ?? "팝업"}
      </span>
      <button
        type="button"
        onClick={onExpand}
        aria-label="보이기"
        title="보이기 — 원래 크기로 다시 펼칩니다"
        className="inline-flex items-center gap-1 rounded border border-primary bg-primary/10 px-2 py-1 text-[11.5px] font-medium text-primary"
      >
        <Maximize2 size={13} /> 보이기
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="text-tertiary hover:text-foreground"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/**
 * PiP 창에 별도 React 루트를 만들어 children을 렌더한다(모듈 스코프 = 안정 식별).
 * children이 바뀔 때마다(=메인 팝업 재렌더) 루트에 다시 render 하여 상태를 동기화한다.
 * collapsed면 창을 제목 높이로 리사이즈(복원 시 원래 크기로).
 */
function PipMount({
  win,
  title,
  collapsed,
  children,
}: {
  win: Window;
  title?: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  const rootRef = useRef<Root | null>(null);
  const prevSize = useRef<{ w: number; h: number } | null>(null);

  useEffect(() => {
    injectPipStyles(win);
    preparePipDocument(win, title);
    const container = win.document.createElement("div");
    container.className =
      "flex h-full w-full flex-col overflow-hidden bg-white text-foreground";
    win.document.body.appendChild(container);
    const root = createRoot(container);
    rootRef.current = root;
    root.render(children);
    return () => {
      root.unmount();
      container.remove();
      rootRef.current = null;
    };
    // win 단위로 루트를 만든다(children 변경은 아래 effect가 반영)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [win]);

  useEffect(() => {
    rootRef.current?.render(children);
  }, [children]);

  // 접기/펼치기 → OS 창 리사이즈
  useEffect(() => {
    if (collapsed) {
      const chrome = win.outerHeight - win.innerHeight;
      prevSize.current = { w: win.outerWidth, h: win.outerHeight };
      try {
        win.resizeTo(win.outerWidth, COLLAPSED_H + Math.max(0, chrome));
      } catch {
        /* 일부 환경 리사이즈 불가 — 내용은 접힌 채 유지 */
      }
    } else if (prevSize.current) {
      try {
        win.resizeTo(prevSize.current.w, prevSize.current.h);
      } catch {
        /* 무시 */
      }
      prevSize.current = null;
    }
  }, [collapsed, win]);

  return null;
}

export function usePinnableDialog({
  onClose,
  ariaLabel,
  panelClassName,
  pipTitle,
}: UsePinnableDialogOptions) {
  const [mode, setMode] = useState<PinMode>("modal");
  const [collapsed, setCollapsed] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [pipSupported, setPipSupported] = useState(false);

  const drag = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    base: Rect;
  } | null>(null);
  const pipWinRef = useRef<Window | null>(null);
  // 'closingRef'가 true면 pagehide는 modal 복귀만(팝업 전체 닫기 X)
  const closingRef = useRef(false);
  // onClose 최신값 참조(pagehide 핸들러에서 사용)
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 지원 감지(마운트 후 → SSR mismatch 회피)
  useEffect(() => {
    setPipSupported(
      typeof window !== "undefined" && "documentPictureInPicture" in window
    );
  }, []);

  // modal로 돌아오면 접힘 상태 해제
  useEffect(() => {
    if (mode === "modal") setCollapsed(false);
  }, [mode]);

  // 언마운트 시 열린 PiP 창 정리(전체 닫기 아님)
  useEffect(
    () => () => {
      closingRef.current = true;
      pipWinRef.current?.close();
    },
    []
  );

  const pinned = mode !== "modal";

  /* ── inline(뷰포트 내 고정) 위치 계산 ── */
  const computeInlineRect = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = Math.min(560, Math.round(vw * 0.88));
    const h = Math.min(540, Math.round(vh * 0.72));
    setRect({
      x: Math.max(8, vw - w - 20),
      y: Math.max(8, vh - h - 20),
      w,
      h,
    });
  }, []);

  /* ── PiP 창 열기 ── */
  const openPip = useCallback(async () => {
    const dpip = window.documentPictureInPicture;
    if (!dpip) {
      computeInlineRect();
      setMode("inline");
      return;
    }
    try {
      const w = await dpip.requestWindow({ width: PIP_W, height: PIP_H });
      pipWinRef.current = w;
      const onHide = () => {
        w.removeEventListener("pagehide", onHide);
        pipWinRef.current = null;
        setPipWindow(null);
        setMode("modal");
        // 사용자가 OS 창 X로 닫았으면 팝업 전체 닫기
        if (!closingRef.current) onCloseRef.current();
        closingRef.current = false;
      };
      w.addEventListener("pagehide", onHide);
      setPipWindow(w);
      setMode("pip");
    } catch {
      // 차단/거부 → inline 폴백
      computeInlineRect();
      setMode("inline");
    }
  }, [computeInlineRect]);

  /* ── PiP 창 닫고 모달로 복귀(버튼) ── */
  const closePipToModal = useCallback(() => {
    closingRef.current = true; // pagehide가 modal 복귀만 하도록
    pipWinRef.current?.close();
  }, []);

  /* ── 고정/해제 토글 ── */
  const togglePin = useCallback(() => {
    if (mode !== "modal") {
      if (mode === "pip") closePipToModal();
      else setMode("modal");
      return;
    }
    if (pipSupported) void openPip();
    else {
      computeInlineRect();
      setMode("inline");
    }
  }, [mode, pipSupported, openPip, closePipToModal, computeInlineRect]);

  /* ── 드래그(inline 전용) ── */
  const onDragStart = useCallback(
    (dm: DragMode) => (e: RPointerEvent<HTMLElement>) => {
      if (!rect) return;
      if (
        dm === "move" &&
        (e.target as HTMLElement).closest("button, input, select, a, textarea")
      )
        return;
      drag.current = { mode: dm, startX: e.clientX, startY: e.clientY, base: rect };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* 캡처 불가 환경 무시 */
      }
      e.preventDefault();
    },
    [rect]
  );

  const onDragMove = useCallback((e: RPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let { x, y, w, h } = d.base;
    if (d.mode === "move") {
      x += dx;
      y += dy;
    } else {
      if (d.mode === "ne" || d.mode === "se") w += dx;
      if (d.mode === "nw" || d.mode === "sw") {
        w -= dx;
        x += dx;
      }
      if (d.mode === "sw" || d.mode === "se") h += dy;
      if (d.mode === "nw" || d.mode === "ne") {
        h -= dy;
        y += dy;
      }
    }
    w = Math.max(MIN_W, Math.min(w, vw - 16));
    h = Math.max(MIN_H, Math.min(h, vh - 16));
    x = Math.max(8 - w + 80, Math.min(x, vw - 80));
    y = Math.max(0, Math.min(y, vh - 48));
    setRect({ x, y, w, h });
  }, []);

  const onDragEnd = useCallback((e: RPointerEvent<HTMLElement>) => {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* 무시 */
    }
  }, []);

  /* ── 헤더 드래그 props(inline 전용) ── */
  const dragHandleProps: Record<string, unknown> =
    mode === "inline"
      ? {
          onPointerDown: onDragStart("move"),
          onPointerMove: onDragMove,
          onPointerUp: onDragEnd,
          style: { cursor: "move", touchAction: "none" } as CSSProperties,
        }
      : {};

  /* ── 4모퉁이 리사이즈 핸들(inline 전용) ── */
  const ResizeHandles = useCallback(() => {
    const corners: { m: DragMode; cls: string; cursor: string }[] = [
      { m: "nw", cls: "left-0 top-0", cursor: "nwse-resize" },
      { m: "ne", cls: "right-0 top-0", cursor: "nesw-resize" },
      { m: "sw", cls: "left-0 bottom-0", cursor: "nesw-resize" },
      { m: "se", cls: "right-0 bottom-0", cursor: "nwse-resize" },
    ];
    return (
      <>
        {corners.map((c) => (
          <div
            key={c.m}
            role="presentation"
            aria-hidden
            onPointerDown={onDragStart(c.m)}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            className={`absolute z-20 h-4 w-4 ${c.cls}`}
            style={{ cursor: c.cursor, touchAction: "none" }}
          />
        ))}
      </>
    );
  }, [onDragStart, onDragMove, onDragEnd]);

  /* ── 고정/해제 버튼 ── */
  const PinButton = useCallback(() => {
    const isPinned = mode !== "modal";
    const label = isPinned
      ? "고정 해제"
      : pipSupported
        ? "창으로 고정"
        : "앞면 고정";
    const title = isPinned
      ? mode === "pip"
        ? "고정 해제 — 별도 창을 닫고 가운데 팝업으로 되돌립니다"
        : "고정 해제 — 가운데 팝업으로 되돌립니다"
      : pipSupported
        ? "창으로 고정 — 엑셀 등 다른 앱 위에도 항상 보이는 별도 창으로 분리합니다(자유 이동)"
        : "화면 앞에 고정 — 축소된 창으로 떠 있고, 드래그 이동·모퉁이 크기조절이 가능합니다";
    return (
      <button
        type="button"
        onClick={togglePin}
        aria-pressed={isPinned}
        aria-label={label}
        title={title}
        className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-medium ${
          isPinned ? "text-[10px]" : "text-[11.5px]"
        } ${
          isPinned
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-white text-tertiary hover:text-foreground"
        }`}
      >
        {isPinned ? (
          <PinOff size={13} />
        ) : pipSupported ? (
          <ExternalLink size={13} />
        ) : (
          <Pin size={13} />
        )}
        {label}
      </button>
    );
  }, [mode, pipSupported, togglePin]);

  /* ── 숨기기 버튼(고정 상태에서만, 접히기 전) ── */
  const CollapseButton = useCallback(() => {
    if (mode === "modal" || collapsed) return null;
    return (
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        aria-label="숨기기"
        title="숨기기 — 제목만 남기고 접습니다('보이기'로 복원)"
        className="inline-flex items-center gap-1 rounded border border-border bg-white px-2 py-1 text-[10px] font-medium text-tertiary hover:text-foreground"
      >
        <Minimize2 size={13} /> 숨기기
      </button>
    );
  }, [mode, collapsed]);

  /* ── 3-모드 렌더 래퍼 ── */
  const render = useCallback(
    (children: ReactNode) => {
      const bar = (
        <CollapsedBar
          title={pipTitle}
          onExpand={() => setCollapsed(false)}
          onClose={onClose}
          dragProps={mode === "inline" ? dragHandleProps : undefined}
        />
      );
      // PiP: 별도 OS 창(메인 DOM엔 null, 내용은 두 번째 루트로)
      if (mode === "pip" && pipWindow) {
        return (
          <PipMount win={pipWindow} title={pipTitle} collapsed={collapsed}>
            {collapsed ? bar : children}
          </PipMount>
        );
      }
      const isModal = mode === "modal";
      const overlayClass = isModal
        ? "fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6"
        : "fixed inset-0 z-50 pointer-events-none";
      const panelStyle: CSSProperties | undefined =
        mode === "inline" && rect
          ? {
              position: "fixed",
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: collapsed ? COLLAPSED_H : rect.h,
              maxHeight: "none",
              maxWidth: "none",
            }
          : undefined;
      return (
        <div
          className={overlayClass}
          role="dialog"
          aria-modal={isModal}
          aria-label={ariaLabel}
          onClick={isModal ? onClose : undefined}
        >
          <div
            className={panelClassName}
            style={panelStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {mode === "inline" && collapsed ? (
              bar
            ) : (
              <>
                {mode === "inline" ? <ResizeHandles /> : null}
                {children}
              </>
            )}
          </div>
        </div>
      );
    },
    [
      mode,
      collapsed,
      pipWindow,
      pipTitle,
      rect,
      ariaLabel,
      panelClassName,
      onClose,
      dragHandleProps,
      ResizeHandles,
    ]
  );

  return {
    pinned,
    // pip 모드에서는 OS 창 자체가 닫기(X)를 제공하므로, 팝업 자체 X는 중복 — 이 값으로 숨긴다
    isPip: mode === "pip",
    dragHandleProps,
    PinButton,
    CollapseButton,
    render,
  };
}
