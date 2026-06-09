import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/feature/SiteNav";

export const metadata: Metadata = {
  title: "Insurance Insights Board",
  description: "보험 배타적 사용권·국내외 보험 정보 분석 자료 게시판",
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
