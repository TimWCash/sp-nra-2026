"use client"

import { useState, useEffect } from "react"
import { Users, Target } from "lucide-react"
import { team as teamData } from "@/lib/data"

type MemberStatus = "at-booth" | "on-break" | "walking" | "in-meeting" | "off"

interface TeamMemberStatus {
  name: string
  initials: string
  photo?: string
  status: MemberStatus
}

const STORAGE_KEY = "sp_team_status"
const LEADS_KEY = "sp_nra_leads"
const DAILY_GOAL = 20

const statusConfig: Record<MemberStatus, { label: string; color: string; bg: string }> = {
  "at-booth": { label: "At Booth", color: "var(--success)", bg: "var(--success-light)" },
  "on-break": { label: "On Break", color: "var(--amber)", bg: "var(--amber-light)" },
  "walking": { label: "Walking Floor", color: "var(--accent)", bg: "var(--accent-light)" },
  "in-meeting": { label: "In Meeting", color: "var(--purple)", bg: "var(--purple-light)" },
  "off": { label: "Off", color: "var(--text-muted)", bg: "var(--surface-alt)" },
}

const statusOrder: MemberStatus[] = ["at-booth", "on-break", "walking", "in-meeting", "off"]

const defaultTeam: TeamMemberStatus[] = teamData.map((m) => ({
  name: m.name,
  initials: m.initials,
  photo: m.photo,
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

export function TeamStatusPage() {
  const [team, setTeam] = useState<TeamMemberStatus[]>(defaultTeam)
  const [leadCount, setLeadCount] = useState(0)

  useEffect(() => {
    setTeam(loadTeam())
    setLeadCount(getLeadCount())
  }, [])

  function cycleStatus(index: number) {
    const updated = [...team]
    const current = statusOrder.indexOf(updated[index].status)
    updated[index] = { ...updated[index], status: statusOrder[(current + 1) % statusOrder.length] }
    setTeam(updated)
    saveTeam(updated)
  }

  // Summary counts
  const counts: Record<MemberStatus, number> = { "at-booth": 0, "on-break": 0, "walking": 0, "in-meeting": 0, "off": 0 }
  team.forEach((m) => counts[m.status]++)

  const summaryParts: string[] = []
  if (counts["at-booth"]) summaryParts.push(`${counts["at-booth"]} at booth`)
  if (counts["on-break"]) summaryParts.push(`${counts["on-break"]} on break`)
  if (counts["walking"]) summaryParts.push(`${counts["walking"]} walking`)
  if (counts["in-meeting"]) summaryParts.push(`${counts["in-meeting"]} in meeting`)
  if (counts["off"]) summaryParts.push(`${counts["off"]} off`)

  const progressPct = Math.min(100, Math.round((leadCount / DAILY_GOAL) * 100))

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Team Status</h1>

      {/* Summary bar */}
      <div className="text-[13px] font-medium mb-4" style={{ color: "var(--text-muted)" }}>
        {summaryParts.join(" \u00b7 ")}
      </div>

      {/* Team cards */}
      <div className="space-y-2.5 mb-6">
        {team.map((member, i) => {
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
              <div className="flex gap-1">
                {statusOrder.map((s) => (
                  <div key={s} className="w-2 h-2 rounded-full transition-all duration-200"
                    style={{
                      background: member.status === s ? statusConfig[s].color : "var(--border)",
                      opacity: member.status === s ? 1 : 0.4,
                    }} />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--text-muted)" }}>
        Tap a card to cycle status
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOrder.map((s) => (
          <span key={s} className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: statusConfig[s].bg, color: statusConfig[s].color }}>
            {statusConfig[s].label}
          </span>
        ))}
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
