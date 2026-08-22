"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/adminClient";

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

  const { error } = await supabaseAdmin.from("hotels").insert({
    id,
    name: parsed.name,
    area_id: parsed.areaId,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
  });
  if (error) throw error;

  revalidatePath("/admin/hotels");
  redirect("/admin/hotels");
}

export async function updateHotelAction(id: string, formData: FormData) {
  const parsed = parseHotelForm(formData);

  const { error } = await supabaseAdmin
    .from("hotels")
    .update({
      name: parsed.name,
      area_id: parsed.areaId,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
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
