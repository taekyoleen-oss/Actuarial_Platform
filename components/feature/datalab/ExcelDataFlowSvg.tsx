/**
 * 엑셀 데이터가공·동적배열 함수의 '입력 → 출력' 변화를 SVG 도식으로 보여준다
 * (사용자 요청 2026-07-23). 표(그리드)가 함수로 어떻게 바뀌는지 한눈에 이해하게 한다.
 * 두 함수를 함께 설명하는 카드(VSTACK·HSTACK 등)는 좌·우에 이름 순서대로 각각 도식을 표시.
 */
import type { ReactNode } from "react";
import type { ExcelFunction } from "@/lib/excelFunctions";

const CW = 18;
const CH = 14;
const CI = "#EEF2F7"; // 입력 셀
const CB = "#CBD5E1"; // 셀 테두리
const CO = "rgba(62,106,225,0.18)"; // 출력·강조 셀
const COB = "#3E6AE1"; // 출력 테두리
const INK = "#334155";
const MUTE = "#94A3B8";

type Kind = "in" | "out" | "pad";
type C = Kind | { t: Kind; v?: string } | null;

/** 셀 그리드 — m[row][col]. cw/ch로 셀 크기 조정(좁은 쌍 도식은 작게). */
function Grid({
  x,
  y,
  m,
  cw = CW,
  ch = CH,
}: {
  x: number;
  y: number;
  m: C[][];
  cw?: number;
  ch?: number;
}) {
  const els: ReactNode[] = [];
  m.forEach((row, r) =>
    row.forEach((c, ci) => {
      if (c == null) return;
      const t = typeof c === "string" ? c : c.t;
      const v = typeof c === "string" ? undefined : c.v;
      const cx = x + ci * cw;
      const cy = y + r * ch;
      els.push(
        <rect
          key={`c${r}-${ci}`}
          x={cx}
          y={cy}
          width={cw}
          height={ch}
          fill={t === "out" ? CO : t === "pad" ? "white" : CI}
          stroke={t === "out" ? COB : CB}
          strokeWidth={t === "pad" ? 0.8 : 1}
          strokeDasharray={t === "pad" ? "2 2" : undefined}
        />
      );
      if (v)
        els.push(
          <text
            key={`v${r}-${ci}`}
            x={cx + cw / 2}
            y={cy + ch / 2 + 3}
            fontSize={cw >= 16 ? 8.5 : 7.5}
            textAnchor="middle"
            fill={INK}
          >
            {v}
          </text>
        );
    })
  );
  return <>{els}</>;
}

/** 넓은 한 칸(가로 span) — TEXTSPLIT 입력·TEXTJOIN 출력처럼 */
function WideCell({ x, y, span, v }: { x: number; y: number; span: number; v: string }) {
  return (
    <>
      <rect x={x} y={y} width={CW * span} height={CH} fill={CI} stroke={CB} />
      <text x={x + (CW * span) / 2} y={y + CH / 2 + 3} fontSize={8.5} textAnchor="middle" fill={INK}>
        {v}
      </text>
    </>
  );
}

/** 단일 도식용 화살표(넓은 300 뷰박스) */
function Arrow({ label }: { label?: string }) {
  return (
    <>
      <line x1={122} y1={48} x2={158} y2={48} stroke={MUTE} strokeWidth={1.5} />
      <path d="M158 48 l-7 -4 v8 z" fill={MUTE} />
      {label ? (
        <text x={140} y={40} fontSize={8.5} textAnchor="middle" fill={MUTE}>
          {label}
        </text>
      ) : null}
    </>
  );
}

/** 쌍 도식용 짧은 화살표 */
function MiniArrow({ x, label }: { x: number; label?: string }) {
  const x2 = x + 22;
  return (
    <>
      <line x1={x} y1={48} x2={x2} y2={48} stroke={MUTE} strokeWidth={1.4} />
      <path d={`M${x2} 48 l-6 -3.5 v7 z`} fill={MUTE} />
      {label ? (
        <text x={x + 11} y={41} fontSize={7.5} textAnchor="middle" fill={MUTE}>
          {label}
        </text>
      ) : null}
    </>
  );
}

function Caption({ label, x }: { label: string; x: number }) {
  return (
    <text x={x} y={92} fontSize={9} textAnchor="middle" fill={MUTE}>
      {label}
    </text>
  );
}

