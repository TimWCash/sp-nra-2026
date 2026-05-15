# Next-Year Cleanup — Lessons & Improvements for NRA 2027

A living doc, updated as the team hits things during NRA 2026 that should be
better before the next show. Add to it freely. Each item should have:
**What happened · What to fix · Priority** (P0 = blocking, P1 = important, P2 = nice-to-have).

---

## Live load-in feedback (NRA 2026 setup day — May 15, 2026)

Captured from Brian's Slack DMs during real load-in. Most of these are now
in the app under Load In → Check-In → "Pro Tips from Past Years" (commit
`fbc94fd`) and the main Marshalling Yard checklist (commit `201b221`).

### Wrong Marshalling Yard address ✅ FIXED
- **What happened:** Freeman provides "3050 S. Moe Drive" as the marshalling
  yard address. That's a CLOSED road. Google Maps takes you to a dead end.
  Real address is "3050 Moe Drive" (no "S").
- **Fix shipped:** address corrected app-wide, Google Maps button now uses
  Brian's verified `maps.app.goo.gl/RRStrvTeMiyHjpU96` link.
- **Owner for 2027:** confirm with Freeman whether they'll fix their docs.
- **Priority:** P0.

### Two-person rule for the vehicle ✅ FIXED
- **What happened:** Marshalling yard requires the driver to stay with the
  vehicle the entire time. So you need a 2nd person to handle paperwork,
  Dock Pass pickup, wristbands, etc. Solo drive is a dead end.
- **Fix shipped:** in Pro Tips banner.
- **Priority:** P0.

### Teamsters break 12:00–12:30 PM ✅ FIXED
- **What happened:** No vehicle movement happens during that window.
  Surprise to the team in past years.
- **Fix shipped:** in Pro Tips banner.
- **Priority:** P0.

### Wrong-hall risk ✅ FIXED
- **What happened:** Brian's team has driven to the wrong hall in past years.
  Easy mistake with McCormick's layout — Main (Lakeside), North, South all
  feel similar from the road.
- **Fix shipped:** in Pro Tips banner — "Booth #7365 is in North Building
  (booths 5500–9200)."
- **Priority:** P0.

### Wristbands at marshalling yard ✅ FIXED
- **What happened:** Wristbands are required for show-floor access during
  setup. Yard staff don't always offer them — easy to miss. Brian's team
  forgot to ask in past years and had to go back.
