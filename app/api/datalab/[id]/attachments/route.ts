import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { inferKind, safeName } from "@/lib/datalab-files";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

/**
 * POST /api/datalab/[id]/attachments — 첨부/대표 워크북 업로드 (multipart).
 * form: file(binary), kind?(강제 kind), is_primary?('true'|'false').
 *  - is_primary && kind==='excel' → 새 버전(v{n}) 대표 엑셀로 추가(원본 교체 아님), is_current 이동.
 *  - 그 외 → kind 자동 추론, 경로 datalab/{postId}/att_{ts}_{safeName}.
 * 응답: { file: DataFile }
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

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const kindOverride = String(form.get("kind") || "").trim();
  const isPrimary = String(form.get("is_primary") || "") === "true";

  if (!file) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 400 });
  }

  const mime = file.type || null;
  const kind = kindOverride || inferKind(file.name, mime);
  const safe = safeName(file.name);
  const svc = createServiceClient();

  const isPrimaryExcel = isPrimary && kind === "excel";

  // 대표 엑셀이면 버전 증가, 아니면 첨부(version 1)
  let version = 1;
  let storagePath: string;
  if (isPrimaryExcel) {
    const { data: existing, error: exErr } = await svc
      .from("ib_data_files")
      .select("version")
      .eq("post_id", postId)
      .eq("is_primary", true)
      .eq("kind", "excel")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (exErr) {
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
    version = (existing?.version ?? 0) + 1;
    storagePath = `datalab/${postId}/v${version}_${safe}`;
  } else {
    storagePath = `datalab/${postId}/att_${Date.now()}_${safe}`;
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await svc.storage
    .from("ib-attachments")
    .upload(storagePath, buffer, {
      contentType: mime || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }

  const { data: inserted, error: insErr } = await svc
    .from("ib_data_files")
    .insert({
      post_id: postId,
      kind,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: mime,
      file_size: file.size,
      is_primary: isPrimaryExcel,
      version,
      is_current: true,
    })
    .select("*")
    .single();
  if (insErr || !inserted) {
    await svc.storage.from("ib-attachments").remove([storagePath]);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // 대표 엑셀 새 버전이면 이전 current 이동
  if (isPrimaryExcel) {
    await svc
      .from("ib_data_files")
      .update({ is_current: false })
      .eq("post_id", postId)
      .eq("is_primary", true)
      .eq("kind", "excel")
      .eq("is_current", true)
      .neq("id", inserted.id);
  }

  return NextResponse.json({ file: inserted }, { status: 201 });
}

/**
 * DELETE /api/datalab/[id]/attachments?fileId=... — (관리자) 파일 삭제.
 * Storage 객체 제거 + ib_data_files row 삭제.
 * 응답: { ok: true }
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: postId } = await params;
  const fileId = new URL(req.url).searchParams.get("fileId");
  if (!fileId) {
    return NextResponse.json({ error: "missing_file_id" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data: row, error: selErr } = await svc
    .from("ib_data_files")
    .select("id, storage_path")
    .eq("id", fileId)
    .eq("post_id", postId)
    .maybeSingle();
  if (selErr) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "file_not_found" }, { status: 404 });
  }

  await svc.storage.from("ib-attachments").remove([row.storage_path]);
  const { error: delErr } = await svc
    .from("ib_data_files")
    .delete()
    .eq("id", fileId)
    .eq("post_id", postId);
  if (delErr) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
