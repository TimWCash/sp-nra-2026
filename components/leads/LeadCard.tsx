"use client"

import type { Lead } from "./useLeads"

function heatIcon(heat: string) {
  return heat === "hot" ? "Hot" : heat === "warm" ? "Warm" : "Cool"
}

function heatBadgeClass(heat: string) {
  if (heat === "hot") return "bg-sp-red/10 text-sp-red border-sp-red/30"
  if (heat === "warm") return "bg-sp-amber/10 text-sp-amber border-sp-amber/30"
  return "bg-sp-teal/10 text-sp-teal border-sp-teal/30"
}

interface LeadCardProps {
  lead: Lead
  onDelete: (id: number) => void
}

export function LeadCard({ lead, onDelete }: LeadCardProps) {
  return (
    <div className="bg-sp-surface border border-sp-border rounded-sp p-3.5 px-4 mb-2.5 relative">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-bold text-[15px]">{lead.name}</div>
          {lead.company && (
            <div className="text-[13px] text-sp-muted mt-0.5">
              {lead.company}{lead.role ? " \u00b7 " + lead.role : ""}
            </div>
          )}
          {lead.contact && <div className="text-xs text-sp-teal mt-1">{lead.contact}</div>}
        </div>
        <button onClick={() => onDelete(lead.id)} className="bg-transparent border-none text-sp-muted text-lg cursor-pointer px-1.5 py-0.5 flex-shrink-0">
          \u00d7
        </button>
      </div>
      {lead.notes && (
        <div className="text-[13px] text-sp-text mt-2 pt-2 border-t border-sp-border opacity-80">
          {lead.notes}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${heatBadgeClass(lead.heat)}`}>
          {heatIcon(lead.heat)} {lead.heat.charAt(0).toUpperCase() + lead.heat.slice(1)}
        </span>
        <span className="text-[11px] text-sp-muted">{lead.time}</span>
      </div>
    </div>
  )
}
