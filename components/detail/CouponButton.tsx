"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { trackEvent } from "@/lib/analytics";
import styles from "./restaurant-detail-v3.module.css";

const DRINK_IMAGE_SRC = "/coupon/lassi.webp";

// "Used" is remembered per device, so clearing browser data or switching
// devices resets it: this deters casual reuse, it does not strictly enforce
// one use. When storage is unavailable (private mode etc.) it lasts for the
// visit only.
const USED_KEY_PREFIX = "sb-coupon-used:";
const memoryUsed = new Map<string, string>();
const usedListeners = new Set<() => void>();

function readUsedAt(restaurantId: string) {
  try {
    const saved = localStorage.getItem(USED_KEY_PREFIX + restaurantId);
    if (saved) return saved;
  } catch {}
  return memoryUsed.get(restaurantId) ?? null;
}

function saveUsedAt(restaurantId: string, usedAt: string) {
  memoryUsed.set(restaurantId, usedAt);
  try {
    localStorage.setItem(USED_KEY_PREFIX + restaurantId, usedAt);
  } catch {}
  usedListeners.forEach((notify) => notify());
}

function subscribeUsed(notify: () => void) {
  usedListeners.add(notify);
  return () => usedListeners.delete(notify);
}

/** Button that opens a coupon screen for the guest to show to staff. Staff tap
 * "used" on the guest's phone, so that step stays in Japanese in every locale. */
export function CouponButton({
  hotelId,
  restaurantId,
  restaurantName,
}: {
  hotelId: string;
  restaurantId: string;
  restaurantName: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const usedAt = useSyncExternalStore(
    subscribeUsed,
    () => readUsedAt(restaurantId),
    () => null
  );

  // Fetched with the page, so the photo is there the moment the coupon opens.
  useEffect(() => {
    new window.Image().src = DRINK_IMAGE_SRC;
  }, []);

  const handleOpen = () => {
    trackEvent({ eventName: "coupon_open", hotelId, restaurantId });
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`${styles.couponButton} ${usedAt ? styles.couponButtonUsed : ""}`}
      >
        <span className={styles.couponButtonCopy}>
          <span className={styles.couponButtonEyebrow}>COUPON</span>
          <span className={styles.couponButtonLabel}>{usedAt ? t("couponUsed") : t("couponShow")}</span>
        </span>
        <span className={styles.couponButtonArrow} aria-hidden="true">{usedAt ? "✓" : "→"}</span>
      </button>
      {open && (
        <CouponScreen
          hotelId={hotelId}
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          usedAt={usedAt}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CouponScreen({
  hotelId,
  restaurantId,
  restaurantName,
  usedAt,
  onClose,
}: {
  hotelId: string;
  restaurantId: string;
  restaurantName: string;
  usedAt: string | null;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const [now, setNow] = useState(() => new Date());

  // The ticking clock lets staff tell the live screen from a screenshot.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUse = () => {
    if (!window.confirm("このクーポンを使用済みにしますか？元に戻せません。")) return;
    trackEvent({ eventName: "coupon_use", hotelId, restaurantId });
    saveUsedAt(restaurantId, new Date().toISOString());
  };

  const usedAtLabel =
    usedAt &&
    new Date(usedAt).toLocaleString(locale, {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={restaurantName}
      className={`${styles.couponOverlay} ${usedAt ? styles.couponOverlayUsed : ""}`}
    >
      <div className={styles.couponPanel}>
        <p className={styles.couponScreenEyebrow}>SAPPORO BITES · COUPON</p>
        <h2 className={styles.couponRestaurantName}>{restaurantName}</h2>

        {usedAtLabel ? (
          <p className={styles.couponUsedAt}>{t("couponUsedAt", { time: usedAtLabel })}</p>
        ) : (
          <>
            {/* Every coupon is this drink for now. Photo: "Patiala Lassi" by Miansari66,
                Wikimedia Commons, CC0; background removed. */}
            <Image
              src={DRINK_IMAGE_SRC}
              alt={t("couponDrinkName")}
              width={480}
              height={734}
              // Already a small WebP, so skip the on-demand resize that delays it.
              unoptimized
              loading="eager"
              fetchPriority="high"
              className={styles.couponDrinkImage}
            />
            <p className={styles.couponOffer}>{t("couponOffer")}</p>
            <button type="button" onClick={handleUse} className={styles.couponStaffButton}>
              使用する
            </button>
            <p className={styles.couponStaffPress}>{t("couponStaffPress")}</p>
            <div className={styles.couponClock}>
              <span className={styles.couponLiveDot} aria-hidden="true" />
              <span className={styles.couponClockTime}>
                {now.toLocaleTimeString("ja-JP", { hour12: false })}
              </span>
            </div>
            <ul className={styles.couponTerms}>
              <li>{t("couponTermShowBeforeOrdering")}</li>
              <li>{t("couponTermOnePerGroup")}</li>
              <li>{t("couponTermFoodOrderRequired")}</li>
              <li>{t("couponTermNoCombinationOrCash")}</li>
              <li>{t("couponTermNoScreenshots")}</li>
              <li>{t("couponTermPhotoAvailability")}</li>
              <li>{t("couponTermDairyAllergies")}</li>
            </ul>
          </>
        )}

        <button type="button" onClick={onClose} className={styles.couponClose}>
          {t("couponClose")}
        </button>
      </div>
    </div>
  );
}
