import { getHotel, getRestaurantsForHotel } from "@/lib/repositories";
import { getMessages, getServerLocale } from "@/lib/i18n/locale";
import { TrackOnMount } from "@/components/TrackOnMount";
import { EditorialHomeV2 } from "@/components/editorial/EditorialHomeV2";

export default async function HotelTopPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string }>;
  searchParams: Promise<{ qr?: string }>;
}) {
  const { hotelId } = await params;
  const { qr } = await searchParams;
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  const [hotel, restaurants] = await Promise.all([
    getHotel(hotelId),
    getRestaurantsForHotel(hotelId, locale, { sort: "priority" }),
  ]);
  const topRestaurants = restaurants.map((restaurant) => ({
    ...restaurant,
    photos: restaurant.photos.slice(0, 1),
  }));

  return (
    <>
      <TrackOnMount event={{ eventName: "page_view", hotelId, language: locale }} />
      {qr && <TrackOnMount event={{ eventName: "qr_scan", hotelId, meta: { qrId: qr } }} />}
      <EditorialHomeV2
        hotelId={hotelId}
        hotelName={hotel?.name ?? ""}
        heroPhotos={hotel?.heroPhotos ?? []}
        restaurants={topRestaurants}
        messages={messages}
        locale={locale}
      />
    </>
  );
}
