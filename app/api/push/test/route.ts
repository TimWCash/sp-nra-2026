import { NextResponse } from "next/server"
import { getSubscription, removeSubscription } from "@/lib/pushStore"

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
    return NextResponse.json(
      { error: "Subscription not registered on server. Re-enable notifications and try again." },
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
    return NextResponse.json({ ok: true })
  } catch (err) {
    // If the subscription is stale/expired, drop it so the client can re-subscribe.
    const status = (err as { statusCode?: number } | null)?.statusCode ?? 500
    if (status === 404 || status === 410) {
      await removeSubscription(endpoint)
    }
    console.error("Test push error:", err)
    return NextResponse.json(
      { error: "Could not deliver push — the subscription may have expired. Re-enable notifications." },
      { status: 500 }
    )
  }
}
