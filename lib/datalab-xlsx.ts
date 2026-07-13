// 서버 전용: fortune-sheet getAllSheets() JSON → exceljs xlsx 변환.
// 웹 편집 저장본(v2+) 생성에만 사용. VBA/차트/피벗/Python은 복원 불가(원본 v1 보존이 원칙).
import ExcelJS from "exceljs";

/** fortune-sheet 셀 객체(느슨한 형태). getAllSheets() celldata[].v 또는 data[][] 원소. */
export interface FsCell {
  v?: string | number | boolean | null; // 원시 값
  m?: string | null; // 표시 문자열
  f?: string; // 수식(=로 시작할 수 있음)
  ct?: { fa?: string; t?: string } | null; // 셀 타입(t: 'n' 숫자, 's' 문자 등)
  qp?: number | boolean; // quotePrefix(강제 텍스트) — luckyexcel 임포트 텍스트 셀에 1
  [k: string]: unknown;
}

/** fortune-sheet 시트(느슨한 형태). getAllSheets() 원소. */
export interface FortuneSheetJson {
  name?: string;
  celldata?: { r: number; c: number; v: FsCell | string | number | null }[];
  data?: (FsCell | null)[][];
  config?: {
    merge?: Record<string, { r: number; c: number; rs?: number; cs?: number }>;
    columnlen?: Record<string, number>;
    rowlen?: Record<string, number>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

type CellEntry = { r: number; c: number; cell: FsCell };

function toFsCell(v: FsCell | string | number | boolean | null | undefined): FsCell {
  if (v === null || v === undefined) return {};
  if (typeof v === "object") return v as FsCell;
  return { v };
}

/** celldata 우선, 없으면 data 매트릭스에서 셀 엔트리 목록 추출. */
function collectCells(sheet: FortuneSheetJson): CellEntry[] {
  const out: CellEntry[] = [];
  if (Array.isArray(sheet.celldata) && sheet.celldata.length > 0) {
    for (const item of sheet.celldata) {
      if (!item || typeof item.r !== "number" || typeof item.c !== "number") continue;
      out.push({ r: item.r, c: item.c, cell: toFsCell(item.v) });
    }
    return out;
  }
  if (Array.isArray(sheet.data)) {
    for (let r = 0; r < sheet.data.length; r++) {
      const row = sheet.data[r];
      if (!Array.isArray(row)) continue;
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (cell === null || cell === undefined) continue;
        out.push({ r, c, cell: cell as FsCell });
      }
    }
  }
  return out;
}

/** 강제 텍스트 셀 판별 — ct.t==='s' 또는 quotePrefix(qp)면 값이 숫자문자열이어도 텍스트 유지. */
function isForcedText(cell: FsCell): boolean {
  if (cell.ct && cell.ct.t === "s") return true;
  return cell.qp === 1 || cell.qp === true;
}

/**
 * 정보 손실 없이 숫자로 변환 가능한 "정규 숫자 문자열"만 수치화하고, 아니면 null.
 * 텍스트로 남겨야 하는 케이스: 빈 문자열·공백·앞자리 0("007")·부호(+)·지수표기("1e5")·
 * 초대형 정수(정밀도 손실). 정규형: [-]{0 | 1~9로 시작하는 정수}[.소수부].
 */
const CANONICAL_NUMBER_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;
function numericStringToNumber(raw: string): number | null {
  if (!CANONICAL_NUMBER_RE.test(raw)) return null; // 앞자리0·지수·부호·공백·빈값 제외
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  // 정수는 안전정수 범위에서만 변환(그 밖은 정밀도 손실 → 텍스트 유지). 소수는 유한이면 허용.
  if (!raw.includes(".") && !Number.isSafeInteger(n)) return null;
  return n;
}

/**
 * 셀 값 정규화 — 숫자 타입 보존.
 * luckyexcel 임포트 숫자 셀은 { v:"1200" }(숫자문자열, ct 없음) 형태이므로 ct.t==='n'을 요구하지 않고,
 * 강제 텍스트(ct.t==='s'/qp)가 아닌 한 정규 숫자 문자열은 Number로 변환한다.
 */
function cellValue(cell: FsCell): string | number | boolean | null {
  const raw = cell.v;
  if (raw === undefined || raw === null || raw === "") {
    return cell.m ?? null;
  }
  if (typeof raw === "number" || typeof raw === "boolean") return raw;
  // 문자열
  if (isForcedText(cell)) return raw;
  const n = numericStringToNumber(raw);
  return n === null ? raw : n;
}

export interface ConvertResult {
  buffer: Buffer;
  sheetCount: number;
  cellCount: number;
  formulaCount: number;
  mergeCount: number;
  skippedCells: number;
}

/**
 * fortune-sheet JSON 배열 → xlsx 버퍼.
 * 매핑: 값(v.v, 숫자는 숫자) · 수식(v.f → {formula, result:v.v}) · 병합(config.merge) ·
 *       열너비(config.columnlen px/7.5) · 행높이(config.rowlen px*0.75). 실패 셀은 skip + 카운트.
 */
export async function fortuneSheetsToXlsx(
  sheets: FortuneSheetJson[]
): Promise<ConvertResult> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Insurance Insights Board — DataLab";
  workbook.created = new Date();

