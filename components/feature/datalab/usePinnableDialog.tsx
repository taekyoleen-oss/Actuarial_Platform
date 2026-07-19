"use client";

/**
 * /datalab 팝업 공용 '앞면 고정'(pin) 훅 — 사용자 요청(2026-07-19).
 * 팝업 상단 버튼으로 고정하면: 오버레이가 사라지고(뒤 페이지 상호작용 가능)
 * 축소된 크기로 화면 맨 앞(fixed)에 떠 있으며,
 *  - 헤더 드래그로 이동
 *  - 4개 모퉁이 핸들로 크기 조절(내용은 재배치, 글자는 가−/가+로만 변경)
 *  - 내용은 내부 스크롤
 * MethodDialog · FunctionDialog(엑셀) · DistCodeDialog가 공유한다.
 */
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as RPointerEvent,
} from "react";
import { Pin, PinOff } from "lucide-react";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

const MIN_W = 300;
const MIN_H = 220;

export function usePinnableDialog() {
  const [pinned, setPinned] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const drag = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    base: Rect;
  } | null>(null);

  const pin = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // 현재 상태에서 '일부 축소된 형태'로 우하단에 고정
    const w = Math.min(560, Math.round(vw * 0.88));
    const h = Math.min(540, Math.round(vh * 0.72));
    setRect({
      x: Math.max(8, vw - w - 20),
      y: Math.max(8, vh - h - 20),
      w,
      h,
    });
    setPinned(true);
  }, []);

  const togglePin = useCallback(() => {
    if (pinned) setPinned(false);
    else pin(); // pin()이 rect 준비 + pinned true
  }, [pinned, pin]);

  const onDragStart = useCallback(
    (mode: DragMode) => (e: RPointerEvent<HTMLElement>) => {
      if (!rect) return;
      // 헤더의 버튼·입력 조작은 드래그로 취급하지 않는다
      if (
        mode === "move" &&
        (e.target as HTMLElement).closest("button, input, select, a, textarea")
      )
        return;
      drag.current = { mode, startX: e.clientX, startY: e.clientY, base: rect };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* 합성 이벤트 등 캡처 불가 환경 무시 */
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
    // 화면 밖으로 완전히 사라지지 않게 느슨히 클램프
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

  /** 오버레이(모달 배경) — 고정 시 배경·클릭 닫기 없이 클릭 통과 */
  const overlayClass = pinned
    ? "fixed inset-0 z-50 pointer-events-none"
    : "fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 sm:items-center sm:p-6";

  /** 패널 위치·크기 — 고정 시에만 적용 */
  const panelStyle: CSSProperties | undefined =
    pinned && rect
      ? {
          position: "fixed",
          left: rect.x,
          top: rect.y,
          width: rect.w,
          height: rect.h,
          maxHeight: "none",
          maxWidth: "none",
        }
      : undefined;

  /** 헤더에 펼칠 드래그 이동 props */
  const dragHandleProps = pinned
    ? {
        onPointerDown: onDragStart("move"),
        onPointerMove: onDragMove,
        onPointerUp: onDragEnd,
        style: { cursor: "move", touchAction: "none" } as CSSProperties,
      }
    : {};

  /** 4모퉁이 리사이즈 핸들 — 패널(relative 아님, overflow-hidden 내부) 맨 위에 얹는다 */
  const ResizeHandles = useCallback(() => {
    if (!pinned) return null;
    const corners: { mode: DragMode; cls: string; cursor: string }[] = [
      { mode: "nw", cls: "left-0 top-0", cursor: "nwse-resize" },
      { mode: "ne", cls: "right-0 top-0", cursor: "nesw-resize" },
      { mode: "sw", cls: "left-0 bottom-0", cursor: "nesw-resize" },
      { mode: "se", cls: "right-0 bottom-0", cursor: "nwse-resize" },
    ];
    return (
      <>
        {corners.map((c) => (
          <div
            key={c.mode}
            role="presentation"
            aria-hidden
            onPointerDown={onDragStart(c.mode)}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            className={`absolute z-20 h-4 w-4 ${c.cls}`}
            style={{ cursor: c.cursor, touchAction: "none" }}
          />
        ))}
      </>
    );
  }, [pinned, onDragStart, onDragMove, onDragEnd]);

  /** 헤더용 고정/해제 버튼 */
  const PinButton = useCallback(() => (
    <button
      type="button"
      onClick={togglePin}
      aria-pressed={pinned}
      aria-label={pinned ? "앞면 고정 해제" : "화면 앞에 고정"}
      title={
        pinned
          ? "고정 해제 — 가운데 팝업으로 되돌립니다"
          : "화면 앞에 고정 — 축소된 창으로 떠 있고, 드래그 이동·모퉁이 크기조절이 가능합니다"
      }
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11.5px] font-medium ${
        pinned
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-white text-tertiary hover:text-foreground"
      }`}
    >
      {pinned ? <PinOff size={13} /> : <Pin size={13} />}
      {pinned ? "고정 해제" : "앞면 고정"}
    </button>
  ), [pinned, togglePin]);

  return {
    pinned,
    togglePin,
    overlayClass,
    panelStyle,
    dragHandleProps,
    ResizeHandles,
    PinButton,
  };
}
