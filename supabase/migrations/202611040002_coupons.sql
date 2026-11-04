-- Coupons managed from the admin screen (/admin/coupons), replacing the
-- `coupon` tag and the fixed lassi coupon in the app.
--
-- A coupon has its offer text and terms in each language, an image, and the
-- restaurants it applies to. Coupons are still shown on the UI preview hotel
-- only (lib/repositories getRestaurantsForHotel).
--
-- Scope:
--   * Adds the `coupons` table with a public read policy for active coupons.
--   * Adds the lassi coupon shown today, applied to the restaurants currently
--     tagged `coupon`. Only added while the table is empty.
--   * Deletes the `coupon` tag, which also removes its restaurant_tags rows.
--     No other tag, restaurant or hotel data changes. No events table or RPC
--     is changed.
--
-- Apply this BEFORE deploying the app version that reads this table: that
-- version no longer hides the `coupon` tag from other hotels. Until the app is
-- deployed, the coupon ribbon and button disappear from the UI preview hotel.
--
-- Apply in the Supabase SQL Editor. Safe to re-run.

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  -- Big text under the image, e.g. {"ja": "ラッシー1杯無料", ...}.
  offer jsonb not null,
  -- Terms per language, e.g. {"ja": ["1グループ1杯…", ...], ...}.
  terms jsonb not null,
  image_url text not null,
  restaurant_ids text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table coupons enable row level security;

drop policy if exists "Public read active coupons" on coupons;
create policy "Public read active coupons" on coupons for select using (is_active);

insert into coupons (offer, terms, image_url, restaurant_ids)
select
  '{"ja":"ラッシー1杯無料","en":"One free lassi","zh-CN":"免费赠送拉西酸奶一杯","zh-TW":"免費贈送拉西優格飲一杯","ko":"라씨 1잔 무료"}'::jsonb,
  '{
    "ja":["ご注文の前にこの画面をスタッフにお見せください。","1グループ1杯、1回限りです。","お食事のご注文が必要です。","他のクーポン・割引とは併用できません。現金とは交換できません。","スクリーンショットは無効です。","写真はイメージです。品切れや内容の変更で、提供できない場合があります。","乳製品を含みます。アレルギーはスタッフにご確認ください。"],
    "en":["Show this screen to staff before ordering.","One lassi per group, one time only.","A food order is required.","Cannot be combined with other coupons or discounts. No cash value.","Screenshots are not valid.","Photo for illustration only. Subject to availability and changes.","Contains dairy. Please ask staff about allergies."],
    "zh-CN":["点餐前请向店员出示此页面。","每组限兑一杯拉西酸奶，仅限一次。","须点餐方可使用。","不可与其他优惠券或折扣同时使用。不可兑换现金。","截图无效。","图片仅供参考。商品可能因售罄或内容调整而无法供应。","本饮品含乳制品。如有过敏，请向店员确认。"],
    "zh-TW":["點餐前請向店員出示此頁面。","每組限兌一杯拉西優格飲，限兌一次。","須點餐方可使用。","不得與其他優惠券或折扣併用。不得兌換現金。","截圖無效。","圖片僅供參考。商品可能因售完或內容調整而無法供應。","本飲品含乳製品。如有過敏，請向店員確認。"],
    "ko":["주문 전에 이 화면을 직원에게 보여 주세요.","그룹당 라씨 1잔, 1회만 이용할 수 있습니다.","음식 주문이 필요합니다.","다른 쿠폰이나 할인과 함께 사용할 수 없습니다. 현금으로 교환할 수 없습니다.","스크린샷은 사용할 수 없습니다.","사진은 참고용입니다. 품절 또는 내용 변경으로 제공되지 않을 수 있습니다.","유제품이 포함되어 있습니다. 알레르기는 직원에게 확인해 주세요."]
  }'::jsonb,
  '/coupon/lassi.webp',
  coalesce((select array_agg(restaurant_id) from restaurant_tags where tag_id = 'coupon'), '{}')
where not exists (select 1 from coupons);

delete from tags where id = 'coupon';
