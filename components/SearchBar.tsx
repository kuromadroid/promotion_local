"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function SearchBar({ hotelId }: { hotelId: string }) {
  const { t } = useLocale();
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("q", value.trim());
    router.push(`/h/${hotelId}/restaurants?${params.toString()}`);
  };

  return (
    <form onSubmit={submit} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-full border border-(--color-line) bg-white py-3 pl-11 pr-4 text-sm text-(--color-ink) shadow-sm outline-none focus:border-(--color-navy)"
      />
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--color-ink-soft)"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </form>
  );
}
