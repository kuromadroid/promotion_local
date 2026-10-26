import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { deleteAdAction } from "@/app/admin/adActions";
import { DeleteAdButton } from "./DeleteAdButton";

export default async function AdminAdsPage() {
  const { data: ads, error } = await supabaseAdmin
    .from("ads")
    .select("id, title, subtitle, image_url, link_url, position, is_active")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-(--color-navy)">広告枠 ({ads?.length ?? 0})</h1>
        {!error && (
          <Link
            href="/admin/ads/new"
            className="rounded-lg bg-(--color-coral) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-deep)"
          >
            + 広告を追加
          </Link>
        )}
      </div>

      <p className="mb-6 text-sm text-(--color-ink-soft)">
        日本語以外の言語で見ているお客様にだけ、全ホテルの店舗一覧に「AD」付きのカードとして混ざって表示されます。
      </p>

      {error ? (
        <p className="rounded-2xl border border-(--color-line) bg-white p-6 text-sm text-(--color-coral-deep)">
          広告用のテーブルがまだありません。Supabase の SQL Editor で
          <code className="mx-1">supabase/migrations/202610260001_ads.sql</code>
          を実行してください。
        </p>
      ) : !ads || ads.length === 0 ? (
        <p className="text-sm text-(--color-ink-soft)">まだ広告がありません。</p>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {ads.map((ad) => (
            <li key={ad.id} className="flex gap-4 rounded-2xl border border-(--color-line) bg-white p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.image_url}
                alt=""
                className="h-24 w-32 shrink-0 rounded-lg border border-(--color-line) object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-bold text-(--color-ink)">{ad.title}</h2>
                  {!ad.is_active && (
                    <span className="shrink-0 rounded-full bg-(--color-line) px-2 py-0.5 text-xs text-(--color-ink-soft)">
                      非公開
                    </span>
                  )}
                </div>
                {ad.subtitle && <p className="truncate text-sm text-(--color-ink-soft)">{ad.subtitle}</p>}
                <p className="mt-1 text-xs text-(--color-ink-soft)">{ad.position}店舗目の後に表示</p>
                <a
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs text-(--color-navy) hover:underline"
                >
                  {ad.link_url}
                </a>
                <div className="mt-3 flex items-center gap-3">
                  <Link href={`/admin/ads/${ad.id}/edit`} className="text-sm text-(--color-navy) hover:underline">
                    編集
                  </Link>
                  <DeleteAdButton
                    adTitle={ad.title}
                    action={async () => {
                      "use server";
                      await deleteAdAction(ad.id);
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
