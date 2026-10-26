"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { requireAdmin } from "@/lib/adminAuth";

const AD_IMAGE_BUCKET = "restaurant-photos";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Uploads the selected image (if any) and returns its public URL. */
async function uploadAdImage(adId: string, formData: FormData): Promise<string | null> {
  const file = formData.get("image_file");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `ads/${adId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(AD_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;
  return supabaseAdmin.storage.from(AD_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function parseAdForm(formData: FormData) {
  const title = emptyToNull(formData.get("title"));
  const linkUrl = emptyToNull(formData.get("link_url"));
  if (!title) throw new Error("タイトルを入力してください。");
  if (!linkUrl || !/^https?:\/\//.test(linkUrl)) throw new Error("リンク先URLは http(s):// から入力してください。");

  return {
    title,
    subtitle: emptyToNull(formData.get("subtitle")),
    link_url: linkUrl,
    position: Math.max(0, Math.floor(Number(formData.get("position") ?? 3)) || 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createAdAction(formData: FormData) {
  await requireAdmin();
  const fields = parseAdForm(formData);
  const id = crypto.randomUUID();
  const imageUrl = await uploadAdImage(id, formData);
  if (!imageUrl) throw new Error("画像を選択してください。");

  const { error } = await supabaseAdmin.from("ads").insert({ id, ...fields, image_url: imageUrl });
  if (error) throw error;

  revalidatePath("/admin/ads");
  redirect("/admin/ads");
}

export async function updateAdAction(id: string, formData: FormData) {
  await requireAdmin();
  const fields = parseAdForm(formData);
  const imageUrl = await uploadAdImage(id, formData);

  const { error } = await supabaseAdmin
    .from("ads")
    .update(imageUrl ? { ...fields, image_url: imageUrl } : fields)
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/ads");
  redirect("/admin/ads");
}

export async function deleteAdAction(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("ads").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/ads");
}
