import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { extractPdfText } from "@/lib/utils/pdf";
import { summarize } from "@/lib/summarize";

/**
 * AI 요약 생성 — 관리자 전용. PDF 추출 → Sonnet(개조식) → 저장 후 반환.
 * 일반 사용자는 생성하지 않는다(공개 페이지는 저장된 요약을 읽기만).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("ib_posts")
    .select("id, title, content")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 });
  }

  try {
    // 첨부 PDF 1건 추출 (폴백: 본문만)
    let attachmentText = "";
    const { data: atts } = await supabase
      .from("ib_attachments")
      .select("storage_path, mime_type")
      .eq("post_id", id)
      .eq("mime_type", "application/pdf")
      .limit(1);

    if (atts && atts[0]) {
      const svc = createServiceClient();
      const { data: file } = await svc.storage
        .from("ib-attachments")
        .download(atts[0].storage_path);
      if (file) {
        const buf = Buffer.from(await file.arrayBuffer());
        const { text } = await extractPdfText(buf);
        attachmentText = text;
      }
    }

    const summary = await summarize({
      title: post.title,
      content: post.content,
      attachmentText,
    });
    const generated_at = new Date().toISOString();

    const svc = createServiceClient();
    await svc
      .from("ib_posts")
      .update({ summary, summary_generated_at: generated_at })
      .eq("id", id);

    return NextResponse.json({ summary, generated_at });
  } catch {
    return NextResponse.json({ error: "summarize_failed" }, { status: 502 });
  }
}
