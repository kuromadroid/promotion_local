-- Admin login hardening (lib/adminAuth.ts).
--
-- Scope:
--   * Adds `admin_sessions`: one row per logged-in admin browser. The cookie
--     holds a random token; only its SHA-256 is stored here. Logout deletes
--     the row, so a copied cookie stops working.
--   * Adds `admin_login_attempts`: failed logins per IP, used to block
--     password guessing (5 failures per IP / 30 failures overall in 10 min).
--   * Both tables have RLS on and NO policies: only the server (service role
--     key) can read or write them. No existing table changes.
--
-- Apply this BEFORE deploying the app version that uses these tables: that
-- version cannot log anyone in until they exist. Existing admin cookies stop
-- working after the deploy, so the admin logs in once again.
--
-- Apply in the Supabase SQL Editor. Safe to re-run.

create table if not exists admin_sessions (
  token_hash text primary key,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists admin_sessions_expires_at_idx on admin_sessions (expires_at);

alter table admin_sessions enable row level security;

create table if not exists admin_login_attempts (
  id bigserial primary key,
  ip text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_ip_time_idx on admin_login_attempts (ip, attempted_at);
create index if not exists admin_login_attempts_time_idx on admin_login_attempts (attempted_at);

alter table admin_login_attempts enable row level security;
