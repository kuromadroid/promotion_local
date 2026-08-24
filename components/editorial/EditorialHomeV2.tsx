"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Locale, RestaurantView } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { resolveReservationUrl } from "@/lib/reservationUrl";
import HeroCollage, { HeroCollageImage } from "@/components/editorial/HeroCollage";
import styles from "./sapporo-bites-editorial-v2.module.css";

type T = (key: string, vars?: Record<string, string | number>) => string;

const FOOD_TAGS: { tagId: string; label: Record<Locale, string> }[] = [
  {
    tagId: "genghis-khan",
    label: { ja: "ジンギスカン", en: "Genghis Khan", zh: "成吉思汗烤肉", ko: "징기스칸" },
  },
  { tagId: "seafood", label: { ja: "海鮮", en: "Seafood", zh: "海鲜", ko: "해산물" } },
  { tagId: "yakiniku", label: { ja: "焼肉", en: "Yakiniku", zh: "烤肉", ko: "야키니쿠" } },
  { tagId: "izakaya", label: { ja: "居酒屋", en: "Izakaya", zh: "居酒屋", ko: "이자카야" } },
  { tagId: "bar", label: { ja: "BAR", en: "Bar", zh: "酒吧", ko: "바" } },
];

function metaText(r: RestaurantView, t: T) {
  return [t("walkFromHotel", { minutes: r.walkingMinutes }), `¥${r.priceMin.toLocaleString()}〜`]
    .filter(Boolean)
    .join(" · ");
}

