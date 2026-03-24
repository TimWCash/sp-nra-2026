"use client"

import { useState } from "react"
import { useLeads } from "@/components/leads/useLeads"
import { LeadForm } from "@/components/leads/LeadForm"
import { LeadCard } from "@/components/leads/LeadCard"

export function LeadsPage() {
  const { leads, stats, addLead, deleteLead, clearAll, exportCSV, copyAll } = useLeads()
  const [formOpen, setFormOpen] = useState(false)
  const [copyLabel, setCopyLabel] = useState("\ud83d\udccb Copy All")

  async function handleCopy() {
    const ok = await copyAll()
    if (ok) {
      setCopyLabel("\u2705 Copied!")
      setTimeout(() => setCopyLabel("\ud83d\udccb Copy All"), 2000)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-[28px] tracking-wider text-sp-text">Leads</div>
        <button onClick={() => setFormOpen(true)}
          className="bg-gradient-to-r from-sp-teal to-sp-teal-dim border-none rounded-[10px] text-[#0b1a22] font-body text-sm font-bold py-2.5 px-4.5 cursor-pointer">
          + Add Lead
        </button>
      </div>

      {stats.total > 0 && (
        <>
          <div className="text-[13px] text-sp-muted mb-4">
            <span className="text-sp-teal font-bold">{stats.total}</span> total &nbsp;&middot;&nbsp; \ud83d\udd25 {stats.hot} &nbsp;&middot;&nbsp; \u2600\ufe0f {stats.warm} &nbsp;&middot;&nbsp; \ud83e\uddc\ufe0f {stats.cool}
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={exportCSV} className="flex-1 bg-sp-surface border border-sp-border rounded-[10px] text-sp-text font-body text-[13px] font-semibold py-2.5 px-2 cursor-pointer text-center transition-colors active:border-sp-teal">
              \ud83d\udce5 Export CSV
            </button>
            <button onClick={handleCopy} className="flex-1 bg-sp-surface border border-sp-border rounded-[10px] text-sp-text font-body text-[13px] font-semibold py-2.5 px-2 cursor-pointer text-center transition-colors active:border-sp-teal">
              {copyLabel}
            </button>
            <button onClick={() => { if (leads.length && confirm("Clear all " + leads.length + " leads? This cannot be undone.")) clearAll() }}
              className="flex-1 bg-sp-surface border border-sp-border rounded-[10px] text-sp-red font-body text-[13px] font-semibold py-2.5 px-2 cursor-pointer text-center transition-colors active:border-sp-teal">
              \ud83d\uddd1 Clear All
            </button>
          </div>
        </>
      )}

      {leads.length === 0 ? (
        <div className="text-center py-12 px-5 text-sp-muted">
          <div className="text-5xl mb-3">\ud83e\udd1d</div>
          <div className="font-semibold text-base mb-1.5">No leads yet</div>
          <div className="text-sm">Tap &quot;+ Add Lead&quot; after every good conversation.</div>
        </div>
      ) : (
        leads.map((lead) => <LeadCard key={lead.id} lead={lead} onDelete={deleteLead} />)
      )}

      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} onSave={addLead} />

      {/* FAB */}
      <button onClick={() => setFormOpen(true)}
        className="fixed bottom-[calc(70px+env(safe-area-inset-bottom,0px))] right-4 w-14 h-14 rounded-full bg-gradient-to-r from-sp-teal to-sp-teal-dim border-none text-[#0b1a22] text-[26px] cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(79,168,166,0.25)] z-[99] transition-transform active:scale-[0.93]">
        +
      </button>
    </div>
  )
}
