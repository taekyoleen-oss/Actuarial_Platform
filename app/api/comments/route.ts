import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_NICK = 20;
const MAX_CONTENT = 1000;

/** 익명 댓글 작성. 길이 검증 + IP rate limit(v1.0 최소안). RLS가 INSERT 허용. */
export async function POST(req: Request) {
  if (!rateLimit(`comment:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { post_id?: string; nickname?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_input", detail: "JSON 파싱 실패" },
      { status: 400 }
    );
  }

  const post_id = body.post_id?.trim();
  const nickname = body.nickname?.trim();
  const content = body.content?.trim();

  if (!post_id || !nickname || !content) {
    return NextResponse.json(
      { error: "invalid_input", detail: "필수 항목 누락" },
      { status: 400 }
    );
  }
  if (nickname.length > MAX_NICK || content.length > MAX_CONTENT) {
    return NextResponse.json(
      { error: "invalid_input", detail: "길이 초과" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ib_comments")
    .insert({ post_id, nickname, content })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "invalid_input", detail: error.message },
      { status: 400 }
    );
  }
  return NextResponse.json({ comment: data }, { status: 201 });
}
