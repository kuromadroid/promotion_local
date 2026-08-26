import Link from "next/link";
import { AnalyticsPeriod, AnalyticsPeriodKey } from "@/lib/adminAnalytics";

const PERIOD_OPTIONS: Array<{ key: AnalyticsPeriodKey; label: string }> = [
  { key: "7d", label: "過去7日" },
  { key: "30d", label: "過去30日" },
  { key: "this_month", label: "今月" },
  { key: "last_month", label: "先月" },
  { key: "all", label: "全期間" },
];

export function PeriodFilter({ path, period }: { path: string; period: AnalyticsPeriod }) {
  return (
    <div className="rounded-2xl border border-(--color-line) bg-white p-4">
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => {
          const active = period.key === option.key;
          return (
            <Link
              key={option.key}
              href={`${path}?period=${option.key}`}
              className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                active
                  ? "bg-(--color-navy) text-white"
                  : "bg-(--color-snow-muted) text-(--color-ink-soft) hover:text-(--color-navy)"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      <form action={path} method="get" className="mt-4 flex flex-wrap items-end gap-3 border-t border-(--color-line) pt-4">
        <input type="hidden" name="period" value="custom" />
        <label className="text-xs font-medium text-(--color-ink-soft)">
          開始日
          <input
            type="date"
            name="start"
            required
            defaultValue={period.startDate}
            className="mt-1 block rounded-lg border border-(--color-line) bg-white px-3 py-2 text-sm text-(--color-ink)"
          />
        </label>
        <label className="text-xs font-medium text-(--color-ink-soft)">
          終了日
          <input
            type="date"
            name="end"
            required
            defaultValue={period.endDate}
            className="mt-1 block rounded-lg border border-(--color-line) bg-white px-3 py-2 text-sm text-(--color-ink)"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-(--color-coral) px-4 py-2 text-sm font-bold text-white hover:bg-(--color-coral-deep)"
        >
          この期間で表示
        </button>
        <span className="pb-2 text-xs text-(--color-ink-soft)">現在：{period.label}</span>
      </form>
    </div>
  );
}

export function MetricCard({
  label,
  sessions,
  events,
  emphasis = false,
  note,
}: {
  label: string;
  sessions: number;
  events?: number;
  emphasis?: boolean;
  note?: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        emphasis
          ? "border-(--color-coral)/35 bg-[#fff5f1]"
          : "border-(--color-line) bg-white"
      }`}
    >
      <div className="text-xs font-bold text-(--color-ink-soft)">{label}</div>
      <div className={`mt-2 text-3xl font-black tabular-nums ${emphasis ? "text-(--color-coral-deep)" : "text-(--color-navy)"}`}>
        {sessions.toLocaleString()}
      </div>
      <div className="mt-1 text-xs text-(--color-ink-soft)">
        {events === undefined ? "利用セッション" : `利用セッション ／ 総回数 ${events.toLocaleString()}`}
      </div>
      {note && <div className="mt-2 text-[11px] leading-5 text-(--color-ink-soft)">{note}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-(--color-line) bg-white p-5">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-(--color-navy)">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-(--color-ink-soft)">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function conversionRate(numerator: number, denominator: number) {
  if (denominator === 0) return null;
  return (numerator / denominator) * 100;
}

export function formatRate(rate: number | null) {
  return rate === null ? "—" : `${rate.toFixed(1)}%`;
}

export function SessionWithTotal({ sessions, events }: { sessions: number; events?: number }) {
  return (
    <div className="text-right">
      <div className="font-bold tabular-nums text-(--color-ink)">{sessions.toLocaleString()}</div>
      {events !== undefined && (
        <div className="mt-0.5 text-[10px] tabular-nums text-(--color-ink-soft)">総回数 {events.toLocaleString()}</div>
      )}
    </div>
  );
}
