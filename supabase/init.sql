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
  endpoint           text primary key,
  subscription       jsonb not null,
  team_member        text default '',  -- the teammate this device belongs to (display only)
  last_used_at       timestamptz default now(),
  -- Health tracking. Don't auto-prune on first 400/403 — those can be
  -- transient (rate limiting, brief APNS hiccup). Mark and let the next
  -- successful test/heal clear the failure.
  last_failure_at    timestamptz,
  last_failure_status int,
  failure_count      int default 0
);
-- For existing projects that pre-date these columns:
alter table public.push_subscriptions add column if not exists team_member text default '';
alter table public.push_subscriptions add column if not exists last_failure_at timestamptz;
alter table public.push_subscriptions add column if not exists last_failure_status int;
alter table public.push_subscriptions add column if not exists failure_count int default 0;

-- ── Bat Signal state ─────────────────────────────────────────────────────
-- Was an in-memory module-level let on the route, which silently broke on
-- Vercel: each serverless invocation can land on a different instance, so
-- the state two consecutive requests saw could differ. Moving to Supabase
-- so the state is consistent across instances and across page loads.
create table if not exists public.bat_signal_state (
  id     int primary key default 1 check (id = 1),  -- only ever one row
  active boolean not null default false,
  since  timestamptz
);
insert into public.bat_signal_state (id, active, since)
  values (1, false, null)
  on conflict (id) do nothing;

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

-- ── RLS: this app uses the anon key directly from the browser. With the new
-- sb_publishable_* keys, RLS is enforced regardless of the table's "disable
-- RLS" setting, so we leave RLS on and add explicit policies.
--
-- Threat model: the anon key is shipped in the client bundle, so anyone with
-- a browser can hit the API as the anon role. The biggest data asset is the
-- leads table — losing leads = losing the show. So:
--   - nra_leads:          anon = SELECT, INSERT, UPDATE. NO DELETE.
--                         (deleteLead goes via /api/leads/[id] using the
--                         service role key.)
--   - push_subscriptions: anon = NO ACCESS AT ALL. The round-4 review caught
--                         a "confused deputy" attack — anon SELECT exposed
--                         endpoint URLs that an attacker could feed into our
--                         service-role-backed DELETE route to wipe the team's
--                         bat-signal subscribers. Now: client uses the
--                         /api/push/status endpoint for the count + names it
--                         needs; everything else goes through service role.
--   - session_notes,
--     show_photos,
--     podcast_bookings,
--     team_travel:        anon = SELECT, INSERT, UPDATE, DELETE.
--                         (Accepting anon DELETE on these as a known risk
--                         for the show — they're recoverable inconveniences,
--                         and moving each to its own service-role route is
--                         a 17-day timeline budget call.)
--   - bat_signal_state:   anon = SELECT, UPDATE only (one row, never deleted).
--   - authenticated: full access on every table (Supabase dashboard cleanup).
do $$
declare
  tbl text;
  -- Tables where anon SELECT is acceptable. push_subscriptions is excluded
  -- so endpoint URLs aren't leakable to anyone holding the publishable key.
  select_ok_tbls text[] := array[
    'nra_leads','session_notes','team_travel','show_photos',
    'podcast_bookings','bat_signal_state'
  ];
  -- Tables where anon DELETE is acceptable (recoverable inconveniences).
  -- nra_leads + push_subscriptions are intentionally NOT here — bulk delete
  -- is the catastrophic failure mode we're guarding against. Both go
  -- through service-role server routes for any destructive op.
  delete_ok_tbls text[] := array[
    'session_notes','show_photos','podcast_bookings','team_travel'
  ];
  update_ok_tbls text[] := array[
    'nra_leads','team_travel','bat_signal_state','session_notes',
    'show_photos','podcast_bookings'
  ];
  -- Tables where anon INSERT is acceptable. push_subscriptions is excluded
  -- because writes go through the service-role pushStore.
  insert_ok_tbls text[] := array[
    'nra_leads','session_notes','team_travel','show_photos','podcast_bookings'
  ];
begin
  foreach tbl in array array[
    'nra_leads','session_notes','push_subscriptions',
    'team_travel','show_photos','podcast_bookings','bat_signal_state'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);

    -- Wipe any older policies before redefining (idempotent re-runs).
    execute format('drop policy if exists "anon_full_access" on public.%I', tbl);
    execute format('drop policy if exists "auth_full_access" on public.%I', tbl);
    execute format('drop policy if exists "anon_select" on public.%I', tbl);
    execute format('drop policy if exists "anon_insert" on public.%I', tbl);
    execute format('drop policy if exists "anon_update" on public.%I', tbl);
    execute format('drop policy if exists "anon_delete" on public.%I', tbl);

    if tbl = any(select_ok_tbls) then
      execute format(
        'create policy "anon_select" on public.%I for select to anon using (true)',
        tbl
      );
    end if;

    if tbl = any(insert_ok_tbls) then
      execute format(
        'create policy "anon_insert" on public.%I for insert to anon with check (true)',
        tbl
      );
    end if;

    if tbl = any(update_ok_tbls) then
      execute format(
        'create policy "anon_update" on public.%I for update to anon using (true) with check (true)',
        tbl
      );
    end if;

    if tbl = any(delete_ok_tbls) then
      execute format(
        'create policy "anon_delete" on public.%I for delete to anon using (true)',
        tbl
      );
    end if;

    -- Authenticated bypass for dashboard cleanup.
    execute format(
      'create policy "auth_full_access" on public.%I for all to authenticated using (true) with check (true)',
      tbl
    );
  end loop;
end $$;

-- ── Realtime: the app subscribes to postgres_changes on these tables so
-- one teammate's edit shows up on every other device within a second.
-- Adding to the supabase_realtime publication is what enables that.
--
-- This block is idempotent: if a table is already in the publication, ALTER
-- PUBLICATION ADD TABLE errors. We catch each one individually via a DO
-- block + EXCEPTION clause so re-running this script is safe.
do $$
declare tbl text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach tbl in array array[
    'nra_leads','session_notes','team_travel','show_photos',
    'podcast_bookings','bat_signal_state'
  ] loop
    -- (push_subscriptions intentionally NOT in realtime — server-side only)
    begin
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    exception
      when duplicate_object then null;  -- already in the publication, fine.
      when others then
        -- Log loudly — round-3 review correctly noted that swallowing this
        -- can hide real schema/setup failures (e.g. typo in table name,
        -- missing table). RAISE NOTICE shows up in the SQL editor output
        -- but doesn't fail the script.
        raise notice 'Could not add %.% to supabase_realtime: %', 'public', tbl, sqlerrm;
    end;
  end loop;
end $$;
