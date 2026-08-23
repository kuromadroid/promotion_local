import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { updateHotelAction } from "@/app/admin/hotelActions";
import { HotelForm, HotelFormInitial } from "../../HotelForm";
import { Area } from "@/lib/types";

export default async function EditHotelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: areas }, { data: hotel }] = await Promise.all([
    supabaseAdmin.from("areas").select("id, display_order, name").order("display_order"),
    supabaseAdmin.from("hotels").select("*").eq("id", id).maybeSingle(),
  ]);

  if (!hotel) notFound();

  const initial: HotelFormInitial = {
    name: hotel.name,
    areaId: hotel.area_id,
    latitude: hotel.latitude,
    longitude: hotel.longitude,
    heroPhotos: hotel.hero_photos ?? [],
  };

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-(--color-navy)">ホテルを編集</h1>
      <HotelForm
        action={updateHotelAction.bind(null, id)}
        areas={(areas ?? []) as unknown as Area[]}
        initial={initial}
        submitLabel="更新する"
      />
    </div>
  );
}
