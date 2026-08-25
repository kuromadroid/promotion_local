import { cookies } from "next/headers";
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

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (value && LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return DEFAULT_LOCALE;
}

/** True once the guest has explicitly picked a language (vs. never having visited). */
export async function hasLocaleCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return Boolean(value && LOCALES.includes(value as Locale));
}

export function getMessages(locale: Locale) {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE];
}
