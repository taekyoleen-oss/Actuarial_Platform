import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * /datalab 사전 콘텐츠 오버라이드 API — 관리자 팝업 편집(2026-07-19).
 *  GET    : 공개 — 전체 오버라이드 + 현재 세션의 관리자 여부
 *  PUT    : 관리자 — { key, data } upsert (텍스트 필드만, 코드·수식 불가)
 *  DELETE : 관리자 — ?key=... 삭제(원본 복원)
 * 테이블(ib_datalab_overrides)이 아직 없으면 GET은 빈 결과로 무해하게 동작한다.
 */

const KEY_RE = /^(method|excel|theory):[a-z0-9-]{1,64}$/;
const TEXT_FIELDS = [
  "intro",
  "tips",
  "summary",
  "definition",
  "usage",
  "interpretation",
] as const;
const ARRAY_FIELDS = ["sectionDescs", "exampleExplains"] as const;
const MAX_TEXT = 4000;
const MAX_ITEMS = 40;
const MAX_BODY = 64 * 1024;

export interface OverrideData {
  intro?: string;
  tips?: string;
  summary?: string;
  definition?: string;
  usage?: string;
  interpretation?: string;
  sectionDescs?: (string | null)[];
  exampleExplains?: (string | null)[];
}

function sanitize(input: unknown): OverrideData | null {
  if (typeof input !== "object" || input === null) return null;
  const src = input as Record<string, unknown>;
  const out: OverrideData = {};
  for (const f of TEXT_FIELDS) {
    const v = src[f];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v !== "string" || v.length > MAX_TEXT) return null;
    out[f] = v;
  }
  for (const f of ARRAY_FIELDS) {
    const v = src[f];
    if (v === undefined || v === null) continue;
    if (!Array.isArray(v) || v.length > MAX_ITEMS) return null;
    const arr: (string | null)[] = [];
    let hasAny = false;
    for (const item of v) {
      if (item === null || item === undefined || item === "") arr.push(null);
      else if (typeof item === "string" && item.length <= MAX_TEXT) {
        arr.push(item);
        hasAny = true;
      } else return null;
    }
    if (hasAny) out[f] = arr;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function GET() {
  const svc = createServiceClient();
  const admin = await requireAdmin();
  const { data, error } = await svc
    .from("ib_datalab_overrides")
    .select("key, data");
  // 테이블 미생성 등 — 오버라이드 없음으로 무해하게(사전은 원본으로 표시)
  const overrides: Record<string, OverrideData> = {};
  if (!error && data) {
    for (const row of data as { key: string; data: OverrideData }[]) {
      overrides[row.key] = row.data;
    }
  }
  return NextResponse.json(
    { overrides, isAdmin: admin.ok },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 400 });
  }
  let body: { key?: string; data?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const key = body.key ?? "";
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: "invalid_key" }, { status: 400 });
  }
  const data = sanitize(body.data);
  if (!data) {
    return NextResponse.json({ error: "invalid_data" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { error } = await svc.from("ib_datalab_overrides").upsert({
    key,
    data,
    updated_by: admin.userId,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    // 테이블 미생성 시 안내(관리자 화면에 표시) — output/datalab_overrides_schema.sql 실행 필요
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, key, data });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: "invalid_key" }, { status: 400 });
  }
  const svc = createServiceClient();
  const { error } = await svc
    .from("ib_datalab_overrides")
    .delete()
    .eq("key", key);
  if (error) {
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, key });
}
