import { AnalyticsEvent } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";

/**
 * Logs to console for local visibility and writes to the Supabase `events`
 * table (fire-and-forget — tracking failures should never block the UI).
 */
export function trackEvent(
  event: Omit<AnalyticsEvent, "timestamp"> & { timestamp?: string }
) {
  const fullEvent: AnalyticsEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  // eslint-disable-next-line no-console
  console.log(
    typeof window === "undefined" ? "[analytics:server]" : "[analytics]",
    fullEvent
  );

  supabase
    .from("events")
    .insert({
      event_name: fullEvent.eventName,
      hotel_id: fullEvent.hotelId,
      restaurant_id: fullEvent.restaurantId,
      area_id: fullEvent.areaId,
      tag_id: fullEvent.tagId,
      language: fullEvent.language,
      occurred_at: fullEvent.timestamp,
      meta: fullEvent.meta,
    })
    .then(({ error }) => {
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[analytics] failed to record event", error);
      }
    });
}
