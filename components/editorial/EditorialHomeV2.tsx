"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Ad, Locale, RestaurantView } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { walkLabel } from "@/lib/distanceDisplay";
import HeroCollage, { HeroCollageImage } from "@/components/editorial/HeroCollage";
import { MobileHomePreview } from "@/components/editorial/MobileHomePreview";
import { ListViewSwitch, RestaurantCards, useListView } from "@/components/editorial/RestaurantCards";
import { isUiPreviewHotel } from "@/lib/uiPreview";
import { Genre } from "@/lib/genres";
import { parseHeroPhoto } from "@/lib/heroCrop";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CouponRibbon, hasCoupon } from "@/components/CouponRibbon";
import styles from "./sapporo-bites-editorial-v2.module.css";
import cardStyles from "./mobile-home-preview.module.css";

type T = (key: string, vars?: Record<string, string | number>) => string;

function metaText(r: RestaurantView, t: T) {
  return [walkLabel(r, t), `¥${r.priceMin.toLocaleString()}〜`].filter(Boolean).join(" · ");
}

function heroHotelNameLines(hotelName: string) {
  const words = hotelName.trim().split(/\s+/);
  const isMystaysSapporo =
    words.length >= 4 &&
    words[0].toUpperCase() === "HOTEL" &&
    words[1].toUpperCase() === "MYSTAYS";

  if (!isMystaysSapporo) return [hotelName];
  return [`${words[0]} ${words[1]}`, words[2], words.slice(3).join(" ")];
}

export function EditorialHomeV2({
  hotelId,
  hotelName,
  heroPhotos,
  restaurants,
  genres,
  ads,
  messages,
  locale,
}: {
  hotelId: string;
  hotelName: string;
  heroPhotos: string[];
  restaurants: RestaurantView[];
  genres: Genre[];
  ads: Ad[];
  messages: Record<string, string>;
  locale: Locale;
}) {
  const t: T = (key, vars) => {
    let s = messages[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };

  const [activeGenre, setActiveGenre] = useState<string>("all");
  const listView = useListView();

  const genreFiltered = useMemo(() => {
    if (activeGenre === "all") return restaurants;
    return restaurants.filter((r) => r.tags.some((tag) => tag.id === activeGenre));
  }, [restaurants, activeGenre]);


  const featuredPicks = restaurants.slice(0, 3);
  const hotelNameLines = heroHotelNameLines(hotelName);

  const HERO_IMAGE_LIMIT = 5;
  const heroImages: HeroCollageImage[] = (() => {
    // parseHeroPhoto drops a #crop fragment (UI preview framing) if present.
    const curated = heroPhotos.map((stored, i) => ({ id: `hero-${i}`, src: parseHeroPhoto(stored).src, alt: hotelName }));
    if (curated.length >= HERO_IMAGE_LIMIT) return curated.slice(0, HERO_IMAGE_LIMIT);

    const curatedSrcs = new Set(curated.map((img) => img.src));
    const autoFilled = restaurants
      .filter((r) => Boolean(r.photos[0]) && !curatedSrcs.has(r.photos[0]))
      .map((r) => ({ id: r.id, src: r.photos[0], alt: r.name }));

    return [...curated, ...autoFilled].slice(0, HERO_IMAGE_LIMIT);
  })();

  if (isUiPreviewHotel(hotelId)) {
    return (
      <MobileHomePreview
        hotelId={hotelId}
        hotelName={hotelName}
        heroPhotos={heroPhotos}
        restaurants={restaurants}
        ads={ads}
        genres={genres}
        locale={locale}
        t={t}
      />
    );
  }

  const handleView = (r: RestaurantView) => {
    trackEvent({ eventName: "restaurant_view", hotelId, restaurantId: r.id });
  };

  const renderListGrid = (list: RestaurantView[], listAds: Ad[]) => (
    <div className={cardStyles.cards}>
      <div className={cardStyles.cardsHead}>
        <ListViewSwitch view={listView} t={t} />
      </div>
      {list.length === 0 ? (
        <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--muted)", fontWeight: 700 }}>
          {t("noResults")}
        </div>
      ) : (
        <RestaurantCards restaurants={list} ads={listAds} view={listView} hotelId={hotelId} locale={locale} t={t} />
      )}
    </div>
  );

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.brand}>SAPPORO BITES</span>
        <LanguageSwitcher wrapperClassName="" selectClassName={styles.lang} />
      </header>

      <div className={styles.shell}>
        {/* HERO */}
        <section className={styles.hero} id="tonight">
          <HeroCollage images={heroImages} />
          <div className={styles.heroShade} />

          <div className={styles.heroCopy}>
            <div className={styles.heroCategory}>{t("heroCollageLabel")}</div>
            <h1 className={styles.heroHotelName} aria-label={hotelName}>
              {hotelNameLines.map((line, index) => (
                <span className={styles.heroHotelNameLine} key={`${index}-${line}`}>
                  {line}
                </span>
              ))}
            </h1>
          </div>
        </section>

        {/* GENRE (with inline filtered list) */}
        <section className={styles.section} id="genre">
          <div className={styles.sectionHead}>
            <h2>{t("genreSectionTitle")}</h2>
          </div>

          <div className={styles.genreGrid}>
            <button
              type="button"
              className={`${styles.genreCell} ${styles.genreCellAll} ${activeGenre === "all" ? styles.genreCellActive : ""}`}
              onClick={() => setActiveGenre("all")}
            >
              {t("genreAll")}
            </button>
            {genres.map((food) => (
              <button
                type="button"
                key={food.tagId}
                className={`${styles.genreCell} ${activeGenre === food.tagId ? styles.genreCellActive : ""}`}
                onClick={() => setActiveGenre(food.tagId)}
              >
                {food.label[locale]}
              </button>
            ))}
          </div>

          {renderListGrid(genreFiltered, activeGenre === "all" ? ads : [])}
        </section>

        {/* TONIGHT (featured picks, swipe sideways) */}
        {featuredPicks.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{t("featuredSectionTitle")}</h2>
                <p className={styles.lead}>{t("featuredSectionSubtitle")}</p>
              </div>
            </div>

            <div className={styles.storyRail}>
              {featuredPicks.map((r) => {
                const cuisineTag = r.tags.find((tag) => tag.type === "cuisine")?.name;
                return (
                  <Link
                    key={r.id}
                    href={`/h/${hotelId}/restaurants/${r.id}`}
                    onClick={() => handleView(r)}
                    className={styles.storyCard}
                  >
                    <div className={styles.storyPhoto}>
                      <Image src={r.photos[0]} alt={r.name} fill sizes="(max-width: 1024px) 80vw, 380px" loading="lazy" />
                      {hasCoupon(r) && <CouponRibbon label={t("couponLabel")} />}
                    </div>
                    <div className={styles.storyCopy}>
                      <div className={styles.storyTitle}>{r.name}</div>
                      <div className={styles.meta}>{metaText(r, t)}</div>
                      <div className={styles.copy}>{r.description}</div>
                      {cuisineTag && <span className={styles.microTag}>{cuisineTag}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

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
