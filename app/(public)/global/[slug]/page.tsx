import { notFound, redirect } from "next/navigation";
import { GLOBAL_VIEWERS, getGlobalViewer } from "@/lib/global";

/**
 * 레거시 뷰어 경로(/global/<viewer-slug>) → 사이트 일체형 네이티브 페이지로 이동.
 * 2026-06-13: iframe 문서 임베드를 네이티브 페이지로 전환하면서 딥링크 호환을 위해 유지.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return GLOBAL_VIEWERS.map((v) => ({ slug: v.slug }));
}

export default async function GlobalViewerRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getGlobalViewer(slug);
  if (!item) notFound();
  redirect(item.nativePath);
}
