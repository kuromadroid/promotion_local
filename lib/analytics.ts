import { AnalyticsEvent } from "@/lib/types";
import { getAnalyticsSessionId } from "@/lib/analyticsSession";

/**
 * Posts every occurrence to /api/track. Analytics separates total events
 * from distinct sessions at query time; failures never block the UI.
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
      sessionId: getAnalyticsSessionId(),
      path: window.location.pathname + window.location.search,
    }),
    keepalive: true,
  }).catch(() => {
    // best-effort — tracking failures are non-fatal
  });
}
