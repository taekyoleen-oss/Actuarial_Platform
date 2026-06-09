import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteNav } from "@/components/feature/SiteNav";

export const metadata: Metadata = {
  title: "Insurance Insights Board",
  description: "보험 배타적 사용권·국내외 보험 정보 분석 자료 게시판",
};

// 모바일 반응형: viewport 메타가 없으면 데스크톱 폭(980px)으로 렌더→축소되어
// 버튼·업로드 탭이 어려움. device-width로 고정해 모바일에서 정상 동작하게 함.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <SiteNav />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        <footer className="border-t border-border py-8 text-center text-sm text-tertiary">
          © {new Date().getFullYear()} Insurance Insights Board
        </footer>
      </body>
    </html>
  );
}
