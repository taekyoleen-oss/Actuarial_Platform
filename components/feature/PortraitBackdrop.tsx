"use client";

import { useEffect, useRef } from "react";

// 만든이(/about) 배경 워터마크 — 초상 캐리커처 모자이크 순환.
// '초상_워터마크_모자이크.html'(standalone canvas JS) 이식:
//  1) 6장(원본→연필→수채화→선셋→셀→팝아트)을 hold 후 모자이크 타일
//     시차 전환(타일별 랜덤 딜레이 + 평균색 블록 플래시)으로 순환
//  2) 내장 base64 이미지는 public/about/portrait/*.jpg로 추출해 로드
//  3) 크기는 데모 min(70vmin,520px) → min(50vmin,380px) 축소
//     (2026-07-12 사용자 요청: 웹페이지에 맞게, 너무 크지 않게)
//  4) reduced-motion은 프로젝트 컨벤션(GlobeBackdrop과 동일)대로
//     정적 1프레임(원본)만 표시 — 데모의 크로스페이드 폴백 대신
//  5) 프레임별 얼굴 정렬(2026-07-12 사용자 요청: 머리 끝 위치 통일) —
//     원본들의 프레이밍이 제각각(머리 끝 y 1.5%~17.6%)이라 단순 cover로는
//     전환 시 얼굴이 튐. 프레임별 앵커(top: 머리 끝, chin: 턱, cx: 얼굴
//     중심)를 측정해 모든 프레임에서 머리 끝→TOP_T, 턱→CHIN_T에 오도록
//     소스 사각형을 계산(위치+스케일 동시 정규화).
// 만든이(/about)에서만 사용 — fixed 뷰포트 중앙, 콘텐츠 뒤(-z-10), 클릭 통과.
// 크기·불투명도(0.16)는 globals.css(.portrait-backdrop)가 전담.

// top/chin은 이미지 높이 비율, cx는 너비 비율 — 픽셀 스캔(머리카락 명도)
// + 시각 검증으로 측정한 값. 이미지를 교체하면 재측정 필요.
const FRAMES = [
  { src: "/about/portrait/01-original.jpg", top: 0.1756, chin: 0.8, cx: 0.52 },
  { src: "/about/portrait/02-pencil.jpg", top: 0.0659, chin: 0.677, cx: 0.505 },
  { src: "/about/portrait/03-watercolor.jpg", top: 0.1293, chin: 0.732, cx: 0.51 },
  { src: "/about/portrait/04-sunset.jpg", top: 0.0537, chin: 0.745, cx: 0.5 },
  { src: "/about/portrait/05-cel.jpg", top: 0.0244, chin: 0.72, cx: 0.51 },
  { src: "/about/portrait/06-popart.jpg", top: 0.0146, chin: 0.685, cx: 0.5 },
];

// 정렬 목표 — 캔버스 높이 기준 머리 끝/턱 위치(전 프레임 공통)
const TOP_T = 0.02;
const CHIN_T = 0.77;

