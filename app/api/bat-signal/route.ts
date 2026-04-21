import { NextResponse } from "next/server"
import { getAllSubscriptions, removeSubscription, countSubscriptions } from "@/lib/pushStore"
import type { PushSubscription } from "web-push"

let batSignalState = { active: false, since: 0 }

export async function GET() {
  return NextResponse.json(batSignalState, {
    headers: { "Cache-Control": "no-store" },
  })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  batSignalState = {
    active: !!body.active,
    since: body.active ? Date.now() : 0,
  }

  // Fire push notifications to all subscribed devices when activating
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidMailto = process.env.VAPID_MAILTO || "mailto:tim@servicephysics.com"

  let pushed = 0
  let failed = 0

  if (body.active && vapidPublic && vapidPrivate) {
    try {
      const subs = await getAllSubscriptions()
      if (subs.length > 0) {
        const webpush = (await import("web-push")).default
        webpush.setVapidDetails(vapidMailto, vapidPublic, vapidPrivate)
        const payload = JSON.stringify({
          title: "🦇 BAT SIGNAL",
          body: "Booth #7365 is SLAMMED — get back now!",
        })
        const results = await Promise.allSettled(
          subs.map((sub) =>
            webpush.sendNotification(sub as PushSubscription, payload).catch(async (err) => {
              const status = (err as { statusCode?: number } | null)?.statusCode ?? 0
              // 404 / 410 = subscription is dead; prune it.
              if (status === 404 || status === 410) {
                await removeSubscription((sub as PushSubscription).endpoint)
              }
              throw err
            })
          )
        )
        pushed = results.filter((r) => r.status === "fulfilled").length
        failed = results.filter((r) => r.status === "rejected").length
      }
    } catch (err) {
      console.error("Push notification error:", err)
    }
  }

  const total = await countSubscriptions().catch(() => 0)
  return NextResponse.json({ ...batSignalState, pushed, failed, total })
}
