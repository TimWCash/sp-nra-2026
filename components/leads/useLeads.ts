"use client"

import { useState, useEffect, useCallback } from "react"
import {
  syncLead,
  syncPending,
  computeSyncStatus,
  getPendingCount,
  type SyncStatus,
} from "@/lib/sheets-sync"

export type HeatLevel = "hot" | "warm" | "cool"

export interface Lead {
  id: number
  name: string
  company: string
  role: string
  contact: string
  notes: string
  heat: HeatLevel
  time: string
  badgePhoto?: string
  capturedBy?: string
}

const STORAGE_KEY = "sp_nra_leads"

function loadLeads(): Lead[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const loaded = loadLeads()
    setLeads(loaded)
    setSyncStatus(computeSyncStatus(loaded))
    setPendingCount(getPendingCount())
  }, [])

  const refreshSyncState = useCallback((currentLeads: Lead[]) => {
    setSyncStatus(computeSyncStatus(currentLeads))
    setPendingCount(getPendingCount())
  }, [])

  const save = useCallback((updated: Lead[]) => {
    setLeads(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [])

  const addLead = useCallback(async (data: Omit<Lead, "id" | "time">) => {
    const lead: Lead = {
      ...data,
      id: Date.now(),
      time: new Date().toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
      }),
    }
    const updated = [lead, ...loadLeads()]
    save(updated)

    // Fire-and-forget sync to Google Sheets
    setSyncStatus("syncing")
    syncLead(lead).then(() => {
      refreshSyncState(loadLeads())
    })
  }, [save, refreshSyncState])

  const deleteLead = useCallback((id: number) => {
    const updated = loadLeads().filter((l) => l.id !== id)
    save(updated)
    refreshSyncState(updated)
  }, [save, refreshSyncState])

  const clearAll = useCallback(() => {
    save([])
    refreshSyncState([])
  }, [save, refreshSyncState])

  const syncNow = useCallback(async () => {
    if (isSyncing) return 0
    setIsSyncing(true)
    setSyncStatus("syncing")
    try {
      // First sync any pending leads
      const count = await syncPending()

      // Then try to sync any leads that aren't in the synced set yet
      const current = loadLeads()
      const { getSyncedIds } = await import("@/lib/sheets-sync")
      const syncedIds = getSyncedIds()
      const unsynced = current.filter((l) => !syncedIds.has(l.id))
      let extraSynced = 0
      for (const lead of unsynced) {
        const ok = await syncLead(lead)
        if (ok) extraSynced++
      }

      refreshSyncState(loadLeads())
      return count + extraSynced
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, refreshSyncState])

  const exportCSV = useCallback(() => {
    if (leads.length === 0) return
    const headers = ["Name", "Company", "Role", "Contact", "Heat", "Notes", "Captured By", "Time"]
    const rows = leads.map((l) =>
      [l.name, l.company, l.role, l.contact, l.heat, l.notes.replace(/,/g, "").replace(/\n/g, " "), l.capturedBy || "", l.time]
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

  const copyAll = useCallback(async () => {
    if (leads.length === 0) return false
    const text = leads
      .map(
        (l) =>
          `${l.name}${l.company ? " \u2014 " + l.company : ""}${l.role ? ", " + l.role : ""}\n` +
          `${l.contact ? "Contact: " + l.contact + "\n" : ""}` +
          `Heat: ${l.heat.toUpperCase()}\n` +
          `${l.notes ? "Notes: " + l.notes + "\n" : ""}` +
          `Added: ${l.time}\n`
      )
      .join("\n---\n\n")
    await navigator.clipboard.writeText(text)
    return true
  }, [leads])

  const stats = {
    total: leads.length,
    hot: leads.filter((l) => l.heat === "hot").length,
    warm: leads.filter((l) => l.heat === "warm").length,
    cool: leads.filter((l) => l.heat === "cool").length,
  }

  return {
    leads,
    stats,
    addLead,
    deleteLead,
    clearAll,
    exportCSV,
    copyAll,
    syncStatus,
    pendingCount,
    isSyncing,
    syncNow,
  }
}
