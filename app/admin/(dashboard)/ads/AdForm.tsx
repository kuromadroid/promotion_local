export interface AdFormInitial {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  position: number;
  isActive: boolean;
  hotelIds: string[];
}

const inputClass =
  "mt-1 w-full rounded-lg border border-(--color-line) px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-(--color-coral)";
const labelClass = "block text-sm font-medium text-(--color-ink)";

export function AdForm({
  action,
  hotels,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  hotels: { id: string; name: string }[];
  initial?: AdFormInitial;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-(--color-line) bg-white p-6">
        <p className="text-xs text-(--color-ink-soft)">
          広告は、日本語以外の言語で見ているお客様にだけ、トップページの店舗一覧（「一覧」を選んでいるとき）に「AD」付きのカードとして表示されます。押すとリンク先URLが別タブで開きます。
        </p>

        <label className={labelClass}>
          タイトル（カードに大きく出る文字）
          <input
            type="text"
            name="title"
            required
            defaultValue={initial?.title}
            placeholder="Sapporo Sake Tour"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          サブタイトル（任意・タイトルの下に小さく出る文字）
          <input
            type="text"
            name="subtitle"
            defaultValue={initial?.subtitle}
            placeholder="Book a guided tasting tonight"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          リンク先URL
          <input
            type="url"
            name="link_url"
            required
            defaultValue={initial?.linkUrl}
            placeholder="https://example.com"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          表示位置（何店舗目の後に出すか。0なら一番上）
          <input
            type="number"
            name="position"
            min={0}
            step={1}
            required
            defaultValue={initial?.position ?? 3}
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-medium text-(--color-ink)">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.isActive ?? true}
            className="accent-(--color-coral)"
          />
          公開する
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-(--color-line) bg-white p-6">
        <div>
          <span className={labelClass}>表示するホテル</span>
          <p className="mt-1 text-xs text-(--color-ink-soft)">
            何も選ばなければ全ホテルに表示されます。選んだ場合は、そのホテルだけに表示されます。
          </p>
        </div>
        <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {hotels.map((h) => (
            <label key={h.id} className="flex items-center gap-2 text-sm text-(--color-ink)">
              <input
                type="checkbox"
                name="hotel_ids"
                value={h.id}
                defaultChecked={initial?.hotelIds.includes(h.id)}
                className="accent-(--color-coral)"
              />
              <span className="truncate">{h.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-(--color-line) bg-white p-6">
        <span className={labelClass}>画像</span>
        {initial?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={initial.imageUrl}
            alt=""
            className="aspect-[16/10] w-full max-w-sm rounded-lg border border-(--color-line) object-cover"
          />
        )}
        <input
          type="file"
          name="image_file"
          accept="image/*"
          required={!initial}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-(--color-navy) file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-(--color-navy-deep)"
        />
        <p className="text-xs text-(--color-ink-soft)">
          横長（16:10くらい）の写真がきれいに収まります。{initial && "選び直したときだけ差し替わります。"}
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