  let cellCount = 0;
  let formulaCount = 0;
  let mergeCount = 0;
  let skippedCells = 0;

  const list = Array.isArray(sheets) ? sheets : [];
  list.forEach((sheet, si) => {
    const name = (sheet.name || `Sheet${si + 1}`).slice(0, 31) || `Sheet${si + 1}`;
    const ws = workbook.addWorksheet(name);

    // 셀 값·수식
    for (const { r, c, cell } of collectCells(sheet)) {
      try {
        const target = ws.getRow(r + 1).getCell(c + 1);
        if (typeof cell.f === "string" && cell.f.length > 0) {
          const formula = cell.f.replace(/^=/, "");
          const result = cellValue(cell);
          target.value =
            result === null
              ? { formula }
              : { formula, result: result as string | number | boolean };
          formulaCount++;
        } else {
          const val = cellValue(cell);
          if (val === null) continue;
          target.value = val;
        }
        cellCount++;
      } catch {
        skippedCells++;
      }
    }

    // 병합
    const merge = sheet.config?.merge;
    if (merge && typeof merge === "object") {
      for (const key of Object.keys(merge)) {
        const m = merge[key];
        if (!m || typeof m.r !== "number" || typeof m.c !== "number") continue;
        const rs = Math.max(1, m.rs || 1);
        const cs = Math.max(1, m.cs || 1);
        if (rs === 1 && cs === 1) continue;
        try {
          ws.mergeCells(m.r + 1, m.c + 1, m.r + rs, m.c + cs);
          mergeCount++;
        } catch {
          // 겹치는 병합 등은 무시
        }
      }
    }

    // 열너비 (px → 문자폭 대략 px/7.5)
    const columnlen = sheet.config?.columnlen;
    if (columnlen && typeof columnlen === "object") {
      for (const key of Object.keys(columnlen)) {
        const px = Number(columnlen[key]);
        const idx = Number(key);
        if (!isFinite(px) || px <= 0 || !isFinite(idx)) continue;
        try {
          ws.getColumn(idx + 1).width = px / 7.5;
        } catch {
          /* skip */
        }
      }
    }

    // 행높이 (px → pt 대략 px*0.75)
    const rowlen = sheet.config?.rowlen;
    if (rowlen && typeof rowlen === "object") {
      for (const key of Object.keys(rowlen)) {
        const px = Number(rowlen[key]);
        const idx = Number(key);
        if (!isFinite(px) || px <= 0 || !isFinite(idx)) continue;
        try {
          ws.getRow(idx + 1).height = px * 0.75;
        } catch {
          /* skip */
        }
      }
    }
  });

  if (workbook.worksheets.length === 0) {
    workbook.addWorksheet("Sheet1");
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer as ArrayBuffer);
  return {
    buffer,
    sheetCount: workbook.worksheets.length,
    cellCount,
    formulaCount,
    mergeCount,
    skippedCells,
  };
}
