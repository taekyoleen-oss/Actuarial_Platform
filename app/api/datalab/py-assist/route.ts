import { NextResponse } from "next/server";
import { pyAssist, type PyAssistInput } from "@/lib/pyAssist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /datalab 파이썬 실행기 AI 어시스턴트 — 공개(방문자 사용).
 * mode "fix": 셀 코드 + 오류 + 데이터 스키마 → 고친 코드.
 * mode "generate": 요청 + 스키마(+이전 셀) → 새 코드.
 * 서버에서만 ANTHROPIC_API_KEY 사용. 입력은 lib에서 길이 상한 적용.
 */
export async function POST(req: Request) {
  let body: Partial<PyAssistInput>;
  try {
    body = (await req.json()) as Partial<PyAssistInput>;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const mode = body.mode;
  const allowed = ["fix", "generate", "edit", "vars"];
  if (!mode || !allowed.includes(mode)) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }
  if (mode === "generate" && !(body.request ?? "").trim()) {
    return NextResponse.json({ error: "empty_request" }, { status: 400 });
  }
  if (mode === "edit" && !(body.request ?? "").trim()) {
    return NextResponse.json({ error: "empty_request" }, { status: 400 });
  }
  if (
    (mode === "fix" || mode === "edit" || mode === "vars") &&
    !(body.code ?? "").trim()
  ) {
    return NextResponse.json({ error: "empty_code" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  try {
    const result = await pyAssist({
      mode,
      code: body.code,
      error: body.error,
      request: body.request,
      schema: body.schema,
      priorCode: body.priorCode,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "assist_failed" }, { status: 502 });
  }
}
