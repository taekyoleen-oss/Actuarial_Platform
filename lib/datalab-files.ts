// 서버 전용: DataLab 파일 kind 추론 · 안전한 파일명 유틸 (Route Handler 공용).
import type { DataFile } from "@/types";

export type DataFileKind = DataFile["kind"];

const EXCEL_EXT = ["xlsx", "xlsm", "xls"];
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const TEXT_EXT = ["txt", "md", "csv"];
const CODE_EXT = ["py", "js", "vba", "bas"];

/** 확장자·MIME으로 kind 추론. */
export function inferKind(fileName: string, mime?: string | null): DataFileKind {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (EXCEL_EXT.includes(ext)) return "excel";
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (TEXT_EXT.includes(ext)) return "text";
  if (CODE_EXT.includes(ext)) return "code";
  if (mime) {
    const m = mime.toLowerCase();
    if (m.includes("spreadsheet") || m.includes("excel")) return "excel";
    if (m === "application/pdf") return "pdf";
    if (m.startsWith("image/")) return "image";
    if (m.startsWith("text/")) return "text";
  }
  return "other";
}

/** Storage 경로/파일명에 안전한 문자열. (업로드 라우트 컨벤션과 동일) */
export function safeName(name: string): string {
  return name.replace(/[^\w.\-가-힣]/g, "_");
}

/**
 * 웹 저장본 파일명 base 산출 — baseName 우선, 없으면 기존 파일명에서 유래.
 * `v{n}_` 접두·확장자 제거 후 안전화. 비면 'workbook'.
 */
export function deriveBase(
  baseName: string | undefined,
  existingFileName: string | undefined
): string {
  let raw = (baseName || existingFileName || "workbook").trim();
  raw = raw.replace(/\.[A-Za-z0-9]+$/, ""); // 확장자 제거
  raw = raw.replace(/^v\d+_/, ""); // v{n}_ 접두 제거
  raw = safeName(raw).replace(/^_+|_+$/g, "");
  return raw || "workbook";
}

const MIME_BY_EXT: Record<string, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
  xls: "application/vnd.ms-excel",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
};

/** 확장자 기반 content-type (업로드 시 contentType 지정용). */
export function mimeForName(fileName: string, fallback?: string | null): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return MIME_BY_EXT[ext] || fallback || "application/octet-stream";
}

export const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
