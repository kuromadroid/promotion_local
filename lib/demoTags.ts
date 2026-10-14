import { isUiPreviewHotel } from "@/lib/uiPreview";

/**
 * Genre tags that are being trialled on the UI preview hotel (lib/uiPreview.ts)
 * only. Every other hotel — including the sales demo hotel — never sees these
 * tags: not in the genre grid, the list filters, or on restaurant cards /
 * detail pages, so the shared restaurants can carry them in the DB without
 * changing anything for real guests.
 *
 * To roll a tag out to every hotel, remove it from this set (and add it to
 * the live genre grid in EditorialHomeV2).
 */
export const DEMO_ONLY_TAG_IDS = new Set([
  "yakitori-kushi",
  "creative-izakaya",
  "taishu-sakaba",
  "sweets",
]);

export function isTagVisibleForHotel(tagId: string, hotelId: string) {
  return isUiPreviewHotel(hotelId) || !DEMO_ONLY_TAG_IDS.has(tagId);
}
