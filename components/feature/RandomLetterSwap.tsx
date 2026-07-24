"use client";

// 호버 시 글자가 위/아래로 랜덤 순서 교차되는 텍스트 이펙트(Originkit random-letter-swap 이식).
// 색상·폰트는 부모(.nav-pill 등)에서 상속 — 여기서 강제하지 않음.
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimate, type AnimationOptions } from "framer-motion";

type Props = {
  label: string;
  className?: string;
  staggerDuration?: number;
  ease?: AnimationOptions;
};

const DEFAULT_EASE: AnimationOptions = { type: "spring", duration: 0.45, bounce: 0.15 };

export function RandomLetterSwap({
  label,
  className,
  staggerDuration = 0.035,
  ease,
}: Props) {
  const [scope, animate] = useAnimate();
  const transition = useMemo(() => ease ?? DEFAULT_EASE, [ease]);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  const shuffle = (arr: number[]) => [...arr].sort(() => Math.random() - 0.5);
  const withDelay = (i: number): AnimationOptions => ({
    ...transition,
    delay: i * staggerDuration,
  });

  // 디바운스(leading+trailing 100ms) — 빠른 반복 호버에도 최종 상태가 정확히 수렴.
  const timers = useRef<{
    start: ReturnType<typeof setTimeout> | null;
    startTrailing: boolean;
    end: ReturnType<typeof setTimeout> | null;
    endTrailing: boolean;
  }>({ start: null, startTrailing: false, end: null, endTrailing: false });

  const runStart = () => {
    if (reducedMotionRef.current) return;
    const idxs: number[] = [];
    for (let k = 0; k < label.length; k++) if (label[k] !== " ") idxs.push(k);
    const order = shuffle(idxs);
    order.forEach((idx, i) => {
      animate(`.letter-${idx}`, { y: "-100%" }, withDelay(i));
      animate(`.letter-secondary-${idx}`, { top: "0%" }, withDelay(i));
    });
  };

  const runEnd = () => {
    if (reducedMotionRef.current) return;
    const idxs: number[] = [];
    for (let k = 0; k < label.length; k++) if (label[k] !== " ") idxs.push(k);
    const order = shuffle(idxs);
    order.forEach((idx, i) => {
      animate(`.letter-${idx}`, { y: 0 }, withDelay(i));
      animate(`.letter-secondary-${idx}`, { top: "100%" }, withDelay(i));
    });
  };

  const onMouseEnter = () => {
    const t = timers.current;
    if (!t.start) {
      runStart();
      t.start = setTimeout(() => {
        if (t.startTrailing) runStart();
        t.startTrailing = false;
        t.start = null;
      }, 100);
    } else {
      t.startTrailing = true;
    }
  };

  const onMouseLeave = () => {
    const t = timers.current;
    if (!t.end) {
      runEnd();
      t.end = setTimeout(() => {
        if (t.endTrailing) runEnd();
        t.endTrailing = false;
        t.end = null;
      }, 100);
    } else {
      t.endTrailing = true;
    }
  };

  useEffect(() => {
    const t = timers.current;
    return () => {
      if (t.start) clearTimeout(t.start);
      if (t.end) clearTimeout(t.end);
    };
  }, []);

  const letters = label.split("");
  if (letters.length === 0) return null;

  return (
    <span
      ref={scope}
      className={className}
      style={{ position: "relative", display: "inline-flex", overflow: "hidden" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="sr-only">{label}</span>
      {letters.map((letter, i) => (
        <span
          key={i}
          aria-hidden
          style={{ whiteSpace: "pre", position: "relative", display: "flex" }}
        >
          <motion.span className={`letter-${i}`} style={{ position: "relative", top: 0 }}>
            {letter}
          </motion.span>
          <motion.span
            className={`letter-secondary-${i}`}
            style={{ position: "absolute", left: 0, right: 0, top: "100%" }}
          >
            {letter}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
