-- Analytics retention: keep only the last 180 days of rows in public.events.
--
-- Scope: this migration touches ONLY the `events` table. It does not read,
-- alter, or delete restaurants / hotels / hotel_restaurants / tags / areas /
-- restaurant_translations / restaurant_tags or any other business data.
--
-- It does NOT change the events schema, the /api/track path, the ip_hash
-- mechanism, or the admin analytics RPCs (admin_analytics_overview /
-- admin_restaurant_analytics). Those keep working unchanged; periods older
-- than 180 days simply return fewer / no rows, which is the intended effect.
--
-- Apply in the Supabase SQL Editor AFTER enabling the pg_cron extension in the
-- dashboard (Database → Extensions → pg_cron). Safe to re-run.

-- ------------------------------------------------------------------
-- 1. Retention window (single source of truth)
-- ------------------------------------------------------------------
-- Kept as a plain constant inside the function below. To change the window,
-- edit the interval in public.purge_old_events() and re-run this file.

-- ------------------------------------------------------------------
-- 2. Purge function — deletes events older than 180 days
-- ------------------------------------------------------------------
-- SECURITY DEFINER so the scheduled job runs with the function owner's rights
-- (the migration runner, i.e. `postgres`, which owns `events`). Locked down so
-- anon / authenticated / the anon-key client can never call it.
create or replace function public.purge_old_events()
returns integer
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  deleted_count integer;
begin
  delete from public.events
  where occurred_at < now() - interval '180 days';

  get diagnostics deleted_count = row_count;
  raise notice 'purge_old_events: deleted % row(s) older than 180 days', deleted_count;
  return deleted_count;
end;
$$;

comment on function public.purge_old_events() is
  'Deletes public.events rows whose occurred_at is older than 180 days. Run daily by the pg_cron job "purge-old-events". Touches no other table.';

revoke all on function public.purge_old_events() from public, anon, authenticated;
grant execute on function public.purge_old_events() to postgres, service_role;

-- ------------------------------------------------------------------
-- 3. Schedule it daily via pg_cron
-- ------------------------------------------------------------------
-- Requires the pg_cron extension (enable it once in the Supabase dashboard:
-- Database → Extensions → pg_cron). This line is a best-effort no-op if it is
-- already enabled; if it errors with "permission denied to create extension",
-- enable pg_cron from the dashboard and re-run this file.
create extension if not exists pg_cron;

-- Runs every day at 03:17 UTC (12:17 JST) — off-peak, low volume.
-- cron.schedule() upserts by job name, so re-running this file just updates
-- the existing schedule instead of creating duplicates.
select cron.schedule(
  'purge-old-events',
  '17 3 * * *',
  $$ select public.purge_old_events(); $$
);

-- ------------------------------------------------------------------
-- 4. Verification helpers (read-only — run these manually, they change nothing)
-- ------------------------------------------------------------------
-- How many rows the next run WOULD delete (dry run):
--   select count(*) as would_delete
--   from public.events
--   where occurred_at < now() - interval '180 days';
--
-- Confirm the job is registered and active:
--   select jobid, jobname, schedule, active, command
--   from cron.job where jobname = 'purge-old-events';
--
-- Inspect recent runs (after the job has fired at least once):
--   select status, return_message, start_time, end_time
--   from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'purge-old-events')
--   order by start_time desc limit 10;
--
-- One-off manual purge (optional — e.g. to clear a large first backlog now
-- instead of waiting for 03:17 UTC):
--   select public.purge_old_events();
