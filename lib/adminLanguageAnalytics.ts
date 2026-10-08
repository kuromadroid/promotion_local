import "server-only";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { AnalyticsPeriod } from "@/lib/adminAnalytics";
import { LOCALES } from "@/lib/types";

export const LANGUAGE_KEYS = [...LOCALES, "unknown"] as const;
export type LanguageKey = (typeof LANGUAGE_KEYS)[number];

export const LANGUAGE_LABELS: Record<LanguageKey, string> = {
  ja: "日本語",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ko: "한국어",
  unknown: "不明",
};

export function isLanguageKey(value: string): value is LanguageKey {
  return (LANGUAGE_KEYS as readonly string[]).includes(value);
}

export function languageLabel(language: string) {
  return isLanguageKey(language) ? LANGUAGE_LABELS[language] : language;
}

/** The per-language columns shown in the admin tables, in display order. */
export const LANGUAGE_METRIC_COLUMNS = [
  { event: "restaurant_view", label: "店舗カード" },
  { event: "restaurant_detail_view", label: "店舗詳細" },
  { event: "map_click", label: "Maps" },
  { event: "reservation_click", label: "予約" },
  { event: "phone_click", label: "電話" },
  { event: "instagram_click", label: "Instagram" },
  { event: "official_site_click", label: "公式サイト" },
  { event: "area_filter", label: "エリア絞込" },
  { event: "tag_filter", label: "タグ絞込" },
] as const;

export interface EventCount {
  events: number;
  sessions: number;
}

export type EventCounts = Partial<Record<string, EventCount>>;

export interface LanguageRow {
  language: string;
  totalEvents: number;
  inferredEvents: number;
  siteSessions: number;
  highIntentEvents: number;
  highIntentSessions: number;
  byEvent: EventCounts;
}

export interface LanguageRestaurantRow {
  id: string;
  name: string;
  highIntentEvents: number;
  highIntentSessions: number;
  byEvent: EventCounts;
}

export interface LanguageFilterRow {
  kind: "area" | "tag";
  id: string;
  name: string;
  events: number;
  sessions: number;
}

export interface LanguageAnalytics {
  languages: LanguageRow[];
  restaurants: LanguageRestaurantRow[];
  filters: LanguageFilterRow[];
}

const ZERO: EventCount = { events: 0, sessions: 0 };

export function eventCount(counts: EventCounts, event: string): EventCount {
  return counts[event] ?? ZERO;
}

/**
 * One RPC call per page view. Without `language`, only the per-language
 * summary is filled; with it, the restaurant and filter breakdowns for that
 * language are filled too.
 */
export async function getLanguageAnalytics(
  period: AnalyticsPeriod,
  language?: LanguageKey
): Promise<LanguageAnalytics> {
  const { data, error } = await supabaseAdmin.rpc("admin_language_analytics", {
    p_start: period.start,
    p_end: period.end,
    p_language: language ?? null,
  });
  if (error) throw new Error(`Language analytics query failed: ${error.message}`);

  const result = (data ?? {}) as Partial<LanguageAnalytics>;
  return {
    languages: result.languages ?? [],
    restaurants: result.restaurants ?? [],
    filters: result.filters ?? [],
  };
}
