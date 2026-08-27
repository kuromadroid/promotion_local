import { RestaurantView } from "@/lib/types";

type T = (key: string, vars?: Record<string, string | number>) => string;

/** Beyond this many minutes' walk from the hotel, showing "from the hotel"
 * stops being a useful distance — switch to "from the nearest station" instead. */
const STATION_FALLBACK_THRESHOLD_MINUTES = 16;

/** Whether this restaurant is far enough that station-based distance should
 * be shown instead of hotel-based (also affects nearby section headings). */
export function isStationDistance(restaurant: RestaurantView) {
  return restaurant.walkingMinutes >= STATION_FALLBACK_THRESHOLD_MINUTES;
}

/** The minute count to actually display — from the hotel normally, from the
 * nearest station once the hotel distance gets too large to be useful. */
export function walkMinutes(restaurant: RestaurantView) {
  return isStationDistance(restaurant) ? restaurant.nearestStationWalkingMinutes : restaurant.walkingMinutes;
}

/** "徒歩◯分" label — from the hotel normally, from the nearest station once
 * the hotel distance gets too large to be a useful number. */
export function walkLabel(restaurant: RestaurantView, t: T) {
  if (isStationDistance(restaurant)) {
    return t("walkFromStation", {
      station: restaurant.nearestStationName,
      minutes: restaurant.nearestStationWalkingMinutes,
    });
  }
  return t("walkFromHotel", { minutes: restaurant.walkingMinutes });
}

/** "◯m" distance label, same hotel/station switch as walkLabel. */
export function distanceLabel(restaurant: RestaurantView, t: T) {
  if (isStationDistance(restaurant)) {
    return t("distanceFromStation", {
      station: restaurant.nearestStationName,
      meters: restaurant.nearestStationDistanceMeters,
    });
  }
  return t("distanceFromHotel", { meters: restaurant.distanceMeters });
}

/** Subtitle under the big minute count on the detail page — must match
 * whichever of hotel/station the minute count above it is actually from. */
export function walkSubtitle(restaurant: RestaurantView, t: T) {
  return isStationDistance(restaurant) ? t("walkSubtitleStation") : t("walkSubtitleShort");
}
