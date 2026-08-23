import Link from "next/link";
import { getAreasResolved, getRestaurantsForHotel } from "@/lib/repositories";
import { getMessages, getServerLocale } from "@/lib/i18n/locale";
import { SearchBar } from "@/components/SearchBar";
import { SceneLinks } from "@/components/SceneLinks";
import { HorizontalScroll } from "@/components/HorizontalScroll";
import { RestaurantCardLarge } from "@/components/RestaurantCardLarge";
import { RestaurantCardCompact } from "@/components/RestaurantCardCompact";
import { RestaurantListRow } from "@/components/RestaurantListRow";
import { TagPill } from "@/components/TagPill";
import { TrackOnMount } from "@/components/TrackOnMount";
import { RestaurantView } from "@/lib/types";

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

const SAPPORO_CLASSIC_TAGS = ["genghis-khan", "seafood", "sushi"];
const WITHIN_WALK_MINUTES = 10;

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

  const [areas, all] = await Promise.all([
    getAreasResolved(locale),
    getRestaurantsForHotel(hotelId, locale, { sort: "priority" }),
  ]);

  const hasTag = (r: RestaurantView, tagId: string) => r.tags.some((tag) => tag.id === tagId);

  const tonightPicks = all.slice(0, 6);
  const solo = all.filter((r) => hasTag(r, "solo-friendly")).slice(0, 8);
  const sapporoClassics = all
    .filter((r) => SAPPORO_CLASSIC_TAGS.some((tagId) => hasTag(r, tagId)))
    .slice(0, 8);
  const within10 = [...all]
    .filter((r) => r.walkingMinutes <= WITHIN_WALK_MINUTES)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 8);

  return (
    <div className="space-y-9">
      <TrackOnMount event={{ eventName: "page_view", hotelId, language: locale }} />

      <section className="rounded-2xl bg-(--color-snow-muted) px-5 py-5 sm:px-6">
        <SearchBar hotelId={hotelId} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-(--color-ink)">
          {t("sceneSectionTitle")}
        </h2>
        <SceneLinks hotelId={hotelId} t={t} />
      </section>

      {tonightPicks.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold text-(--color-ink)">{t("tonightPicksTitle")}</h2>
            <Link
              href={`/h/${hotelId}/restaurants`}
              className="text-sm font-medium text-(--color-coral-deep) hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <HorizontalScroll>
            {tonightPicks.map((r) => (
              <RestaurantCardLarge key={r.id} hotelId={hotelId} restaurant={r} t={t} />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {solo.length > 0 && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-base font-bold text-(--color-ink)">{t("soloSectionTitle")}</h2>
            <Link
              href={`/h/${hotelId}/restaurants?tags=solo-friendly`}
              className="text-sm font-medium text-(--color-coral-deep) hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <HorizontalScroll>
            {solo.map((r) => (
              <RestaurantCardCompact key={r.id} hotelId={hotelId} restaurant={r} t={t} />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {sapporoClassics.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-bold text-(--color-ink)">
            {t("sapporoSectionTitle")}
          </h2>
          <HorizontalScroll>
            {sapporoClassics.map((r) => (
              <RestaurantCardCompact key={r.id} hotelId={hotelId} restaurant={r} t={t} />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {within10.length > 0 && (
        <section>
          <div className="mb-1 flex items-end justify-between">
            <h2 className="text-base font-bold text-(--color-ink)">{t("within10Title")}</h2>
            <Link
              href={`/h/${hotelId}/restaurants?sort=distance`}
              className="text-sm font-medium text-(--color-coral-deep) hover:underline"
            >
              {t("seeAll")}
            </Link>
          </div>
          <div className="rounded-2xl border border-(--color-line) bg-white px-4">
            {within10.map((r) => (
              <RestaurantListRow key={r.id} hotelId={hotelId} restaurant={r} t={t} />
            ))}
          </div>
        </section>
      )}

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
            <Link key={g.tagId} href={`/h/${hotelId}/restaurants?tags=${g.tagId}`}>
              <TagPill label={GENRE_LABELS[g.tagId][locale] ?? g.ja} />
            </Link>
          ))}
        </div>
      </section>

      <Link
        href={`/h/${hotelId}/restaurants`}
        className="block rounded-2xl border border-(--color-line) bg-white px-5 py-4 text-center text-sm font-bold text-(--color-navy) transition-colors hover:border-(--color-navy)"
      >
        {t("seeAllRestaurants")} →
      </Link>
    </div>
  );
}
