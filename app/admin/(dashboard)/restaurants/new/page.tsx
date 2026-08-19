import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { createRestaurantAction } from "@/app/admin/actions";
import { RestaurantForm } from "../RestaurantForm";
import { Area, Hotel, Tag } from "@/lib/types";

export default async function NewRestaurantPage() {
  const [{ data: areas }, { data: tags }, { data: hotels }] = await Promise.all([
    supabaseAdmin.from("areas").select("id, display_order, name").order("display_order"),
    supabaseAdmin.from("tags").select("id, type, name"),
    supabaseAdmin.from("hotels").select("id, name, area_id, latitude, longitude"),
  ]);

  return (
    <div>
      <h1 className="text-lg font-bold text-(--color-navy) mb-6">店舗を追加</h1>
      <RestaurantForm
        action={createRestaurantAction}
        areas={(areas ?? []) as unknown as Area[]}
        tags={(tags ?? []) as unknown as Tag[]}
        hotels={(hotels ?? []) as unknown as Hotel[]}
        submitLabel="追加する"
      />
    </div>
  );
}
