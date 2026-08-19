import Link from "next/link";
import {
  getAreasResolved,
  getNearestForHotel,
  getRecommendedForHotel,
} from "@/lib/repositories";
import { getMessages, getServerLocale } from "@/lib/i18n/locale";
import { SearchBar } from "@/components/SearchBar";
import { RestaurantCard } from "@/components/RestaurantCard";
import { TagPill } from "@/components/TagPill";
import { TrackOnMount } from "@/components/TrackOnMount";

const GENRES = [
  { tagId: "seafood", ja: "海鮮" },
  { tagId: "sushi", ja: "寿司" },
  { tagId: "genghis-khan", ja: "ジンギスカン" },
  { tagId: "ramen", ja: "ラーメン" },
  { tagId: "izakaya", ja: "居酒屋" },
];

const GENRE_LABELS: Record<string, Record<string, string>> = {
  seafood: { ja: "海鮮", en: "Seafood", zh: "海鲜", ko: "해산물" },
  sushi: { ja: "寿司", en: "Sushi", zh: "寿司", ko: "초밥" },
  "genghis-khan": {
    ja: "ジンギスカン",
    en: "Genghis Khan",
    zh: "成吉思汗烤肉",
    ko: "징기스칸",
  },
  ramen: { ja: "ラーメン", en: "Ramen", zh: "拉面", ko: "라멘" },
  izakaya: { ja: "居酒屋", en: "Izakaya", zh: "居酒屋", ko: "이자카야" },
};

export default async function HotelTopPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const t = (key: string, vars?: Record<string, string | number>) => {
    let s = messages[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };

  const [areas, nearest, recommended] = await Promise.all([
    getAreasResolved(locale),
    getNearestForHotel(hotelId, locale, 4),
    getRecommendedForHotel(hotelId, locale, 6),
  ]);

  return (
    <div className="space-y-8">
      <TrackOnMount event={{ eventName: "page_view", hotelId, language: locale }} />

      <section className="rounded-2xl bg-(--color-snow-muted) px-5 py-5 sm:px-6">
        <SearchBar hotelId={hotelId} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">
          {t("browseByArea")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <Link key={area.id} href={`/h/${hotelId}/restaurants?area=${area.id}`}>
              <TagPill label={area.name} />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">
          {t("browseByCuisine")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <Link
              key={g.tagId}
              href={`/h/${hotelId}/restaurants?tags=${g.tagId}`}
            >
              <TagPill label={GENRE_LABELS[g.tagId][locale] ?? g.ja} />
            </Link>
          ))}
        </div>
      </section>

      {nearest.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">
              {t("nearThisHotel")}
            </h2>
            <Link
              href={`/h/${hotelId}/restaurants?sort=distance`}
              className="text-sm font-medium text-(--color-coral-deep) hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {nearest.map((r) => (
              <RestaurantCard key={r.id} hotelId={hotelId} restaurant={r} t={t} />
            ))}
          </div>
        </section>
      )}

      {recommended.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-(--color-ink-soft)">
              {t("recommended")}
            </h2>
            <Link
              href={`/h/${hotelId}/restaurants`}
              className="text-sm font-medium text-(--color-coral-deep) hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {recommended.map((r) => (
              <RestaurantCard key={r.id} hotelId={hotelId} restaurant={r} t={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
