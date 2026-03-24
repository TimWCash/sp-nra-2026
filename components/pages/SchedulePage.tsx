"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { schedule, dayTabs } from "@/lib/data"

export function SchedulePage() {
  const [activeDay, setActiveDay] = useState("sat")

  return (
    <div className="animate-fade-in">
      <div className="font-display text-[28px] tracking-wider text-sp-text mb-4">Schedule</div>

      <div className="bg-sp-teal/10 border border-sp-teal/20 rounded-[10px] p-2.5 px-3.5 text-[13px] mb-4">
        \ud83d\udd50 Show floor open <strong>9:30am \u2013 5:00pm</strong> (Sat\u2013Mon) and <strong>9:30am \u2013 3:00pm</strong> Tuesday. Early teardown is <strong>prohibited</strong>.
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 mb-4">
        {dayTabs.map((d) => (
          <button
            key={d.key}
            onClick={() => setActiveDay(d.key)}
            className={cn(
              "flex-1 py-2.5 bg-sp-surface border border-sp-border rounded-[10px] text-sp-muted font-body text-[13px] font-medium cursor-pointer text-center transition-all",
              activeDay === d.key && "bg-[#0d2535] border-sp-teal-dim text-sp-teal"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Tuesday warning */}
      {activeDay === "tue" && (
        <div className="bg-sp-red/10 border border-sp-red/25 rounded-[10px] p-2.5 px-3.5 text-[13px] mb-3 flex gap-2 items-start">
          <span className="flex-shrink-0 mt-0.5">\u26a0\ufe0f</span>
          <span><strong>Last day closes at 3:00pm.</strong> Early teardown strictly prohibited \u2014 violators risk future show participation.</span>
        </div>
      )}

      {/* Timeline */}
      {schedule[activeDay]?.map((event, i) => (
        <div key={i} className="flex gap-3 mb-1">
          <div className="w-[72px] flex-shrink-0 text-xs font-semibold text-sp-teal pt-3.5">{event.time}</div>
          <div className="flex flex-col items-center w-5 flex-shrink-0">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full mt-[18px] flex-shrink-0",
              event.highlight ? "bg-sp-teal" : "bg-sp-border"
            )} />
            {i < (schedule[activeDay]?.length ?? 0) - 1 && <div className="flex-1 w-px bg-sp-border mt-0.5" />}
          </div>
          <div className={cn(
            "flex-1 bg-sp-surface border border-sp-border rounded-[10px] p-2.5 px-3 mb-2",
            event.highlight === "open" && "border-sp-teal-dim bg-[#0a1e2d]",
            event.highlight === "close" && "border-sp-red/25",
            event.highlight === "close-final" && "border-sp-red/30 bg-[#1a0900]",
          )}>
            <div className="font-medium text-sm">
              {event.highlight === "open" && "\ud83d\udfe2 "}{event.highlight?.startsWith("close") && "\ud83d\udd34 "}{event.title}
            </div>
            {event.sub && <div className="text-xs text-sp-muted mt-0.5">{event.sub}</div>}
          </div>
        </div>
      ))}

      {/* Move-In Window */}
      <div className="font-display text-[28px] tracking-wider text-sp-text mt-6 mb-4">Move-In Window</div>
      <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
        <div className="flex justify-between items-center py-2.5 text-sm border-b border-sp-border">
          <span>Warehouse Freight Move-In</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-white/5 text-sp-muted border-sp-border">May 11</span>
        </div>
        <div className="flex justify-between items-center py-2.5 text-sm border-b border-sp-border">
          <span>Show-Site Freight Receiving</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-white/5 text-sp-muted border-sp-border">May 12</span>
        </div>
        <div className="flex justify-between items-center py-2.5 text-sm">
          <span>\ud83d\udd11 Display must be installed by</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-sp-red/10 text-sp-red border-sp-red/20">May 15, 4pm</span>
        </div>
      </div>
    </div>
  )
}
