import { chipColorFor } from "./util";

/**
 * 모델·도구 태그 칩 — 뮤트 팔레트(globals.css --chip-*) 한정 사용.
 * 색은 라벨(또는 seed)로 자동·일관 배정.
 */
export function DataChip({
  label,
  seed,
  className = "",
}: {
  label: string;
  seed?: string;
  className?: string;
}) {
  const color = chipColorFor(seed ?? label);
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${className}`}
      style={{
        background: `var(--chip-${color}-bg)`,
        color: `var(--chip-${color}-fg)`,
      }}
    >
      {label}
    </span>
  );
}
