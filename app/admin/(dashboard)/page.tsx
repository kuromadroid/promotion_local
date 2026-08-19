import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { deleteRestaurantAction } from "@/app/admin/actions";
import { DeleteRestaurantButton } from "./DeleteRestaurantButton";

interface RestaurantRow {
  id: string;
  price_min: number;
  price_max: number;
  is_sponsored: boolean;
  areas: { name: Record<string, string> } | null;
  restaurant_translations: { locale: string; name: string }[];
  hotel_restaurants: { hotel_id: string }[];
}

export default async function AdminRestaurantListPage() {
  const [{ data: restaurants, error }, { data: hotels }] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select(
        `id, price_min, price_max, is_sponsored,
         areas ( name ),
         restaurant_translations ( locale, name ),
         hotel_restaurants ( hotel_id )`
      )
      .order("id"),
    supabaseAdmin.from("hotels").select("id, name"),
  ]);

  if (error) throw error;

  const hotelNameById = new Map((hotels ?? []).map((h) => [h.id, h.name]));

  const rows = ((restaurants ?? []) as unknown as RestaurantRow[]).map((r) => {
    const ja = r.restaurant_translations.find((t) => t.locale === "ja");
    const fallback = r.restaurant_translations[0];
    const name = ja?.name ?? fallback?.name ?? r.id;
    const hotelNames = r.hotel_restaurants
      .map((link) => hotelNameById.get(link.hotel_id))
      .filter((n): n is string => Boolean(n));
    return {
      id: r.id,
      name,
      areaName: r.areas?.name?.ja ?? "-",
      priceMin: r.price_min,
      priceMax: r.price_max,
      isSponsored: r.is_sponsored,
      hotelNames,
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-(--color-navy)">店舗一覧 ({rows.length})</h1>
        <Link
          href="/admin/restaurants/new"
          className="rounded-lg bg-(--color-coral) text-white text-sm font-medium px-4 py-2 hover:bg-(--color-coral-deep) transition-colors"
        >
          + 店舗を追加
        </Link>
      </div>

      <div className="bg-white border border-(--color-line) rounded-2xl overflow-hidden">
        {rows.length === 0 && (
          <p className="p-6 text-sm text-(--color-ink-soft)">まだ店舗がありません。</p>
        )}
        <ul className="divide-y divide-(--color-line)">
          {rows.map((r) => (
            <li key={r.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-(--color-ink) truncate">{r.name}</span>
                  {r.isSponsored && (
                    <span className="text-xs bg-(--color-gold)/20 text-(--color-gold) px-2 py-0.5 rounded-full shrink-0">
                      Sponsored
                    </span>
                  )}
                </div>
                <p className="text-sm text-(--color-ink-soft) mt-0.5">
                  {r.areaName} ・ ¥{r.priceMin.toLocaleString()}〜{r.priceMax.toLocaleString()}
                  {r.hotelNames.length > 0 && <> ・ 掲載: {r.hotelNames.join(", ")}</>}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/admin/restaurants/${r.id}/edit`}
                  className="text-sm text-(--color-navy) hover:underline"
                >
                  編集
                </Link>
                <DeleteRestaurantButton
                  restaurantName={r.name}
                  action={async () => {
                    "use server";
                    await deleteRestaurantAction(r.id);
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
