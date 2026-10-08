import Link from "next/link";
import {
  AnalyticsPeriod,
  AnalyticsSearchParams,
  resolveAnalyticsPeriod,
} from "@/lib/adminAnalytics";
import {
  eventCount,
  getLanguageAnalytics,
  LANGUAGE_METRIC_COLUMNS,
  languageLabel,
} from "@/lib/adminLanguageAnalytics";
import {
  conversionRate,
  formatRate,
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

export default async function AdminLanguageAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const period = resolveAnalyticsPeriod(await searchParams);
  const data = await getLanguageAnalytics(period);
  const query = periodQuery(period);
  const totalInferred = data.languages.reduce((sum, row) => sum + row.inferredEvents, 0);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/analytics?${query}`}
          className="text-xs font-bold text-(--color-ink-soft) hover:text-(--color-coral-deep)"
        >
          ← Analytics一覧へ
        </Link>
        <p className="mt-5 text-xs font-bold tracking-[0.16em] text-(--color-coral-deep)">LANGUAGE ANALYTICS</p>
        <h1 className="mt-1 text-2xl font-black text-(--color-navy)">言語別の反応</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-(--color-ink-soft)">
          ゲストが選んだ表示言語ごとに、各ボタン・絞り込みの利用セッションと総回数を集計しています。言語名から店舗別・絞り込み別の内訳へ進めます。
        </p>
      </div>

      <PeriodFilter path="/admin/analytics/languages" period={period} />

      <Panel
        title="言語別Analytics"
        description="大きな数字＝利用セッション、小さな数字＝総回数。High IntentはMaps・予約・電話のいずれかを行ったセッションです。"
      >
        {data.languages.length === 0 ? (
          <p className="py-8 text-center text-sm text-(--color-ink-soft)">この期間のアクセスデータはまだありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] text-sm">
              <thead>
                <tr className="border-b border-(--color-line) text-left text-[11px] text-(--color-ink-soft)">
                  <th className="py-3 pr-4 font-medium">言語</th>
                  <th className="px-3 py-3 text-right font-medium">サイト利用</th>
                  {LANGUAGE_METRIC_COLUMNS.map((column) => (
                    <th key={column.event} className="px-3 py-3 text-right font-medium">{column.label}</th>
                  ))}
                  <th className="px-3 py-3 text-right font-medium">High Intent</th>
                  <th className="py-3 pl-3 text-right font-medium">CVR</th>
                </tr>
              </thead>
              <tbody>
                {data.languages.map((row) => (
                  <tr key={row.language} className="border-b border-(--color-line) last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/analytics/languages/${encodeURIComponent(row.language)}?${query}`}
                        className="font-bold text-(--color-navy) underline decoration-(--color-line) underline-offset-4 hover:text-(--color-coral-deep)"
                      >
                        {languageLabel(row.language)}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{row.siteSessions.toLocaleString()}</td>
                    {LANGUAGE_METRIC_COLUMNS.map((column) => {
                      const count = eventCount(row.byEvent, column.event);
                      return (
                        <td key={column.event} className="px-3 py-3">
                          <SessionWithTotal sessions={count.sessions} events={count.events} />
                        </td>
                      );
                    })}
                    <td className="px-3 py-3">
                      <SessionWithTotal sessions={row.highIntentSessions} events={row.highIntentEvents} />
                    </td>
                    <td className="py-3 pl-3 text-right font-black tabular-nums text-(--color-coral-deep)">
                      {formatRate(
                        conversionRate(row.highIntentSessions, eventCount(row.byEvent, "restaurant_detail_view").sessions)
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="rounded-xl bg-(--color-snow-muted) px-4 py-3 text-[11px] leading-5 text-(--color-ink-soft)">
        言語が記録されていないイベント（この期間で{totalInferred.toLocaleString()}件。言語選択前のゲート画面や、機能追加前の過去データ）は、同じセッションで表示していた言語から推定して集計しています。一度も言語を選ばなかったセッションは「不明」に入ります。セッション途中で言語を切り替えた場合、そのセッションは両方の言語に1ずつ数えられます。
      </div>
    </div>
  );
}
