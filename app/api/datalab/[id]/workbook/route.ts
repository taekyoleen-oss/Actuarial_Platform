import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  fortuneSheetsToXlsx,
  type FortuneSheetJson,
} from "@/lib/datalab-xlsx";
import { deriveBase, XLSX_MIME } from "@/lib/datalab-files";

const MAX_JSON_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * POST /api/datalab/[id]/workbook — 웹 편집 저장(자동저장 포함).
 * Body(JSON): { sheets: FortuneSheetJson[], baseName?: string }
 * fortune-sheet getAllSheets() 결과를 exceljs로 xlsx 생성 → 새 버전(v{n})으로 저장.
 * 원본(v1)은 절대 덮어쓰지 않으며 이전 current는 is_current=false로 이동.
 * 응답: { file: DataFile, savedAt: string }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;

  // 크기 방어 + JSON 파싱
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (raw.length > MAX_JSON_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 400 });
  }
  let body: { sheets?: FortuneSheetJson[]; baseName?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const sheets = body.sheets;
  if (!Array.isArray(sheets) || sheets.length === 0) {
    return NextResponse.json({ error: "invalid_sheets" }, { status: 400 });
  }

  const svc = createServiceClient();

  // 대표 엑셀 존재 확인 → 게시글 유효성 + 다음 버전 계산 + base 유래
  const { data: existing, error: exErr } = await svc
    .from("ib_data_files")
    .select("version, file_name")
    .eq("post_id", postId)
    .eq("is_primary", true)
    .eq("kind", "excel")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (exErr) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  const nextVersion = (existing?.version ?? 0) + 1;
  const base = deriveBase(body.baseName, existing?.file_name);
  const fileName = `v${nextVersion}_${base}.xlsx`;
  const storagePath = `datalab/${postId}/${fileName}`;

  // xlsx 생성
  let converted;
  try {
    converted = await fortuneSheetsToXlsx(sheets);
  } catch {
    return NextResponse.json({ error: "convert_failed" }, { status: 500 });
  }

  // Storage 업로드
  const { error: upErr } = await svc.storage
    .from("ib-attachments")
    .upload(storagePath, converted.buffer, {
      contentType: XLSX_MIME,
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  // 메타 insert (새 current)
  const { data: file, error: insErr } = await svc
    .from("ib_data_files")
    .insert({
      post_id: postId,
      kind: "excel",
      file_name: fileName,
      storage_path: storagePath,
      mime_type: XLSX_MIME,
      file_size: converted.buffer.length,
      is_primary: true,
      version: nextVersion,
      is_current: true,
      note: `웹 편집 저장 (셀 ${converted.cellCount} · 수식 ${converted.formulaCount} · 병합 ${converted.mergeCount}${converted.skippedCells ? ` · skip ${converted.skippedCells}` : ""})`,
    })
    .select("*")
    .single();
  if (insErr || !file) {
    // 롤백: 업로드 파일 제거 시도
    await svc.storage.from("ib-attachments").remove([storagePath]);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // 이전 current(대표 엑셀)들을 is_current=false로 이동 (새 파일 제외)
  await svc
    .from("ib_data_files")
    .update({ is_current: false })
    .eq("post_id", postId)
    .eq("is_primary", true)
    .eq("kind", "excel")
    .eq("is_current", true)
    .neq("id", file.id);

  return NextResponse.json(
    { file, savedAt: file.created_at ?? new Date().toISOString() },
    { status: 201 }
  );
}
