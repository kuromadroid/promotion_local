"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { trackEvent } from "@/lib/analytics";
import { RestaurantView } from "@/lib/types";
import styles from "./restaurant-detail-v3.module.css";

export function RestaurantDetailV3({
  hotelId,
  restaurant,
}: {
  hotelId: string;
  restaurant: RestaurantView;
}) {
  const { t } = useLocale();
  const [activePhoto, setActivePhoto] = useState(0);

  const photos = restaurant.photos;
  const cuisineTags = restaurant.tags.filter((tag) => tag.type === "cuisine");
  const paymentTags = restaurant.tags.filter((tag) => tag.type === "payment");

  const handleMap = () => {
    trackEvent({ eventName: "map_click", hotelId, restaurantId: restaurant.id });
    if (restaurant.googleMapsUrl) window.open(restaurant.googleMapsUrl, "_blank", "noopener,noreferrer");
  };

  const handleReserve = () => {
    trackEvent({ eventName: "reservation_click", hotelId, restaurantId: restaurant.id });
    if (restaurant.reservationUrl) window.open(restaurant.reservationUrl, "_blank", "noopener,noreferrer");
  };

  const handleInstagram = () => {
    trackEvent({ eventName: "instagram_click", hotelId, restaurantId: restaurant.id });
    if (restaurant.instagramUrl) window.open(restaurant.instagramUrl, "_blank", "noopener,noreferrer");
  };

  const handlePhone = () => {
    trackEvent({ eventName: "phone_click", hotelId, restaurantId: restaurant.id });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: restaurant.name, url });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  const showBottomCta = Boolean(restaurant.googleMapsUrl || restaurant.reservationUrl);
  const bottomCtaSingle = Boolean(restaurant.googleMapsUrl) !== Boolean(restaurant.reservationUrl);
  const showSecondary = Boolean(restaurant.instagramUrl || restaurant.phone);
  const secondarySingle = Boolean(restaurant.instagramUrl) !== Boolean(restaurant.phone);
  const showInfo = Boolean(restaurant.openingHours || restaurant.closedDays || paymentTags.length > 0);

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href={`/h/${hotelId}/restaurants`} className={styles.iconBtn} aria-label={t("back")}>
          ←
        </Link>
        <div className={styles.topTitle}>SAPPORO BITES</div>
        <button type="button" className={styles.iconBtn} aria-label={t("share")} onClick={handleShare}>
          ↗
        </button>
      </header>

      {photos.length > 0 && (
        <section className={styles.gallery}>
          <div className={styles.mainPhoto}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[activePhoto]} alt={restaurant.name} />
          </div>
          {photos.length > 1 && (
            <div className={styles.photoCount}>
              {activePhoto + 1} / {photos.length}
            </div>
          )}
        </section>
      )}

      {photos.length > 1 && (
        <div className={styles.thumbs}>
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              className={`${styles.thumb} ${i === activePhoto ? styles.active : ""}`}
              onClick={() => setActivePhoto(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className={styles.content}>
        <section className={styles.summary}>
          {cuisineTags.length > 0 && (
            <div className={styles.genre}>{cuisineTags.map((tag) => tag.name).join("・")}</div>
          )}
          <h1>{restaurant.name}</h1>

          <div className={styles.metaRow}>
            <span>
              ¥{restaurant.priceMin.toLocaleString()}〜{restaurant.priceMax.toLocaleString()}
            </span>
            {restaurant.openingHours && <span>{restaurant.openingHours}</span>}
          </div>

          {restaurant.tags.length > 0 && (
            <div className={styles.tags}>
              {restaurant.tags.map((tag) => (
                <span className={styles.tag} key={tag.id}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className={styles.distanceCard}>
            <div className={styles.distanceTop}>
              <div>
                <div className={styles.distanceMain}>
                  {t("walkMinutesShort", { minutes: restaurant.walkingMinutes })}
                </div>
                <div className={styles.distanceSub}>{t("walkSubtitleShort")}</div>
              </div>
              {restaurant.googleMapsUrl && (
                <button type="button" className={styles.route} onClick={handleMap}>
                  {t("viewOnMap")}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>{t("aboutSectionTitle")}</h2>
          <p className={styles.description}>{restaurant.description}</p>
        </section>

        {restaurant.recommendedDish && (
          <section className={styles.section}>
            <h2>{t("recommendSectionTitle")}</h2>
            <div className={styles.recommendBox}>
              <div className={styles.recommendMark}>PICK</div>
              <div>
                <div className={styles.recommendLabel}>{t("recommendedDish")}</div>
                <div className={styles.recommendName}>{restaurant.recommendedDish}</div>
              </div>
            </div>
          </section>
        )}

        {showInfo && (
          <section className={styles.section}>
            <h2>{t("infoSectionTitle")}</h2>
            <div className={styles.infoList}>
              {restaurant.openingHours && (
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>{t("openingHours")}</div>
                  <div className={styles.infoValue}>{restaurant.openingHours}</div>
                </div>
              )}
              {restaurant.closedDays && (
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>{t("closedDays")}</div>
                  <div className={styles.infoValue}>{restaurant.closedDays}</div>
                </div>
              )}
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>{t("priceRange")}</div>
                <div className={styles.infoValue}>
                  ¥{restaurant.priceMin.toLocaleString()}〜{restaurant.priceMax.toLocaleString()}
                </div>
              </div>
              {paymentTags.length > 0 && (
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>{t("paymentMethod")}</div>
                  <div className={styles.infoValue}>{paymentTags.map((tag) => tag.name).join(" / ")}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {restaurant.googleMapsUrl && (
          <section className={styles.section}>
            <h2>{t("hotelSectionTitle")}</h2>
            <div className={styles.mapCard}>
              <div className={styles.mapTitle}>
                {t("walkMinutesShort", { minutes: restaurant.walkingMinutes })}
              </div>
              <div className={styles.mapCopy}>{t("mapCardCopy")}</div>
              <button type="button" className={styles.mapButton} onClick={handleMap}>
                {t("viewOnMap")}
              </button>
            </div>
          </section>
        )}

        {showSecondary && (
          <section className={styles.section}>
            <div className={`${styles.secondaryActions} ${secondarySingle ? styles.single : ""}`}>
              {restaurant.instagramUrl && (
                <button type="button" className={styles.secondaryBtn} onClick={handleInstagram}>
                  {t("viewInstagram")}
                </button>
              )}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className={styles.secondaryBtn} onClick={handlePhone}>
                  {t("callRestaurant")}
                </a>
              )}
            </div>
          </section>
        )}
      </div>

      {showBottomCta && (
        <div className={styles.bottomCta}>
          <div className={`${styles.bottomInner} ${bottomCtaSingle ? styles.single : ""}`}>
            {restaurant.googleMapsUrl && (
              <button type="button" className={`${styles.cta} ${styles.secondary}`} onClick={handleMap}>
                {t("viewOnMap")}
              </button>
            )}
            {restaurant.reservationUrl && (
              <button type="button" className={`${styles.cta} ${styles.primary}`} onClick={handleReserve}>
                {t("makeReservation")}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
