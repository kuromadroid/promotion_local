export function TagPill({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1.5 text-sm whitespace-nowrap transition-colors";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${
          active
            ? "bg-(--color-navy) border-(--color-navy) text-white"
            : "bg-white border-(--color-line) text-(--color-ink-soft) hover:border-(--color-navy)"
        }`}
      >
        {label}
      </button>
    );
  }
  return (
    <span
      className={`${base} bg-(--color-snow-muted) border-(--color-line) text-(--color-ink-soft)`}
    >
      {label}
    </span>
  );
}
