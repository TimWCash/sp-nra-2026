"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Users, Target, CheckCircle, Sunrise, Sunset } from "lucide-react"
import { team as teamData } from "@/lib/data"
import { NotificationPermission } from "@/components/NotificationPermission"
import { supabase } from "@/lib/supabase"
import { useBoothShifts, addBoothShift, removeBoothShift, shiftKey, type ShiftDay, type ShiftSlot } from "@/lib/booth-shifts"

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
const BAT_SIGNAL_KEY = "sp_bat_signal"
// Overall qualified-leads goal across the whole show. "Qualified" = heat is
// hot or warm (cool leads = met-but-not-relevant, excluded from the metric).
const QUALIFIED_GOAL = 50

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

/**
 * Live qualified-lead counter from Supabase. "Qualified" = hot or warm heat
 * (cool leads are met-but-not-relevant and don't count toward the goal).
 *
 * Returns { qualified, hot, warm, total } so the UI can show the breakdown.
 */
type LeadCounts = { qualified: number; hot: number; warm: number; total: number }

async function fetchLeadCounts(): Promise<LeadCounts> {
  try {
    const { data, error } = await supabase
      .from("nra_leads")
      .select("heat")
    if (error || !data) return { qualified: 0, hot: 0, warm: 0, total: 0 }
    let hot = 0
    let warm = 0
    for (const row of data as Array<{ heat: string }>) {
      if (row.heat === "hot") hot++
      else if (row.heat === "warm") warm++
    }
    return { qualified: hot + warm, hot, warm, total: data.length }
  } catch {
    return { qualified: 0, hot: 0, warm: 0, total: 0 }
  }
}

async function fetchBatSignal(): Promise<{ active: boolean; since: number }> {
  try {
    const res = await fetch("/api/bat-signal", { cache: "no-store" })
    return await res.json()
  } catch { return { active: false, since: 0 } }
}

/**
 * Fetch subscriber summary from the server-side status endpoint.
 *
 * The push_subscriptions table is no longer directly readable by the anon
 * client (RLS removed anon SELECT after the round-4 review's confused-deputy
 * finding). The server route returns the minimal projection — count + names
 * — without ever exposing endpoint URLs to the client.
 */
async function fetchPushStatus(): Promise<{ count: number; registeredNames: string[] }> {
  try {
    const res = await fetch("/api/push/status", { cache: "no-store" })
    if (!res.ok) return { count: 0, registeredNames: [] }
    const json = await res.json()
    return {
      count: typeof json.count === "number" ? json.count : 0,
      registeredNames: Array.isArray(json.registeredNames) ? json.registeredNames : [],
    }
  } catch {
    return { count: 0, registeredNames: [] }
  }
}

/**
 * Server response from /api/bat-signal POST. The route always returns these
 * fields (alongside `active`, `since`, and an optional `error`/`warning`).
 */
export type BatSignalSendResult = {
  ok: boolean
  pushed: number
  failed: number
  total: number
  error?: string
  warning?: string
}

