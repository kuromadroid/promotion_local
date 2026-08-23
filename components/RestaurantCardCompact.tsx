import Link from "next/link";
import { RestaurantView } from "@/lib/types";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function RestaurantCardCompact({
  hotelId,
  restaurant,
  t,
}: {
  hotelId: string;
  restaurant: RestaurantView;
  t: T;
}) {
  const cuisine = restaurant.tags.find((tag) => tag.type === "cuisine")?.name;

  return (
    <Link
      href={`/h/${hotelId}/restaurants/${restaurant.id}`}
      className="group block w-[46%] shrink-0 snap-start overflow-hidden rounded-xl border border-(--color-line) bg-white sm:w-[220px]"
    >
      <div className="relative aspect-square overflow-hidden bg-(--color-snow-muted)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={restaurant.photos[0]}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 left-2 rounded-full bg-(--color-navy) px-2 py-0.5 text-[11px] font-medium text-white">
          {t("walkFromHotel", { minutes: restaurant.walkingMinutes })}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-1 text-sm font-bold text-(--color-ink)">
          {restaurant.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-(--color-ink-soft)">
          {cuisine ?? restaurant.area.name}
        </p>
      </div>
    </Link>
  );
}
