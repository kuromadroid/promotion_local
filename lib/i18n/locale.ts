import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, Locale } from "@/lib/types";
import ja from "@/lib/i18n/messages/ja.json";
import en from "@/lib/i18n/messages/en.json";
import zhCN from "@/lib/i18n/messages/zh-CN.json";
import zhTW from "@/lib/i18n/messages/zh-TW.json";
import ko from "@/lib/i18n/messages/ko.json";
import { LOCALE_COOKIE } from "@/lib/i18n/localeCookie";

export { LOCALE_COOKIE };

export const messagesByLocale: Record<Locale, Record<string, string>> = {
  ja,
  en,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ko,
};

/**
 * The guest's language: the one they picked (locale cookie) if any, otherwise
 * inferred from the browser's Accept-Language header.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value && LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  const headerStore = await headers();
  return localeFromAcceptLanguage(headerStore.get("accept-language"));
}

/** True once the guest has explicitly picked a language (vs. never having visited). */
export async function hasLocaleCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return Boolean(value && LOCALES.includes(value as Locale));
}

function matchLocale(tag: string): Locale | null {
  const lower = tag.toLowerCase();
  const [lang] = lower.split("-");
  if (lang === "zh") {
    // Taiwan / Hong Kong / Macau and explicit Traditional script → 繁體中文.
    return /-(hant|tw|hk|mo)\b/.test(lower) ? "zh-TW" : "zh-CN";
  }
  if (lang === "ja" || lang === "en" || lang === "ko") return lang;
  return null;
}

/**
 * Picks the highest-priority supported language from an Accept-Language
 * header (e.g. "ko-KR,ko;q=0.9,en-US;q=0.8" → "ko"). Guests whose languages
 * we don't offer get English; a missing header falls back to the default.
 */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number(q.trim().slice(2)) : 1;
      return { tag: tag.trim(), quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter((entry) => entry.tag && entry.tag !== "*" && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { tag } of tags) {
    const locale = matchLocale(tag);
    if (locale) return locale;
  }
  return tags.length > 0 ? "en" : DEFAULT_LOCALE;
}

export function getMessages(locale: Locale) {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}
