import Link from "next/link";
import { RestaurantView } from "@/lib/types";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function RestaurantListRow({
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
      className="flex items-center gap-3 border-b border-(--color-line) py-3 last:border-0"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-(--color-snow-muted)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={restaurant.photos[0]}
          alt={restaurant.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-bold text-(--color-ink)">
          {restaurant.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-(--color-ink-soft)">
          {cuisine || restaurant.area.name}
        </p>
      </div>
      <span className="shrink-0 whitespace-nowrap rounded-full bg-(--color-navy) px-2.5 py-1 text-xs font-medium text-white">
        {t("walkFromHotel", { minutes: restaurant.walkingMinutes })}
      </span>
    </Link>
  );
}
