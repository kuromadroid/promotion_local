-- Demo hotels (営業用デモホテル): keep their traffic out of the real analytics,
-- but still viewable on their own for sales outreach. Safe to apply to an
-- existing Sapporo Bites database and safe to re-run.
--
-- Scope:
--   * hotels: adds `is_demo boolean not null default false`, and flags the demo
--     hotel "Sapporo Hotel" (hotel-d76a4d81). No other hotel data changes.
--   * Adds the helper public.analytics_hotel_in_scope(hotel_id, scope).
--   * Recreates the three admin analytics RPCs with one extra trailing
--     parameter, p_hotel_scope ('live' default | 'demo'):
--       'live' — everything EXCEPT events from demo hotels (events with no
--                hotel stay here, as before)
--       'demo' — ONLY events from demo hotels
--     The function bodies are otherwise identical to 202608260001 /
--     202610080001. Because the new parameter has a default, the currently
--     deployed app (which doesn't send it) keeps working — but it will start
--     excluding the demo hotel immediately.
--   * events, its indexes, RLS policies and the retention job are untouched.
--
-- Apply this BEFORE deploying the app version that sends p_hotel_scope.

alter table public.hotels add column if not exists is_demo boolean not null default false;

update public.hotels set is_demo = true where id = 'hotel-d76a4d81';

create or replace function public.analytics_hotel_in_scope(p_hotel_id text, p_scope text)
returns boolean
language sql
stable
set search_path = public
as $$
  select case
    when p_scope = 'demo' then exists (select 1 from hotels where id = p_hotel_id and is_demo)
    else not exists (select 1 from hotels where id = p_hotel_id and is_demo)
  end
$$;

-- The old signatures have to go first: adding a defaulted parameter via
-- `create or replace` would leave an ambiguous overload behind.
drop function if exists public.admin_analytics_overview(timestamptz, timestamptz);
drop function if exists public.admin_restaurant_analytics(text, timestamptz, timestamptz);
drop function if exists public.admin_language_analytics(timestamptz, timestamptz, text);

create or replace function public.admin_analytics_overview(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_hotel_scope text default 'live'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with filtered as materialized (
  select event_name, hotel_id, restaurant_id, session_id, ip_hash, occurred_at
  from events
  where (p_start is null or occurred_at >= p_start)
    and (p_end is null or occurred_at < p_end)
    and public.analytics_hotel_in_scope(hotel_id, p_hotel_scope)
),
summary as (
  select
    count(distinct session_id) filter (where session_id is not null) as site_sessions,
    count(*) filter (where event_name = 'restaurant_detail_view') as view_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'restaurant_detail_view'
    ) as view_sessions,
    count(*) filter (where event_name = 'map_click') as map_events,
    count(distinct session_id) filter (where session_id is not null and event_name = 'map_click') as map_sessions,
    count(*) filter (where event_name = 'reservation_click') as reservation_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'reservation_click'
    ) as reservation_sessions,
    count(*) filter (where event_name = 'phone_click') as phone_events,
    count(distinct session_id) filter (where session_id is not null and event_name = 'phone_click') as phone_sessions,
    count(*) filter (where event_name = 'instagram_click') as instagram_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'instagram_click'
    ) as instagram_sessions,
    count(*) filter (where event_name in ('map_click', 'reservation_click', 'phone_click')) as high_intent_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name in ('map_click', 'reservation_click', 'phone_click')
    ) as high_intent_sessions
  from filtered
),
restaurant_base as (
  select
    r.id,
    coalesce(max(rt.name) filter (where rt.locale = 'ja'), max(rt.name) filter (where rt.locale = 'en'), r.id) as name,
    count(distinct hr.hotel_id) filter (
      where hr.is_visible and public.analytics_hotel_in_scope(hr.hotel_id, p_hotel_scope)
    ) as listing_hotels
  from restaurants r
  left join restaurant_translations rt on rt.restaurant_id = r.id
  left join hotel_restaurants hr on hr.restaurant_id = r.id
  group by r.id
),
restaurant_metrics as (
  select
    restaurant_id,
    count(*) filter (where event_name = 'restaurant_detail_view') as view_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'restaurant_detail_view'
    ) as view_sessions,
    count(*) filter (where event_name = 'map_click') as map_events,
    count(distinct session_id) filter (where session_id is not null and event_name = 'map_click') as map_sessions,
    count(*) filter (where event_name = 'reservation_click') as reservation_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'reservation_click'
    ) as reservation_sessions,
    count(*) filter (where event_name = 'phone_click') as phone_events,
    count(distinct session_id) filter (where session_id is not null and event_name = 'phone_click') as phone_sessions,
    count(*) filter (where event_name = 'instagram_click') as instagram_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'instagram_click'
    ) as instagram_sessions,
    count(*) filter (where event_name in ('map_click', 'reservation_click', 'phone_click')) as high_intent_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name in ('map_click', 'reservation_click', 'phone_click')
    ) as high_intent_sessions
  from filtered
  where restaurant_id is not null
  group by restaurant_id
),
restaurant_rows as (
  select
    b.*,
    coalesce(m.view_events, 0) as view_events,
    coalesce(m.view_sessions, 0) as view_sessions,
    coalesce(m.map_events, 0) as map_events,
    coalesce(m.map_sessions, 0) as map_sessions,
    coalesce(m.reservation_events, 0) as reservation_events,
    coalesce(m.reservation_sessions, 0) as reservation_sessions,
    coalesce(m.phone_events, 0) as phone_events,
    coalesce(m.phone_sessions, 0) as phone_sessions,
    coalesce(m.instagram_events, 0) as instagram_events,
    coalesce(m.instagram_sessions, 0) as instagram_sessions,
    coalesce(m.high_intent_events, 0) as high_intent_events,
    coalesce(m.high_intent_sessions, 0) as high_intent_sessions
  from restaurant_base b
  left join restaurant_metrics m on m.restaurant_id = b.id
),
hotel_metrics as (
  select
    h.id,
    h.name,
    count(distinct f.session_id) filter (where f.session_id is not null) as site_sessions,
    count(distinct f.session_id) filter (
      where f.session_id is not null and f.event_name = 'restaurant_detail_view'
    ) as view_sessions,
    count(distinct f.session_id) filter (where f.session_id is not null and f.event_name = 'map_click') as map_sessions,
    count(distinct f.session_id) filter (
      where f.session_id is not null and f.event_name = 'reservation_click'
    ) as reservation_sessions,
    count(distinct f.session_id) filter (where f.session_id is not null and f.event_name = 'phone_click') as phone_sessions,
    count(distinct f.session_id) filter (
      where f.session_id is not null and f.event_name in ('map_click', 'reservation_click', 'phone_click')
    ) as high_intent_sessions
  from hotels h
  left join filtered f on f.hotel_id = h.id
  where public.analytics_hotel_in_scope(h.id, p_hotel_scope)
  group by h.id, h.name
)
select jsonb_build_object(
  'summary', (
    select jsonb_build_object(
      'siteSessions', site_sessions,
      'viewEvents', view_events,
      'viewSessions', view_sessions,
      'mapEvents', map_events,
      'mapSessions', map_sessions,
      'reservationEvents', reservation_events,
      'reservationSessions', reservation_sessions,
      'phoneEvents', phone_events,
      'phoneSessions', phone_sessions,
      'instagramEvents', instagram_events,
      'instagramSessions', instagram_sessions,
      'highIntentEvents', high_intent_events,
      'highIntentSessions', high_intent_sessions
    )
    from summary
  ),
  'restaurants', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id,
      'name', name,
      'listingHotels', listing_hotels,
      'viewEvents', view_events,
      'viewSessions', view_sessions,
      'mapEvents', map_events,
      'mapSessions', map_sessions,
      'reservationEvents', reservation_events,
      'reservationSessions', reservation_sessions,
      'phoneEvents', phone_events,
      'phoneSessions', phone_sessions,
      'instagramEvents', instagram_events,
      'instagramSessions', instagram_sessions,
      'highIntentEvents', high_intent_events,
      'highIntentSessions', high_intent_sessions
    ) order by high_intent_sessions desc, view_sessions desc, name)
    from restaurant_rows
  ), '[]'::jsonb),
  'hotels', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id,
      'name', name,
      'siteSessions', site_sessions,
      'viewSessions', view_sessions,
      'mapSessions', map_sessions,
      'reservationSessions', reservation_sessions,
      'phoneSessions', phone_sessions,
      'highIntentSessions', high_intent_sessions
    ) order by high_intent_sessions desc, site_sessions desc, name)
    from hotel_metrics
  ), '[]'::jsonb)
);
$$;

