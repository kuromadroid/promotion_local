"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/adminClient";

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
  const { error } = await supabaseAdmin.from("hotels").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/hotels");
}
