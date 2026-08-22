import { AnalyticsEvent } from "@/lib/types";

/**
 * Logs to console for local visibility and posts to /api/track, which
 * de-duplicates by IP + event + target before writing to Supabase
 * (fire-and-forget — tracking failures should never block the UI).
 */
export function trackEvent(
  event: Omit<AnalyticsEvent, "timestamp"> & { timestamp?: string }
) {
  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  if (typeof window === "undefined") {
    // eslint-disable-next-line no-console
    console.log("[analytics:server]", fullEvent);
    return;
  }

  // eslint-disable-next-line no-console
  console.log("[analytics]", fullEvent);

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...fullEvent,
      path: window.location.pathname + window.location.search,
    }),
    keepalive: true,
  }).catch(() => {
    // best-effort — tracking failures are non-fatal
  });
}
