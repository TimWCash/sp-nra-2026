import { NextResponse } from "next/server"
import { addSubscription, countSubscriptions } from "@/lib/pushStore"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Body now is either the legacy raw subscription, OR { subscription, teamMember }.
    // Support both so a stale client during deploy doesn't break.
    const sub = body?.subscription ?? body
    const teamMember: string | undefined = typeof body?.teamMember === "string" ? body.teamMember : undefined
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }
    await addSubscription(sub, teamMember)
    const count = await countSubscriptions()
    return NextResponse.json({ ok: true, count })
  } catch (err) {
    console.error("Push subscribe error:", err)
    return NextResponse.json({ error: "Failed to store subscription" }, { status: 500 })
  }
}

// DELETE handler intentionally REMOVED.
//
// Round-4 review correctly identified a "confused deputy" attack: even though
// RLS forbids anon DELETE on push_subscriptions directly, an attacker holding
// the publishable key could SELECT every endpoint, then call this route's
// DELETE handler with each endpoint, using OUR service-role privileges to
// wipe the team's bat-signal subscriber list.
//
// Killing the route entirely closes that vector. Dead subscriptions clean up
// naturally via the bat-signal fan-out's 404/410 pruning, so we don't need
// a client-initiated unsubscribe path. The previous force-fresh logic in
// SetupPage.tsx still calls this endpoint for safety, but the fetch will
// 405 silently and the next bat signal prunes the dead row.
