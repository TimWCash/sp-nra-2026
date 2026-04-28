/**
 * Offline durability for leads.
 *
 * The existing flow wrote straight to Supabase and silently dropped the lead
 * when the device had no connection. That's dangerous during a trade show —
 * McCormick Place Wi-Fi is spotty, and a lost lead is a lost conversation.
 *
 * This module sits in front of Supabase and provides:
 *   - A local cache of the last-known server snapshot so the leads list still
 *     renders offline.
 *   - A pending-writes queue (localStorage) for leads captured offline, with
 *     client-generated UUIDs so the same lead can be retried idempotently.
 *   - A flush routine that drains the queue when the device reconnects.
 *
 * Google Sheets mirroring is unchanged — see `lib/sheets-sync.ts`. A lead's
 * journey is now:
 *     user saves → optimistic local state + pending queue →
 *     Supabase insert (retries on reconnect) → Sheets sync (retries on reconnect)
 */

import type { Lead, HeatLevel } from "@/components/leads/useLeads"
import type { SupabaseClient } from "@supabase/supabase-js"

const CACHE_KEY = "sp_nra_leads_cache"
const PENDING_KEY = "sp_nra_leads_pending_supabase"

// Data we queue for the Supabase insert. Alias of Lead today; separate name so
// callers can distinguish "in-memory UI lead" from "lead awaiting server write."
export type PendingLead = Lead

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

// ── Cache of last-known server state ──────────────────────────────────────

export function cacheLeads(leads: Lead[]): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(leads)) } catch { /* quota */ }
}

export function loadCachedLeads(): Lead[] {
  if (typeof window === "undefined") return []
  return safeParse<Lead[]>(localStorage.getItem(CACHE_KEY), [])
}

// ── Pending Supabase writes ───────────────────────────────────────────────

export function getPendingLeads(): PendingLead[] {
  if (typeof window === "undefined") return []
  return safeParse<PendingLead[]>(localStorage.getItem(PENDING_KEY), [])
}

export function getPendingCount(): number {
  return getPendingLeads().length
}

function savePending(leads: PendingLead[]): void {
  localStorage.setItem(PENDING_KEY, JSON.stringify(leads))
}

export function queueLead(lead: PendingLead): void {
  const pending = getPendingLeads()
  if (pending.some((p) => p.id === lead.id)) return
  savePending([...pending, lead])
}

export function dequeueLead(id: string): void {
  savePending(getPendingLeads().filter((p) => p.id !== id))
}

// ── Insert + flush ────────────────────────────────────────────────────────

interface LeadInsertRow {
  id: string
  name: string
  company: string
  role: string
  contact: string
  notes: string
  heat: HeatLevel
  badge_photo: string
  captured_by: string
  follow_up: boolean
}

function toRow(lead: Lead): LeadInsertRow {
  return {
    id: lead.id,
    name: lead.name,
    company: lead.company || "",
    role: lead.role || "",
    contact: lead.contact || "",
    notes: lead.notes || "",
    heat: lead.heat,
    badge_photo: lead.badgePhoto || "",
    captured_by: lead.capturedBy || "",
    follow_up: !!lead.followUp,
  }
}

/**
 * Try to insert a single lead into Supabase. Returns true on success.
 * The caller decides whether to queue on failure.
 */
export async function insertLead(
  supabase: SupabaseClient,
  lead: Lead,
): Promise<boolean> {
  // upsert by id with ignoreDuplicates so a retried offline insert can't
  // produce duplicates if the row somehow got through a previous attempt,
  // and so we don't accidentally do an UPDATE under tighter RLS.
  const { error } = await supabase
    .from("nra_leads")
    .upsert(toRow(lead), { onConflict: "id", ignoreDuplicates: true })
  return !error
}

/**
 * Drain the pending queue into Supabase. Returns the count of successful inserts.
 * Leaves any that fail in the queue for the next attempt.
 */
export async function flushPending(supabase: SupabaseClient): Promise<number> {
  const pending = getPendingLeads()
  if (pending.length === 0) return 0

  let synced = 0
  const stillPending: PendingLead[] = []

  for (const lead of pending) {
    const ok = await insertLead(supabase, lead)
    if (ok) synced++
    else stillPending.push(lead)
  }

  savePending(stillPending)
  return synced
}
