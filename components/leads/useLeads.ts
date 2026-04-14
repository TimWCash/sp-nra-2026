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
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("nra_leads")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) setLeads(data.map(dbRowToLead))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeads()
    const channel = supabase
      .channel("nra_leads_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "nra_leads" }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchLeads])

  const addLead = useCallback(async (data: Omit<Lead, "id" | "time">) => {
    await supabase.from("nra_leads").insert({
      name: data.name,
      company: data.company || "",
      role: data.role || "",
      contact: data.contact || "",
      notes: data.notes || "",
      heat: data.heat,
      badge_photo: data.badgePhoto || "",
      captured_by: data.capturedBy || "",
      follow_up: false,
    })
  }, [])

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

  const stats = {
    total: leads.length,
    hot: leads.filter((l) => l.heat === "hot").length,
    warm: leads.filter((l) => l.heat === "warm").length,
    cool: leads.filter((l) => l.heat === "cool").length,
    followUp: leads.filter((l) => l.followUp).length,
  }

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
    syncStatus: "synced" as const,
    pendingCount: 0,
    isSyncing: false,
    syncNow: async () => 0,
  }
}
