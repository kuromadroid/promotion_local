"use client";

import { useLocale } from "@/components/LocaleProvider";
import { trackEvent } from "@/lib/analytics";

export function CTAButtons({
  hotelId,
  restaurantId,
  googleMapsUrl,
  reservationUrl,
  instagramUrl,
  phone,
}: {
  hotelId: string;
  restaurantId: string;
  googleMapsUrl?: string;
  reservationUrl?: string;
  instagramUrl?: string;
  phone?: string;
}) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {googleMapsUrl && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent({ eventName: "map_click", hotelId, restaurantId })
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-(--color-navy) px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
        >
          📍 {t("viewOnMap")}
        </a>
      )}
      {reservationUrl && (
        <a
          href={reservationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent({
              eventName: "reservation_click",
              hotelId,
              restaurantId,
            })
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-(--color-coral) px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
        >
          📅 {t("makeReservation")}
        </a>
      )}
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent({
              eventName: "instagram_click",
              hotelId,
              restaurantId,
            })
          }
          className="flex items-center justify-center gap-2 rounded-xl border border-(--color-line) bg-white px-5 py-3.5 text-sm font-semibold text-(--color-ink) transition-transform active:scale-[0.98]"
        >
          📷 {t("viewInstagram")}
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          onClick={() =>
            trackEvent({ eventName: "phone_click", hotelId, restaurantId })
          }
          className="flex items-center justify-center gap-2 rounded-xl border border-(--color-line) bg-white px-5 py-3.5 text-sm font-semibold text-(--color-ink) transition-transform active:scale-[0.98]"
        >
          📞 {t("callRestaurant")}
        </a>
      )}
    </div>
  );
}
