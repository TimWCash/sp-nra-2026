"use client"

import { useState } from "react"
import { Clock, AlertTriangle, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"
import { schedule, dayTabs } from "@/lib/data"

export function SchedulePage() {
  const [activeDay, setActiveDay] = useState("sat")

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Schedule</h1>

      <div className="rounded-xl p-3 mb-4 flex gap-2 items-start text-[13px]"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <Clock size={15} className="flex-shrink-0 mt-0.5" />
        <span>Show floor open <strong>9:30am - 5:00pm</strong> (Sat-Mon) and <strong>9:30am - 3:00pm</strong> Tuesday. Early teardown is <strong>prohibited</strong>.</span>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-2 mb-4">
        {dayTabs.map((d) => (
          <button key={d.key} onClick={() => setActiveDay(d.key)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer text-center transition-all duration-200",
            )}
            style={{
              background: activeDay === d.key ? "var(--accent)" : "var(--surface)",
              color: activeDay === d.key ? "var(--accent-fg)" : "var(--text-secondary)",
              border: `1px solid ${activeDay === d.key ? "var(--accent)" : "var(--border)"}`,
            }}>
            {d.label}
          </button>
        ))}
      </div>

      {/* Tuesday warning */}
      {activeDay === "tue" && (
        <div className="rounded-xl p-3 mb-3 flex gap-2.5 items-start text-[13px]"
          style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span><strong>Last day closes at 3:00pm.</strong> Early teardown prohibited - violators risk future show participation.</span>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-1">
        {schedule[activeDay]?.map((event, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-16 flex-shrink-0 text-xs font-semibold pt-3.5" style={{ color: "var(--accent)" }}>{event.time}</div>
            <div className="flex flex-col items-center w-5 flex-shrink-0">
              <CircleDot size={12} className="mt-4 flex-shrink-0"
                style={{ color: event.highlight ? "var(--accent)" : "var(--border-strong)" }} />
              {i < (schedule[activeDay]?.length ?? 0) - 1 && <div className="flex-1 w-px mt-1" style={{ background: "var(--border)" }} />}
            </div>
            <div className="flex-1 rounded-xl p-3 mb-2 transition-colors duration-200"
              style={{
                background: event.highlight === "open" ? "var(--accent-light)" : event.highlight?.startsWith("close") ? "var(--danger-light)" : "var(--surface)",
                border: `1px solid ${event.highlight === "open" ? "var(--accent)" : event.highlight?.startsWith("close") ? "var(--danger)" : "var(--border)"}`,
              }}>
              <div className="font-semibold text-sm" style={{ color: event.highlight === "open" ? "var(--accent)" : event.highlight?.startsWith("close") ? "var(--danger)" : "var(--text)" }}>
                {event.title}
              </div>
              {event.sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{event.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Move-In */}
      <h2 className="text-lg font-bold mt-6 mb-3" style={{ color: "var(--text)" }}>Move-In Window</h2>
      <div className="rounded-xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        {[
          { label: "Warehouse Freight Move-In", date: "May 11", variant: "muted" },
          { label: "Show-Site Freight Receiving", date: "May 12", variant: "muted" },
          { label: "Display must be installed by", date: "May 15, 4pm", variant: "red" },
        ].map((item, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-3 text-sm ${i < 2 ? "border-b" : ""}`}
            style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${item.variant === "red" ? "bg-sp-danger-light text-sp-danger" : "bg-sp-surface-alt text-sp-muted"}`}>
              {item.date}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
