"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/i18n/localeCookie";
import { Locale } from "@/lib/types";
import { getIpFromHeaders, recordServerEvent } from "@/lib/serverAnalytics";

export async function selectLocaleAction(locale: Locale, hotelId: string, formData: FormData) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  try {
    await recordServerEvent(
      {
        eventName: "language_select",
        sessionId: String(formData.get("session_id") ?? ""),
        hotelId,
        language: locale,
        path: `/h/${hotelId}`,
        meta: { source: "gate" },
      },
      getIpFromHeaders(await headers())
    );
  } catch {
    // Analytics must never block language selection.
  }

  redirect(`/h/${hotelId}`);
}
