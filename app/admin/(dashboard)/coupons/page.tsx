import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { deleteCouponAction } from "@/app/admin/couponActions";
import { DeleteCouponButton } from "./DeleteCouponButton";
import { getRestaurantOptions } from "./restaurantOptions";

export default async function AdminCouponsPage() {
  const [{ data: coupons, error }, restaurants] = await Promise.all([
    supabaseAdmin.from("coupons").select("*").order("created_at", { ascending: false }),
    getRestaurantOptions(),
  ]);
  const restaurantNameById = new Map(restaurants.map((r) => [r.id, r.name]));

  // Taps on 使用する, recorded as coupon_use events (events are kept for 180 days).
  const useCounts = new Map(
    await Promise.all(
      (coupons ?? []).map(async (coupon) => {
        const { count } = await supabaseAdmin
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("event_name", "coupon_use")
          .eq("meta->>couponId", coupon.id);
        return [coupon.id, count ?? 0] as const;
      })
    )
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-(--color-navy)">クーポン ({coupons?.length ?? 0})</h1>
        {!error && (
          <Link
            href="/admin/coupons/new"
            className="rounded-lg bg-(--color-coral) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-deep)"
          >
            + クーポンを追加
          </Link>
        )}
      </div>

      <p className="mb-6 text-sm text-(--color-ink-soft)">
        今はUI確認用ホテルにだけ表示されます。使用回数は「使用する」が押された回数で、直近180日分です。
      </p>

      {error ? (
        <p className="rounded-2xl border border-(--color-line) bg-white p-6 text-sm text-(--color-coral-deep)">
          クーポン用のテーブルがまだありません。Supabase の SQL Editor で
          <code className="mx-1">supabase/migrations/202611040002_coupons.sql</code>
          を実行してください。
        </p>
      ) : !coupons || coupons.length === 0 ? (
        <p className="text-sm text-(--color-ink-soft)">まだクーポンがありません。</p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {coupons.map((coupon) => {
            const name = (coupon.offer as { ja: string }).ja;
            const restaurantIds = coupon.restaurant_ids as string[];
            return (
              <li key={coupon.id} className="flex gap-4 rounded-2xl border border-(--color-line) bg-white p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coupon.image_url} alt="" className="h-24 w-20 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold text-(--color-ink)">{name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-(--color-navy)/10 px-2 py-0.5 text-xs font-bold text-(--color-navy)">
                      使用 {(useCounts.get(coupon.id) ?? 0).toLocaleString()}
                    </span>
                    {!coupon.is_active && (
                      <span className="rounded-full bg-(--color-line) px-2 py-0.5 text-xs text-(--color-ink-soft)">
                        非公開
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-(--color-ink-soft)">
                    {restaurantIds.length > 0
                      ? restaurantIds.map((id) => restaurantNameById.get(id) ?? id).join("、")
                      : "使える店がありません"}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Link href={`/admin/coupons/${coupon.id}/edit`} className="text-sm text-(--color-navy) hover:underline">
                      編集
                    </Link>
                    <DeleteCouponButton
                      couponName={name}
                      action={async () => {
                        "use server";
                        await deleteCouponAction(coupon.id);
                      }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
