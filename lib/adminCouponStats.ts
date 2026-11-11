import "server-only";
import { supabaseAdmin } from "@/lib/supabase/adminClient";

export interface CouponCounts {
  /** Times the coupon screen was opened (coupon_open). */
  opens: number;
  /** Distinct guests (analytics sessions) who opened it. */
  openSessions: number;
  /** Taps on 使用する (coupon_use). */
  uses: number;
}

export interface CouponStats extends CouponCounts {
  byRestaurant: Map<string, CouponCounts>;
}

const PAGE_SIZE = 1000;

function emptyCounts(): CouponCounts {
  return { opens: 0, openSessions: 0, uses: 0 };
}

/**
 * Opens and uses of each coupon, overall and per restaurant, from the events
 * table (events are kept for 180 days). Admin browsers are never recorded.
 *
 * Events from before coupons were managed in the admin screen carry no
 * couponId; the only coupon then was the fixed lassi coupon, so they are
 * counted for `legacyCouponId` (the lassi coupon the migration added).
 */
export async function getCouponStats(
  legacyCouponId?: string
): Promise<Map<string, CouponStats>> {
  const rows: Array<{
    event_name: string;
    restaurant_id: string | null;
    session_id: string | null;
    coupon_id: string | null;
  }> = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("event_name, restaurant_id, session_id, coupon_id:meta->>couponId")
      .in("event_name", ["coupon_open", "coupon_use"])
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...((data ?? []) as typeof rows));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const stats = new Map<string, CouponStats>();
  const openSessionSets = new Map<string, Set<string>>();

  for (const row of rows) {
    const couponId = row.coupon_id ?? legacyCouponId;
    if (!couponId) continue;
    let coupon = stats.get(couponId);
    if (!coupon) {
      coupon = { ...emptyCounts(), byRestaurant: new Map() };
      stats.set(couponId, coupon);
    }
    const restaurantKey = row.restaurant_id ?? "unknown";
    let restaurant = coupon.byRestaurant.get(restaurantKey);
    if (!restaurant) {
      restaurant = emptyCounts();
      coupon.byRestaurant.set(restaurantKey, restaurant);
    }

    if (row.event_name === "coupon_use") {
      coupon.uses += 1;
      restaurant.uses += 1;
      continue;
    }

    coupon.opens += 1;
    restaurant.opens += 1;
    if (row.session_id) {
      for (const key of [couponId, `${couponId}:${restaurantKey}`]) {
        let set = openSessionSets.get(key);
        if (!set) openSessionSets.set(key, (set = new Set()));
        set.add(row.session_id);
      }
    }
  }

  for (const [couponId, coupon] of stats) {
    coupon.openSessions = openSessionSets.get(couponId)?.size ?? 0;
    for (const [restaurantId, restaurant] of coupon.byRestaurant) {
      restaurant.openSessions = openSessionSets.get(`${couponId}:${restaurantId}`)?.size ?? 0;
    }
  }

  return stats;
}
