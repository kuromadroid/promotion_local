import { createCouponAction } from "@/app/admin/couponActions";
import { CouponForm } from "../CouponForm";
import { getRestaurantOptions } from "../restaurantOptions";

export default async function NewCouponPage() {
  const restaurants = await getRestaurantOptions();

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-(--color-navy)">クーポンを追加</h1>
      <CouponForm action={createCouponAction} restaurants={restaurants} submitLabel="追加する" />
    </div>
  );
}
