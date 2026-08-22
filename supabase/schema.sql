-- Sapporo Bites — Supabase schema + seed data
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Mirrors the dummy data structure that previously lived in lib/data/*.ts.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists areas (
  id text primary key,
  display_order int not null,
  name jsonb not null -- { ja, en, zh, ko }
);

create table if not exists tags (
  id text primary key,
  type text not null check (type in ('cuisine', 'feature', 'scene', 'language', 'payment')),
  name jsonb not null -- { ja, en, zh, ko }
);

create table if not exists hotels (
  id text primary key,
  name text not null,
  area_id text not null references areas (id),
  latitude double precision not null,
  longitude double precision not null
);

create table if not exists restaurants (
  id text primary key,
  area_id text not null references areas (id),
  price_min int not null,
  price_max int not null,
  latitude double precision not null,
  longitude double precision not null,
  phone text,
  google_maps_url text,
  reservation_url text,
  instagram_url text,
  opening_hours text,
  closed_days text,
  is_sponsored boolean not null default false,
  photos text[] not null default '{}'
);

create table if not exists restaurant_translations (
  restaurant_id text not null references restaurants (id) on delete cascade,
  locale text not null check (locale in ('ja', 'en', 'zh', 'ko')),
  name text not null,
  description text not null,
  recommended_dish text,
  primary key (restaurant_id, locale)
);

create table if not exists restaurant_tags (
  restaurant_id text not null references restaurants (id) on delete cascade,
  tag_id text not null references tags (id) on delete cascade,
  primary key (restaurant_id, tag_id)
);

create table if not exists hotel_restaurants (
  hotel_id text not null references hotels (id) on delete cascade,
  restaurant_id text not null references restaurants (id) on delete cascade,
  distance_m int not null,
  walking_minutes int not null,
  display_priority int not null,
  is_visible boolean not null default true,
  primary key (hotel_id, restaurant_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  hotel_id text,
  restaurant_id text,
  area_id text,
  tag_id text,
  language text,
  path text,
  ip_hash text,
  occurred_at timestamptz not null default now(),
  meta jsonb
);

alter table events add column if not exists path text;
alter table events add column if not exists ip_hash text;

create index if not exists idx_events_dedup
  on events (ip_hash, event_name, hotel_id, restaurant_id, occurred_at desc);

-- ============================================================
-- Row Level Security
-- The site is public/read-only for guests (anon key), except events
-- which guests are allowed to insert (analytics tracking) but not read.
-- ============================================================

alter table areas enable row level security;
alter table tags enable row level security;
alter table hotels enable row level security;
alter table restaurants enable row level security;
alter table restaurant_translations enable row level security;
alter table restaurant_tags enable row level security;
alter table hotel_restaurants enable row level security;
alter table events enable row level security;

drop policy if exists "Public read access" on areas;
drop policy if exists "Public read access" on tags;
drop policy if exists "Public read access" on hotels;
drop policy if exists "Public read access" on restaurants;
drop policy if exists "Public read access" on restaurant_translations;
drop policy if exists "Public read access" on restaurant_tags;
drop policy if exists "Public read access" on hotel_restaurants;
drop policy if exists "Public insert access" on events;

create policy "Public read access" on areas for select using (true);
create policy "Public read access" on tags for select using (true);
create policy "Public read access" on hotels for select using (true);
create policy "Public read access" on restaurants for select using (true);
create policy "Public read access" on restaurant_translations for select using (true);
create policy "Public read access" on restaurant_tags for select using (true);
create policy "Public read access" on hotel_restaurants for select using (true);

-- Events are now written only via the server-side /api/track route (service_role),
-- which applies IP-based de-duplication before inserting. No public insert policy.
drop policy if exists "Public insert access" on events;

-- ============================================================
-- Seed data (equivalent to lib/data/*.ts dummy data)
-- ============================================================

insert into areas (id, display_order, name) values
  ('sapporo-station', 1, '{"ja":"札幌駅","en":"Sapporo Station","zh":"札幌站","ko":"삿포로역"}'),
  ('odori-tanukikoji', 2, '{"ja":"大通・狸小路","en":"Odori / Tanukikoji","zh":"大通・狸小路","ko":"오도리・타누키코지"}'),
  ('susukino', 3, '{"ja":"すすきの","en":"Susukino","zh":"薄野","ko":"스스키노"}'),
  ('nakajima-park', 4, '{"ja":"中島公園","en":"Nakajima Park","zh":"中岛公园","ko":"나카지마공원"}')
on conflict (id) do nothing;

insert into tags (id, type, name) values
  ('seafood', 'cuisine', '{"ja":"海鮮","en":"Seafood","zh":"海鲜","ko":"해산물"}'),
  ('sushi', 'cuisine', '{"ja":"寿司","en":"Sushi","zh":"寿司","ko":"초밥"}'),
  ('genghis-khan', 'cuisine', '{"ja":"ジンギスカン","en":"Genghis Khan (Lamb BBQ)","zh":"成吉思汗烤肉","ko":"징기스칸"}'),
  ('ramen', 'cuisine', '{"ja":"ラーメン","en":"Ramen","zh":"拉面","ko":"라멘"}'),
  ('izakaya', 'cuisine', '{"ja":"居酒屋","en":"Izakaya","zh":"居酒屋","ko":"이자카야"}'),
  ('private-room', 'feature', '{"ja":"個室","en":"Private Room","zh":"包间","ko":"개별룸"}'),
  ('late-night', 'scene', '{"ja":"深夜営業","en":"Open Late","zh":"深夜营业","ko":"심야영업"}'),
  ('card-ok', 'payment', '{"ja":"カード可","en":"Cards Accepted","zh":"可刷卡","ko":"카드 가능"}'),
  ('english-menu', 'language', '{"ja":"英語メニュー","en":"English Menu","zh":"英文菜单","ko":"영어 메뉴"}'),
  ('solo-friendly', 'scene', '{"ja":"一人でも入りやすい","en":"Solo-Friendly","zh":"适合独自用餐","ko":"혼밥 가능"}')
on conflict (id) do nothing;

insert into hotels (id, name, area_id, latitude, longitude) values
  ('hotel_a', 'Sapporo Grand Stay Hotel', 'sapporo-station', 43.0686, 141.3508),
  ('hotel_b', 'Susukino City Hotel', 'susukino', 43.0554, 141.353)
on conflict (id) do nothing;

insert into restaurants (id, area_id, price_min, price_max, latitude, longitude, phone, google_maps_url, reservation_url, instagram_url, opening_hours, closed_days, is_sponsored, photos) values
  ('r001', 'susukino', 3000, 5000, 43.0558, 141.3535, '011-000-0001', 'https://maps.google.com/?q=Susukino+Seafood+Robata', 'https://example.com/reserve/r001', 'https://instagram.com/example_r001', '17:00〜24:00', '日曜定休', false, array['https://picsum.photos/seed/r001-0/900/700','https://picsum.photos/seed/r001-1/900/700','https://picsum.photos/seed/r001-2/900/700','https://picsum.photos/seed/r001-3/900/700']),
  ('r002', 'susukino', 4000, 8000, 43.056, 141.354, '011-000-0002', 'https://maps.google.com/?q=Susukino+Sushi', 'https://example.com/reserve/r002', null, '17:30〜23:00', '不定休', false, array['https://picsum.photos/seed/r002-0/900/700','https://picsum.photos/seed/r002-1/900/700','https://picsum.photos/seed/r002-2/900/700','https://picsum.photos/seed/r002-3/900/700']),
  ('r003', 'odori-tanukikoji', 3500, 6000, 43.0575, 141.3545, '011-000-0003', 'https://maps.google.com/?q=Odori+Genghis+Khan', null, null, '16:00〜23:30', '無休', false, array['https://picsum.photos/seed/r003-0/900/700','https://picsum.photos/seed/r003-1/900/700','https://picsum.photos/seed/r003-2/900/700','https://picsum.photos/seed/r003-3/900/700']),
  ('r004', 'sapporo-station', 900, 1800, 43.0688, 141.351, null, 'https://maps.google.com/?q=Sapporo+Station+Ramen', null, null, '11:00〜22:00', '無休', false, array['https://picsum.photos/seed/r004-0/900/700','https://picsum.photos/seed/r004-1/900/700','https://picsum.photos/seed/r004-2/900/700','https://picsum.photos/seed/r004-3/900/700']),
  ('r005', 'sapporo-station', 3000, 5500, 43.069, 141.3495, '011-000-0005', 'https://maps.google.com/?q=Sapporo+Station+Izakaya', 'https://example.com/reserve/r005', null, '17:00〜翌1:00', '無休', false, array['https://picsum.photos/seed/r005-0/900/700','https://picsum.photos/seed/r005-1/900/700','https://picsum.photos/seed/r005-2/900/700','https://picsum.photos/seed/r005-3/900/700']),
  ('r006', 'nakajima-park', 2000, 4000, 43.045, 141.352, null, 'https://maps.google.com/?q=Nakajima+Park+Cafe', null, null, '9:00〜20:00', '月曜定休', false, array['https://picsum.photos/seed/r006-0/900/700','https://picsum.photos/seed/r006-1/900/700','https://picsum.photos/seed/r006-2/900/700','https://picsum.photos/seed/r006-3/900/700']),
  ('r007', 'susukino', 5000, 10000, 43.0552, 141.3528, '011-000-0007', 'https://maps.google.com/?q=Susukino+Sushi+Premium', 'https://example.com/reserve/r007', 'https://instagram.com/example_r007', '18:00〜23:00', '水曜定休', true, array['https://picsum.photos/seed/r007-0/900/700','https://picsum.photos/seed/r007-1/900/700','https://picsum.photos/seed/r007-2/900/700','https://picsum.photos/seed/r007-3/900/700']),
  ('r008', 'odori-tanukikoji', 2500, 4500, 43.0578, 141.3552, '011-000-0008', 'https://maps.google.com/?q=Tanukikoji+Ramen', null, null, '11:00〜翌2:00', '無休', false, array['https://picsum.photos/seed/r008-0/900/700','https://picsum.photos/seed/r008-1/900/700','https://picsum.photos/seed/r008-2/900/700','https://picsum.photos/seed/r008-3/900/700']),
  ('r009', 'susukino', 4000, 7000, 43.0565, 141.3548, '011-000-0009', 'https://maps.google.com/?q=Susukino+Genghis+Khan', 'https://example.com/reserve/r009', null, '17:00〜24:00', '無休', false, array['https://picsum.photos/seed/r009-0/900/700','https://picsum.photos/seed/r009-1/900/700','https://picsum.photos/seed/r009-2/900/700','https://picsum.photos/seed/r009-3/900/700']),
  ('r010', 'nakajima-park', 3000, 5000, 43.0448, 141.3535, '011-000-0010', 'https://maps.google.com/?q=Nakajima+Park+Seafood', null, null, '17:00〜23:00', '火曜定休', false, array['https://picsum.photos/seed/r010-0/900/700','https://picsum.photos/seed/r010-1/900/700','https://picsum.photos/seed/r010-2/900/700','https://picsum.photos/seed/r010-3/900/700'])
on conflict (id) do nothing;

insert into restaurant_translations (restaurant_id, locale, name, description, recommended_dish) values
  ('r001', 'ja', '海鮮炉端 なると', '北海道産の魚介と地酒を楽しめる炉端居酒屋。目の前で焼く海鮮が名物。', '帆立の浜焼き'),
  ('r001', 'en', 'Robata Seafood Naruto', 'A charcoal-grill izakaya serving Hokkaido seafood and local sake, grilled right in front of you.', 'Grilled scallops'),
  ('r001', 'zh', '海鲜炉端 Naruto', '可品尝北海道海鲜与当地清酒的炉端烧居酒屋，现场炭火烧烤。', '烤扇贝'),
  ('r001', 'ko', '카이센 로바타 나루토', '홋카이도 해산물과 지역 사케를 즐길 수 있는 화로구이 이자카야.', '가리비 구이'),

  ('r002', 'ja', '鮨処 雪月', '厳選した旬のネタを、落ち着いた個室で味わえる本格寿司店。', 'おまかせ握り'),
  ('r002', 'en', 'Sushidokoro Setsugetsu', 'Authentic sushi using carefully selected seasonal fish, served in calm private rooms.', 'Chef''s omakase'),

  ('r003', 'ja', 'ジンギスカン 羊角', '北海道名物ジンギスカンを煙にまみれず楽しめる無煙ロースター完備の店。', '特上ラム肩ロース'),
  ('r003', 'en', 'Genghis Khan Yokaku', 'Enjoy Hokkaido''s famous grilled lamb without the smoke, thanks to smokeless grills.', 'Premium lamb shoulder'),
  ('r003', 'zh', '成吉思汗 羊角', '配备无烟烤炉，可轻松享用北海道名物烤羊肉。', '特选羊肩肉'),

  ('r004', 'ja', '駅前味噌ラーメン 熊吉', '濃厚な味噌スープが人気の、駅から徒歩3分の老舗ラーメン店。', '熊吉味噌ラーメン'),
  ('r004', 'en', 'Ekimae Miso Ramen Kumakichi', 'A long-loved ramen shop 3 minutes from the station, known for its rich miso broth.', 'Kumakichi miso ramen'),

  ('r005', 'ja', '立ち呑み酒場 灯', '深夜まで営業する、旅行者にも人気の立ち呑み居酒屋。少人数でもふらっと入りやすい。', '北海道野菜の浅漬け盛り'),
  ('r005', 'en', 'Tachinomi Sakaba Akari', 'A standing-bar izakaya open late, popular with travelers who want a casual drop-in.', 'Assorted Hokkaido pickles'),

  ('r006', 'ja', '公園カフェ moriwa', '中島公園を望むテラス席が人気のカフェ。軽食メニューも充実。', '北海道バターのパンケーキ'),
  ('r006', 'en', 'Park Cafe Moriwa', 'A cafe with a popular terrace overlooking Nakajima Park, with a solid light-meal menu.', 'Hokkaido butter pancakes'),

  ('r007', 'ja', '鮨 銀鱗', '北海道近海の旬魚を握る、記念日にも選ばれる高級寿司店。', '季節の握りコース'),
  ('r007', 'en', 'Sushi Ginrin', 'An upscale sushi restaurant using seasonal fish from nearby Hokkaido waters, popular for special occasions.', 'Seasonal nigiri course'),

  ('r008', 'ja', '深夜食堂 とんこつ狸', '狸小路のすぐそばで深夜2時まで営業するとんこつラーメン店。', '焦がしねぎとんこつラーメン'),
  ('r008', 'en', 'Late-Night Diner Tonkotsu Tanuki', 'A tonkotsu ramen shop near Tanukikoji, open until 2am.', 'Burnt scallion tonkotsu ramen'),

  ('r009', 'ja', 'ジンギスカン すすきの本店', 'すすきので50年続く老舗ジンギスカン店。英語メニューあり。', '厚切りラムロース'),
  ('r009', 'en', 'Genghis Khan Susukino Honten', 'A 50-year-old Genghis Khan restaurant in Susukino, with an English menu available.', 'Thick-cut lamb loin'),

  ('r010', 'ja', '海鮮個室 なぎさ', '中島公園近くの落ち着いた個室で、道産海鮮を堪能できる。', '海鮮盛り合わせ'),
  ('r010', 'en', 'Seafood Private Rooms Nagisa', 'Enjoy Hokkaido seafood in calm private rooms near Nakajima Park.', 'Assorted sashimi platter')
on conflict (restaurant_id, locale) do nothing;

insert into restaurant_tags (restaurant_id, tag_id) values
  ('r001', 'seafood'), ('r001', 'izakaya'), ('r001', 'card-ok'), ('r001', 'english-menu'),
  ('r002', 'sushi'), ('r002', 'private-room'), ('r002', 'card-ok'),
  ('r003', 'genghis-khan'), ('r003', 'card-ok'), ('r003', 'english-menu'), ('r003', 'solo-friendly'),
  ('r004', 'ramen'), ('r004', 'solo-friendly'), ('r004', 'card-ok'),
  ('r005', 'izakaya'), ('r005', 'late-night'), ('r005', 'english-menu'), ('r005', 'card-ok'),
  ('r006', 'solo-friendly'), ('r006', 'english-menu'),
  ('r007', 'sushi'), ('r007', 'seafood'), ('r007', 'private-room'), ('r007', 'card-ok'),
  ('r008', 'ramen'), ('r008', 'late-night'), ('r008', 'solo-friendly'),
  ('r009', 'genghis-khan'), ('r009', 'izakaya'), ('r009', 'english-menu'), ('r009', 'card-ok'),
  ('r010', 'seafood'), ('r010', 'private-room')
on conflict (restaurant_id, tag_id) do nothing;

insert into hotel_restaurants (hotel_id, restaurant_id, distance_m, walking_minutes, display_priority, is_visible) values
  ('hotel_a', 'r001', 1440, 18, 0, true),
  ('hotel_a', 'r002', 1425, 18, 1, true),
  ('hotel_a', 'r003', 1270, 16, 2, true),
  ('hotel_a', 'r004', 28, 1, 3, true),
  ('hotel_a', 'r005', 115, 1, 4, true),
  ('hotel_a', 'r006', 2626, 33, 5, true),
  ('hotel_a', 'r007', 1499, 19, 6, true),
  ('hotel_a', 'r008', 1253, 16, 7, true),
  ('hotel_a', 'r009', 1384, 17, 8, true),
  ('hotel_a', 'r010', 2656, 33, 9, true),
  ('hotel_b', 'r001', 60, 1, 1, true),
  ('hotel_b', 'r002', 105, 1, 2, true),
  ('hotel_b', 'r003', 263, 3, 3, true),
  ('hotel_b', 'r004', 1499, 19, 4, true),
  ('hotel_b', 'r005', 1539, 19, 5, true),
  ('hotel_b', 'r006', 1159, 14, 6, true),
  ('hotel_b', 'r007', 28, 1, 7, true),
  ('hotel_b', 'r008', 321, 4, 8, true),
  ('hotel_b', 'r009', 191, 2, 9, true),
  ('hotel_b', 'r010', 1179, 15, 0, true)
on conflict (hotel_id, restaurant_id) do nothing;
