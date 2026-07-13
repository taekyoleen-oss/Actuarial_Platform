// DataLab UI 공용 헬퍼(순수 함수) — 칩 색 배정 · 파일 크기 표기.
// 칩 색은 tweakcn-tesla-theme 뮤트 팔레트(--chip-*) 한정 스코프(칩·강조).

const CHIP_COLORS = [
  "blue",
  "teal",
  "amber",
  "rose",
  "violet",
  "green",
  "slate",
  "cyan",
] as const;

export type ChipColor = (typeof CHIP_COLORS)[number];

/** 라벨(모델·도구 태그) 문자열로 칩 색을 자동·일관 배정한다. */
export function chipColorFor(seed: string): ChipColor {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return CHIP_COLORS[Math.abs(h) % CHIP_COLORS.length];
}

/** 바이트 → KB/MB 사람이 읽는 표기. 값이 없으면 '—'. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes <= 0) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}
