-- Add restaurants.official_url — an optional link to the restaurant's own
-- official website.
--
-- Scope: this migration touches ONLY the `restaurants` table, adding one
-- nullable text column. It does not read, alter, or delete any existing data,
-- and it does not change RLS policies, the analytics events table, or any RPC.
--
-- The column is surfaced in two places in the app:
--   * admin panel  — a "公式サイトのURL" field on the restaurant create/edit form
--   * public detail — a "公式サイトを見る" button shown under the 店舗情報 section
--
-- Apply in the Supabase SQL Editor. Safe to re-run.

alter table restaurants add column if not exists official_url text;
