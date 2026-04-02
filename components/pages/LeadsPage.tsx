"use client"

import { useState } from "react"
import { Plus, Download, Copy, Trash2, Users, RefreshCw, Check, AlertCircle, CloudOff, Cloud } from "lucide-react"
import { useLeads } from "@/components/leads/useLeads"
import { LeadForm } from "@/components/leads/LeadForm"
import { LeadCard } from "@/components/leads/LeadCard"

function SyncIndicator({
  status,
  pendingCount,
  isSyncing,
  onSync,
}: {
  status: string
  pendingCount: number
  isSyncing: boolean
  onSync: () => void
}) {
  const config: Record<string, { icon: typeof Check; color: string; bg: string; label: string }> = {
    synced: { icon: Check, color: "var(--success, #22c55e)", bg: "var(--success-light, #dcfce7)", label: "Synced" },
    syncing: { icon: RefreshCw, color: "var(--accent)", bg: "var(--accent-light)", label: "Syncing..." },
    pending: { icon: AlertCircle, color: "var(--amber)", bg: "var(--amber-light)", label: `${pendingCount} pending` },
    error: { icon: AlertCircle, color: "var(--danger)", bg: "var(--danger-light)", label: "Sync error" },
    "no-url": { icon: CloudOff, color: "var(--text-muted)", bg: "var(--surface-alt)", label: "Sheets not configured" },
    idle: { icon: Cloud, color: "var(--text-muted)", bg: "var(--surface-alt)", label: "Not synced" },
  }

  const c = config[status] ?? config.idle
  const Icon = c.icon

  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
        style={{ background: c.bg, color: c.color }}
      >
        <Icon size={12} className={status === "syncing" ? "animate-spin" : ""} />
        {c.label}
      </span>
      {(status === "pending" || status === "error" || status === "idle") && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all duration-200 active:scale-[0.95] disabled:opacity-50"
          style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)" }}
        >
          <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
          Sync to Sheets
        </button>
      )}
    </div>
  )
}

export function LeadsPage() {
  const {
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
  } = useLeads()
  const [formOpen, setFormOpen] = useState(false)
  const [copyLabel, setCopyLabel] = useState("Copy All")

  async function handleCopy() {
    const ok = await copyAll()
    if (ok) {
      setCopyLabel("Copied!")
      setTimeout(() => setCopyLabel("Copy All"), 2000)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Leads</h1>
        <button onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 rounded-lg text-sm font-semibold py-2.5 px-4 cursor-pointer transition-all duration-200 active:scale-[0.97]"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {stats.total > 0 && (
        <>
          <SyncIndicator status={syncStatus} pendingCount={pendingCount} isSyncing={isSyncing} onSync={syncNow} />

          <div className="text-[13px] mb-4 font-medium" style={{ color: "var(--text-muted)" }}>
            <span className="font-bold" style={{ color: "var(--accent)" }}>{stats.total}</span> total &middot; {stats.hot} hot &middot; {stats.warm} warm &middot; {stats.cool} cool
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={exportCSV} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold py-2.5 cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <Download size={14} /> Export
            </button>
            <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold py-2.5 cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <Copy size={14} /> {copyLabel}
            </button>
            <button onClick={() => { if (leads.length && confirm("Clear all " + leads.length + " leads?")) clearAll() }}
              className="flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold py-2.5 px-3 cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{ background: "var(--danger-light)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}

      {leads.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <Users size={48} className="mx-auto mb-3 opacity-40" />
          <div className="font-semibold text-base mb-1">No leads yet</div>
          <div className="text-sm">Tap &quot;Add Lead&quot; after every good conversation.</div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {leads.map((lead) => <LeadCard key={lead.id} lead={lead} onDelete={deleteLead} />)}
        </div>
      )}

      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} onSave={addLead} />

      {/* FAB */}
      <button onClick={() => setFormOpen(true)} aria-label="Add lead"
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] right-4 w-14 h-14 rounded-full border-none cursor-pointer flex items-center justify-center z-[99] transition-all duration-200 active:scale-[0.93]"
        style={{ background: "var(--accent)", color: "var(--accent-fg)", boxShadow: "var(--shadow-lg)" }}>
        <Plus size={24} />
      </button>
    </div>
  )
}
