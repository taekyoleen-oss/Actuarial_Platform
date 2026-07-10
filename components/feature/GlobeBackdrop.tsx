"use client";

import { useEffect, useRef } from "react";

// 홈 배경 워터마크 — 회전 지구본(세계 보험료 규모 Top10 + 흐름 아크).
// '지구본 워터마크 데모.html'(standalone globe-watermark JS) 이식:
//  1) 대륙 점묘는 world-atlas land-110m TopoJSON을 로컬 번들(/data/land-110m.json)
//  2) 데모 색상(#5C67F2·#FF8C61)은 앱 토큰으로 매핑(--primary/--brand-sky/--chip-amber-fg)
//  3) 구체의 방사 그라데이션은 디자인 비협상(그라데이션 금지)에 따라 플랫 화이트로 대체
//  4) 폰트 무게는 데모 800 → 디자인 규칙(헤딩 600/700)의 700으로 조정
// 홈(/)에서만 사용 — fixed 뷰포트 중앙, 콘텐츠 뒤(-z-10), 클릭 통과.
// 크기·불투명도는 globals.css(.globe-backdrop, --globe-backdrop-opacity)가 전담.

// 세계 보험료 규모 Top10 (데모 원본 데이터 유지 — 단위: USD bn)
const DATA = [
  { size: 3650, lat: 39, lon: -98 }, // 미국
  { size: 810, lat: 35, lon: 104 }, // 중국
  { size: 400, lat: 54, lon: -2 }, // 영국
  { size: 340, lat: 36, lon: 138 }, // 일본
  { size: 290, lat: 46, lon: 2 }, // 프랑스
  { size: 255, lat: 51, lon: 10 }, // 독일
  { size: 195, lat: 36.5, lon: 127.8 }, // 대한민국
  { size: 180, lat: 56, lon: -106 }, // 캐나다
  { size: 170, lat: 42.5, lon: 12.5 }, // 이탈리아
  { size: 145, lat: 21, lon: 78 }, // 인도
];
const MAX = 3650;
const RAD = Math.PI / 180;

const SPEED = 8; // 자동 회전 속도 °/s
const TILT = 20; // 지축 기울기 °
const CENTER_TEXT = "보험료 규모";

// 앱 디자인 토큰 매핑(캔버스는 CSS 변수를 못 읽으므로 hex 상수로 고정)
const PRIMARY = "62,106,225"; // --primary #3e6ae1
const SKY = "74,144,194"; // --brand-sky #4a90c2
const AMBER = "#7d5a14"; // --chip-amber-fg — 흐름 펄스·화살촉(칩 팔레트 강조 스코프)

type Vec3 = [number, number, number];
interface LandRing {
  pts: Array<[number, number]>;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function vec(lat: number, lon: number): Vec3 {
  const p = lat * RAD;
  const l = lon * RAD;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
}

function pointInLand(x: number, y: number, rings: LandRing[]) {
  let inside = false;
  for (const g of rings) {
    if (x < g.minX || x > g.maxX || y < g.minY || y > g.maxY) continue;
    const p = g.pts;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [x1, y1] = p[i];
      const [x2, y2] = p[j];
      if (Math.abs(x1 - x2) > 180) continue;
      if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1)
        inside = !inside;
    }
  }
  return inside;
}

// TopoJSON(land-110m) → 링 목록 → 대륙 점묘 좌표(단위 벡터)
function topoToLandDots(topo: {
  transform: { scale: [number, number]; translate: [number, number] };
  arcs: Array<Array<[number, number]>>;
  objects: { land: { type: string; geometries?: unknown[]; arcs?: unknown } };
}): Vec3[] {
  const sc = topo.transform.scale;
  const tr = topo.transform.translate;
  const arcs = topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sc[0] + tr[0], y * sc[1] + tr[1]] as [number, number];
    });
  });
  const geo = topo.objects.land;
  const geoms = (
    geo.type === "GeometryCollection" ? geo.geometries : [geo]
  ) as Array<{ type: string; arcs: number[][] | number[][][] }>;
  const polys: number[][][] = [];
  for (const g of geoms) {
    if (g.type === "MultiPolygon") polys.push(...(g.arcs as number[][][]));
    else if (g.type === "Polygon") polys.push(g.arcs as number[][]);
  }
  const rings: LandRing[] = [];
  for (const poly of polys) {
    for (const ringArcs of poly) {
      const ring: Array<[number, number]> = [];
      for (const ai of ringArcs) {
        const pts = ai >= 0 ? arcs[ai] : arcs[~ai].slice().reverse();
        for (let k = ring.length ? 1 : 0; k < pts.length; k++) ring.push(pts[k]);
      }
      let minX = 180;
      let maxX = -180;
      let minY = 90;
      let maxY = -90;
      for (const p of ring) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
      }
      rings.push({ pts: ring, minX, maxX, minY, maxY });
    }
  }
  const dots: Vec3[] = [];
  const step = 2.1;
  for (let lat = -88; lat <= 88; lat += step) {
    const lonStep = step / Math.max(0.15, Math.cos(lat * RAD));
    for (let lon = -180; lon < 180; lon += lonStep) {
      if (pointInLand(lon, lat, rings)) dots.push(vec(lat, lon));
    }
  }
  return dots;
}

