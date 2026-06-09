import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB

/** 관리자 파일 업로드. 서버에서 권한 재검증 후 service_role로 Storage 저장 + 메타 기록. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const postId = String(form.get("post_id") || "");
  const categorySlug = String(form.get("category_slug") || "");

  if (!file || !postId || !categorySlug) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }

  // 경로 규칙: {category_slug}/{post_id}/{filename}
  const safeName = file.name.replace(/[^\w.\-가-힣]/g, "_");
  const storagePath = `${categorySlug}/${postId}/${Date.now()}_${safeName}`;

  const svc = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await svc.storage
    .from("ib-attachments")
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }

  const { data, error } = await svc
    .from("ib_attachments")
    .insert({
      post_id: postId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 });
  }
  return NextResponse.json({ attachment: data }, { status: 201 });
}
