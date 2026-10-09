import { AnalyticsEvent, Locale, LOCALES } from "@/lib/types";
import { getAnalyticsSessionId } from "@/lib/analyticsSession";
import { LOCALE_COOKIE } from "@/lib/i18n/localeCookie";

let displayedLocale: Locale | undefined;

/** Called by LocaleProvider so events carry the language actually on screen. */
export function setAnalyticsLocale(locale: Locale) {
  displayedLocale = locale;
}

/**
 * The language the guest is viewing: the one LocaleProvider rendered (which
 * may have been auto-detected from the browser), else the locale cookie.
 * Outside any guest page this is undefined rather than the default locale,
 * so those events are not misattributed to Japanese.
 */
function getSelectedLocale(): Locale | undefined {
  if (displayedLocale) return displayedLocale;
  try {
    const match = document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${LOCALE_COOKIE}=`));
    const value = match?.slice(LOCALE_COOKIE.length + 1);
    return value && (LOCALES as string[]).includes(value) ? (value as Locale) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Posts every occurrence to /api/track. Analytics separates total events
 * from distinct sessions at query time; failures never block the UI.
 * Events that don't set `language` themselves get the guest's selected
 * language attached, so clicks and filters can be broken down by language.
 */
export function trackEvent(
  event: Omit<AnalyticsEvent, "timestamp"> & { timestamp?: string }
) {
  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  if (typeof window === "undefined") return;

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...fullEvent,
      language: fullEvent.language ?? getSelectedLocale(),
      sessionId: getAnalyticsSessionId(),
      // Route only — the server drops any query string anyway, and filter /
      // QR context is already carried in dedicated fields.
      path: window.location.pathname,
    }),
    keepalive: true,
  }).catch(() => {
    // best-effort — tracking failures are non-fatal
  });
}
