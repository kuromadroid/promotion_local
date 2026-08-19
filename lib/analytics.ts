import { AnalyticsEvent } from "@/lib/types";

const STORAGE_KEY = "sapporo_bites_events";

/**
 * V1 implementation: logs to console and appends to localStorage so the
 * event stream is inspectable during development/demo.
 *
 * To connect Supabase later, replace the body of this function with:
 *   await supabase.from("events").insert({ ...event, event_name: event.eventName })
 * No caller anywhere in the app needs to change.
 */
export function trackEvent(
  event: Omit<AnalyticsEvent, "timestamp"> & { timestamp?: string }
) {
  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  if (typeof window === "undefined") {
    // Server-side call (e.g. page_view from a server component) - just log.
    // eslint-disable-next-line no-console
    console.log("[analytics:server]", fullEvent);
    return;
  }

  // eslint-disable-next-line no-console
  console.log("[analytics]", fullEvent);
  try {
    const existing = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]"
    ) as AnalyticsEvent[];
    existing.push(fullEvent);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable - non-fatal, tracking is best-effort.
  }
}