export function GlobeBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let landDots: Vec3[] | null = null;
    let raf = 0;
    let disposed = false;

    // 투영 상태(프레임마다 갱신)
    let lam = -128;
    let cx = 0;
    let cy = 0;
    let R = 0;
    let cosL = 1;
    let sinL = 0;
    const cosT = Math.cos(TILT * RAD);
    const sinT = Math.sin(TILT * RAD);

    function proj(v: Vec3, alt = 0) {
      const x0 = v[0] * cosL + v[2] * sinL;
      const z0 = v[2] * cosL - v[0] * sinL;
      const y1 = v[1] * cosT - z0 * sinT;
      const z1 = v[1] * sinT + z0 * cosT;
      const k = R * (1 + alt);
      return { x: cx + k * x0, y: cy - k * y1, z: z1 };
    }

    function strokeVisible(pts: Array<{ x: number; y: number; z: number }>) {
      if (!ctx) return;
      let pen = false;
      ctx.beginPath();
      for (const p of pts) {
        if (p.z > 0) {
          if (pen) ctx.lineTo(p.x, p.y);
          else {
            ctx.moveTo(p.x, p.y);
            pen = true;
          }
        } else pen = false;
      }
      ctx.stroke();
    }

    // 대권(great-circle) 보간 — 흐름 아크의 경로점
    function slerpPts(
      A: (typeof DATA)[number],
      B: (typeof DATA)[number],
      n: number
    ) {
      const va = vec(A.lat, A.lon);
      const vb = vec(B.lat, B.lon);
      const dot = Math.max(
        -1,
        Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])
      );
      const om = Math.acos(dot);
      const so = Math.sin(om) || 1e-6;
      const altMax = 0.06 + 0.22 * (om / Math.PI);
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const k1 = Math.sin((1 - t) * om) / so;
        const k2 = Math.sin(t * om) / so;
        pts.push(
          proj(
            [
              va[0] * k1 + vb[0] * k2,
              va[1] * k1 + vb[1] * k2,
              va[2] * k1 + vb[2] * k2,
            ],
            Math.sin(Math.PI * t) * altMax
          )
        );
      }
      return pts;
    }

    // 10위 → 1위 사슬 연결
    const pairs: Array<[(typeof DATA)[number], (typeof DATA)[number]]> = [];
    for (let i = DATA.length - 1; i > 0; i--) pairs.push([DATA[i], DATA[i - 1]]);

    function drawFrame(now: number) {
      if (!ctx || !cv) return;
      const rect = cv.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = rect.height;
      if (cv.width !== Math.round(w * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      cx = w / 2;
      cy = h / 2;
      R = Math.min(w, h) / 2 - 4;
      cosL = Math.cos(lam * RAD);
      sinL = Math.sin(lam * RAD);

      // 구체 — 플랫 화이트(그라데이션 금지) + 옅은 프라이머리 림
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(${PRIMARY},0.18)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 경위선
      ctx.strokeStyle = `rgba(${PRIMARY},0.12)`;
      ctx.lineWidth = 1;
      for (let lon = 0; lon < 360; lon += 20) {
        const pts = [];
        for (let lat = -88; lat <= 88; lat += 4) pts.push(proj(vec(lat, lon)));
        strokeVisible(pts);
      }
      for (let lat = -60; lat <= 60; lat += 20) {
        const pts = [];
        for (let lon = 0; lon <= 360; lon += 4) pts.push(proj(vec(lat, lon)));
        strokeVisible(pts);
      }

      // 대륙 점묘
      if (landDots) {
        const dr = Math.max(1, R * 0.0085);
        ctx.fillStyle = `rgba(${PRIMARY},0.35)`;
        for (const d of landDots) {
          const lp = proj(d);
          if (lp.z > 0.01) {
            ctx.beginPath();
            ctx.arc(lp.x, lp.y, dr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 가운데 문구
      ctx.font = `700 ${Math.round(R * 0.13)}px Pretendard, Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(${PRIMARY},0.3)`;
      ctx.fillText(CENTER_TEXT, cx, cy);

      // 흐름 아크 + 이동 펄스 + 화살촉
      pairs.forEach((pr, pi) => {
        const n = 48;
        const apts = slerpPts(pr[0], pr[1], n);
        const wLine = 1.5 + 4 * Math.sqrt(Math.min(pr[0].size, pr[1].size) / MAX);
        const destRad = 5 + Math.sqrt(pr[1].size / MAX) * 16;
        let tip = n;
        for (let j = n - 1; j > 0; j--) {
          if (
            Math.hypot(apts[j].x - apts[n].x, apts[j].y - apts[n].y) >=
            destRad + 5
          ) {
            tip = j;
            break;
          }
        }
        ctx.strokeStyle = `rgba(${SKY},0.45)`;
        ctx.lineWidth = wLine;
        ctx.lineCap = "round";
        strokeVisible(apts.slice(0, tip + 1));
        if (!reduce) {
          const ph = ((now / 1000) * 0.22 + pi * 0.117) % 1;
          const i0 = Math.floor(Math.max(0, ph - 0.16) * tip);
          const i1 = Math.min(Math.max(i0 + 1, Math.floor(ph * tip)), tip);
          ctx.strokeStyle = AMBER;
          ctx.lineWidth = wLine + 1.2;
          strokeVisible(apts.slice(i0, i1 + 1));
        }
        const pe = apts[tip];
        const pp = apts[Math.max(0, tip - 2)];
        if (pe.z > 0.03 && pp.z > 0) {
          const ang = Math.atan2(pe.y - pp.y, pe.x - pp.x);
          const s = wLine * 2.5 + 10;
          ctx.beginPath();
          ctx.moveTo(pe.x + 3 * Math.cos(ang), pe.y + 3 * Math.sin(ang));
          ctx.lineTo(
            pe.x - s * Math.cos(ang - 0.5),
            pe.y - s * Math.sin(ang - 0.5)
          );
          ctx.lineTo(
            pe.x - s * Math.cos(ang + 0.5),
            pe.y - s * Math.sin(ang + 0.5)
          );
          ctx.closePath();
          ctx.fillStyle = AMBER;
          ctx.fill();
        }
      });

      // 국가 노드 + 순위 숫자
      DATA.forEach((c, ci) => {
        const p = proj(vec(c.lat, c.lon));
        if (p.z <= 0.02) return;
        const rad = 5 + Math.sqrt(c.size / MAX) * 16;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${PRIMARY})`;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = `700 ${Math.max(
          9,
          Math.min(14, Math.round(rad * 0.95))
        )}px Pretendard, Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(ci + 1), p.x, p.y + 0.5);
      });
    }

    // 대륙 데이터 로드(로컬 번들) — 실패해도 지구본 골격은 그려짐
    const abort = new AbortController();
    fetch("/data/land-110m.json", { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((topo) => {
        if (disposed) return;
        landDots = topoToLandDots(topo);
        if (reduce) drawFrame(0);
      })
      .catch(() => {});

    if (reduce) {
      // 모션 최소화: 회전·펄스 없이 정적 1프레임(리사이즈 시 재그림)
      const onResize = () => drawFrame(0);
      drawFrame(0);
      window.addEventListener("resize", onResize);
      return () => {
        disposed = true;
        abort.abort();
        window.removeEventListener("resize", onResize);
      };
    }

    let last = 0;
    const loop = (now: number) => {
      raf = window.requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      lam += SPEED * dt;
      drawFrame(now);
    };
    raf = window.requestAnimationFrame(loop);

    return () => {
      disposed = true;
      abort.abort();
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="globe-backdrop" aria-hidden />;
}
