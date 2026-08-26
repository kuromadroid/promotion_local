import "server-only";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { ANALYTICS_EVENT_NAMES, AnalyticsEventName, Locale } from "@/lib/types";

export interface TrackInput {
  eventName: AnalyticsEventName;
  sessionId?: string;
  hotelId?: string;
  restaurantId?: string;
  areaId?: string;
  tagId?: string;
  language?: Locale;
  path?: string;
  meta?: Record<string, unknown>;
}

const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value);
}

export function normalizeSessionId(value: unknown) {
  return typeof value === "string" && SESSION_ID_PATTERN.test(value) ? value : null;
}

export function getIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip");
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === "production") throw new Error("IP_HASH_SALT is not set");
    return crypto.createHmac("sha256", "development-only-salt").update(ip).digest("hex");
  }
  return crypto.createHmac("sha256", salt).update(ip).digest("hex");
}

export async function recordServerEvent(input: TrackInput, ip: string | null) {
  const sessionId = normalizeSessionId(input.sessionId);
  if (!sessionId) throw new Error("valid sessionId required");

  const { error } = await supabaseAdmin.from("events").insert({
    event_name: input.eventName,
    hotel_id: input.hotelId ?? null,
    restaurant_id: input.restaurantId ?? null,
    area_id: input.areaId ?? null,
    tag_id: input.tagId ?? null,
    language: input.language ?? null,
    path: input.path ?? null,
    session_id: sessionId,
    ip_hash: hashIp(ip),
    meta: input.meta ?? null,
  });
  if (error) throw error;

  return { ok: true as const };
}
