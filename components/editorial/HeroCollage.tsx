"use client";

export type HeroCollageImage = {
  id: string;
  src: string;
  alt?: string;
};

type HeroCollageProps = {
  images: HeroCollageImage[];
};

const ROLE_ORDER = ["large", "medium1", "medium2", "small1", "small2"] as const;

/**
 * Sapporo Bites Hero collage — asymmetric editorial grid (1 large + 2 medium + 2 small).
 *
 * - Accepts 0–5 images; role is assigned by array order, so callers control
 *   priority simply by ordering the array (first image = "large").
 * - Pure CSS Grid, no rotation, no per-photo borders — see .sbHeroCollage
 *   and .sbHero-* in globals.css. Layout adapts to the image count via
 *   [data-count] so it degrades gracefully below 5 images.
 * - DB / Storage / adminには依存しない
 */
export default function HeroCollage({ images }: HeroCollageProps) {
  const safeImages = images.filter((image) => Boolean(image?.src)).slice(0, 5);
  if (safeImages.length === 0) return null;

  return (
    <div className="sbHeroCollage" data-count={safeImages.length} aria-hidden="true">
      {safeImages.map((image, index) => (
        <div key={image.id} className={`sbHeroFrame sbHero-${ROLE_ORDER[index]}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={image.alt ?? ""} />
        </div>
      ))}
    </div>
  );
}
