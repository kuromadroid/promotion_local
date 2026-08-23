import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const COLLAGE_SLOTS = 8;

export function Header({
  hotelId,
  hotelName,
  subtitle,
  curatedLabel,
  collagePhotos,
}: {
  hotelId: string;
  hotelName: string;
  subtitle: string;
  curatedLabel: string;
  collagePhotos: string[];
}) {
  const tiles: string[] = [];
  if (collagePhotos.length > 0) {
    for (let i = 0; i < COLLAGE_SLOTS; i++) {
      tiles.push(collagePhotos[i % collagePhotos.length]);
    }
  }

  return (
    <header className="relative overflow-hidden bg-(--color-navy) text-white">
      {tiles.length > 0 && (
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-2">
          {tiles.map((photo, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={photo} alt="" className="h-full w-full object-cover" />
          ))}
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,29,52,0.88) 0%, rgba(20,29,52,0.80) 45%, rgba(30,42,74,0.94) 100%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4">
        <div className="flex justify-end border-b border-white/10 py-2.5">
          <LanguageSwitcher />
        </div>
        <Link href={`/h/${hotelId}`} className="block py-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-coral) px-3 py-1 text-xs font-bold text-white">
            🏨 {curatedLabel}
          </span>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
            {hotelName}
          </h1>
          <p className="mt-1.5 text-sm text-white/80">{subtitle}</p>
        </Link>
      </div>
    </header>
  );
}
