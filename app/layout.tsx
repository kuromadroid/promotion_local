import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sapporo Bites — ホテル宿泊者向け飲食店ガイド",
  description:
    "ホテル宿泊者が札幌の飲食店を見つけ、来店につなげるための多言語ガイドサービス。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col bg-(--color-snow) text-(--color-ink)">
        {children}
      </body>
    </html>
  );
}
