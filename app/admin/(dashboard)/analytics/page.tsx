import { supabaseAdmin } from "@/lib/supabase/adminClient";

const WINDOW_DAYS = 30;
const MAX_ROWS = 8000;

const CLICK_EVENTS = ["map_click", "reservation_click", "instagram_click", "phone_click"] as const;
const VIEW_EVENTS = ["restaurant_view", "restaurant_detail_view"] as const;

const EVENT_LABELS: Record<string, string> = {
  map_click: "Google Mapsを開く",
  reservation_click: "予約リンクをクリック",
  instagram_click: "Instagramを開く",
  phone_click: "電話をかける",
};

interface EventRow {
  event_name: string;
  hotel_id: string | null;
  restaurant_id: string | null;
  path: string | null;
  ip_hash: string | null;
  occurred_at: string;
}

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
      .select("event_name, hotel_id, restaurant_id, path, ip_hash, occurred_at")
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
  const byRestaurant = countBy(
    rows.filter((r) => (VIEW_EVENTS as readonly string[]).includes(r.event_name)),
    (r) => r.restaurant_id
  ).slice(0, 12);
  const byClickType = countBy(
    rows.filter((r) => (CLICK_EVENTS as readonly string[]).includes(r.event_name)),
    (r) => r.event_name
  );
  const byHotel = countBy(pageViews, (r) => r.hotel_id);
  const uniqueVisitors = new Set(rows.map((r) => r.ip_hash).filter(Boolean)).size;
  const totalClicks = rows.filter((r) => (CLICK_EVENTS as readonly string[]).includes(r.event_name)).length;

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
        <StatTile label="店舗閲覧数" value={byRestaurant.reduce((sum, [, n]) => sum + n, 0)} />
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

        <Panel title="よく見られている店舗">
          <RankedList
            rows={byRestaurant}
            empty="まだデータがありません"
            renderLabel={([id]) => restaurantNameById.get(id) ?? id}
          />
        </Panel>

        <Panel title="クリックされた項目">
          <RankedList
            rows={byClickType}
            empty="まだデータがありません"
            renderLabel={([name]) => EVENT_LABELS[name] ?? name}
          />
        </Panel>
      </div>
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
