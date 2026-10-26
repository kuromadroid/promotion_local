import { createAdAction } from "@/app/admin/adActions";
import { AdForm } from "../AdForm";

export default function NewAdPage() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-(--color-navy)">広告を追加</h1>
      <AdForm action={createAdAction} submitLabel="追加する" />
    </div>
  );
}
