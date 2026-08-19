export function DistanceBadge({
  walkLabel,
  distanceLabel,
  compact = false,
}: {
  walkLabel: string;
  distanceLabel: string;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-(--color-navy) text-white ${
        compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      } font-medium`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-(--color-coral) shrink-0"
      >
        <circle cx="13" cy="4" r="2" />
        <path d="M10.5 21l1-6-2-1.5.5-4L13 8l2 2 3 1" />
        <path d="M9.5 14l-2 1-2 5" />
      </svg>
      {walkLabel}
      <span className="opacity-60">· {distanceLabel}</span>
    </span>
  );
}
