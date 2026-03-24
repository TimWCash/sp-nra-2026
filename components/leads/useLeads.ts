"use client"

import { useState, useEffect, useCallback } from "react"

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

  useEffect(() => {
    setLeads(loadLeads())
  }, [])

  const save = useCallback((updated: Lead[]) => {
    setLeads(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [])

  const addLead = useCallback((data: Omit<Lead, "id" | "time">) => {
    const lead: Lead = {
      ...data,
      id: Date.now(),
      time: new Date().toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
      }),
    }
    save([lead, ...loadLeads()])
  }, [save])

  const deleteLead = useCallback((id: number) => {
    save(loadLeads().filter((l) => l.id !== id))
  }, [save])

  const clearAll = useCallback(() => {
    save([])
  }, [save])

  const exportCSV = useCallback(() => {
    if (leads.length === 0) return
    const headers = ["Name", "Company", "Role", "Contact", "Heat", "Notes", "Time"]
    const rows = leads.map((l) =>
      [l.name, l.company, l.role, l.contact, l.heat, l.notes.replace(/,/g, "").replace(/\n/g, " "), l.time]
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

  return { leads, stats, addLead, deleteLead, clearAll, exportCSV, copyAll }
}
