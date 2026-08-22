import { supabaseAdmin } from "@/lib/supabase/adminClient";

const WINDOW_DAYS = 30;
const MAX_ROWS = 8000;

const CLICK_EVENTS = ["map_click", "reservation_click", "instagram_click", "phone_click"] as const;
const VIEW_EVENTS = ["restaurant_view", "restaurant_detail_view"] as const;

interface RestaurantStats {
  id: string;
  views: number;
  map: number;
  reservation: number;
  instagram: number;
  phone: number;
  totalClicks: number;
}

interface EventRow {
  event_name: string;
  hotel_id: string | null;
  restaurant_id: string | null;
  path: string | null;
  ip_hash: string | null;
  language: string | null;
  meta: { screen?: string } | null;
  occurred_at: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "English",
  zh: "中文",
  ko: "한국어",
};

function countBy(rows: EventRow[], keyFn: (row: EventRow) => string | null): [string, number][] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function AdminAnalyticsPage() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: events, error }, { data: translations }, { data: hotels }] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("event_name, hotel_id, restaurant_id, path, ip_hash, language, meta, occurred_at")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(MAX_ROWS),
    supabaseAdmin.from("restaurant_translations").select("restaurant_id, locale, name").eq("locale", "ja"),
    supabaseAdmin.from("hotels").select("id, name"),
  ]);

  if (error) throw error;

  const rows = (events ?? []) as EventRow[];
  const restaurantNameById = new Map((translations ?? []).map((t) => [t.restaurant_id, t.name]));
  const hotelNameById = new Map((hotels ?? []).map((h) => [h.id, h.name]));

  const pageViews = rows.filter((r) => r.event_name === "page_view");
  const byPath = countBy(rows, (r) => r.path).slice(0, 12);
  const byHotel = countBy(pageViews, (r) => r.hotel_id);
  const uniqueVisitors = new Set(rows.map((r) => r.ip_hash).filter(Boolean)).size;
  const totalClicks = rows.filter((r) => (CLICK_EVENTS as readonly string[]).includes(r.event_name)).length;

  const languageGateViews = rows.filter(
    (r) => r.event_name === "page_view" && r.meta?.screen === "language_gate"
  ).length;
  const languageSelections = countBy(
    rows.filter((r) => r.event_name === "language_select"),
    (r) => r.language
  );

  const statsByRestaurant = new Map<string, RestaurantStats>();
  const bump = (id: string | null, key: keyof Omit<RestaurantStats, "id" | "totalClicks">) => {
    if (!id) return;
    const s = statsByRestaurant.get(id) ?? {
      id,
      views: 0,
      map: 0,
      reservation: 0,
      instagram: 0,
      phone: 0,
      totalClicks: 0,
    };
    s[key] += 1;
    statsByRestaurant.set(id, s);
  };
  for (const r of rows) {
    if ((VIEW_EVENTS as readonly string[]).includes(r.event_name)) bump(r.restaurant_id, "views");
    else if (r.event_name === "map_click") bump(r.restaurant_id, "map");
    else if (r.event_name === "reservation_click") bump(r.restaurant_id, "reservation");
    else if (r.event_name === "instagram_click") bump(r.restaurant_id, "instagram");
    else if (r.event_name === "phone_click") bump(r.restaurant_id, "phone");
  }
  const restaurantStats = [...statsByRestaurant.values()]
    .map((s) => ({ ...s, totalClicks: s.map + s.reservation + s.instagram + s.phone }))
    .sort((a, b) => b.totalClicks - a.totalClicks || b.views - a.views);
  const totalRestaurantViews = restaurantStats.reduce((sum, s) => sum + s.views, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-bold text-(--color-navy)">アクセス状況</h1>
        <p className="mt-1 text-sm text-(--color-ink-soft)">
          直近{WINDOW_DAYS}日間。同一IP・同一操作は30分以内の重複を除いた件数です。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="ページ閲覧数" value={pageViews.length} />
        <StatTile label="推定ユニーク訪問者" value={uniqueVisitors} />
        <StatTile label="店舗閲覧数" value={totalRestaurantViews} />
        <StatTile label="クリック合計" value={totalClicks} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="アクセスされたURL">
          <RankedList
            rows={byPath}
            empty="まだデータがありません"
            renderLabel={([path]) => <code className="text-xs">{path}</code>}
          />
        </Panel>

        <Panel title="閲覧されたホテルページ">
          <RankedList
            rows={byHotel}
            empty="まだデータがありません"
            renderLabel={([id]) => hotelNameById.get(id) ?? id}
          />
        </Panel>

        <Panel title="言語選択画面">
          <p className="mb-3 text-xs text-(--color-ink-soft)">
            表示回数 <span className="font-bold tabular-nums text-(--color-ink)">{languageGateViews}</span>
          </p>
          <RankedList
            rows={languageSelections}
            empty="まだ選択されていません"
            renderLabel={([code]) => LANGUAGE_LABELS[code] ?? code}
          />
        </Panel>

      </div>

      <Panel title="店舗別 閲覧・クリック内訳">
        {restaurantStats.length === 0 ? (
          <p className="text-sm text-(--color-ink-soft)">まだデータがありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-(--color-line) text-left text-xs text-(--color-ink-soft)">
                  <th className="py-2 pr-3 font-medium">店舗</th>
                  <th className="px-3 py-2 text-right font-medium">閲覧</th>
                  <th className="px-3 py-2 text-right font-medium">Maps</th>
                  <th className="px-3 py-2 text-right font-medium">予約</th>
                  <th className="px-3 py-2 text-right font-medium">Instagram</th>
                  <th className="px-3 py-2 text-right font-medium">電話</th>
                  <th className="py-2 pl-3 text-right font-medium">クリック計</th>
                </tr>
              </thead>
              <tbody>
                {restaurantStats.map((s) => (
                  <tr key={s.id} className="border-b border-(--color-line) last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-(--color-ink)">
                      {restaurantNameById.get(s.id) ?? s.id}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-(--color-ink-soft)">
                      {s.views}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-(--color-ink-soft)">
                      {s.map}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-(--color-ink-soft)">
                      {s.reservation}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-(--color-ink-soft)">
                      {s.instagram}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-(--color-ink-soft)">
                      {s.phone}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-bold tabular-nums text-(--color-coral-deep)">
                      {s.totalClicks}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-(--color-line) bg-white p-4">
      <div className="text-2xl font-bold tabular-nums text-(--color-navy)">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-xs text-(--color-ink-soft)">{label}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-(--color-line) bg-white p-5">
      <h2 className="mb-3 text-sm font-bold text-(--color-navy)">{title}</h2>
      {children}
    </div>
  );
}

function RankedList({
  rows,
  empty,
  renderLabel,
}: {
  rows: [string, number][];
  empty: string;
  renderLabel: (row: [string, number]) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-(--color-ink-soft)">{empty}</p>;
  }
  const max = rows[0][1];
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row[0]} className="flex items-center gap-3 text-sm">
          <span className="min-w-0 flex-1 truncate">{renderLabel(row)}</span>
          <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-(--color-line)">
            <span
              className="block h-full rounded-full bg-(--color-coral)"
              style={{ width: `${Math.max(6, (row[1] / max) * 100)}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-medium tabular-nums text-(--color-ink)">
            {row[1]}
          </span>
        </li>
      ))}
    </ul>
  );
}
