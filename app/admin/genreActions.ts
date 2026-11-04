"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { requireAdmin } from "@/lib/adminAuth";
import { LOCALES, Locale } from "@/lib/types";
import { DEMO_ONLY_TAG_IDS } from "@/lib/demoTags";

function revalidateGenres() {
  revalidatePath("/admin/genres");
  revalidatePath("/h/[hotelId]", "page");
}

async function nextDisplayOrder() {
  const { data, error } = await supabaseAdmin
    .from("genres")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0]?.display_order ?? 0) + 1;
}

/** Slug from the English name; a random id when that is empty or already taken. */
async function newTagId(en: string) {
  const slug = en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  if (slug) {
    const { data, error } = await supabaseAdmin.from("tags").select("id").eq("id", slug).maybeSingle();
    if (error) throw error;
    if (!data) return slug;
  }
  return `genre-${crypto.randomUUID().slice(0, 8)}`;
}

/** Adds a button for an existing cuisine tag, using the tag's own names. */
export async function addExistingGenreAction(formData: FormData) {
  await requireAdmin();
  const tagId = String(formData.get("tag_id") ?? "");
  if (DEMO_ONLY_TAG_IDS.has(tagId)) throw new Error("このタグはUI確認用ホテル限定のため追加できません。");

  const { data: tag, error } = await supabaseAdmin.from("tags").select("id, name").eq("id", tagId).maybeSingle();
  if (error) throw error;
  if (!tag) throw new Error("タグが見つかりません。");

  const { error: insertError } = await supabaseAdmin
    .from("genres")
    .insert({ tag_id: tag.id, label: tag.name, display_order: await nextDisplayOrder() });
  if (insertError) throw insertError;

  revalidateGenres();
}

/** Creates a cuisine tag and its button. Languages left empty fall back to
 * English, then Japanese. */
export async function addNewGenreAction(formData: FormData) {
  await requireAdmin();
  const names = Object.fromEntries(
    LOCALES.map((locale) => [locale, String(formData.get(`name_${locale}`) ?? "").trim()])
  ) as Record<Locale, string>;
  if (!names.ja) throw new Error("日本語のジャンル名を入力してください。");

  const label = Object.fromEntries(
    LOCALES.map((locale) => [locale, names[locale] || names.en || names.ja])
  ) as Record<Locale, string>;
  const tagId = await newTagId(names.en);

  const { error: tagError } = await supabaseAdmin.from("tags").insert({ id: tagId, type: "cuisine", name: label });
  if (tagError) throw tagError;

  const { error } = await supabaseAdmin
    .from("genres")
    .insert({ tag_id: tagId, label, display_order: await nextDisplayOrder() });
  if (error) throw error;

  revalidateGenres();
}

/** Takes the button away. The tag and the restaurants tagged with it stay. */
export async function removeGenreAction(tagId: string) {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("genres").delete().eq("tag_id", tagId);
  if (error) throw error;
  revalidateGenres();
}

/** Swaps a genre with its neighbour in the order. */
export async function moveGenreAction(tagId: string, direction: "up" | "down") {
  await requireAdmin();
  const { data, error } = await supabaseAdmin
    .from("genres")
    .select("tag_id, display_order")
    .order("display_order", { ascending: true });
  if (error) throw error;

  const index = (data ?? []).findIndex((g) => g.tag_id === tagId);
  const neighbour = data?.[direction === "up" ? index - 1 : index + 1];
  if (index < 0 || !neighbour) return;

  const current = data[index];
  const updates = await Promise.all([
    supabaseAdmin.from("genres").update({ display_order: neighbour.display_order }).eq("tag_id", current.tag_id),
    supabaseAdmin.from("genres").update({ display_order: current.display_order }).eq("tag_id", neighbour.tag_id),
  ]);
  for (const update of updates) if (update.error) throw update.error;

  revalidateGenres();
}
