-- カフェ genre for every hotel.
--
-- Scope: inserts the `cafe` cuisine tag only (also part of
-- 202610130001_demo_genres.sql, which stays pending for the izakaya
-- sub-genres). No restaurant is tagged here — tag cafes from the admin
-- restaurant form. No schema, RLS policy, events table or RPC is changed.
--
-- Safe to apply before or after the app deploy that lists カフェ in the live
-- genre grid. Apply in the Supabase SQL Editor. Safe to re-run.

insert into tags (id, type, name) values
  ('cafe', 'cuisine', '{"ja":"カフェ","en":"Cafe","zh-CN":"咖啡馆","zh-TW":"咖啡廳","ko":"카페"}')
on conflict (id) do nothing;
