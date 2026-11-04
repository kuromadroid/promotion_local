import "server-only";
import { supabaseAdmin } from "@/lib/supabase/adminClient";

/** Restaurants for the coupon form's checkboxes, by Japanese name. */
export async function getRestaurantOptions() {
  const { data, error } = await supabaseAdmin
    .from("restaurant_translations")
    .select("restaurant_id, name")
    .eq("locale", "ja")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.restaurant_id as string, name: r.name as string }));
}
