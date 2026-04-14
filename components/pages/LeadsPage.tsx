"use client"

import { useState } from "react"
import { Plus, Download, Copy, Trash2, Users, Flag, Trophy, Mail } from "lucide-react"
import { useLeads } from "@/components/leads/useLeads"
import { LeadForm } from "@/components/leads/LeadForm"
import { LeadCard } from "@/components/leads/LeadCard"

type FilterKey = "all" | "hot" | "warm" | "cool" | "followUp"

export function LeadsPage() {
  const { leads, stats, leaderboard, addLead, deleteLead, toggleFollowUp, clearAll, exportCSV, emailLeads, copyAll } = useLeads()
  const [formOpen, setFormOpen] = useState(false)
  const [copyLabel, setCopyLabel] = useState("Copy All")
  const [filter, setFilter] = useState<FilterKey>("all")
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  async function handleCopy() {
    const ok = await copyAll()
    if (ok) { setCopyLabel("Copied!"); setTimeout(() => setCopyLabel("Copy All"), 2000) }
  }

  function handleSave(data: Parameters<typeof addLead>[0]) {
    // Duplicate detection
    const dupe = leads.find((l) =>
      l.name.toLowerCase() === data.name.toLowerCase() ||
      (data.contact && l.contact && l.contact.toLowerCase() === data.contact.toLowerCase())
    )
    if (dupe) {
      if (!confirm(`"${dupe.name}" might already be in your leads. Save anyway?`)) return
    }
    addLead(data)
  }

  const filtered = leads.filter((l) => {
    if (filter === "hot") return l.heat === "hot"
    if (filter === "warm") return l.heat === "warm"
    if (filter === "cool") return l.heat === "cool"
    if (filter === "followUp") return l.followUp
    return true
  })

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: `All (${stats.total})` },
    { key: "hot", label: `🔥 Hot (${stats.hot})` },
    { key: "warm", label: `☀️ Warm (${stats.warm})` },
    { key: "cool", label: `❄️ Cool (${stats.cool})` },
    { key: "followUp", label: `⚑ Follow Up (${stats.followUp})` },
  ]

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
          {/* Stats row */}
          <div className="text-[13px] mb-3 font-medium" style={{ color: "var(--text-muted)" }}>
            <span className="font-bold" style={{ color: "var(--accent)" }}>{stats.total}</span> total &middot;{" "}
            <span style={{ color: "var(--danger)" }}>{stats.hot} hot</span> &middot;{" "}
            <span style={{ color: "var(--amber)" }}>{stats.warm} warm</span> &middot;{" "}
            <span style={{ color: "var(--accent)" }}>{stats.cool} cool</span>
            {stats.followUp > 0 && <> &middot; <span style={{ color: "var(--amber)" }}>⚑ {stats.followUp} to follow up</span></>}
          </div>

          {/* Leaderboard toggle */}
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 mb-3 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <Trophy size={15} style={{ color: "var(--amber)" }} />
              <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Team Leaderboard</span>
            </div>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{showLeaderboard ? "Hide" : "Show"}</span>
          </button>

          {showLeaderboard && (
            <div className="rounded-xl overflow-hidden mb-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {leaderboard.map(([name, s], i) => (
                <div key={name} className={`flex items-center gap-3 px-4 py-3 ${i < leaderboard.length - 1 ? "border-b" : ""}`}
                  style={{ borderColor: "var(--border)" }}>
                  <span className="text-[15px] w-6 text-center">{["🥇", "🥈", "🥉"][i] || `${i + 1}`}</span>
                  <span className="flex-1 font-semibold text-[13px]" style={{ color: "var(--text)" }}>{name}</span>
                  <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>{s.total}</span>
                  {s.hot > 0 && <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>🔥 {s.hot}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-hide">
            {filters.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="flex-shrink-0 py-1.5 px-3 rounded-full text-[11px] font-semibold cursor-pointer transition-all duration-200"
                style={{
                  background: filter === f.key ? "var(--accent)" : "var(--surface)",
                  color: filter === f.key ? "var(--accent-fg)" : "var(--text-secondary)",
                  border: `1px solid ${filter === f.key ? "var(--accent)" : "var(--border)"}`,
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <button onClick={exportCSV} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold py-2.5 cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <Download size={14} /> CSV
            </button>
            <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold py-2.5 cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <Copy size={14} /> {copyLabel}
            </button>
            <button onClick={emailLeads} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold py-2.5 cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
              <Mail size={14} /> Email
            </button>
            <button onClick={() => { if (leads.length && confirm("Clear all " + leads.length + " leads?")) clearAll() }}
              className="flex items-center justify-center rounded-lg text-[13px] font-semibold py-2.5 px-3 cursor-pointer transition-all duration-200 active:scale-[0.97]"
              style={{ background: "var(--danger-light)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}

      {filtered.length === 0 && leads.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <Users size={48} className="mx-auto mb-3 opacity-40" />
          <div className="font-semibold text-base mb-1">No leads yet</div>
          <div className="text-sm">Tap &quot;Add Lead&quot; after every good conversation.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          <Flag size={32} className="mx-auto mb-2 opacity-40" />
          <div className="text-sm">No leads match this filter.</div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onDelete={deleteLead} onToggleFollowUp={toggleFollowUp} />
          ))}
        </div>
      )}

      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} onSave={handleSave} existingLeads={leads} />

      <button onClick={() => setFormOpen(true)} aria-label="Add lead"
        className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] right-4 w-14 h-14 rounded-full border-none cursor-pointer flex items-center justify-center z-[99] transition-all duration-200 active:scale-[0.93]"
        style={{ background: "var(--accent)", color: "var(--accent-fg)", boxShadow: "var(--shadow-lg)" }}>
        <Plus size={24} />
      </button>
    </div>
  )
}
