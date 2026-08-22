"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/i18n/localeCookie";
import { Locale } from "@/lib/types";
import { getIpFromHeaders, recordServerEvent } from "@/lib/serverAnalytics";

export async function selectLocaleAction(locale: Locale, hotelId: string) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const ip = getIpFromHeaders(await headers());
  await recordServerEvent(
    {
      eventName: "language_select",
      hotelId,
      language: locale,
      path: `/h/${hotelId}`,
      meta: { source: "gate" },
    },
    ip
  );

  redirect(`/h/${hotelId}`);
}
