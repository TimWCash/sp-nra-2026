# Hardening pass 1 — pre-NRA review response

Address-pass against the combined Gemini + ChatGPT review feedback. Goal: no
silent failures during the show. The principle the user emphasized: **don't
tell someone a lead or Bat Signal succeeded unless it actually did.**

## Summary of changes

| # | Risk | What landed |
|---|------|-------------|
| 1 | "Lie-fi" hangs on captive-portal wifi | SW fetch wrapped in 3s `Promise.race` with cache fallback + offline fallback response. Skips API/Supabase calls (their own queues). `public/sw.js` |
| 2 | Anyone with anon key can `DELETE FROM nra_leads` | Per-table RLS. **No anon DELETE on `nra_leads` or `push_subscriptions`.** Lead deletes go through `/api/leads/[id]` using `SUPABASE_SERVICE_ROLE_KEY`. `supabase/init.sql` + new route |
| 3 | `toggleFollowUp` + `deleteLead` silently fail offline | Both go through the offline queue: optimistic UI + queueLead/queueDelete + flush on online event. Per-id, idempotent, race-safe. `lib/leads-offline.ts`, `components/leads/useLeads.ts` |
| 4 | Multi-tab queue overwrites lost data | Flush lock (with stale recovery) + re-read-before-mutate + per-id remove on success in all three queue modules. `lib/leads-offline.ts`, `lib/notes-offline.ts`, `lib/sheets-sync.ts` |
| 5 | Lead capture could show ✅ when storage was full | `queueLead` returns `Result<>`. If both Supabase insert AND queue write fail, `addLead` returns `{ ok: false, error }` and the form blocks with "Lead was NOT saved" alert. |
| 6 | Base64 badge photos blow localStorage quota | Cap at ~150KB base64. Over-cap photos are dropped silently from the lead with a "photo skipped" warning, NOT the whole capture. |
| 7 | Bat-signal state was a module-level `let` (broken on Vercel) | New `bat_signal_state` table + `lib/batSignalState.ts`. State is consistent across serverless instances. `app/api/bat-signal/route.ts` reads/writes Supabase. |
| 8 | Bat-signal returned 200 even when nothing got delivered | If VAPID env missing → 500 + don't activate. If `total > 0 && pushed === 0` → 502 with explicit error. Response always includes `pushed/failed/total/warning`. |
| 9 | 400/403 push errors auto-pruned subs (made teammates miss bat signals) | Only 404/410 prune. 400/403 mark unhealthy (`failure_count`, `last_failure_status`, `last_failure_at`). Successful push clears the flag. New columns + `markFailure` / `clearFailure` / `getUnhealthySubs` in `lib/pushStore.ts`. |
| 10 | Setup said ✅ even when server registration was missing | `detect()` now actually verifies the server has the sub via `subscribeToPush()` (which calls `registerOnServer`). If browser has sub but server doesn't, auto re-registers silently. iOS install gate added: skip everything if iOS && !standalone. |
| 11 | Photo uploads silently failed | Per-photo error tracking + alert if any failed. User can no longer walk away thinking photos uploaded when they didn't. |
| 12 | Load-bearing `as` casts could crash on bad data | Runtime validators: `dbRowToLead` returns `null` for invalid rows (filtered in `fetchLeads`); `isValidStoredSubscription` filters bad push rows in `getAllSubscriptions`/`getSubscription`; `scan-card` route handles empty/invalid Claude responses gracefully. |
| 13 | Realtime publication SQL failed on re-run | Wrapped in DO block with EXCEPTION clauses per-table. Re-running `init.sql` is now safe. |
| 14 | `clearAll` was a one-tap nuke | Behind a confirmation prompt requiring exact phrase "DELETE ALL LEADS". |

## What you (Tim) need to do before this lands cleanly

### 1. Run the new SQL on the live Supabase project

The schema gained columns + a new table + new RLS policies. Open the SQL
editor at https://supabase.com/dashboard/project/sgnivfbdsifarpoqctlk/sql/new
and paste the **entire contents of `supabase/init.sql`** — the file is
idempotent so re-running is safe.

### 2. Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars

The new `/api/leads/[id]` DELETE route needs it (anon RLS forbids direct
DELETE on `nra_leads`).

- Get the key: Supabase dashboard → Settings → API → "service_role secret"
  (the long `sb_secret_...` or legacy `eyJ...` value, NOT the publishable one)
- Vercel → Project → Settings → Environment Variables
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Apply to: Production, Preview, Development
- Redeploy

If you skip this step: deletes from the leads page will return 500
"Server not configured to delete (SUPABASE_SERVICE_ROLE_KEY missing)".

## Manual test checklist

Once the SQL is run + Vercel env updated + redeploy is live:

### Offline lead capture
- [ ] Add lead online → appears, syncs immediately, "0 waiting to sync"
- [ ] Airplane mode → add lead → still appears in list, "1 waiting to sync" banner
- [ ] Reload while still offline → lead is still visible (cache hydration)
- [ ] Disable airplane mode → banner clears within seconds, lead is on Supabase + Sheet

