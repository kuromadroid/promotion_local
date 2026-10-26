import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { createAdAction } from "@/app/admin/adActions";
import { AdForm } from "../AdForm";

export default async function NewAdPage() {
  const { data: hotels } = await supabaseAdmin.from("hotels").select("id, name").order("name");

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-(--color-navy)">広告を追加</h1>
      <AdForm action={createAdAction} hotels={hotels ?? []} submitLabel="追加する" />
    </div>
  );
}
