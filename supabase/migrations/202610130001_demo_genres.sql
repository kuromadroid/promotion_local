-- Demo-hotel genre trial: split 居酒屋 into 焼き鳥・串 / 創作居酒屋 / 大衆酒場,
-- and add カフェ / スイーツ.
--
-- Scope:
--   * tags: inserts 5 new cuisine tags. Existing tags are untouched.
--   * restaurant_tags: assigns the new izakaya sub-genres to the 8 restaurants
--     currently tagged 居酒屋. Their existing tags (including izakaya) are kept,
--     so nothing is removed.
--   * No schema, RLS policy, events table or RPC is changed.
--
-- Only the UI preview hotel (ui-preview) sees these tags: the app hides the
-- ids listed in lib/demoTags.ts for every other hotel, including the sales
-- demo hotel. Applying
-- this before or after deploying the app is fine — but if it is applied
-- first, the new tags show up on live hotels' restaurant pages until the app
-- is deployed, so deploy first.
--
-- Apply in the Supabase SQL Editor. Safe to re-run.

insert into tags (id, type, name) values
  ('yakitori-kushi', 'cuisine', '{"ja":"焼き鳥・串","en":"Yakitori & Skewers","zh-CN":"烤鸡串・串烧","zh-TW":"烤雞串・串燒","ko":"야키토리・꼬치"}'),
  ('creative-izakaya', 'cuisine', '{"ja":"創作居酒屋","en":"Creative Izakaya","zh-CN":"创意居酒屋","zh-TW":"創意居酒屋","ko":"창작 이자카야"}'),
  ('taishu-sakaba', 'cuisine', '{"ja":"大衆酒場","en":"Casual Pub","zh-CN":"大众酒馆","zh-TW":"大眾酒館","ko":"대중 술집"}'),
  ('cafe', 'cuisine', '{"ja":"カフェ","en":"Cafe","zh-CN":"咖啡馆","zh-TW":"咖啡廳","ko":"카페"}'),
  ('sweets', 'cuisine', '{"ja":"スイーツ","en":"Sweets","zh-CN":"甜点","zh-TW":"甜點","ko":"디저트"}')
on conflict (id) do nothing;

-- Only rows whose restaurant still exists are written.
insert into restaurant_tags (restaurant_id, tag_id)
select v.restaurant_id, v.tag_id
from (values
  -- 焼き鳥・串
  ('31790ccc-2a88-413a-92f8-6bdc78928896', 'yakitori-kushi'),   -- やきとり酒場 悠然
  ('94b18350-f9ba-472e-ae2e-a077b47b9442', 'yakitori-kushi'),   -- 串揚げ 羊料理 居酒屋ひとで
  ('6df71435-2b24-4f83-8076-d419303ea860', 'yakitori-kushi'),   -- 居酒屋 しゅういち (豚串)
  -- 創作居酒屋
  ('e12a94ba-6000-4180-86aa-4a6da64e2785', 'creative-izakaya'), -- 純米と肉と刺身 ビーストキッチン
  ('cd0c00a1-d5c3-4c79-b7c8-33d87a32c725', 'creative-izakaya'), -- たべごと屋 ござる
  ('aabbde5d-4b73-421b-9ad3-752e63147d33', 'creative-izakaya'), -- 創作餃子居酒屋 包 すすきの店
  ('e4256484-dbe2-47dd-bf28-9875269265dc', 'creative-izakaya'), -- 昼から呑める ネオ酒場 おかえり
  -- 大衆酒場
  ('e4256484-dbe2-47dd-bf28-9875269265dc', 'taishu-sakaba'),    -- 昼から呑める ネオ酒場 おかえり
  ('c3f1c670-31c8-4a11-ba95-ffa88180bc27', 'taishu-sakaba'),    -- お酒とおばんざい ginza
  ('6df71435-2b24-4f83-8076-d419303ea860', 'taishu-sakaba')     -- 居酒屋 しゅういち
) as v(restaurant_id, tag_id)
where exists (select 1 from restaurants r where r.id = v.restaurant_id)
on conflict (restaurant_id, tag_id) do nothing;
