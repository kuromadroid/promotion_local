import { Locale } from "@/lib/types";
import { haversineMeters } from "@/lib/geo";

/**
 * The 3 fixed reference stations used as a fallback distance display when a
 * restaurant is far enough from the hotel that "walk from hotel" stops being
 * a useful number. Coordinates are block-level (Nominatim), matching the
 * precision used elsewhere in this app.
 */
const STATIONS: { id: string; name: Record<Locale, string>; latitude: number; longitude: number }[] = [
  {
    id: "sapporo",
    name: { ja: "札幌", en: "Sapporo", "zh-CN": "札幌", "zh-TW": "札幌", ko: "삿포로" },
    latitude: 43.068455,
    longitude: 141.349246,
  },
  {
    id: "susukino",
    name: { ja: "すすきの", en: "Susukino", "zh-CN": "薄野", "zh-TW": "薄野", ko: "스스키노" },
    latitude: 43.05533,
    longitude: 141.35259,
  },
  {
    id: "odori",
    name: { ja: "大通", en: "Odori", "zh-CN": "大通", "zh-TW": "大通", ko: "오도리" },
    latitude: 43.0607416,
    longitude: 141.3528986,
  },
];

export interface NearestStation {
  id: string;
  name: Record<Locale, string>;
  distanceMeters: number;
  walkingMinutes: number;
}

/** The nearest of the 3 fixed stations to the given point. */
export function nearestStation(latitude: number, longitude: number): NearestStation {
  let best = STATIONS[0];
  let bestMeters = Infinity;
  for (const station of STATIONS) {
    const meters = haversineMeters(station.latitude, station.longitude, latitude, longitude);
    if (meters < bestMeters) {
      bestMeters = meters;
      best = station;
    }
  }
  const distanceMeters = Math.round(bestMeters);
  return {
    id: best.id,
    name: best.name,
    distanceMeters,
    walkingMinutes: Math.max(1, Math.round(distanceMeters / 80)),
  };
}
