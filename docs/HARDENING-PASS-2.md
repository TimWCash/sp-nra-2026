# Hardening pass 2 — round-3 review response

Address-pass against the round-3 review (Gemini + ChatGPT, after round-2 work).
Both reviewers correctly flagged the remaining critical issues; this pass
closes them.

## Fixes landed in this pass

| # | Round-3 finding | What landed |
|---|-----------------|-------------|
| 1 | SW fallback returns `text/plain` for assets, breaking CSS/JS/images | Navigation requests now get an HTML offline page; non-navigation requests return `Response.error()` so the browser handles asset failures naturally. `public/sw.js` |
| 2 | Anyone with anon key can `DELETE FROM push_subscriptions` and silently break Bat Signal | New service-role write client in `lib/pushStore.ts` (`getWriteClient`); all writes (`addSubscription`, `removeSubscription`, `markFailure`, `clearFailure`) use it. RLS now allows anon SELECT only on `push_subscriptions`. INSERT/UPDATE/DELETE removed. Falls back to anon if `SUPABASE_SERVICE_ROLE_KEY` missing, with a loud console warning. |
| 3 | Bat Signal persisted `active=true` BEFORE fan-out, creating false confidence | Fan-out now happens first. If `total > 0 && pushed === 0`, returns 502 + does NOT persist active. State only flips true after at least one push lands (or `total === 0` with explicit warning). Deactivation persists immediately. `app/api/bat-signal/route.ts` |
| 4 | `toggleFollowUp` + `deleteLead` ignored `queueLead`/`queueDelete` failure | Both now check `queued.ok`. If queue write fails (storage full, private mode), the function returns `{ ok: false, error }` and the UI surfaces it instead of optimistically lying. `components/leads/useLeads.ts` |
| 5 | localStorage CAS mutex was non-atomic — two tabs could both flush | New `lib/web-lock.ts` using the Web Locks API (`navigator.locks.request`). Real cross-tab serialization. Used by all three queue modules — leads, notes, sheets-sync. Falls back to running unguarded on browsers without Web Locks (none we target). |
| 6 | Enqueue races (queueLead/queueNote/queueDelete on whole-array CAS) | Same Web Lock helper now wraps the read-mutate-write of every queue mutation. Two-tab simultaneous queueing no longer loses items. Functions are now `async` — all callers updated to `await`. |
| 7 | `clearAll` still in production UI behind a phrase prompt | Removed from `LeadsPage` entirely. The `useLeads` export is gated behind `NODE_ENV !== "production"` and a no-op in production builds. Per-row delete still works (goes through `/api/leads/[id]`). |
| 8 | `/api/leads` blindly trusted `req.json()` | New `validate()` function: coerces fields to strings with length caps, validates `heat` enum, rejects empty rows with 400. |
| 9 | iOS install gate only at UI level, not function level | `enableNotifications` now also checks `platform === "ios" && !standalone` and shows an alert before requesting permission. |
| 10 | `navigator.vibrate` was implied to wake a backgrounded phone | Comments updated to make clear it's a foreground-only nice-to-have; off-screen alerts always come from the SW push handler. |
| 11 | Realtime SQL `when others then null` hid real errors | Now `RAISE NOTICE` so any non-duplicate failure shows up in SQL editor output. |

## What you (Tim) need to do before this lands cleanly

