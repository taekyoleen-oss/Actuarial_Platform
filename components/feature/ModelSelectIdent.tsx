"use client";

import { useEffect, useRef } from "react";

// 모델선택 아이덴트 — "데이터가 흐르고, 최적의 분류가 선택됩니다"
// design/idents/tkleen-model-selection-animation.html 시안 이식.
// 연출(원본 그대로): 노드 등장 → 연결선 드로잉 → 데이터 펄스 3웨이브 + AUC 카운트업
// → 최고 점수(GBM) 강조·나머지 디밍 → 셀렉터 배지 → 출력 분포 바 → 최적 경로 펄스 루프.
// 색상만 브랜드 토큰 매핑: Ink → --foreground, Sky → --brand-sky, Cream → --page-bg.

const INK = "#171A20";
const SKY = "#4A90C2";
const NS = "http://www.w3.org/2000/svg";

const INPUTS = [
  { id: "in0", label: "연령 · 성별", y: 120 },
  { id: "in1", label: "병력 · BMI", y: 215 },
  { id: "in2", label: "직업 · 운전", y: 310 },
  { id: "in3", label: "계약 정보", y: 405 },
].map((d) => ({ ...d, x: 60, w: 120, h: 46 }));

const MODELS = [
  { id: "m0", label: "GLM", meta: "BASELINE", score: 0.812, y: 95, winner: false },
  { id: "m1", label: "Random Forest", meta: "ENSEMBLE", score: 0.846, y: 200, winner: false },
  { id: "m2", label: "GBM", meta: "BOOSTING", score: 0.873, y: 305, winner: true },
  { id: "m3", label: "Neural Net", meta: "DEEP", score: 0.861, y: 410, winner: false },
].map((d) => ({ ...d, x: 360, w: 170, h: 64 }));

const SELECTOR = { x: 650, y: 230, w: 140, h: 76 };

