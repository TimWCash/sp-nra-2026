"use client"

import { useState } from "react"
import { Clock, AlertTriangle, CircleDot, Search, Map, GraduationCap, ChefHat, Wine, Lightbulb, Eye, Route, PartyPopper, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { schedule, dayTabs } from "@/lib/data"
import { nraSessions, sessionCategories, type Session } from "@/lib/sessions"

type ViewMode = "team" | "sessions"

const categoryIcons: Record<string, typeof GraduationCap> = {
  education: GraduationCap,
  culinary: ChefHat,
  beverage: Wine,
  innovation: Lightbulb,
  discovery: Eye,
  tour: Route,
  event: PartyPopper,
}

const categoryColors: Record<string, string> = {
  education: "var(--accent)",
  culinary: "var(--danger)",
  beverage: "var(--amber)",
  innovation: "var(--accent)",
  discovery: "var(--success)",
  tour: "var(--text-muted)",
  event: "var(--amber)",
  other: "var(--text-muted)",
}

export function SchedulePage() {
  const [activeDay, setActiveDay] = useState("sat")
  const [view, setView] = useState<ViewMode>("team")
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filteredSessions = (nraSessions[activeDay] || []).filter((s: Session) => {
    if (filter !== "all" && s.category !== filter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>Schedule</h1>

      {/* View Toggle */}
      <div className="flex gap-1.5 mb-4 p-1 rounded-lg" style={{ background: "var(--surface-alt)" }}>
        <button onClick={() => setView("team")}
          className="flex-1 py-2 rounded-md text-[13px] font-semibold cursor-pointer transition-all duration-200 text-center"
          style={{
            background: view === "team" ? "var(--surface)" : "transparent",
            color: view === "team" ? "var(--text)" : "var(--text-muted)",
            boxShadow: view === "team" ? "var(--shadow-sm)" : "none",
            border: "none",
          }}>
          Our Schedule
        </button>
        <button onClick={() => setView("sessions")}
          className="flex-1 py-2 rounded-md text-[13px] font-semibold cursor-pointer transition-all duration-200 text-center"
          style={{
            background: view === "sessions" ? "var(--surface)" : "transparent",
            color: view === "sessions" ? "var(--text)" : "var(--text-muted)",
            boxShadow: view === "sessions" ? "var(--shadow-sm)" : "none",
            border: "none",
          }}>
          NRA Sessions (132)
        </button>
      </div>

      {/* Floor Plan Link */}
      <a href="https://directory.nationalrestaurantshow.com/8_0/floorplan/?hallID=campus&level=3"
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl py-3 w-full no-underline text-sm font-semibold mb-4 transition-all duration-200 active:scale-[0.98]"
        style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
        <Map size={16} /> Interactive Floor Plan
        <ExternalLink size={12} />
      </a>

      {view === "team" && (
        <>
          <div className="rounded-xl p-3 mb-4 flex gap-2 items-start text-[13px]"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
            <Clock size={15} className="flex-shrink-0 mt-0.5" />
            <span>Show floor open <strong>9:30am - 5:00pm</strong> (Sat-Mon) and <strong>9:30am - 3:00pm</strong> Tuesday. Early teardown is <strong>prohibited</strong>.</span>
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 mb-4">
            {dayTabs.map((d) => (
              <button key={d.key} onClick={() => setActiveDay(d.key)}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer text-center transition-all duration-200"
                style={{
                  background: activeDay === d.key ? "var(--accent)" : "var(--surface)",
                  color: activeDay === d.key ? "var(--accent-fg)" : "var(--text-secondary)",
                  border: `1px solid ${activeDay === d.key ? "var(--accent)" : "var(--border)"}`,
                }}>
                {d.label}
              </button>
            ))}
          </div>

          {activeDay === "tue" && (
            <div className="rounded-xl p-3 mb-3 flex gap-2.5 items-start text-[13px]"
              style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span><strong>Last day closes at 3:00pm.</strong> Early teardown prohibited.</span>
            </div>
          )}

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
        </>
      )}

      {view === "sessions" && (
        <>
          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg text-sm pl-10 pr-4 py-2.5 outline-none transition-all duration-200"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
          </div>

          {/* Day Tabs */}
          <div className="flex gap-2 mb-3">
            {dayTabs.map((d) => (
              <button key={d.key} onClick={() => setActiveDay(d.key)}
                className="flex-1 py-2 rounded-lg text-[12px] font-semibold cursor-pointer text-center transition-all duration-200"
                style={{
                  background: activeDay === d.key ? "var(--accent)" : "var(--surface)",
                  color: activeDay === d.key ? "var(--accent-fg)" : "var(--text-secondary)",
                  border: `1px solid ${activeDay === d.key ? "var(--accent)" : "var(--border)"}`,
                }}>
                {d.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
            {sessionCategories.map((c) => (
              <button key={c.key} onClick={() => setFilter(c.key)}
                className="flex-shrink-0 py-1.5 px-3 rounded-full text-[11px] font-semibold cursor-pointer transition-all duration-200"
                style={{
                  background: filter === c.key ? "var(--accent)" : "var(--surface)",
                  color: filter === c.key ? "var(--accent-fg)" : "var(--text-secondary)",
                  border: `1px solid ${filter === c.key ? "var(--accent)" : "var(--border)"}`,
                }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Count */}
          <div className="text-[12px] font-medium mb-3" style={{ color: "var(--text-muted)" }}>
            {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""}
          </div>

          {/* Session Cards */}
          <div className="space-y-2">
            {filteredSessions.map((session, i) => {
              const CatIcon = categoryIcons[session.category]
              return (
                <div key={i} className="rounded-xl p-3.5 transition-colors duration-200"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start gap-3">
                    {CatIcon && (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "var(--surface-alt)" }}>
                        <CatIcon size={14} style={{ color: categoryColors[session.category] || "var(--text-muted)" }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] leading-snug" style={{ color: "var(--text)" }}>
                        {session.title}
                      </div>
                      <div className="text-[11px] mt-1 font-medium" style={{ color: "var(--accent)" }}>
                        {session.time}
                      </div>
                      <div className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {session.location}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredSessions.length === 0 && (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <Search size={32} className="mx-auto mb-2 opacity-40" />
              <div className="text-sm">No sessions match your filters.</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
