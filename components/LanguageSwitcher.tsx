"use client";

import { useLocale } from "@/components/LocaleProvider";
import { Locale } from "@/lib/types";

const OPTIONS: { code: Locale; label: string }[] = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "ko", label: "한국어" },
];

export function LanguageSwitcher({
  wrapperClassName = "inline-flex items-center gap-2 text-sm text-white/90",
  selectClassName = "rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-medium text-white outline-none [color-scheme:dark]",
}: {
  wrapperClassName?: string;
  selectClassName?: string;
}) {
  const { locale, setLocale, t } = useLocale();
  return (
    <label className={wrapperClassName}>
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={selectClassName}
      >
        {OPTIONS.map((opt) => (
          <option key={opt.code} value={opt.code} className="text-(--color-ink)">
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
