"use client"

import { useState, useEffect } from "react"
import { Clock, AlertTriangle, CircleDot, Search, Map, GraduationCap, ChefHat, Wine, Lightbulb, Eye, Route, PartyPopper, ExternalLink, X, CalendarPlus, MapPin, Star, ChevronRight, Moon, Ticket } from "lucide-react"
import { schedule, dayTabs, afterHoursEvents, type AfterHoursEvent } from "@/lib/data"
import { nraSessions, sessionCategories, type Session } from "@/lib/sessions"

type ViewMode = "team" | "sessions" | "nights"

const nightTabs = [
  { key: "fri", label: "Fri 15", sub: "Pre-Show" },
  { key: "sat", label: "Sat 16", sub: "" },
  { key: "sun", label: "Sun 17", sub: "" },
  { key: "mon", label: "Mon 18", sub: "" },
  { key: "tue", label: "Tue 19", sub: "" },
  { key: "any", label: "Spots", sub: "Any night" },
]

const typeEmoji: Record<string, string> = {
  party: "🎉",
  dinner: "🍽️",
  awards: "🏆",
  "happy-hour": "🍺",
  bar: "🍸",
  meetup: "🤝",
  spot: "📍",
}

const accessLabel: Record<string, string> = {
  free: "Free",
  badge: "NRA Badge",
  rsvp: "RSVP",
  paid: "Paid",
  operators: "Operators Only",
  invite: "Invite Only",
}

const accessStyle: Record<string, { bg: string; color: string }> = {
  free:      { bg: "var(--success-light, #e6f7f0)", color: "var(--success, #059669)" },
  badge:     { bg: "var(--accent-light)", color: "var(--accent)" },
  rsvp:      { bg: "var(--amber-light, #fef3c7)", color: "var(--amber, #d97706)" },
  paid:      { bg: "var(--amber-light, #fef3c7)", color: "var(--amber, #d97706)" },
  operators: { bg: "var(--accent-light)", color: "var(--accent)" },
  invite:    { bg: "var(--surface-alt)", color: "var(--text-muted)" },
}

const totalSessions = Object.values(nraSessions).flat().length

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

const categoryLabels: Record<string, string> = {
  education: "Education Session",
  culinary: "Culinary Experience",
  beverage: "Beverage Room",
  innovation: "Innovation Theater",
  discovery: "Discovery Theater",
  tour: "Guided Tour",
  event: "Networking Event",
  other: "Session",
}

const dayDates: Record<string, { label: string; date: string; dateNum: string }> = {
  fri: { label: "Friday, May 15", date: "2026-05-15", dateNum: "20260515" },
  sat: { label: "Saturday, May 16", date: "2026-05-16", dateNum: "20260516" },
  sun: { label: "Sunday, May 17", date: "2026-05-17", dateNum: "20260517" },
  mon: { label: "Monday, May 18", date: "2026-05-18", dateNum: "20260518" },
  tue: { label: "Tuesday, May 19", date: "2026-05-19", dateNum: "20260519" },
}

function parseTime(timeStr: string): { start: string; end: string } {
  // "10:30 AM - 11:15 AM" -> { start: "10:30 AM", end: "11:15 AM" }
  const parts = timeStr.split(" - ")
  return { start: parts[0]?.trim() || "", end: parts[1]?.trim() || "" }
}

function to24h(time12: string): { h: number; m: number } {
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return { h: 0, m: 0 }
  let h = parseInt(match[1])
  const m = parseInt(match[2])
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && h !== 12) h += 12
  if (ampm === "AM" && h === 12) h = 0
  return { h, m }
}

