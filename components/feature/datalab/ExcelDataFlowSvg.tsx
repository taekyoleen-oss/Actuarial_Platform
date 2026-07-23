/**
 * 엑셀 데이터가공·동적배열 함수의 '입력 → 출력' 변화를 SVG 도식으로 보여준다
 * (사용자 요청 2026-07-23). 표(그리드)가 함수로 어떻게 바뀌는지 한눈에 이해하게 한다.
 * 데이터 관련 함수(shape 카테고리 등)에만 적용 — FunctionDialog 상단에서 렌더.
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

/** 셀 그리드 — m[row][col] */
function Grid({ x, y, m }: { x: number; y: number; m: C[][] }) {
  const els: ReactNode[] = [];
  m.forEach((row, r) =>
    row.forEach((c, ci) => {
      if (c == null) return;
      const t = typeof c === "string" ? c : c.t;
      const v = typeof c === "string" ? undefined : c.v;
      const cx = x + ci * CW;
      const cy = y + r * CH;
      els.push(
        <rect
          key={`c${r}-${ci}`}
          x={cx}
          y={cy}
          width={CW}
          height={CH}
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
            x={cx + CW / 2}
            y={cy + CH / 2 + 3}
            fontSize={8.5}
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

/** 한 칸(가로 span) — TEXTSPLIT 입력·TEXTJOIN 출력처럼 넓은 셀 */
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

function Caption({ label, x }: { label: string; x: number }) {
  return (
    <text x={x} y={92} fontSize={9} textAnchor="middle" fill={MUTE}>
      {label}
    </text>
  );
}

const grid = (rows: number, cols: number, k: Kind): C[][] =>
  Array.from({ length: rows }, () => Array.from({ length: cols }, () => k));

/** 함수 id → 입력/출력 도식. 없으면 null(도식 미표시). */
function Diagram({ id }: { id: string }): ReactNode {
  switch (id) {
    case "filter": {
      // 5행 표 → 조건 맞는 2행만
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
    case "sort": {
      const inM: C[][] = [["3"], ["1"], ["4"], ["2"]].map((r) => [{ t: "in" as Kind, v: r[0] }]);
      const outM: C[][] = [["1"], ["2"], ["3"], ["4"]].map((r) => [{ t: "out" as Kind, v: r[0] }]);
      return (
        <>
          <Grid x={44} y={18} m={inM} />
          <Arrow label="정렬" />
          <Grid x={210} y={18} m={outM} />
          <Caption label="뒤섞인 값" x={53} />
          <Caption label="오름차순" x={219} />
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
    case "vstack": {
      // A(2×2) + B(2×2) → 위아래로 쌓기(4×2)
      return (
        <>
          <Grid x={22} y={8} m={grid(2, 2, "in")} />
          <Grid x={22} y={44} m={grid(2, 2, "in")} />
          <Arrow label="세로로 쌓기" />
          <Grid x={188} y={12} m={grid(4, 2, "out")} />
          <Caption label="표 A · 표 B" x={40} />
          <Caption label="VSTACK(위아래)·HSTACK(좌우)" x={206} />
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
    case "take": {
      const inM: C[][] = grid(5, 2, "in");
      inM[0] = ["out", "out"];
      inM[1] = ["out", "out"];
      return (
        <>
          <Grid x={22} y={12} m={inM} />
          <Arrow label="앞/뒤 N행" />
          <Grid x={188} y={26} m={grid(2, 2, "out")} />
          <Caption label="원본(5행)" x={40} />
          <Caption label="TAKE 앞 2 / DROP" x={206} />
        </>
      );
    }
    case "chooserows": {
      const inM: C[][] = grid(5, 3, "in");
      inM[0] = ["out", "out", "out"];
      inM[2] = ["out", "out", "out"];
      return (
        <>
          <Grid x={14} y={12} m={inM} />
          <Arrow label="고른 행" />
          <Grid x={184} y={26} m={grid(2, 3, "out")} />
          <Caption label="원본(5행)" x={41} />
          <Caption label="1·3행 선택" x={211} />
        </>
      );
    }
    case "tocol": {
      return (
        <>
          <Grid x={30} y={20} m={grid(2, 3, "in")} />
          <Arrow label="한 열로" />
          <Grid x={214} y={6} m={grid(6, 1, "out")} />
          <Caption label="2행 × 3열" x={57} />
          <Caption label="TOCOL(6×1)·TOROW" x={222} />
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
      const inM: C[][] = grid(4, 3, "in");
      return (
        <>
          <Grid x={22} y={18} m={inM} />
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
  return Diagram({ id }) !== null;
}

/** FunctionDialog 상단 — 데이터 변화(입력→출력) 도식 카드. 대상 아니면 null. */
export function ExcelDataFlow({ fn }: { fn: ExcelFunction }) {
  const body = Diagram({ id: fn.id });
  if (!body) return null;
  return (
    <div className="mb-4 rounded-cover border border-border bg-surface/50 px-3 py-2.5">
      <p className="mb-1 text-[11.5px] font-semibold text-foreground">
        데이터 변화 — 입력 → 출력
      </p>
      <svg viewBox="0 0 300 100" width="100%" role="img" aria-label="입력 데이터가 출력으로 바뀌는 형태" style={{ maxWidth: 320, height: "auto" }}>
        {body}
      </svg>
    </div>
  );
}
