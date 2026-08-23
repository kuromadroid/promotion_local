import { notFound } from "next/navigation";
import { getHotel } from "@/lib/repositories";
import { getMessages, getServerLocale } from "@/lib/i18n/locale";
import { Header } from "@/components/Header";

export default async function RestaurantsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const hotel = await getHotel(hotelId);
  if (!hotel) notFound();

  const locale = await getServerLocale();
  const messages = getMessages(locale);

  return (
    <>
      <Header hotelId={hotel.id} hotelName={hotel.name} subtitle={messages.heroSubtitle} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
