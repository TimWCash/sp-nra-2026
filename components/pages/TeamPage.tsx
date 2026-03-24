"use client"

import { team } from "@/lib/data"

export function TeamPage() {
  return (
    <div className="animate-fade-in">
      <div className="font-display text-[28px] tracking-wider text-sp-text mb-4">Team</div>

      <div className="bg-sp-teal/10 border border-sp-teal/20 rounded-[10px] p-2.5 px-3.5 text-[13px] mb-4">
        \u2708\ufe0f Airbnb: <strong>5-bed Pilsen Home</strong>, Chicago &middot; 5 beds &middot; 3.5 baths &middot; 10 guests &middot; \u2b50 4.61
      </div>

      {/* Person Cards */}
      {team.map((person) => (
        <div key={person.name} className="bg-sp-surface border border-sp-border rounded-sp p-3.5 px-4 mb-2.5 flex items-start gap-3.5">
          <div className="w-[42px] h-[42px] rounded-full bg-sp-surface2 border-[1.5px] border-sp-border flex items-center justify-center font-display text-lg text-sp-teal flex-shrink-0">
            {person.initials}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[15px]">{person.name}</div>
            {person.flights?.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs mt-1">
                <span>{f.label}</span>
                <span className="text-sp-teal">&rsaquo;</span>
                <span>{f.detail}</span>
              </div>
            ))}
            {person.notes?.map((n, i) => (
              <div key={i} className="text-xs text-sp-muted mt-0.5 leading-relaxed">{n}</div>
            ))}
          </div>
        </div>
      ))}

      {/* LinkedIn */}
      <div className="font-display text-[28px] tracking-wider text-sp-text mt-6 mb-4">LinkedIn Profiles</div>
      {team.filter(p => p.linkedin).map((person) => (
        <a key={person.name} href={person.linkedin} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-3.5 px-4 bg-sp-surface border border-sp-border rounded-sp mb-2 no-underline text-sp-text transition-colors active:border-sp-teal-dim">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sp-surface2 flex items-center justify-center text-lg">\ud83d\udcbc</div>
            <div>
              <div className="text-sm font-medium">{person.name}</div>
              <div className="text-xs text-sp-muted">LinkedIn</div>
            </div>
          </div>
          <span className="text-sp-muted text-lg">\u2192</span>
        </a>
      ))}
    </div>
  )
}
