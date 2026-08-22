import "server-only";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { AnalyticsEventName, Locale } from "@/lib/types";

/** Same IP performing the same action on the same target won't be recounted within this window. */
const DEDUP_WINDOW_MINUTES = 30;

export interface TrackInput {
  eventName: AnalyticsEventName;
  hotelId?: string;
  restaurantId?: string;
  areaId?: string;
  tagId?: string;
  language?: Locale;
  path?: string;
  meta?: Record<string, unknown>;
}

export function getIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export async function recordServerEvent(input: TrackInput, ip: string) {
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");
  const windowStart = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000).toISOString();

  let dupQuery = supabaseAdmin
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("event_name", input.eventName)
    .gte("occurred_at", windowStart);
  dupQuery = input.hotelId ? dupQuery.eq("hotel_id", input.hotelId) : dupQuery.is("hotel_id", null);
  dupQuery = input.restaurantId
    ? dupQuery.eq("restaurant_id", input.restaurantId)
    : dupQuery.is("restaurant_id", null);

  const { count, error: dupError } = await dupQuery;
  if (dupError) throw dupError;
  if ((count ?? 0) > 0) return { skipped: true as const };

  const { error } = await supabaseAdmin.from("events").insert({
    event_name: input.eventName,
    hotel_id: input.hotelId ?? null,
    restaurant_id: input.restaurantId ?? null,
    area_id: input.areaId ?? null,
    tag_id: input.tagId ?? null,
    language: input.language ?? null,
    path: input.path ?? null,
    ip_hash: ipHash,
    meta: input.meta ?? null,
  });
  if (error) throw error;

  return { ok: true as const };
}
