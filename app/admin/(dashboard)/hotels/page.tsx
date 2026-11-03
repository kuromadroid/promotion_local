import Link from "next/link";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { deleteHotelAction } from "@/app/admin/hotelActions";
import { DeleteHotelButton } from "./DeleteHotelButton";

// Each hotel's lobby QR comes in two sign designs, red (?qr=<hotel id>-r) and
// orange (?qr=<hotel id>-o), plus one for guest rooms (?qr=room). All open the
// same page; the qr value is recorded on the qr_scan event so they can be
// counted separately. Signs printed before the redesign use ?qr=<hotel id>
// and still work; those scans are counted as "old".
const ROOM_QR_ID = "room";
const DESIGN_SUFFIXES = { red: "-r", orange: "-o" } as const;

type ScanCounts = { red: number; orange: number; old: number; room: number };

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** QR scans per hotel, split by sign design, old signs and room QR. Events
 * are kept for 180 days, so these are the last 180 days. */
async function getQrScanCounts() {
  const counts = new Map<string, ScanCounts>();
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
      const c = counts.get(e.hotel_id) ?? { red: 0, orange: 0, old: 0, room: 0 };
      const qrId = (e.meta as { qrId?: string } | null)?.qrId;
      if (qrId === ROOM_QR_ID) c.room++;
      else if (qrId === e.hotel_id + DESIGN_SUFFIXES.red) c.red++;
      else if (qrId === e.hotel_id + DESIGN_SUFFIXES.orange) c.orange++;
      else c.old++;
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
      const counts = scanCounts.get(h.id) ?? { red: 0, orange: 0, old: 0, room: 0 };
      const codes = await Promise.all(
        [
          {
            kind: "red",
            label: "通常QR（赤）",
            qrId: h.id + DESIGN_SUFFIXES.red,
            scans: counts.red,
            file: `${h.id}-qr-r.png`,
          },
          {
            kind: "orange",
            label: "通常QR（オレンジ）",
            qrId: h.id + DESIGN_SUFFIXES.orange,
            scans: counts.orange,
            file: `${h.id}-qr-o.png`,
          },
          { kind: "room", label: "客室用QR", qrId: ROOM_QR_ID, scans: counts.room, file: `${h.id}-room-qr.png` },
        ].map(async (code) => {
          const url = `${baseUrl}/h/${h.id}?qr=${encodeURIComponent(code.qrId)}`;
          const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
          return { ...code, url, qr };
        })
      );
      return { ...h, codes, oldScans: counts.old };
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
        各ホテルに「通常QR（赤・オレンジの札デザイン別）」と「客室用QR」があります。開くページは同じで、読み取り回数を別々に数えます（直近180日）。デザイン変更前に印刷した通常QRも引き続き使え、「旧デザイン」として数えます。
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

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
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
              <p className="mt-3 text-xs text-(--color-ink-soft)">
                旧デザインの通常QR 読み取り{" "}
                <span className="font-bold text-(--color-navy)">{h.oldScans.toLocaleString()}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
