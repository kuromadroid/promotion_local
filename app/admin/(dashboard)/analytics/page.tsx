import Link from "next/link";
import {
  AnalyticsPeriod,
  AnalyticsSearchParams,
  getAnalyticsOverview,
  resolveAnalyticsPeriod,
} from "@/lib/adminAnalytics";
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

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearchParams>;
}) {
  const period = resolveAnalyticsPeriod(await searchParams);
  const data = await getAnalyticsOverview(period);
  const { summary } = data;
  const viewRate = conversionRate(summary.viewSessions, summary.siteSessions);
  const highIntentRate = conversionRate(summary.highIntentSessions, summary.viewSessions);
  const isEmpty = summary.siteSessions === 0 && summary.viewEvents === 0 && summary.highIntentEvents === 0;
  const query = periodQuery(period);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold tracking-[0.16em] text-(--color-coral-deep)">SALES ANALYTICS</p>
        <h1 className="mt-1 text-2xl font-black text-(--color-navy)">掲載店舗への反応</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-(--color-ink-soft)">
          営業成果は「利用セッション」を主指標にしています。同じセッション内で複数回押された場合も、利用セッションは1として集計します。
        </p>
      </div>

      <PeriodFilter path="/admin/analytics" period={period} />

      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-(--color-line) bg-white px-5 py-8 text-center">
          <p className="font-bold text-(--color-navy)">この期間のアクセスデータはまだありません</p>
          <p className="mt-1 text-sm text-(--color-ink-soft)">期間を広げると過去の総イベントを確認できます。</p>
        </div>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-(--color-navy)">全体KPI</h2>
            <p className="mt-1 text-xs text-(--color-ink-soft)">{period.label}・日本時間</p>
          </div>
          <p className="text-[11px] text-(--color-ink-soft)">大きな数字＝利用セッション</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="High Intent" sessions={summary.highIntentSessions} events={summary.highIntentEvents} emphasis />
          <MetricCard label="サイト利用" sessions={summary.siteSessions} note="匿名セッションIDの異なる数" />
          <MetricCard label="店舗閲覧" sessions={summary.viewSessions} events={summary.viewEvents} />
          <MetricCard label="予約ページ" sessions={summary.reservationSessions} events={summary.reservationEvents} emphasis />
          <MetricCard label="Google Maps" sessions={summary.mapSessions} events={summary.mapEvents} />
          <MetricCard label="電話" sessions={summary.phoneSessions} events={summary.phoneEvents} />
          <MetricCard label="Instagram" sessions={summary.instagramSessions} events={summary.instagramEvents} />
        </div>
      </section>

      <Panel
        title="営業ファネル"
        description="閲覧率とHigh Intent CVRは、イベント回数ではなく利用セッションだけで算出しています。"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <FunnelStep index="01" label="サイト利用" value={summary.siteSessions} rateLabel="起点" />
          <FunnelStep index="02" label="店舗を閲覧" value={summary.viewSessions} rateLabel={`閲覧率 ${formatRate(viewRate)}`} />
          <FunnelStep
            index="03"
            label="High Intent"
            value={summary.highIntentSessions}
            rateLabel={`CVR ${formatRate(highIntentRate)}`}
            emphasis
          />
        </div>
      </Panel>

      <Panel
        title="店舗別Analytics"
        description="High IntentはMaps・予約・電話のいずれかを行ったセッションです。店舗名から営業説明用の詳細へ進めます。"
      >
        {data.restaurants.length === 0 ? (
          <p className="py-8 text-center text-sm text-(--color-ink-soft)">登録店舗がありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead>
                <tr className="border-b border-(--color-line) text-left text-[11px] text-(--color-ink-soft)">
                  <th className="py-3 pr-4 font-medium">店舗</th>
                  <th className="px-3 py-3 text-right font-medium">掲載ホテル</th>
                  <th className="px-3 py-3 text-right font-medium">閲覧</th>
                  <th className="px-3 py-3 text-right font-medium">Maps</th>
                  <th className="px-3 py-3 text-right font-medium">予約</th>
                  <th className="px-3 py-3 text-right font-medium">電話</th>
                  <th className="px-3 py-3 text-right font-medium">Instagram</th>
                  <th className="px-3 py-3 text-right font-medium">High Intent</th>
                  <th className="py-3 pl-3 text-right font-medium">CVR</th>
                </tr>
              </thead>
              <tbody>
                {data.restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="border-b border-(--color-line) last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/analytics/restaurants/${encodeURIComponent(restaurant.id)}?${query}`}
                        className="font-bold text-(--color-navy) underline decoration-(--color-line) underline-offset-4 hover:text-(--color-coral-deep)"
                      >
                        {restaurant.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-(--color-ink-soft)">{restaurant.listingHotels.toLocaleString()}</td>
                    <td className="px-3 py-3"><SessionWithTotal sessions={restaurant.viewSessions} events={restaurant.viewEvents} /></td>
                    <td className="px-3 py-3"><SessionWithTotal sessions={restaurant.mapSessions} events={restaurant.mapEvents} /></td>
                    <td className="px-3 py-3"><SessionWithTotal sessions={restaurant.reservationSessions} events={restaurant.reservationEvents} /></td>
                    <td className="px-3 py-3"><SessionWithTotal sessions={restaurant.phoneSessions} events={restaurant.phoneEvents} /></td>
                    <td className="px-3 py-3"><SessionWithTotal sessions={restaurant.instagramSessions} events={restaurant.instagramEvents} /></td>
                    <td className="px-3 py-3"><SessionWithTotal sessions={restaurant.highIntentSessions} events={restaurant.highIntentEvents} /></td>
                    <td className="py-3 pl-3 text-right font-black tabular-nums text-(--color-coral-deep)">
                      {formatRate(conversionRate(restaurant.highIntentSessions, restaurant.viewSessions))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        title="ホテル別Analytics"
        description="各ホテルページを起点にした利用セッションです。High Intent CVRは店舗閲覧セッションを分母にしています。"
      >
        {data.hotels.length === 0 ? (
          <p className="py-8 text-center text-sm text-(--color-ink-soft)">登録ホテルがありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-(--color-line) text-left text-[11px] text-(--color-ink-soft)">
                  <th className="py-3 pr-4 font-medium">ホテル</th>
                  <th className="px-3 py-3 text-right font-medium">サイト利用</th>
                  <th className="px-3 py-3 text-right font-medium">店舗閲覧</th>
                  <th className="px-3 py-3 text-right font-medium">Maps</th>
                  <th className="px-3 py-3 text-right font-medium">予約</th>
                  <th className="px-3 py-3 text-right font-medium">電話</th>
                  <th className="px-3 py-3 text-right font-medium">High Intent</th>
                  <th className="py-3 pl-3 text-right font-medium">CVR</th>
                </tr>
              </thead>
              <tbody>
                {data.hotels.map((hotel) => (
                  <tr key={hotel.id} className="border-b border-(--color-line) last:border-0">
                    <td className="py-3 pr-4 font-bold text-(--color-navy)">{hotel.name}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.siteSessions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.viewSessions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.mapSessions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.reservationSessions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{hotel.phoneSessions.toLocaleString()}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{hotel.highIntentSessions.toLocaleString()}</td>
                    <td className="py-3 pl-3 text-right font-black tabular-nums text-(--color-coral-deep)">
                      {formatRate(conversionRate(hotel.highIntentSessions, hotel.viewSessions))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="rounded-xl bg-(--color-snow-muted) px-4 py-3 text-[11px] leading-5 text-(--color-ink-soft)">
        利用セッションはsession_id導入後のイベントを対象にします。導入前の履歴は総回数に残りますが、利用セッションには含まれません。
      </div>
    </div>
  );
}

function FunnelStep({
  index,
  label,
  value,
  rateLabel,
  emphasis = false,
}: {
  index: string;
  label: string;
  value: number;
  rateLabel: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 ${emphasis ? "bg-(--color-coral) text-white" : "bg-(--color-snow-muted)"}`}>
      <div className={`text-[10px] font-bold tracking-[0.14em] ${emphasis ? "text-white/70" : "text-(--color-ink-soft)"}`}>{index}</div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-bold">{label}</div>
          <div className="mt-1 text-3xl font-black tabular-nums">{value.toLocaleString()}</div>
        </div>
        <div className={`pb-1 text-xs font-bold ${emphasis ? "text-white" : "text-(--color-coral-deep)"}`}>{rateLabel}</div>
      </div>
    </div>
  );
}
