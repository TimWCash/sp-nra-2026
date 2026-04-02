import { NextResponse } from "next/server"
import { pushStore } from "@/lib/pushStore"
import webpush from "web-push"

webpush.setVapidDetails(
  process.env.VAPID_MAILTO || "mailto:tim@servicephysics.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
)

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
  if (body.active && pushStore.size > 0) {
    const payload = JSON.stringify({
      title: "🦇 BAT SIGNAL",
      body: "Booth #7365 is SLAMMED — get back now!",
    })
    const sends = Array.from(pushStore.values()).map((sub) =>
      webpush.sendNotification(sub as webpush.PushSubscription, payload).catch(() => {
        // Remove dead subscriptions
        pushStore.delete((sub as webpush.PushSubscription).endpoint)
      })
    )
    await Promise.all(sends)
  }

  return NextResponse.json({ ...batSignalState, pushed: pushStore.size })
}
