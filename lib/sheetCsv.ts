/**
 * 표(그리드) ↔ 텍스트 변환 — 실행기의 '직접 입력'(엑셀 붙여넣기 → CSV 저장)과
 * '데이터 미리보기'(로드된 CSV·TXT·JSON을 표로 열람)가 공유한다.
 * 순수 함수만 두어 node로 바로 점검한다(scripts/test-sheetcsv.mjs).
 */

/** 텍스트 파일 인코딩 감지 — 한글 Windows/Excel CSV(CP949) 대응. null = 기본(utf-8) */
export function detectTextEncoding(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf)
    return "utf-8-sig";
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return null;
  } catch {
    return "cp949";
  }
}

/**
 * 바이트 → 문자열. TextDecoder 기본(utf-8)은 CP949로 저장된 한글 파일을 U+FFFD로
 * 깨뜨리므로(코드 속 열 이름이 '���_��'가 되어 KeyError) 감지 후 euc-kr로 디코드한다.
 */
export function decodeSmart(bytes: Uint8Array): string {
  const enc = detectTextEncoding(bytes) === "cp949" ? "euc-kr" : "utf-8";
  return new TextDecoder(enc).decode(bytes); // utf-8 디코더는 BOM을 자동 제거
}

/** 첫 줄에서 구분자 추정 — 탭(엑셀 복사) > 세미콜론 > 콤마 */
function guessDelimiter(text: string): string {
  const line = text.split(/\r?\n/, 1)[0] ?? "";
  const count = (ch: string) => line.split(ch).length - 1;
  const tabs = count("\t");
  const semis = count(";");
  const commas = count(",");
  if (tabs > 0 && tabs >= commas) return "\t";
  if (semis > commas) return ";";
  return ",";
}

/**
 * 구분자 텍스트(CSV·TSV) → 행렬. 따옴표 안의 구분자·줄바꿈과 "" 이스케이프를 지킨다.
 * 행 길이는 가장 긴 행에 맞춰 빈 칸으로 채운다.
 */
export function parseDelimited(text: string, delim?: string): string[][] {
  const t = text.replace(/^\uFEFF/, "");
  const d = delim ?? guessDelimiter(t);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quoted) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"' && cell === "") {
      quoted = true;
      continue;
    }
    if (ch === d) {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  while (rows.length > 0 && rows[rows.length - 1].every((c) => c.trim() === "")) rows.pop();
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return rows.map((r) => (r.length === width ? r : [...r, ...Array(width - r.length).fill("")]));
}

/** JSON 배열/객체 → 표(첫 행 = 열 이름). pandas to_json의 records·columns 형태 지원 */
function rowsFromJson(text: string): string[][] {
  const v: unknown = JSON.parse(text);
  const str = (x: unknown) =>
    x === null || x === undefined ? "" : typeof x === "object" ? JSON.stringify(x) : String(x);
  if (Array.isArray(v)) {
    if (v.length === 0) return [];
    if (Array.isArray(v[0])) return (v as unknown[][]).map((r) => r.map(str));
    const keys = Array.from(
      new Set(v.flatMap((o) => (o && typeof o === "object" ? Object.keys(o) : [])))
    );
    if (keys.length === 0) return v.map((x) => [str(x)]);
    return [keys, ...v.map((o) => keys.map((k) => str((o as Record<string, unknown>)?.[k])))];
  }
  if (v && typeof v === "object") {
    // {열: {행키: 값}} 또는 {열: [값…]}
    const keys = Object.keys(v as Record<string, unknown>);
    const cols = keys.map((k) => {
      const col = (v as Record<string, unknown>)[k];
      return Array.isArray(col)
        ? col.map(str)
        : col && typeof col === "object"
          ? Object.values(col as Record<string, unknown>).map(str)
          : [str(col)];
    });
    const n = cols.reduce((m, c) => Math.max(m, c.length), 0);
    return [keys, ...Array.from({ length: n }, (_, i) => cols.map((c) => c[i] ?? ""))];
  }
  return [[str(v)]];
}

/** 파일 이름·내용 → 표. .json은 JSON 구조로, 그 외는 구분자 텍스트로 읽는다. */
export function rowsFromText(name: string, text: string): string[][] {
  if (name.toLowerCase().endsWith(".json")) {
    try {
      return rowsFromJson(text);
    } catch {
      // JSON Lines 등 파싱 실패는 텍스트로 폴백
    }
  }
  return parseDelimited(text);
}

const csvCell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** 표 → CSV 텍스트(엑셀 호환 CRLF). pandas read_csv가 그대로 읽는다. */
export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

/** 그리드 끝의 빈 행·빈 열 제거(입력 그리드는 빈 칸이 남아 있다) */
export function trimGrid(rows: string[][]): string[][] {
  const kept = [...rows];
  while (kept.length > 0 && kept[kept.length - 1].every((c) => c.trim() === "")) kept.pop();
  let width = 0;
  for (const r of kept) {
    for (let c = 0; c < r.length; c++) if (r[c].trim() !== "") width = Math.max(width, c + 1);
  }
  return kept.map((r) =>
    Array.from({ length: width }, (_, c) => (r[c] ?? "").trim())
  );
}
