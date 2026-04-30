/**
 * Push subscription storage — backed by Supabase.
 *
 * Previously this was an in-memory Map on globalThis, which silently failed on
 * Vercel: every serverless function invocation can land on a different instance,
 * so subscribe() and sendNotification() routinely saw different (or empty) state.
 * Moving it to Supabase makes subscriptions shared across all instances.
 */
import { supabase } from "@/lib/supabase"
import type { PushSubscription as WebPushSubscription } from "web-push"

// Serialised shape the browser gives us via PushSubscription.toJSON().
export type StoredSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  expirationTime?: number | null
}

type Row = {
  endpoint: string
  subscription: StoredSubscription
  team_member?: string | null
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
  const { error } = await supabase
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

export async function removeSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase
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
  return data.subscription as unknown as WebPushSubscription
}

export async function getAllSubscriptions(): Promise<WebPushSubscription[]> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, subscription")
  if (error || !data) return []
  return (data as Row[]).map((r) => r.subscription as unknown as WebPushSubscription)
}

export async function countSubscriptions(): Promise<number> {
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true })
  if (error) return 0
  return count ?? 0
}
