"use client";

import { useEffect, useRef } from "react";

// 풀링 아이덴트 — "흩어진 위험 → 질서(풀링)" 상시 루프.
// design/idents/tkleen-theory-dictionary-animation.html 시안의 buildPool 로직 이식.
// 색 규칙: 본체 Ink(--foreground 85%), 사고(클레임) 셀은 한 줄(SKY_ROW)만 --brand-sky.
// 시안 사용 규칙: 질서→무질서 역재생 금지, 셀 회전·크기 변화 금지, 페이지당 모션 1개,
// 소형(헤더) 버전은 텍스트 없이 흩어짐→수렴만 순환.

const COLS = 12;
const ROWS = 8;
const CELL = 12;
const GAP = 3;
const SKY_ROW = 3;
const UNIT = CELL + GAP;
const W = COLS * UNIT - GAP;
const H = ROWS * UNIT - GAP;
const BODY_OPACITY = "0.85";

export function PoolIdent({ className = "" }: { className?: string }) {
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    const cells = cellRefs.current;
    const timers = timersRef.current;
    const later = (fn: () => void, ms: number) =>
      timers.push(window.setTimeout(fn, ms));

    const isSky = (i: number) => Math.floor(i / COLS) === SKY_ROW;
    const gridPos = (i: number) => ({
      x: (i % COLS) * UNIT,
      y: Math.floor(i / COLS) * UNIT,
    });

    const showStatic = () =>
      cells.forEach((el, i) => {
        if (!el) return;
        el.style.transition = "none";
        const { x, y } = gridPos(i);
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.opacity = isSky(i) ? "1" : BODY_OPACITY;
      });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      showStatic(); // 수렴 완료 화면 = 정적 패턴 (시안 허용 용법)
      return;
    }

    const scatter = (stagger: number) =>
      cells.forEach((el, i) => {
        if (!el) return;
        const x = Math.random() * (W - CELL);
        const y = Math.random() * (H - CELL);
        el.style.transform = `translate(${x}px, ${y}px)`;
        later(() => {
          el.style.opacity = isSky(i) ? "1" : BODY_OPACITY;
        }, i * stagger);
      });

    const converge = () =>
      cells.forEach((el, i) => {
        if (!el) return;
        const { x, y } = gridPos(i);
        el.style.transform = `translate(${x}px, ${y}px)`;
      });

    const hide = () =>
      cells.forEach((el) => {
        if (el) el.style.opacity = "0";
      });

    // 시안 "사전 페이지 헤더" 변형과 동일한 사이클: 흩어짐(2.6s)→수렴→유지→소등→재시작
    const loop = () => {
      timers.splice(0, timers.length); // 지난 사이클의 만료된 핸들 정리
      scatter(20);
      later(converge, 2600);
      later(() => {
        hide();
        later(loop, 1000);
      }, 6200);
    };
    loop();

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  return (
    <div className={className} aria-hidden="true">
      <div className="relative" style={{ width: W, height: H }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              cellRefs.current[i] = el;
            }}
            className="absolute left-0 top-0"
            style={{
              width: CELL,
              height: CELL,
              opacity: 0,
              backgroundColor:
                Math.floor(i / COLS) === SKY_ROW
                  ? "var(--brand-sky)"
                  : "var(--foreground)",
              transition:
                "transform 1.1s cubic-bezier(.22,.8,.26,1), opacity .45s ease",
              willChange: "transform, opacity",
            }}
          />
        ))}
      </div>
    </div>
  );
}
