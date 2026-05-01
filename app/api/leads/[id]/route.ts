import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * Per-lead destructive operations. Lives behind the service role key because
 * the anon RLS policy intentionally forbids DELETE — anyone holding the
 * publishable key (i.e. anyone with a browser pointed at the app) shouldn't
 * be able to wipe a row, but the team needs to be able to undo a bad capture.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params

  if (!id || !isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json(
      { error: "Server not configured to delete (SUPABASE_SERVICE_ROLE_KEY missing)" },
      { status: 500 },
    )
  }

  const { error } = await supabase.from("nra_leads").delete().eq("id", id)
  if (error) {
    console.error("DELETE /api/leads/[id] error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
