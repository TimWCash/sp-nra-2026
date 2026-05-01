import { NextRequest, NextResponse } from "next/server"

const SHEET_ID = "1cVKkjbGmIiZO5jbVvPXmnLKvwR0LaTXDiDuisLjOBhU"

// Defensive caps so a malformed payload can't write garbage rows or hit
// Sheets cell-size limits. Set generously above any realistic lead.
const MAX_SHORT = 500
const MAX_NOTES = 4_000
const MAX_PHOTO = 200_000  // base64 photo, slightly above the client-side cap

function trimStr(v: unknown, max: number): string {
  if (typeof v !== "string") return ""
  return v.length > max ? v.slice(0, max) : v
}

type ValidatedLead = {
  name: string
  company: string
  role: string
  contact: string
  heat: string  // hot | warm | cool | ""
  notes: string
  capturedBy: string
  badgePhoto: string
}

function validate(data: unknown): { ok: true; value: ValidatedLead } | { ok: false; error: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Body must be a JSON object." }
  }
  const r = data as Record<string, unknown>
  const heatRaw = typeof r.heat === "string" ? r.heat : ""
  const heat = heatRaw === "hot" || heatRaw === "warm" || heatRaw === "cool" ? heatRaw : ""
  const value: ValidatedLead = {
    name: trimStr(r.name, MAX_SHORT),
    company: trimStr(r.company, MAX_SHORT),
    role: trimStr(r.role, MAX_SHORT),
    contact: trimStr(r.contact, MAX_SHORT),
    heat,
    notes: trimStr(r.notes, MAX_NOTES),
    capturedBy: trimStr(r.capturedBy, MAX_SHORT),
    badgePhoto: trimStr(r.badgePhoto, MAX_PHOTO),
  }
  // Refuse completely empty rows — most likely a misfire from a stale client.
  if (!value.name && !value.company && !value.contact) {
    return { ok: false, error: "Lead must have at least name, company, or contact." }
  }
  return { ok: true, value }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const validated = validate(raw)
    if (!validated.ok) {
      return NextResponse.json({ status: "error", message: validated.error }, { status: 400 })
    }
    const data = validated.value

    // Use Google Sheets API v4 with API key for public sheets,
    // or service account if configured
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

    if (serviceAccountJson) {
      // Service account approach (full API access)
      const { google } = await import("googleapis")
      const credentials = JSON.parse(serviceAccountJson)
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      })
      const sheets = google.sheets({ version: "v4", auth })

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: "Sheet1!A:I",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            new Date().toISOString(),
            data.name || "",
            data.company || "",
            data.role || "",
            data.contact || "",
            data.heat || "",
            data.notes || "",
            data.capturedBy || "",
            data.badgePhoto || "",
          ]],
        },
      })

      return NextResponse.json({ status: "ok" })
    }

    // Fallback: Use Google Apps Script webhook if configured
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(data),
        redirect: "follow",
      })
      // Apps Script redirects — just check we got something back
      const text = await res.text()
      try {
        const json = JSON.parse(text)
        if (json.status === "ok") return NextResponse.json({ status: "ok" })
      } catch {
        // Sometimes the redirect response isn't JSON
      }
      // If we got here without error, it probably worked
      if (res.ok || res.status === 302) {
        return NextResponse.json({ status: "ok" })
      }
      return NextResponse.json({ status: "error", message: "Webhook failed" }, { status: 500 })
    }

    return NextResponse.json({ status: "error", message: "No Google Sheets credentials configured" }, { status: 500 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Sheets sync error:", message)
    return NextResponse.json({ status: "error", message }, { status: 500 })
  }
}
