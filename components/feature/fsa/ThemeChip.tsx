import { THEME_BY_ID } from "@/data/japan-fsa/themes";

/** 테마 칩 — 뮤트 팔레트(globals.css --chip-*) 한정 사용 */
export function ThemeChip({
  themeId,
  size = "sm",
  active,
  count,
  onClick,
}: {
  themeId: string;
  size?: "sm" | "md";
  /** 필터 칩으로 쓸 때: 선택 상태 */
  active?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  const theme = THEME_BY_ID.get(themeId);
  if (!theme) return null;

  const style = {
    background: `var(--chip-${theme.color}-bg)`,
    color: `var(--chip-${theme.color}-fg)`,
  } as React.CSSProperties;

  const base =
    size === "sm"
      ? "rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
      : "rounded-full px-3 py-1 text-[12.5px] font-medium";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={`${base} inline-flex items-center gap-1 whitespace-nowrap border transition-colors ${
          active
            ? "border-current"
            : "border-transparent opacity-80 hover:opacity-100"
        }`}
        style={style}
      >
        {theme.name}
        {typeof count === "number" && (
          <span className="opacity-70">{count}</span>
        )}
      </button>
    );
  }

  return (
    <span
      className={`${base} inline-flex items-center whitespace-nowrap`}
      style={style}
    >
      {theme.name}
    </span>
  );
}
