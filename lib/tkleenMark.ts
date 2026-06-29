// tkLeen 픽셀 마크 — "흩어진 리스크 → 하나의 보장"
// 20×20 그리드(col/row) 위의 셀 좌표. HeroIdent(헤더 아이덴트)와
// BrandBackdrop(홈 배경 워터마크)이 동일한 형상을 공유하도록 분리.
// 형상·매핑은 design/idents/tkleen-hero-animation.html 원본 그대로.

export type Tone = "ink" | "sky";

export interface MarkCell {
  c: number;
  r: number;
  tone: Tone;
}

/* T 크로스바: rows 4–5 (Ink) · 공유 스템 col 4–5:
   y60–100 Ink → y100–160 Sky · K 대각 암: y100에서 방사 (Sky) */
export function buildTkleenCells(): MarkCell[] {
  const cells: MarkCell[] = [];
  // T 크로스바 (Ink)
  for (let r = 4; r <= 5; r++)
    for (let c = 1; c <= 9; c++) cells.push({ c, r, tone: "ink" });
  // 스템 상단 (Ink)
  for (let r = 6; r <= 9; r++)
    for (let c = 4; c <= 5; c++) cells.push({ c, r, tone: "ink" });
  // 스템 하단 (Sky — 시그니처)
  for (let r = 10; r <= 15; r++)
    for (let c = 4; c <= 5; c++) cells.push({ c, r, tone: "sky" });
  // K 위쪽 대각 암 (Sky)
  for (let i = 0; i <= 5; i++) {
    cells.push({ c: 6 + i, r: 9 - i, tone: "sky" });
    cells.push({ c: 7 + i, r: 9 - i, tone: "sky" });
  }
  // K 아래쪽 대각 암 (Sky)
  for (let i = 0; i <= 5; i++) {
    cells.push({ c: 6 + i, r: 10 + i, tone: "sky" });
    cells.push({ c: 7 + i, r: 10 + i, tone: "sky" });
  }
  return cells;
}

export const TKLEEN_CELL = 10;
