import Link from "next/link";
import Image from "next/image";
import { RestaurantView } from "@/lib/types";
import { DistanceBadge } from "@/components/DistanceBadge";
import { TagPill } from "@/components/TagPill";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function RestaurantCard({
  hotelId,
  restaurant,
  t,
}: {
  hotelId: string;
  restaurant: RestaurantView;
  t: T;
}) {
  return (
    <Link
      href={`/h/${hotelId}/restaurants/${restaurant.id}`}
      className="group block overflow-hidden rounded-2xl border border-(--color-line) bg-white transition-shadow hover:shadow-lg hover:shadow-black/5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-(--color-snow-muted)">
        <Image
          src={restaurant.photos[0]}
          alt={restaurant.name}
          fill
          sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 24px), 345px"
          loading="lazy"
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
            compact
          />
        </div>
      </div>

      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="text-base font-bold leading-snug text-(--color-ink)">
            {restaurant.name}
          </h3>
          <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-(--color-coral-deep)">
            ¥{restaurant.priceMin.toLocaleString()}〜
            {restaurant.priceMax.toLocaleString()}
          </span>
        </div>
        <p className="mb-2 text-sm text-(--color-ink-soft)">
          {restaurant.area.name} ・{" "}
          {restaurant.tags
            .filter((tag) => tag.type === "cuisine")
            .map((tag) => tag.name)
            .join(" / ") || restaurant.area.name}
        </p>
        <p className="mb-3 line-clamp-2 text-sm text-(--color-ink-soft)">
          {restaurant.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {restaurant.tags.slice(0, 3).map((tag) => (
            <TagPill key={tag.id} label={tag.name} />
          ))}
        </div>
      </div>
    </Link>
  );
}
