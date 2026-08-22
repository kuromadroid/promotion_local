import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { createHotelAction } from "@/app/admin/hotelActions";
import { HotelForm } from "../HotelForm";
import { Area } from "@/lib/types";

export default async function NewHotelPage() {
  const { data: areas } = await supabaseAdmin
    .from("areas")
    .select("id, display_order, name")
    .order("display_order");

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-(--color-navy)">ホテルを追加</h1>
      <HotelForm
        action={createHotelAction}
        areas={(areas ?? []) as unknown as Area[]}
        submitLabel="追加してURLを発行"
      />
    </div>
  );
}
