import { NextResponse } from "next/server"
import {
  getAllSubscriptions, removeSubscription, countSubscriptions,
  markFailure, clearFailure,
} from "@/lib/pushStore"
import { getBatSignalState, setBatSignalState } from "@/lib/batSignalState"
import type { PushSubscription } from "web-push"

/**
 * Bat Signal: cross-device "all hands to the booth" alert.
 *
 * State is in Supabase (lib/batSignalState) because Vercel serverless
 * function instances don't share memory.
 *
 * Sub pruning is conservative: only 404 (gone) and 410 (expired) auto-remove.
 * 400/403 mark the sub unhealthy (counter + last_failure_status) so the
 * teammate can recover on next app open via the auto-recover flow, instead
 * of silently disappearing from the team list.
 */

export async function GET() {
  const state = await getBatSignalState()
  return NextResponse.json(state, {
    headers: { "Cache-Control": "no-store" },
  })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const wantActive = !!body.active

  // Validate VAPID config BEFORE we mutate state. If we can't actually fire
  // pushes, we don't want the dashboard to flip to "active" — that gives
  // the team false confidence.
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidMailto = process.env.VAPID_MAILTO || "mailto:tim@servicephysics.com"
  if (wantActive && (!vapidPublic || !vapidPrivate)) {
    return NextResponse.json(
      {
        error: "Push not configured — VAPID keys missing in server env. Bat Signal NOT activated.",
        active: false,
        since: 0,
        pushed: 0,
        failed: 0,
        total: await countSubscriptions().catch(() => 0),
      },
      { status: 500 },
    )
  }

  // Persist new state. If the write fails we refuse to do anything else —
  // partial state is worse than no state.
  const persisted = await setBatSignalState(wantActive)
  if (!persisted) {
    return NextResponse.json(
      {
        error: "Could not persist Bat Signal state to Supabase.",
        active: false,
        since: 0,
        pushed: 0,
        failed: 0,
        total: 0,
      },
      { status: 500 },
    )
  }

  let pushed = 0
  let failed = 0
  let total = 0
  const failures: Array<{ status: number; endpoint: string }> = []

  if (wantActive) {
    try {
      const subs = await getAllSubscriptions()
      total = subs.length
      if (subs.length > 0) {
        const webpush = (await import("web-push")).default
        webpush.setVapidDetails(vapidMailto, vapidPublic!, vapidPrivate!)
        const payload = JSON.stringify({
          title: "🦇 BAT SIGNAL",
          body: "Booth #7365 is SLAMMED — get back now!",
        })
        const results = await Promise.allSettled(
          subs.map(async (sub) => {
            const endpoint = (sub as PushSubscription).endpoint
            try {
              await webpush.sendNotification(sub as PushSubscription, payload)
              // Successful delivery clears any prior failure flag — sub
              // recovered, stop showing it as unhealthy.
              await clearFailure(endpoint).catch(() => {})
            } catch (err) {
              const status = (err as { statusCode?: number } | null)?.statusCode ?? 0
              if (status === 404 || status === 410) {
                // Subscription gone for good. Prune it.
                await removeSubscription(endpoint).catch(() => {})
              } else if (status === 400 || status === 403 || status >= 500) {
                // Could be transient (rate limit, brief APNS hiccup, VAPID drift
                // about to be auto-healed). Keep the row, mark unhealthy.
                await markFailure(endpoint, status).catch(() => {})
              }
              failures.push({ status, endpoint: endpoint.slice(0, 80) })
              throw err
            }
          })
        )
        pushed = results.filter((r) => r.status === "fulfilled").length
        failed = results.filter((r) => r.status === "rejected").length
      }
    } catch (err) {
      console.error("Bat-signal fan-out error:", err)
    }
  }

  // If we tried to fire and NOTHING got through, that's a loud failure —
  // surface it as 502 so the UI can show "nobody received this."
  if (wantActive && total > 0 && pushed === 0) {
    return NextResponse.json(
      {
        error: `Bat Signal saved as active but 0/${total} devices received it. Failures: ${failures.map((f) => f.status).join(",")}.`,
        active: true,
        since: Date.now(),
        pushed: 0,
        failed,
        total,
      },
      { status: 502 },
    )
  }

  // Always include the warning shape so the UI can decide how loud to be
  // ("3 of 7 received it" is success-with-warning, not silent success).
  const state = await getBatSignalState()
  const totalNow = await countSubscriptions().catch(() => total)
  return NextResponse.json({
    ...state,
    pushed,
    failed,
    total: totalNow,
    warning: wantActive && failed > 0
      ? `${failed} of ${total} devices did not receive the alert.`
      : undefined,
  })
}
