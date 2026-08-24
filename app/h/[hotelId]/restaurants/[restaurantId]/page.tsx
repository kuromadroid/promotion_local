import { notFound } from "next/navigation";
import { getRestaurantForHotel } from "@/lib/repositories";
import { getServerLocale } from "@/lib/i18n/locale";
import { RestaurantDetailV3 } from "@/components/detail/RestaurantDetailV3";
import { TrackOnMount } from "@/components/TrackOnMount";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; restaurantId: string }>;
}) {
  const { hotelId, restaurantId } = await params;
  const locale = await getServerLocale();

  const restaurant = await getRestaurantForHotel(hotelId, restaurantId, locale);
  if (!restaurant) notFound();

  return (
    <>
      <TrackOnMount
        event={{
          eventName: "restaurant_detail_view",
          hotelId,
          restaurantId,
          language: locale,
        }}
      />
      <RestaurantDetailV3 hotelId={hotelId} restaurant={restaurant} />
    </>
  );
}
