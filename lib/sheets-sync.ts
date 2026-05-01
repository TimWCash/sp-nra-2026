/**
 * Google Sheets sync for leads via our own Next.js API route.
 * The API route at /api/leads uses a Google Service Account to
 * append rows directly to the Google Sheet.
 *
 * Sheet: https://docs.google.com/spreadsheets/d/1cVKkjbGmIiZO5jbVvPXmnLKvwR0LaTXDiDuisLjOBhU/edit
 */

import type { Lead } from "@/components/leads/useLeads"

import { withLock } from "@/lib/web-lock"

const PENDING_KEY = "sp_nra_sheets_pending"
const SYNCED_KEY = "sp_nra_sheets_synced"
const QUEUE_LOCK = "nra-sheets-queue"

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
 * Sync a newly-added lead to Google Sheets. On failure the lead is queued for
 * retry. Queue mutations are wrapped in a Web Lock so two tabs syncing the
 * same lead can't both write to the queue at once.
 */
export async function syncLead(lead: Lead): Promise<boolean> {
  const ok = await postLead(lead)
  if (ok) {
    await withLock(QUEUE_LOCK, () => {
      const ids = getSyncedIds()
      ids.add(lead.id)
      saveSyncedIds(ids)
      savePendingLeads(getPendingLeads().filter((p) => p.id !== lead.id))
    })
    return true
  }

  // Failed — queue for retry under the lock.
  await withLock(QUEUE_LOCK, () => {
    const pending = getPendingLeads()
    if (!pending.some((p) => p.id === lead.id)) {
      savePendingLeads([...pending, lead])
    }
  })
  return false
}

/**
 * Retry all queued (pending) leads. ifAvailable so two tabs don't both
 * try to flush at the same time — first acquirer does the work.
 */
export async function syncPending(): Promise<number> {
  const result = await withLock(QUEUE_LOCK, async () => {
    const snapshot = getPendingLeads()
    if (snapshot.length === 0) return 0
    let synced = 0
    const syncedIds = getSyncedIds()
    for (const lead of snapshot) {
      if (syncedIds.has(lead.id)) {
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
    }
    saveSyncedIds(syncedIds)
    return synced
  }, { ifAvailable: true })
  return result ?? 0
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
