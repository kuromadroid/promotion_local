"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RestaurantView } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

type SceneKey = "all" | "solo" | "sapporo" | "near" | "late" | "pair" | "group";

type T = (key: string, vars?: Record<string, string | number>) => string;

const SAPPORO_CLASSIC_TAGS = ["genghis-khan", "seafood", "sushi"];
const NEAR_WALK_MINUTES = 10;

function sceneKeysFor(r: RestaurantView): SceneKey[] {
  const keys: SceneKey[] = [];
  const hasTag = (id: string) => r.tags.some((tag) => tag.id === id);
  if (hasTag("solo-friendly")) keys.push("solo");
  if (SAPPORO_CLASSIC_TAGS.some(hasTag)) keys.push("sapporo");
  if (r.walkingMinutes <= NEAR_WALK_MINUTES) keys.push("near");
  if (hasTag("late-night")) keys.push("late");
  if (hasTag("private-room")) keys.push("pair");
  if (hasTag("izakaya")) keys.push("group");
  return keys;
}

const COLLAGE_LAYOUT = [
  "absolute -left-[8%] -top-[2%] h-[43%] w-[56%] rotate-[-3deg] overflow-hidden border-4 border-black sm:-left-[4%] sm:-top-[5%] sm:h-[49%] sm:w-[44%]",
  "absolute left-[41%] -top-[4%] h-[38%] w-[50%] rotate-[2deg] overflow-hidden border-4 border-black sm:left-[35%] sm:-top-[2%] sm:h-[45%] sm:w-[38%]",
  "absolute -right-[18%] top-[25%] h-[34%] w-[50%] rotate-[-1deg] overflow-hidden border-4 border-black sm:-right-[5%] sm:top-[4%] sm:h-[46%] sm:w-[34%]",
  "absolute -left-[8%] bottom-[14%] h-[34%] w-[46%] rotate-[2deg] overflow-hidden border-4 border-black sm:left-[3%] sm:-bottom-[4%] sm:h-[49%] sm:w-[35%]",
  "absolute left-[28%] -bottom-[2%] h-[36%] w-[47%] rotate-[-2deg] overflow-hidden border-4 border-black sm:left-[34%] sm:-bottom-[5%] sm:h-[49%] sm:w-[34%]",
  "absolute -right-[14%] bottom-[1%] h-[31%] w-[43%] rotate-[3deg] overflow-hidden border-4 border-black sm:-right-[3%] sm:-bottom-[3%] sm:h-[48%] sm:w-[37%]",
];

function Meta({ restaurant, t }: { restaurant: RestaurantView; t: T }) {
  return (
    <p className="mt-2 text-xs font-extrabold text-stone-500">
      {t("walkFromHotel", { minutes: restaurant.walkingMinutes })} · ¥
      {restaurant.priceMin.toLocaleString()}〜
    </p>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-stone-900 bg-white px-2.5 py-1 text-[11px] font-bold">
      {children}
    </span>
  );
}

function CtaButtons({
  hotelId,
  restaurant,
  t,
}: {
  hotelId: string;
  restaurant: RestaurantView;
  t: T;
}) {
  return (
    <div className="mt-3 flex gap-2">
      {restaurant.reservationUrl && (
        <a
          href={restaurant.reservationUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            trackEvent({ eventName: "reservation_click", hotelId, restaurantId: restaurant.id });
          }}
          className="rounded-full border-2 border-black bg-black px-3 py-2 text-xs font-black text-white"
        >
          {t("makeReservation")}
        </a>
      )}
      {restaurant.googleMapsUrl && (
        <a
          href={restaurant.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            trackEvent({ eventName: "map_click", hotelId, restaurantId: restaurant.id });
          }}
          className="rounded-full border-2 border-black bg-white px-3 py-2 text-xs font-black"
        >
          {t("viewOnMap")}
        </a>
      )}
    </div>
  );
}

