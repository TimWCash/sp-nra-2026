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
import { withLock } from "@/lib/web-lock"

const CACHE_KEY = "sp_nra_leads_cache"
const PENDING_KEY = "sp_nra_leads_pending_supabase"
const PENDING_DELETES_KEY = "sp_nra_leads_pending_deletes"
// One Web Lock name covers all leads-queue mutations + flushes. Enqueue
// and flush calls serialize through it, so two-tab races are eliminated.
const QUEUE_LOCK = "nra-leads-queue"

export type Result<T = void> = { ok: true; value?: T } | { ok: false; error: string }

// Data we queue for the Supabase insert. Alias of Lead today; separate name so
// callers can distinguish "in-memory UI lead" from "lead awaiting server write."
export type PendingLead = Lead

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

// ── Cache of last-known server state ──────────────────────────────────────

export function cacheLeads(leads: Lead[]): Result {
  if (typeof window === "undefined") return { ok: false, error: "SSR" }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(leads))
    return { ok: true }
  } catch {
    // Quota exhaustion — cache is best-effort, not the source of truth.
    return { ok: false, error: "Local cache full — list view may be stale." }
  }
}

export function loadCachedLeads(): Lead[] {
  if (typeof window === "undefined") return []
  return safeParse<Lead[]>(localStorage.getItem(CACHE_KEY), [])
}

// (Lock helper now lives in lib/web-lock.ts using the Web Locks API.)

// ── Pending Supabase writes ───────────────────────────────────────────────

export function getPendingLeads(): PendingLead[] {
  if (typeof window === "undefined") return []
  return safeParse<PendingLead[]>(localStorage.getItem(PENDING_KEY), [])
}

export function getPendingCount(): number {
  return getPendingLeads().length
}

function savePending(leads: PendingLead[]): Result {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(leads))
    return { ok: true }
  } catch {
    return { ok: false, error: "Storage full — could not save lead offline." }
  }
}

/**
 * Queue a lead for upsert. Last-write-wins: if an entry with this id is
 * already in the queue (e.g. an offline-created lead the user just toggled
 * a follow-up on), the new state replaces the old one.
 *
 * Cross-tab safety: the read-mutate-write block is held in a Web Lock so
 * two tabs queueing different leads at the same instant can't lose either
 * one (round-3 review caught this exact race).
 *
 * Returns Result so the caller can refuse to show "saved" if the storage
 * write failed (quota exhausted, private browsing, etc.).
 */
export async function queueLead(lead: PendingLead): Promise<Result> {
  const result = await withLock(QUEUE_LOCK, () => {
    const pending = getPendingLeads()
    const existingIdx = pending.findIndex((p) => p.id === lead.id)
    if (existingIdx >= 0) {
      pending[existingIdx] = lead
      return savePending(pending)
    }
    return savePending([...pending, lead])
  })
  // withLock returns null only if the runtime lacks Web Locks AND we asked
  // for ifAvailable — we didn't, so this branch is unreachable in practice.
  return result ?? { ok: false, error: "Queue lock unavailable." }
}

export async function dequeueLead(id: string): Promise<void> {
  await withLock(QUEUE_LOCK, () => {
    const next = getPendingLeads().filter((p) => p.id !== id)
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  })
}

// ── Pending deletes ──────────────────────────────────────────────────────
//
// Anon RLS forbids DELETE, so deletes go through /api/leads/[id] (which
// uses the service role key). Deletes that fail offline get queued here
// and retried on reconnect.

export function getPendingDeleteIds(): string[] {
  if (typeof window === "undefined") return []
  return safeParse<string[]>(localStorage.getItem(PENDING_DELETES_KEY), [])
}

export function getPendingDeleteCount(): number {
  return getPendingDeleteIds().length
}

function savePendingDeletes(ids: string[]): Result {
  try {
    localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(ids))
    return { ok: true }
  } catch {
    return { ok: false, error: "Storage full — could not record delete offline." }
  }
}

export async function queueDelete(id: string): Promise<Result> {
  // If the lead is still in the upsert queue (offline-created, never synced),
  // a delete means "user changed their mind" — drop from the upsert queue
  // entirely so we never push it to the server in the first place. Done
  // inside the same lock so the upsert + delete queues stay consistent.
  const result = await withLock(QUEUE_LOCK, () => {
    const nextPending = getPendingLeads().filter((p) => p.id !== id)
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(nextPending)) } catch { /* ignore */ }

    const ids = getPendingDeleteIds()
    if (ids.includes(id)) return { ok: true } as Result
    return savePendingDeletes([...ids, id])
  })
  return result ?? { ok: false, error: "Queue lock unavailable." }
}

export async function dequeueDelete(id: string): Promise<void> {
  await withLock(QUEUE_LOCK, () => {
    const next = getPendingDeleteIds().filter((x) => x !== id)
    try { localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  })
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
 * Try to upsert a single lead into Supabase. Returns true on success.
 *
 * Used by both addLead (insert) and toggleFollowUp (update) — Postgres's
 * INSERT ... ON CONFLICT DO UPDATE handles both cases. The anon RLS policy
 * grants SELECT/INSERT/UPDATE (but not DELETE) so this works from the
 * client without going through a server route.
 */
export async function insertLead(
  supabase: SupabaseClient,
  lead: Lead,
): Promise<boolean> {
  const { error } = await supabase
    .from("nra_leads")
    .upsert(toRow(lead), { onConflict: "id" })
  return !error
}

/**
 * Drain the pending upsert queue into Supabase. Returns the count of
 * successful upserts. Anything that fails stays in the queue for the next
 * attempt.
 *
 * Race-safety:
 * - Acquires a localStorage flush lock so two flushes (e.g. mount + online
 *   event firing simultaneously, or a second tab in the same PWA) can't
 *   step on each other.
 * - Re-reads the queue right before each save so a queueLead call that
 *   lands DURING the flush isn't clobbered by a stale in-memory snapshot.
 * - Removes only the IDs we actually synced — never replaces the full
 *   queue with an old snapshot.
 */
export async function flushPending(supabase: SupabaseClient): Promise<number> {
  // ifAvailable: skip if another tab is already flushing — its work covers ours.
  const result = await withLock(QUEUE_LOCK, async () => {
    const snapshot = getPendingLeads()
    if (snapshot.length === 0) return 0
    let synced = 0
    for (const lead of snapshot) {
      const ok = await insertLead(supabase, lead)
      if (ok) {
        const next = getPendingLeads().filter((p) => p.id !== lead.id)
        try { localStorage.setItem(PENDING_KEY, JSON.stringify(next)) } catch { /* keep going */ }
        synced++
      }
    }
    return synced
  }, { ifAvailable: true })
  return result ?? 0
}

/**
 * Drain the pending-deletes queue. Each id is sent to /api/leads/[id]
 * (server-side service-role delete). Returns the count of successful
 * deletes. Failures stay queued. Same lock + re-read pattern as upserts.
 */
export async function flushDeletes(): Promise<number> {
  const result = await withLock(QUEUE_LOCK, async () => {
    const ids = getPendingDeleteIds()
    if (ids.length === 0) return 0
    let synced = 0
    for (const id of ids) {
      let didSucceed = false
      try {
        const res = await fetch(`/api/leads/${id}`, { method: "DELETE" })
        didSucceed = res.ok || res.status === 404
      } catch { /* network failure — keep queued */ }
      if (didSucceed) {
        const next = getPendingDeleteIds().filter((x) => x !== id)
        try { localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(next)) } catch { /* keep going */ }
        synced++
      }
    }
    return synced
  }, { ifAvailable: true })
  return result ?? 0
}
