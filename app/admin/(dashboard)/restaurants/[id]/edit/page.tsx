import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { updateRestaurantAction } from "@/app/admin/actions";
import { RestaurantForm, RestaurantFormInitial } from "../../RestaurantForm";
import { Area, Hotel, Tag } from "@/lib/types";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    { data: areas },
    { data: tags },
    { data: hotels },
    { data: restaurant },
    { data: translations },
    { data: restaurantTags },
    { data: hotelLinks },
  ] = await Promise.all([
    supabaseAdmin.from("areas").select("id, display_order, name").order("display_order"),
    supabaseAdmin.from("tags").select("id, type, name"),
    supabaseAdmin.from("hotels").select("id, name, area_id, latitude, longitude"),
    supabaseAdmin.from("restaurants").select("*").eq("id", id).maybeSingle(),
    supabaseAdmin.from("restaurant_translations").select("*").eq("restaurant_id", id),
    supabaseAdmin.from("restaurant_tags").select("tag_id").eq("restaurant_id", id),
    supabaseAdmin.from("hotel_restaurants").select("hotel_id").eq("restaurant_id", id),
  ]);

  if (!restaurant) notFound();

  const ja = (translations ?? []).find((t) => t.locale === "ja");
  const en = (translations ?? []).find((t) => t.locale === "en");
  const zhCN = (translations ?? []).find((t) => t.locale === "zh-CN");
  const zhTW = (translations ?? []).find((t) => t.locale === "zh-TW");
  const ko = (translations ?? []).find((t) => t.locale === "ko");

  const initial: RestaurantFormInitial = {
    areaId: restaurant.area_id,
    priceMin: restaurant.price_min,
    priceMax: restaurant.price_max,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    phone: restaurant.phone ?? "",
    googleMapsUrl: restaurant.google_maps_url ?? "",
    reservationUrl: restaurant.reservation_url ?? "",
    reservationUrlIntl: restaurant.reservation_url_intl ?? "",
    instagramUrl: restaurant.instagram_url ?? "",
    openingHours: restaurant.opening_hours ?? "",
    closedDays: restaurant.closed_days ?? "",
    isSponsored: restaurant.is_sponsored,
    priority: restaurant.priority ?? 50,
    photos: restaurant.photos ?? [],
    nameJa: ja?.name ?? "",
    descriptionJa: ja?.description ?? "",
    recommendedDishJa: ja?.recommended_dish ?? "",
    nameEn: en?.name ?? "",
    descriptionEn: en?.description ?? "",
    recommendedDishEn: en?.recommended_dish ?? "",
    nameZhCN: zhCN?.name ?? "",
    descriptionZhCN: zhCN?.description ?? "",
    recommendedDishZhCN: zhCN?.recommended_dish ?? "",
    nameZhTW: zhTW?.name ?? "",
    descriptionZhTW: zhTW?.description ?? "",
    recommendedDishZhTW: zhTW?.recommended_dish ?? "",
    nameKo: ko?.name ?? "",
    descriptionKo: ko?.description ?? "",
    recommendedDishKo: ko?.recommended_dish ?? "",
    tagIds: (restaurantTags ?? []).map((t) => t.tag_id),
    hotelIds: (hotelLinks ?? []).map((h) => h.hotel_id),
  };

  return (
    <div>
      <h1 className="text-lg font-bold text-(--color-navy) mb-6">店舗を編集</h1>
      <RestaurantForm
        action={updateRestaurantAction.bind(null, id)}
        areas={(areas ?? []) as unknown as Area[]}
        tags={(tags ?? []) as unknown as Tag[]}
        hotels={(hotels ?? []) as unknown as Hotel[]}
        initial={initial}
        submitLabel="更新する"
      />
    </div>
  );
}
