import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { deleteCouponAction } from "@/app/admin/couponActions";
import { DeleteCouponButton } from "./DeleteCouponButton";
import { getRestaurantOptions } from "./restaurantOptions";
import { CouponStats, getCouponStats } from "@/lib/adminCouponStats";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-(--color-navy)/5 px-3 py-2">
      <p className="whitespace-nowrap text-[11px] text-(--color-ink-soft)">{label}</p>
      <p className="text-lg font-bold text-(--color-navy)">{value.toLocaleString()}</p>
    </div>
  );
}

function rate(uses: number, sessions: number) {
  return sessions === 0 ? "—" : `${Math.round((uses / sessions) * 100)}%`;
}

export default async function AdminCouponsPage() {
  const [{ data: coupons, error }, restaurants] = await Promise.all([
    supabaseAdmin.from("coupons").select("*").order("created_at", { ascending: false }),
    getRestaurantOptions(),
  ]);
  const restaurantNameById = new Map(restaurants.map((r) => [r.id, r.name]));

  // Opens (coupon_open) and taps on 使用する (coupon_use); events are kept for 180 days.
  // The lassi coupon added by the migration (the oldest one with its image) gets
  // the opens and uses recorded before coupons had ids.
  const legacyCoupon = [...(coupons ?? [])]
    .reverse()
    .find((coupon) => coupon.image_url === "/coupon/lassi.webp");
  const stats = error ? new Map<string, CouponStats>() : await getCouponStats(legacyCoupon?.id);

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
        今はUI確認用ホテルにだけ表示されます。数値は直近180日分で、管理画面にログイン中のブラウザからの操作は含みません。
        <br />
        アクセス＝クーポン画面が開かれた回数、人数＝開いた人（端末）の数、使用＝「使用する」が押された回数、使用率＝使用 ÷ 人数。
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
            const stat: CouponStats | undefined = stats.get(coupon.id);
            const breakdownIds = [
              ...restaurantIds,
              ...[...(stat?.byRestaurant.keys() ?? [])].filter((id) => !restaurantIds.includes(id)),
            ];
            return (
              <li key={coupon.id} className="rounded-2xl border border-(--color-line) bg-white p-5">
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coupon.image_url} alt="" className="h-24 w-20 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-(--color-ink)">{name}</h2>
                    {!coupon.is_active && (
                      <span className="mt-1 inline-block rounded-full bg-(--color-line) px-2 py-0.5 text-xs text-(--color-ink-soft)">
                        非公開
                      </span>
                    )}
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
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  <Stat label="アクセス" value={stat?.opens ?? 0} />
                  <Stat label="人数" value={stat?.openSessions ?? 0} />
                  <Stat label="使用" value={stat?.uses ?? 0} />
                  <div className="rounded-xl bg-(--color-navy)/5 px-3 py-2">
                    <p className="whitespace-nowrap text-[11px] text-(--color-ink-soft)">使用率</p>
                    <p className="text-lg font-bold text-(--color-navy)">
                      {rate(stat?.uses ?? 0, stat?.openSessions ?? 0)}
                    </p>
                  </div>
                </div>

                {breakdownIds.length > 0 && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-(--color-navy)">店舗別</summary>
                    <table className="mt-2 w-full text-xs">
                      <thead className="whitespace-nowrap text-(--color-ink-soft)">
                        <tr>
                          <th className="py-1 text-left font-normal">店舗</th>
                          <th className="py-1 pl-2 text-right font-normal">アクセス</th>
                          <th className="py-1 pl-2 text-right font-normal">人数</th>
                          <th className="py-1 pl-2 text-right font-normal">使用</th>
                          <th className="py-1 pl-2 text-right font-normal">使用率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {breakdownIds.map((id) => {
                          const row = stat?.byRestaurant.get(id);
                          return (
                            <tr key={id} className="border-t border-(--color-line)">
                              <td className="py-1 pr-2">
                                {id === "unknown" ? "不明" : restaurantNameById.get(id) ?? id}
                                {id !== "unknown" && !restaurantIds.includes(id) && (
                                  <span className="ml-1 text-(--color-ink-soft)">（対象外）</span>
                                )}
                              </td>
                              <td className="py-1 pl-2 text-right">{(row?.opens ?? 0).toLocaleString()}</td>
                              <td className="py-1 pl-2 text-right">{(row?.openSessions ?? 0).toLocaleString()}</td>
                              <td className="py-1 pl-2 text-right">{(row?.uses ?? 0).toLocaleString()}</td>
                              <td className="py-1 pl-2 text-right">{rate(row?.uses ?? 0, row?.openSessions ?? 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
