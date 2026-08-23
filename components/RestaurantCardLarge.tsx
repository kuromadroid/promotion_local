import Link from "next/link";
import { RestaurantView } from "@/lib/types";
import { DistanceBadge } from "@/components/DistanceBadge";
import { TagPill } from "@/components/TagPill";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function RestaurantCardLarge({
  hotelId,
  restaurant,
  t,
}: {
  hotelId: string;
  restaurant: RestaurantView;
  t: T;
}) {
  const cuisine = restaurant.tags
    .filter((tag) => tag.type === "cuisine")
    .map((tag) => tag.name)
    .join(" / ");

  return (
    <Link
      href={`/h/${hotelId}/restaurants/${restaurant.id}`}
      className="group block w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border border-(--color-line) bg-white sm:w-[420px]"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-(--color-snow-muted)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={restaurant.photos[0]}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {restaurant.isSponsored && (
          <span className="absolute left-3 top-3 rounded-full bg-(--color-gold) px-2.5 py-1 text-xs font-semibold text-(--color-navy-deep)">
            {t("sponsoredLabel")}
          </span>
        )}
        <div className="absolute bottom-3 left-3">
          <DistanceBadge
            walkLabel={t("walkFromHotel", { minutes: restaurant.walkingMinutes })}
            distanceLabel={t("distanceFromHotel", { meters: restaurant.distanceMeters })}
          />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-snug text-(--color-ink)">
            {restaurant.name}
          </h3>
          <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-(--color-coral-deep)">
            ¥{restaurant.priceMin.toLocaleString()}〜
          </span>
        </div>
        {cuisine && (
          <p className="mt-0.5 text-xs font-medium text-(--color-ink-soft)">
            {restaurant.area.name} ・ {cuisine}
          </p>
        )}
        <p className="mt-2 line-clamp-2 text-sm text-(--color-ink-soft)">
          {restaurant.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag.id} label={tag.name} />
          ))}
        </div>
      </div>
    </Link>
  );
}
