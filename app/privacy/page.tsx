import type { Metadata } from "next";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/locale";
import { PrivacyPolicyJa } from "./PrivacyPolicyJa";
import { PrivacyPolicyEn } from "./PrivacyPolicyEn";

type PolicyLang = "ja" | "en";
type SearchParams = Promise<{ lang?: string }>;

/**
 * Japanese is the governing text; every other display language gets the
 * English translation. `?lang=ja|en` overrides the detected language.
 */
async function resolveLang(searchParams: SearchParams): Promise<PolicyLang> {
  const { lang } = await searchParams;
  if (lang === "ja" || lang === "en") return lang;
  return (await getServerLocale()) === "ja" ? "ja" : "en";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const lang = await resolveLang(searchParams);
  return {
    title: lang === "ja" ? "プライバシーポリシー — Sapporo Bites" : "Privacy Policy — Sapporo Bites",
  };
}

export default async function PrivacyPolicyPage({ searchParams }: { searchParams: SearchParams }) {
  const lang = await resolveLang(searchParams);

  return (
    <main lang={lang} className="min-h-screen bg-(--color-snow)">
      <div className="bg-(--color-navy) py-8 text-white">
        <div className="mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold tracking-[0.25em] text-white/60">SAPPORO BITES</div>
            <Link
              href={lang === "ja" ? "/privacy?lang=en" : "/privacy?lang=ja"}
              lang={lang === "ja" ? "en" : "ja"}
              className="text-xs text-white/70 underline underline-offset-2 transition-colors hover:text-white"
            >
              {lang === "ja" ? "English" : "日本語"}
            </Link>
          </div>
          <h1 className="mt-2 text-xl font-bold sm:text-2xl">
            {lang === "ja" ? "プライバシーポリシー" : "Privacy Policy"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        {lang === "ja" ? <PrivacyPolicyJa /> : <PrivacyPolicyEn />}
      </div>
    </main>
  );
}
