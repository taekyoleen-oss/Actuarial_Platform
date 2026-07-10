"use client";

import { useEffect, useRef } from "react";
import {
  geoGraticule,
  geoOrthographic,
  geoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryObject } from "topojson-specification";

// 홈 배경 워터마크 — 회전 지구본(세계 보험료 규모 Top10 + 흐름 아크).
// '지구본 워터마크 데모.html'(standalone globe-watermark JS) 이식:
//  1) 대륙은 world-atlas land-110m TopoJSON(로컬 번들 /data/land-110m.json)을
//     d3-geo 정사영(geoOrthographic)으로 **채워진 대륙면 + 해안선**으로 렌더링
//     (2026-07-10 사용자 요청: 점묘 → 진짜 지구본 지도 형태)
//  2) 데모 색상(#5C67F2·#FF8C61)은 앱 토큰으로 매핑(--primary/--brand-sky/--chip-amber-fg)
//  3) 구체의 방사 그라데이션은 디자인 비협상(그라데이션 금지)에 따라 플랫 화이트로 대체
//  4) 폰트 무게는 데모 800 → 디자인 규칙(헤딩 600/700)의 700으로 조정
// 홈(/)에서만 사용 — fixed 뷰포트 중앙, 콘텐츠 뒤(-z-10), 클릭 통과.
// 크기는 globals.css(.globe-backdrop)가, 불투명도는 레이어별 알파(아래 상수)가 전담:
// 구체·경위선·대륙·아크는 연하게(워터마크), 국가명·노드·중앙 문구는 진하게.
// 좌표 규약: 커스텀 proj(lam 회전+TILT 기울기)와 d3의 rotate([lam, -TILT])는
// 동일한 화면 좌표를 만든다(수식 검증) — 노드·아크·라벨이 대륙과 정확히 정합.

// 세계 보험료 규모 Top10 (데모 원본 데이터 유지 — 단위: USD bn, 2024)
const DATA = [
  { name: "미국", size: 3650, lat: 39, lon: -98 },
  { name: "중국", size: 810, lat: 35, lon: 104 },
  { name: "영국", size: 400, lat: 54, lon: -2 },
  { name: "일본", size: 340, lat: 36, lon: 138 },
  { name: "프랑스", size: 290, lat: 46, lon: 2 },
  { name: "독일", size: 255, lat: 51, lon: 10 },
  { name: "대한민국", size: 195, lat: 36.5, lon: 127.8 },
  { name: "캐나다", size: 180, lat: 56, lon: -106 },
  { name: "이탈리아", size: 170, lat: 42.5, lon: 12.5 },
  { name: "인도", size: 145, lat: 21, lon: 78 },
];
const MAX = 3650;
const RAD = Math.PI / 180;

const SPEED = 8; // 자동 회전 속도 °/s
const TILT = 20; // 지축 기울기 °
const CENTER_TEXT = "보험료 규모(2024)";

// 레이어별 워터마크 강도 — CSS opacity 대신 캔버스 globalAlpha로 분리 적용.
const BG_ALPHA = 0.4; // 구체·경위선·대륙면·아크(은은한 배경)
const FG_ALPHA = 0.85; // 국가 노드·국가명·달러 금액(읽히는 전경)
const CENTER_ALPHA = 0.4; // 중앙 문구(2026-07-10 사용자 요청: 더 옅게)

// 앱 디자인 토큰 매핑(캔버스는 CSS 변수를 못 읽으므로 hex 상수로 고정)
const PRIMARY = "62,106,225"; // --primary #3e6ae1
const SKY = "74,144,194"; // --brand-sky #4a90c2
const AMBER = "#7d5a14"; // --chip-amber-fg — 흐름 펄스·화살촉·달러 금액(칩 팔레트 강조 스코프)
const INK = "#171a20"; // --foreground — 국가명
// 중앙 문구 — 블루 계열과 구분되는 앰버 강조(2026-07-10 사용자 요청: 다른 색·더 또렷하게)
const TEXT_COLOR = "#7d5a14"; // --chip-amber-fg (알파는 FG_ALPHA가 전담)
const HALO = "rgba(255,255,255,0.92)"; // 라벨 가독성용 흰 외곽선

