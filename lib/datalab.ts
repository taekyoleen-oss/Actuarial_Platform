import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/queries";
import type {
  DataFile,
  DataPostDetail,
  DataPostListItem,
  SortOrder,
} from "@/types";

/**
 * 데이터 예제/분석(DataLab) 목록 — 검색(title/summary/source_name) + 정렬.
 * is_published=true는 RLS가 보장하지만 명시한다.
 * DB 테이블 미적용/쿼리 에러 시 빈 배열 폴백(lib/queries.ts의 data ?? [] 패턴).
 */
export async function listDataPosts(opts: {
  q?: string;
  sort?: SortOrder;
}): Promise<DataPostListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("ib_data_posts")
    .select("*, files:ib_data_files(*)")
    .eq("is_published", true);

  if (opts.q && opts.q.trim()) {
    const term = `%${opts.q.trim()}%`;
    query = query.or(
      `title.ilike.${term},summary.ilike.${term},source_name.ilike.${term}`
    );
  }
  query =
    opts.sort === "popular"
      ? query.order("view_count", { ascending: false })
      : query.order("created_at", { ascending: false });

  const { data } = await query;
  return (data as DataPostListItem[]) ?? [];
}

/** 상세 — files 조인. 미게시/미존재/에러 시 null. (게시 여부는 RLS가 판단 — 관리자 프리뷰 허용) */
export async function getDataPost(
  slug: string
): Promise<DataPostDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ib_data_posts")
    .select("*, files:ib_data_files(*)")
    .eq("slug", slug)
    .maybeSingle();
  return (data as DataPostDetail) ?? null;
}

/** Storage(ib-attachments) 공개 URL — lib/queries.publicUrl 재사용. */
export async function dataFileUrl(storagePath: string): Promise<string> {
  return publicUrl(storagePath);
}

/**
 * 현재 워크북(웹 뷰어·다운로드가 가리키는 파일).
 * is_primary && is_current 우선, 없으면 kind==='excel' 첫 항목.
 */
export function currentWorkbook(files: DataFile[]): DataFile | null {
  if (!files || files.length === 0) return null;
  const primaryCurrent = files.find((f) => f.is_primary && f.is_current);
  if (primaryCurrent) return primaryCurrent;
  const firstExcel = files.find((f) => f.kind === "excel");
  return firstExcel ?? null;
}

/** 원본 워크북 = is_primary && version===1 (업로드 원본, 무손실 보존본). */
export function originalWorkbook(files: DataFile[]): DataFile | null {
  if (!files || files.length === 0) return null;
  return files.find((f) => f.is_primary && f.version === 1) ?? null;
}
