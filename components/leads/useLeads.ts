"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

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
  }
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("nra_leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setLeads(data.map(dbRowToLead))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()

    // Real-time: refresh when any device adds/removes a lead
    const channel = supabase
      .channel("nra_leads_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "nra_leads" }, () => {
        fetchLeads()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchLeads])

  const addLead = useCallback(async (data: Omit<Lead, "id" | "time">) => {
    const { error } = await supabase.from("nra_leads").insert({
      name: data.name,
      company: data.company || "",
      role: data.role || "",
      contact: data.contact || "",
      notes: data.notes || "",
      heat: data.heat,
      badge_photo: data.badgePhoto || "",
      captured_by: data.capturedBy || "",
    })
    if (error) console.error("Failed to save lead:", error)
    // Real-time subscription will trigger fetchLeads automatically
  }, [])

  const deleteLead = useCallback(async (id: string) => {
    await supabase.from("nra_leads").delete().eq("id", id)
  }, [])

  const clearAll = useCallback(async () => {
    await supabase.from("nra_leads").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  }, [])

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
    loading,
    addLead,
    deleteLead,
    clearAll,
    exportCSV,
    copyAll,
    // Keep these for compatibility with existing UI
    syncStatus: "synced" as const,
    pendingCount: 0,
    isSyncing: false,
    syncNow: async () => 0,
  }
}
