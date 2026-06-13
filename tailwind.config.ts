import type { Config } from "tailwindcss";

// Tesla 토큰 → Tailwind. 색상은 globals.css의 CSS 변수를 참조한다(단일 출처).
// 그림자는 카드 엘리베이션(shadow-card/-hover)만 허용 — 버튼·입력은 그림자 0 유지.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        primary: { DEFAULT: "var(--primary)", foreground: "#FFFFFF" },
        background: "var(--background)",
        surface: "var(--surface-alt)",
        foreground: "var(--foreground)",
        body: "var(--text-body)",
        tertiary: "var(--text-tertiary)",
        placeholder: "var(--placeholder)",
        border: "var(--border)",
        "dark-surface": "var(--dark-surface)",
        "brand-sky": "var(--brand-sky)",
        "brand-navy": "var(--brand-navy)",
      },
      boxShadow: {
        // 카드 엘리베이션 2단 — globals.css 변수가 단일 출처
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        // v2: 스티키 바·플로팅 패널 한정
        float: "var(--shadow-float)",
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "-apple-system", "system-ui", "sans-serif"],
      },
      fontWeight: {
        // v2(2026-06-13): 본문 400/500 + 헤딩 위계 600/700 허용 (300 금지 유지)
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        cover: "var(--radius-cover)",
      },
      transitionTimingFunction: {
        tesla: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: { tesla: "330ms" },
      maxWidth: { container: "1440px" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
