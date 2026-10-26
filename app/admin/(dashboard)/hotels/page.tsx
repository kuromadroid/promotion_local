import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { deleteHotelAction } from "@/app/admin/hotelActions";
import { DeleteHotelButton } from "./DeleteHotelButton";

// Each hotel has two QR codes: the original one (?qr=<hotel id>, already
// printed for lobbies etc.) and one for guest rooms (?qr=room). Both open the
// same page; the qr value is recorded on the qr_scan event so they can be
// counted separately.
const ROOM_QR_ID = "room";

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** QR scans per hotel, split into room QR and the original QR. Events are
 * kept for 180 days, so these are the last 180 days. */
async function getQrScanCounts() {
  const counts = new Map<string, { main: number; room: number }>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from("events")
      .select("hotel_id, meta")
      .eq("event_name", "qr_scan")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const e of data ?? []) {
      if (!e.hotel_id) continue;
      const c = counts.get(e.hotel_id) ?? { main: 0, room: 0 };
      if ((e.meta as { qrId?: string } | null)?.qrId === ROOM_QR_ID) c.room++;
      else c.main++;
      counts.set(e.hotel_id, c);
    }
    if (!data || data.length < PAGE) break;
  }
  return counts;
}

export default async function AdminHotelsPage() {
  const [{ data: hotels, error }, baseUrl, scanCounts] = await Promise.all([
    supabaseAdmin.from("hotels").select("id, name, area_id, latitude, longitude").order("name"),
    getBaseUrl(),
    getQrScanCounts(),
  ]);
  if (error) throw error;

  const rows = await Promise.all(
    (hotels ?? []).map(async (h) => {
      const counts = scanCounts.get(h.id) ?? { main: 0, room: 0 };
      const codes = await Promise.all(
        [
          { kind: "main", label: "通常QR", qrId: h.id, scans: counts.main, file: `${h.id}-qr.png` },
          { kind: "room", label: "客室用QR", qrId: ROOM_QR_ID, scans: counts.room, file: `${h.id}-room-qr.png` },
        ].map(async (code) => {
          const url = `${baseUrl}/h/${h.id}?qr=${encodeURIComponent(code.qrId)}`;
          const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
          return { ...code, url, qr };
        })
      );
      return { ...h, codes };
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

      <p className="mb-6 text-sm text-(--color-ink-soft)">
        各ホテルに「通常QR」と「客室用QR」があります。開くページは同じで、読み取り回数を別々に数えます（直近180日）。
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-(--color-ink-soft)">まだホテルが登録されていません。</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {rows.map((h) => (
            <div key={h.id} className="rounded-2xl border border-(--color-line) bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="truncate font-bold text-(--color-ink)">{h.name}</h2>
                <div className="flex shrink-0 items-center gap-3">
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

              <div className="mt-4 grid grid-cols-2 gap-4">
                {h.codes.map((code) => (
                  <div key={code.kind} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-(--color-ink)">{code.label}</span>
                      <span className="text-xs text-(--color-ink-soft)">
                        読み取り <span className="font-bold text-(--color-navy)">{code.scans.toLocaleString()}</span>
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={code.qr}
                      alt={`${h.name}の${code.label}`}
                      className="mt-2 aspect-square w-full max-w-36 rounded-lg border border-(--color-line)"
                    />
                    <a
                      href={code.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block truncate text-xs text-(--color-navy) hover:underline"
                    >
                      {code.url}
                    </a>
                    <a
                      href={code.qr}
                      download={code.file}
                      className="mt-1 inline-block text-sm text-(--color-navy) hover:underline"
                    >
                      QRをダウンロード
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
