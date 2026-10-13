-- UI確認用デモホテル (ui-preview): a sandbox for trying UI changes before they
-- reach the sales demo hotel (hotel-d76a4d81) or live hotels.
--
-- Scope:
--   * hotels: inserts `ui-preview` as a demo hotel (is_demo = true), so its
--     traffic stays out of the live analytics. Location is copied from
--     hotel-d76a4d81.
--   * hotel_restaurants: copies hotel-d76a4d81's restaurant list (same
--     distances, priorities and visibility). Later changes to either hotel's
--     list are NOT synced.
--   * No other hotel, schema, RLS policy, events table or RPC is changed.
--
-- Which UI the hotel shows is decided in code (lib/uiPreview.ts).
-- To remove it: delete from hotels where id = 'ui-preview'; (links cascade).
--
-- Apply in the Supabase SQL Editor. Safe to re-run.

insert into hotels (id, name, area_id, latitude, longitude, hero_photos, is_demo)
select 'ui-preview', 'UI Preview Hotel', area_id, latitude, longitude, hero_photos, true
from hotels
where id = 'hotel-d76a4d81'
on conflict (id) do nothing;

insert into hotel_restaurants (hotel_id, restaurant_id, distance_m, walking_minutes, display_priority, is_visible)
select 'ui-preview', restaurant_id, distance_m, walking_minutes, display_priority, is_visible
from hotel_restaurants
where hotel_id = 'hotel-d76a4d81'
  and exists (select 1 from hotels where id = 'ui-preview')
on conflict (hotel_id, restaurant_id) do nothing;
