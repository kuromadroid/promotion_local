"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setAdminSession, clearAdminSession } from "@/lib/adminAuth";
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
  instagramUrl: string | null;
  openingHours: string | null;
  closedDays: string | null;
  isSponsored: boolean;
  photos: string[];
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

  const nameEn = String(formData.get("name_en") ?? "").trim();
  const descriptionEn = String(formData.get("description_en") ?? "").trim();
  if (nameEn && descriptionEn) {
    translations.push({
      locale: "en",
      name: nameEn,
      description: descriptionEn,
      recommendedDish: emptyToNull(formData.get("recommended_dish_en")),
    });
  }

  const photos = String(formData.get("photos") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    areaId: String(formData.get("area_id") ?? ""),
    priceMin: Number(formData.get("price_min") ?? 0),
    priceMax: Number(formData.get("price_max") ?? 0),
    latitude: Number(formData.get("latitude") ?? 0),
    longitude: Number(formData.get("longitude") ?? 0),
    phone: emptyToNull(formData.get("phone")),
    googleMapsUrl: emptyToNull(formData.get("google_maps_url")),
    reservationUrl: emptyToNull(formData.get("reservation_url")),
    instagramUrl: emptyToNull(formData.get("instagram_url")),
    openingHours: emptyToNull(formData.get("opening_hours")),
    closedDays: emptyToNull(formData.get("closed_days")),
    isSponsored: formData.get("is_sponsored") === "on",
    photos,
    translations,
    tagIds: formData.getAll("tag_ids").map(String),
    hotelIds: formData.getAll("hotel_ids").map(String),
  };
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
  const parsed = parseRestaurantForm(formData);
  const id = crypto.randomUUID();

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
    instagram_url: parsed.instagramUrl,
    opening_hours: parsed.openingHours,
    closed_days: parsed.closedDays,
    is_sponsored: parsed.isSponsored,
    photos: parsed.photos,
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
  const parsed = parseRestaurantForm(formData);

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
      instagram_url: parsed.instagramUrl,
      opening_hours: parsed.openingHours,
      closed_days: parsed.closedDays,
      is_sponsored: parsed.isSponsored,
      photos: parsed.photos,
    })
    .eq("id", id);
  if (updateError) throw updateError;

  const { error: deleteTranslationsError } = await supabaseAdmin
    .from("restaurant_translations")
    .delete()
    .eq("restaurant_id", id);
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
  const { error } = await supabaseAdmin.from("restaurants").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin");
}
