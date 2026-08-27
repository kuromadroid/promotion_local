"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setAdminSession, clearAdminSession, requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { haversineMeters } from "@/lib/geo";
import { Locale } from "@/lib/types";

export async function loginAction(formData: FormData) {
  const password = formData.get("password");
  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login?error=1");
  }
  await setAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

interface ParsedRestaurantForm {
  areaId: string;
  priceMin: number;
  priceMax: number;
  latitude: number;
  longitude: number;
  phone: string | null;
  googleMapsUrl: string | null;
  reservationUrl: string | null;
  reservationUrlIntl: string | null;
  instagramUrl: string | null;
  openingHours: string | null;
  closedDays: string | null;
  isSponsored: boolean;
  priority: number;
  translations: { locale: Locale; name: string; description: string; recommendedDish: string | null }[];
  tagIds: string[];
  hotelIds: string[];
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRestaurantForm(formData: FormData): ParsedRestaurantForm {
  const translations: ParsedRestaurantForm["translations"] = [];

  const nameJa = String(formData.get("name_ja") ?? "").trim();
  const descriptionJa = String(formData.get("description_ja") ?? "").trim();
  translations.push({
    locale: "ja",
    name: nameJa,
    description: descriptionJa,
    recommendedDish: emptyToNull(formData.get("recommended_dish_ja")),
  });

  const optionalLocales: { locale: Locale; field: string }[] = [
    { locale: "en", field: "en" },
    { locale: "zh-CN", field: "zh_cn" },
    { locale: "zh-TW", field: "zh_tw" },
    { locale: "ko", field: "ko" },
  ];
  for (const { locale, field } of optionalLocales) {
    const name = String(formData.get(`name_${field}`) ?? "").trim();
    const description = String(formData.get(`description_${field}`) ?? "").trim();
    if (name && description) {
      translations.push({
        locale,
        name,
        description,
        recommendedDish: emptyToNull(formData.get(`recommended_dish_${field}`)),
      });
    }
  }

  return {
    areaId: String(formData.get("area_id") ?? ""),
    priceMin: Number(formData.get("price_min") ?? 0),
    priceMax: Number(formData.get("price_max") ?? 0),
    latitude: Number(formData.get("latitude") ?? 0),
    longitude: Number(formData.get("longitude") ?? 0),
    phone: emptyToNull(formData.get("phone")),
    googleMapsUrl: emptyToNull(formData.get("google_maps_url")),
    reservationUrl: emptyToNull(formData.get("reservation_url")),
    reservationUrlIntl: emptyToNull(formData.get("reservation_url_intl")),
    instagramUrl: emptyToNull(formData.get("instagram_url")),
    openingHours: emptyToNull(formData.get("opening_hours")),
    closedDays: emptyToNull(formData.get("closed_days")),
    isSponsored: formData.get("is_sponsored") === "on",
    priority: Math.min(100, Math.max(0, Number(formData.get("priority") ?? 50))),
    translations,
    tagIds: formData.getAll("tag_ids").map(String),
    hotelIds: formData.getAll("hotel_ids").map(String),
  };
}

const PHOTO_BUCKET = "restaurant-photos";

/** Uploads any selected image files to Supabase Storage and returns their public URLs. */
async function uploadPhotoFiles(restaurantId: string, formData: FormData): Promise<string[]> {
  const files = formData
    .getAll("photo_files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (error) throw error;
    const { data } = supabaseAdmin.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

/** Interleaves kept existing photos and newly uploaded ones per the client-chosen order
 * (tokens like "E0,N0,E1" referencing indices into each list), so a reordered/promoted
 * thumbnail is respected. Falls back to kept-then-new when no order was submitted. */
function composePhotoOrder(keptExisting: string[], newUrls: string[], orderRaw: string): string[] {
  const tokens = orderRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return [...keptExisting, ...newUrls];

  return tokens
    .map((token) => {
      const index = Number(token.slice(1));
      if (token.startsWith("E")) return keptExisting[index];
      if (token.startsWith("N")) return newUrls[index];
      return undefined;
    })
    .filter((url): url is string => Boolean(url));
}

/** Links a restaurant to the given hotels, computing distance from each hotel's coordinates. */
async function syncHotelLinks(
  restaurantId: string,
  hotelIds: string[],
  latitude: number,
  longitude: number
) {
  await supabaseAdmin.from("hotel_restaurants").delete().eq("restaurant_id", restaurantId);
  if (hotelIds.length === 0) return;

  const { data: hotels, error: hotelsError } = await supabaseAdmin
    .from("hotels")
    .select("id, latitude, longitude")
    .in("id", hotelIds);
  if (hotelsError) throw hotelsError;

  const rows = await Promise.all(
    (hotels ?? []).map(async (hotel) => {
      const { count } = await supabaseAdmin
        .from("hotel_restaurants")
        .select("*", { count: "exact", head: true })
        .eq("hotel_id", hotel.id);
      const meters = Math.round(
        haversineMeters(hotel.latitude, hotel.longitude, latitude, longitude)
      );
      return {
        hotel_id: hotel.id,
        restaurant_id: restaurantId,
        distance_m: meters,
        walking_minutes: Math.max(1, Math.round(meters / 80)),
        display_priority: count ?? 0,
        is_visible: true,
      };
    })
  );

  const { error } = await supabaseAdmin.from("hotel_restaurants").insert(rows);
  if (error) throw error;
}

export async function createRestaurantAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseRestaurantForm(formData);
  const id = crypto.randomUUID();
  const newPhotos = await uploadPhotoFiles(id, formData);
  const photos = composePhotoOrder([], newPhotos, String(formData.get("photo_order") ?? ""));

  const { error: insertError } = await supabaseAdmin.from("restaurants").insert({
    id,
    area_id: parsed.areaId,
    price_min: parsed.priceMin,
    price_max: parsed.priceMax,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    phone: parsed.phone,
    google_maps_url: parsed.googleMapsUrl,
    reservation_url: parsed.reservationUrl,
    reservation_url_intl: parsed.reservationUrlIntl,
    instagram_url: parsed.instagramUrl,
    opening_hours: parsed.openingHours,
    closed_days: parsed.closedDays,
    is_sponsored: parsed.isSponsored,
    priority: parsed.priority,
    photos,
  });
  if (insertError) throw insertError;

  const { error: translationError } = await supabaseAdmin
    .from("restaurant_translations")
    .insert(
      parsed.translations.map((t) => ({
        restaurant_id: id,
        locale: t.locale,
        name: t.name,
        description: t.description,
        recommended_dish: t.recommendedDish,
      }))
    );
  if (translationError) throw translationError;

  if (parsed.tagIds.length > 0) {
    const { error: tagError } = await supabaseAdmin
      .from("restaurant_tags")
      .insert(parsed.tagIds.map((tagId) => ({ restaurant_id: id, tag_id: tagId })));
    if (tagError) throw tagError;
  }

  await syncHotelLinks(id, parsed.hotelIds, parsed.latitude, parsed.longitude);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateRestaurantAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseRestaurantForm(formData);

  const existingPhotos = String(formData.get("existing_photos") ?? "")
    .split("|")
    .filter(Boolean);
  const deletedPhotos = formData.getAll("delete_photos").map(String);
  const keptPhotos = existingPhotos.filter((url) => !deletedPhotos.includes(url));
  const newPhotos = await uploadPhotoFiles(id, formData);
  const photos = composePhotoOrder(keptPhotos, newPhotos, String(formData.get("photo_order") ?? ""));

  const { error: updateError } = await supabaseAdmin
    .from("restaurants")
    .update({
      area_id: parsed.areaId,
      price_min: parsed.priceMin,
      price_max: parsed.priceMax,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      phone: parsed.phone,
      google_maps_url: parsed.googleMapsUrl,
      reservation_url: parsed.reservationUrl,
      reservation_url_intl: parsed.reservationUrlIntl,
      instagram_url: parsed.instagramUrl,
      opening_hours: parsed.openingHours,
      closed_days: parsed.closedDays,
      is_sponsored: parsed.isSponsored,
      priority: parsed.priority,
      photos,
    })
    .eq("id", id);
  if (updateError) throw updateError;

  // Only ja/en are editable here — scope the delete to those locales so
  // zh-CN/zh-TW/ko translations (managed outside this form) survive a save.
  const managedLocales = parsed.translations.map((t) => t.locale);
  const { error: deleteTranslationsError } = await supabaseAdmin
    .from("restaurant_translations")
    .delete()
    .eq("restaurant_id", id)
    .in("locale", managedLocales);
  if (deleteTranslationsError) throw deleteTranslationsError;

  const { error: translationError } = await supabaseAdmin
    .from("restaurant_translations")
    .insert(
      parsed.translations.map((t) => ({
        restaurant_id: id,
        locale: t.locale,
        name: t.name,
        description: t.description,
        recommended_dish: t.recommendedDish,
      }))
    );
  if (translationError) throw translationError;

  const { error: deleteTagsError } = await supabaseAdmin
    .from("restaurant_tags")
    .delete()
    .eq("restaurant_id", id);
  if (deleteTagsError) throw deleteTagsError;

  if (parsed.tagIds.length > 0) {
    const { error: tagError } = await supabaseAdmin
      .from("restaurant_tags")
      .insert(parsed.tagIds.map((tagId) => ({ restaurant_id: id, tag_id: tagId })));
    if (tagError) throw tagError;
  }

  await syncHotelLinks(id, parsed.hotelIds, parsed.latitude, parsed.longitude);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteRestaurantAction(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("restaurants").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
}
