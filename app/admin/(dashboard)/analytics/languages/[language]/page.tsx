import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AnalyticsPeriod,
  AnalyticsSearchParams,
  resolveAnalyticsPeriod,
} from "@/lib/adminAnalytics";
import {
  eventCount,
  getLanguageAnalytics,
  isLanguageKey,
  LANGUAGE_METRIC_COLUMNS,
  languageLabel,
  LanguageFilterRow,
} from "@/lib/adminLanguageAnalytics";
import {
  conversionRate,
  formatRate,
  MetricCard,
  Panel,
  PeriodFilter,
  SessionWithTotal,
} from "@/components/admin/AnalyticsUi";

function periodQuery(period: AnalyticsPeriod) {
  const params = new URLSearchParams({ period: period.key });
  if (period.key === "custom") {
    params.set("start", period.startDate);
    params.set("end", period.endDate);
  }
  return params.toString();
}

// Filters and card views are list-level actions, so the per-restaurant table
// only shows the columns that belong to a single restaurant.
const RESTAURANT_COLUMNS = LANGUAGE_METRIC_COLUMNS.filter(
  (column) => column.event !== "area_filter" && column.event !== "tag_filter"
);

export default async function LanguageAnalyticsDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ language: string }>;
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const language = decodeURIComponent((await params).language);
  if (!isLanguageKey(language)) notFound();

  const period = resolveAnalyticsPeriod(await searchParams);
  const data = await getLanguageAnalytics(period, language);
  const row = data.languages.find((item) => item.language === language);
  const byEvent = row?.byEvent ?? {};
  const view = eventCount(byEvent, "restaurant_detail_view");
  const label = languageLabel(language);
  const areas = data.filters.filter((item) => item.kind === "area");
  const tags = data.filters.filter((item) => item.kind === "tag");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/analytics/languages?${periodQuery(period)}`}
          className="text-xs font-bold text-(--color-ink-soft) hover:text-(--color-coral-deep)"
        >
          ← 言語別一覧へ
        </Link>
        <p className="mt-5 text-xs font-bold tracking-[0.16em] text-(--color-coral-deep)">LANGUAGE REPORT</p>
        <h1 className="mt-1 text-2xl font-black text-(--color-navy)">{label}のゲスト</h1>
        <p className="mt-2 text-sm text-(--color-ink-soft)">{period.label}・日本時間</p>
      </div>

      <PeriodFilter path={`/admin/analytics/languages/${encodeURIComponent(language)}`} period={period} />

      {!row && (
        <div className="rounded-2xl border border-dashed border-(--color-line) bg-white px-5 py-8 text-center">
          <p className="font-bold text-(--color-navy)">この期間の{label}のアクセスデータはまだありません</p>
          <p className="mt-1 text-sm text-(--color-ink-soft)">期間を広げると過去のイベントを確認できます。</p>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="text-sm font-bold text-(--color-navy)">項目別KPI</h2>
          <p className="text-[11px] text-(--color-ink-soft)">大きな数字＝利用セッション</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="High Intent"
            sessions={row?.highIntentSessions ?? 0}
            events={row?.highIntentEvents ?? 0}
            note={`CVR ${formatRate(conversionRate(row?.highIntentSessions ?? 0, view.sessions))}`}
            emphasis
          />
          <MetricCard label="サイト利用" sessions={row?.siteSessions ?? 0} note="匿名セッションIDの異なる数" />
          {LANGUAGE_METRIC_COLUMNS.map((column) => {
            const count = eventCount(byEvent, column.event);
            return (
              <MetricCard
                key={column.event}
                label={column.label}
                sessions={count.sessions}
                events={count.events}
                emphasis={column.event === "reservation_click"}
              />
            );
          })}
        </div>
      </section>

      <Panel title="店舗別" description={`${label}で表示していたゲストの、店舗ごとの反応です。`}>
        {data.restaurants.length === 0 ? (
          <p className="py-8 text-center text-sm text-(--color-ink-soft)">この期間の店舗への反応はありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1020px] text-sm">
              <thead>
                <tr className="border-b border-(--color-line) text-left text-[11px] text-(--color-ink-soft)">
                  <th className="py-3 pr-4 font-medium">店舗</th>
                  {RESTAURANT_COLUMNS.map((column) => (
                    <th key={column.event} className="px-3 py-3 text-right font-medium">{column.label}</th>
                  ))}
                  <th className="px-3 py-3 text-right font-medium">High Intent</th>
                  <th className="py-3 pl-3 text-right font-medium">CVR</th>
                </tr>
              </thead>
              <tbody>
                {data.restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="border-b border-(--color-line) last:border-0">
                    <td className="py-3 pr-4 font-bold text-(--color-navy)">{restaurant.name}</td>
                    {RESTAURANT_COLUMNS.map((column) => {
                      const count = eventCount(restaurant.byEvent, column.event);
                      return (
                        <td key={column.event} className="px-3 py-3">
                          <SessionWithTotal sessions={count.sessions} events={count.events} />
                        </td>
                      );
                    })}
                    <td className="px-3 py-3">
                      <SessionWithTotal sessions={restaurant.highIntentSessions} events={restaurant.highIntentEvents} />
                    </td>
                    <td className="py-3 pl-3 text-right font-black tabular-nums text-(--color-coral-deep)">
                      {formatRate(
                        conversionRate(
                          restaurant.highIntentSessions,
                          eventCount(restaurant.byEvent, "restaurant_detail_view").sessions
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <FilterPanel title="エリア絞り込み" rows={areas} />
        <FilterPanel title="タグ絞り込み" rows={tags} />
      </div>
    </div>
  );
}

function FilterPanel({ title, rows }: { title: string; rows: LanguageFilterRow[] }) {
  return (
    <Panel title={title} description="選ばれた項目ごとの利用セッションと総回数です。">
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--color-ink-soft)">この期間の利用はありません</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--color-line) text-left text-[11px] text-(--color-ink-soft)">
              <th className="py-3 pr-4 font-medium">項目</th>
              <th className="py-3 pl-3 text-right font-medium">利用</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-b border-(--color-line) last:border-0">
                <td className="py-3 pr-4 font-bold text-(--color-navy)">{item.name}</td>
                <td className="py-3 pl-3">
                  <SessionWithTotal sessions={item.sessions} events={item.events} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
