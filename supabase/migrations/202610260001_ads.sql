-- Ad slots mixed into the restaurant list on hotel top pages.
--
-- Shown only to guests viewing in a language other than Japanese, on the
-- "一覧" (all restaurants) list of every hotel. Each ad looks like a
-- restaurant card with an "AD" label and opens `link_url` in a new tab.
-- Managed from the admin screen (/admin/ads); images go to the existing
-- `restaurant-photos` storage bucket under ads/.
--
-- Scope: adds the `ads` table and a public read policy for active ads only.
-- No existing table, policy, events table or RPC is changed.
--
-- Safe to apply before or after the app deploy (the app shows no ads until
-- this table exists). Apply in the Supabase SQL Editor. Safe to re-run.

create table if not exists ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  link_url text not null,
  -- Shown after this many restaurants in the list (0 = at the top).
  position integer not null default 3 check (position >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table ads enable row level security;

drop policy if exists "Public read active ads" on ads;
create policy "Public read active ads" on ads for select using (is_active);