1. **Re-run `supabase/init.sql`** in the SQL editor (idempotent — safe to re-run). The push_subscriptions RLS got tighter.
2. **Verify `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel.** Without it, push subscription writes fall back to the anon client, which RLS now blocks → registration breaks. The fallback logs a console warning so this is visible.
3. **Redeploy.**

## Manual test checklist

### Lie-fi simulation
- [ ] Chrome devtools → Network → "Slow 3G" or "Offline" → reload app
- [ ] Cached app shell loads in <3s, no 30s hang
- [ ] Offline + uncached navigation → friendly HTML "You're offline" page (not text/plain)
- [ ] Offline + uncached image/CSS → browser shows broken-asset behavior naturally (not a text/plain blob in CSS)

### Multi-tab race (was the round-3 dealbreaker)
- [ ] Open the app in two tabs, both pointed at Leads
- [ ] Airplane mode
- [ ] Tab A: add lead "Race A". Tab B: add lead "Race B" within the same second.
- [ ] Reconnect → both leads land on Supabase. Neither was lost.

### Bat Signal — false-confidence guard
- [ ] Force every push subscription to be invalid (delete from `push_subscriptions` row in dashboard)
- [ ] Activate Bat Signal → response 502, error: "0/N devices received the Bat Signal — NOT activated"
- [ ] `bat_signal_state.active` is `false` in the DB (NOT true)
- [ ] No phantom red banner on TeamStatus page

### Anonymous DELETE on push_subscriptions
- [ ] curl with publishable key:
      `curl -X DELETE 'https://sgnivfbdsifarpoqctlk.supabase.co/rest/v1/push_subscriptions?endpoint=eq.test' -H "apikey: sb_publishable_..." -H "Authorization: Bearer sb_publishable_..."`
- [ ] Should return 401/RLS violation (was 200 before this pass)
- [ ] App's setup flow still works (because server-side service-role bypasses RLS)

### iOS install gate
- [ ] Open the app in mobile Safari (NOT installed PWA) → tap Step 2 "Enable notifications" → alert: "Install the app to your home screen first" (no permission prompt fires)

### Queue-failure UX
- [ ] In Chrome devtools → Application → Storage → set quota to a small value (e.g. 100KB), exhaust it
- [ ] Try to add a lead → blocking alert: "Lead was NOT saved..."
- [ ] Try to toggle follow-up → blocking alert: "Follow-up change was NOT saved..."

## Known risks still accepted for the show

These remain on the post-NRA list. Nothing here changes the verdict on the
core data-durability path; they're either rare-edge or bigger architecture
changes.

1. **`session_notes`, `show_photos`, `podcast_bookings`, `team_travel`
   accept anon DELETE.** Recoverable inconveniences (notes can be re-typed,
   photos re-uploaded, bookings re-made). Lead data — the catastrophic
   asset — is protected. Adding 4 more service-role routes is a 1-evening
   post-show task.
2. **`backfillToSheet` is sequential** — Gemini's "rate-limit suicide"
   finding. If a teammate backfills 100+ leads at end-of-show, that's 100+
   sequential POSTs to `/api/leads` and 100+ Sheets API calls. Could hit
   Google's 60-req/min limit. Mitigation for now: don't tap backfill on
   100+ leads in one go; run it in chunks. Proper fix: bulk endpoint.
3. **No per-lead sync status badges.** Global "N waiting to sync" banner
   exists; per-card chips do not. Polish, not safety.
4. **Badge photos still in localStorage** (now capped at 150KB; over-cap
   photos are dropped from the lead with a warning rather than failing the
   whole capture). Proper fix is IndexedDB.
5. **No SW asset versioning automation.** When you ship a bundle that needs
   fresh assets, bump `CACHE` in `sw.js` (this pass: v3 → v4). The activate
   handler purges old versions but you have to remember to bump.

## Files changed in this pass

```
app/api/bat-signal/route.ts         (state-after-fanout reorder)
app/api/leads/route.ts              (input validation)
components/SessionNotes.tsx         (await queueNote/dequeueNote, blocking error)
components/leads/useLeads.ts        (await queueLead/queueDelete/dequeueLead, queue-failure handling, clearAll dev-only)
components/pages/LeadsPage.tsx      (clearAll button removed)
components/pages/SetupPage.tsx      (iOS gate at function level)
components/pages/TeamStatusPage.tsx (vibration copy clarification)
lib/leads-offline.ts                (Web Lock for enqueue + flush)
lib/notes-offline.ts                (Web Lock for enqueue + flush)
lib/pushStore.ts                    (service-role write client)
lib/sheets-sync.ts                  (Web Lock for enqueue + flush)
lib/web-lock.ts                     (new — navigator.locks helper)
public/sw.js                        (navigation-only HTML fallback, asset → Response.error())
supabase/init.sql                   (push_subscriptions anon SELECT only, realtime RAISE NOTICE)
```
