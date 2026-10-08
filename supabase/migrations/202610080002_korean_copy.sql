-- Rewrite the Korean (ko) copy for areas, tags and the bundled sample
-- restaurants so it reads like natural Korean rather than a literal
-- translation of the Japanese.
--
-- Scope: touches ONLY the `ko` key of areas.name / tags.name, and the
-- `ko` rows of restaurant_translations for the sample restaurants r001–r010.
-- Rows are only written when the target area / tag / restaurant already
-- exists, so restaurants added through the admin panel (UUID ids) are never
-- touched. No schema, RLS policy, events table or RPC is changed.
--
-- Opening hours / closed days need no data change: the app now converts the
-- Japanese strings to each language's AM/PM format at display time
-- (lib/hoursDisplay.ts).
--
-- Apply in the Supabase SQL Editor. Safe to re-run.

-- Areas ---------------------------------------------------------------------
update areas set name = jsonb_set(name, '{ko}', to_jsonb(v.ko))
from (values
  ('sapporo-station',  '삿포로역'),
  ('odori-tanukikoji', '오도리·다누키코지'),
  ('susukino',         '스스키노'),
  ('nakajima-park',    '나카지마 공원')
) as v(id, ko)
where areas.id = v.id;

-- Tags ----------------------------------------------------------------------
update tags set name = jsonb_set(name, '{ko}', to_jsonb(v.ko))
from (values
  ('seafood',       '해산물'),
  ('sushi',         '스시'),
  ('genghis-khan',  '징기스칸(양고기 구이)'),
  ('ramen',         '라멘'),
  ('izakaya',       '이자카야'),
  ('private-room',  '룸 완비'),
  ('late-night',    '심야 영업'),
  ('card-ok',       '카드 결제 가능'),
  ('english-menu',  '영어 메뉴판'),
  ('solo-friendly', '혼밥 환영')
) as v(id, ko)
where tags.id = v.id;

-- Sample restaurants ------------------------------------------------------
insert into restaurant_translations (restaurant_id, locale, name, description, recommended_dish)
select v.restaurant_id, 'ko', v.name, v.description, v.recommended_dish
from (values
  ('r001', '해산물 로바타 나루토',
   '홋카이도산 해산물과 현지 사케를 함께 즐길 수 있는 로바타야키 이자카야. 눈앞에서 바로 구워 주는 해산물이 이 집의 명물입니다.',
   '가리비 껍질구이'),
  ('r002', '스시도코로 세츠게츠',
   '엄선한 제철 생선을 조용한 개별 룸에서 즐길 수 있는 정통 스시 전문점입니다.',
   '오마카세 니기리'),
  ('r003', '징기스칸 요카쿠',
   '무연 로스터를 갖추고 있어 옷에 냄새 걱정 없이 홋카이도 명물 징기스칸을 즐길 수 있습니다.',
   '특상 양 어깨 등심'),
  ('r004', '에키마에 미소라멘 구마키치',
   '삿포로역에서 걸어서 3분. 진한 미소 국물로 오랫동안 사랑받아 온 라멘 노포입니다.',
   '구마키치 미소라멘'),
  ('r005', '다치노미 사카바 아카리',
   '늦은 밤까지 문을 여는 서서 마시는 이자카야. 여행객에게도 인기가 많고, 혼자서도 부담 없이 들르기 좋습니다.',
   '홋카이도 채소 절임 모둠'),
  ('r006', '공원 카페 모리와',
   '나카지마 공원이 내려다보이는 테라스석이 인기인 카페. 가벼운 식사 메뉴도 알차게 갖추고 있습니다.',
   '홋카이도 버터 팬케이크'),
  ('r007', '스시 긴린',
   '홋카이도 근해에서 잡은 제철 생선으로 쥐어 내는 고급 스시집. 기념일 식사 장소로도 사랑받고 있습니다.',
   '제철 니기리 코스'),
  ('r008', '심야식당 돈코츠 다누키',
   '다누키코지 바로 옆, 새벽 2시까지 문을 여는 돈코츠 라멘집입니다.',
   '구운 파 돈코츠 라멘'),
  ('r009', '징기스칸 스스키노 본점',
   '스스키노에서 50년째 자리를 지켜 온 징기스칸 노포. 영어 메뉴판도 준비되어 있습니다.',
   '두툼하게 썬 양 등심'),
  ('r010', '해산물 룸 식당 나기사',
   '나카지마 공원 근처의 조용한 개별 룸에서 홋카이도 해산물을 마음껏 즐길 수 있습니다.',
   '모둠 사시미')
) as v(restaurant_id, name, description, recommended_dish)
where exists (select 1 from restaurants r where r.id = v.restaurant_id)
on conflict (restaurant_id, locale) do update
  set name = excluded.name,
      description = excluded.description,
      recommended_dish = excluded.recommended_dish;
