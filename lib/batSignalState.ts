/**
 * Bat Signal active/inactive state — backed by Supabase.
 *
 * Was a module-level `let` on the API route. That silently broke on Vercel
 * because each serverless invocation can land on a different instance: a POST
 * setting active=true on instance A would be invisible to a GET hitting
 * instance B until instance A happened to handle it again. State now lives
 * in a single-row table so every instance reads the same truth.
 */
import { supabase } from "@/lib/supabase"

export type BatSignalState = {
  active: boolean
  since: number  // ms epoch; 0 when inactive (UI uses 0 as "not active")
}

/** Inactive default — used when the row hasn't been seeded yet or fetch fails. */
const INACTIVE: BatSignalState = { active: false, since: 0 }

export async function getBatSignalState(): Promise<BatSignalState> {
  const { data, error } = await supabase
    .from("bat_signal_state")
    .select("active, since")
    .eq("id", 1)
    .maybeSingle<{ active: boolean; since: string | null }>()
  if (error || !data) return INACTIVE
  return {
    active: !!data.active,
    since: data.since ? new Date(data.since).getTime() : 0,
  }
}

/**
 * Persist new state. Returns true on success — caller should treat false as
 * "do not proceed with side effects" (e.g. don't fan out push if we couldn't
 * even record that the signal fired).
 */
export async function setBatSignalState(active: boolean): Promise<boolean> {
  const since = active ? new Date().toISOString() : null
  const { error } = await supabase
    .from("bat_signal_state")
    .upsert({ id: 1, active, since }, { onConflict: "id" })
  if (error) {
    console.error("Failed to persist bat-signal state:", error)
    return false
  }
  return true
}
