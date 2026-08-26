"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { requireAdmin } from "@/lib/adminAuth";

const HERO_PHOTO_BUCKET = "restaurant-photos";

/** Uploads any selected hero-collage images to Supabase Storage and returns their public URLs. */
async function uploadHeroPhotoFiles(hotelId: string, formData: FormData): Promise<string[]> {
  const files = formData
    .getAll("hero_photo_files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const path = `hero/${hotelId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(HERO_PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (error) throw error;
    const { data } = supabaseAdmin.storage.from(HERO_PHOTO_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function resolveHeroPhotos(hotelId: string, formData: FormData): Promise<string[]> {
  const existing = String(formData.get("existing_hero_photos") ?? "")
    .split("|")
    .filter(Boolean);
  const deleted = formData.getAll("delete_hero_photos").map(String);
  const kept = existing.filter((url) => !deleted.includes(url));
  const uploaded = await uploadHeroPhotoFiles(hotelId, formData);
  return [...kept, ...uploaded];
}

/** Interleaves kept existing photos and newly uploaded ones per the client-chosen order
 * (tokens like "E0,N0,E1"), same convention as RestaurantPhotoManager. */
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

/** Uploads hero-collage images that will be shared across multiple hotels (not scoped
 * to a single hotel's storage folder). */
async function uploadSharedHeroPhotoFiles(formData: FormData): Promise<string[]> {
  const files = formData
    .getAll("photo_files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const urls: string[] = [];
  for (const file of files) {
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const path = `hero/_shared/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(HERO_PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type || undefined });
    if (error) throw error;
    const { data } = supabaseAdmin.storage.from(HERO_PHOTO_BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

/** Applies the same ordered set of hero-collage photos to every selected hotel at once. */
export async function bulkSetHeroPhotosAction(formData: FormData) {
  await requireAdmin();
  const hotelIds = formData.getAll("hotel_ids").map(String);
  if (hotelIds.length === 0) throw new Error("反映先のホテルを1つ以上選択してください。");

  const existing = String(formData.get("existing_photos") ?? "")
    .split("|")
    .filter(Boolean);
  const uploaded = await uploadSharedHeroPhotoFiles(formData);
  const heroPhotos = composePhotoOrder(existing, uploaded, String(formData.get("photo_order") ?? ""));

  const { error } = await supabaseAdmin
    .from("hotels")
    .update({ hero_photos: heroPhotos })
    .in("id", hotelIds);
  if (error) throw error;

  revalidatePath("/admin/hero-photos");
  revalidatePath("/admin/hotels");
  redirect("/admin/hero-photos?done=1");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueHotelId(name: string): Promise<string> {
  const base = slugify(name) || `hotel-${crypto.randomUUID().slice(0, 8)}`;
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const { data } = await supabaseAdmin.from("hotels").select("id").eq("id", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

function parseHotelForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    areaId: String(formData.get("area_id") ?? ""),
    latitude: Number(formData.get("latitude") ?? 0),
    longitude: Number(formData.get("longitude") ?? 0),
  };
}

export async function createHotelAction(formData: FormData) {
  await requireAdmin();
  const parsed = parseHotelForm(formData);
  const id = await uniqueHotelId(parsed.name);
  const heroPhotos = await resolveHeroPhotos(id, formData);

  const { error } = await supabaseAdmin.from("hotels").insert({
    id,
    name: parsed.name,
    area_id: parsed.areaId,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    hero_photos: heroPhotos,
  });
  if (error) throw error;

  revalidatePath("/admin/hotels");
  redirect("/admin/hotels");
}

export async function updateHotelAction(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = parseHotelForm(formData);
  const heroPhotos = await resolveHeroPhotos(id, formData);

  const { error } = await supabaseAdmin
    .from("hotels")
    .update({
      name: parsed.name,
      area_id: parsed.areaId,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      hero_photos: heroPhotos,
    })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/hotels");
  redirect("/admin/hotels");
}

export async function deleteHotelAction(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("hotels").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/hotels");
}
