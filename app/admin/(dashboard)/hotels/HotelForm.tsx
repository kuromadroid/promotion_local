import { Area } from "@/lib/types";

export interface HotelFormInitial {
  name: string;
  areaId: string;
  latitude: number;
  longitude: number;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-(--color-line) px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-(--color-coral)";
const labelClass = "block text-sm font-medium text-(--color-ink)";

export function HotelForm({
  action,
  areas,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  areas: Area[];
  initial?: HotelFormInitial;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-(--color-line) bg-white p-6">
        <label className={labelClass}>
          ホテル名
          <input
            type="text"
            name="name"
            required
            defaultValue={initial?.name}
            placeholder="Sapporo Grand Stay Hotel"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          エリア
          <select name="area_id" required defaultValue={initial?.areaId ?? ""} className={inputClass}>
            <option value="" disabled>
              選択してください
            </option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name.ja}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            緯度(latitude)
            <input
              type="number"
              step="any"
              name="latitude"
              required
              defaultValue={initial?.latitude}
              placeholder="43.0686"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            経度(longitude)
            <input
              type="number"
              step="any"
              name="longitude"
              required
              defaultValue={initial?.longitude}
              placeholder="141.3508"
              className={inputClass}
            />
          </label>
        </div>

        <p className="text-xs text-(--color-ink-soft)">
          {initial
            ? "URL(ホテルID)は最初の作成時から変わりません。QRコードを再発行する必要はありません。"
            : "URLはホテル名から自動生成されます(例: Sapporo Park Hotel → /h/sapporo-park-hotel)。日本語のみの名称の場合はランダムなIDになります。"}
        </p>
      </section>

      <button
        type="submit"
        className="rounded-lg bg-(--color-coral) px-6 py-2.5 font-medium text-white transition-colors hover:bg-(--color-coral-deep)"
      >
        {submitLabel}
      </button>
    </form>
  );
}
