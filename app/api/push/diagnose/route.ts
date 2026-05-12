import { NextResponse } from "next/server"

/**
 * One-shot diagnostic for VAPID configuration.
 *
 * Goal: figure out WHY webpush.setVapidDetails() is throwing in the
 * bat-signal route. Returns a JSON blob describing exactly what's wrong
 * without exposing secret material — just key shapes/lengths and the
 * verbatim error message web-push raised.
 *
 * Safe to leave in production: doesn't reveal the private key, doesn't
 * send any push, doesn't write to the DB.
 */

function safeLen(v: string | undefined): number {
  return typeof v === "string" ? v.length : -1
}

function safeStartsEnds(v: string | undefined): string {
  if (typeof v !== "string" || v.length < 6) return "(missing or too short)"
  return `${v.slice(0, 4)}…${v.slice(-3)} (len ${v.length})`
}

function looksLikeBase64Url(v: string | undefined): boolean {
  if (typeof v !== "string") return false
  // Base64URL: A–Z a–z 0–9 - _ (no padding for our use)
  return /^[A-Za-z0-9_-]+$/.test(v)
}

export async function GET() {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidMailto = process.env.VAPID_MAILTO || "mailto:tim@servicephysics.com"

  const out: Record<string, unknown> = {
    env: {
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: {
        present: !!vapidPublic,
        length: safeLen(vapidPublic),
        preview: safeStartsEnds(vapidPublic),
        expected_length: 87,  // 65 raw bytes → ~87 base64url chars
        looks_base64url: looksLikeBase64Url(vapidPublic),
        has_leading_or_trailing_whitespace:
          typeof vapidPublic === "string" && vapidPublic !== vapidPublic.trim(),
      },
      VAPID_PRIVATE_KEY: {
        present: !!vapidPrivate,
        length: safeLen(vapidPrivate),
        // intentionally don't preview the private key value
        expected_length: 43,  // 32 raw bytes → ~43 base64url chars
        looks_base64url: looksLikeBase64Url(vapidPrivate),
        has_leading_or_trailing_whitespace:
          typeof vapidPrivate === "string" && vapidPrivate !== vapidPrivate.trim(),
      },
      VAPID_MAILTO: vapidMailto,
    },
  }

  // Try setVapidDetails — this is the call that's throwing in bat-signal.
  let setVapidResult: string = "not_attempted"
  let setVapidError: string | null = null
  try {
    const webpush = (await import("web-push")).default
    webpush.setVapidDetails(vapidMailto, vapidPublic || "", vapidPrivate || "")
    setVapidResult = "ok"
  } catch (err) {
    setVapidResult = "threw"
    setVapidError = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
  }
  out.setVapidDetails = { result: setVapidResult, error: setVapidError }

  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } })
}
