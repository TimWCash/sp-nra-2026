# Hardening pass 3 — round-4 review response

Final round. Both reviewers (Gemini + ChatGPT, after they cross-reviewed each
other's round-4 feedback) converged on a single tight list of remaining
issues. This pass addresses each one.

## Fixes landed

| # | Issue | Fix |
|---|-------|-----|
| 1 | Bat Signal could activate `active=true` when 0 devices were registered, creating false confidence | Pre-flight `countSubscriptions()` call. If 0, return 502 immediately with a clear error message. Do NOT persist active. `app/api/bat-signal/route.ts` |
| 2 | "Confused deputy" attack: anon SELECT on `push_subscriptions` exposed endpoint URLs that an attacker could feed into our service-role-backed `/api/push/subscribe` DELETE route to wipe the team's bat-signal subscribers | Removed the DELETE handler from `/api/push/subscribe` entirely. Dead subs auto-clean via the bat-signal fan-out's 404/410 pruning, so we don't need a client-initiated unsubscribe path. |
| 3 | Anon SELECT on `push_subscriptions` leaked endpoints (input to the confused-deputy attack above) | New `GET /api/push/status` returns `{ count, registeredNames }` — the only fields the UI needs. RLS now denies anon SELECT entirely on `push_subscriptions`. Server-side reads use the service-role client. |
| 4 | `pushStore.ts` could fall back to the anon client if `SUPABASE_SERVICE_ROLE_KEY` was missing → silent security degradation | `import "server-only"` at the top guarantees this module never bundles into client code. `getWriteClient()` now throws hard if the env var is missing — config errors fail loudly at first request instead of degrading. |

## Files changed

```
app/api/bat-signal/route.ts          (zero-device pre-flight check)
app/api/push/status/route.ts         (NEW — server-side count + names)
app/api/push/subscribe/route.ts      (DELETE handler removed)
components/pages/TeamStatusPage.tsx  (uses /api/push/status, no direct reads)
lib/pushStore.ts                     (server-only + hard error + all reads via service role)
package.json                         (server-only dep added)
supabase/init.sql                    (anon_select policy gated to whitelist)
```

## What you (Tim) need to do

**Re-run `supabase/init.sql` ONE more time.** The anon_select policy on
`push_subscriptions` needs to be dropped. The script is idempotent so it's
safe to re-run.

After that, **redeploy** so the new server routes ship and Vercel picks up
the `server-only` dep.

## Verification curl tests

After deploy + SQL re-run, these should all pass:

```bash
# Should be 401 — anon SELECT denied on push_subscriptions
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://sgnivfbdsifarpoqctlk.supabase.co/rest/v1/push_subscriptions?select=count" \
  -H "apikey: ..." -H "Authorization: Bearer ..."

# Should be 200 with { count, registeredNames }
curl -s "https://sp-nra-2026.vercel.app/api/push/status"

# Should be 405 / 404 — DELETE handler is gone
curl -s -X DELETE "https://sp-nra-2026.vercel.app/api/push/subscribe" \
  -H "Content-Type: application/json" -d '{"endpoint":"x"}'

# Should be 502 — zero devices = hard fail (assuming you wipe push_subscriptions
# first or test on an empty project)
curl -s -X POST "https://sp-nra-2026.vercel.app/api/bat-signal" \
  -H "Content-Type: application/json" -d '{"active":true}'
```

## Final accepted-risk list (for the show)

1. **`session_notes`, `show_photos`, `podcast_bookings`, `team_travel`
   accept anon DELETE.** Recoverable inconveniences. Lead data + bat-signal
   subscriber data are the catastrophic assets, and both are now fully
   protected. Tightening the others requires 4 more service-role server
   routes — post-show.

2. **`backfillToSheet` is sequential** (Gemini's "rate-limit suicide"
   finding). 100+ leads at once → hits Google Sheets 60/min limit. Mitigation
   for now: don't tap backfill on huge batches. Proper fix: bulk endpoint.

3. **No per-lead sync status badges in UI.** Global "N waiting to sync"
   banner exists; per-card chips do not. Polish, not safety.

4. **Badge photos still in localStorage** (capped at 150KB; over-cap photos
   are dropped from the lead with a warning, not lost). Proper fix is
   IndexedDB.

5. **Multi-device follow-up race.** Two teammates simultaneously toggling
   the same lead's follow-up → last-write-wins. Tiny probability, tiny
   impact. Acceptable.

## Final pre-show drill (do this once before McCormick)

- [ ] Each teammate opens the app on home wifi, runs Setup Steps 1–4, gets a buzz
- [ ] Tim confirms `/api/push/status` shows the full team list
- [ ] One teammate captures a test lead with a real badge photo, deletes it via the per-row delete button
- [ ] One teammate goes airplane-mode, captures 5 leads, reconnects, confirms all 5 land in Supabase + Sheet
- [ ] Tim fires a test Bat Signal — confirms phones buzz, banner appears, "All Clear" button works

If all five pass, you're ready.
