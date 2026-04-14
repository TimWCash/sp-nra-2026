"use client"

import { useState, useEffect, useCallback } from "react"
import { Users, Target, CheckCircle } from "lucide-react"
import { team as teamData } from "@/lib/data"
import { NotificationPermission } from "@/components/NotificationPermission"

type MemberStatus = "at-booth" | "on-break" | "walking" | "in-meeting" | "off"
type ShiftValue = "day" | "night" | "both" | undefined
type ShiftFilter = "all" | "day" | "night"

interface TeamMemberStatus {
  name: string
  initials: string
  photo?: string
  shift?: "day" | "night" | "both"
  status: MemberStatus
}

const STORAGE_KEY = "sp_team_status"
const LEADS_KEY = "sp_nra_leads"
const BAT_SIGNAL_KEY = "sp_bat_signal"
const DAILY_GOAL = 20

const statusConfig: Record<MemberStatus, { label: string; color: string; bg: string }> = {
  "at-booth": { label: "At Booth", color: "var(--success)", bg: "var(--success-light)" },
  "on-break": { label: "On Break", color: "var(--amber)", bg: "var(--amber-light)" },
  "walking": { label: "Walking Floor", color: "var(--accent)", bg: "var(--accent-light)" },
  "in-meeting": { label: "In Meeting", color: "var(--purple)", bg: "var(--purple-light)" },
  "off": { label: "Off", color: "var(--text-muted)", bg: "var(--surface-alt)" },
}

const statusOrder: MemberStatus[] = ["at-booth", "on-break", "walking", "in-meeting", "off"]
const shiftOrder: ShiftValue[] = [undefined, "day", "night", "both"]

const defaultTeam: TeamMemberStatus[] = teamData.map((m) => ({
  name: m.name,
  initials: m.initials,
  photo: m.photo,
  shift: undefined,
  status: "off" as MemberStatus,
}))

function loadTeam(): TeamMemberStatus[] {
  if (typeof window === "undefined") return defaultTeam
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
    if (Array.isArray(stored) && stored.length === defaultTeam.length) return stored
    return defaultTeam
  } catch { return defaultTeam }
}

function saveTeam(team: TeamMemberStatus[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(team))
}

function getLeadCount(): number {
  if (typeof window === "undefined") return 0
  try {
    const leads = JSON.parse(localStorage.getItem(LEADS_KEY) || "[]")
    return Array.isArray(leads) ? leads.length : 0
  } catch { return 0 }
}

async function fetchBatSignal(): Promise<{ active: boolean; since: number }> {
  try {
    const res = await fetch("/api/bat-signal", { cache: "no-store" })
    return await res.json()
  } catch { return { active: false, since: 0 } }
}

