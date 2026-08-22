import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { deleteHotelAction } from "@/app/admin/hotelActions";
import { DeleteHotelButton } from "./DeleteHotelButton";

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function AdminHotelsPage() {
  const [{ data: hotels, error }, baseUrl] = await Promise.all([
    supabaseAdmin.from("hotels").select("id, name, area_id, latitude, longitude").order("name"),
    getBaseUrl(),
  ]);
  if (error) throw error;

  const rows = await Promise.all(
    (hotels ?? []).map(async (h) => {
      const url = `${baseUrl}/h/${h.id}`;
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
      return { ...h, url, qr };
    })
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-(--color-navy)">ホテル管理 ({rows.length})</h1>
        <Link
          href="/admin/hotels/new"
          className="rounded-lg bg-(--color-coral) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--color-coral-deep)"
        >
          + ホテルを追加
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-(--color-ink-soft)">まだホテルが登録されていません。</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {rows.map((h) => (
            <div key={h.id} className="flex gap-4 rounded-2xl border border-(--color-line) bg-white p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={h.qr}
                alt={`${h.name}のQRコード`}
                className="h-28 w-28 shrink-0 rounded-lg border border-(--color-line)"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold text-(--color-ink)">{h.name}</h2>
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs text-(--color-navy) hover:underline"
                >
                  {h.url}
                </a>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <a
                    href={h.qr}
                    download={`${h.id}-qr.png`}
                    className="text-sm text-(--color-navy) hover:underline"
                  >
                    QRをダウンロード
                  </a>
                  <Link
                    href={`/admin/hotels/${h.id}/edit`}
                    className="text-sm text-(--color-navy) hover:underline"
                  >
                    編集
                  </Link>
                  <DeleteHotelButton
                    hotelName={h.name}
                    action={async () => {
                      "use server";
                      await deleteHotelAction(h.id);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
