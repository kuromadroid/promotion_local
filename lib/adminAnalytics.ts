import "server-only";
import { supabaseAdmin } from "@/lib/supabase/adminClient";

export type AnalyticsPeriodKey = "7d" | "30d" | "this_month" | "last_month" | "all" | "custom";

export type AnalyticsSearchParams = Record<string, string | string[] | undefined>;

export interface AnalyticsPeriod {
  key: AnalyticsPeriodKey;
  label: string;
  start: string | null;
  end: string | null;
  startDate: string;
  endDate: string;
}

export interface AnalyticsMetrics {
  viewEvents: number;
  viewSessions: number;
  mapEvents: number;
  mapSessions: number;
  reservationEvents: number;
  reservationSessions: number;
  phoneEvents: number;
  phoneSessions: number;
  instagramEvents: number;
  instagramSessions: number;
  highIntentEvents: number;
  highIntentSessions: number;
}

export interface AnalyticsOverview {
  summary: AnalyticsMetrics & { siteSessions: number };
  restaurants: Array<AnalyticsMetrics & {
    id: string;
    name: string;
    listingHotels: number;
  }>;
  hotels: Array<{
    id: string;
    name: string;
    siteSessions: number;
    viewSessions: number;
    mapSessions: number;
    reservationSessions: number;
    phoneSessions: number;
    highIntentSessions: number;
  }>;
}

export interface RestaurantAnalytics extends AnalyticsMetrics {
  restaurant: { id?: string; name?: string };
  listingHotels: Array<{ id: string; name: string }>;
  hotelBreakdown: Array<{
    id: string;
    name: string;
    viewSessions: number;
    mapSessions: number;
    reservationSessions: number;
    phoneSessions: number;
    highIntentSessions: number;
  }>;
  daily: Array<{
    day: string;
    viewSessions: number;
    mapSessions: number;
    reservationSessions: number;
    highIntentSessions: number;
  }>;
  quality: {
    totalEvents: number;
    uniqueSessions: number;
    uniqueNetworks: number;
    sessionsPerNetwork: number | null;
    eventsPerNetwork: number | null;
    networkConcentration: Array<{ network: string; events: number }>;
    anomalies: Array<{
      kind: "session" | "network";
      identifier: string;
      minute: string;
      events: number;
    }>;
  };
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateKeyFromUtcMs(utcMs: number) {
  const date = new Date(utcMs + JST_OFFSET_MS);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function utcMsFromDateKey(dateKey: string) {
  if (!DATE_PATTERN.test(dateKey)) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const utcMs = Date.UTC(year, month - 1, day) - JST_OFFSET_MS;
  return dateKeyFromUtcMs(utcMs) === dateKey ? utcMs : null;
}

function shiftDateKey(dateKey: string, days: number) {
  const utcMs = utcMsFromDateKey(dateKey);
  if (utcMs === null) return dateKey;
  return dateKeyFromUtcMs(utcMs + days * 24 * 60 * 60 * 1000);
}

function monthStart(dateKey: string, monthOffset = 0) {
  const [year, month] = dateKey.split("-").map(Number);
  return dateKeyFromUtcMs(Date.UTC(year, month - 1 + monthOffset, 1) - JST_OFFSET_MS);
}

function toExclusiveIso(dateKey: string) {
  const utcMs = utcMsFromDateKey(dateKey);
  return utcMs === null ? null : new Date(utcMs).toISOString();
}

function formatDateJa(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}月${day}日`;
}

function makeBoundedPeriod(
  key: AnalyticsPeriodKey,
  startDate: string,
  endDate: string,
  label?: string
): AnalyticsPeriod {
  return {
    key,
    label: label ?? `${formatDateJa(startDate)}〜${formatDateJa(endDate)}`,
    start: toExclusiveIso(startDate),
    end: toExclusiveIso(shiftDateKey(endDate, 1)),
    startDate,
    endDate,
  };
}

export function resolveAnalyticsPeriod(searchParams: AnalyticsSearchParams): AnalyticsPeriod {
  const today = dateKeyFromUtcMs(new Date().getTime());
  const requested = firstValue(searchParams.period) as AnalyticsPeriodKey | undefined;
  const key: AnalyticsPeriodKey = ["7d", "30d", "this_month", "last_month", "all", "custom"].includes(
    requested ?? ""
  )
    ? (requested as AnalyticsPeriodKey)
    : "30d";

  if (key === "all") {
    return { key, label: "全期間", start: null, end: null, startDate: "", endDate: "" };
  }

  if (key === "custom") {
    const startDate = firstValue(searchParams.start) ?? "";
    const endDate = firstValue(searchParams.end) ?? "";
    const startMs = utcMsFromDateKey(startDate);
    const endMs = utcMsFromDateKey(endDate);
    if (startMs !== null && endMs !== null && startMs <= endMs) {
      return makeBoundedPeriod(key, startDate, endDate);
    }
    return makeBoundedPeriod("30d", shiftDateKey(today, -29), today, "過去30日");
  }

  if (key === "this_month") {
    return makeBoundedPeriod(key, monthStart(today), today, "今月");
  }

  if (key === "last_month") {
    const startDate = monthStart(today, -1);
    const endDate = shiftDateKey(monthStart(today), -1);
    return makeBoundedPeriod(key, startDate, endDate, "先月");
  }

  const days = key === "7d" ? 7 : 30;
  return makeBoundedPeriod(key, shiftDateKey(today, -(days - 1)), today, `過去${days}日`);
}

const ZERO_METRICS: AnalyticsMetrics = {
  viewEvents: 0,
  viewSessions: 0,
  mapEvents: 0,
  mapSessions: 0,
  reservationEvents: 0,
  reservationSessions: 0,
  phoneEvents: 0,
  phoneSessions: 0,
  instagramEvents: 0,
  instagramSessions: 0,
  highIntentEvents: 0,
  highIntentSessions: 0,
};

export async function getAnalyticsOverview(period: AnalyticsPeriod): Promise<AnalyticsOverview> {
  const { data, error } = await supabaseAdmin.rpc("admin_analytics_overview", {
    p_start: period.start,
    p_end: period.end,
  });
  if (error) throw new Error(`Analytics overview query failed: ${error.message}`);

  const result = (data ?? {}) as Partial<AnalyticsOverview>;
  return {
    summary: { ...ZERO_METRICS, siteSessions: 0, ...(result.summary ?? {}) },
    restaurants: result.restaurants ?? [],
    hotels: result.hotels ?? [],
  };
}

export async function getRestaurantAnalytics(
  restaurantId: string,
  period: AnalyticsPeriod
): Promise<RestaurantAnalytics> {
  const { data, error } = await supabaseAdmin.rpc("admin_restaurant_analytics", {
    p_restaurant_id: restaurantId,
    p_start: period.start,
    p_end: period.end,
  });
  if (error) throw new Error(`Restaurant analytics query failed: ${error.message}`);

  const result = (data ?? {}) as Partial<RestaurantAnalytics> & {
    metrics?: Partial<AnalyticsMetrics>;
  };
  return {
    ...ZERO_METRICS,
    ...(result.metrics ?? {}),
    restaurant: result.restaurant ?? {},
    listingHotels: result.listingHotels ?? [],
    hotelBreakdown: result.hotelBreakdown ?? [],
    daily: result.daily ?? [],
    quality: {
      totalEvents: 0,
      uniqueSessions: 0,
      uniqueNetworks: 0,
      sessionsPerNetwork: null,
      eventsPerNetwork: null,
      networkConcentration: [],
      anomalies: [],
      ...(result.quality ?? {}),
    },
  };
}
