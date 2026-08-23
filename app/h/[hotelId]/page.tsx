import { getHotel, getRestaurantsForHotel } from "@/lib/repositories";
import { getMessages, getServerLocale } from "@/lib/i18n/locale";
import { TrackOnMount } from "@/components/TrackOnMount";
import { EditorialHome } from "@/components/editorial/EditorialHome";

export default async function HotelTopPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const locale = await getServerLocale();
  const messages = getMessages(locale);

  const [hotel, restaurants] = await Promise.all([
    getHotel(hotelId),
    getRestaurantsForHotel(hotelId, locale, { sort: "priority" }),
  ]);

  return (
    <>
      <TrackOnMount event={{ eventName: "page_view", hotelId, language: locale }} />
      <EditorialHome
        hotelId={hotelId}
        hotelName={hotel?.name ?? ""}
        restaurants={restaurants}
        messages={messages}
      />
    </>
  );
}
