"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/i18n/localeCookie";
import { Locale } from "@/lib/types";

export async function selectLocaleAction(locale: Locale, hotelId: string) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  redirect(`/h/${hotelId}`);
}
