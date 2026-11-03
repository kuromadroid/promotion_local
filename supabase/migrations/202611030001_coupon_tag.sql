-- クーポン tag.
--
-- Scope: inserts the `coupon` feature tag only. No restaurant is tagged here —
-- tag restaurants that offer a coupon from the admin restaurant form. Tagged
-- restaurants get a COUPON ribbon on their photo in the lists, and the tag
-- also appears in the restaurant list filters. No schema, RLS policy, events
-- table or RPC is changed.
--
-- Safe to apply before or after the app deploy. Apply in the Supabase SQL
-- Editor. Safe to re-run.

insert into tags (id, type, name) values
  ('coupon', 'feature', '{"ja":"クーポンあり","en":"Coupon","zh-CN":"有优惠券","zh-TW":"有優惠券","ko":"쿠폰"}')
on conflict (id) do nothing;
