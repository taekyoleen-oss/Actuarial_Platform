import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

/** 관리자가 편집한 요약을 저장 (수동 작성/수정). */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { summary?: string };
  const summary = (body.summary ?? "").trim();

  const svc = createServiceClient();
  const { error } = await svc
    .from("ib_posts")
    .update({
      summary: summary || null,
      summary_generated_at: summary ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, summary: summary || null });
}

/** 관리자가 AI 요약을 리셋(삭제). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const svc = createServiceClient();
  const { error } = await svc
    .from("ib_posts")
    .update({ summary: null, summary_generated_at: null })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: "reset_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