const grid = (rows: number, cols: number, k: Kind): C[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => k));

/* ───────── 두 함수를 함께 설명하는 카드 — 좌·우 각각 도식(이름 순서) ───────── */
type Pair = [{ name: string; body: ReactNode }, { name: string; body: ReactNode }];

const P = { cw: 13, ch: 11 }; // 쌍 도식 셀 크기

const PAIRS: Record<string, Pair> = {
  vstack: [
    {
      name: "VSTACK (세로)",
      body: (
        <>
          <Grid x={14} y={8} m={grid(2, 2, "in")} {...P} />
          <Grid x={14} y={40} m={grid(2, 2, "in")} {...P} />
          <MiniArrow x={46} label="세로" />
          <Grid x={80} y={12} m={grid(4, 2, "out")} {...P} />
        </>
      ),
    },
    {
      name: "HSTACK (가로)",
      body: (
        <>
          <Grid x={14} y={8} m={grid(2, 2, "in")} {...P} />
          <Grid x={14} y={40} m={grid(2, 2, "in")} {...P} />
          <MiniArrow x={46} label="가로" />
          <Grid x={80} y={30} m={grid(2, 4, "out")} {...P} />
        </>
      ),
    },
  ],
  chooserows: [
    {
      name: "CHOOSEROWS (행)",
      body: (() => {
        const inM = grid(4, 3, "in");
        inM[0] = ["out", "out", "out"];
        inM[2] = ["out", "out", "out"];
        return (
          <>
            <Grid x={8} y={12} m={inM} {...P} />
            <MiniArrow x={54} label="행 선택" />
            <Grid x={92} y={23} m={grid(2, 3, "out")} {...P} />
          </>
        );
      })(),
    },
    {
      name: "CHOOSECOLS (열)",
      body: (() => {
        const inM: C[][] = grid(4, 3, "in").map(() => ["out", "in", "out"]);
        return (
          <>
            <Grid x={8} y={12} m={inM} {...P} />
            <MiniArrow x={54} label="열 선택" />
            <Grid x={94} y={12} m={grid(4, 2, "out")} {...P} />
          </>
        );
      })(),
    },
  ],
  take: [
    {
      name: "TAKE (앞/뒤 N)",
      body: (() => {
        const inM = grid(5, 2, "in");
        inM[0] = ["out", "out"];
        inM[1] = ["out", "out"];
        return (
          <>
            <Grid x={14} y={4} m={inM} {...P} />
            <MiniArrow x={46} label="앞 2행" />
            <Grid x={84} y={20} m={grid(2, 2, "out")} {...P} />
          </>
        );
      })(),
    },
    {
      name: "DROP (제거)",
      body: (() => {
        const inM = grid(5, 2, "in");
        inM[0] = ["pad", "pad"];
        inM[1] = ["pad", "pad"];
        return (
          <>
            <Grid x={14} y={4} m={inM} {...P} />
            <MiniArrow x={46} label="앞 2 버림" />
            <Grid x={84} y={15} m={grid(3, 2, "out")} {...P} />
          </>
        );
      })(),
    },
  ],
  sort: [
    {
      name: "SORT (값 기준)",
      body: (
        <>
          <Grid
            x={44}
            y={14}
            m={[[{ t: "in", v: "3" }], [{ t: "in", v: "1" }], [{ t: "in", v: "2" }]]}
            cw={16}
            ch={13}
          />
          <MiniArrow x={78} label="값↑" />
          <Grid
            x={116}
            y={14}
            m={[[{ t: "out", v: "1" }], [{ t: "out", v: "2" }], [{ t: "out", v: "3" }]]}
            cw={16}
            ch={13}
          />
        </>
      ),
    },
    {
      name: "SORTBY (다른 열 기준)",
      body: (
        <>
          <text x={40} y={13} fontSize={7.5} textAnchor="middle" fill={MUTE}>
            값·키
          </text>
          <Grid
            x={22}
            y={16}
            m={[
              [{ t: "in", v: "A" }, { t: "in", v: "3" }],
              [{ t: "in", v: "B" }, { t: "in", v: "1" }],
              [{ t: "in", v: "C" }, { t: "in", v: "2" }],
            ]}
            cw={16}
            ch={13}
          />
          <MiniArrow x={72} label="키↑" />
          <Grid
            x={116}
            y={16}
            m={[[{ t: "out", v: "B" }], [{ t: "out", v: "C" }], [{ t: "out", v: "A" }]]}
            cw={16}
            ch={13}
          />
        </>
      ),
    },
  ],
  tocol: [
    {
      name: "TOCOL (한 열로)",
      body: (
        <>
          <Grid x={20} y={20} m={grid(2, 3, "in")} {...P} />
          <MiniArrow x={70} label="한 열" />
          <Grid x={112} y={2} m={grid(6, 1, "out")} {...P} />
        </>
      ),
    },
    {
      name: "TOROW (한 행으로)",
      body: (
        <>
          <Grid x={12} y={26} m={grid(2, 3, "in")} {...P} />
          <MiniArrow x={62} label="한 행" />
          <Grid x={96} y={42} m={grid(1, 6, "out")} {...P} />
        </>
      ),
    },
  ],
  "byrow-bycol": [
    {
      name: "BYROW (행별)",
      body: (
        <>
          <Grid x={12} y={13} m={grid(3, 3, "in")} {...P} />
          <MiniArrow x={58} label="행별" />
          <Grid x={100} y={15} m={grid(3, 1, "out")} cw={14} ch={11} />
        </>
      ),
    },
    {
      name: "BYCOL (열별)",
      body: (
        <>
          <Grid x={12} y={13} m={grid(3, 3, "in")} {...P} />
          <MiniArrow x={58} label="열별" />
          <Grid x={90} y={26} m={grid(1, 3, "out")} {...P} />
        </>
      ),
    },
  ],
};

