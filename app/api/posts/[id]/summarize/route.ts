import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { extractPdfText } from "@/lib/utils/pdf";
import { summarize } from "@/lib/summarize";

/**
 * AI 요약 — 캐시 우선. 미스 시 PDF 추출 → Sonnet 요약 → 캐싱.
 * 캐시 쓰기는 service_role(서버 전용)로 수행한다(익명은 ib_posts UPDATE 불가).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("ib_posts")
    .select("id, title, content, summary, summary_generated_at, is_published")
    .eq("id", id)
    .maybeSingle();

  if (!post || !post.is_published) {
    return NextResponse.json({ error: "post_not_found" }, { status: 404 });
  }

  // 캐시 히트 → 재호출 0
  if (post.summary) {
    return NextResponse.json({
      summary: post.summary,
      cached: true,
      generated_at: post.summary_generated_at,
    });
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

    // 캐싱 (service_role)
    const svc = createServiceClient();
    await svc
      .from("ib_posts")
      .update({ summary, summary_generated_at: generated_at })
      .eq("id", id);

    return NextResponse.json({ summary, cached: false, generated_at });
  } catch {
    return NextResponse.json({ error: "summarize_failed" }, { status: 502 });
  }
}
