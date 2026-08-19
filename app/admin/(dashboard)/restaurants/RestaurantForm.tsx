import { Area, Hotel, Tag } from "@/lib/types";

export interface RestaurantFormInitial {
  areaId: string;
  priceMin: number;
  priceMax: number;
  latitude: number;
  longitude: number;
  phone: string;
  googleMapsUrl: string;
  reservationUrl: string;
  instagramUrl: string;
  openingHours: string;
  closedDays: string;
  isSponsored: boolean;
  photos: string[];
  nameJa: string;
  descriptionJa: string;
  recommendedDishJa: string;
  nameEn: string;
  descriptionEn: string;
  recommendedDishEn: string;
  tagIds: string[];
  hotelIds: string[];
}

const inputClass =
  "mt-1 w-full rounded-lg border border-(--color-line) px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-(--color-coral)";
const labelClass = "block text-sm font-medium text-(--color-ink)";

export function RestaurantForm({
  action,
  areas,
  tags,
  hotels,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  areas: Area[];
  tags: Tag[];
  hotels: Hotel[];
  initial?: RestaurantFormInitial;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-8">
      <section className="bg-white border border-(--color-line) rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-(--color-navy)">基本情報</h2>

        <div className="grid grid-cols-2 gap-4">
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
          <label className={labelClass}>
            <span className="inline-flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                name="is_sponsored"
                defaultChecked={initial?.isSponsored}
                className="rounded border-(--color-line)"
              />
              Sponsored(優先掲載)
            </span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            最低価格(円)
            <input
              type="number"
              name="price_min"
              required
              min={0}
              defaultValue={initial?.priceMin}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            最高価格(円)
            <input
              type="number"
              name="price_max"
              required
              min={0}
              defaultValue={initial?.priceMax}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            緯度(latitude)
            <input
              type="number"
              step="any"
              name="latitude"
              required
              defaultValue={initial?.latitude}
              placeholder="43.0618"
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
              placeholder="141.3545"
              className={inputClass}
            />
          </label>
        </div>
        <p className="text-xs text-(--color-ink-soft)">
          Googleマップで店舗を右クリック→座標をコピーすると取得できます。ホテルからの距離・徒歩時間はここから自動計算されます。
        </p>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            電話番号
            <input type="text" name="phone" defaultValue={initial?.phone} className={inputClass} />
          </label>
          <label className={labelClass}>
            営業時間
            <input
              type="text"
              name="opening_hours"
              defaultValue={initial?.openingHours}
              placeholder="17:00〜24:00"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            定休日
            <input
              type="text"
              name="closed_days"
              defaultValue={initial?.closedDays}
              placeholder="日曜定休"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Google MapsのURL
            <input
              type="url"
              name="google_maps_url"
              defaultValue={initial?.googleMapsUrl}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            予約URL
            <input
              type="url"
              name="reservation_url"
              defaultValue={initial?.reservationUrl}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            InstagramのURL
            <input
              type="url"
              name="instagram_url"
              defaultValue={initial?.instagramUrl}
              className={inputClass}
            />
          </label>
        </div>

        <label className={labelClass}>
          写真URL(1行に1つ)
          <textarea
            name="photos"
            rows={3}
            defaultValue={initial?.photos.join("\n")}
            placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
            className={inputClass}
          />
        </label>
      </section>

      <section className="bg-white border border-(--color-line) rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-(--color-navy)">店舗情報(日本語・必須)</h2>
        <label className={labelClass}>
          店名
          <input type="text" name="name_ja" required defaultValue={initial?.nameJa} className={inputClass} />
        </label>
        <label className={labelClass}>
          紹介文
          <textarea
            name="description_ja"
            required
            rows={2}
            defaultValue={initial?.descriptionJa}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          おすすめメニュー(任意)
          <input
            type="text"
            name="recommended_dish_ja"
            defaultValue={initial?.recommendedDishJa}
            className={inputClass}
          />
        </label>
      </section>

      <section className="bg-white border border-(--color-line) rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-(--color-navy)">Restaurant info (English, optional)</h2>
        <p className="text-xs text-(--color-ink-soft)">
          未入力の場合、英語表示は自動的に日本語にフォールバックします。
        </p>
        <label className={labelClass}>
          Name
          <input type="text" name="name_en" defaultValue={initial?.nameEn} className={inputClass} />
        </label>
        <label className={labelClass}>
          Description
          <textarea
            name="description_en"
            rows={2}
            defaultValue={initial?.descriptionEn}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Recommended dish
          <input
            type="text"
            name="recommended_dish_en"
            defaultValue={initial?.recommendedDishEn}
            className={inputClass}
          />
        </label>
      </section>

      <section className="bg-white border border-(--color-line) rounded-2xl p-6 space-y-3">
        <h2 className="font-bold text-(--color-navy)">タグ</h2>
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="inline-flex items-center gap-2 text-sm border border-(--color-line) rounded-full px-3 py-1.5"
            >
              <input
                type="checkbox"
                name="tag_ids"
                value={tag.id}
                defaultChecked={initial?.tagIds.includes(tag.id)}
                className="rounded border-(--color-line)"
              />
              {tag.name.ja}
            </label>
          ))}
        </div>
      </section>

      <section className="bg-white border border-(--color-line) rounded-2xl p-6 space-y-3">
        <h2 className="font-bold text-(--color-navy)">掲載ホテル</h2>
        <p className="text-xs text-(--color-ink-soft)">
          チェックしたホテルのページに、この店舗が表示されます(距離は緯度経度から自動計算)。
        </p>
        <div className="flex flex-wrap gap-3">
          {hotels.map((hotel) => (
            <label
              key={hotel.id}
              className="inline-flex items-center gap-2 text-sm border border-(--color-line) rounded-full px-3 py-1.5"
            >
              <input
                type="checkbox"
                name="hotel_ids"
                value={hotel.id}
                defaultChecked={initial?.hotelIds.includes(hotel.id)}
                className="rounded border-(--color-line)"
              />
              {hotel.name}
            </label>
          ))}
        </div>
      </section>

      <button
        type="submit"
        className="rounded-lg bg-(--color-coral) text-white font-medium px-6 py-2.5 hover:bg-(--color-coral-deep) transition-colors"
      >
        {submitLabel}
      </button>
    </form>
  );
}
