import { supabase } from "@/lib/supabase/client";
import {
  Locale,
  RestaurantView,
  DEFAULT_LOCALE,
  Area,
  Tag,
  Hotel,
} from "@/lib/types";

function resolveName(record: Record<Locale, string>, locale: Locale) {
  return record[locale] ?? record.en ?? record[DEFAULT_LOCALE];
}

export async function getAreas(): Promise<Area[]> {
  const { data, error } = await supabase
    .from("areas")
    .select("id, display_order, name")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id,
    displayOrder: a.display_order,
    name: a.name as Record<Locale, string>,
  }));
}

export async function getAreasResolved(locale: Locale) {
  const areas = await getAreas();
  return areas.map((a) => ({ id: a.id, name: resolveName(a.name, locale) }));
}

export async function getArea(areaId: string): Promise<Area | null> {
  const { data, error } = await supabase
    .from("areas")
    .select("id, display_order, name")
    .eq("id", areaId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    displayOrder: data.display_order,
    name: data.name as Record<Locale, string>,
  };
}

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from("tags").select("id, type, name");
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    name: t.name as Record<Locale, string>,
  }));
}

export async function getTagsResolved(locale: Locale) {
  const tags = await getTags();
  return tags.map((tag) => ({
    id: tag.id,
    type: tag.type,
    name: resolveName(tag.name, locale),
  }));
}

export async function getHotel(hotelId: string): Promise<Hotel | null> {
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, area_id, latitude, longitude, hero_photos")
    .eq("id", hotelId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    areaId: data.area_id,
    latitude: data.latitude,
    longitude: data.longitude,
    heroPhotos: data.hero_photos ?? [],
  };
}

export async function getAllHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, area_id, latitude, longitude, hero_photos");
  if (error) throw error;
  return (data ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    areaId: h.area_id,
    latitude: h.latitude,
    longitude: h.longitude,
    heroPhotos: h.hero_photos ?? [],
  }));
}

export interface RestaurantFilter {
  areaId?: string;
  tagIds?: string[];
  query?: string;
  sort?: "priority" | "distance" | "price_asc" | "price_desc";
}

interface RestaurantJoinRow {
  distance_m: number;
  walking_minutes: number;
  display_priority: number;
  is_visible: boolean;
  restaurants: {
    id: string;
    area_id: string;
    price_min: number;
    price_max: number;
    phone: string | null;
    google_maps_url: string | null;
    reservation_url: string | null;
    reservation_url_intl: string | null;
    instagram_url: string | null;
    opening_hours: string | null;
    closed_days: string | null;
    is_sponsored: boolean;
    photos: string[];
    priority: number;
    areas: { id: string; name: Record<Locale, string> } | null;
    restaurant_translations: {
      locale: Locale;
      name: string;
      description: string;
      recommended_dish: string | null;
    }[];
    restaurant_tags: {
      tags: { id: string; type: Tag["type"]; name: Record<Locale, string> } | null;
    }[];
  } | null;
}

/**
 * Fetches every visible restaurant linked to a hotel, fully resolved for the
 * given locale. Area/tag/sort filtering happens in-memory after the fetch,
 * same as the V1 dummy-data implementation — dataset sizes here are small
 * enough that this stays simple and correct.
 */
export async function getRestaurantsForHotel(
  hotelId: string,
  locale: Locale,
  filter: RestaurantFilter = {}
): Promise<RestaurantView[]> {
  const { data, error } = await supabase
    .from("hotel_restaurants")
    .select(
      `distance_m, walking_minutes, display_priority, is_visible,
       restaurants (
         id, area_id, price_min, price_max, phone, google_maps_url, reservation_url, reservation_url_intl, instagram_url, opening_hours, closed_days, is_sponsored, photos, priority,
         areas ( id, name ),
         restaurant_translations ( locale, name, description, recommended_dish ),
         restaurant_tags ( tags ( id, type, name ) )
       )`
    )
    .eq("hotel_id", hotelId)
    .eq("is_visible", true);

  if (error) throw error;

  let views: RestaurantView[] = ((data ?? []) as unknown as RestaurantJoinRow[])
    .map((link) => {
      const r = link.restaurants;
      if (!r || !r.areas) return null;

      const translations = r.restaurant_translations ?? [];
      const t =
        translations.find((tr) => tr.locale === locale) ??
        translations.find((tr) => tr.locale === "en") ??
        translations.find((tr) => tr.locale === DEFAULT_LOCALE) ??
        null;
      if (!t) return null;

      const restaurantTags = (r.restaurant_tags ?? [])
        .map((rt) => rt.tags)
        .filter((tag): tag is NonNullable<typeof tag> => tag != null)
        .map((tag) => ({
          id: tag.id,
          type: tag.type,
          name: resolveName(tag.name, locale),
        }));

      const view: RestaurantView = {
        id: r.id,
        name: t.name,
        description: t.description,
        recommendedDish: t.recommended_dish ?? undefined,
        area: { id: r.areas.id, name: resolveName(r.areas.name, locale) },
        priceMin: r.price_min,
        priceMax: r.price_max,
        photos: r.photos,
        tags: restaurantTags,
        phone: r.phone ?? undefined,
        googleMapsUrl: r.google_maps_url ?? undefined,
        reservationUrl: r.reservation_url ?? undefined,
        reservationUrlIntl: r.reservation_url_intl ?? undefined,
        instagramUrl: r.instagram_url ?? undefined,
        openingHours: r.opening_hours ?? undefined,
        closedDays: r.closed_days ?? undefined,
        isSponsored: r.is_sponsored,
        distanceMeters: link.distance_m,
        walkingMinutes: link.walking_minutes,
        displayPriority: r.priority,
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
        return b.displayPriority - a.displayPriority;
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
