import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"

/**
 * Nightly auto-backup.
 *
 * Pulled by Vercel cron (configured in vercel.json) every day at 04:00 UTC
 * (= 11pm CT during NRA week). Pulls every row from every table out of
 * Supabase via the service-role client (RLS-bypassing), bundles it into a
 * single JSON file, and emails it as an attachment via Resend.
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}`. Vercel cron sends
 * that header automatically when CRON_SECRET is set in env. Same endpoint
 * can also be hit manually with curl + the same header for ad-hoc backups.
 *
 * Env required:
 *  - CRON_SECRET             — random string, used to auth the request
 *  - SUPABASE_SERVICE_ROLE_KEY (+ NEXT_PUBLIC_SUPABASE_URL) — DB access
 *  - RESEND_API_KEY          — Resend auth
 *  - BACKUP_EMAIL_TO         — recipient address
 */

const TABLES = [
  "nra_leads",
  "session_notes",
  "show_photos",
  "team_travel",
  "podcast_bookings",
  "bat_signal_state",
  "event_rsvps",
  "booth_shifts",
  "push_subscriptions",
] as const

// Allow GET so Vercel cron's GET request works AND so curl-from-laptop is easy.
export async function GET(req: NextRequest) {
  // ── Auth ──
  // .trim() both values — same defensive guard as VAPID env. A trailing
  // newline pasted into Vercel's env editor silently breaks comparison
  // and gives a confusing 401.
  const expected = (process.env.CRON_SECRET || "").trim()
  if (!expected) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not set" }, { status: 500 })
  }
  const authHeader = (req.headers.get("authorization") || "").trim()
  const presented = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : ""
  if (presented !== expected) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        // Length hints help diagnose paste-whitespace issues without
        // leaking secrets.
        expected_length: expected.length,
        presented_length: presented.length,
      },
      { status: 401 },
    )
  }

  // ── Env validation ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendKey = process.env.RESEND_API_KEY
  const to = process.env.BACKUP_EMAIL_TO
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Supabase env not configured" }, { status: 500 })
  }
  if (!resendKey) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set" }, { status: 500 })
  }
  if (!to) {
    return NextResponse.json({ ok: false, error: "BACKUP_EMAIL_TO not set" }, { status: 500 })
  }

  // ── Pull all tables via service role (RLS bypass) ──
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const results = await Promise.all(TABLES.map(async (t) => {
    const { data, error } = await supabase.from(t).select("*")
    return { table: t, rows: data ?? [], error: error?.message }
  }))
  const totalRows = results.reduce((sum, r) => sum + r.rows.length, 0)
  const errored = results.filter((r) => r.error).map((r) => `${r.table}: ${r.error}`)

  const today = new Date().toISOString().slice(0, 10)
  const blob = {
    exported_at: new Date().toISOString(),
    exported_by: "vercel-cron",
    project: "sp-nra-2026",
    supabase_project_ref: supabaseUrl.replace(/^https:\/\//, "").split(".")[0],
    total_rows: totalRows,
    tables: Object.fromEntries(results.map((r) => [r.table, r.rows])),
    errors: errored.length > 0 ? errored : undefined,
  }
  const json = JSON.stringify(blob, null, 2)
  const sizeKb = Math.round(Buffer.byteLength(json, "utf8") / 1024)

  // ── Send via Resend ──
  // Free tier uses onboarding@resend.dev as the from-address; emails can
  // only be sent TO the account email until a domain is verified, which is
  // fine for our single-recipient case.
  const resend = new Resend(resendKey)
  const leadCount = results.find((r) => r.table === "nra_leads")?.rows.length ?? 0
  const noteCount = results.find((r) => r.table === "session_notes")?.rows.length ?? 0
  const photoCount = results.find((r) => r.table === "show_photos")?.rows.length ?? 0

  const subject = `SP NRA backup — ${today} (${leadCount} leads · ${noteCount} notes · ${photoCount} photos · ${sizeKb} KB)`
  const text =
`Automatic nightly backup of sp-nra-2026.

Summary:
  ${leadCount} leads (with badge photos)
  ${noteCount} session notes
  ${photoCount} show photos
  ${totalRows} total rows across ${TABLES.length} tables
  ${sizeKb} KB JSON file attached

Project: ${blob.supabase_project_ref}.supabase.co
Exported: ${blob.exported_at}
${errored.length > 0 ? "\n⚠ Errors:\n  " + errored.join("\n  ") + "\n" : ""}
Save this file somewhere safe (iCloud / Drive / wherever). Same data you'd
get from More → Download backup in the app.`

  const sendRes = await resend.emails.send({
    from: process.env.BACKUP_EMAIL_FROM || "onboarding@resend.dev",
    to,
    subject,
    text,
    attachments: [
      {
        filename: `sp-nra-2026-backup-${today}.json`,
        content: Buffer.from(json, "utf8"),
      },
    ],
  })

  if (sendRes.error) {
    return NextResponse.json(
      { ok: false, error: `Resend rejected: ${sendRes.error.message}`, totalRows, sizeKb },
      { status: 500 },
    )
  }
  return NextResponse.json({
    ok: true,
    totalRows,
    sizeKb,
    leadCount,
    noteCount,
    photoCount,
    sentTo: to,
    resendId: sendRes.data?.id,
    errored,
  })
}
