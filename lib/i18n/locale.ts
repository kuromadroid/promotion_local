import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, Locale } from "@/lib/types";
import ja from "@/lib/i18n/messages/ja.json";
import en from "@/lib/i18n/messages/en.json";
import zh from "@/lib/i18n/messages/zh.json";
import ko from "@/lib/i18n/messages/ko.json";

export const LOCALE_COOKIE = "sapporo_bites_locale";

export const messagesByLocale: Record<Locale, Record<string, string>> = {
  ja,
  en,
  zh,
  ko,
};

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value && LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

export function getMessages(locale: Locale) {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}