const OUTPUTS = [
  { id: "o0", label: "우량체", pct: 32, y: 150 },
  { id: "o1", label: "표준체", pct: 51, y: 250 },
  { id: "o2", label: "할증체", pct: 17, y: 350 },
].map((d) => ({ ...d, x: 860, w: 130, h: 52 }));

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1},${y1} C ${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

interface LinkDef {
  id: string;
  d: string;
  toWinner: boolean;
}

const LINKS: LinkDef[] = [
  // 입력 → 모델 (전결합)
  ...INPUTS.flatMap((inp) =>
    MODELS.map((m) => ({
      id: `L-${inp.id}-${m.id}`,
      d: bezier(inp.x + inp.w, inp.y, m.x, m.y),
      toWinner: m.winner,
    }))
  ),
  // 모델 → 셀렉터
  ...MODELS.map((m) => ({
    id: `L-${m.id}-sel`,
    d: bezier(m.x + m.w, m.y, SELECTOR.x, SELECTOR.y),
    toWinner: m.winner,
  })),
  // 셀렉터 → 출력
  ...OUTPUTS.map((o) => ({
    id: `L-sel-${o.id}`,
    d: bezier(SELECTOR.x + SELECTOR.w, SELECTOR.y, o.x, o.y),
    toWinner: true,
  })),
];

const MONO = 'ui-monospace, Consolas, monospace';

export function ModelSelectIdent({ className = "" }: { className?: string }) {
  const elsRef = useRef<Record<string, Element | null>>({});
  const set = (id: string) => (el: Element | null) => {
    elsRef.current[id] = el;
  };

  useEffect(() => {
    const els = elsRef.current;
    const $ = (id: string) => els[id];
    const timers: number[] = [];
    const inner: number[] = [];
    let loopId = 0;
    let alive = true;
    const later = (fn: () => void, ms: number) =>
      timers.push(window.setTimeout(fn, ms));

    const linkEls = LINKS.map((l) => ({ ...l, el: $(l.id) as SVGPathElement | null }));

    function sendPulse(pathEl: SVGPathElement, color: string, dur: number, r = 4) {
      const pulses = $("pulses");
      if (!pulses) return;
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("r", String(r));
      dot.setAttribute("fill", color);
      dot.setAttribute("class", "pulse-dot");
      pulses.appendChild(dot);
      const len = pathEl.getTotalLength();
      const start = performance.now();
      (function frame(now: number) {
        if (!alive) return void dot.remove();
        const u = Math.min((now - start) / dur, 1);
        const pt = pathEl.getPointAtLength(len * u);
        dot.setAttribute("cx", String(pt.x));
        dot.setAttribute("cy", String(pt.y));
        (dot as SVGCircleElement).style.opacity = String(
          u < 0.08 ? u / 0.08 : u > 0.9 ? (1 - u) / 0.1 : 1
        );
        if (u < 1) requestAnimationFrame(frame);
        else dot.remove();
      })(start);
    }

    function countUp(el: Element, target: number, dur: number, prefix: string) {
      const start = performance.now();
      (function frame(now: number) {
        if (!alive) return;
        const u = Math.min((now - start) / dur, 1);
        const e = 1 - Math.pow(1 - u, 3);
        el.textContent = prefix + (target * e).toFixed(3);
        if (u < 1) requestAnimationFrame(frame);
      })(start);
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      [...INPUTS, ...MODELS, { id: "sel" }, ...OUTPUTS].forEach((d) =>
        $("node-" + d.id)?.classList.add("go")
      );
      linkEls.forEach((l) => l.el?.classList.add("go"));
      MODELS.forEach((m) => {
        const s = $("score-" + m.id);
        if (s) s.textContent = "AUC " + m.score.toFixed(3);
        $("node-" + m.id)?.classList.add(m.winner ? "win" : "dim");
      });
      linkEls.forEach((l) =>
        l.el?.classList.add(l.toWinner ? "win-link" : "dim")
      );
      $("selBadge")?.classList.add("go");
      OUTPUTS.forEach((o) => {
        $("bar-" + o.id)?.setAttribute("width", String(((o.w - 24) * o.pct) / 100));
        const p = $("pct-" + o.id) as SVGTextElement | null;
        if (p) p.style.opacity = "1";
      });
      $("principle")?.classList.add("go");
      return;
    }

    // 1) 노드 등장: 입력 → 모델 → 셀렉터 → 출력
    INPUTS.forEach((d, i) =>
      later(() => $("node-" + d.id)?.classList.add("go"), 150 + i * 120)
    );
    MODELS.forEach((d, i) =>
      later(() => $("node-" + d.id)?.classList.add("go"), 700 + i * 120)
    );
    later(() => $("node-sel")?.classList.add("go"), 1250);
    OUTPUTS.forEach((d, i) =>
      later(() => $("node-" + d.id)?.classList.add("go"), 1400 + i * 110)
    );

    // 2) 연결선 드로잉
    linkEls.forEach((l, i) =>
      later(() => l.el?.classList.add("go"), 1700 + (i % 8) * 90)
    );

    // 3) 데이터 펄스 3웨이브 + AUC 카운트업
    const flowStart = 2900;
    for (let wave = 0; wave < 3; wave++) {
      later(() => {
        linkEls
          .filter((l) => l.id.startsWith("L-in"))
          .forEach((l, i) => {
            inner.push(
              window.setTimeout(() => {
                if (l.el) sendPulse(l.el, INK, 800);
              }, (i % 4) * 90 + Math.random() * 120)
            );
          });
      }, flowStart + wave * 700);
    }
    MODELS.forEach((m, i) =>
      later(() => {
        const s = $("score-" + m.id);
        if (s) countUp(s, m.score, 1500, "AUC ");
      }, flowStart + 600 + i * 150)
    );

    // 4) 승자 결정: GBM 강조, 나머지 디밍
    const judge = flowStart + 2700;
    later(() => {
      MODELS.forEach((m) =>
        $("node-" + m.id)?.classList.add(m.winner ? "win" : "dim")
      );
      linkEls.forEach((l) =>
        l.el?.classList.add(l.toWinner ? "win-link" : "dim")
      );
    }, judge);

    // 5) 승자 경로 펄스 → 셀렉터 배지 → 출력 분포
    later(() => {
      const l = linkEls.find((x) => x.id === "L-m2-sel");
      if (l?.el) sendPulse(l.el, SKY, 900, 5);
    }, judge + 400);
    later(() => $("selBadge")?.classList.add("go"), judge + 1200);
    later(() => {
      linkEls
        .filter((l) => l.id.startsWith("L-sel"))
        .forEach((l, i) =>
          inner.push(
            window.setTimeout(() => {
              if (l.el) sendPulse(l.el, SKY, 800, 4.5);
            }, i * 160)
          )
        );
    }, judge + 1500);
    later(() => {
      OUTPUTS.forEach((o) => {
        $("bar-" + o.id)?.setAttribute("width", String(((o.w - 24) * o.pct) / 100));
        const p = $("pct-" + o.id) as SVGTextElement | null;
        if (p) p.style.opacity = "1";
      });
    }, judge + 2200);
    later(() => $("principle")?.classList.add("go"), judge + 2700);

    // 6) 루프: 최적 경로 위로 잔잔한 펄스 반복
    later(() => {
      loopId = window.setInterval(() => {
        linkEls
          .filter((l) => l.id.startsWith("L-in") && l.id.endsWith("-m2"))
          .forEach((l, i) =>
            inner.push(
              window.setTimeout(() => {
                if (l.el) sendPulse(l.el, SKY, 900, 3.5);
              }, i * 110)
            )
          );
        inner.push(
          window.setTimeout(() => {
            const l = linkEls.find((x) => x.id === "L-m2-sel");
            if (l?.el) sendPulse(l.el, SKY, 800, 4);
          }, 750)
        );
        inner.push(
          window.setTimeout(() => {
            linkEls
              .filter((l) => l.id.startsWith("L-sel"))
              .forEach((l, i) =>
                inner.push(
                  window.setTimeout(() => {
                    if (l.el) sendPulse(l.el, SKY, 750, 3.5);
                  }, i * 130)
                )
              );
          }, 1450)
        );
      }, 3200);
    }, judge + 3000);

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      inner.forEach(clearTimeout);
      if (loopId) clearInterval(loopId);
    };
  }, []);

  return (
    <div className={`model-select-ident ${className}`}>
      <svg
        viewBox="0 0 1000 520"
        role="img"
        aria-label="입력 특성 모듈에서 후보 머신러닝 모델 모듈로 데이터 펄스가 흐르고, 평가 점수가 가장 높은 모델의 경로가 강조되며 최종 위험등급 분류가 출력되는 네트워크 애니메이션"
        className="w-full"
      >
        <g>
          {LINKS.map((l) => (
            <path key={l.id} ref={set(l.id)} className="link" d={l.d} />
          ))}
        </g>
        <g>
          {INPUTS.map((d) => (
            <g key={d.id} ref={set("node-" + d.id)} className="node">
              <rect className="box" x={d.x} y={d.y - d.h / 2} width={d.w} height={d.h} rx="10" />
              <text className="title" x={d.x + d.w / 2} y={d.y + 5} textAnchor="middle">
                {d.label}
              </text>
            </g>
          ))}
          {MODELS.map((d) => (
            <g key={d.id} ref={set("node-" + d.id)} className="node">
              <rect className="box" x={d.x} y={d.y - d.h / 2} width={d.w} height={d.h} rx="10" />
              <text className="title" x={d.x + d.w / 2} y={d.y - 4} textAnchor="middle">
                {d.label}
              </text>
              <text className="meta" x={d.x + 12} y={d.y - d.h / 2 + 16}>
                {d.meta}
              </text>
              <text
                className="score"
                ref={set("score-" + d.id)}
                x={d.x + d.w / 2}
                y={d.y + 21}
                textAnchor="middle"
              >
                AUC —
              </text>
            </g>
          ))}
          <g ref={set("node-sel")} className="node">
            <rect
              className="box"
              x={SELECTOR.x}
              y={SELECTOR.y - SELECTOR.h / 2}
              width={SELECTOR.w}
              height={SELECTOR.h}
              rx="10"
            />
            <text
              className="title"
              x={SELECTOR.x + SELECTOR.w / 2}
              y={SELECTOR.y - 4}
              textAnchor="middle"
            >
              모델 선택
            </text>
            <text className="meta" x={SELECTOR.x + 12} y={SELECTOR.y - SELECTOR.h / 2 + 16}>
              ARGMAX AUC
            </text>
            <g ref={set("selBadge")} className="win-badge">
              <rect
                x={SELECTOR.x + 8}
                y={SELECTOR.y + 14}
                width={SELECTOR.w - 16}
                height={20}
                rx="9"
              />
              <text
                x={SELECTOR.x + SELECTOR.w / 2}
                y={SELECTOR.y + 28}
                textAnchor="middle"
              >
                GBM · 0.873
              </text>
            </g>
          </g>
          {OUTPUTS.map((d) => (
            <g key={d.id} ref={set("node-" + d.id)} className="node">
              <rect className="box" x={d.x} y={d.y - d.h / 2} width={d.w} height={d.h} rx="10" />
              <text className="title" x={d.x + d.w / 2} y={d.y + 5} textAnchor="middle">
                {d.label}
              </text>
              <rect
                x={d.x + 12}
                y={d.y + 10}
                width={d.w - 24}
                height={5}
                rx="2.5"
                fill="rgba(23,26,32,0.08)"
              />
              <rect
                ref={set("bar-" + d.id)}
                className="out-bar"
                x={d.x + 12}
                y={d.y + 10}
                width={0}
                height={5}
                rx="2.5"
                fill={SKY}
              />
              <text
                ref={set("pct-" + d.id)}
                x={d.x + d.w - 14}
                y={d.y - 9}
                textAnchor="end"
                style={{
                  fontFamily: MONO,
                  fontSize: "10.5px",
                  fill: SKY,
                  opacity: 0,
                  fontWeight: 500,
                }}
              >
                {d.pct}%
              </text>
            </g>
          ))}
        </g>
        <g ref={set("pulses")} />
      </svg>
      <p className="principle" ref={set("principle")}>
        모든 후보 모듈을 <b>동일한 데이터로 평가</b>하고, 가장 높은 판별력의
        모델만 <b>최종 분류 경로</b>로 채택합니다
      </p>
    </div>
  );
}
