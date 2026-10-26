import { Locale } from "@/lib/types";

/** Gourmet portal sites we don't send guests to for booking. Google Maps and a restaurant's own
 * site/booking system are still allowed. */
const BLOCKED_RESERVATION_HOSTS = ["tabelog.com", "hotpepper.jp", "retty.me"];

/** HTML `pattern` for the admin form, rejecting URLs on a blocked host. */
export const ALLOWED_RESERVATION_URL_PATTERN = `(?!.*(?:${BLOCKED_RESERVATION_HOSTS.map((h) =>
  h.replace(/\./g, "\\.")
).join("|")})).*`;

export const BLOCKED_RESERVATION_URL_MESSAGE =
  "食べログ・ホットペッパー・RettyのURLは予約URLに使えません（Googleマップや店の公式サイトは可）";

export function isBlockedReservationUrl(url: string): boolean {
  return BLOCKED_RESERVATION_HOSTS.some((host) => url.includes(host));
}

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