async function postBatSignal(active: boolean): Promise<BatSignalSendResult> {
  try {
    const res = await fetch("/api/bat-signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
    const json: Partial<BatSignalSendResult> = await res.json().catch(() => ({}))
    localStorage.setItem(BAT_SIGNAL_KEY, JSON.stringify({ active, since: active ? Date.now() : 0 }))
    return {
      ok: res.ok,
      pushed: typeof json.pushed === "number" ? json.pushed : 0,
      failed: typeof json.failed === "number" ? json.failed : 0,
      total: typeof json.total === "number" ? json.total : 0,
      error: typeof json.error === "string" ? json.error : undefined,
      warning: typeof json.warning === "string" ? json.warning : undefined,
    }
  } catch {
    return { ok: false, pushed: 0, failed: 0, total: 0, error: "Network error — server unreachable." }
  }
}

export function TeamStatusPage() {
  const [team, setTeam] = useState<TeamMemberStatus[]>(defaultTeam)
  const [leadCounts, setLeadCounts] = useState<LeadCounts>({ qualified: 0, hot: 0, warm: 0, total: 0 })
  const [batSignal, setBatSignalState] = useState<{ active: boolean; since: number }>({ active: false, since: 0 })
  const [pulse, setPulse] = useState(false)
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("all")
  const [subCount, setSubCount] = useState<number | null>(null)
  const [registeredNames, setRegisteredNames] = useState<string[]>([])
  const [showRegistry, setShowRegistry] = useState(false)
  // Last bat-signal send result — surfaced as a status card so Tim/whoever
  // tapped can SEE pushed/failed/total instead of guessing. Cleared after
  // 12 seconds so the card doesn't linger forever.
  const [lastSendResult, setLastSendResult] = useState<BatSignalSendResult | null>(null)
  const [sending, setSending] = useState(false)
  // Booth shift coverage — realtime map of "day:shift" → names
  const shiftCoverage = useBoothShifts()
  // Who am I? Mirrors the pattern used in SchedulePage / SetupPage.
  const [userName, setUserName] = useState<string>("")
  useEffect(() => {
    const read = () => setUserName(localStorage.getItem("sp_user_name") || "")
    read()
    window.addEventListener("focus", read)
    return () => window.removeEventListener("focus", read)
  }, [])

  // Realtime qualified-lead counter — any teammate's lead save / heat
  // change / delete updates this card instantly across every device.
  useEffect(() => {
    const channel = supabase
      .channel("nra_leads_qualified_counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "nra_leads" },
        () => { fetchLeadCounts().then(setLeadCounts) })
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [])
  // Track the previous signal state so we only vibrate on a false→true transition,
  // not on every render or on the initial mount if the signal was already active.
  const prevBatActiveRef = useRef<boolean | null>(null)

  useEffect(() => {
    setTeam(loadTeam())
    fetchLeadCounts().then(setLeadCounts)
    fetchBatSignal().then(setBatSignalState)
    fetchPushStatus().then(({ count, registeredNames }) => {
      setSubCount(count)
      setRegisteredNames(registeredNames)
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBatSignal().then(setBatSignalState)
      fetchLeadCounts().then(setLeadCounts)
      fetchPushStatus().then(({ count, registeredNames }) => {
        setSubCount(count)
        setRegisteredNames(registeredNames)
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!batSignal.active) return
    const interval = setInterval(() => setPulse((p) => !p), 800)
    return () => clearInterval(interval)
  }, [batSignal.active])

  // Foreground-only nice-to-have. navigator.vibrate ONLY fires when the
  // page is in the foreground with a recent user interaction — it cannot
  // wake a backgrounded or pocketed phone. Off-screen alerts always come
  // from the service-worker push handler in public/sw.js, NOT from here.
  // (No-op entirely on iOS Safari.)
  useEffect(() => {
    const prev = prevBatActiveRef.current
    prevBatActiveRef.current = batSignal.active
    if (prev === null) return // first render — don't vibrate on mount
    if (prev === false && batSignal.active === true) {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([300, 100, 300, 100, 500])
      }
    }
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
    if (sending) return
    setSending(true)
    setLastSendResult(null)
    const now = Date.now()
    setBatSignalState({ active: true, since: now })
    // Short haptic confirmation on the sender's own device.
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([150, 80, 150])
    }
    const result = await postBatSignal(true)
    setLastSendResult(result)
    setSending(false)
    // If the server rejected (e.g. 0 received → 502), roll back the
    // optimistic active state. We don't want a phantom red banner when
    // nobody actually got pushed.
    if (!result.ok) {
      setBatSignalState({ active: false, since: 0 })
    }
    // Auto-clear the status card after 12s so it doesn't linger.
    setTimeout(() => setLastSendResult(null), 12_000)
  }, [sending])

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

  const progressPct = Math.min(100, Math.round((leadCounts.qualified / QUALIFIED_GOAL) * 100))

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
          disabled={sending}
          className="w-full rounded-2xl p-5 mb-3 flex flex-col items-center gap-2 cursor-pointer active:scale-[0.97] transition-all duration-150 border-0 disabled:opacity-70 disabled:cursor-wait"
          style={{
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <span className="text-5xl" style={{ filter: "drop-shadow(0 0 12px rgba(255,200,0,0.8))" }}>🦇</span>
          <div className="text-white font-extrabold text-[17px] tracking-wide">
            {sending ? "SENDING…" : "BAT SIGNAL"}
          </div>
          <div className="text-white/50 text-[12px]">
            {sending ? "Firing push to every registered phone" : "Booth is slammed — call all hands"}
          </div>
        </button>
      )}

      {/* ── DELIVERY RESULT — shows what just happened after a send.
          Auto-clears after 12s. Three visual states:
          - green: everyone got it
          - amber: partial delivery (some failed)
          - red: nobody got it OR server-side error
          This is what fixes "I can't tell if the signal actually went out." */}
      {lastSendResult && (() => {
        const r = lastSendResult
        const allGood = r.ok && r.pushed > 0 && r.failed === 0
        const partial = r.ok && r.pushed > 0 && r.failed > 0
        const tone = allGood ? "success" : partial ? "amber" : "danger"
        const bg = tone === "success" ? "var(--success-light)"
          : tone === "amber" ? "var(--amber-light)"
          : "var(--danger-light)"
        const fg = tone === "success" ? "var(--success)"
          : tone === "amber" ? "var(--amber)"
          : "var(--danger)"
        const headline = allGood
          ? `✅ Sent — ${r.pushed} of ${r.total} phones buzzed`
          : partial
            ? `⚠ Sent — ${r.pushed} of ${r.total} buzzed, ${r.failed} missed`
            : r.total === 0
              ? `❌ Nobody received it — 0 phones are registered`
              : `❌ Nobody received it — ${r.failed} of ${r.total} failed`
        const sub = allGood
          ? "All hands are pinged."
          : partial
            ? "The team can see who's missing on the registry below."
            : r.error || "Tell missing teammates to open the app and tap the re-arm banner."
        return (
          <div className="rounded-xl p-3.5 mb-3 flex items-start gap-2.5"
            style={{ background: bg, border: `1px solid ${fg}` }}>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[13px]" style={{ color: fg }}>{headline}</div>
              <div className="text-[11px] mt-0.5 leading-snug" style={{ color: fg, opacity: 0.85 }}>{sub}</div>
            </div>
            <button onClick={() => setLastSendResult(null)}
              className="text-[11px] font-bold px-2 py-0.5 cursor-pointer bg-transparent border-0"
              style={{ color: fg }}>
              ×
            </button>
          </div>
        )
      })()}

      {/* ── DEVICES REGISTERED CHIP — tap to expand the per-name registry ── */}
      {!batSignal.active && subCount !== null && (
        <>
          <button
            onClick={() => setShowRegistry((v) => !v)}
            className="w-full mb-3 text-[12px] font-semibold px-3 py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
            style={{
              background: subCount === 0
                ? "var(--danger-light)"
                : registeredNames.length >= teamData.length
                  ? "var(--success-light)"
                  : "var(--amber-light)",
              border: `1px solid ${subCount === 0 ? "var(--danger)" : registeredNames.length >= teamData.length ? "var(--success)" : "var(--amber)"}`,
              color: subCount === 0
                ? "var(--danger)"
                : registeredNames.length >= teamData.length
                  ? "var(--success)"
                  : "var(--amber)",
            }}>
            <span>
              {subCount === 0
                ? `⚠️ No devices registered · run setup`
                : registeredNames.length >= teamData.length
                  ? `✅ ${registeredNames.length}/${teamData.length} teammates registered`
                  : `${registeredNames.length}/${teamData.length} teammates registered`}
            </span>
            <span className="text-[10px] opacity-70">{showRegistry ? "hide" : "see who"}</span>
          </button>

          {showRegistry && (
            <div className="rounded-xl mb-5 overflow-hidden"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {teamData.map((m, i) => {
                const isRegistered = registeredNames.some(
                  (n) => n.toLowerCase() === m.name.toLowerCase()
                )
                return (
                  <div key={m.name}
                    className={`flex items-center gap-3 px-4 py-2.5 ${i < teamData.length - 1 ? "border-b" : ""}`}
                    style={{ borderColor: "var(--border)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{
                        background: isRegistered ? "var(--success-light)" : "var(--surface-alt)",
                        color: isRegistered ? "var(--success)" : "var(--text-muted)",
                      }}>
                      {m.initials}
                    </div>
                    <div className="flex-1 text-[13px] font-semibold"
                      style={{ color: isRegistered ? "var(--text)" : "var(--text-muted)" }}>
                      {m.name}
                    </div>
                    <span className="text-[11px] font-bold"
                      style={{ color: isRegistered ? "var(--success)" : "var(--text-muted)" }}>
                      {isRegistered ? "✅ ready" : "⬜ not yet"}
                    </span>
                  </div>
                )
              })}
              {/* Surface any unrecognized names that came through (e.g. someone
                  typed/picked something not in the team list). */}
              {registeredNames
                .filter((n) => !teamData.some((m) => m.name.toLowerCase() === n.toLowerCase()))
                .map((n) => (
                  <div key={`extra-${n}`}
                    className="flex items-center gap-3 px-4 py-2.5 border-t"
                    style={{ borderColor: "var(--border)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                      ?
                    </div>
                    <div className="flex-1 text-[13px] font-semibold" style={{ color: "var(--text)" }}>
                      {n}
                    </div>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      not on team list
                    </span>
                  </div>
                ))}
            </div>
          )}
        </>
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

      {/* ── BOOTH SHIFT SCHEDULE — 4 days × 2 slots ──────────────────────
          Lets each teammate sign up for morning (9:30–1pm) or afternoon
          (1pm–close) coverage on any day. Realtime via Supabase so two
          phones can sign up simultaneously without stepping on each other.
          Tap "+ me" to add yourself; tap your own pill to remove. */}
      <SectionLabel>Booth Shifts</SectionLabel>
      <div className="text-[11px] mb-2.5 -mt-1" style={{ color: "var(--text-muted)" }}>
        Sign up for morning (9:30am–1pm) or afternoon (1pm–close) coverage.
        {!userName && " Pick your name on Setup before signing up."}
      </div>
      <div className="rounded-xl overflow-hidden mb-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {([
          { day: "sat" as ShiftDay, label: "Sat May 16" },
          { day: "sun" as ShiftDay, label: "Sun May 17" },
          { day: "mon" as ShiftDay, label: "Mon May 18" },
          { day: "tue" as ShiftDay, label: "Tue May 19" },
        ]).map((d, idx, arr) => (
          <div key={d.day}
            className={`px-3 py-3 ${idx < arr.length - 1 ? "border-b" : ""}`}
            style={{ borderColor: "var(--border)" }}>
            <div className="text-[11px] font-bold tracking-wider mb-2"
              style={{ color: "var(--text)" }}>
              {d.label}
            </div>
            <div className="space-y-1.5">
              {([
                { slot: "morning" as ShiftSlot, label: "Morning", time: "9:30am–1pm", Icon: Sunrise, tone: "var(--amber)" },
                { slot: "afternoon" as ShiftSlot, label: "Afternoon", time: "1pm–close", Icon: Sunset, tone: "var(--accent)" },
              ]).map((s) => {
                const names = shiftCoverage.get(shiftKey(d.day, s.slot)) || []
                const userOnShift = !!userName && names.some((n) => n.toLowerCase() === userName.toLowerCase())
                return (
                  <div key={s.slot} className="flex items-start gap-2">
                    <div className="flex-shrink-0 flex items-center gap-1.5 w-[112px]">
                      <s.Icon size={13} style={{ color: s.tone }} />
                      <div>
                        <div className="text-[12px] font-bold leading-none" style={{ color: "var(--text)" }}>{s.label}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.time}</div>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center gap-1 flex-wrap">
                      {names.map((n) => {
                        const isMe = !!userName && n.toLowerCase() === userName.toLowerCase()
                        return (
                          <button key={n}
                            onClick={isMe ? () => removeBoothShift(d.day, s.slot, userName) : undefined}
                            disabled={!isMe}
                            title={isMe ? "Tap to drop this shift" : `${n} is covering`}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-default disabled:cursor-default"
                            style={{
                              background: isMe ? "var(--success-light)" : "var(--accent-light)",
                              color: isMe ? "var(--success)" : "var(--accent)",
                              cursor: isMe ? "pointer" : "default",
                            }}>
                            {n}{isMe ? " ✕" : ""}
                          </button>
                        )
                      })}
                      {!userOnShift && (
                        <button
                          onClick={() => userName && addBoothShift(d.day, s.slot, userName)}
                          disabled={!userName}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                          style={{
                            background: "transparent",
                            color: "var(--text-muted)",
                            borderColor: "var(--border)",
                            borderStyle: "dashed",
                          }}>
                          + me
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Qualified leads — overall show goal. "Qualified" = hot OR warm
          heat (cool excluded). Updates in realtime via Supabase channel
          on nra_leads, so any teammate's lead save shows here instantly. */}
      <SectionLabel>Qualified Leads</SectionLabel>
      <div className="rounded-xl p-4 mb-2"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={16} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {leadCounts.qualified} / {QUALIFIED_GOAL} qualified
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
        <div className="w-full h-2.5 rounded-full overflow-hidden mb-2" style={{ background: "var(--surface-alt)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: progressPct >= 100 ? "var(--success)" : "var(--accent)",
            }} />
        </div>
        {/* Heat breakdown — hot + warm = qualified; cool excluded */}
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span className="font-bold" style={{ color: "var(--danger)" }}>🔥 {leadCounts.hot} hot</span>
          <span>·</span>
          <span className="font-bold" style={{ color: "var(--amber)" }}>☀️ {leadCounts.warm} warm</span>
          {leadCounts.total > leadCounts.qualified && (
            <>
              <span>·</span>
              <span>{leadCounts.total - leadCounts.qualified} cool (not counted)</span>
            </>
          )}
        </div>
      </div>
      <div className="text-[11px] mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
        <b>Qualified = hot or warm.</b> Hot = decision-maker, asked for follow-up.
        Warm = relevant company, engaged conversation. Cool leads (met but not a fit)
        don&apos;t count toward the goal.
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
