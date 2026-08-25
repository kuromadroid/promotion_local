"use client";

import Image from "next/image";

export type HeroCollageImage = {
  id: string;
  src: string;
  alt?: string;
};

type HeroCollageProps = {
  images: HeroCollageImage[];
};

const ROLE_ORDER = ["large", "medium1", "medium2", "small1", "small2"] as const;

function heroImageSizes(count: number, index: number) {
  const mobile: Record<number, string[]> = {
    1: ["100vw"],
    2: ["100vw", "100vw"],
    3: ["62vw", "44vw", "100vw"],
    4: ["62vw", "44vw", "100vw", "38vw"],
    5: ["73vw", "31vw", "35vw", "75vw", "30vw"],
  };
  const desktop: Record<number, string[]> = {
    1: ["100vw"],
    2: ["58vw", "48vw"],
    3: ["46vw", "60vw", "60vw"],
    4: ["46vw", "60vw", "60vw", "32vw"],
    5: ["46vw", "34vw", "30vw", "34vw", "32vw"],
  };

  return `(max-width: 767px) ${mobile[count]?.[index] ?? "100vw"}, ${desktop[count]?.[index] ?? "60vw"}`;
}

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
          <Image
            src={image.src}
            alt={image.alt ?? ""}
            fill
            sizes={heroImageSizes(safeImages.length, index)}
            quality={85}
            preload={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