function formatICSDate(dateStr: string, time12: string): string {
  const { h, m } = to24h(time12)
  // Chicago is CDT (UTC-5) in May
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${dateStr.replace(/-/g, "")}T${pad(h)}${pad(m)}00`
}

function generateICS(session: Session, dayKey: string): string {
  const dayInfo = dayDates[dayKey]
  if (!dayInfo) return ""
  const { start, end } = parseTime(session.time)
  const dtStart = formatICSDate(dayInfo.date, start)
  const dtEnd = formatICSDate(dayInfo.date, end)
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SP NRA 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART;TZID=America/Chicago:${dtStart}`,
    `DTEND;TZID=America/Chicago:${dtEnd}`,
    `DTSTAMP:${now}`,
    `UID:sp-nra-${dtStart}-${session.title.replace(/\W/g, "").slice(0, 30)}@servicephysics.com`,
    `SUMMARY:${session.title}`,
    `LOCATION:${session.location} - McCormick Place\\, Chicago IL`,
    `DESCRIPTION:NRA Show 2026 - ${categoryLabels[session.category] || "Session"}\\n\\n${session.spPick ? "⭐ SP Recommended\\n" : ""}McCormick Place\\, Chicago`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

function generateGoogleCalURL(session: Session, dayKey: string): string {
  const dayInfo = dayDates[dayKey]
  if (!dayInfo) return ""
  const { start, end } = parseTime(session.time)
  const dtStart = formatICSDate(dayInfo.date, start)
  const dtEnd = formatICSDate(dayInfo.date, end)

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: session.title,
    dates: `${dtStart}/${dtEnd}`,
    ctz: "America/Chicago",
    location: `${session.location}, McCormick Place, Chicago IL`,
    details: `NRA Show 2026 - ${categoryLabels[session.category] || "Session"}${session.spPick ? "\n⭐ SP Recommended" : ""}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function downloadICS(session: Session, dayKey: string) {
  const ics = generateICS(session, dayKey)
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${session.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function getDuration(timeStr: string): string {
  const { start, end } = parseTime(timeStr)
  const s = to24h(start)
  const e = to24h(end)
  const mins = (e.h * 60 + e.m) - (s.h * 60 + s.m)
  if (mins <= 0) return ""
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

const USER_STARS_KEY = "sp_user_starred_sessions"

function loadUserStars(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(USER_STARS_KEY) || "[]")) } catch { return new Set() }
}
function saveUserStars(s: Set<string>) {
  localStorage.setItem(USER_STARS_KEY, JSON.stringify([...s]))
}

export function SchedulePage() {
  const [activeDay, setActiveDay] = useState("fri")
  const [activeNight, setActiveNight] = useState("sat")
  const [view, setView] = useState<ViewMode>("team")
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedSession, setSelectedSession] = useState<{ session: Session; dayKey: string } | null>(null)
  const [calMenuOpen, setCalMenuOpen] = useState(false)
  const [userStars, setUserStars] = useState<Set<string>>(new Set())

  useEffect(() => { setUserStars(loadUserStars()) }, [])

  function toggleStar(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation()
    const next = new Set(userStars)
    next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId)
    setUserStars(next)
    saveUserStars(next)
  }

  const filteredSessions = (nraSessions[activeDay] || []).filter((s: Session) => {
    if (filter === "spPick" && !s.spPick) return false
    if (filter === "myStars" && !userStars.has(s.title)) return false
    else if (filter !== "all" && filter !== "spPick" && filter !== "myStars" && s.category !== filter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const openDetail = (session: Session) => {
    setSelectedSession({ session, dayKey: activeDay })
    setCalMenuOpen(false)
  }

  const closeDetail = () => {
    setSelectedSession(null)
    setCalMenuOpen(false)
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>Schedule</h1>

      {/* View Toggle */}
      <div className="flex gap-1.5 mb-4 p-1 rounded-lg" style={{ background: "var(--surface-alt)" }}>
        <button onClick={() => setView("team")}
          className="flex-1 py-2 rounded-md text-[12px] font-semibold cursor-pointer transition-all duration-200 text-center"
          style={{
            background: view === "team" ? "var(--surface)" : "transparent",
            color: view === "team" ? "var(--text)" : "var(--text-muted)",
            boxShadow: view === "team" ? "var(--shadow-sm)" : "none",
            border: "none",
          }}>
          Our Schedule
        </button>
        <button onClick={() => setView("sessions")}
          className="flex-1 py-2 rounded-md text-[12px] font-semibold cursor-pointer transition-all duration-200 text-center"
          style={{
            background: view === "sessions" ? "var(--surface)" : "transparent",
            color: view === "sessions" ? "var(--text)" : "var(--text-muted)",
            boxShadow: view === "sessions" ? "var(--shadow-sm)" : "none",
            border: "none",
          }}>
          NRA Sessions
        </button>
        <button onClick={() => setView("nights")}
          className="flex-1 py-2 rounded-md text-[12px] font-semibold cursor-pointer transition-all duration-200 text-center"
          style={{
            background: view === "nights" ? "var(--surface)" : "transparent",
            color: view === "nights" ? "var(--text)" : "var(--text-muted)",
            boxShadow: view === "nights" ? "var(--shadow-sm)" : "none",
            border: "none",
          }}>
          🌙 Nights
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
          <div className="flex gap-1.5 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
            {dayTabs.map((d) => (
              <button key={d.key} onClick={() => setActiveDay(d.key)}
                className="flex-1 min-w-0 py-2.5 rounded-lg text-[12px] font-semibold cursor-pointer text-center transition-all duration-200 whitespace-nowrap"
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
                  {event.link && (
                    <a href={event.link.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold no-underline px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-[0.97]"
                      style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
                      <ExternalLink size={12} /> {event.link.label}
                    </a>
                  )}
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
            <button onClick={() => setFilter("myStars")}
              className="flex-shrink-0 py-1.5 px-3 rounded-full text-[11px] font-semibold cursor-pointer transition-all duration-200"
              style={{
                background: filter === "myStars" ? "var(--amber)" : "var(--surface)",
                color: filter === "myStars" ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${filter === "myStars" ? "var(--amber)" : "var(--border)"}`,
              }}>
              ☆ My Sessions{userStars.size > 0 ? ` (${userStars.size})` : ""}
            </button>
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
                <button key={i}
                  onClick={() => openDetail(session)}
                  className="w-full text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start gap-3">
                    {CatIcon && (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "var(--surface-alt)" }}>
                        <CatIcon size={14} style={{ color: categoryColors[session.category] || "var(--text-muted)" }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] leading-snug flex items-start gap-1.5" style={{ color: "var(--text)" }}>
                        {session.spPick && <span className="text-[12px] flex-shrink-0" title="SP Recommended">⭐</span>}
                        <span>{session.title}</span>
                      </div>
                      <div className="text-[11px] mt-1 font-medium" style={{ color: "var(--accent)" }}>
                        {session.time}
                      </div>
                      <div className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {session.location}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                      <button
                        onClick={(e) => toggleStar(e, session.title)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150 active:scale-90"
                        style={{ background: "transparent", border: "none" }}
                        title={userStars.has(session.title) ? "Remove from My Sessions" : "Add to My Sessions"}>
                        <Star
                          size={16}
                          fill={userStars.has(session.title) ? "var(--amber)" : "none"}
                          style={{ color: userStars.has(session.title) ? "var(--amber)" : "var(--text-muted)", opacity: userStars.has(session.title) ? 1 : 0.4 }}
                        />
                      </button>
                      <ChevronRight size={16} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                    </div>
                  </div>
                </button>
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

      {/* ── NIGHTS VIEW ── */}
      {view === "nights" && (
        <>
          {/* Night tabs */}
          <div className="flex gap-1.5 mb-5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {nightTabs.map((t) => {
              const count = afterHoursEvents.filter(e => e.night === t.key).length
              return (
                <button key={t.key} onClick={() => setActiveNight(t.key)}
                  className="flex-shrink-0 flex flex-col items-center rounded-xl py-2 px-3 cursor-pointer transition-all duration-200"
                  style={{
                    background: activeNight === t.key ? "var(--accent)" : "var(--surface)",
                    color: activeNight === t.key ? "var(--accent-fg)" : "var(--text-secondary)",
                    border: `1px solid ${activeNight === t.key ? "var(--accent)" : "var(--border)"}`,
                    minWidth: "3.5rem",
                  }}>
                  <span className="text-[12px] font-bold">{t.label}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-semibold mt-0.5" style={{ opacity: activeNight === t.key ? 0.8 : 0.5 }}>
                      {count} {t.key === "any" ? "" : "event" + (count !== 1 ? "s" : "")}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Event cards */}
          {(() => {
            const events = afterHoursEvents.filter(e => e.night === activeNight)
            if (events.length === 0) {
              return (
                <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
                  <Moon size={32} className="mx-auto mb-2 opacity-30" />
                  <div className="text-sm">No events found for this night.</div>
                </div>
              )
            }
            // Separate spots from events
            const spots = events.filter(e => e.type === "spot")
            const nonSpots = events.filter(e => e.type !== "spot")
            return (
              <div className="space-y-5">
                {nonSpots.length > 0 && (
                  <div className="space-y-3">
                    {activeNight === "any" && (
                      <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
                        Bar & Restaurant Spots
                      </div>
                    )}
                    {nonSpots.map((ev: AfterHoursEvent) => (
                      <NightEventCard key={ev.id} event={ev} />
                    ))}
                  </div>
                )}
                {spots.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold tracking-widest uppercase mt-2" style={{ color: "var(--text-muted)" }}>
                      Worth Checking Out
                    </div>
                    {spots.map((ev: AfterHoursEvent) => (
                      <NightEventCard key={ev.id} event={ev} />
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </>
      )}

      {/* ── SESSION DETAIL MODAL ── */}
      {selectedSession && (
        <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "var(--bg)" }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <button onClick={closeDetail} className="flex items-center gap-1.5 text-sm font-semibold cursor-pointer rounded-lg py-2 px-3 transition-all duration-200 active:scale-[0.97]"
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--accent)" }}>
              <X size={16} /> Close
            </button>
            {selectedSession.session.spPick && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "var(--amber-light)", color: "var(--amber)", border: "1px solid var(--amber)" }}>
                <Star size={10} fill="currentColor" /> SP Pick
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Category Badge */}
            <div className="mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--surface-alt)",
                  color: categoryColors[selectedSession.session.category] || "var(--text-muted)",
                }}>
                {(() => { const CI = categoryIcons[selectedSession.session.category]; return CI ? <CI size={10} className="inline mr-1 -mt-0.5" /> : null; })()}
                {categoryLabels[selectedSession.session.category] || "Session"}
              </span>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold leading-snug mb-4" style={{ color: "var(--text)" }}>
              {selectedSession.session.title}
            </h2>

            {/* Details Cards */}
            <div className="space-y-3 mb-6">
              {/* Date & Time */}
              <div className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Clock size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {dayDates[selectedSession.dayKey]?.label}
                  </div>
                  <div className="text-[13px] mt-0.5" style={{ color: "var(--accent)" }}>
                    {selectedSession.session.time}
                  </div>
                  {getDuration(selectedSession.session.time) && (
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Duration: {getDuration(selectedSession.session.time)}
                    </div>
                  )}
                  <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Times displayed in Central Time (CT)
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <MapPin size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    {selectedSession.session.location}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    McCormick Place, Chicago IL
                  </div>
                </div>
              </div>

              {/* Conference */}
              <div className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <GraduationCap size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    National Restaurant Association Show 2026
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    May 16–19, 2026
                  </div>
                </div>
              </div>
            </div>

            {/* SP Pick Callout */}
            {selectedSession.session.spPick && (
              <div className="rounded-xl p-3.5 mb-6 flex gap-2.5 items-start text-[13px]"
                style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
                <Star size={15} className="flex-shrink-0 mt-0.5" fill="currentColor" />
                <span><strong>SP Recommended</strong> — This session is relevant to Service Physics and our work in restaurant operations.</span>
              </div>
            )}

            {/* Add to Calendar Button */}
            <div className="relative">
              <button
                onClick={() => setCalMenuOpen(!calMenuOpen)}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-[15px] font-bold cursor-pointer transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-fg)",
                  border: "none",
                  boxShadow: "var(--shadow-md)",
                }}>
                <CalendarPlus size={18} />
                Add to Calendar
              </button>

              {/* Calendar Options Dropdown */}
              {calMenuOpen && (
                <div className="mt-2 rounded-xl overflow-hidden"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
                  {/* Outlook / Apple (.ics download) */}
                  <button onClick={() => { downloadICS(selectedSession.session, selectedSession.dayKey); setCalMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer transition-all duration-200 border-b"
                    style={{ background: "transparent", border: "none", borderBottom: "1px solid var(--border)", color: "var(--text)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-alt)" }}>
                      <span className="text-lg">📅</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Outlook / Apple Calendar</div>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Downloads .ics file</div>
                    </div>
                  </button>

                  {/* Google Calendar */}
                  <a href={generateGoogleCalURL(selectedSession.session, selectedSession.dayKey)}
                    target="_blank" rel="noopener noreferrer"
                    onClick={() => setCalMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer transition-all duration-200 no-underline"
                    style={{ color: "var(--text)" }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-alt)" }}>
                      <span className="text-lg">📆</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Google Calendar</div>
                      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Opens in new tab</div>
                    </div>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NightEventCard({ event }: { event: AfterHoursEvent }) {
  const aStyle = accessStyle[event.access] || accessStyle.invite
  const emoji = typeEmoji[event.type] || "🎟️"
  const label = accessLabel[event.access] || event.access

  return (
    <div className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {/* Top row: time + access badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{emoji}</span>
          {event.time && (
            <span className="text-[12px] font-semibold" style={{ color: "var(--accent)" }}>{event.time}</span>
          )}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
          style={{ background: aStyle.bg, color: aStyle.color }}>
          {label}
        </span>
      </div>

      {/* Title */}
      <div className="font-bold text-[14px] leading-snug mb-1" style={{ color: "var(--text)" }}>
        {event.title}
      </div>

      {/* Host */}
      {event.host && (
        <div className="text-[12px] mb-1" style={{ color: "var(--text-muted)" }}>
          {event.host}
        </div>
      )}

      {/* Venue */}
      <div className="flex items-start gap-1.5 mb-1">
        <MapPin size={11} className="flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
        <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {event.venue}{event.address ? ` · ${event.address}` : ""}
        </span>
      </div>

      {/* Cost */}
      {event.cost && (
        <div className="flex items-center gap-1.5 mb-2">
          <Ticket size={11} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{event.cost}</span>
        </div>
      )}

      {/* Notes */}
      {event.notes && (
        <div className="text-[11px] mb-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {event.notes}
        </div>
      )}

      {/* Register / link button */}
      {event.link && (
        <a href={event.link} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 rounded-lg no-underline transition-all duration-200 active:scale-[0.97]"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          <ExternalLink size={12} />
          {event.access === "rsvp" ? "Register / RSVP" : event.access === "paid" ? "Buy Ticket" : event.access === "invite" ? "Learn More" : "View Event"}
        </a>
      )}
    </div>
  )
}
