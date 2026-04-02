import { NextResponse } from "next/server"

// Module-level state — persists across requests on the same warm instance
// Good enough for a 4-day trade show with 5 users
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
  return NextResponse.json(batSignalState)
}
