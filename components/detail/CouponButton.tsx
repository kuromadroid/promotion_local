"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { trackEvent } from "@/lib/analytics";

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

  const handleOpen = () => {
    trackEvent({ eventName: "coupon_open", hotelId, restaurantId });
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`mt-4 w-full rounded-xl px-4 py-3.5 text-base font-extrabold shadow-md ${
          usedAt ? "bg-(--color-line) text-(--color-ink-soft)" : "bg-(--color-coral) text-white"
        }`}
      >
        {usedAt ? t("couponUsed") : t("couponShow")}
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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center text-white ${
        usedAt ? "bg-(--color-ink-soft)" : "bg-(--color-coral)"
      }`}
    >
      <p className="text-sm font-extrabold tracking-[0.25em]">COUPON</p>
      <h2 className="mt-3 text-2xl font-extrabold">{restaurantName}</h2>

      {usedAtLabel ? (
        <p className="mt-8 rounded-2xl bg-white px-6 py-5 text-lg font-extrabold text-(--color-ink)">
          {t("couponUsedAt", { time: usedAtLabel })}
        </p>
      ) : (
        <>
          <p className="mt-8 text-lg font-bold">{t("couponShowStaff")}</p>
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-(--color-ink)">
            <span className="h-3 w-3 animate-pulse rounded-full bg-(--color-coral)" aria-hidden="true" />
            <span className="text-3xl font-extrabold tabular-nums">
              {now.toLocaleTimeString("ja-JP", { hour12: false })}
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold">{t("couponOncePerGroup")}</p>
          <button
            type="button"
            onClick={handleUse}
            className="mt-8 rounded-xl border-2 border-white px-5 py-3 text-sm font-bold"
          >
            スタッフ用：使用済みにする
          </button>
        </>
      )}

      <button type="button" onClick={onClose} className="mt-6 px-5 py-2 text-sm font-semibold underline">
        {t("couponClose")}
      </button>
    </div>
  );
}