async function postBatSignal(active: boolean): Promise<void> {
  try {
    await fetch("/api/bat-signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
  } catch { /* ignore */ }
  localStorage.setItem(BAT_SIGNAL_KEY, JSON.stringify({ active, since: active ? Date.now() : 0 }))
}

export function TeamStatusPage() {
  const [team, setTeam] = useState<TeamMemberStatus[]>(defaultTeam)
  const [leadCount, setLeadCount] = useState(0)
  const [batSignal, setBatSignalState] = useState<{ active: boolean; since: number }>({ active: false, since: 0 })
  const [pulse, setPulse] = useState(false)
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all")

  useEffect(() => {
    setTeam(loadTeam())
    setLeadCount(getLeadCount())
    fetchBatSignal().then(setBatSignalState)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBatSignal().then(setBatSignalState)
      setLeadCount(getLeadCount())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!batSignal.active) return
    const interval = setInterval(() => setPulse((p) => !p), 800)
    return () => clearInterval(interval)
  }, [batSignal.active])

  function cycleStatus(index: number) {
    const updated = [...team]
    const current = statusOrder.indexOf(updated[index].status)
    updated[index] = { ...updated[index], status: statusOrder[(current + 1) % statusOrder.length] }
    setTeam(updated)
    saveTeam(updated)
  }

  function cycleShift(index: number, e: React.MouseEvent) {
    e.stopPropagation()
    const updated = [...team]
    const current = shiftOrder.indexOf(updated[index].shift)
    updated[index] = { ...updated[index], shift: shiftOrder[(current + 1) % shiftOrder.length] }
    setTeam(updated)
    saveTeam(updated)
  }

  const activateBatSignal = useCallback(async () => {
    const now = Date.now()
    setBatSignalState({ active: true, since: now })
    await postBatSignal(true)
  }, [])

  const clearBatSignal = useCallback(async () => {
    setBatSignalState({ active: false, since: 0 })
    await postBatSignal(false)
  }, [])

  const minutesAgo = batSignal.since
    ? Math.floor((Date.now() - batSignal.since) / 60000)
    : 0

  const counts: Record<MemberStatus, number> = { "at-booth": 0, "on-break": 0, "walking": 0, "in-meeting": 0, "off": 0 }
  team.forEach((m) => counts[m.status]++)

  const summaryParts: string[] = []
  if (counts["at-booth"]) summaryParts.push(`${counts["at-booth"]} at booth`)
  if (counts["on-break"]) summaryParts.push(`${counts["on-break"]} on break`)
  if (counts["walking"]) summaryParts.push(`${counts["walking"]} walking`)
  if (counts["in-meeting"]) summaryParts.push(`${counts["in-meeting"]} in meeting`)

  const progressPct = Math.min(100, Math.round((leadCount / DAILY_GOAL) * 100))

  const filteredTeam = team.filter((m) => {
    if (shiftFilter === "all") return true
    if (shiftFilter === "day") return m.shift === "day" || m.shift === "both"
    if (shiftFilter === "night") return m.shift === "night" || m.shift === "both"
    return true
  })

  const shiftsAssigned = team.some((m) => m.shift)

  return (
    <div className="animate-fade-in">

      {/* ── BAT SIGNAL ACTIVE BANNER ── */}
      {batSignal.active && (
        <div
          className="rounded-2xl p-4 mb-5 flex items-center gap-3 transition-all duration-300"
          style={{
            background: pulse ? "var(--danger)" : "#c0392b",
            boxShadow: pulse
              ? "0 0 32px rgba(220,53,69,0.6), 0 4px 16px rgba(0,0,0,0.2)"
              : "0 0 16px rgba(220,53,69,0.3), 0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          <span className="text-3xl" style={{ filter: pulse ? "drop-shadow(0 0 8px white)" : "none" }}>🦇</span>
          <div className="flex-1">
            <div className="font-extrabold text-white text-[15px] leading-tight">BAT SIGNAL ACTIVE</div>
            <div className="text-white/80 text-[12px] mt-0.5">
              All hands to Booth #7365{minutesAgo > 0 ? ` · ${minutesAgo}m ago` : " · just now"}
            </div>
          </div>
          <button
            onClick={clearBatSignal}
            className="flex flex-col items-center gap-0.5 cursor-pointer bg-white/20 rounded-xl px-3 py-2 active:scale-95 transition-transform border-0"
          >
            <CheckCircle size={18} color="white" />
            <span className="text-[10px] font-bold text-white">All Clear</span>
          </button>
        </div>
      )}

      {/* ── NOTIFICATION PERMISSION ── */}
      <NotificationPermission />

      {/* ── BAT SIGNAL BUTTON ── */}
      {!batSignal.active && (
        <button
          onClick={activateBatSignal}
          className="w-full rounded-2xl p-5 mb-5 flex flex-col items-center gap-2 cursor-pointer active:scale-[0.97] transition-all duration-150 border-0"
          style={{
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <span className="text-5xl" style={{ filter: "drop-shadow(0 0 12px rgba(255,200,0,0.8))" }}>🦇</span>
          <div className="text-white font-extrabold text-[17px] tracking-wide">BAT SIGNAL</div>
          <div className="text-white/50 text-[12px]">Booth is slammed — call all hands</div>
        </button>
      )}

      <h2 className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>
        Team · {summaryParts.join(" · ") || "All off"}
      </h2>

      {/* Shift filter chips — only show once shifts are assigned */}
      {shiftsAssigned && (
        <div className="flex gap-1.5 mb-3">
          {(["all", "day", "night"] as ShiftFilter[]).map((s) => (
            <button key={s} onClick={() => setShiftFilter(s)}
              className="flex-1 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all duration-200 border"
              style={{
                background: shiftFilter === s
                  ? s === "night" ? "var(--accent)" : s === "day" ? "var(--amber)" : "var(--text)"
                  : "var(--surface)",
                color: shiftFilter === s
                  ? s === "day" ? "#fff" : "var(--accent-fg)"
                  : "var(--text-secondary)",
                borderColor: shiftFilter === s
                  ? s === "night" ? "var(--accent)" : s === "day" ? "var(--amber)" : "var(--text)"
                  : "var(--border)",
              }}>
              {s === "all" ? "All" : s === "day" ? "☀️ Day" : "🌙 Night"}
            </button>
          ))}
        </div>
      )}

      {/* Team cards */}
      <div className="space-y-2.5 mb-2">
        {filteredTeam.map((member) => {
          const i = team.indexOf(member)
          const cfg = statusConfig[member.status]
          return (
            <button key={member.name} onClick={() => cycleStatus(i)}
              className="w-full flex items-center gap-3 rounded-xl p-3.5 cursor-pointer transition-all duration-200 active:scale-[0.98] text-left"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              {member.photo ? (
                <img src={member.photo} alt={member.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  style={{ border: `2px solid ${cfg.color}` }} />
              ) : (
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {member.initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{member.name}</div>
                <div className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</div>
              </div>
              {/* Shift badge — tappable to cycle */}
              <button
                onClick={(e) => cycleShift(i, e)}
                className="flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer border transition-all active:scale-90"
                style={{
                  background: member.shift === "day" ? "var(--amber-light)"
                    : member.shift === "night" ? "var(--accent-light)"
                    : member.shift === "both" ? "var(--surface-alt)"
                    : "var(--surface-alt)",
                  color: member.shift === "day" ? "var(--amber)"
                    : member.shift === "night" ? "var(--accent)"
                    : member.shift === "both" ? "var(--text-secondary)"
                    : "var(--border)",
                  borderColor: member.shift === "day" ? "var(--amber)"
                    : member.shift === "night" ? "var(--accent)"
                    : member.shift === "both" ? "var(--border)"
                    : "var(--border)",
                }}>
                {member.shift === "day" ? "☀️ Day"
                  : member.shift === "night" ? "🌙 Night"
                  : member.shift === "both" ? "☀️🌙"
                  : "— shift"}
              </button>
            </button>
          )
        })}
      </div>

      <div className="text-[11px] mb-6" style={{ color: "var(--text-muted)" }}>
        Tap card to cycle status · Tap shift badge to assign
      </div>

      {/* Lead goal progress */}
      <SectionLabel>Daily Lead Goal</SectionLabel>
      <div className="rounded-xl p-4 mb-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {leadCount} / {DAILY_GOAL} leads
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: progressPct >= 100 ? "var(--success-light)" : "var(--accent-light)",
              color: progressPct >= 100 ? "var(--success)" : "var(--accent)",
            }}>
            {progressPct}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "var(--surface-alt)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: progressPct >= 100 ? "var(--success)" : "var(--accent)",
            }} />
        </div>
      </div>

      {/* Leaderboard placeholder */}
      <SectionLabel>Leaderboard</SectionLabel>
      <div className="rounded-xl p-6 text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <Users size={32} className="mx-auto mb-2 opacity-30" style={{ color: "var(--text-muted)" }} />
        <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Coming soon</div>
        <div className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Individual lead counts will appear here</div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold tracking-widest uppercase mb-2.5" style={{ color: "var(--text-muted)" }}>{children}</div>
}
