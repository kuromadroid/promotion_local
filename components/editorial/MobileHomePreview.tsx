"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Locale, RestaurantView } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { resolveReservationUrl } from "@/lib/reservationUrl";
import { walkLabel } from "@/lib/distanceDisplay";
import HeroCollage, { HeroCollageImage } from "@/components/editorial/HeroCollage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import editorial from "./sapporo-bites-editorial-v2.module.css";
import styles from "./mobile-home-preview.module.css";

type T = (key: string, vars?: Record<string, string | number>) => string;

// List layout: "large" = full-width photo, ~2.5 shops per screen, with
// reserve/map buttons; "grid" = two columns of square photos, ~5 shops per
// screen, tap for details. Remembered per device; when storage is unavailable
// (private mode etc.) it lasts for the visit only.
type ListView = "large" | "grid";
const VIEW_STORAGE_KEY = "sb-list-view";
const TOPBAR_HEIGHT = 53; // keep in sync with --topbar-h in mobile-home-preview.module.css
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

/**
 * Phone-first hotel top page, shown only on the UI preview hotel
 * (lib/uiPreview.ts). Compared with EditorialHomeV2:
 *   - one restaurant list instead of two (genre list + "all" list)
 *   - genre chips stick under the header, so the filter is always in reach
 *   - compact cards (thumbnail beside the text) with 48px action buttons
 *   - DADS-aligned sizes: 14px+ text, 44px+ targets, yellow/black focus ring
 */
export function MobileHomePreview({
  hotelId,
  hotelName,
  heroImages,
  restaurants,
  genres,
  locale,
  t,
}: {
  hotelId: string;
  hotelName: string;
  heroImages: HeroCollageImage[];
  restaurants: RestaurantView[];
  genres: { tagId: string; label: Record<Locale, string> }[];
  locale: Locale;
  t: T;
}) {
  const [active, setActive] = useState("all");
  const [showToTop, setShowToTop] = useState(false);
  // True once every genre chip has scrolled up behind the header; the sticky
  // result row then offers a jump back to them.
  const [chipsHidden, setChipsHidden] = useState(false);
  const chipsRef = useRef<HTMLDivElement>(null);
  const listTop = useRef<HTMLDivElement>(null);
  const pendingScroll = useRef(false);

  const view = useSyncExternalStore(subscribeView, readView, () => "large" as const);

  useEffect(() => {
    const onScroll = () => {
      setShowToTop(window.scrollY > window.innerHeight);
      const chips = chipsRef.current?.getBoundingClientRect();
      setChipsHidden(Boolean(chips && chips.bottom < TOPBAR_HEIGHT));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of restaurants) for (const tag of r.tags) c[tag.id] = (c[tag.id] ?? 0) + 1;
    return c;
  }, [restaurants]);

  const filtered = useMemo(
    () => (active === "all" ? restaurants : restaurants.filter((r) => r.tags.some((tag) => tag.id === active))),
    [restaurants, active]
  );

  const picks = restaurants.slice(0, 3);
  const activeLabel = active === "all" ? t("all") : genres.find((g) => g.tagId === active)?.label[locale] ?? t("all");

  const selectGenre = (tagId: string) => {
    const next = tagId === active && tagId !== "all" ? "all" : tagId;
    setActive(next);
    if (next !== "all") trackEvent({ eventName: "tag_filter", hotelId, tagId: next, language: locale });
    pendingScroll.current = true;
  };

  // After the list re-renders for a new genre, bring the start of the results
  // up under the header. Done here rather than in the click handler
  // so the scroll isn't cut short by the list changing height.
  useEffect(() => {
    if (!pendingScroll.current) return;
    pendingScroll.current = false;
    listTop.current?.scrollIntoView({ block: "start" });
  }, [active]);

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

  return (
    <main className={`${editorial.page} ${styles.root}`}>
      <header className={`${editorial.topbar} ${styles.topbar}`}>
        <span className={editorial.brand}>SAPPORO BITES</span>
        <LanguageSwitcher wrapperClassName="" selectClassName={`${editorial.lang} ${styles.lang}`} />
      </header>

      <section className={styles.hero}>
        <HeroCollage images={heroImages} />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <p className={styles.heroKicker}>{t("heroCollageLabel")}</p>
          <h1 className={styles.heroName}>{hotelName}</h1>
        </div>
      </section>

      {picks.length > 0 && (
        <section className={styles.section} aria-labelledby="picks-title">
          <h2 id="picks-title" className={styles.h2}>
            {t("featuredSectionTitle")}
          </h2>
          <div className={styles.rail}>
            {picks.map((r) => (
              <Link
                key={r.id}
                href={`/h/${hotelId}/restaurants/${r.id}`}
                onClick={() => handleView(r)}
                className={styles.pick}
              >
                <div className={styles.pickPhoto}>
                  <Image src={r.photos[0]} alt="" fill sizes="80vw" />
                </div>
                <div className={styles.pickBody}>
                  <h3 className={styles.pickName}>{r.name}</h3>
                  <p className={styles.meta}>{meta(r)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section} aria-labelledby="genre-title">
        <h2 id="genre-title" className={styles.h2}>
          {t("genreSectionTitle")}
        </h2>

        <div ref={chipsRef} className={styles.chipArea}>
          <div className={styles.chips} role="group" aria-labelledby="genre-title">
            {[{ tagId: "all", name: t("all"), count: restaurants.length }, ...genres.map((g) => ({
              tagId: g.tagId,
              name: g.label[locale],
              count: counts[g.tagId] ?? 0,
            }))].map((g) => {
              const pressed = active === g.tagId;
              return (
                <button
                  type="button"
                  key={g.tagId}
                  aria-pressed={pressed}
                  className={`${styles.chip} ${pressed ? styles.chipActive : ""}`}
                  onClick={() => selectGenre(g.tagId)}
                >
                  {pressed && <span aria-hidden="true">✓</span>}
                  {g.name}
                  <span className={styles.chipCount}>{g.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={listTop} className={styles.listTop} />
        <div className={styles.resultRow}>
          <p className={styles.result} aria-live="polite">
            {t("genreResultCount", { genre: activeLabel, count: filtered.length })}
          </p>
          {chipsHidden && (
            <button
              type="button"
              className={styles.genreJump}
              onClick={() => chipsRef.current?.scrollIntoView({ block: "start" })}
            >
              {t("cuisine")}
              <span aria-hidden="true">↑</span>
            </button>
          )}
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
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>{t("noResults")}</p>
            <button type="button" className={styles.action} onClick={() => selectGenre("all")}>
              {t("clearFilters")}
            </button>
          </div>
        ) : view === "grid" ? (
          <ul className={styles.grid}>
            {filtered.map((r) => (
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
        ) : (
          <ul className={styles.list}>
            {filtered.map((r) => {
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
        )}
      </section>

      {showToTop && (
        <button
          type="button"
          className={styles.toTop}
          aria-label={t("scrollTopButton")}
          onClick={() => window.scrollTo({ top: 0 })}
        >
          <span aria-hidden="true">↑</span>
        </button>
      )}
    </main>
  );
}
