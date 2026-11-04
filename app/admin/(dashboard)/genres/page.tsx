import { supabaseAdmin } from "@/lib/supabase/adminClient";
import {
  addExistingGenreAction,
  addNewGenreAction,
  moveGenreAction,
  removeGenreAction,
} from "@/app/admin/genreActions";
import { DEMO_ONLY_TAG_IDS } from "@/lib/demoTags";
import { LOCALES, Locale } from "@/lib/types";

const LOCALE_LABELS: Record<Locale, string> = {
  ja: "日本語（必須）",
  en: "英語",
  "zh-CN": "中国語（簡体字）",
  "zh-TW": "中国語（繁体字）",
  ko: "韓国語",
};

const inputClass = "w-full rounded-lg border border-(--color-line) px-3 py-2 text-sm";
const smallButtonClass =
  "rounded-lg border border-(--color-line) px-2.5 py-1 text-sm text-(--color-navy) hover:bg-black/5 disabled:opacity-30";

export default async function AdminGenresPage() {
  const [{ data: genres, error }, { data: tags }] = await Promise.all([
    supabaseAdmin.from("genres").select("tag_id, label").order("display_order", { ascending: true }),
    supabaseAdmin.from("tags").select("id, name").eq("type", "cuisine"),
  ]);

  const rows = (genres ?? []) as { tag_id: string; label: Record<Locale, string> }[];
  const usedTagIds = new Set(rows.map((g) => g.tag_id));
  const addableTags = ((tags ?? []) as { id: string; name: Record<Locale, string> }[]).filter(
    (tag) => !usedTagIds.has(tag.id) && !DEMO_ONLY_TAG_IDS.has(tag.id)
  );

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-(--color-navy)">ジャンル ({rows.length})</h1>

      <p className="mb-6 text-sm text-(--color-ink-soft)">
        全ホテルのトップページに並ぶジャンルボタンです。外してもタグと店のタグ付けは残るので、あとから戻せます。ボタンを押すと、そのタグが付いた店だけが表示されます。
      </p>

      {error ? (
        <p className="rounded-2xl border border-(--color-line) bg-white p-6 text-sm text-(--color-coral-deep)">
          ジャンル用のテーブルがまだありません。Supabase の SQL Editor で
          <code className="mx-1">supabase/migrations/202611040001_genres.sql</code>
          を実行してください。
        </p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-(--color-line) bg-white p-5">
            {rows.length === 0 ? (
              <p className="text-sm text-(--color-ink-soft)">ジャンルがありません。「一覧」ボタンだけが表示されます。</p>
            ) : (
              <ul className="divide-y divide-(--color-line)">
                {rows.map((genre, i) => (
                  <li key={genre.tag_id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-(--color-ink)">{genre.label.ja}</p>
                      <p className="truncate text-xs text-(--color-ink-soft)">{genre.label.en}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await moveGenreAction(genre.tag_id, "up");
                        }}
                      >
                        <button type="submit" disabled={i === 0} aria-label={`${genre.label.ja}を上へ`} className={smallButtonClass}>
                          ↑
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await moveGenreAction(genre.tag_id, "down");
                        }}
                      >
                        <button
                          type="submit"
                          disabled={i === rows.length - 1}
                          aria-label={`${genre.label.ja}を下へ`}
                          className={smallButtonClass}
                        >
                          ↓
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await removeGenreAction(genre.tag_id);
                        }}
                      >
                        <button type="submit" className={smallButtonClass}>
                          外す
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {addableTags.length > 0 && (
            <section className="rounded-2xl border border-(--color-line) bg-white p-5">
              <h2 className="mb-3 font-bold text-(--color-navy)">今あるタグから追加</h2>
              <form action={addExistingGenreAction} className="flex items-center gap-3">
                <select name="tag_id" required className={inputClass}>
                  {addableTags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name.ja}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="shrink-0 rounded-lg bg-(--color-coral) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-deep)"
                >
                  追加
                </button>
              </form>
            </section>
          )}

          <section className="rounded-2xl border border-(--color-line) bg-white p-5">
            <h2 className="mb-1 font-bold text-(--color-navy)">新しいジャンルを作って追加</h2>
            <p className="mb-3 text-sm text-(--color-ink-soft)">
              同じ名前のタグができます。店の編集画面でこのタグを付けると、ボタンを押したときに表示されます。空欄の言語は、英語か日本語の名前で表示されます。
            </p>
            <form action={addNewGenreAction} className="space-y-3">
              {LOCALES.map((locale) => (
                <label key={locale} className="block text-sm text-(--color-ink)">
                  {LOCALE_LABELS[locale]}
                  <input name={`name_${locale}`} required={locale === "ja"} maxLength={30} className={`mt-1 ${inputClass}`} />
                </label>
              ))}
              <button
                type="submit"
                className="rounded-lg bg-(--color-coral) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-deep)"
              >
                作って追加
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
