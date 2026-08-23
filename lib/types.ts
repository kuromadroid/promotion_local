export type Locale = "ja" | "en" | "zh" | "ko";

export const LOCALES: Locale[] = ["ja", "en", "zh", "ko"];
export const DEFAULT_LOCALE: Locale = "ja";

export type TagType =
  | "cuisine"
  | "feature"
  | "scene"
  | "language"
  | "payment";

export interface Area {
  id: string;
  displayOrder: number;
  name: Record<Locale, string>;
}

export interface Tag {
  id: string;
  type: TagType;
  name: Record<Locale, string>;
}

export interface Hotel {
  id: string;
  name: string;
  areaId: string;
  latitude: number;
  longitude: number;
  heroPhotos: string[];
}

export interface Restaurant {
  id: string;
  areaId: string;
  priceMin: number;
  priceMax: number;
  latitude: number;
  longitude: number;
  phone?: string;
  googleMapsUrl?: string;
  reservationUrl?: string;
  instagramUrl?: string;
  openingHours?: string;
  closedDays?: string;
  isSponsored?: boolean;
  photos: string[];
  tagIds: string[];
}

export interface RestaurantTranslation {
  restaurantId: string;
  locale: Locale;
  name: string;
  description: string;
  recommendedDish?: string;
}

export interface HotelRestaurantLink {
  hotelId: string;
  restaurantId: string;
  distanceMeters: number;
  walkingMinutes: number;
  displayPriority: number;
  isVisible: boolean;
}

export interface ResolvedArea {
  id: string;
  name: string;
}

export interface ResolvedTag {
  id: string;
  type: TagType;
  name: string;
}

/** Restaurant fully resolved for a specific hotel + locale, ready for UI use. */
export interface RestaurantView {
  id: string;
  name: string;
  description: string;
  recommendedDish?: string;
  area: ResolvedArea;
  priceMin: number;
  priceMax: number;
  photos: string[];
  tags: ResolvedTag[];
  phone?: string;
  googleMapsUrl?: string;
  reservationUrl?: string;
  instagramUrl?: string;
  openingHours?: string;
  closedDays?: string;
  isSponsored?: boolean;
  distanceMeters: number;
  walkingMinutes: number;
  displayPriority: number;
}

export type AnalyticsEventName =
  | "qr_scan"
  | "page_view"
  | "restaurant_view"
  | "restaurant_detail_view"
  | "area_filter"
  | "tag_filter"
  | "language_select"
  | "map_click"
  | "reservation_click"
  | "instagram_click"
  | "phone_click";

export interface AnalyticsEvent {
  eventName: AnalyticsEventName;
  hotelId?: string;
  restaurantId?: string;
  areaId?: string;
  tagId?: string;
  language?: Locale;
  timestamp: string;
  meta?: Record<string, unknown>;
}
