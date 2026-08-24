import { Locale } from "@/lib/types";

/** Japanese-language reservation systems (e.g. Hotpepper) often don't work for overseas guests, so
 * restaurants can register a separate reservation link for non-Japanese locales. Falls back to the
 * Japanese URL when no dedicated one is set. */
export function resolveReservationUrl(
  restaurant: { reservationUrl?: string; reservationUrlIntl?: string },
  locale: Locale
): string | undefined {
  if (locale === "ja") return restaurant.reservationUrl;
  return restaurant.reservationUrlIntl || restaurant.reservationUrl;
}
