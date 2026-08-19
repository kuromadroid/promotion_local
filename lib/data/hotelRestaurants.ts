import { HotelRestaurantLink } from "@/lib/types";
import { hotels } from "@/lib/data/hotels";
import { restaurants } from "@/lib/data/restaurants";

/**
 * V1 dummy distance data: roughly derived from straight-line lat/lng distance
 * between the hotel and each restaurant, then given a plausible walking pace.
 * When Supabase is connected this table becomes a real managed join table,
 * editable per hotel (distance, priority, visibility) independent of the
 * restaurant master data.
 */
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const hotelRestaurants: HotelRestaurantLink[] = hotels.flatMap(
  (hotel, hotelIndex) =>
    restaurants.map((restaurant, rIndex) => {
      const meters = Math.round(
        haversineMeters(
          hotel.latitude,
          hotel.longitude,
          restaurant.latitude,
          restaurant.longitude
        )
      );
      return {
        hotelId: hotel.id,
        restaurantId: restaurant.id,
        distanceMeters: meters,
        walkingMinutes: Math.max(1, Math.round(meters / 80)),
        displayPriority: (rIndex + hotelIndex) % restaurants.length,
        isVisible: true,
      };
    })
);
