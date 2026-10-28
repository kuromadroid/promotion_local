/**
 * How a hero photo is framed on the phone hero: zoomed `zoom`x around the
 * point (x%, y%). Rendered as `transform: scale(zoom)` with that point as
 * transform-origin, so the frame never runs past the photo's edges.
 *
 * Stored in the hero_photos URL itself as a fragment (`…jpg#crop=2,50,40`),
 * which keeps it out of the image request and needs no extra column.
 * Set in admin for the UI preview hotel only (lib/uiPreview.ts).
 */
export type HeroCrop = { zoom: number; x: number; y: number };

export const DEFAULT_HERO_CROP: HeroCrop = { zoom: 2, x: 50, y: 50 };
export const HERO_CROP_MAX_ZOOM = 4;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function clampHeroCrop(crop: HeroCrop): HeroCrop {
  return {
    zoom: clamp(crop.zoom, 1, HERO_CROP_MAX_ZOOM),
    x: clamp(crop.x, 0, 100),
    y: clamp(crop.y, 0, 100),
  };
}

/** Splits a stored hero photo URL into the image URL and its crop (if any). */
export function parseHeroPhoto(stored: string): { src: string; crop: HeroCrop | null } {
  const [src, fragment] = stored.split("#");
  const m = fragment?.match(/^crop=([\d.]+),([\d.]+),([\d.]+)$/);
  if (!m) return { src, crop: null };
  return { src, crop: clampHeroCrop({ zoom: Number(m[1]), x: Number(m[2]), y: Number(m[3]) }) };
}

export function formatHeroPhoto(src: string, crop: HeroCrop): string {
  const c = clampHeroCrop(crop);
  return `${src}#crop=${c.zoom.toFixed(2)},${c.x.toFixed(1)},${c.y.toFixed(1)}`;
}

export function heroCropStyle(crop: HeroCrop) {
  return { transform: `scale(${crop.zoom})`, transformOrigin: `${crop.x}% ${crop.y}%` };
}
