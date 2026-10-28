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
import { parseHeroPhoto } from "@/lib/heroCrop";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import styles from "./sapporo-bites-editorial-v2.module.css";
import cardStyles from "./mobile-home-preview.module.css";

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
  {
    tagId: "cafe",
    label: { ja: "カフェ", en: "Cafe", "zh-CN": "咖啡馆", "zh-TW": "咖啡廳", ko: "카페" },
  },
];

const foodTag = (tagId: string) => FOOD_TAGS.find((tag) => tag.tagId === tagId)!;

// UI preview hotel trial (see lib/demoTags.ts): 居酒屋 is split into three genres,
// and スイーツ is added.
const DEMO_FOOD_TAGS: { tagId: string; label: Record<Locale, string> }[] = [
  foodTag("genghis-khan"),
  foodTag("seafood"),
  foodTag("yakiniku"),
  {
    tagId: "yakitori-kushi",
    label: {
      ja: "焼き鳥・串",
      en: "Yakitori & Skewers",
      "zh-CN": "烤鸡串・串烧",
      "zh-TW": "烤雞串・串燒",
      ko: "야키토리・꼬치",
    },
  },
  {
    tagId: "creative-izakaya",
    label: {
      ja: "創作居酒屋",
      en: "Creative Izakaya",
      "zh-CN": "创意居酒屋",
      "zh-TW": "創意居酒屋",
      ko: "창작 이자카야",
    },
  },
  {
    tagId: "taishu-sakaba",
    label: { ja: "大衆酒場", en: "Casual Pub", "zh-CN": "大众酒馆", "zh-TW": "大眾酒館", ko: "대중 술집" },
  },
  foodTag("bar"),
  foodTag("washoku"),
  foodTag("ramen"),
  foodTag("soup-curry"),
  foodTag("cafe"),
  {
    tagId: "sweets",
    label: { ja: "スイーツ", en: "Sweets", "zh-CN": "甜点", "zh-TW": "甜點", ko: "디저트" },
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
  ads,
  messages,
  locale,
}: {
  hotelId: string;
  hotelName: string;
  heroPhotos: string[];
  restaurants: RestaurantView[];
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
        genres={DEMO_FOOD_TAGS}
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
            <button
              type="button"
              className={`${styles.genreCell} ${styles.genreCellAll} ${activeGenre === "all" ? styles.genreCellActive : ""}`}
              onClick={() => setActiveGenre("all")}
            >
              {t("genreAll")}
            </button>
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

          {renderListGrid(genreFiltered, activeGenre === "all" ? ads : [])}
        </section>

        {/* 02. TONIGHT (featured picks, swipe sideways) */}
        {featuredPicks.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{t("featuredSectionTitle")}</h2>
                <p className={styles.lead}>{t("featuredSectionSubtitle")}</p>
              </div>
              <div className={styles.index}>02 / TONIGHT</div>
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
