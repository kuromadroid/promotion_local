-- Session-based sales analytics. Safe to apply to an existing Sapporo Bites database.

alter table public.events add column if not exists session_id text;

drop index if exists public.idx_events_dedup;
create index if not exists idx_events_occurred_at on public.events (occurred_at desc);
create index if not exists idx_events_session_time on public.events (session_id, occurred_at desc);
create index if not exists idx_events_restaurant_event_time
  on public.events (restaurant_id, event_name, occurred_at desc);
create index if not exists idx_events_hotel_event_time
  on public.events (hotel_id, event_name, occurred_at desc);
create index if not exists idx_events_ip_time on public.events (ip_hash, occurred_at desc);

create or replace function public.admin_analytics_overview(
  p_start timestamptz default null,
  p_end timestamptz default null
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
    count(distinct hr.hotel_id) filter (where hr.is_visible) as listing_hotels
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
  p_end timestamptz default null
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

revoke all on function public.admin_analytics_overview(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.admin_restaurant_analytics(text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_analytics_overview(timestamptz, timestamptz) to service_role;
grant execute on function public.admin_restaurant_analytics(text, timestamptz, timestamptz) to service_role;
