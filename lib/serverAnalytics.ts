import "server-only";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { ANALYTICS_EVENT_NAMES, AnalyticsEventName, LOCALES, Locale } from "@/lib/types";

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

/**
 * `meta` is the only free-form field a client can put in an event. To keep it
 * from being used as arbitrary jsonb storage, we accept only the keys the app
 * actually sends, coerce each value to a short string, and drop everything else.
 * Returns null when nothing usable remains (so the column stays NULL, as before).
 */
const META_ALLOWED_KEYS = ["qrId", "screen", "source"] as const;
const META_MAX_VALUE_LENGTH = 200;
const QR_ID_MAX_LENGTH = 64;

export function sanitizeMeta(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of META_ALLOWED_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    const raw = source[key];
    if (raw == null) continue;
    if (typeof raw !== "string" && typeof raw !== "number" && typeof raw !== "boolean") continue;
    let str = String(raw).slice(0, META_MAX_VALUE_LENGTH);
    // qrId is a campaign / placement identifier — keep it to an issue-code shape
    // so an injected IP / email / free text cannot survive in it.
    if (key === "qrId") str = str.replace(/[^A-Za-z0-9_-]/g, "").slice(0, QR_ID_MAX_LENGTH);
    if (str.length > 0) out[key] = str;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** DB ids in this app are slugs or UUIDs. Anything else is dropped to null. */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function sanitizeId(value: unknown): string | null {
  return typeof value === "string" && ID_PATTERN.test(value) ? value : null;
}

/** Only the locales the app actually ships. */
export function sanitizeLocale(value: unknown): Locale | null {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
    ? (value as Locale)
    : null;
}

/**
 * Store the route only — never the query string or fragment. Filter state
 * (area/tag) and the QR id are already captured in their own columns / in
 * meta, so the query string adds nothing but a place for free text to land.
 */
export function sanitizePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const route = value.split(/[?#]/, 1)[0];
  return route.startsWith("/") ? route.slice(0, 256) : null;
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
  if (!isAnalyticsEventName(input.eventName)) throw new Error("invalid eventName");
  const sessionId = normalizeSessionId(input.sessionId);
  if (!sessionId) throw new Error("valid sessionId required");

  // Every field is normalised here, so both callers (the /api/track route and
  // the language-select server action) get the same guarantees regardless of
  // what reached them.
  const { error } = await supabaseAdmin.from("events").insert({
    event_name: input.eventName,
    hotel_id: sanitizeId(input.hotelId),
    restaurant_id: sanitizeId(input.restaurantId),
    area_id: sanitizeId(input.areaId),
    tag_id: sanitizeId(input.tagId),
    language: sanitizeLocale(input.language),
    path: sanitizePath(input.path),
    session_id: sessionId,
    ip_hash: hashIp(ip),
    meta: sanitizeMeta(input.meta),
  });
  if (error) throw error;

  return { ok: true as const };
}
