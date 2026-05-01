import { NextResponse } from "next/server"
import { getSubscription, removeSubscription, markFailure, clearFailure } from "@/lib/pushStore"

/**
 * Sends a single test push notification to the provided subscription endpoint.
 * Used by the Setup wizard to let a teammate verify end-to-end push delivery
 * without disrupting the whole team (unlike /api/bat-signal which fires to all).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const endpoint: string | undefined = body.endpoint

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidMailto = process.env.VAPID_MAILTO || "mailto:tim@servicephysics.com"

  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "Push not configured — VAPID keys missing in server env" },
      { status: 500 }
    )
  }

  const sub = await getSubscription(endpoint)
  if (!sub) {
    // The browser has a sub but our DB doesn't — usually because the server
    // was unreachable (Supabase paused, network blip) at registration time
    // and we silently dropped the row. Tell the client this is recoverable
    // (expired:true) so its existing auto-refresh path will re-subscribe and
    // re-register cleanly on the next attempt.
    return NextResponse.json(
      {
        error: "Subscription not registered on server. Auto-refreshing…",
        expired: true,
        upstreamStatus: 404,
      },
      { status: 404 }
    )
  }

  try {
    const webpush = (await import("web-push")).default
    webpush.setVapidDetails(vapidMailto, vapidPublic, vapidPrivate)
    const payload = JSON.stringify({
      title: "✅ Bat signal test",
      body: "This is how alerts will feel during the show.",
    })
    await webpush.sendNotification(sub, payload)
    // Successful delivery — wipe any prior failure flag so the sub stops
    // showing as unhealthy in TeamStatusPage.
    await clearFailure(endpoint).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch (err) {
    const e = err as { statusCode?: number; body?: string; headers?: Record<string, string> } | null
    const status = e?.statusCode ?? 500
    const body = typeof e?.body === "string" ? e.body.slice(0, 400) : undefined
    // Log the full shape so we can actually diagnose production pushes failing.
    console.error("Test push error:", {
      status,
      body,
      endpoint: endpoint.slice(0, 80),
      message: err instanceof Error ? err.message : String(err),
    })

    // 404/410: subscription is gone for good — APNS/FCM have forgotten it.
    // Prune from the DB and tell the client to re-subscribe.
    if (status === 404 || status === 410) {
      await removeSubscription(endpoint)
      return NextResponse.json(
        {
          error: "Push subscription expired. Refreshing…",
          expired: true,
          detail: body,
          upstreamStatus: status,
        },
        { status: 410 }
      )
    }
    // 400/403: probably a stale VAPID pairing or platform hiccup. We DO NOT
    // prune the row — that would silently disappear the teammate from the
    // team list and make them miss every future bat signal. Instead, mark
    // unhealthy and tell the client to refresh; if the refresh works, the
    // next push will clear the failure flag automatically.
    if (status === 400 || status === 403) {
      await markFailure(endpoint, status).catch(() => {})
      return NextResponse.json(
        {
          error: "Push subscription needs a refresh.",
          expired: true,  // tell the client to re-subscribe
          detail: body,
          upstreamStatus: status,
        },
        { status: 410 }
      )
    }
    // 413 — payload too big. We never send big payloads in the test, so this would
    // mean APNS is extra-picky today. Tell the user, don't auto-retry.
    if (status === 413) {
      return NextResponse.json(
        { error: "Push payload rejected as too large. Tell Tim." },
        { status: 413 }
      )
    }
    // 429 — rate limit. Backoff and retry later.
    if (status === 429) {
      return NextResponse.json(
        { error: "Push service is rate-limiting us. Wait 30s and try again." },
        { status: 429 }
      )
    }
    // Fallthrough: include upstream status in the UI so teammates can screenshot
    // something useful instead of a generic "try again."
    return NextResponse.json(
      {
        error: `Push delivery failed (${status}). Tap again to auto-refresh your subscription.`,
        detail: body,
        upstreamStatus: status,
      },
      { status: 500 }
    )
  }
}
