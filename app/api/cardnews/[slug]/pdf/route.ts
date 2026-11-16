import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { hasCardNewsSlug } from "@/lib/cardnews";
import { createServiceClient } from "@/lib/supabase/server";

/** 카드뉴스·모션 슬라이드 PDF 다운로드 — 관리자 로그인 브라우저 전용. 비공개 버킷 ib-cardnews-pdf의 60초 서명 URL로 보낸다. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const type = new URL(req.url).searchParams.get("type");
  if (!hasCardNewsSlug(slug) || (type !== "cards" && type !== "slides"))
    return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!(await requireAdmin()).ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const file = `${slug}-${type}.pdf`; // 한글 파일명은 Storage가 filename* 를 이중 인코딩해 ASCII 유지
  const { data, error } = await createServiceClient()
    .storage.from("ib-cardnews-pdf")
    .createSignedUrl(`${slug}/${type}.pdf`, 60, { download: file });
  if (error || !data) return NextResponse.json({ error: "pdf missing" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
