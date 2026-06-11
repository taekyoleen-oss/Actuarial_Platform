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
      },
      fontFamily: {
        sans: ["Pretendard", "Inter", "-apple-system", "system-ui", "sans-serif"],
        // 카드 타이틀 전용 세리프 (next/font가 --font-serif 주입)
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      fontWeight: {
        // 400/500만 사용 (700·300 금지)
        normal: "400",
        medium: "500",
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