create or replace function public.admin_restaurant_analytics(
  p_restaurant_id text,
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_hotel_scope text default 'live'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with restaurant_info as (
  select
    r.id,
    coalesce(max(rt.name) filter (where rt.locale = 'ja'), max(rt.name) filter (where rt.locale = 'en'), r.id) as name
  from restaurants r
  left join restaurant_translations rt on rt.restaurant_id = r.id
  where r.id = p_restaurant_id
  group by r.id
),
filtered as materialized (
  select event_name, hotel_id, session_id, ip_hash, occurred_at
  from events
  where restaurant_id = p_restaurant_id
    and (p_start is null or occurred_at >= p_start)
    and (p_end is null or occurred_at < p_end)
    and public.analytics_hotel_in_scope(hotel_id, p_hotel_scope)
),
metrics as (
  select
    count(*) filter (where event_name = 'restaurant_detail_view') as view_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'restaurant_detail_view'
    ) as view_sessions,
    count(*) filter (where event_name = 'map_click') as map_events,
    count(distinct session_id) filter (where session_id is not null and event_name = 'map_click') as map_sessions,
    count(*) filter (where event_name = 'reservation_click') as reservation_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'reservation_click'
    ) as reservation_sessions,
    count(*) filter (where event_name = 'phone_click') as phone_events,
    count(distinct session_id) filter (where session_id is not null and event_name = 'phone_click') as phone_sessions,
    count(*) filter (where event_name = 'instagram_click') as instagram_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'instagram_click'
    ) as instagram_sessions,
    count(*) filter (where event_name in ('map_click', 'reservation_click', 'phone_click')) as high_intent_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name in ('map_click', 'reservation_click', 'phone_click')
    ) as high_intent_sessions,
    count(*) as total_events,
    count(distinct session_id) filter (where session_id is not null) as unique_sessions,
    count(distinct ip_hash) filter (where ip_hash is not null) as unique_ips
  from filtered
),
listing_hotels as (
  select h.id, h.name
  from hotel_restaurants hr
  join hotels h on h.id = hr.hotel_id
  where hr.restaurant_id = p_restaurant_id and hr.is_visible
    and public.analytics_hotel_in_scope(h.id, p_hotel_scope)
  order by h.name
),
hotel_base as (
  select id, name from listing_hotels
  union
  select h.id, h.name
  from filtered f
  join hotels h on h.id = f.hotel_id
  union
  select 'unknown', '不明'
  where exists (select 1 from filtered where hotel_id is null)
),
hotel_rows as (
  select
    h.id,
    h.name,
    count(distinct f.session_id) filter (
      where f.session_id is not null and f.event_name = 'restaurant_detail_view'
    ) as view_sessions,
    count(distinct f.session_id) filter (where f.session_id is not null and f.event_name = 'map_click') as map_sessions,
    count(distinct f.session_id) filter (
      where f.session_id is not null and f.event_name = 'reservation_click'
    ) as reservation_sessions,
    count(distinct f.session_id) filter (where f.session_id is not null and f.event_name = 'phone_click') as phone_sessions,
    count(distinct f.session_id) filter (
      where f.session_id is not null and f.event_name in ('map_click', 'reservation_click', 'phone_click')
    ) as high_intent_sessions
  from hotel_base h
  left join filtered f on f.hotel_id = h.id or (h.id = 'unknown' and f.hotel_id is null)
  group by h.id, h.name
),
daily as (
  select
    (occurred_at at time zone 'Asia/Tokyo')::date as day,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'restaurant_detail_view'
    ) as view_sessions,
    count(distinct session_id) filter (where session_id is not null and event_name = 'map_click') as map_sessions,
    count(distinct session_id) filter (
      where session_id is not null and event_name = 'reservation_click'
    ) as reservation_sessions,
    count(distinct session_id) filter (
      where session_id is not null and event_name in ('map_click', 'reservation_click', 'phone_click')
    ) as high_intent_sessions
  from filtered
  group by (occurred_at at time zone 'Asia/Tokyo')::date
  order by day
),
network_rows as (
  select left(ip_hash, 12) as network, count(*) as events
  from filtered
  where ip_hash is not null
  group by ip_hash
  order by events desc
  limit 8
),
anomalies as (
  select kind, identifier, minute, events
  from (
    select
      'session'::text as kind,
      left(session_id, 12) as identifier,
      date_trunc('minute', occurred_at) as minute,
      count(*) as events
    from filtered
    where session_id is not null
      and event_name in ('map_click', 'reservation_click', 'phone_click', 'instagram_click')
    group by session_id, date_trunc('minute', occurred_at)
    having count(*) >= 20
    union all
    select
      'network'::text as kind,
      left(ip_hash, 12) as identifier,
      date_trunc('minute', occurred_at) as minute,
      count(*) as events
    from filtered
    where ip_hash is not null
      and event_name in ('map_click', 'reservation_click', 'phone_click', 'instagram_click')
    group by ip_hash, date_trunc('minute', occurred_at)
    having count(*) >= 20
  ) suspicious
  order by events desc, minute desc
  limit 10
)
select jsonb_build_object(
  'restaurant', coalesce((select to_jsonb(restaurant_info) from restaurant_info), '{}'::jsonb),
  'metrics', (
    select jsonb_build_object(
      'viewEvents', view_events,
      'viewSessions', view_sessions,
      'mapEvents', map_events,
      'mapSessions', map_sessions,
      'reservationEvents', reservation_events,
      'reservationSessions', reservation_sessions,
      'phoneEvents', phone_events,
      'phoneSessions', phone_sessions,
      'instagramEvents', instagram_events,
      'instagramSessions', instagram_sessions,
      'highIntentEvents', high_intent_events,
      'highIntentSessions', high_intent_sessions
    ) from metrics
  ),
  'listingHotels', coalesce((
    select jsonb_agg(jsonb_build_object('id', id, 'name', name) order by name) from listing_hotels
  ), '[]'::jsonb),
  'hotelBreakdown', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id,
      'name', name,
      'viewSessions', view_sessions,
      'mapSessions', map_sessions,
      'reservationSessions', reservation_sessions,
      'phoneSessions', phone_sessions,
      'highIntentSessions', high_intent_sessions
    ) order by high_intent_sessions desc, name) from hotel_rows
  ), '[]'::jsonb),
  'daily', coalesce((
    select jsonb_agg(jsonb_build_object(
      'day', day,
      'viewSessions', view_sessions,
      'mapSessions', map_sessions,
      'reservationSessions', reservation_sessions,
      'highIntentSessions', high_intent_sessions
    ) order by day) from daily
  ), '[]'::jsonb),
  'quality', (
    select jsonb_build_object(
      'totalEvents', total_events,
      'uniqueSessions', unique_sessions,
      'uniqueNetworks', unique_ips,
      'sessionsPerNetwork', case when unique_ips = 0 then null else round(unique_sessions::numeric / unique_ips, 2) end,
      'eventsPerNetwork', case when unique_ips = 0 then null else round(total_events::numeric / unique_ips, 2) end,
      'networkConcentration', coalesce((
        select jsonb_agg(jsonb_build_object('network', network, 'events', events) order by events desc)
        from network_rows
      ), '[]'::jsonb),
      'anomalies', coalesce((
        select jsonb_agg(jsonb_build_object(
          'kind', kind,
          'identifier', identifier,
          'minute', to_char(minute at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') || ' JST',
          'events', events
        ) order by events desc, minute desc) from anomalies
      ), '[]'::jsonb)
    ) from metrics
  )
);
$$;

