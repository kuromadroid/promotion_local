import { areas } from "@/lib/data/areas";
import { tags } from "@/lib/data/tags";
import { hotels } from "@/lib/data/hotels";
import { restaurants } from "@/lib/data/restaurants";
import { restaurantTranslations } from "@/lib/data/restaurantTranslations";
import { hotelRestaurants } from "@/lib/data/hotelRestaurants";
import { Locale, RestaurantView, DEFAULT_LOCALE } from "@/lib/types";

/**
 * Every function here reads from the in-memory dummy data arrays.
 * When Supabase is connected, only the bodies of these functions need to
 * change to `supabase.from(...).select(...)` calls — nothing in the
 * app/ or components/ layer needs to know the data source changed.
 */

function resolveName(record: Record<Locale, string>, locale: Locale) {
  return record[locale] ?? record.en ?? record[DEFAULT_LOCALE];
}

export async function getAreas() {
  return [...areas].sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getAreasResolved(locale: Locale) {
  return [...areas]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((a) => ({ id: a.id, name: resolveName(a.name, locale) }));
}

export async function getArea(areaId: string) {
  return areas.find((a) => a.id === areaId) ?? null;
}

export async function getTags() {
  return tags;
}

export async function getTagsResolved(locale: Locale) {
  return tags.map((tag) => ({
    id: tag.id,
    type: tag.type,
    name: resolveName(tag.name, locale),
  }));
}

export async function getHotel(hotelId: string) {
  return hotels.find((h) => h.id === hotelId) ?? null;
}

export async function getAllHotels() {
  return hotels;
}

function translate(restaurantId: string, locale: Locale) {
  const exact = restaurantTranslations.find(
    (t) => t.restaurantId === restaurantId && t.locale === locale
  );
  if (exact) return exact;
  // Fallback chain: requested locale -> English -> Japanese
  return (
    restaurantTranslations.find(
      (t) => t.restaurantId === restaurantId && t.locale === "en"
    ) ??
    restaurantTranslations.find(
      (t) => t.restaurantId === restaurantId && t.locale === DEFAULT_LOCALE
    ) ??
    null
  );
}

export interface RestaurantFilter {
  areaId?: string;
  tagIds?: string[];
  query?: string;
  sort?: "priority" | "distance" | "price_asc" | "price_desc";
}

export async function getRestaurantsForHotel(
  hotelId: string,
  locale: Locale,
  filter: RestaurantFilter = {}
): Promise<RestaurantView[]> {
  const links = hotelRestaurants.filter(
    (l) => l.hotelId === hotelId && l.isVisible
  );

  let views: RestaurantView[] = links
    .map((link) => {
      const restaurant = restaurants.find((r) => r.id === link.restaurantId);
      if (!restaurant) return null;
      const t = translate(restaurant.id, locale);
      if (!t) return null;
      const areaRaw = areas.find((a) => a.id === restaurant.areaId);
      if (!areaRaw) return null;
      const restaurantTags = tags
        .filter((tag) => restaurant.tagIds.includes(tag.id))
        .map((tag) => ({
          id: tag.id,
          type: tag.type,
          name: resolveName(tag.name, locale),
        }));

      const view: RestaurantView = {
        id: restaurant.id,
        name: t.name,
        description: t.description,
        recommendedDish: t.recommendedDish,
        area: { id: areaRaw.id, name: resolveName(areaRaw.name, locale) },
        priceMin: restaurant.priceMin,
        priceMax: restaurant.priceMax,
        photos: restaurant.photos,
        tags: restaurantTags,
        phone: restaurant.phone,
        googleMapsUrl: restaurant.googleMapsUrl,
        reservationUrl: restaurant.reservationUrl,
        instagramUrl: restaurant.instagramUrl,
        openingHours: restaurant.openingHours,
        closedDays: restaurant.closedDays,
        isSponsored: restaurant.isSponsored,
        distanceMeters: link.distanceMeters,
        walkingMinutes: link.walkingMinutes,
        displayPriority: link.displayPriority,
      };
      return view;
    })
    .filter((v): v is RestaurantView => v !== null);

  if (filter.areaId) {
    views = views.filter((v) => v.area.id === filter.areaId);
  }
  if (filter.tagIds && filter.tagIds.length > 0) {
    // AND across distinct tags selected (each selected tag must be present)
    views = views.filter((v) =>
      filter.tagIds!.every((tagId) => v.tags.some((t) => t.id === tagId))
    );
  }
  if (filter.query && filter.query.trim().length > 0) {
    const q = filter.query.trim().toLowerCase();
    views = views.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.tags.some((t) => t.name.toLowerCase().includes(q))
    );
  }

  const sort = filter.sort ?? "priority";
  views.sort((a, b) => {
    switch (sort) {
      case "distance":
        return a.distanceMeters - b.distanceMeters;
      case "price_asc":
        return a.priceMin - b.priceMin;
      case "price_desc":
        return b.priceMax - a.priceMax;
      case "priority":
      default:
        return a.displayPriority - b.displayPriority;
    }
  });

  return views;
}

export async function getRestaurantForHotel(
  hotelId: string,
  restaurantId: string,
  locale: Locale
): Promise<RestaurantView | null> {
  const all = await getRestaurantsForHotel(hotelId, locale, { sort: "priority" });
  return all.find((r) => r.id === restaurantId) ?? null;
}

export async function getRecommendedForHotel(
  hotelId: string,
  locale: Locale,
  limit = 6
): Promise<RestaurantView[]> {
  const all = await getRestaurantsForHotel(hotelId, locale, {
    sort: "priority",
  });
  return all.slice(0, limit);
}

export async function getNearestForHotel(
  hotelId: string,
  locale: Locale,
  limit = 6
): Promise<RestaurantView[]> {
  const all = await getRestaurantsForHotel(hotelId, locale, {
    sort: "distance",
  });
  return all.slice(0, limit);
}