- **Fix shipped:** added to BOTH the Pro Tips banner AND the main Marshalling
  Yard arrival checklist (so it's part of the do-list, not just a tip).
- **Priority:** P0.

### Designate one person to pick up everyone's badges (Brian, May 15 7:26pm)
- **What happened:** This year each teammate handled their own badge pickup,
  which means N trips to the registration desk on arrival, N waits in line,
  N opportunities to forget something. Wasted time and decision-energy at
  the start of the show.
- **Fix for 2027:** designate one "badge wrangler" before the show. NRA
  already supports group pickup (5+ badges) at South Building Room S103
  or Lakeside Center Level 2. The wrangler picks up all 7 badges in one
  trip, distributes at the booth.
- **What we need:**
  - Pick a person (probably someone arriving Thursday or early Friday)
  - Make sure they have everyone's confirmation numbers or IDs in advance
  - Block 30 min on their schedule for the pickup
  - Communicate the plan to the team so nobody else goes for their own
- **Priority:** P0 for 2027 prep.

---

## Push notification infrastructure pain

The Bat Signal cost ~6 hours of debugging mid-week-of-show. Several
preventable.

### Env var paste-newlines silently broke everything ✅ FIXED (defensively)
- **What happened:** Pasting VAPID_PRIVATE_KEY into Vercel's env editor
  picked up a trailing newline. web-push rejected the key with a confusing
  "must be URL safe Base64" error. Took an hour + a diagnostic endpoint
  (`/api/push/diagnose`) to find.
- **Fix shipped:** `.trim()` on every env var read across bat-signal,
  push/test, push subscribe, push status, cron backup, SetupPage. Defense
  in depth — newlines no longer matter.
- **For 2027:** keep the trim guards. They cost nothing.
- **Priority:** P1.

### Service worker cache version must be bumped manually
- **What happened:** Service worker cache version (`sp-nra-2026-v5`) is a
  hardcoded constant in `public/sw.js`. When a deploy includes important
  changes (esp. VAPID rotation), every teammate's phone keeps serving the
  old bundle until the SW activates. We had to manually bump v3→v4→v5
  across the week.
- **Fix for 2027:** auto-bump SW cache version from the build (e.g. inject
  `process.env.VERCEL_GIT_COMMIT_SHA` into the constant at build time).
  ~30 min of work, prevents an entire class of "why isn't my phone seeing
  the new version" bug reports.
- **Priority:** P1.

### "Sensitive" env vars are write-once
- **What happened:** Marked CRON_SECRET as Sensitive in Vercel, then
  couldn't retrieve it to run the manual cron test. Had to rotate.
- **Fix for 2027:** decide upfront which env vars need Sensitive treatment.
  For CRON_SECRET specifically — Sensitive is overkill, the attack surface
  is "someone triggers a backup to YOUR email." Don't mark.
- **Priority:** P2.

### Free Supabase project paused mid-build
- **What happened:** Original Supabase project (`fgnxhvaegzvcqqjrvvns`) was
  on Albert's "Service Physics" org. That org's other free project + the 2-
  project limit meant we couldn't restore when it auto-paused. Had to
  migrate to Tim's personal `timmycash@gmail.com` account.
- **Fix for 2027:** OPTION A — pay for Pro on the SP org ($25/mo, 7-day
  paused-project grace becomes 90 days, no project limit). OPTION B —
  keep using Tim's personal Supabase + just make sure it's accessible
  to whoever needs it.
- **Priority:** P1.

### 3 of 7 teammates never registered for Bat Signal
- **What happened:** As of May 14 (day before show), Rebecca, Maria, and
  Kelly had not completed Setup → push notifications. If we'd fired a
  Bat Signal, only 4 of 7 phones would have buzzed.
- **Fix for 2027:** mandatory pre-show drill, ideally 2 weeks out, with a
  shared checklist (or in-app dashboard) that shows who's done Setup and
  who hasn't. Tim should DM the laggards directly.
- **Priority:** P0.

### "I'm going" RSVPs + booth shifts shipped but unused
- **What happened:** Both features built late in the cycle (May 13). Zero
  rows in either table as of May 14. Team never adopted because they were
  added too late to bake into habits.
- **Fix for 2027:** ship these features at the START of build, not the
  end. Make them part of the onboarding wizard so picking shifts is a
  required step.
- **Priority:** P1.

---

## Data backups

### Resend free-tier sender restriction tripped us
- **What happened:** Resend free tier's `onboarding@resend.dev` sender
  only allows sending TO the Resend account email. Backups going to
  `timothy.cashman@gmail.com` failed; only `timmycash@gmail.com` works.
- **Fix for 2027:** verify a sender domain on Resend (`backups@servicephysics.com`).
  ~15 min DNS setup, then can send to any address.
- **Priority:** P1.

### Notes-to-Sheet mirror was built then abandoned
- **What happened:** Built the `/api/notes` route and Apps Script handler,
  but the auth path required Apps Script changes the team didn't have time
  for. Notes live in Supabase + JSON backup only.
- **Fix for 2027:** set up a Google Service Account up front (instead of
  the Apps Script webhook) so the Notes mirror works without Apps Script
  changes. Or commit to Apps Script changes early.
- **Priority:** P2.

---

## Features that need rethinking

### Daily lead counter was broken for weeks
- **What happened:** TeamStatusPage had `getLeadCount()` reading from
  legacy `sp_nra_leads` localStorage key that's been empty since the
  Supabase migration. The "Daily Lead Goal" card showed 0 for weeks.
  Discovered May 13 when changing to the qualified-leads metric.
- **Fix for 2027:** wire counters to Supabase from day one, not localStorage.
- **Priority:** Already fixed for 2026 (commit `1685664`). Avoid the pattern
  for 2027.

### `clearAll` was a one-tap nuke
- **What happened:** Original LeadsPage had a "Clear all leads" button
  protected by `confirm()`. Round-2 review caught this as too dangerous
  for a live event. Now gated behind NODE_ENV.
- **Fix for 2027:** any destructive action in production needs a typed-phrase
  confirmation, not a confirm() dialog. Or admin-only routes.
- **Priority:** Already fixed.

### Booth render image arrived late
- **What happened:** Touch Worldwide's booth render image arrived May 4 —
  ~2 weeks before show. Would have been more useful at start of build for
  team to visualize the goal.
- **Fix for 2027:** ask for booth render at kickoff. Goes on Home + Booth +
  Setup pages from week one.
- **Priority:** P2.

### Floor manager contact card added Apr 30
- **What happened:** Showed up in NRA's pre-show email; could have been
  baked in from kickoff if we'd known to ask.
- **Fix for 2027:** before kickoff, harvest the previous year's pre-show
  emails for assets that should be in the app from day one (floor manager,
  marshalling yard, show hours, dates, etc).
- **Priority:** P2.

---

## Architectural / process

### Vercel cron only works on freshly-rebuilt deployments
- **What happened:** `vercel.json` cron config requires a successful new
  build for Vercel to register the cron. Edited the env vars but re-deployed
  an old build — cron never fired night one.
- **Fix for 2027:** when adding crons, always rebuild without cache.
- **Priority:** P1.

### Vercel Hobby log retention is 1 hour
- **What happened:** When debugging "why didn't the cron fire?", couldn't
  see logs from > 1 hour ago. Required either upgrading or working around.
- **Fix for 2027:** either upgrade to Pro for the show ($20/mo) or rely on
  external logging (e.g. write status to a Supabase `events_log` table from
  every cron run).
- **Priority:** P2.

### Service-role key, publishable key, anon SELECT, RLS — confusing day-of
- **What happened:** Spent meaningful time across multiple sessions figuring
  out which client to use for which operation. Round 4 of the security review
  finally locked it down (service-role for push_subscriptions writes,
  publishable for client reads).
- **Fix for 2027:** start with the round-4 architecture from day one. The
  patterns are documented in `lib/pushStore.ts` and `supabase/init.sql`.
- **Priority:** P1.

---

## Wishlist / nice-to-haves for 2027

- **Live "Show Snapshot" page in the app** — pretty tables of leads, notes,
  photos. Replaces the "paste JSON into Claude" workflow.
- **Auto-bump SW cache version from git SHA**
- **Verified Resend sending domain** (`backups@servicephysics.com`)
- **Onboarding wizard with mandatory steps** — picks name, registers
  for push, picks shift. None of this opt-in.
- **A real "post-show summary" doc that auto-generates** from Supabase
  data (qualified leads by teammate, podcast guests booked, RSVPs honored,
  bat signals fired, etc).
- **Per-teammate lead leaderboard** — Team Status page has the placeholder
  but no actual leaderboard yet. Would drive friendly competition.
- **Photo OCR** — currently we save the badge photo but the AI scan happens
  separately. Could batch-process all badge photos to fill in any missed fields.

---

## Things this app DID well in 2026 (keep them)

- Offline-first lead capture with optimistic UI + idempotent UUIDs.
  Survived multiple wifi flakeouts in dev.
- Bat Signal once VAPID was fixed — works.
- AI badge scan (Claude vision) — point camera, fields autofill.
- AI LinkedIn post drafting from session notes — voice was right.
- Real-time team status across phones via Supabase realtime.
- JSON backup via Resend nightly — works.
- The team registry chip showing who's NOT registered yet.

Don't rebuild any of these. They're solid.

---

_Last updated: 2026-05-15 during NRA 2026 load-in._
_Add to this doc freely as more learnings come in._
