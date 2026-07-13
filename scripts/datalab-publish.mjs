// DataLab 게시 스크립트 (service_role) — manifest.json 기반으로 게시글 upsert + 파일 업로드.
// 사용: node scripts/datalab-publish.mjs <manifest.json>
// manifest: { slug, title, summary, source_name, source_url, models[], tools[], content{},
//             is_published, files:[ { path, kind?, is_primary?, note? } ] }
// datalab-publisher 스킬이 호출. DB+Storage만 사용 → 재배포 없이 즉시 반영.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");

const BUCKET = "ib-attachments";

function fail(stage, detail) {
  console.error(`[실패] ${stage}: ${detail}`);
  process.exit(1);
}

// ── .env.local 로드 (create-board-post.mjs 패턴) ──
try {
  for (const l of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2];
  }
} catch {
  fail("환경설정", ".env.local을 읽을 수 없습니다 (프로젝트 루트에서 실행하세요).");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  fail("환경설정", "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 누락.");
}

// ── 유틸 (라우트 lib/datalab-files.ts와 동일 규칙) ──
const EXCEL_EXT = ["xlsx", "xlsm", "xls"];
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
const TEXT_EXT = ["txt", "md", "csv"];
const CODE_EXT = ["py", "js", "vba", "bas"];
const MIME_BY_EXT = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xlsm: "application/vnd.ms-excel.sheet.macroEnabled.12",
  xls: "application/vnd.ms-excel",
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
};
function extOf(name) {
  return (name.split(".").pop() || "").toLowerCase();
}
function inferKind(name) {
  const ext = extOf(name);
  if (EXCEL_EXT.includes(ext)) return "excel";
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.includes(ext)) return "image";
  if (TEXT_EXT.includes(ext)) return "text";
  if (CODE_EXT.includes(ext)) return "code";
  return "other";
}
function safeName(name) {
  return name.replace(/[^\w.\-가-힣]/g, "_");
}
function mimeForName(name) {
  return MIME_BY_EXT[extOf(name)] || "application/octet-stream";
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    fail("인자", "사용: node scripts/datalab-publish.mjs <manifest.json>");
  }
  const manifestAbs = path.resolve(manifestPath);
  const manifestDir = path.dirname(manifestAbs);

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestAbs, "utf8"));
  } catch (e) {
    fail("manifest 파싱", e.message);
  }
  if (!manifest.slug || !manifest.title) {
    fail("manifest 검증", "slug, title은 필수입니다.");
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── 1) 게시글 upsert (slug 기준) ──
  const meta = {
    slug: manifest.slug,
    title: manifest.title,
    summary: manifest.summary ?? null,
    source_name: manifest.source_name ?? null,
    source_url: manifest.source_url ?? null,
    models: Array.isArray(manifest.models) ? manifest.models : [],
    tools: Array.isArray(manifest.tools) ? manifest.tools : [],
    content: manifest.content ?? {},
    is_published: manifest.is_published !== false,
  };

  let postId;
  const { data: existingPost, error: selErr } = await sb
    .from("ib_data_posts")
    .select("id")
    .eq("slug", manifest.slug)
    .maybeSingle();
  if (selErr) fail("게시글 조회", selErr.message);

  if (existingPost) {
    const { error: upErr } = await sb
      .from("ib_data_posts")
      .update({ ...meta, updated_at: new Date().toISOString() })
      .eq("id", existingPost.id);
    if (upErr) fail("게시글 업데이트", upErr.message);
    postId = existingPost.id;
    console.log(`[업데이트] ib_data_posts id=${postId} (slug=${manifest.slug})`);
  } else {
    const { data: inserted, error: insErr } = await sb
      .from("ib_data_posts")
      .insert(meta)
      .select("id")
      .single();
    if (insErr) fail("게시글 생성", insErr.message);
    postId = inserted.id;
    console.log(`[생성] ib_data_posts id=${postId} (slug=${manifest.slug})`);
  }

  // ── 2) 파일 업로드 + ib_data_files insert ──
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  for (const f of files) {
    if (!f || !f.path) fail("파일 검증", "files[].path 누락.");
    const fileAbs = path.isAbsolute(f.path)
      ? f.path
      : path.resolve(manifestDir, f.path);
    const fileName = path.basename(fileAbs);

    let buffer;
    try {
      buffer = readFileSync(fileAbs);
    } catch (e) {
      fail(`파일 읽기(${fileName})`, e.message);
    }

    const kind = f.kind || inferKind(fileName);
    const isPrimary = f.is_primary === true;
    const isPrimaryExcel = isPrimary && kind === "excel";
    const safe = safeName(fileName);

    // 대표 엑셀이면 버전 계산, 아니면 첨부
    let version = 1;
    let storagePath;
    if (isPrimaryExcel) {
      const { data: maxRow, error: maxErr } = await sb
        .from("ib_data_files")
        .select("version")
        .eq("post_id", postId)
        .eq("is_primary", true)
        .eq("kind", "excel")
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxErr) fail(`버전 조회(${fileName})`, maxErr.message);
      version = (maxRow?.version ?? 0) + 1;
      storagePath = `datalab/${postId}/v${version}_${safe}`;
    } else {
      storagePath = `datalab/${postId}/att_${Date.now()}_${safe}`;
    }

    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimeForName(fileName),
        upsert: false,
      });
    if (upErr) fail(`Storage 업로드(${fileName})`, upErr.message);

    const { data: row, error: rowErr } = await sb
      .from("ib_data_files")
      .insert({
        post_id: postId,
        kind,
        file_name: fileName,
        storage_path: storagePath,
        mime_type: mimeForName(fileName),
        file_size: buffer.length,
        is_primary: isPrimaryExcel,
        version,
        is_current: true,
        note: f.note ?? null,
      })
      .select("id")
      .single();
    if (rowErr) {
      // 업로드 롤백 시도
      await sb.storage.from(BUCKET).remove([storagePath]);
      fail(`ib_data_files insert(${fileName})`, rowErr.message);
    }

    // 대표 엑셀 새 버전이면 이전 current 이동
    if (isPrimaryExcel) {
      const { error: demErr } = await sb
        .from("ib_data_files")
        .update({ is_current: false })
        .eq("post_id", postId)
        .eq("is_primary", true)
        .eq("kind", "excel")
        .eq("is_current", true)
        .neq("id", row.id);
      if (demErr) fail(`이전 버전 정리(${fileName})`, demErr.message);
    }

    console.log(
      `[파일] ${kind}${isPrimaryExcel ? ` v${version}(current)` : ""} → ${storagePath} (${buffer.length}B)`
    );
  }

  // ── 3) 게시 URL 출력 ──
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const url = `${base}/datalab/${manifest.slug}`;
  console.log("");
  console.log("[게시 완료]", url);
}

main().catch((e) => {
  console.error("[실패] 예기치 못한 오류:", e && e.message ? e.message : e);
  process.exit(1);
});
