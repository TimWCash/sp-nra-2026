"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { syncLead, syncPending, getPendingCount, computeSyncStatus, type SyncStatus } from "@/lib/sheets-sync"
import {
  cacheLeads,
  loadCachedLeads,
  queueLead,
  dequeueLead,
  queueDelete,
  insertLead,
  flushPending as flushPendingSupabase,
  flushDeletes as flushDeletesSupabase,
  getPendingCount as getPendingSupabaseCount,
  getPendingDeleteCount,
  getPendingLeads as getPendingLeadsOffline,
} from "@/lib/leads-offline"

export type HeatLevel = "hot" | "warm" | "cool"

export interface Lead {
  id: string
  name: string
  company: string
  role: string
  contact: string
  notes: string
  heat: HeatLevel
  time: string
  badgePhoto?: string
  capturedBy?: string
  followUp?: boolean
}

// Shape gate before the cast — if a Supabase row comes back with garbage
// fields (schema drift, wrong table, partial migration), drop it instead
// of crashing the render. Returns null for invalid rows so callers can
// filter them out.
function isValidHeat(v: unknown): v is HeatLevel {
  return v === "hot" || v === "warm" || v === "cool"
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function dbRowToLead(row: Record<string, unknown>): Lead | null {
  // Required fields. If id or name aren't strings we can't render this row
  // at all — a missing id breaks dedupe + edit, missing name breaks UI.
  if (typeof row.id !== "string" || typeof row.name !== "string") return null
  const created = typeof row.created_at === "string" ? row.created_at : new Date().toISOString()
  return {
    id: row.id,
    name: row.name,
    company: asString(row.company),
    role: asString(row.role),
    contact: asString(row.contact),
    notes: asString(row.notes),
    heat: isValidHeat(row.heat) ? row.heat : "warm",
    time: new Date(created).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
    }),
    badgePhoto: typeof row.badge_photo === "string" && row.badge_photo ? row.badge_photo : undefined,
    capturedBy: typeof row.captured_by === "string" && row.captured_by ? row.captured_by : undefined,
    followUp: row.follow_up === true,
  }
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>(() => loadCachedLeads())
  const [loading, setLoading] = useState(true)
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())
  const [pendingCount, setPendingCountState] = useState(0)
  const [pendingSupabase, setPendingSupabase] = useState(0)
  const [isBackfilling, setIsBackfilling] = useState(false)

  const refreshPendingCount = useCallback(() => {
    setPendingCountState(getPendingCount())
    // Both queued upserts and queued deletes count as "waiting to sync" for
    // the user-facing banner.
    setPendingSupabase(getPendingSupabaseCount() + getPendingDeleteCount())
  }, [])

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("nra_leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      // Drop any rows that fail validation rather than crashing the render.
      const fetched = data.map(dbRowToLead).filter((l): l is Lead => l !== null)
      // Merge in any still-pending local leads so they don't disappear from
      // the UI while waiting to reach Supabase.
      const pendingIds = new Set(fetched.map((l) => l.id))
      const pendingLocal = getPendingLeadsOffline().filter((p) => !pendingIds.has(p.id))
      const merged = [...pendingLocal, ...fetched]
      setLeads(merged)
      cacheLeads(merged)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
    refreshPendingCount()
    const channel = supabase
      .channel("nra_leads_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "nra_leads" }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLeads, refreshPendingCount])

  // On mount & when reconnecting: first flush queued Supabase inserts, then
  // mirror the leads that JUST landed to the Sheet, then drain any pre-existing
  // Sheets-sync queue. Order matters — a lead has to exist in Supabase before
  // we mirror it to the Sheet, and leads captured offline never went through
  // syncLead once, so we have to trigger it here.
  useEffect(() => {
    const flush = async () => {
      if (getPendingSupabaseCount() > 0) {
        // Snapshot queue BEFORE draining so we know which leads newly landed.
        const snapshot = getPendingLeadsOffline()
        const n = await flushPendingSupabase(supabase)
        if (n > 0) {
          await fetchLeads()
          // Find the ones that successfully left the queue and push them to
          // Sheets. syncLead is idempotent — already-synced ids short-circuit.
          const stillQueued = new Set(getPendingLeadsOffline().map((p) => p.id))
          const justLanded = snapshot.filter((p) => !stillQueued.has(p.id))
          for (const lead of justLanded) {
            syncLead(lead).catch(() => { /* queues internally on failure */ })
          }
        }
      }
      // Drain queued deletes too — same online event, same retry cadence.
      if (getPendingDeleteCount() > 0) {
        const n = await flushDeletesSupabase()
        if (n > 0) await fetchLeads()
      }
      if (getPendingCount() > 0) {
        await syncPending()
      }
      refreshPendingCount()
    }
    flush()
    window.addEventListener("online", flush)
    return () => window.removeEventListener("online", flush)
  }, [fetchLeads, refreshPendingCount])

  const addLead = useCallback(async (data: Omit<Lead, "id" | "time">): Promise<{ ok: boolean; error?: string }> => {
    // Client-side id + timestamp so the lead is durable from the moment the
    // user taps Save, regardless of connectivity. Retries stay idempotent
    // because we upsert by this id.
    const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()

    // Badge photos are base64; long ones can blow localStorage quota and cause
    // future writes to throw. Cap at ~150KB worth of base64 (≈ 100KB binary).
    // If the photo is too big, save the lead WITHOUT the photo and surface a
    // warning rather than dropping the whole capture.
    const MAX_BADGE_PHOTO_LEN = 150_000
    const photoTooBig = data.badgePhoto && data.badgePhoto.length > MAX_BADGE_PHOTO_LEN
    const safeBadgePhoto = photoTooBig ? undefined : data.badgePhoto

    const lead: Lead = {
      id,
      name: data.name,
      company: data.company || "",
      role: data.role || "",
      contact: data.contact || "",
      notes: data.notes || "",
      heat: data.heat,
      time: now.toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
      }),
      badgePhoto: safeBadgePhoto,
      capturedBy: data.capturedBy,
      followUp: false,
    }

    // Try to queue first — if storage is wedged we want to know BEFORE we
    // tell the user the lead is saved.
    const queued = queueLead(lead)
    if (!queued.ok) {
      // Both layers failed: we couldn't even commit to the offline queue.
      // Refuse to optimistically render the lead — the user MUST know.
      return {
        ok: false,
        error: queued.error + " Take a screenshot or write the contact down before this screen closes.",
      }
    }

    // Now that the queue holds the lead, optimistic UI is safe.
    setLeads((prev) => [lead, ...prev.filter((l) => l.id !== lead.id)])
    cacheLeads([lead, ...loadCachedLeads().filter((l) => l.id !== lead.id)])
    refreshPendingCount()

    const insertedOk = await insertLead(supabase, lead)
    if (insertedOk) {
      dequeueLead(lead.id)
      refreshPendingCount()
      // 3. Mirror to Google Sheet. On failure, the Sheets sync module queues
      //    the lead in its own localStorage bucket.
      setSyncingIds((prev) => {
        const next = new Set(prev)
        next.add(lead.id)
        return next
      })
      syncLead(lead).finally(() => {
        setSyncingIds((prev) => {
          const next = new Set(prev)
          next.delete(lead.id)
          return next
        })
        refreshPendingCount()
      })
    }
    // If Supabase failed, the lead stays in the pending queue and will be
    // retried on the next "online" event or component mount. The Sheets sync
    // will happen then too.

    return {
      ok: true,
      // Surface the photo-skipped warning so the form can show it once.
      error: photoTooBig
        ? "Lead saved, but the badge photo was skipped to protect offline storage."
        : undefined,
    }
  }, [refreshPendingCount])

  const deleteLead = useCallback(async (id: string) => {
    // 1. Optimistic local remove — feels instant, even offline.
    setLeads((prev) => prev.filter((l) => l.id !== id))
    cacheLeads(loadCachedLeads().filter((l) => l.id !== id))

    // 2. Queue the delete. Anon RLS forbids DELETE, so we go through a
    //    service-role server route.
    queueDelete(id)
    refreshPendingCount()

    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 404) {
        // success or already-gone — drop from queue
        await flushDeletesSupabase()
      }
    } catch {
      // offline — stays queued, will retry on next "online" event
    }
    refreshPendingCount()
  }, [refreshPendingCount])

  const toggleFollowUp = useCallback(async (id: string, current: boolean) => {
    // 1. Optimistic local toggle — never silently fail offline.
    const updated: Lead | undefined = leads.find((l) => l.id === id)
    if (!updated) return
    const next: Lead = { ...updated, followUp: !current }

    setLeads((prev) => prev.map((l) => (l.id === id ? next : l)))
    cacheLeads(loadCachedLeads().map((l) => (l.id === id ? next : l)))

    // 2. Queue the upsert (last-write-wins). If a follow-up was already
    //    toggled offline and toggled again before reconnect, the queue holds
    //    the latest state — only the final value reaches the server.
    queueLead(next)
    refreshPendingCount()

    const ok = await insertLead(supabase, next)
    if (ok) {
      dequeueLead(next.id)
      refreshPendingCount()
    }
    // If the upsert failed, the lead stays queued and will be retried on the
    // next "online" event or component mount.
  }, [leads, refreshPendingCount])

  /**
   * Bulk wipe of every lead in the database. Behind an admin gate because
   * a stray tap during the show could nuke the team's day. The gate isn't
   * security (the prompt is defeated by reading the source), it's a
   * "do you really want to do this" speed bump.
   */
  const clearAll = useCallback(async () => {
    if (typeof window === "undefined") return
    const expected = "DELETE ALL LEADS"
    const entered = window.prompt(
      `This will permanently delete every lead in the database (not just yours). ` +
      `To proceed, type the phrase exactly:\n\n${expected}`,
    )
    if (entered !== expected) return

    // Anon can't bulk-DELETE either — fan out via the server-side per-id route.
    const ids = leads.map((l) => l.id)
    setLeads([])
    cacheLeads([])
    for (const id of ids) {
      try { await fetch(`/api/leads/${id}`, { method: "DELETE" }) } catch {}
    }
  }, [leads])

  const exportCSV = useCallback(() => {
    if (leads.length === 0) return
    const headers = ["Name", "Company", "Role", "Contact", "Heat", "Follow Up", "Notes", "Captured By", "Time"]
    const rows = leads.map((l) =>
      [l.name, l.company, l.role, l.contact, l.heat, l.followUp ? "Yes" : "No", l.notes.replace(/,/g, "").replace(/\n/g, " "), l.capturedBy || "", l.time]
        .map((v) => `"${v || ""}"`)
        .join(",")
    )
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "SP_NRA2026_Leads.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [leads])

  const emailLeads = useCallback(() => {
    if (leads.length === 0) return
    const lines = leads.map((l) =>
      `${l.heat.toUpperCase()} | ${l.name}${l.company ? " — " + l.company : ""}${l.role ? ", " + l.role : ""}${l.contact ? " | " + l.contact : ""}${l.followUp ? " ⚑ FOLLOW UP" : ""}`
    )
    const body = `NRA Show 2026 Leads (${leads.length} total)\n\n` + lines.join("\n")
    window.location.href = `mailto:tim@servicephysics.com?subject=NRA 2026 Leads — ${leads.length} contacts&body=${encodeURIComponent(body)}`
  }, [leads])

  const copyAll = useCallback(async () => {
    if (leads.length === 0) return false
    const text = leads
      .map((l) =>
        `${l.name}${l.company ? " \u2014 " + l.company : ""}${l.role ? ", " + l.role : ""}\n` +
        `${l.contact ? "Contact: " + l.contact + "\n" : ""}` +
        `Heat: ${l.heat.toUpperCase()}${l.followUp ? " ⚑ FOLLOW UP" : ""}\n` +
        `${l.notes ? "Notes: " + l.notes + "\n" : ""}` +
        `Added: ${l.time}\n`
      )
      .join("\n---\n\n")
    await navigator.clipboard.writeText(text)
    return true
  }, [leads])

  const syncNow = useCallback(async () => {
    const n = await syncPending()
    refreshPendingCount()
    return n
  }, [refreshPendingCount])

  /**
   * Push every lead currently in state to the Sheet, bypassing the
   * per-device "already synced" cache. Used for backfilling leads
   * captured on other devices. Caller is responsible for warning
   * the user about possible duplicates.
   */
  const backfillToSheet = useCallback(async () => {
    if (leads.length === 0) return 0
    setIsBackfilling(true)
    let count = 0
    try {
      for (const lead of leads) {
        setSyncingIds((prev) => {
          const next = new Set(prev)
          next.add(lead.id)
          return next
        })
        const ok = await syncLead(lead)
        if (ok) count++
        setSyncingIds((prev) => {
          const next = new Set(prev)
          next.delete(lead.id)
          return next
        })
      }
    } finally {
      setIsBackfilling(false)
      refreshPendingCount()
    }
    return count
  }, [leads, refreshPendingCount])

  const stats = {
    total: leads.length,
    hot: leads.filter((l) => l.heat === "hot").length,
    warm: leads.filter((l) => l.heat === "warm").length,
    cool: leads.filter((l) => l.heat === "cool").length,
    followUp: leads.filter((l) => l.followUp).length,
  }

  const syncStatus: SyncStatus = useMemo(() => {
    if (syncingIds.size > 0 || isBackfilling) return "syncing"
    return computeSyncStatus(leads)
  }, [leads, syncingIds, isBackfilling])

  const isSyncing = syncingIds.size > 0 || isBackfilling

  // Leaderboard: who captured the most leads
  const leaderboard = Object.entries(
    leads.reduce((acc, l) => {
      const key = l.capturedBy || "Unknown"
      if (!acc[key]) acc[key] = { total: 0, hot: 0 }
      acc[key].total++
      if (l.heat === "hot") acc[key].hot++
      return acc
    }, {} as Record<string, { total: number; hot: number }>)
  ).sort((a, b) => b[1].total - a[1].total)

  return {
    leads,
    stats,
    loading,
    leaderboard,
    addLead,
    deleteLead,
    toggleFollowUp,
    clearAll,
    exportCSV,
    emailLeads,
    copyAll,
    syncStatus,
    pendingCount,
    pendingSupabase,
    isSyncing,
    syncNow,
    backfillToSheet,
  }
}
