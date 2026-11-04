import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { updateCouponAction } from "@/app/admin/couponActions";
import { CouponForm, CouponFormInitial } from "../../CouponForm";
import { getRestaurantOptions } from "../../restaurantOptions";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data: coupon }, restaurants] = await Promise.all([
    supabaseAdmin.from("coupons").select("*").eq("id", id).maybeSingle(),
    getRestaurantOptions(),
  ]);
  if (!coupon) notFound();

  const initial: CouponFormInitial = {
    offer: coupon.offer,
    terms: coupon.terms,
    imageUrl: coupon.image_url,
    restaurantIds: coupon.restaurant_ids,
    isActive: coupon.is_active,
  };

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-(--color-navy)">クーポンを編集</h1>
      <CouponForm
        action={updateCouponAction.bind(null, id)}
        restaurants={restaurants}
        initial={initial}
        submitLabel="更新する"
      />
    </div>
  );
}
