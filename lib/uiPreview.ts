/**
 * Hotels that show UI still under evaluation (see
 * supabase/migrations/202610130002_ui_preview_hotel.sql). Other hotels —
 * including the sales demo hotel — keep the current UI.
 *
 * To ship a previewed change, make it the default and drop the branch on
 * isUiPreviewHotel().
 */
const UI_PREVIEW_HOTEL_IDS = new Set(["ui-preview"]);

export function isUiPreviewHotel(hotelId: string) {
  return UI_PREVIEW_HOTEL_IDS.has(hotelId);
}
