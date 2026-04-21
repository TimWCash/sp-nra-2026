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
}

export async function addSubscription(sub: StoredSubscription): Promise<void> {
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { endpoint: sub.endpoint, subscription: sub, last_used_at: new Date().toISOString() },
      { onConflict: "endpoint" }
    )
  if (error) throw error
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
