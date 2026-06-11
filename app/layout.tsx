import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/feature/SiteNav";

// 카드 타이틀 전용 세리프 — 본문(Pretendard 400/500)과 위계를 분리한다.
// 한글 폰트는 unicode-range 분할 로딩이라 preload 대상이 없어 preload: false.
const notoSerifKr = Noto_Serif_KR({
  weight: ["600"],
  variable: "--font-serif",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Insurance Insights Board",
  description: "보험 배타적 사용권·국내외 보험 정보 분석 자료 게시판",
  icons: { icon: "/brand/tkleen-favicon.svg" },
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
    <html lang="ko" className={notoSerifKr.variable}>
      <body>
        <SiteNav />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
        <footer className="border-t border-border py-10">
          <div className="mx-auto flex max-w-container flex-col items-center gap-3 px-6 text-center">
            {/* tkLeen 브랜드 락업 */}
            <img
              src="/brand/tkleen-lockup.svg"
              alt="tkLeen — AI Workflows · Insurance & Finance"
              width={170}
              height={45}
              className="h-10 w-auto"
            />
            <p className="text-xs text-tertiary">
              © {new Date().getFullYear()} Insurance Insights Board · tkLeen
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
