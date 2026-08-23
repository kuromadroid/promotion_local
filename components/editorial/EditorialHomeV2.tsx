"use client";

import { useMemo, useState } from "react";
import { Locale, RestaurantView } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import HeroCollage, { HeroCollageImage } from "@/components/editorial/HeroCollage";
import styles from "./sapporo-bites-editorial-v2.module.css";

type SceneTag = "all" | "solo" | "local" | "near" | "late" | "pair";
type T = (key: string, vars?: Record<string, string | number>) => string;

const FOOD_TAGS: { tagId: string; label: Record<Locale, string> }[] = [
  {
    tagId: "genghis-khan",
    label: { ja: "ジンギスカン", en: "Genghis Khan", zh: "成吉思汗烤肉", ko: "징기스칸" },
  },
  { tagId: "seafood", label: { ja: "海鮮", en: "Seafood", zh: "海鲜", ko: "해산물" } },
  { tagId: "yakiniku", label: { ja: "焼き肉", en: "Yakiniku", zh: "烤肉", ko: "야키니쿠" } },
  { tagId: "izakaya", label: { ja: "居酒屋", en: "Izakaya", zh: "居酒屋", ko: "이자카야" } },
];

function sceneKeysFor(r: RestaurantView): Exclude<SceneTag, "all">[] {
  const keys: Exclude<SceneTag, "all">[] = [];
  const hasTag = (id: string) => r.tags.some((tag) => tag.id === id);
  if (hasTag("solo-friendly")) keys.push("solo");
  if (["genghis-khan", "seafood", "sushi"].some(hasTag)) keys.push("local");
  if (r.walkingMinutes <= 10) keys.push("near");
  if (hasTag("late-night")) keys.push("late");
  if (hasTag("private-room")) keys.push("pair");
  return keys;
}

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

  const [activeScene, setActiveScene] = useState<SceneTag>("all");
  const [activeGenre, setActiveGenre] = useState<string>("all");

  const scenesByRestaurant = useMemo(() => {
    const map = new Map<string, Exclude<SceneTag, "all">[]>();
    for (const r of restaurants) map.set(r.id, sceneKeysFor(r));
    return map;
  }, [restaurants]);

  const filtered = useMemo(() => {
    if (activeScene === "all") return restaurants;
    return restaurants.filter((r) => scenesByRestaurant.get(r.id)?.includes(activeScene));
  }, [restaurants, scenesByRestaurant, activeScene]);

  const genreFiltered = useMemo(() => {
    if (activeGenre === "all") return restaurants;
    return restaurants.filter((r) => r.tags.some((tag) => tag.id === activeGenre));
  }, [restaurants, activeGenre]);

  const sceneChips: { key: SceneTag; label: string }[] = [
    { key: "all", label: t("all") },
    { key: "solo", label: `💼 ${t("sceneSolo")}` },
    { key: "local", label: `🦀 ${t("sceneSapporo")}` },
    { key: "near", label: `📍 ${t("sceneNear")}` },
    { key: "late", label: `🌙 ${t("sceneLateNight")}` },
    { key: "pair", label: `🥂 ${t("sceneCouple")}` },
  ];

  const featured = restaurants[0];
  const sidePicks = restaurants.slice(1, 3);
  const soloRestaurants = restaurants
    .filter((r) => scenesByRestaurant.get(r.id)?.includes("solo"))
    .slice(0, 5);
  const nearbyRestaurants = [...restaurants]
    .sort((a, b) => a.walkingMinutes - b.walkingMinutes)
    .slice(0, 4);

  const heroImages: HeroCollageImage[] =
    heroPhotos.length > 0
      ? heroPhotos.map((src, i) => ({ id: `hero-${i}`, src, alt: hotelName }))
      : restaurants
          .filter((r) => Boolean(r.photos[0]))
          .map((r) => ({ id: r.id, src: r.photos[0], alt: r.name }))
          .slice(0, 7);

  const handleReserve = (r: RestaurantView) => {
    trackEvent({ eventName: "reservation_click", hotelId, restaurantId: r.id });
    if (r.reservationUrl) window.open(r.reservationUrl, "_blank", "noopener,noreferrer");
  };

  const handleMap = (r: RestaurantView) => {
    trackEvent({ eventName: "map_click", hotelId, restaurantId: r.id });
    if (r.googleMapsUrl) window.open(r.googleMapsUrl, "_blank", "noopener,noreferrer");
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
            <div className={styles.listPhoto}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photos[0]} alt={r.name} />
            </div>

            <div className={styles.listBody}>
              <h3>{r.name}</h3>
              <div className={styles.meta}>{metaText(r, t)}</div>
              <div className={styles.desc}>{r.description}</div>

              <div className={styles.actions}>
                {r.reservationUrl && (
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
        <section className={styles.section}>
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
              <article className={`${styles.storyCard} ${styles.bigStory}`}>
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
              </article>

              {sidePicks.map((r) => (
                <article key={r.id} className={styles.storyCard}>
                  <div className={styles.storyPhoto}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.photos[0]} alt={r.name} />
                  </div>
                  <div className={styles.storyCopy}>
                    <div className={styles.storyTitle}>{r.name}</div>
                    <div className={styles.meta}>{metaText(r, t)}</div>
                    <div className={styles.copy}>{r.description}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 03. WALK */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <h2>{t("walkSectionTitle")}</h2>
              <p className={styles.lead}>{t("walkSectionSubtitle")}</p>
            </div>
            <div className={styles.index}>03 / WALK</div>
          </div>

          <div className={styles.walkPanel}>
            <div className={styles.walkIntro}>
              <h3>{t("walkIntroTitle")}</h3>
              <p>{t("walkIntroBody")}</p>
            </div>

            <div className={styles.walkList}>
              {nearbyRestaurants.map((r) => (
                <div className={styles.walkRow} key={r.id}>
                  <div className={styles.walkTime}>{r.walkingMinutes}分</div>
                  <div>
                    <div className={styles.walkName}>{r.name}</div>
                    <div className={styles.walkSub}>
                      {[
                        r.tags.find((tag) => tag.type === "cuisine")?.name,
                        scenesByRestaurant.get(r.id)?.includes("solo") ? t("soloIconLabel") : undefined,
                      ]
                        .filter(Boolean)
                        .join(" / ")}
                    </div>
                  </div>
                  <div className={styles.walkThumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.photos[0]} alt="" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 04. MOOD */}
        <section className={styles.section} id="scene">
          <div className={styles.sectionHead}>
            <div>
              <h2>{t("moodSectionTitle")}</h2>
              <p className={styles.lead}>{t("moodSectionSubtitle")}</p>
            </div>
            <div className={styles.index}>04 / MOOD</div>
          </div>

          <div className={styles.chips}>
            {sceneChips.map((chip) => (
              <button
                type="button"
                key={chip.key}
                className={`${styles.chip} ${activeScene === chip.key ? styles.activeChip : ""}`}
                onClick={() => setActiveScene(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        {/* 05. SOLO */}
        {soloRestaurants.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <div>
                <h2>{t("soloSectionTitle")}</h2>
                <p className={styles.lead}>{t("soloRailSubtitle")}</p>
              </div>
              <div className={styles.index}>05 / SOLO</div>
            </div>

            <div className={styles.rail}>
              {soloRestaurants.map((r) => (
                <article className={styles.railCard} key={r.id}>
                  <div className={styles.railPhoto}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.photos[0]} alt={r.name} />
                  </div>
                  <div className={styles.railBody}>
                    <h3>{r.name}</h3>
                    <div className={styles.meta}>{metaText(r, t)}</div>
                    <div className={styles.smallCopy}>{r.description}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* 06. ALL (scene-filtered) */}
        <section className={styles.section} id="all">
          <div className={styles.sectionHead}>
            <div>
              <h2>{t("allSectionTitle")}</h2>
              <p className={styles.lead}>{t("allSectionSubtitle")}</p>
            </div>
            <div className={styles.index}>06 / ALL</div>
          </div>

          {renderListGrid(filtered)}
        </section>
      </div>

      <nav className={styles.bottomNav}>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {t("navTonight")}
        </button>
        <button
          type="button"
          onClick={() => document.getElementById("scene")?.scrollIntoView({ behavior: "smooth" })}
        >
          {t("navExplore")}
        </button>
        <button
          type="button"
          onClick={() => document.getElementById("all")?.scrollIntoView({ behavior: "smooth" })}
        >
          {t("navAll")}
        </button>
      </nav>
    </main>
  );
}
