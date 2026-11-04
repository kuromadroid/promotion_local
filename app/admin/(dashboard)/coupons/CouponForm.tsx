import { LOCALES, Locale } from "@/lib/types";

export interface CouponFormInitial {
  offer: Record<Locale, string>;
  terms: Record<Locale, string[]>;
  imageUrl: string;
  restaurantIds: string[];
  isActive: boolean;
}

const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語（必須）",
  en: "英語",
  "zh-CN": "中国語（簡体字）",
  "zh-TW": "中国語（繁体字）",
  ko: "韓国語",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-(--color-line) px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-(--color-coral)";
const labelClass = "block text-sm font-medium text-(--color-ink)";

export function CouponForm({
  action,
  restaurants,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  restaurants: { id: string; name: string }[];
  initial?: CouponFormInitial;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-(--color-line) bg-white p-6">
        <div>
          <span className={labelClass}>特典の文言（画像の下に大きく出る文字）</span>
          <p className="mt-1 text-xs text-(--color-ink-soft)">
            空欄の言語は、英語か日本語の文言で表示されます。
          </p>
        </div>
        {LOCALES.map((locale) => (
          <label key={locale} className={labelClass}>
            {LOCALE_LABELS[locale]}
            <input
              type="text"
              name={`offer_${locale}`}
              required={locale === "ja"}
              maxLength={60}
              defaultValue={initial?.offer[locale]}
              placeholder={locale === "ja" ? "ラッシー1杯無料" : undefined}
              className={inputClass}
            />
          </label>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-(--color-line) bg-white p-6">
        <div>
          <span className={labelClass}>注意の文言</span>
          <p className="mt-1 text-xs text-(--color-ink-soft)">
            1行が箇条書きの1項目になります。空欄の言語は、英語か日本語の文言で表示されます。
          </p>
        </div>
        {LOCALES.map((locale) => (
          <label key={locale} className={labelClass}>
            {locale === "ja" ? "日本語" : LOCALE_LABELS[locale]}
            <textarea
              name={`terms_${locale}`}
              rows={7}
              defaultValue={initial?.terms[locale]?.join("\n")}
              className={inputClass}
            />
          </label>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-(--color-line) bg-white p-6">
        <div>
          <span className={labelClass}>使える店</span>
          <p className="mt-1 text-xs text-(--color-ink-soft)">
            選んだ店の写真にリボンが付き、詳細ページにクーポンボタンが出ます。1つの店に複数のクーポンを選んだ場合は、新しく作ったものが表示されます。
          </p>
        </div>
        <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {restaurants.map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm text-(--color-ink)">
              <input
                type="checkbox"
                name="restaurant_ids"
                value={r.id}
                defaultChecked={initial?.restaurantIds.includes(r.id)}
                className="accent-(--color-coral)"
              />
              <span className="truncate">{r.name}</span>
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
            className="h-40 w-auto rounded-lg border border-(--color-line) object-contain"
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
          背景を切り抜いた透過PNGかWebPがきれいに収まります。{initial && "選び直したときだけ差し替わります。"}
        </p>

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

      <button
        type="submit"
        className="rounded-lg bg-(--color-coral) px-6 py-2.5 font-medium text-white transition-colors hover:bg-(--color-coral-deep)"
      >
        {submitLabel}
      </button>
    </form>
  );
}