// 애니메이션 조정 상수 (데모 원본 값 유지)
const CONFIG = {
  hold: 2600, // 각 이미지 유지 시간(ms)
  fade: 2000, // 모자이크 전환 시간(ms)
  cols: 26, // 모자이크 가로 타일 수
  rows: 32, // 모자이크 세로 타일 수
  stagger: 0.5, // 타일 시차 비율(0~0.8, 클수록 흩어지듯 전환)
  flash: 0.9, // 모자이크 블록 최대 불투명도
};

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function PortraitBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let disposed = false;
    let raf = 0;
    let W = 0;
    let H = 0;
    let tileW = 0;
    let tileH = 0;

    const imgs: HTMLImageElement[] = [];
    const avgs: Uint8ClampedArray[] = [];

    function resize() {
      if (!cv) return;
      const r = cv.getBoundingClientRect();
      W = Math.round(r.width * DPR);
      H = Math.round(r.height * DPR);
      cv.width = W;
      cv.height = H;
      tileW = W / CONFIG.cols;
      tileH = H / CONFIG.rows;
    }

    // 프레임 i의 얼굴 정렬 소스 사각형 — 머리 끝이 캔버스 TOP_T, 턱이
    // CHIN_T에 오도록 오프셋+스케일을 정규화(cover 대체). 이미지 경계는
    // 클램프(측정 오차 ≤1%p 허용).
    function alignRect(i: number): [number, number, number, number] {
      const f = FRAMES[i];
      const im = imgs[i];
      const iw = im.width;
      const ih = im.height;
      const sh = ((f.chin - f.top) / (CHIN_T - TOP_T)) * ih;
      const sw = sh * (W / H);
      let sy = f.top * ih - TOP_T * sh;
      let sx = f.cx * iw - sw / 2;
      sy = Math.max(0, Math.min(ih - sh, sy));
      sx = Math.max(0, Math.min(iw - sw, sx));
      return [sx, sy, sw, sh];
    }

    // 타일 평균색 사전 계산 — 전환 중 블록 플래시 색상
    function computeAvgs() {
      const oc = document.createElement("canvas");
      oc.width = CONFIG.cols;
      oc.height = CONFIG.rows;
      const octx = oc.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      avgs.length = 0;
      for (let i = 0; i < imgs.length; i++) {
        const [sx, sy, sw, sh] = alignRect(i);
        octx.drawImage(imgs[i], sx, sy, sw, sh, 0, 0, CONFIG.cols, CONFIG.rows);
        avgs.push(
          octx.getImageData(0, 0, CONFIG.cols, CONFIG.rows).data
        );
      }
    }

    function drawImageAligned(i: number, alpha = 1) {
      if (!ctx) return;
      const [sx, sy, sw, sh] = alignRect(i);
      ctx.globalAlpha = alpha;
      ctx.drawImage(imgs[i], sx, sy, sw, sh, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    function drawStatic(i: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      drawImageAligned(i);
    }

    // 타일별 랜덤 시차 (전환마다 재생성)
    let delays: number[] = [];
    function shuffleDelays() {
      delays = Array.from(
        { length: CONFIG.cols * CONFIG.rows },
        () => Math.random() * CONFIG.stagger
      );
    }

    let idx = 0;
    let next = 1;
    let phase: "hold" | "trans" = "hold";
    let tStart = 0;

    function renderTransition(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      drawImageAligned(idx); // 바닥: 현재 이미지

      const a = avgs[idx];
      const b = avgs[next];
      const span = 1 - CONFIG.stagger;
      const [sx, sy, sw, sh] = alignRect(next);
      const su = sw / W; // 캔버스→소스 스케일
      const sv = sh / H;

      for (let r = 0; r < CONFIG.rows; r++) {
        for (let c = 0; c < CONFIG.cols; c++) {
          const k = r * CONFIG.cols + c;
          const p = Math.max(0, Math.min(1, (t - delays[k]) / span));
          if (p <= 0) continue;
          const e = ease(p);
          const x = c * tileW;
          const y = r * tileH;

          // 다음 이미지 타일 페이드인
          ctx.globalAlpha = e;
          ctx.drawImage(
            imgs[next],
            sx + x * su,
            sy + y * sv,
            tileW * su,
            tileH * sv,
            x,
            y,
            tileW + 1,
            tileH + 1
          );

          // 모자이크 블록: 현재→다음 평균색 보간, 중간에 최대
          const flash = Math.sin(p * Math.PI) * CONFIG.flash;
          if (flash > 0.01 && a && b) {
            const i4 = k * 4;
            const cr_ = Math.round(a[i4] + (b[i4] - a[i4]) * e);
            const cg = Math.round(a[i4 + 1] + (b[i4 + 1] - a[i4 + 1]) * e);
            const cb = Math.round(a[i4 + 2] + (b[i4 + 2] - a[i4 + 2]) * e);
            ctx.globalAlpha = flash;
            ctx.fillStyle = `rgb(${cr_},${cg},${cb})`;
            ctx.fillRect(x, y, tileW + 1, tileH + 1);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    function frame(now: number) {
      if (disposed) return;
      if (phase === "hold") {
        if (now - tStart >= CONFIG.hold) {
          phase = "trans";
          tStart = now;
          shuffleDelays();
        }
      } else {
        const t = Math.min((now - tStart) / CONFIG.fade, 1);
        renderTransition(t);
        if (t >= 1) {
          idx = next;
          next = (next + 1) % FRAMES.length;
          phase = "hold";
          tStart = now;
          drawStatic(idx);
        }
      }
      raf = window.requestAnimationFrame(frame);
    }

    const onResize = () => {
      resize();
      drawStatic(idx);
    };

    // 이미지 6장 로드 완료 후 시작 — 실패(부분 로드) 시 그리지 않음
    let loadedCount = 0;
    for (const f of FRAMES) {
      const im = new Image();
      im.onload = () => {
        loadedCount += 1;
        if (disposed || loadedCount !== FRAMES.length) return;
        resize();
        computeAvgs();
        drawStatic(0);
        window.addEventListener("resize", onResize);
        if (!reduce) {
          // 모션 최소화 시 정적 1프레임(원본)만 — 순환·플래시 없음
          tStart = performance.now();
          raf = window.requestAnimationFrame(frame);
        }
      };
      im.src = f.src;
      imgs.push(im);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="portrait-backdrop" aria-hidden />;
}
