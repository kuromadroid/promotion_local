import { notFound } from "next/navigation";
import { getHotel } from "@/lib/repositories";
import { getMessages, getServerLocale, hasLocaleCookie } from "@/lib/i18n/locale";
import { LocaleProvider } from "@/components/LocaleProvider";
import { Header } from "@/components/Header";
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

  if (!(await hasLocaleCookie())) {
    return <LanguageGate hotelId={hotel.id} hotelName={hotel.name} />;
  }

  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return (
    <LocaleProvider locale={locale} messages={messages}>
      <Header
        hotelId={hotel.id}
        hotelName={hotel.name}
        subtitle={messages.heroSubtitle}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="mt-8 bg-(--color-navy-deep) py-6 text-center text-xs text-white/60">
        {messages.poweredByFooter}
      </footer>
    </LocaleProvider>
  );
}
