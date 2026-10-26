-- Lets an ad target specific hotels (e.g. try one on the UI preview hotel
-- only). NULL keeps the existing behaviour: shown on every hotel.
--
-- Scope: adds one nullable column to `ads`. Nothing else changes.
-- Safe to apply before or after the app deploy. Apply in the Supabase SQL
-- Editor. Safe to re-run.

alter table ads add column if not exists hotel_ids text[];

notify pgrst, 'reload schema';
