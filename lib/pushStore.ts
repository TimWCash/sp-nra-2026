/**
 * Push subscription storage — backed by Supabase, server-side ONLY.
 *
 * Previously this was an in-memory Map on globalThis, which silently failed on
 * Vercel: every serverless function invocation can land on a different instance,
 * so subscribe() and sendNotification() routinely saw different (or empty) state.
 * Moving it to Supabase makes subscriptions shared across all instances.
 *
 * Hardening (round 4):
 * - `import "server-only"` makes this module a build-error if it's ever
 *   pulled into a client component bundle. The service role key must never
 *   ship to the browser.
 * - All operations (read AND write) use the SERVICE ROLE client. With anon
 *   SELECT removed from push_subscriptions in RLS, the publishable key can't
 *   read or write the table at all — every interaction goes through the
 *   server routes that import this module.
 * - Missing SUPABASE_SERVICE_ROLE_KEY is now a HARD ERROR, not a fallback.
 *   The app should fail loudly at the first request rather than degrade
 *   confusingly.
 */
import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { PushSubscription as WebPushSubscription } from "web-push"

let _serviceClient: SupabaseClient | undefined

/**
 * Returns the service-role-backed Supabase client. Throws hard if the env
 * var is missing — round-4 review correctly noted that the previous "fall
 * back to anon" behavior just turned a config error into a confusing
 * runtime failure mode.
 */
function getWriteClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error("Server misconfigured: NEXT_PUBLIC_SUPABASE_URL is missing")
  if (!serviceKey) {
    throw new Error(
      "Server misconfigured: SUPABASE_SERVICE_ROLE_KEY is missing — push subscription " +
      "operations cannot proceed. Set the env var on Vercel and redeploy.",
    )
  }
  _serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _serviceClient
}

// Serialised shape the browser gives us via PushSubscription.toJSON().
export type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  expirationTime?: number | null
}

/**
 * Validate a value claims-to-be-a-PushSubscription before we hand it to
 * web-push. web-push will throw a confusing error if the subscription is
 * malformed; this lets us surface a clear "bad row" message instead.
 */
export function isValidStoredSubscription(v: unknown): v is StoredSubscription {
  if (!v || typeof v !== "object") return false
  const r = v as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  return (
    typeof r.endpoint === "string" && r.endpoint.length > 0 &&
    !!r.keys &&
    typeof r.keys.p256dh === "string" && r.keys.p256dh.length > 0 &&
    typeof r.keys.auth === "string" && r.keys.auth.length > 0
  )
}

type Row = {
  endpoint: string
  subscription: StoredSubscription
  team_member?: string | null
  last_failure_at?: string | null
  last_failure_status?: number | null
  failure_count?: number | null
}

export async function addSubscription(
  sub: StoredSubscription,
  teamMember?: string,
): Promise<void> {
  const row: Record<string, unknown> = {
    endpoint: sub.endpoint,
    subscription: sub,
    last_used_at: new Date().toISOString(),
  }
  // Only set team_member if we have one — avoids clobbering an existing name
  // when an unidentified retry comes through. ("" still wipes; undefined skips.)
  if (teamMember && teamMember.trim()) row.team_member = teamMember.trim()
  const { error } = await getWriteClient()
    .from("push_subscriptions")
    .upsert(row, { onConflict: "endpoint" })
  if (error) throw error
}

/**
 * Names of every teammate who currently has a push subscription on file.
 * Used by Team Status to show which teammates are still missing from setup.
 */
export async function getRegisteredNames(): Promise<string[]> {
  const { data, error } = await getWriteClient()
    .from("push_subscriptions")
    .select("team_member")
  if (error || !data) return []
  const names = (data as { team_member: string | null }[])
    .map((r) => (r.team_member || "").trim())
    .filter(Boolean)
  // Dedupe — one teammate may have two devices.
  return Array.from(new Set(names))
}

/**
 * Mark a subscription as having failed. We bump a failure counter rather
 * than auto-prune on first failure — APNS / FCM can return 400/403 for
 * transient reasons (rate limiting, brief platform hiccup), and pruning
 * eagerly means the teammate misses every subsequent bat signal until they
 * manually re-run setup. The drift detector + auto-recover already handle
 * stale subs on the next app open.
 */
export async function markFailure(endpoint: string, status: number): Promise<void> {
  const client = getWriteClient()
  // Read-then-write to bump the counter — Supabase doesn't expose an atomic
  // increment via the REST client, but we don't need atomicity here (the
  // counter is advisory display only, not a gate).
  const { data } = await client
    .from("push_subscriptions")
    .select("failure_count")
    .eq("endpoint", endpoint)
    .maybeSingle<{ failure_count: number | null }>()
  const next = (data?.failure_count ?? 0) + 1
  await client
    .from("push_subscriptions")
    .update({
      last_failure_at: new Date().toISOString(),
      last_failure_status: status,
      failure_count: next,
    })
    .eq("endpoint", endpoint)
}

/**
 * Clear failure state — called on a successful push delivery, so a sub
 * that recovers (e.g. APNS rate limit subsides) stops showing "unhealthy"
 * in the UI.
 */
export async function clearFailure(endpoint: string): Promise<void> {
  await getWriteClient()
    .from("push_subscriptions")
    .update({
      last_failure_at: null,
      last_failure_status: null,
      failure_count: 0,
    })
    .eq("endpoint", endpoint)
}

export type UnhealthySub = {
  endpoint: string
  team_member: string
  last_failure_status: number | null
  failure_count: number
}

/**
 * Subscriptions that have recorded a failure but haven't been pruned —
 * surfaced in TeamStatusPage so the team can see who's at risk before
 * a bat signal goes out instead of after.
 */
export async function getUnhealthySubs(): Promise<UnhealthySub[]> {
  const { data, error } = await getWriteClient()
    .from("push_subscriptions")
    .select("endpoint, team_member, last_failure_status, failure_count")
    .gt("failure_count", 0)
  if (error || !data) return []
  return (data as Array<{
    endpoint: string
    team_member: string | null
    last_failure_status: number | null
    failure_count: number | null
  }>).map((r) => ({
    endpoint: r.endpoint,
    team_member: r.team_member || "",
    last_failure_status: r.last_failure_status,
    failure_count: r.failure_count ?? 0,
  }))
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const { error } = await getWriteClient()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
  if (error) throw error
}

export async function getSubscription(
  endpoint: string
): Promise<WebPushSubscription | null> {
  const { data, error } = await getWriteClient()
    .from("push_subscriptions")
    .select("endpoint, subscription")
    .eq("endpoint", endpoint)
    .maybeSingle<Row>()
  if (error || !data) return null
  if (!isValidStoredSubscription(data.subscription)) {
    console.warn("getSubscription: row failed validation, ignoring", endpoint.slice(0, 60))
    return null
  }
  return data.subscription as unknown as WebPushSubscription
}

export async function getAllSubscriptions(): Promise<WebPushSubscription[]> {
  const { data, error } = await getWriteClient()
    .from("push_subscriptions")
    .select("endpoint, subscription")
  if (error || !data) return []
  // Filter out garbage rows so a single corrupt subscription doesn't take
  // down the whole bat-signal fan-out with an obscure web-push error.
  return (data as Row[])
    .filter((r) => isValidStoredSubscription(r.subscription))
    .map((r) => r.subscription as unknown as WebPushSubscription)
}

export async function countSubscriptions(): Promise<number> {
  const { count, error } = await getWriteClient()
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true })
  if (error) return 0
  return count ?? 0
}
