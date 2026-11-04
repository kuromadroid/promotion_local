import { RestaurantView } from "@/lib/types";

export function hasCoupon(restaurant: RestaurantView) {
  return Boolean(restaurant.coupon);
}

/** Eye-catching COUPON mark for the top-right corner of a restaurant photo.
 * The photo container must be `position: relative`. */
export function CouponRibbon({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute right-2.5 top-2.5 z-10 rounded-md bg-(--color-coral) px-2.5 py-1 text-xs font-extrabold tracking-wider text-white shadow-lg ring-2 ring-white">
      {label}
    </span>
  );
}
