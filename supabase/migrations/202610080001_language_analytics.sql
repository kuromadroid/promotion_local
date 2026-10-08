-- Language-based analytics (言語別アクセス状況). Safe to apply to an existing
-- Sapporo Bites database and safe to re-run.
--
-- Scope: adds ONE read-only RPC, public.admin_language_analytics(). It does not
-- alter the events schema, add tables or indexes, or touch the existing RPCs
-- (admin_analytics_overview / admin_restaurant_analytics) or the retention job.
--
-- Cost notes:
--   * No new table, column or index — storage is unchanged. `events.language`
--     already exists; the app now simply fills it on more events.
--   * The function is only executed when an admin opens the language pages.
--     It scans the same period range the overview already scans (via
--     idx_events_occurred_at) and returns a small aggregated JSON, so egress
--     stays a few KB per page view.
--
-- Attribution: rows written before the client started sending `language` on
-- every event have language = NULL. For those, the language is inferred from
-- the same session: the most recent earlier event in that session that carries
-- a language (page_view / restaurant_detail_view / language_select), or, if the
-- event happened before any of those, the session's first known language.
-- Rows with neither are reported as 'unknown'.

create or replace function public.admin_language_analytics(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_language text default null
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

revoke all on function public.admin_language_analytics(timestamptz, timestamptz, text) from public, anon, authenticated;
grant execute on function public.admin_language_analytics(timestamptz, timestamptz, text) to service_role;
