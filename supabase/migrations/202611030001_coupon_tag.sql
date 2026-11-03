-- クーポン tag, on trial on the UI preview hotel only.
--
-- Scope:
--   * tags: inserts the `coupon` feature tag.
--   * restaurant_tags: tags 奥芝食堂 (looked up by its Japanese name) with it.
--     Its existing tags are kept, so nothing is removed.
--   * No schema, RLS policy, events table or RPC is changed.
--
-- Tagged restaurants get a COUPON ribbon on their photo in the lists, and the
-- tag also appears in the restaurant list filters — but only on the UI
-- preview hotel (ui-preview): `coupon` is listed in lib/demoTags.ts, so every
-- other hotel never sees it. Deploy the app first; if this is applied before
-- the deploy, the tag shows up on live hotels until the app is deployed.
--
-- Apply in the Supabase SQL Editor. Safe to re-run.

insert into tags (id, type, name) values
  ('coupon', 'feature', '{"ja":"クーポンあり","en":"Coupon","zh-CN":"有优惠券","zh-TW":"有優惠券","ko":"쿠폰"}')
on conflict (id) do nothing;

insert into restaurant_tags (restaurant_id, tag_id)
select t.restaurant_id, 'coupon'
from restaurant_translations t
where t.locale = 'ja' and t.name like '%奥芝食堂%'
on conflict (restaurant_id, tag_id) do nothing;
