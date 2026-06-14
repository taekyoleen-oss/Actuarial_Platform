import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDomesticProduct,
  listDomesticProducts,
} from "@/lib/domesticProducts";

// 상품 정보 자료 열람 — 완성형 HTML 문서를 앱 프레임 안에 원본 그대로 임베드(보험이론 사전 패턴).
export const dynamicParams = false;

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export function generateStaticParams() {
  return listDomesticProducts().map((i) => ({ name: i.base }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const item = getDomesticProduct(safeDecode(name));
  return {
    title: item
      ? `${item.title} — 국내 보험 정보·분석`
      : "국내 보험 정보·분석 | Insurance Insights Board",
  };
}

export default async function ProductViewerPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const item = getDomesticProduct(safeDecode(name));
  if (!item) notFound();

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 3.5rem)" }}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-white px-6 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/posts?category=domestic"
            className="shrink-0 text-sm font-medium text-tertiary hover:text-foreground"
          >
            ← 국내 보험 정보·분석
          </Link>
          <h1 className="truncate text-sm font-semibold text-brand-sky">
            {item.title}
          </h1>
        </div>
        <a
          href={item.htmlPath}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-sm font-medium text-primary"
        >
          새 탭에서 열기 ↗
        </a>
      </div>
      <iframe
        src={item.htmlPath}
        title={item.title}
        className="w-full flex-1 border-0 bg-white"
      />
    </div>
  );
}
