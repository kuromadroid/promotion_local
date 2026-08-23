import { Area } from "@/lib/types";
import { AddressLookup } from "@/components/admin/AddressLookup";

export interface HotelFormInitial {
  name: string;
  areaId: string;
  latitude: number;
  longitude: number;
  heroPhotos: string[];
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

        <AddressLookup latName="latitude" lngName="longitude" />

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

      <section className="space-y-4 rounded-2xl border border-(--color-line) bg-white p-6">
        <div>
          <span className={labelClass}>トップページのコラージュ写真</span>
          <p className="mt-1 text-xs text-(--color-ink-soft)">
            未設定の場合は、掲載店舗の写真から自動で選ばれます。ここで写真を追加すると、そちらが優先して使われます。
          </p>
        </div>

        {initial && initial.heroPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {initial.heroPhotos.map((url) => (
              <label key={url} className="group relative block overflow-hidden rounded-lg border border-(--color-line)">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-square w-full object-cover" />
                <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-1.5 opacity-0 transition-opacity group-has-[:checked]:opacity-100 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-white">
                    <input type="checkbox" name="delete_hero_photos" value={url} className="accent-(--color-coral)" />
                    削除
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
        <input type="hidden" name="existing_hero_photos" value={initial?.heroPhotos.join("|") ?? ""} />

        <input
          type="file"
          name="hero_photo_files"
          accept="image/*"
          multiple
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-(--color-navy) file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-(--color-navy-deep)"
        />
        <p className="text-xs text-(--color-ink-soft)">複数選択できます。追加した写真は保存時にアップロードされます。</p>
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
