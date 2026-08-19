import Link from "next/link";
import { notFound } from "next/navigation";
import { getRestaurantForHotel } from "@/lib/repositories";
import { getMessages, getServerLocale } from "@/lib/i18n/locale";
import { PhotoGallery } from "@/components/PhotoGallery";
import { DistanceBadge } from "@/components/DistanceBadge";
import { TagPill } from "@/components/TagPill";
import { CTAButtons } from "@/components/CTAButtons";
import { TrackOnMount } from "@/components/TrackOnMount";

export default async function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; restaurantId: string }>;
}) {
  const { hotelId, restaurantId } = await params;
  const locale = await getServerLocale();
  const messages = getMessages(locale);
  const t = (key: string, vars?: Record<string, string | number>) => {
    let s = messages[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };

  const restaurant = await getRestaurantForHotel(hotelId, restaurantId, locale);
  if (!restaurant) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <TrackOnMount
        event={{
          eventName: "restaurant_detail_view",
          hotelId,
          restaurantId,
          language: locale,
        }}
      />

      <Link
        href={`/h/${hotelId}/restaurants`}
        className="inline-flex items-center gap-1 text-sm font-medium text-(--color-ink-soft) hover:text-(--color-navy)"
      >
        ← {t("backToList")}
      </Link>

      <PhotoGallery photos={restaurant.photos} alt={restaurant.name} />

      <div>
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-extrabold">{restaurant.name}</h1>
          {restaurant.isSponsored && (
            <span className="rounded-full bg-(--color-gold) px-2.5 py-1 text-xs font-semibold text-(--color-navy-deep)">
              {t("sponsoredLabel")}
            </span>
          )}
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <DistanceBadge
            walkLabel={t("walkFromHotel", { minutes: restaurant.walkingMinutes })}
            distanceLabel={t("distanceFromHotel", { meters: restaurant.distanceMeters })}
          />
          <span className="text-sm font-semibold text-(--color-coral-deep)">
            ¥{restaurant.priceMin.toLocaleString()}〜
            {restaurant.priceMax.toLocaleString()}
          </span>
          <span className="text-sm text-(--color-ink-soft)">
            {restaurant.area.name}
          </span>
        </div>

        <p className="mb-4 leading-relaxed text-(--color-ink)">
          {restaurant.description}
        </p>

        <div className="mb-5 flex flex-wrap gap-1.5">
          {restaurant.tags.map((tag) => (
            <TagPill key={tag.id} label={tag.name} />
          ))}
        </div>

        <CTAButtons
          hotelId={hotelId}
          restaurantId={restaurant.id}
          googleMapsUrl={restaurant.googleMapsUrl}
          reservationUrl={restaurant.reservationUrl}
          instagramUrl={restaurant.instagramUrl}
          phone={restaurant.phone}
        />

        <dl className="mt-6 divide-y divide-(--color-line) rounded-2xl border border-(--color-line) bg-white text-sm">
          {restaurant.recommendedDish && (
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-(--color-ink-soft)">{t("recommendedDish")}</dt>
              <dd className="text-right font-medium">{restaurant.recommendedDish}</dd>
            </div>
          )}
          {restaurant.openingHours && (
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-(--color-ink-soft)">{t("openingHours")}</dt>
              <dd className="text-right font-medium">{restaurant.openingHours}</dd>
            </div>
          )}
          {restaurant.closedDays && (
            <div className="flex justify-between gap-4 px-4 py-3">
              <dt className="text-(--color-ink-soft)">{t("closedDays")}</dt>
              <dd className="text-right font-medium">{restaurant.closedDays}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-(--color-ink-soft)">{t("priceRange")}</dt>
            <dd className="text-right font-medium">
              ¥{restaurant.priceMin.toLocaleString()}〜
              {restaurant.priceMax.toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
