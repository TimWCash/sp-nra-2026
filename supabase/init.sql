-- ─────────────────────────────────────────────────────────────────────────
-- sp-nra-2026 schema bootstrap
--
-- Paste this into the SQL editor of a fresh Supabase project, hit Run.
-- It's idempotent — safe to re-run if anything fails partway through.
--
-- After running:
--   1. Get the project's URL + anon key from Settings → API
--   2. Update Vercel env vars NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
--   3. Trigger a redeploy
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;  -- for gen_random_uuid()

-- ── Leads ────────────────────────────────────────────────────────────────
create table if not exists public.nra_leads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  company      text default '',
  role         text default '',
  contact      text default '',
  notes        text default '',
  heat         text default 'warm',  -- 'hot' | 'warm' | 'cool'
  badge_photo  text default '',      -- base64 data URL
  captured_by  text default '',
  follow_up    boolean default false,
  created_at   timestamptz default now()
);

-- ── Session notes (per-session team annotations) ─────────────────────────
create table if not exists public.session_notes (
  id            uuid primary key default gen_random_uuid(),
  session_title text not null,
  session_day   text not null,
  author        text not null,
  content       text not null,
  created_at    timestamptz default now()
);

-- ── Push subscriptions (Bat Signal) ──────────────────────────────────────
create table if not exists public.push_subscriptions (
  endpoint     text primary key,
  subscription jsonb not null,
  team_member  text default '',  -- the teammate this device belongs to (display only)
  last_used_at timestamptz default now()
);
-- For existing projects that pre-date the team_member column:
alter table public.push_subscriptions
  add column if not exists team_member text default '';

-- ── Team travel (flights + accommodation, edited from Team page) ─────────
create table if not exists public.team_travel (
  name          text primary key,
  flights       jsonb default '[]'::jsonb,
  accommodation text default '',
  updated_at    timestamptz default now()
);

-- ── Booth photos ─────────────────────────────────────────────────────────
create table if not exists public.show_photos (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,         -- base64 data URL of resized image
  caption    text default '',
  taken_by   text default '',
  created_at timestamptz default now()
);

-- ── Podcast bookings (one slot per day+time) ─────────────────────────────
create table if not exists public.podcast_bookings (
  id         uuid primary key default gen_random_uuid(),
  day        text not null,
  time       text not null,
  guest_name text not null,
  company    text default '',
  topic      text default '',
  contact    text default '',
  created_at timestamptz default now(),
  unique (day, time)               -- enforces "slot already booked" 23505 path in app
);

-- ── RLS: this app uses the anon key directly from the browser. Tables are
-- not sensitive (no PII beyond names/emails the team chooses to capture for
-- a single trade show). With the new sb_publishable_* keys Supabase rolled
-- out, just disabling RLS no longer permits anon writes — you have to leave
-- RLS enabled and add explicit policies. So: enable RLS + allow-everything
-- policy for anon and authenticated.
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'nra_leads','session_notes','push_subscriptions',
    'team_travel','show_photos','podcast_bookings'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists "anon_full_access" on public.%I', tbl);
    execute format(
      'create policy "anon_full_access" on public.%I for all to anon using (true) with check (true)',
      tbl
    );
    execute format('drop policy if exists "auth_full_access" on public.%I', tbl);
    execute format(
      'create policy "auth_full_access" on public.%I for all to authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end $$;

-- ── Realtime: the app subscribes to postgres_changes on these tables so
-- one teammate's edit shows up on every other device within a second.
-- Adding to the supabase_realtime publication is what enables that.
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.nra_leads;
alter publication supabase_realtime add table public.session_notes;
alter publication supabase_realtime add table public.team_travel;
alter publication supabase_realtime add table public.show_photos;
alter publication supabase_realtime add table public.podcast_bookings;
-- (push_subscriptions intentionally NOT in realtime — server-side only)
