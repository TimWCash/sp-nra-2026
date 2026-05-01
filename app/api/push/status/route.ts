import { NextResponse } from "next/server"
import { countSubscriptions, getRegisteredNames } from "@/lib/pushStore"

/**
 * Public read endpoint for the team-status UI.
 *
 * Replaces the prior direct-from-Supabase SELECT in TeamStatusPage. With
 * push_subscriptions locked down to service-role-only access, the client
 * can't read the table directly — instead it asks the server for the
 * minimal information it needs (count + registered teammate names) without
 * leaking endpoint URLs.
 *
 * Cached briefly so a polling Team Status page doesn't hammer the DB.
 */
export async function GET() {
  try {
    const [count, registeredNames] = await Promise.all([
      countSubscriptions().catch(() => 0),
      getRegisteredNames().catch(() => [] as string[]),
    ])
    return NextResponse.json(
      { count, registeredNames },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("/api/push/status error:", err)
    return NextResponse.json({ count: 0, registeredNames: [] }, { status: 500 })
  }
}
