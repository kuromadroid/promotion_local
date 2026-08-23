import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header({
  hotelId,
  hotelName,
  subtitle,
}: {
  hotelId: string;
  hotelName: string;
  subtitle: string;
}) {
  return (
    <header className="bg-(--color-navy) text-white">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex justify-end border-b border-white/10 py-2.5">
          <LanguageSwitcher />
        </div>
        <Link href={`/h/${hotelId}`} className="block py-6">
          <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
            {hotelName}
          </h1>
          <p className="mt-1.5 text-sm text-white/80">{subtitle}</p>
        </Link>
      </div>
    </header>
  );
}
