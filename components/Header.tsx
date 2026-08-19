import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header({
  hotelId,
  hotelName,
  serviceName,
  stayingAtLabel,
}: {
  hotelId: string;
  hotelName: string;
  serviceName: string;
  stayingAtLabel: string;
}) {
  return (
    <header className="bg-(--color-navy) text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href={`/h/${hotelId}`} className="flex flex-col leading-tight">
          <span className="text-base font-bold tracking-tight">
            {serviceName}
          </span>
          <span className="text-xs text-white/70">
            {stayingAtLabel} — {hotelName}
          </span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
