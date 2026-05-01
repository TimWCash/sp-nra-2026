/**
 * Google Sheets sync for leads via our own Next.js API route.
 * The API route at /api/leads uses a Google Service Account to
 * append rows directly to the Google Sheet.
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1cVKkjbGmIiZO5jbVvPXmnLKvwR0LaTXDiDuisLjOBhU/edit
 */

import type { Lead } from "@/components/leads/useLeads"

const PENDING_KEY = "sp_nra_sheets_pending"
const SYNCED_KEY = "sp_nra_sheets_synced"
const SYNC_LOCK_KEY = "sp_nra_sheets_sync_lock"
const SYNC_LOCK_TTL_MS = 60_000  // longer than leads — Sheets API can be slow

function acquireLock(): boolean {
  if (typeof window === "undefined") return false
  const raw = localStorage.getItem(SYNC_LOCK_KEY)
  if (raw) {
    const heldAt = parseInt(raw, 10)
    if (!Number.isNaN(heldAt) && Date.now() - heldAt < SYNC_LOCK_TTL_MS) return false
  }
  try { localStorage.setItem(SYNC_LOCK_KEY, String(Date.now())); return true } catch { return false }
}

function releaseLock(): void {
  try { localStorage.removeItem(SYNC_LOCK_KEY) } catch { /* ignore */ }
}

/** IDs of leads that have been synced successfully. */
export function getSyncedIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(SYNCED_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function saveSyncedIds(ids: Set<string>) {
  try { localStorage.setItem(SYNCED_KEY, JSON.stringify([...ids])) } catch { /* quota; advisory only */ }
}

/** Leads waiting to be synced (failed or offline). */
export function getPendingLeads(): Lead[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function savePendingLeads(leads: Lead[]): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(leads))
    return { ok: true }
  } catch {
    return { ok: false, error: "Storage full — could not queue Sheets sync." }
  }
}

export type SyncStatus = "idle" | "syncing" | "synced" | "pending" | "error" | "no-config"

/**
 * Send a single lead to the Google Sheet via our API route.
 */
async function postLead(lead: Lead): Promise<boolean> {
  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: lead.name,
        company: lead.company,
        role: lead.role,
        contact: lead.contact,
        heat: lead.heat,
        notes: lead.notes,
        capturedBy: lead.capturedBy || "",
        badgePhoto: lead.badgePhoto ?? "",
      }),
    })
    if (!res.ok) return false
    const json = await res.json()
    return json.status === "ok"
  } catch {
    return false
  }
}

/**
 * Sync a newly-added lead to Google Sheets.
 * On failure the lead is queued for retry. Per-id remove on success — never
 * replaces the full queue.
 */
export async function syncLead(lead: Lead): Promise<boolean> {
  const ok = await postLead(lead)
  if (ok) {
    const ids = getSyncedIds()
    ids.add(lead.id)
    saveSyncedIds(ids)
    // Re-read fresh; only drop this specific id so concurrent queues don't lose data.
    savePendingLeads(getPendingLeads().filter((p) => p.id !== lead.id))
    return true
  }

  // Failed — queue for retry. Re-read so we don't clobber a parallel write.
  const pending = getPendingLeads()
  if (!pending.some((p) => p.id === lead.id)) {
    savePendingLeads([...pending, lead])
  }
  return false
}

/**
 * Retry all queued (pending) leads. Lock + per-id remove so a concurrent
 * syncLead call (e.g. user adds a new lead during the flush) can't lose
 * the new entry.
 */
export async function syncPending(): Promise<number> {
  if (!acquireLock()) return 0
  try {
    const snapshot = getPendingLeads()
    if (snapshot.length === 0) return 0

    let synced = 0
    const syncedIds = getSyncedIds()

    for (const lead of snapshot) {
      if (syncedIds.has(lead.id)) {
        // Stale queue entry — already on the sheet. Just remove it.
        savePendingLeads(getPendingLeads().filter((p) => p.id !== lead.id))
        synced++
        continue
      }
      const ok = await postLead(lead)
      if (ok) {
        syncedIds.add(lead.id)
        savePendingLeads(getPendingLeads().filter((p) => p.id !== lead.id))
        synced++
      }
      // failure: leave in queue for next run, don't touch the queue at all
    }

    saveSyncedIds(syncedIds)
    return synced
  } finally {
    releaseLock()
  }
}

/**
 * Compute the aggregate sync status across all leads.
 */
export function computeSyncStatus(leads: Lead[]): SyncStatus {
  if (leads.length === 0) return "idle"
  const syncedIds = getSyncedIds()
  const pending = getPendingLeads()
  const allSynced = leads.every((l) => syncedIds.has(l.id))
  if (allSynced) return "synced"
  if (pending.length > 0) return "pending"
  return "idle"
}

/**
 * Get a count of leads pending sync.
 */
export function getPendingCount(): number {
  return getPendingLeads().length
}