/* ───────── 단일 함수 도식(넓은 300 뷰박스) ───────── */
function Diagram({ id }: { id: string }): ReactNode {
  switch (id) {
    case "filter": {
      const inM: C[][] = grid(5, 2, "in");
      inM[1] = ["out", "out"];
      inM[3] = ["out", "out"];
      return (
        <>
          <Grid x={22} y={12} m={inM} />
          <Arrow label="조건 참" />
          <Grid x={188} y={26} m={grid(2, 2, "out")} />
          <Caption label="원본(5행)" x={40} />
          <Caption label="맞는 행만" x={206} />
        </>
      );
    }
    case "unique": {
      const inM: C[][] = ["A", "B", "A", "C", "B"].map((v) => [{ t: "in" as Kind, v }]);
      const outM: C[][] = ["A", "B", "C"].map((v) => [{ t: "out" as Kind, v }]);
      return (
        <>
          <Grid x={44} y={12} m={inM} />
          <Arrow label="중복 제거" />
          <Grid x={210} y={26} m={outM} />
          <Caption label="중복 포함" x={53} />
          <Caption label="고유값" x={219} />
        </>
      );
    }
    case "transpose": {
      return (
        <>
          <Grid x={30} y={20} m={grid(2, 3, "in")} />
          <Arrow label="행↔열" />
          <Grid x={196} y={12} m={grid(3, 2, "out")} />
          <Caption label="2행 × 3열" x={57} />
          <Caption label="3행 × 2열" x={214} />
        </>
      );
    }
    case "textsplit": {
      return (
        <>
          <WideCell x={14} y={38} span={4} v="a,b,c" />
          <Arrow label="구분자로" />
          <Grid x={172} y={38} m={[[{ t: "out", v: "a" }, { t: "out", v: "b" }, { t: "out", v: "c" }]]} />
          <Caption label="한 셀 텍스트" x={50} />
          <Caption label="여러 열로 분리" x={205} />
        </>
      );
    }
    case "textjoin": {
      return (
        <>
          <Grid x={24} y={38} m={[[{ t: "in", v: "a" }, { t: "in", v: "b" }, { t: "in", v: "c" }]]} />
          <Arrow label="이어붙임" />
          <WideCell x={182} y={38} span={4} v="a-b-c" />
          <Caption label="여러 셀" x={51} />
          <Caption label="한 문자열" x={218} />
        </>
      );
    }
    case "groupby": {
      const inM: C[][] = [
        [{ t: "in", v: "A" }, { t: "in", v: "2" }],
        [{ t: "in", v: "B" }, { t: "in", v: "5" }],
        [{ t: "in", v: "A" }, { t: "in", v: "3" }],
        [{ t: "in", v: "B" }, { t: "in", v: "1" }],
      ];
      const outM: C[][] = [
        [{ t: "out", v: "A" }, { t: "out", v: "5" }],
        [{ t: "out", v: "B" }, { t: "out", v: "6" }],
      ];
      return (
        <>
          <Grid x={30} y={16} m={inM} />
          <Arrow label="그룹 합계" />
          <Grid x={196} y={30} m={outM} />
          <Caption label="원자료(그룹·값)" x={48} />
          <Caption label="그룹별 집계" x={214} />
        </>
      );
    }
    case "pivotby": {
      return (
        <>
          <Grid x={22} y={18} m={grid(4, 3, "in")} />
          <Arrow label="교차집계" />
          <Grid x={196} y={26} m={grid(2, 2, "out")} />
          <Caption label="원자료(행·열·값)" x={49} />
          <Caption label="행×열 피벗" x={214} />
        </>
      );
    }
    case "sequence": {
      const outM: C[][] = [
        [{ t: "out", v: "1" }, { t: "out", v: "2" }, { t: "out", v: "3" }],
        [{ t: "out", v: "4" }, { t: "out", v: "5" }, { t: "out", v: "6" }],
        [{ t: "out", v: "7" }, { t: "out", v: "8" }, { t: "out", v: "9" }],
      ];
      return (
        <>
          <rect x={24} y={38} width={70} height={16} rx={8} fill={CI} stroke={CB} />
          <text x={59} y={49} fontSize={8.5} textAnchor="middle" fill={INK}>
            행=3, 열=3
          </text>
          <Arrow label="번호 생성" />
          <Grid x={196} y={20} m={outM} />
          <Caption label="개수·시작값" x={59} />
          <Caption label="연속 번호 배열" x={214} />
        </>
      );
    }
    case "expand": {
      const outM: C[][] = [
        [{ t: "out", v: "" }, { t: "out", v: "" }, { t: "pad", v: "0" }],
        [{ t: "out", v: "" }, { t: "out", v: "" }, { t: "pad", v: "0" }],
        [{ t: "pad", v: "0" }, { t: "pad", v: "0" }, { t: "pad", v: "0" }],
      ];
      return (
        <>
          <Grid x={40} y={22} m={grid(2, 2, "in")} />
          <Arrow label="크기 확장" />
          <Grid x={200} y={16} m={outM} />
          <Caption label="2행 × 2열" x={58} />
          <Caption label="채움값(0)으로 확장" x={218} />
        </>
      );
    }
    default:
      return null;
  }
}

