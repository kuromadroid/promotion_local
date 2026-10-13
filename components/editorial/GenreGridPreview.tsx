"use client";

import { Locale } from "@/lib/types";
import styles from "./genre-grid-preview.module.css";

type T = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Genre picker under evaluation on the UI preview hotel (lib/uiPreview.ts),
 * following the Digital Agency design system (DADS): 14px+ labels, 44px+
 * targets, 3:1 borders, a yellow/black focus ring, and a selected state that
 * doesn't rely on colour alone. Adds an "all" reset and per-genre counts, and
 * tapping the selected genre again clears it.
 */
export function GenreGridPreview({
  genres,
  counts,
  total,
  active,
  onChange,
  locale,
  t,
}: {
  genres: { tagId: string; label: Record<Locale, string> }[];
  counts: Record<string, number>;
  total: number;
  active: string;
  onChange: (tagId: string) => void;
  locale: Locale;
  t: T;
}) {
  const activeLabel =
    active === "all" ? t("all") : genres.find((g) => g.tagId === active)?.label[locale] ?? t("all");
  const activeCount = active === "all" ? total : counts[active] ?? 0;

  const cell = (tagId: string, label: string, count: number, wide = false) => {
    const pressed = active === tagId;
    return (
      <button
        type="button"
        key={tagId}
        aria-pressed={pressed}
        className={`${styles.cell} ${wide ? styles.cellWide : ""} ${pressed ? styles.cellActive : ""}`}
        onClick={() => onChange(pressed && tagId !== "all" ? "all" : tagId)}
      >
        <span className={styles.label}>
          {pressed && (
            <span className={styles.check} aria-hidden="true">
              ✓
            </span>
          )}
          {label}
        </span>
        <span className={styles.count}>{count}</span>
      </button>
    );
  };

  return (
    <>
      <div className={styles.grid}>
        {cell("all", t("all"), total, true)}
        {genres.map((g) => cell(g.tagId, g.label[locale], counts[g.tagId] ?? 0))}
      </div>
      <p className={styles.result} aria-live="polite">
        {t("genreResultCount", { genre: activeLabel, count: activeCount })}
      </p>
    </>
  );
}
