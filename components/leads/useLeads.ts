"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { syncLead, syncPending, getPendingCount, computeSyncStatus, type SyncStatus } from "@/lib/sheets-sync"
import {
  cacheLeads,
  loadCachedLeads,
  queueLead,
  dequeueLead,
  insertLead,
  flushPending as flushPendingSupabase,
  getPendingCount as getPendingSupabaseCount,
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

function dbRowToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    name: row.name as string,
    company: (row.company as string) || "",
    role: (row.role as string) || "",
    contact: (row.contact as string) || "",
    notes: (row.notes as string) || "",
    heat: (row.heat as HeatLevel) || "warm",
    time: new Date(row.created_at as string).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
    }),
    badgePhoto: (row.badge_photo as string) || undefined,
    capturedBy: (row.captured_by as string) || undefined,
    followUp: (row.follow_up as boolean) || false,
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
    setPendingSupabase(getPendingSupabaseCount())
  }, [])

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("nra_leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      const fetched = data.map(dbRowToLead)
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
      if (getPendingCount() > 0) {
        await syncPending()
      }
      refreshPendingCount()
    }
    flush()
    window.addEventListener("online", flush)
    return () => window.removeEventListener("online", flush)
  }, [fetchLeads, refreshPendingCount])

  const addLead = useCallback(async (data: Omit<Lead, "id" | "time">) => {
    // Client-side id + timestamp so the lead is durable from the moment the
    // user taps Save, regardless of connectivity. Retries stay idempotent
    // because we upsert by this id.
    const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()
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
      badgePhoto: data.badgePhoto,
      capturedBy: data.capturedBy,
      followUp: false,
    }

    // 1. Optimistic local state — user sees the lead immediately, even offline.
    setLeads((prev) => [lead, ...prev.filter((l) => l.id !== lead.id)])
    cacheLeads([lead, ...loadCachedLeads().filter((l) => l.id !== lead.id)])

    // 2. Queue the Supabase write. Dequeue only on success.
    queueLead(lead)
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
  }, [refreshPendingCount])

  const deleteLead = useCallback(async (id: string) => {
    await supabase.from("nra_leads").delete().eq("id", id)
  }, [])

  const toggleFollowUp = useCallback(async (id: string, current: boolean) => {
    await supabase.from("nra_leads").update({ follow_up: !current }).eq("id", id)
  }, [])

  const clearAll = useCallback(async () => {
    await supabase.from("nra_leads").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  }, [])

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
