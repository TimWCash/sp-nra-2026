"use client"

import { X, Flame, Sun, Snowflake, Flag } from "lucide-react"
import type { Lead } from "./useLeads"

function HeatBadge({ heat }: { heat: string }) {
  const config = {
    hot: { Icon: Flame, label: "Hot", bg: "var(--danger-light)", color: "var(--danger)" },
    warm: { Icon: Sun, label: "Warm", bg: "var(--amber-light)", color: "var(--amber)" },
    cool: { Icon: Snowflake, label: "Cool", bg: "var(--accent-light)", color: "var(--accent)" },
  }[heat] ?? { Icon: Snowflake, label: "Cool", bg: "var(--accent-light)", color: "var(--accent)" }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background: config.bg, color: config.color }}>
      <config.Icon size={11} /> {config.label}
    </span>
  )
}

interface LeadCardProps {
  lead: Lead
  onDelete: (id: string) => void
  onToggleFollowUp: (id: string, current: boolean) => void
}

export function LeadCard({ lead, onDelete, onToggleFollowUp }: LeadCardProps) {
  return (
    <div className="rounded-xl p-4"
      style={{
        background: "var(--surface)",
        border: `1px solid ${lead.followUp ? "var(--amber)" : "var(--border)"}`,
        boxShadow: "var(--shadow-sm)",
      }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px]" style={{ color: "var(--text)" }}>{lead.name}</div>
          {lead.company && (
            <div className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              {lead.company}{lead.role ? " \u00b7 " + lead.role : ""}
            </div>
          )}
          {lead.contact && <div className="text-xs mt-1 font-medium" style={{ color: "var(--accent)" }}>{lead.contact}</div>}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => onToggleFollowUp(lead.id, !!lead.followUp)}
            aria-label="Toggle follow-up"
            className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0 transition-all duration-200 active:scale-[0.93]"
            style={{
              background: lead.followUp ? "var(--amber-light)" : "var(--surface-alt)",
              border: `1px solid ${lead.followUp ? "var(--amber)" : "var(--border)"}`,
              color: lead.followUp ? "var(--amber)" : "var(--text-muted)",
            }}>
            <Flag size={14} fill={lead.followUp ? "currentColor" : "none"} />
          </button>
          <button onClick={() => onDelete(lead.id)} aria-label="Delete lead"
            className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors duration-200 active:scale-[0.93]"
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>
      </div>
      {lead.badgePhoto && (
        <div className="mt-2.5 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <img src={lead.badgePhoto} alt={`${lead.name} badge`} className="w-full max-h-[160px] object-cover" />
        </div>
      )}
      {lead.notes && (
        <div className="text-[13px] mt-2.5 pt-2.5 border-t leading-relaxed"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          {lead.notes}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <HeatBadge heat={lead.heat} />
        {lead.followUp && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ background: "var(--amber-light)", color: "var(--amber)" }}>
            <Flag size={10} fill="currentColor" /> Follow Up
          </span>
        )}
        {lead.capturedBy && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: "var(--surface-alt)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            {lead.capturedBy}
          </span>
        )}
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{lead.time}</span>
      </div>
    </div>
  )
}
