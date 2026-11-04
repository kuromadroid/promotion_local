"use server";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { requireAdmin } from "@/lib/adminAuth";
import { LOCALES, Locale } from "@/lib/types";

const COUPON_IMAGE_BUCKET = "restaurant-photos";

function revalidateCoupons() {
  revalidatePath("/admin/coupons");
  revalidatePath("/h/[hotelId]", "layout");
}

/** Uploads the selected image (if any) and returns its public URL. */
async function uploadCouponImage(couponId: string, formData: FormData): Promise<string | null> {
  const file = formData.get("image_file");
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `coupons/${couponId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(COUPON_IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;
  return supabaseAdmin.storage.from(COUPON_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Each non-empty line of the textarea is one term. */
function parseTermLines(formData: FormData, locale: Locale) {
  return String(formData.get(`terms_${locale}`) ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Languages left empty fall back to English, then Japanese. */
function parseCouponForm(formData: FormData) {
  const offerInput = Object.fromEntries(
    LOCALES.map((locale) => [locale, String(formData.get(`offer_${locale}`) ?? "").trim()])
  ) as Record<Locale, string>;
  if (!offerInput.ja) throw new Error("日本語の特典の文言を入力してください。");

  const termsInput = Object.fromEntries(
    LOCALES.map((locale) => [locale, parseTermLines(formData, locale)])
  ) as Record<Locale, string[]>;

  const fallback = <T,>(input: Record<Locale, T>, isEmpty: (value: T) => boolean) =>
    Object.fromEntries(
      LOCALES.map((locale) => [
        locale,
        !isEmpty(input[locale]) ? input[locale] : !isEmpty(input.en) ? input.en : input.ja,
      ])
    ) as Record<Locale, T>;

  return {
    offer: fallback(offerInput, (value) => !value),
    terms: fallback(termsInput, (value) => value.length === 0),
    restaurant_ids: formData.getAll("restaurant_ids").map(String),
    is_active: formData.get("is_active") === "on",
  };
}

export async function createCouponAction(formData: FormData) {
  await requireAdmin();
  const fields = parseCouponForm(formData);
  const id = crypto.randomUUID();
  const imageUrl = await uploadCouponImage(id, formData);
  if (!imageUrl) throw new Error("画像を選択してください。");

  const { error } = await supabaseAdmin.from("coupons").insert({ id, ...fields, image_url: imageUrl });
  if (error) throw error;

  revalidateCoupons();
  redirect("/admin/coupons");
}

export async function updateCouponAction(id: string, formData: FormData) {
  await requireAdmin();
  const fields = parseCouponForm(formData);
  const imageUrl = await uploadCouponImage(id, formData);

  const { error } = await supabaseAdmin
    .from("coupons")
    .update(imageUrl ? { ...fields, image_url: imageUrl } : fields)
    .eq("id", id);
  if (error) throw error;

  revalidateCoupons();
  redirect("/admin/coupons");
}

export async function deleteCouponAction(id: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);
  if (error) throw error;
  revalidateCoupons();
}
