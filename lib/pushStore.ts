/**
 * Push subscription storage — backed by Supabase.
 *
 * Previously this was an in-memory Map on globalThis, which silently failed on
 * Vercel: every serverless function invocation can land on a different instance,
 * so subscribe() and sendNotification() routinely saw different (or empty) state.
 * Moving it to Supabase makes subscriptions shared across all instances.
 *
 * Read paths (count, get, getAll, getRegisteredNames) use the publishable
 * client because they're called from both client + server. RLS allows anon
 * SELECT on push_subscriptions.
 *
 * Write paths (addSubscription, removeSubscription, markFailure, clearFailure)
 * use the SERVICE ROLE client. They're only ever called from server-side API
 * routes. RLS forbids anon INSERT/UPDATE/DELETE on push_subscriptions —
 * which means a leaked publishable key can't wipe the team's bat signal
 * subscriber list (the round-2 review caught this exact attack).
 *
 * If SUPABASE_SERVICE_ROLE_KEY isn't set in the env, write paths log a loud
 * warning and fall back to the anon client — registration works (anon INSERT
 * via the upsert ignoreDuplicates path) but the security guarantee is lost
 * and DELETEs/UPDATEs fail. The fallback is intentional so the app doesn't
 * become totally non-functional during the env-var rollout window.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { PushSubscription as WebPushSubscription } from "web-push"

let _serviceClient: SupabaseClient | null | undefined

/** Returns the service-role-backed client, or anon as fallback. */
function getWriteClient(): SupabaseClient {
  if (_serviceClient !== undefined) return _serviceClient ?? supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.warn(
      "[pushStore] SUPABASE_SERVICE_ROLE_KEY is not set — falling back to the anon client. " +
      "Push subscription writes will fail RLS until the env var is configured.",
    )
    _serviceClient = null
    return supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true })
  if (error) return 0
  return count ?? 0
}
