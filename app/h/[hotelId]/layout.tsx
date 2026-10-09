import Link from "next/link";
import { notFound } from "next/navigation";
import { getHotel } from "@/lib/repositories";
import { getMessages, getServerLocale, hasLocaleCookie } from "@/lib/i18n/locale";
import { LocaleProvider } from "@/components/LocaleProvider";
import { LanguageGate } from "@/components/LanguageGate";

export default async function HotelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const hotel = await getHotel(hotelId);
  if (!hotel) notFound();

  // Live hotels pick the language from the browser automatically; the demo
  // hotel keeps the explicit language picker for sales demos.
  if (hotel.isDemo && !(await hasLocaleCookie())) {
    return <LanguageGate hotelId={hotel.id} hotelName={hotel.name} />;
  }

  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return (
    <LocaleProvider locale={locale} messages={messages}>
      {children}
      <footer className="mt-8 bg-(--color-navy-deep) py-6 text-center text-xs text-white/60">
        <Link
          href="/privacy"
          className="underline underline-offset-2 transition-colors hover:text-white/90"
        >
          {messages.privacyPolicy}
        </Link>
        <div className="mt-2">{messages.poweredByFooter}</div>
      </footer>
    </LocaleProvider>
  );
}
