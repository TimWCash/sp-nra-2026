"use client"

import { Plane, Car, House, ChevronRight, ExternalLink } from "lucide-react"
import { team } from "@/lib/data"

export function TeamPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Team</h1>

      <div className="rounded-xl p-3 mb-4 text-[13px]"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <House size={14} className="inline mr-1.5" />
        Airbnb: <strong>5-bed Pilsen Home</strong>, Chicago &middot; 5 beds &middot; 3.5 baths &middot; 10 guests
      </div>

      {/* Person Cards */}
      <div className="space-y-2.5 mb-6">
        {team.map((person) => (
          <div key={person.name} className="rounded-xl p-4 flex items-start gap-3.5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
              {person.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px]" style={{ color: "var(--text)" }}>{person.name}</div>
              {person.flights?.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
                  <Plane size={12} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span className="truncate">{f.label}</span>
                  <ChevronRight size={10} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  <span className="truncate">{f.detail}</span>
                </div>
              ))}
              {person.notes?.map((n, i) => (
                <div key={i} className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {n.includes("Driving") ? <><Car size={12} className="inline mr-1" />{n}</> : <><House size={12} className="inline mr-1" />{n}</>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* LinkedIn */}
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>LinkedIn</h2>
      <div className="space-y-2">
        {team.filter(p => p.linkedin).map((person) => (
          <a key={person.name} href={person.linkedin} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl no-underline transition-all duration-200 active:scale-[0.98]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", color: "var(--text)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
                <ExternalLink size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <div className="text-sm font-semibold">{person.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>View profile</div>
              </div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          </a>
        ))}
      </div>
    </div>
  )
}
