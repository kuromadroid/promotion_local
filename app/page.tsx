import Link from "next/link";
import { getAllHotels } from "@/lib/repositories";

export default async function DevEntryPage() {
  const hotels = await getAllHotels();

  return (
    <div className="flex flex-1 items-center justify-center bg-(--color-snow) px-4">
      <div className="w-full max-w-sm">
        <p className="mb-1 text-center text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
          Dev / QR simulator
        </p>
        <h1 className="mb-6 text-center text-xl font-bold">
          Sapporo Bites
        </h1>
        <p className="mb-6 text-center text-sm text-(--color-ink-soft)">
          In production, guests scan a QR code in the hotel lobby and land
          directly on <code>/h/[hotelId]</code>. Pick a hotel below to
          simulate that scan.
        </p>
        <div className="space-y-3">
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/h/${hotel.id}`}
              className="block rounded-xl border border-(--color-line) bg-white px-4 py-3 text-center font-medium text-(--color-navy) shadow-sm hover:border-(--color-navy)"
            >
              {hotel.name}
              <span className="ml-2 text-xs text-(--color-ink-soft)">
                /h/{hotel.id}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
