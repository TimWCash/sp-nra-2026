import { NextResponse } from "next/server"
import { pushStore } from "@/lib/pushStore"

export async function POST(req: Request) {
  try {
    const sub = await req.json()
    if (!sub?.endpoint) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    pushStore.set(sub.endpoint, sub)
    return NextResponse.json({ ok: true, count: pushStore.size })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json()
    pushStore.delete(endpoint)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
