"use client";

import { useEffect } from "react";
import { AnalyticsEvent } from "@/lib/types";

export function TrackOnMount({
  event,
}: {
  event: Omit<AnalyticsEvent, "timestamp">;
}) {
  useEffect(() => {
    import("@/lib/analytics").then(({ trackEvent }) => trackEvent(event));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
