import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AnalyticsPeriod,
  AnalyticsSearchParams,
  getRestaurantAnalytics,
  resolveAnalyticsPeriod,
} from "@/lib/adminAnalytics";
import {
  conversionRate,
  formatRate,
  MetricCard,
  Panel,
  PeriodFilter,
} from "@/components/admin/AnalyticsUi";

function periodQuery(period: AnalyticsPeriod) {
  const params = new URLSearchParams({ period: period.key });
  if (period.key === "custom") {
    params.set("start", period.startDate);
    params.set("end", period.endDate);
  }
  return params.toString();
}

export default async function RestaurantAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ restaurantId: string }>;
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const { restaurantId } = await params;
  const period = resolveAnalyticsPeriod(await searchParams);
  const data = await getRestaurantAnalytics(restaurantId, period);
  if (!data.restaurant.id) notFound();

  const highIntentRate = conversionRate(data.highIntentSessions, data.viewSessions);
  const detailPath = `/admin/analytics/restaurants/${encodeURIComponent(restaurantId)}`;
  const maxDaily = Math.max(
    1,
    ...data.daily.flatMap((day) => [
      day.viewSessions,
      day.mapSessions,
      day.reservationSessions,
      day.highIntentSessions,
    ])
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/analytics?${periodQuery(period)}`}
          className="text-xs font-bold text-(--color-ink-soft) hover:text-(--color-coral-deep)"
        >
          ← Analytics一覧へ
        </Link>
        <p className="mt-5 text-xs font-bold tracking-[0.16em] text-(--color-coral-deep)">RESTAURANT REPORT</p>
        <h1 className="mt-1 text-2xl font-black text-(--color-navy)">{data.restaurant.name}</h1>
        <p className="mt-2 text-sm text-(--color-ink-soft)">対象期間：{period.label}（日本時間）</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-(--color-ink-soft)">掲載ホテル</span>
          {data.listingHotels.length === 0 ? (
            <span className="text-xs text-(--color-ink-soft)">なし</span>
          ) : (
            data.listingHotels.map((hotel) => (
              <span key={hotel.id} className="rounded-full bg-(--color-snow-muted) px-3 py-1 text-xs font-medium text-(--color-navy)">
                {hotel.name}
              </span>
            ))
          )}
        </div>
      </div>

      <PeriodFilter path={detailPath} period={period} />

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-(--color-navy)">成果サマリー</h2>
            <p className="mt-1 text-xs text-(--color-ink-soft)">大きな数字は利用セッション、総回数は補助値です。</p>
          </div>
          <div className="rounded-full bg-[#fff0ea] px-3 py-1.5 text-xs font-black text-(--color-coral-deep)">
            High Intent CVR {formatRate(highIntentRate)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="High Intent" sessions={data.highIntentSessions} events={data.highIntentEvents} emphasis />
          <MetricCard label="予約ページ" sessions={data.reservationSessions} events={data.reservationEvents} emphasis />
          <MetricCard label="Google Maps" sessions={data.mapSessions} events={data.mapEvents} />
          <MetricCard label="店舗閲覧" sessions={data.viewSessions} events={data.viewEvents} />
          <MetricCard label="電話" sessions={data.phoneSessions} events={data.phoneEvents} />
          <MetricCard label="Instagram" sessions={data.instagramSessions} events={data.instagramEvents} />
        </div>
      </section>

      <Panel
        title="日別推移"
        description="各日で反応した利用セッション数です。棒の高さはこの期間内の最大値を基準にしています。"
      >
        {data.daily.length === 0 ? (
          <div className="rounded-xl border border-dashed border-(--color-line) py-12 text-center text-sm text-(--color-ink-soft)">
            この期間の日別データはありません
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-(--color-ink-soft)">
              <Legend color="bg-(--color-navy)" label="閲覧" />
              <Legend color="bg-(--color-gold)" label="Maps" />
              <Legend color="bg-[#5c78b5]" label="予約" />
              <Legend color="bg-(--color-coral)" label="High Intent" />
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex h-56 min-w-max items-end gap-2 border-b border-(--color-line) px-1">
                {data.daily.map((day) => (
                  <div key={day.day} className="flex h-full w-12 shrink-0 flex-col justify-end">
                    <div className="flex h-44 items-end justify-center gap-0.5">
                      <DailyBar label="閲覧" value={day.viewSessions} max={maxDaily} color="bg-(--color-navy)" />
                      <DailyBar label="Maps" value={day.mapSessions} max={maxDaily} color="bg-(--color-gold)" />
                      <DailyBar label="予約" value={day.reservationSessions} max={maxDaily} color="bg-[#5c78b5]" />
                      <DailyBar label="High Intent" value={day.highIntentSessions} max={maxDaily} color="bg-(--color-coral)" />
                    </div>
                    <div className="mt-2 text-center text-[10px] tabular-nums text-(--color-ink-soft)">{formatDay(day.day)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </Panel>

      <Panel
        title="ホテル別の反応"
        description="どのホテルページからこの店舗への反応が生まれたかを、利用セッション単位で表示します。"
      >
        {data.hotelBreakdown.length === 0 ? (
          <p className="py-8 text-center text-sm text-(--color-ink-soft)">この期間のホテル別データはありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-(--color-line) text-left text-[11px] text-(--color-ink-soft)">
                  <th className="py-3 pr-4 font-medium">ホテル</th>
                  <th className="px-3 py-3 text-right font-medium">閲覧</th>
                  <th className="px-3 py-3 text-right font-medium">Maps</th>
                  <th className="px-3 py-3 text-right font-medium">予約</th>
                  <th className="px-3 py-3 text-right font-medium">電話</th>
                  <th className="py-3 pl-3 text-right font-medium">High Intent</th>
                </tr>
              </thead>
              <tbody>
                {data.hotelBreakdown.map((hotel) => (
                  <tr key={hotel.id} className="border-b border-(--color-line) last:border-0">
                    <td className="py-3 pr-4 font-bold text-(--color-navy)">{hotel.name}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.viewSessions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.mapSessions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.reservationSessions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.phoneSessions.toLocaleString()}</td>
                    <td className="py-3 pl-3 text-right font-black tabular-nums text-(--color-coral-deep)">{hotel.highIntentSessions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="アクセス品質"
        description="匿名ネットワークは人数ではありません。ホテルWi-Fiなどでは複数の宿泊者が同じネットワークとして見えるため、テストや不自然な集中の確認だけに使います。"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <QualityStat label="総イベント" value={data.quality.totalEvents} />
          <QualityStat label="利用セッション" value={data.quality.uniqueSessions} />
          <QualityStat label="匿名ネットワーク" value={data.quality.uniqueNetworks} />
          <QualityStat label="1ネットワークあたりセッション" value={data.quality.sessionsPerNetwork} />
          <QualityStat label="1ネットワークあたりイベント" value={data.quality.eventsPerNetwork} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold text-(--color-navy)">イベントが多い匿名ネットワーク</h3>
            {data.quality.networkConcentration.length === 0 ? (
              <p className="mt-3 text-xs text-(--color-ink-soft)">確認できるデータはありません</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.quality.networkConcentration.map((network) => (
                  <li key={network.network} className="flex items-center justify-between gap-4 text-xs">
                    <code className="text-(--color-ink-soft)">匿名 {network.network}…</code>
                    <span className="font-bold tabular-nums text-(--color-ink)">{network.events.toLocaleString()}件</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-(--color-navy)">短時間の大量クリック</h3>
            {data.quality.anomalies.length === 0 ? (
              <p className="mt-3 text-xs text-(--color-ink-soft)">1分間に20件以上のクリック集中はありません</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.quality.anomalies.map((anomaly, index) => (
                  <li key={`${anomaly.kind}-${anomaly.identifier}-${anomaly.minute}-${index}`} className="rounded-lg bg-[#fff5f1] p-3 text-xs">
                    <div className="font-bold text-(--color-coral-deep)">{anomaly.events.toLocaleString()}件 / 1分</div>
                    <div className="mt-1 text-(--color-ink-soft)">
                      {anomaly.kind === "session" ? "同一セッション" : "同一匿名ネットワーク"}・{anomaly.minute}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <p className="mt-6 border-t border-(--color-line) pt-4 text-[11px] leading-5 text-(--color-ink-soft)">
          異常候補は確認用です。該当イベントをAnalyticsの数字から自動除外していません。
        </p>
      </Panel>
    </div>
  );
}

function formatDay(day: string) {
  const [, month, date] = day.split("-");
  return `${Number(month)}/${Number(date)}`;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function DailyBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const height = value === 0 ? 0 : Math.max(5, (value / max) * 100);
  return (
    <span
      className={`block w-2 rounded-t-sm ${color}`}
      style={{ height: `${height}%` }}
      title={`${label} ${value}セッション`}
      aria-label={`${label} ${value}セッション`}
    />
  );
}

function QualityStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl bg-(--color-snow-muted) p-3">
      <div className="text-lg font-black tabular-nums text-(--color-navy)">{value === null ? "—" : value.toLocaleString()}</div>
      <div className="mt-1 text-[10px] leading-4 text-(--color-ink-soft)">{label}</div>
    </div>
  );
}