export function EditorialHome({
  hotelId,
  hotelName,
  restaurants,
  messages,
}: {
  hotelId: string;
  hotelName: string;
  restaurants: RestaurantView[];
  messages: Record<string, string>;
}) {
  const t: T = (key, vars) => {
    let s = messages[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };

  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeScene, setActiveScene] = useState<SceneKey>("all");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/h/${hotelId}/restaurants?${params.toString()}`);
  };

  const scenesByRestaurant = useMemo(() => {
    const map = new Map<string, SceneKey[]>();
    for (const r of restaurants) map.set(r.id, sceneKeysFor(r));
    return map;
  }, [restaurants]);

  const filtered = useMemo(() => {
    if (activeScene === "all") return restaurants;
    return restaurants.filter((r) => scenesByRestaurant.get(r.id)?.includes(activeScene));
  }, [restaurants, scenesByRestaurant, activeScene]);

  const soloPicks = useMemo(
    () => restaurants.filter((r) => scenesByRestaurant.get(r.id)?.includes("solo")).slice(0, 6),
    [restaurants, scenesByRestaurant]
  );

  const featured = restaurants[0];
  const sidePicks = restaurants.slice(1, 3);

  const collagePhotos: string[] = [];
  const sourcePhotos = restaurants.map((r) => r.photos[0]).filter(Boolean);
  if (sourcePhotos.length > 0) {
    for (let i = 0; i < COLLAGE_LAYOUT.length; i++) {
      collagePhotos.push(sourcePhotos[i % sourcePhotos.length]);
    }
  }

  const sceneChips: { key: SceneKey; label: string }[] = [
    { key: "all", label: t("all") },
    { key: "solo", label: `💼 ${t("sceneSolo")}` },
    { key: "sapporo", label: `🦀 ${t("sceneSapporo")}` },
    { key: "near", label: `📍 ${t("sceneNear")}` },
    { key: "late", label: `🌙 ${t("sceneLateNight")}` },
    { key: "pair", label: `🥂 ${t("sceneCouple")}` },
    { key: "group", label: `🍻 ${t("sceneGroup")}` },
  ];

  const quickButtons: { key: SceneKey; title: string; sub: string }[] = [
    { key: "near", title: `📍 ${t("sceneNear")}`, sub: t("within10Title") },
    { key: "sapporo", title: `🦀 ${t("sceneSapporo")}`, sub: t("quickSubLocal") },
    { key: "late", title: `🌙 ${t("sceneLateNight")}`, sub: t("quickSubLate") },
    { key: "solo", title: `💼 ${t("sceneSolo")}`, sub: t("quickSubSolo") },
    { key: "pair", title: `🥂 ${t("sceneCouple")}`, sub: t("quickSubPair") },
    { key: "all", title: `↺ ${t("navAll")}`, sub: t("allSectionTitle") },
  ];

  return (
    <div className="-mx-4 bg-[#f3efe6] px-4 pb-16 pt-4 text-[#151515] sm:-mx-4">
      {/* HERO */}
      <section
        id="tonight"
        className="relative min-h-[440px] overflow-hidden rounded-[26px] border-2 border-black bg-black sm:min-h-[520px]"
      >
        {collagePhotos.length > 0 && (
          <div className="absolute inset-0">
            {COLLAGE_LAYOUT.map((cls, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={collagePhotos[i]} alt="" className={`${cls} h-full w-full object-cover`} />
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/85" />

        <div className="absolute bottom-5 left-4 right-4 z-10 text-white sm:left-6 sm:right-6">
          <span className="inline-block rotate-[-1deg] border-2 border-black bg-[#d7ef55] px-2.5 py-1.5 text-xs font-black text-black">
            {t("heroEyebrow")}
          </span>
          <h1 className="mt-3 max-w-4xl text-[38px] font-black leading-[0.95] tracking-[-0.06em] sm:text-[64px]">
            {t("heroSubtitle")}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-black">
            <span>{hotelName}</span>
            <span className="rotate-[-3deg] font-serif text-sm">{t("heroTagline")}</span>
          </div>
        </div>
      </section>

      {/* SEARCH */}
      <section className="pt-5">
        <form onSubmit={submitSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border-2 border-black bg-white py-3 pl-11 pr-4 text-sm font-bold text-[#151515] outline-none placeholder:text-stone-400"
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </form>
      </section>

      {/* SCENE NAV */}
      <section id="explore" className="pt-8">
        <div className="mb-3">
          <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            {t("sceneSectionTitle")}
          </h2>
          <p className="mt-1 text-xs font-bold text-stone-500">{t("sceneNavSubtitle")}</p>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sceneChips.map((chip) => (
            <button
              type="button"
              key={chip.key}
              onClick={() => setActiveScene(chip.key)}
              className={[
                "shrink-0 rounded-full border-2 border-black px-4 py-2.5 text-sm font-black transition",
                activeScene === chip.key
                  ? "translate-y-[2px] bg-black text-white"
                  : "bg-white shadow-[2px_2px_0_#111]",
              ].join(" ")}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      {featured && (
        <section className="pt-8">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                {t("featuredSectionTitle")}
              </h2>
              <p className="mt-1 text-xs font-bold text-stone-500">{t("featuredSectionSubtitle")}</p>
            </div>
            <span className="hidden text-xs font-black text-stone-500 sm:block">
              {t("tonightPicksTitle")}
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.25fr_.75fr]">
            <Link
              href={`/h/${hotelId}/restaurants/${featured.id}`}
              className="relative block overflow-hidden rounded-[22px] border-2 border-black bg-[#fffaf0] shadow-[0_8px_30px_rgba(0,0,0,.10)]"
            >
              <div className="absolute left-3 top-3 z-10 rotate-[-2deg] border-2 border-black bg-[#d94d2f] px-2.5 py-1.5 text-xs font-black text-white">
                {t("featuredBadge")}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featured.photos[0]}
                alt={featured.name}
                className="h-[280px] w-full object-cover sm:h-[400px]"
              />
              <div className="p-4">
                <h3 className="text-xl font-black tracking-[-0.03em] sm:text-2xl">{featured.name}</h3>
                <Meta restaurant={featured} t={t} />
                <p className="mt-2 line-clamp-2 text-sm font-bold">{featured.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {featured.tags.slice(0, 3).map((tag) => (
                    <Tag key={tag.id}>{tag.name}</Tag>
                  ))}
                </div>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
              {sidePicks.map((r) => (
                <Link
                  key={r.id}
                  href={`/h/${hotelId}/restaurants/${r.id}`}
                  className="overflow-hidden rounded-[22px] border-2 border-black bg-[#fffaf0] shadow-[0_8px_30px_rgba(0,0,0,.10)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.photos[0]}
                    alt={r.name}
                    className="h-[130px] w-full object-cover lg:h-[170px]"
                  />
                  <div className="p-3.5">
                    <h3 className="line-clamp-1 text-base font-black leading-tight tracking-[-0.03em]">
                      {r.name}
                    </h3>
                    <Meta restaurant={r} t={t} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SOLO RAIL */}
      {soloPicks.length > 0 && (
        <section className="pt-9">
          <div className="mb-3">
            <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              {t("soloSectionTitle")}
            </h2>
            <p className="mt-1 text-xs font-bold text-stone-500">{t("soloRailSubtitle")}</p>
          </div>

          <div className="grid auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto pb-3 [scrollbar-width:none] sm:auto-cols-[31%] [&::-webkit-scrollbar]:hidden">
            {soloPicks.map((r) => (
              <Link
                key={r.id}
                href={`/h/${hotelId}/restaurants/${r.id}`}
                className="overflow-hidden rounded-[22px] border-2 border-black bg-[#fffaf0] shadow-[0_8px_30px_rgba(0,0,0,.10)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.photos[0]} alt={r.name} className="h-[180px] w-full object-cover" />
                <div className="p-4">
                  <h3 className="text-lg font-black tracking-[-0.03em]">{r.name}</h3>
                  <Meta restaurant={r} t={t} />
                  <p className="mt-2 line-clamp-2 text-sm font-bold">{r.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* QUICK DECISION GRID */}
      <section className="pt-9">
        <div className="mb-3">
          <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            {t("quickDecisionTitle")}
          </h2>
          <p className="mt-1 text-xs font-bold text-stone-500">{t("quickDecisionSubtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {quickButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => {
                setActiveScene(btn.key);
                document.getElementById("all-restaurants")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="min-h-24 rounded-[18px] border-2 border-black bg-white p-3.5 text-left font-black"
            >
              {btn.title}
              <small className="mt-1 block text-xs font-bold text-stone-500">{btn.sub}</small>
            </button>
          ))}
        </div>
      </section>

      {/* ALL RESTAURANTS */}
      <section id="all-restaurants" className="pt-10">
        <div className="mb-3">
          <h2 className="text-2xl font-black tracking-[-0.04em] sm:text-3xl">
            {t("allSectionTitle")}
          </h2>
          <p className="mt-1 text-xs font-bold text-stone-500">{t("allSectionSubtitle")}</p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[22px] border-2 border-dashed border-black/30 px-6 py-14 text-center text-sm font-bold text-stone-500">
            {t("noResults")}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((r) => (
              <article
                key={r.id}
                className="grid min-h-[150px] grid-cols-[118px_1fr] overflow-hidden rounded-[22px] border-2 border-black bg-[#fffaf0] shadow-[0_8px_30px_rgba(0,0,0,.08)] sm:grid-cols-[140px_1fr]"
              >
                <Link href={`/h/${hotelId}/restaurants/${r.id}`} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.photos[0]} alt={r.name} className="h-full w-full object-cover" />
                </Link>
                <div className="p-4">
                  <Link href={`/h/${hotelId}/restaurants/${r.id}`}>
                    <h3 className="line-clamp-1 text-lg font-black leading-tight tracking-[-0.03em]">
                      {r.name}
                    </h3>
                  </Link>
                  <Meta restaurant={r} t={t} />
                  <p className="mt-2 line-clamp-2 text-sm font-bold">{r.description}</p>
                  <CtaButtons hotelId={hotelId} restaurant={r} t={t} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MOBILE QUICK NAV */}
      <nav className="fixed bottom-3 left-3 right-3 z-50 grid grid-cols-3 overflow-hidden rounded-[18px] bg-black text-white shadow-2xl sm:hidden">
        <a href="#tonight" className="py-3 text-center text-xs font-black">
          {t("navTonight")}
        </a>
        <a href="#explore" className="py-3 text-center text-xs font-black">
          {t("navExplore")}
        </a>
        <a href="#all-restaurants" className="py-3 text-center text-xs font-black">
          {t("navAll")}
        </a>
      </nav>
    </div>
  );
}