// 보험료 규모 달러 표기 — $3.65T / $810B 컴팩트 포맷(입력 단위: USD bn)
const fmtUsd = (bn: number) =>
  bn >= 1000
    ? `$${(bn / 1000).toFixed(2).replace(/\.?0+$/, "")}T`
    : `$${bn}B`;

type Vec3 = [number, number, number];

function vec(lat: number, lon: number): Vec3 {
  const p = lat * RAD;
  const l = lon * RAD;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
}

// d3 geoPath 정적 지오메트리 — 경위선(20° 간격, 기존 점묘 버전과 동일 격자)
const SPHERE = { type: "Sphere" } as GeoPermissibleObjects;
const GRATICULE = geoGraticule().step([20, 20])() as GeoPermissibleObjects;

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

    let land: GeoPermissibleObjects | null = null;
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
      // 구체는 캔버스의 86% — 가장자리 국가명 라벨이 잘리지 않을 여백 확보.
      R = (Math.min(w, h) / 2) * 0.86;
      cosL = Math.cos(lam * RAD);
      sinL = Math.sin(lam * RAD);

      // 배경 레이어(구체·경위선·대륙·아크)는 은은하게.
      ctx.globalAlpha = BG_ALPHA;

      // d3 정사영 — 커스텀 proj와 같은 시점(rotate [lam, -TILT]), 수평선 클리핑 90°
      const projection = geoOrthographic()
        .translate([cx, cy])
        .scale(R)
        .rotate([lam, -TILT])
        .clipAngle(90);
      const geo = geoPath(projection, ctx);

      // 구체(바다) — 플랫 화이트(그라데이션 금지) + 옅은 프라이머리 림
      ctx.beginPath();
      geo(SPHERE);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = `rgba(${PRIMARY},0.18)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 경위선
      ctx.beginPath();
      geo(GRATICULE);
      ctx.strokeStyle = `rgba(${PRIMARY},0.12)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 대륙면 + 해안선 — 실제 지구본 지도 형태
      if (land) {
        ctx.beginPath();
        geo(land);
        ctx.fillStyle = `rgba(${PRIMARY},0.2)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${PRIMARY},0.5)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // 가운데 문구 — 앰버(블루 지구본과 대비), 워터마크답게 옅은 전용 알파
      ctx.globalAlpha = CENTER_ALPHA;
      ctx.font = `700 ${Math.round(R * 0.115)}px Pretendard, Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(CENTER_TEXT, cx, cy);
      ctx.globalAlpha = BG_ALPHA;

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

      // 국가 노드 + 순위 숫자 + 국가명·보험료(달러) 라벨 — 전경 알파로 또렷하게
      ctx.globalAlpha = FG_ALPHA;
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

        // 라벨: "국가명 $금액" — 노드 옆(구체 좌/우측에 따라 안쪽으로), 흰 halo로 가독성
        const labelPx = Math.max(11, Math.round(R * 0.036));
        ctx.font = `700 ${labelPx}px Pretendard, Inter, sans-serif`;
        const nameText = c.name;
        const amtText = fmtUsd(c.size);
        const gap = labelPx * 0.35;
        const nameW = ctx.measureText(nameText).width;
        const amtW = ctx.measureText(amtText).width;
        const totalW = nameW + gap + amtW;
        const startX =
          p.x <= cx ? p.x + rad + 6 : p.x - rad - 6 - totalW;
        ctx.textAlign = "left";
        ctx.lineJoin = "round";
        ctx.lineWidth = 4;
        ctx.strokeStyle = HALO;
        ctx.strokeText(nameText, startX, p.y);
        ctx.fillStyle = INK;
        ctx.fillText(nameText, startX, p.y);
        ctx.strokeText(amtText, startX + nameW + gap, p.y);
        ctx.fillStyle = AMBER;
        ctx.fillText(amtText, startX + nameW + gap, p.y);
      });
      ctx.globalAlpha = 1;
    }

    // 대륙 데이터 로드(로컬 번들) — 실패해도 지구본 골격은 그려짐
    const abort = new AbortController();
    fetch("/data/land-110m.json", { signal: abort.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((topo: Topology) => {
        if (disposed) return;
        land = feature(
          topo,
          topo.objects.land as GeometryObject
        ) as GeoPermissibleObjects;
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
