"use client";

import Image from "next/image";
import { CSSProperties, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { trackEvent } from "@/lib/analytics";
import { ResolvedCoupon } from "@/lib/types";
import styles from "./restaurant-detail-v3.module.css";

// "Used" is remembered per device, per coupon and restaurant, so clearing
// browser data or switching devices resets it: this deters casual reuse, it
// does not strictly enforce one use. When storage is unavailable (private mode
// etc.) it lasts for the visit only.
const USED_KEY_PREFIX = "sb-coupon-used:";
const memoryUsed = new Map<string, string>();
const usedListeners = new Set<() => void>();

function readUsedAt(key: string) {
  try {
    const saved = localStorage.getItem(USED_KEY_PREFIX + key);
    if (saved) return saved;
  } catch {}
  return memoryUsed.get(key) ?? null;
}

function saveUsedAt(key: string, usedAt: string) {
  memoryUsed.set(key, usedAt);
  try {
    localStorage.setItem(USED_KEY_PREFIX + key, usedAt);
  } catch {}
  usedListeners.forEach((notify) => notify());
}

function subscribeUsed(notify: () => void) {
  usedListeners.add(notify);
  return () => usedListeners.delete(notify);
}

function CouponImage({
  coupon,
  className,
  style,
}: {
  coupon: ResolvedCoupon;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Image
      src={coupon.imageUrl}
      alt={coupon.offer}
      width={480}
      height={734}
      sizes="240px"
      // Images in public/ are already small, so skip the on-demand resize.
      unoptimized={coupon.imageUrl.startsWith("/")}
      loading="eager"
      className={className}
      style={style}
    />
  );
}

/** Button that opens a coupon screen for the guest to show to staff. Staff tap
 * "used" on the guest's phone, so that step stays in Japanese in every locale. */
export function CouponButton({
  hotelId,
  restaurantId,
  restaurantName,
  coupon,
}: {
  hotelId: string;
  restaurantId: string;
  restaurantName: string;
  coupon: ResolvedCoupon;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const usedKey = `${coupon.id}:${restaurantId}`;
  const usedAt = useSyncExternalStore(
    subscribeUsed,
    () => readUsedAt(usedKey),
    () => null
  );

  const handleOpen = () => {
    trackEvent({ eventName: "coupon_open", hotelId, restaurantId, meta: { couponId: coupon.id } });
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
      {/* Fetched with the page, so the photo is there the moment the coupon opens. */}
      {!open && !usedAt && <CouponImage coupon={coupon} style={{ display: "none" }} />}
      {open && (
        <CouponScreen
          hotelId={hotelId}
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          coupon={coupon}
          usedKey={usedKey}
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
  coupon,
  usedKey,
  usedAt,
  onClose,
}: {
  hotelId: string;
  restaurantId: string;
  restaurantName: string;
  coupon: ResolvedCoupon;
  usedKey: string;
  usedAt: string | null;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();

  const handleUse = () => {
    if (!window.confirm("このクーポンを使用済みにしますか？元に戻せません。")) return;
    trackEvent({ eventName: "coupon_use", hotelId, restaurantId, meta: { couponId: coupon.id } });
    saveUsedAt(usedKey, new Date().toISOString());
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
            <CouponImage coupon={coupon} className={styles.couponDrinkImage} />
            <p className={styles.couponOffer}>{coupon.offer}</p>
            <button type="button" onClick={handleUse} className={styles.couponStaffButton}>
              使用する
            </button>
            <p className={styles.couponStaffPress}>{t("couponStaffPress")}</p>
            {coupon.terms.length > 0 && (
              <ul className={styles.couponTerms}>
                {coupon.terms.map((term, i) => (
                  <li key={i}>{term}</li>
                ))}
              </ul>
            )}
          </>
        )}

        <button type="button" onClick={onClose} className={styles.couponClose}>
          {t("couponClose")}
        </button>
      </div>
    </div>
  );
}