### Storage quota (badge photo edge case)
- [ ] Add a lead with an unusually large badge photo → either: (a) saves with
      photo, or (b) saves without photo + alerts "photo skipped to protect
      offline storage" — but never (c) loses the lead

### Reconnect race
- [ ] Add lead A offline, start a flush by going online, IMMEDIATELY add lead
      B before flush finishes → both leads end up on Supabase + Sheet, nothing
      lost

### Follow-up toggle offline
- [ ] Airplane mode → toggle follow-up on a lead → banner increments
- [ ] Reconnect → banner clears, follow-up state lands on Supabase

### Delete offline
- [ ] Airplane mode → delete a lead → optimistically removed
- [ ] Reconnect → lead is gone from Supabase too (via queued delete)

### App reload while offline
- [ ] Open app on home wifi at least once
- [ ] Airplane mode → reload → app shell loads in <3s, leads list hydrates
      from cache, NO 30-second hang

### Bat Signal happy path
- [ ] Setup wizard says ✅ on all 4 steps for at least one teammate
- [ ] Activate Bat Signal → response shows pushed/failed/total
- [ ] Phones buzz within ~5s

### Bat Signal — VAPID missing (unlikely but covered)
- [ ] Temporarily wipe `VAPID_PRIVATE_KEY` on Vercel → activate → server
      returns 500 + UI shows "Push not configured" + state stays inactive

### Bat Signal — partial delivery
- [ ] Force one teammate's sub to be invalid (delete their `push_subscriptions`
      row) → activate → response includes warning "1 of N devices did not
      receive the alert" + UI shows the count

### Setup wizard verification
- [ ] On a teammate phone where the server-side sub got wiped, open Setup →
      Step 3 should re-register silently → Step 4 test signal still works

### Anonymous DELETE blocked by RLS
- [ ] From a curl using the publishable key, attempt
      `DELETE /rest/v1/nra_leads?id=...` → returns 401 RLS violation
- [ ] App's delete button still works (goes through `/api/leads/[id]`)

## Known risks accepted for the show

These are real concerns the reviews flagged that I consciously did NOT address
in this pass — each is a non-trivial change with bug risk in 17 days. Listed
here so you can decide whether to come back for them post-NRA.

1. **No per-lead sync status badges in UI.** Global "N waiting to sync" banner
   exists; per-card ⏳/✅/❌ chips do not. The risk is small (the queue *is*
   correct; the user just doesn't see per-row state). Estimated effort: 1
   evening.

2. **Badge photos still in localStorage** (just capped). The proper fix is
   IndexedDB with a photo-id reference in the queue. Adds a migration path,
   broadens the surface area for bugs. Estimated effort: 2 evenings + careful
   testing.

3. **`session_notes`, `show_photos`, `podcast_bookings` accept anon DELETE.**
   The leads table is protected; the others aren't. They're "recoverable
   inconveniences" (anyone can delete a podcast booking, but the team can
   recreate it; nobody can delete leads anonymously). Proper fix: 3 more
   server-side delete routes. Estimated effort: 1 evening.

4. **No offline drill checklist in Setup UI.** The bullets exist in
   `docs/` but the app itself doesn't walk teammates through "open online,
   visit pages, go offline, add a lead, reconnect." Process change, not code.

5. **Service worker cache version still bumps manually.** When you ship a
   bundle that requires fresh assets, you need to bump `CACHE` in `sw.js`
   (already done: v2 → v3 this pass) so the activate handler purges old
   ones. There's no automation; you have to remember.

6. **Multi-device follow-up race.** If two teammates simultaneously toggle
   follow-up on the same lead while both offline, the last-write-wins on
   reconnect. Probability: tiny. Impact: a flag flips. Acceptable.

## Files changed in this pass

```
app/api/bat-signal/route.ts      (rewrite — Supabase state, proper error codes)
app/api/leads/[id]/route.ts      (new — service-role DELETE)
app/api/push/test/route.ts       (mark unhealthy on 400/403, prune only 404/410)
app/api/scan-card/route.ts       (defensive parsing of Claude response)
components/leads/useLeads.ts     (validators, queue mutations, blocking error)
components/pages/LeadsPage.tsx   (handleSave handles ok/error returns)
components/pages/PhotosPage.tsx  (per-photo error tracking + alert)
components/pages/SetupPage.tsx   (server-side verification + iOS gate)
lib/batSignalState.ts            (new — Supabase-backed state)
lib/leads-offline.ts             (mutex, structured returns, queueDelete, flushDeletes)
lib/notes-offline.ts             (mutex, structured returns)
lib/pushStore.ts                 (markFailure, clearFailure, getUnhealthySubs, isValidStoredSubscription)
lib/sheets-sync.ts               (mutex, per-id remove)
public/sw.js                     (3s timeout race, offline fallback)
supabase/init.sql                (per-table RLS, bat_signal_state, push health columns, idempotent realtime)
```
