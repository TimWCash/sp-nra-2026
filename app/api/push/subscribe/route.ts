import { NextResponse } from "next/server"
import { addSubscription, removeSubscription, countSubscriptions } from "@/lib/pushStore"

export async function POST(req: Request) {
  try {
    const sub = await req.json()
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }
    await addSubscription(sub)
    const count = await countSubscriptions()
    return NextResponse.json({ ok: true, count })
  } catch (err) {
    console.error("Push subscribe error:", err)
    return NextResponse.json({ error: "Failed to store subscription" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    await removeSubscription(endpoint)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Push unsubscribe error:", err)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