export function EditorialHomeV2({
  hotelId,
  hotelName,
  heroPhotos,
  restaurants,
  messages,
  locale,
}: {
  hotelId: string;
  hotelName: string;
  heroPhotos: string[];
  restaurants: RestaurantView[];
  messages: Record<string, string>;
  locale: Locale;
}) {
  const t: T = (key, vars) => {
    let s = messages[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };

  const [activeGenre, setActiveGenre] = useState<string>("all");

  const genreFiltered = useMemo(() => {
    if (activeGenre === "all") return restaurants;
    return restaurants.filter((r) => r.tags.some((tag) => tag.id === activeGenre));
  }, [restaurants, activeGenre]);

  const featured = restaurants[0];
  const sidePicks = restaurants.slice(1, 3);

  const heroImages: HeroCollageImage[] =
    heroPhotos.length > 0
      ? heroPhotos.map((src, i) => ({ id: `hero-${i}`, src, alt: hotelName }))
      : restaurants
          .filter((r) => Boolean(r.photos[0]))
          .map((r) => ({ id: r.id, src: r.photos[0], alt: r.name }))
          .slice(0, 7);

  const handleReserve = (r: RestaurantView) => {
    trackEvent({ eventName: "reservation_click", hotelId, restaurantId: r.id });
    const url = resolveReservationUrl(r, locale);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMap = (r: RestaurantView) => {
    trackEvent({ eventName: "map_click", hotelId, restaurantId: r.id });
    if (r.googleMapsUrl) window.open(r.googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  const handleView = (r: RestaurantView) => {
    trackEvent({ eventName: "restaurant_view", hotelId, restaurantId: r.id });
  };

  const renderListGrid = (list: RestaurantView[]) =>
    list.length === 0 ? (
      <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--muted)", fontWeight: 700 }}>
        {t("noResults")}
      </div>
    ) : (
      <div className={styles.allGrid}>
        {list.map((r) => (
          <article className={styles.listCard} key={r.id}>
            <Link
              href={`/h/${hotelId}/restaurants/${r.id}`}
              className={styles.listPhoto}
              onClick={() => handleView(r)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photos[0]} alt={r.name} />
            </Link>

            <div className={styles.listBody}>
              <Link
                href={`/h/${hotelId}/restaurants/${r.id}`}
                className={styles.listTextLink}
                onClick={() => handleView(r)}
              >
                <h3>{r.name}</h3>
                <div className={styles.meta}>{metaText(r, t)}</div>
                <div className={styles.desc}>{r.description}</div>
              </Link>

              <div className={styles.actions}>
                {resolveReservationUrl(r, locale) && (
                  <button
                    type="button"
                    className={`${styles.button} ${styles.primaryButton}`}
                    onClick={() => handleReserve(r)}
                  >
                    {t("makeReservation")}
                  </button>
                )}
                {r.googleMapsUrl && (
                  <button type="button" className={styles.button} onClick={() => handleMap(r)}>
                    {t("viewOnMap")}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    );

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {/* HERO */}
        <section className={styles.hero} id="tonight">
          <HeroCollage images={heroImages} />
          <div className={styles.heroShade} />

          <div className={styles.heroCopy}>
            <div className={styles.heroHotelName}>{hotelName}</div>
            <span className={styles.kicker}>{t("heroCollageLabel")}</span>
          </div>
        </section>

        {/* 01. GENRE (with inline filtered list) */}
        <section className={styles.section} id="genre">
          <div className={styles.sectionHead}>
            <div>
              <h2>{t("genreSectionTitle")}</h2>
              <p className={styles.lead}>{t("genreSectionSubtitle")}</p>
            </div>
            <div className={styles.index}>01 / GENRE</div>
          </div>

          <div className={`${styles.chips} ${styles.chipsWrap}`}>
            <button
              type="button"
              className={`${styles.chip} ${activeGenre === "all" ? styles.activeChip : ""}`}
              onClick={() => setActiveGenre("all")}
            >
              {t("all")}
            </button>
            {FOOD_TAGS.map((food) => (
              <button
                type="button"
                key={food.tagId}
                className={`${styles.chip} ${activeGenre === food.tagId ? styles.activeChip : ""}`}
                onClick={() => setActiveGenre(food.tagId)}
              >
                {food.label[locale]}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>{renderListGrid(genreFiltered)}</div>
        </section>

        {/* 02. TONIGHT (featured triptych) */}
        {featured && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{t("featuredSectionTitle")}</h2>
                <p className={styles.lead}>{t("featuredSectionSubtitle")}</p>
              </div>
              <div className={styles.index}>02 / TONIGHT</div>
            </div>

            <div className={styles.triptych}>
              <Link
                href={`/h/${hotelId}/restaurants/${featured.id}`}
                onClick={() => handleView(featured)}
                className={`${styles.storyCard} ${styles.bigStory}`}
              >
                <div className={styles.flag}>{t("featuredBadge")}</div>
                <div className={styles.storyPhoto}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featured.photos[0]} alt={featured.name} />
                </div>
                <div className={styles.storyCopy}>
                  <div className={styles.bigStoryTitle}>{featured.name}</div>
                  <div className={styles.meta}>{metaText(featured, t)}</div>
                  <div className={styles.copy}>{featured.description}</div>
                  <span className={styles.microTag}>
                    {[featured.tags.find((tag) => tag.type === "cuisine")?.name, t("featuredMicroTagSapporo")]
                      .filter(Boolean)
                      .join(" / ")}
                  </span>
                </div>
              </Link>

              {sidePicks.map((r) => (
                <Link
                  key={r.id}
                  href={`/h/${hotelId}/restaurants/${r.id}`}
                  onClick={() => handleView(r)}
                  className={styles.storyCard}
                >
                  <div className={styles.storyPhoto}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.photos[0]} alt={r.name} />
                  </div>
                  <div className={styles.storyCopy}>
                    <div className={styles.storyTitle}>{r.name}</div>
                    <div className={styles.meta}>{metaText(r, t)}</div>
                    <div className={styles.copy}>{r.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 03. ALL */}
        <section className={styles.section} id="all">
          <div className={styles.sectionHead}>
            <div>
              <h2>{t("allSectionTitle")}</h2>
            </div>
            <div className={styles.index}>03 / ALL</div>
          </div>

          {renderListGrid(restaurants)}
        </section>
      </div>

      <button
        type="button"
        className={styles.toTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        {t("scrollTopButton")}
      </button>
    </main>
  );
}
