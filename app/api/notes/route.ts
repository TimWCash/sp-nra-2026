import { NextRequest, NextResponse } from "next/server"

/**
 * Mirror session notes into the team's Google Sheet, on a "Notes" tab
 * (separate from "Sheet1" which holds the leads).
 *
 * Best-effort by design: the source of truth for notes is Supabase, and
 * /api/push/diagnose-style backup pulls everything anyway. This route
 * exists so the team can quickly scan notes in the same Sheet they use
 * for leads, without going through the app.
 *
 * Auto-creates the "Notes" tab on first call so Tim doesn't have to do
 * any Sheets setup. Idempotent — "already exists" errors are swallowed.
 */

const SHEET_ID = "1cVKkjbGmIiZO5jbVvPXmnLKvwR0LaTXDiDuisLjOBhU"
const TAB_NAME = "Notes"

type NotePayload = {
  session_title: string
  session_day: string
  author: string
  content: string
  created_at?: string
}

function validate(raw: unknown): { ok: true; value: NotePayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Body must be a JSON object" }
  const r = raw as Record<string, unknown>
  const ss = (v: unknown, max = 4000): string => (typeof v === "string" ? v.slice(0, max) : "")
  const value: NotePayload = {
    session_title: ss(r.session_title, 300),
    session_day: ss(r.session_day, 20),
    author: ss(r.author, 100),
    content: ss(r.content, 4000),
    created_at: ss(r.created_at, 50),
  }
  if (!value.content.trim()) return { ok: false, error: "Note content is empty" }
  return { ok: true, value }
}

/**
 * Ensure the "Notes" tab exists on the Sheet. If a 400 comes back saying
 * the sheet already exists, that's success — we just need it present.
 */
async function ensureNotesTabExists(sheets: ReturnType<typeof import("googleapis").google.sheets>): Promise<void> {
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: TAB_NAME },
            },
          },
        ],
      },
    })
    // Seed the header row immediately after creation so a fresh tab is human-readable.
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [["Timestamp", "Day", "Session", "Author", "Note"]],
      },
    })
  } catch (err: unknown) {
    // "Sheet with name 'Notes' already exists" — that's fine, it's what we wanted.
    const msg = (err as { message?: string } | null)?.message || ""
    if (msg.includes("already exists")) return
    // Other errors propagate to the caller.
    throw err
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const validated = validate(raw)
    if (!validated.ok) {
      return NextResponse.json({ status: "error", message: validated.error }, { status: 400 })
    }
    const data = validated.value

    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    if (!serviceAccountJson) {
      return NextResponse.json(
        { status: "error", message: "GOOGLE_SERVICE_ACCOUNT_JSON not configured" },
        { status: 500 },
      )
    }

    const { google } = await import("googleapis")
    const credentials = JSON.parse(serviceAccountJson)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })
    const sheets = google.sheets({ version: "v4", auth })

    // First call auto-creates the tab + header; subsequent calls are no-ops.
    await ensureNotesTabExists(sheets)

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          data.created_at || new Date().toISOString(),
          data.session_day,
          data.session_title,
          data.author,
          data.content,
        ]],
      },
    })

    return NextResponse.json({ status: "ok" })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Notes sheet sync error:", message)
    return NextResponse.json({ status: "error", message }, { status: 500 })
  }
}
