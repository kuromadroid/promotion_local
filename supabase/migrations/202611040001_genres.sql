-- Genre buttons on the hotel top page, for every hotel.
--
-- Until now the list was fixed in the app. This table lets the admin screen
-- (/admin/genres) add, remove and reorder genres. A genre points at a tag;
-- removing a genre only takes its button away, so the tag and the restaurants
-- tagged with it are left as they are.
--
-- Scope: adds the `genres` table with a public read policy, and fills it with
-- the 9 genres shown today, with the same labels and order. No existing table,
-- policy, events table or RPC is changed.
--
-- Safe to apply before or after the app deploy (the app uses the same 9 genres
-- until this table exists). Apply in the Supabase SQL Editor. Safe to re-run:
-- the 9 genres are only added while the table is empty.

create table if not exists genres (
  tag_id text primary key references tags (id) on delete cascade,
  label jsonb not null,
  display_order integer not null,
  created_at timestamptz not null default now()
);

alter table genres enable row level security;

drop policy if exists "Public read access" on genres;
create policy "Public read access" on genres for select using (true);

insert into genres (tag_id, label, display_order)
select v.tag_id, v.label::jsonb, v.display_order
from (values
  ('genghis-khan', '{"ja":"ジンギスカン","en":"Genghis Khan","zh-CN":"成吉思汗烤肉","zh-TW":"成吉思汗烤肉","ko":"징기스칸"}', 1),
  ('seafood', '{"ja":"海鮮","en":"Seafood","zh-CN":"海鲜","zh-TW":"海鮮","ko":"해산물"}', 2),
  ('yakiniku', '{"ja":"焼肉","en":"Yakiniku","zh-CN":"烤肉","zh-TW":"烤肉","ko":"야키니쿠"}', 3),
  ('izakaya', '{"ja":"居酒屋","en":"Izakaya","zh-CN":"居酒屋","zh-TW":"居酒屋","ko":"이자카야"}', 4),
  ('bar', '{"ja":"BAR","en":"Bar","zh-CN":"酒吧","zh-TW":"酒吧","ko":"바"}', 5),
  ('washoku', '{"ja":"和食","en":"Japanese Cuisine","zh-CN":"日本料理","zh-TW":"日本料理","ko":"일식"}', 6),
  ('ramen', '{"ja":"ラーメン","en":"Ramen","zh-CN":"拉面","zh-TW":"拉麵","ko":"라멘"}', 7),
  ('soup-curry', '{"ja":"スープカレー","en":"Soup Curry","zh-CN":"汤咖喱","zh-TW":"湯咖哩","ko":"수프카레"}', 8),
  ('cafe', '{"ja":"カフェ","en":"Cafe","zh-CN":"咖啡馆","zh-TW":"咖啡廳","ko":"카페"}', 9)
) as v(tag_id, label, display_order)
where exists (select 1 from tags t where t.id = v.tag_id)
  and not exists (select 1 from genres);
