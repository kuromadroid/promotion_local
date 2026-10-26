import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { updateAdAction } from "@/app/admin/adActions";
import { AdForm, AdFormInitial } from "../../AdForm";

export default async function EditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: ad } = await supabaseAdmin.from("ads").select("*").eq("id", id).maybeSingle();
  if (!ad) notFound();

  const initial: AdFormInitial = {
    title: ad.title,
    subtitle: ad.subtitle ?? "",
    imageUrl: ad.image_url,
    linkUrl: ad.link_url,
    position: ad.position,
    isActive: ad.is_active,
  };

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-(--color-navy)">広告を編集</h1>
      <AdForm action={updateAdAction.bind(null, id)} initial={initial} submitLabel="更新する" />
    </div>
  );
}
