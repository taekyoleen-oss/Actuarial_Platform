#!/usr/bin/env node
// Tesla 토큰 단일 출처. HEX → HSL 변환 후 globals.css 블록을 stdout으로 출력한다.
// 사용: node gen-theme.mjs  (또는 > app/globals.tokens.css 로 리다이렉트)
// 토큰 값이 바뀌면 이 TOKENS만 수정해 단일 출처를 유지한다.

const TOKENS = {
  primary: '#3E6AE1',
  background: '#FFFFFF',
  'page-bg': '#FAFAF7', // 페이지 캔버스 (브랜드 cream)
  'surface-alt': '#F4F4F4',
  foreground: '#171A20',
  'text-body': '#393C41',
  'text-tertiary': '#5C5E62',
  placeholder: '#8E8E8E',
  border: '#EEEEEE',
  'dark-surface': '#171A20',
  'brand-sky': '#4A90C2', // tkLeen 시그니처
  'brand-navy': '#1B2845', // 카드 타이틀
};

function hexToHsl(hex) {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const cssVars = Object.entries(TOKENS).map(([k, v]) => `  --${k}: ${v};`).join('\n');
const hslVars = Object.entries(TOKENS).map(([k, v]) => `  --${k}-hsl: ${hexToHsl(v)};`).join('\n');

process.stdout.write(`:root {
${cssVars}
${hslVars}
  --radius: 4px;
  --radius-cover: 12px;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dur: 0.33s;
  /* 카드 엘리베이션 — 카드 표면 한정(버튼·입력은 그림자 0) */
  --shadow-card: 0 1px 2px rgba(23, 26, 32, 0.04), 0 6px 20px rgba(23, 26, 32, 0.06);
  --shadow-card-hover: 0 2px 4px rgba(23, 26, 32, 0.05), 0 14px 36px rgba(23, 26, 32, 0.1);
}
/* 색상 트랜지션 기본 — 카드 hover lift(box-shadow/transform)만 카드 한정 예외 */
* { transition: color var(--dur) var(--ease), background-color var(--dur) var(--ease), border-color var(--dur) var(--ease); }
`);
