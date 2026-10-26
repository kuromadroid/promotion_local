"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { Locale, RestaurantView } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { resolveReservationUrl } from "@/lib/reservationUrl";
import { walkLabel } from "@/lib/distanceDisplay";
import styles from "./mobile-home-preview.module.css";

type T = (key: string, vars?: Record<string, string | number>) => string;

// List layout: "large" = full-width photo, ~2.5 shops per screen, with
// reserve/map buttons; "grid" = two columns of square photos, ~5 shops per
// screen, tap for details. Remembered per device; when storage is unavailable
// (private mode etc.) it lasts for the visit only.
export type ListView = "large" | "grid";
const VIEW_STORAGE_KEY = "sb-list-view";
let memoryView: ListView = "large";
const viewListeners = new Set<() => void>();

function readView(): ListView {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === "large" || saved === "grid") return saved;
  } catch {}
  return memoryView;
}

function changeView(next: ListView) {
  memoryView = next;
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  } catch {}
  viewListeners.forEach((notify) => notify());
}

function subscribeView(notify: () => void) {
  viewListeners.add(notify);
  return () => viewListeners.delete(notify);
}

export function useListView(): ListView {
  return useSyncExternalStore(subscribeView, readView, () => "large" as const);
}

export function ListViewSwitch({ view, t }: { view: ListView; t: T }) {
  return (
    <div className={styles.viewSwitch} role="group" aria-label={t("viewSwitchLabel")}>
      {(["large", "grid"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          className={`${styles.viewButton} ${view === v ? styles.viewButtonActive : ""}`}
          onClick={() => changeView(v)}
        >
          {t(v === "large" ? "viewLarge" : "viewGrid")}
        </button>
      ))}
    </div>
  );
}

/** Restaurant cards from the UI preview: large photo cards with reserve/map
 * buttons, or a two-column grid of square tiles. */
export function RestaurantCards({
  restaurants,
  view,
  hotelId,
  locale,
  t,
}: {
  restaurants: RestaurantView[];
  view: ListView;
  hotelId: string;
  locale: Locale;
  t: T;
}) {
  const meta = (r: RestaurantView) =>
    [walkLabel(r, t), `¥${r.priceMin.toLocaleString()}〜`].filter(Boolean).join(" · ");
  const cuisine = (r: RestaurantView) =>
    r.tags
      .filter((tag) => tag.type === "cuisine")
      .map((tag) => tag.name)
      .join("・");

  const handleView = (r: RestaurantView) =>
    trackEvent({ eventName: "restaurant_view", hotelId, restaurantId: r.id });
  const handleReserve = (r: RestaurantView) => {
    trackEvent({ eventName: "reservation_click", hotelId, restaurantId: r.id });
    const url = resolveReservationUrl(r, locale);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };
  const handleMap = (r: RestaurantView) => {
    trackEvent({ eventName: "map_click", hotelId, restaurantId: r.id });
    if (r.googleMapsUrl) window.open(r.googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  if (view === "grid") {
    return (
      <ul className={styles.grid}>
        {restaurants.map((r) => (
          <li key={r.id} className={styles.tile}>
            <Link
              href={`/h/${hotelId}/restaurants/${r.id}`}
              onClick={() => handleView(r)}
              className={styles.tileLink}
            >
              <div className={styles.tilePhoto}>
                <Image src={r.photos[0]} alt="" fill sizes="50vw" loading="lazy" />
              </div>
              <div className={styles.tileBody}>
                <h3 className={styles.tileName}>{r.name}</h3>
                <p className={styles.tileMeta}>{walkLabel(r, t)}</p>
                <p className={styles.tileMeta}>¥{r.priceMin.toLocaleString()}〜</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={styles.list}>
      {restaurants.map((r) => {
        const reservable = Boolean(resolveReservationUrl(r, locale));
        return (
          <li key={r.id} className={styles.card}>
            <Link
              href={`/h/${hotelId}/restaurants/${r.id}`}
              onClick={() => handleView(r)}
              className={styles.cardLink}
            >
              <div className={styles.photo}>
                <Image src={r.photos[0]} alt="" fill sizes="(max-width: 560px) 100vw, 560px" loading="lazy" />
                <div className={styles.photoShade} />
                {cuisine(r) && <p className={styles.badge}>{cuisine(r)}</p>}
                <div className={styles.photoText}>
                  <h3 className={styles.name}>{r.name}</h3>
                  <p className={styles.photoMeta}>{meta(r)}</p>
                </div>
              </div>
            </Link>
            {(reservable || r.googleMapsUrl) && (
              <div className={styles.actions}>
                {reservable && (
                  <button
                    type="button"
                    className={`${styles.action} ${styles.actionPrimary}`}
                    onClick={() => handleReserve(r)}
                  >
                    {t("makeReservation")}
                  </button>
                )}
                {r.googleMapsUrl && (
                  <button type="button" className={styles.action} onClick={() => handleMap(r)}>
                    {t("mapShort")}
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
