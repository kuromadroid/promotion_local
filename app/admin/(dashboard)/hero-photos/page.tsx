import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { bulkSetHeroPhotosAction } from "@/app/admin/hotelActions";
import { RestaurantPhotoManager } from "@/components/admin/RestaurantPhotoManager";

export default async function HeroPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>;
}) {
  const { done } = await searchParams;

  const { data: hotels, error } = await supabaseAdmin
    .from("hotels")
    .select("id, name, hero_photos")
    .order("name");
  if (error) throw error;

  const rows = hotels ?? [];
  const seedHotel = rows.reduce<(typeof rows)[number] | undefined>((best, h) => {
    const count = (h.hero_photos ?? []).length;
    if (!best || count > (best.hero_photos ?? []).length) return h;
    return best;
  }, undefined);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-(--color-navy)">コラージュ写真の一括管理</h1>
        <p className="mt-1 text-sm text-(--color-ink-soft)">
          トップページのコラージュに使う写真を1か所で選び、チェックしたホテルすべてに同じ写真セットをまとめて反映します。
          反映すると、対象ホテルの「トップページのコラージュ写真」は今回の内容で上書きされます。
        </p>
      </div>

      {done === "1" && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          選択したホテルに反映しました。
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-(--color-ink-soft)">まだホテルが登録されていません。</p>
      ) : (
        <form action={bulkSetHeroPhotosAction} className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-(--color-line) bg-white p-6">
            <span className="block text-sm font-medium text-(--color-ink)">反映先のホテル</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {rows.map((h) => (
                <label
                  key={h.id}
                  className="flex items-center gap-2 rounded-lg border border-(--color-line) px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    name="hotel_ids"
                    value={h.id}
                    defaultChecked
                    className="accent-(--color-coral)"
                  />
                  <span className="truncate">{h.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-(--color-ink-soft)">
                    現在{(h.hero_photos ?? []).length}枚
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-(--color-line) bg-white p-6">
            <RestaurantPhotoManager initialPhotos={seedHotel?.hero_photos ?? []} />
          </section>

          <button
            type="submit"
            className="rounded-lg bg-(--color-coral) px-6 py-2.5 font-medium text-white transition-colors hover:bg-(--color-coral-deep)"
          >
            選択したホテルに一括適用
          </button>
        </form>
      )}
    </div>
  );
}
