import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New, Inter_Tight } from "next/font/google";
import { getServerLocale } from "@/lib/i18n/locale";
import "./globals.css";

// Self-hosted by Next.js at build time — no runtime request to Google Fonts.
const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
  preload: false,
  variable: "--font-zen-kaku",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: "Sapporo Bites — ホテル宿泊者向け飲食店ガイド",
  description:
    "ホテル宿泊者が札幌の飲食店を見つけ、来店につなげるための多言語ガイドサービス。",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale();
  return (
    <html
      lang={locale}
      className={`h-full ${zenKakuGothicNew.variable} ${interTight.variable}`}
    >
      <body className="min-h-full flex flex-col bg-(--color-snow) text-(--color-ink)">
        {children}
      </body>
    </html>
  );
}
