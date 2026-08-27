"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Locale, RestaurantView } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { resolveReservationUrl } from "@/lib/reservationUrl";
import { walkLabel } from "@/lib/distanceDisplay";
import HeroCollage, { HeroCollageImage } from "@/components/editorial/HeroCollage";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import styles from "./sapporo-bites-editorial-v2.module.css";

type T = (key: string, vars?: Record<string, string | number>) => string;

const FOOD_TAGS: { tagId: string; label: Record<Locale, string> }[] = [
  {
    tagId: "genghis-khan",
    label: {
      ja: "ジンギスカン",
      en: "Genghis Khan",
      "zh-CN": "成吉思汗烤肉",
      "zh-TW": "成吉思汗烤肉",
      ko: "징기스칸",
    },
  },
  {
    tagId: "seafood",
    label: { ja: "海鮮", en: "Seafood", "zh-CN": "海鲜", "zh-TW": "海鮮", ko: "해산물" },
  },
  {
    tagId: "yakiniku",
    label: { ja: "焼肉", en: "Yakiniku", "zh-CN": "烤肉", "zh-TW": "烤肉", ko: "야키니쿠" },
  },
  {
    tagId: "izakaya",
    label: { ja: "居酒屋", en: "Izakaya", "zh-CN": "居酒屋", "zh-TW": "居酒屋", ko: "이자카야" },
  },
  {
    tagId: "bar",
    label: { ja: "BAR", en: "Bar", "zh-CN": "酒吧", "zh-TW": "酒吧", ko: "바" },
  },
  {
    tagId: "washoku",
    label: {
      ja: "和食",
      en: "Japanese Cuisine",
      "zh-CN": "日本料理",
      "zh-TW": "日本料理",
      ko: "일식",
    },
  },
  {
    tagId: "ramen",
    label: { ja: "ラーメン", en: "Ramen", "zh-CN": "拉面", "zh-TW": "拉麵", ko: "라멘" },
  },
  {
    tagId: "soup-curry",
    label: {
      ja: "スープカレー",
      en: "Soup Curry",
      "zh-CN": "汤咖喱",
      "zh-TW": "湯咖哩",
      ko: "수프카레",
    },
  },
];

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
  const hotelNameLines = heroHotelNameLines(hotelName);

  const HERO_IMAGE_LIMIT = 5;
  const heroImages: HeroCollageImage[] = (() => {
    const curated = heroPhotos.map((src, i) => ({ id: `hero-${i}`, src, alt: hotelName }));
    if (curated.length >= HERO_IMAGE_LIMIT) return curated.slice(0, HERO_IMAGE_LIMIT);

    const curatedSrcs = new Set(curated.map((img) => img.src));
    const autoFilled = restaurants
      .filter((r) => Boolean(r.photos[0]) && !curatedSrcs.has(r.photos[0]))
      .map((r) => ({ id: r.id, src: r.photos[0], alt: r.name }));

    return [...curated, ...autoFilled].slice(0, HERO_IMAGE_LIMIT);
  })();

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
              <Image
                src={r.photos[0]}
                alt={r.name}
                fill
                sizes="(max-width: 1024px) calc(100vw - 24px), 560px"
                loading="lazy"
              />
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

        {/* 01. GENRE (with inline filtered list) */}
        <section className={styles.section} id="genre">
          <div className={styles.sectionHead}>
            <div>
              <h2>{t("genreSectionTitle")}</h2>
              <p className={styles.lead}>{t("genreSectionSubtitle")}</p>
            </div>
            <div className={styles.index}>01 / GENRE</div>
          </div>

          <div className={styles.genreGrid}>
            {FOOD_TAGS.map((food) => (
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
                  <Image
                    src={featured.photos[0]}
                    alt={featured.name}
                    fill
                    sizes="(max-width: 1024px) calc(100vw - 24px), 560px"
                    loading="lazy"
                  />
                </div>
                <div className={styles.storyCopy}>
                  <div className={styles.bigStoryTitle}>{featured.name}</div>
                  <div className={styles.meta}>{metaText(featured, t)}</div>
                  <div className={styles.copy}>{featured.description}</div>
                  {featured.tags.find((tag) => tag.type === "cuisine")?.name && (
                    <span className={styles.microTag}>
                      {featured.tags.find((tag) => tag.type === "cuisine")?.name}
                    </span>
                  )}
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
                    <Image
                      src={r.photos[0]}
                      alt={r.name}
                      fill
                      sizes="(max-width: 1024px) calc(50vw - 18px), 300px"
                      loading="lazy"
                    />
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