create or replace function public.admin_language_analytics(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_language text default null,
  p_hotel_scope text default 'live'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with filtered as materialized (
  select event_name, restaurant_id, area_id, tag_id, language, session_id, occurred_at
  from events
  where (p_start is null or occurred_at >= p_start)
    and (p_end is null or occurred_at < p_end)
    and public.analytics_hotel_in_scope(hotel_id, p_hotel_scope)
),
-- Forward-fill: each language-bearing row starts a new group; every row in the
-- group inherits that row's language.
grouped as (
  select
    f.*,
    count(language) over (
      partition by session_id
      order by occurred_at
      rows between unbounded preceding and current row
    ) as lang_grp
  from filtered f
),
filled as (
  select
    g.*,
    max(language) over (partition by session_id, lang_grp) as carried_language
  from grouped g
),
session_first_language as (
  select distinct on (session_id) session_id, language
  from filtered
  where session_id is not null and language is not null
  order by session_id, occurred_at
),
attributed as materialized (
  select
    f.event_name,
    f.restaurant_id,
    f.area_id,
    f.tag_id,
    f.session_id,
    f.language is null as inferred,
    coalesce(
      f.language,
      case when f.session_id is not null then f.carried_language end,
      s.language,
      'unknown'
    ) as lang
  from filled f
  left join session_first_language s on s.session_id = f.session_id
),
language_event_rows as (
  select
    lang,
    event_name,
    count(*) as events,
    count(distinct session_id) filter (where session_id is not null) as sessions
  from attributed
  group by lang, event_name
),
language_totals as (
  select
    lang,
    count(*) as total_events,
    count(*) filter (where inferred) as inferred_events,
    count(distinct session_id) filter (where session_id is not null) as site_sessions,
    count(*) filter (where event_name in ('map_click', 'reservation_click', 'phone_click')) as high_intent_events,
    count(distinct session_id) filter (
      where session_id is not null and event_name in ('map_click', 'reservation_click', 'phone_click')
    ) as high_intent_sessions
  from attributed
  group by lang
),
selected as (
  select * from attributed where p_language is not null and lang = p_language
),
restaurant_names as (
  select
    r.id,
    coalesce(max(rt.name) filter (where rt.locale = 'ja'), max(rt.name) filter (where rt.locale = 'en'), r.id) as name
  from restaurants r
  left join restaurant_translations rt on rt.restaurant_id = r.id
  group by r.id
),
restaurant_event_rows as (
  select
    s.restaurant_id,
    coalesce(n.name, s.restaurant_id) as name,
    s.event_name,
    count(*) as events,
    count(distinct s.session_id) filter (where s.session_id is not null) as sessions
  from selected s
  left join restaurant_names n on n.id = s.restaurant_id
  where s.restaurant_id is not null
  group by s.restaurant_id, n.name, s.event_name
),
restaurant_high_intent as (
  select
    restaurant_id,
    count(*) as events,
    count(distinct session_id) filter (where session_id is not null) as sessions
  from selected
  where restaurant_id is not null
    and event_name in ('map_click', 'reservation_click', 'phone_click')
  group by restaurant_id
),
filter_rows as (
  select
    'area'::text as kind,
    s.area_id as id,
    coalesce(a.name ->> 'ja', s.area_id) as name,
    count(*) as events,
    count(distinct s.session_id) filter (where s.session_id is not null) as sessions
  from selected s
  left join areas a on a.id = s.area_id
  where s.event_name = 'area_filter' and s.area_id is not null
  group by s.area_id, a.name
  union all
  select
    'tag'::text as kind,
    s.tag_id as id,
    coalesce(t.name ->> 'ja', s.tag_id) as name,
    count(*) as events,
    count(distinct s.session_id) filter (where s.session_id is not null) as sessions
  from selected s
  left join tags t on t.id = s.tag_id
  where s.event_name = 'tag_filter' and s.tag_id is not null
  group by s.tag_id, t.name
)
select jsonb_build_object(
  'languages', coalesce((
    select jsonb_agg(jsonb_build_object(
      'language', t.lang,
      'totalEvents', t.total_events,
      'inferredEvents', t.inferred_events,
      'siteSessions', t.site_sessions,
      'highIntentEvents', t.high_intent_events,
      'highIntentSessions', t.high_intent_sessions,
      'byEvent', coalesce((
        select jsonb_object_agg(e.event_name, jsonb_build_object('events', e.events, 'sessions', e.sessions))
        from language_event_rows e
        where e.lang = t.lang
      ), '{}'::jsonb)
    ) order by t.site_sessions desc, t.lang)
    from language_totals t
  ), '[]'::jsonb),
  'restaurants', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.restaurant_id,
      'name', r.name,
      'highIntentEvents', coalesce(h.events, 0),
      'highIntentSessions', coalesce(h.sessions, 0),
      'byEvent', r.by_event
    ) order by coalesce(h.sessions, 0) desc, r.name)
    from (
      select
        restaurant_id,
        name,
        jsonb_object_agg(event_name, jsonb_build_object('events', events, 'sessions', sessions)) as by_event
      from restaurant_event_rows
      group by restaurant_id, name
    ) r
    left join restaurant_high_intent h on h.restaurant_id = r.restaurant_id
  ), '[]'::jsonb),
  'filters', coalesce((
    select jsonb_agg(jsonb_build_object(
      'kind', kind,
      'id', id,
      'name', name,
      'events', events,
      'sessions', sessions
    ) order by kind, sessions desc, events desc, name)
    from filter_rows
  ), '[]'::jsonb)
);
$$;

revoke all on function public.analytics_hotel_in_scope(text, text) from public, anon, authenticated;
revoke all on function public.admin_analytics_overview(timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function public.admin_restaurant_analytics(text, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function public.admin_language_analytics(timestamptz, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.analytics_hotel_in_scope(text, text) to service_role;
grant execute on function public.admin_analytics_overview(timestamptz, timestamptz, text) to service_role;
grant execute on function public.admin_restaurant_analytics(text, timestamptz, timestamptz, text) to service_role;
grant execute on function public.admin_language_analytics(timestamptz, timestamptz, text, text) to service_role;
