import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/datalab/[id]/view — 조회수 +1 (RPC ib_increment_data_view).
 * 익명 UPDATE 권한 없이 우회, 게시글만 증가. (posts view 라우트와 동일 방식: anon 클라이언트)
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.rpc("ib_increment_data_view", {
    p_post_id: id,
  });
  if (error) {
    return NextResponse.json({ error: "data_post_not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
