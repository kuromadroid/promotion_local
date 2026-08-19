"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { Locale } from "@/lib/types";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";
import { trackEvent } from "@/lib/analytics";

interface LocaleContextValue {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Record<string, string>;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = messages[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [messages]
  );

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
      trackEvent({ eventName: "language_select", language: next });
      router.refresh();
    },
    [router]
  );

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