/** 이 함수에 입력→출력 도식이 있는가 */
export function hasDataFlow(id: string): boolean {
  return !!PAIRS[id] || Diagram({ id }) !== null;
}

/** FunctionDialog 상단 — 데이터 변화(입력→출력) 도식. 쌍이면 좌·우 2개, 아니면 1개. */
export function ExcelDataFlow({ fn }: { fn: ExcelFunction }) {
  const pair = PAIRS[fn.id];
  if (pair) {
    return (
      <div className="mb-4 rounded-cover border border-border bg-surface/50 px-3 py-2.5">
        <p className="mb-1.5 text-[11.5px] font-semibold text-foreground">
          데이터 변화 — 입력 → 출력{" "}
          <span className="font-normal text-tertiary">
            (좌: {pair[0].name.split(" ")[0]} · 우: {pair[1].name.split(" ")[0]})
          </span>
        </p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {pair.map((p, i) => (
            <div key={i} className="rounded border border-border bg-white/70 px-2 py-1.5">
              <p className="mb-0.5 text-center text-[11px] font-semibold" style={{ color: COB }}>
                {p.name}
              </p>
              <svg
                viewBox="0 0 190 96"
                width="100%"
                role="img"
                aria-label={`${p.name} 입력→출력`}
                style={{ maxWidth: 260, height: "auto" }}
              >
                {p.body}
              </svg>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const body = Diagram({ id: fn.id });
  if (!body) return null;
  return (
    <div className="mb-4 rounded-cover border border-border bg-surface/50 px-3 py-2.5">
      <p className="mb-1 text-[11.5px] font-semibold text-foreground">
        데이터 변화 — 입력 → 출력
      </p>
      <svg
        viewBox="0 0 300 100"
        width="100%"
        role="img"
        aria-label="입력 데이터가 출력으로 바뀌는 형태"
        style={{ maxWidth: 320, height: "auto" }}
      >
        {body}
      </svg>
    </div>
  );
}
