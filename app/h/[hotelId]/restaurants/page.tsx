import { notFound } from "next/navigation";
import {
  getHotel,
  getAreasResolved,
  getTagsResolved,
  getRestaurantsForHotel,
} from "@/lib/repositories";
import { getMessages, getServerLocale } from "@/lib/i18n/locale";
import { Header } from "@/components/Header";
import { RestaurantFilters } from "@/components/RestaurantFilters";
import { RestaurantCard } from "@/components/RestaurantCard";
import { TrackOnMount } from "@/components/TrackOnMount";

type SortValue = "priority" | "distance" | "price_asc" | "price_desc";

export default async function RestaurantListPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string }>;
  searchParams: Promise<{
    area?: string;
    tags?: string;
    sort?: string;
    q?: string;
  }>;
}) {
  const { hotelId } = await params;
  const sp = await searchParams;
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const t = (key: string, vars?: Record<string, string | number>) => {
    let s = messages[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };

  const hotel = await getHotel(hotelId);
  if (!hotel) notFound();

  const tagIds = (sp.tags ?? "").split(",").filter(Boolean);
  const sort = (sp.sort as SortValue) ?? "priority";

  const [areas, allTags, restaurants] = await Promise.all([
    getAreasResolved(locale),
    getTagsResolved(locale),
    getRestaurantsForHotel(hotelId, locale, {
      areaId: sp.area,
      tagIds,
      query: sp.q,
      sort,
    }),
  ]);

  const cuisineTags = allTags.filter((tag) => tag.type === "cuisine");
  const featureTags = allTags.filter((tag) => tag.type !== "cuisine");

  return (
    <>
      <Header hotelId={hotel.id} hotelName={hotel.name} subtitle={messages.heroSubtitle} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <TrackOnMount event={{ eventName: "page_view", hotelId, language: locale }} />

          <aside className="lg:sticky lg:top-4 lg:self-start">
            <h1 className="mb-4 text-lg font-bold">{t("restaurants")}</h1>
            <RestaurantFilters
              hotelId={hotelId}
              areas={areas}
              cuisineTags={cuisineTags}
              featureTags={featureTags}
            />
          </aside>

          <div>
            {restaurants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-(--color-line) px-6 py-16 text-center text-(--color-ink-soft)">
                {t("noResults")}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {restaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    hotelId={hotelId}
                    restaurant={{ ...r, photos: r.photos.slice(0, 1) }}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
