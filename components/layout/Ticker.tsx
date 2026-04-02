"use client"

import { useEffect, useState } from "react"
import { Zap, MapPin, Mic, AlertTriangle, Flame, Target, Trophy, Clock, Users, Laugh } from "lucide-react"

const SHOW_DAYS: { date: string; label: string; day: number; hours: string; joke: string }[] = [
  {
    date: "2026-05-16",
    label: "OPENING DAY",
    day: 1,
    hours: "9:30AM–5:00PM TODAY",
    joke: "😄 We mapped a chef's movement during dinner rush. 4 miles. The food traveled 12 feet. Something's off.",
  },
  {
    date: "2026-05-17",
    label: "DAY 2 OF 4",
    day: 2,
    hours: "9:30AM–5:00PM TODAY",
    joke: "😄 Asked a restaurant owner how their kitchen flow was. They said 'great.' The spaghetti diagram said otherwise.",
  },
  {
    date: "2026-05-18",
    label: "DAY 3 OF 4 — BIGGEST DAY",
    day: 3,
    hours: "9:30AM–5:00PM TODAY",
    joke: "😄 What's the difference between a tangled spaghetti diagram and a well-run kitchen? About $60K a year.",
  },
  {
    date: "2026-05-19",
    label: "FINAL DAY",
    day: 4,
    hours: "9:30AM–3:00PM TODAY · CLOSES EARLY",
    joke: "😄 A physicist, engineer & chef walk into a kitchen. The chef tells them both to get out. (We came back with data.)",
  },
]

function getTodayInfo() {
  const today = new Date().toISOString().split("T")[0]
  return SHOW_DAYS.find((d) => d.date === today) ?? null
}

function getLeadsToday(): number {
  if (typeof window === "undefined") return 0
  try {
    const leads = JSON.parse(localStorage.getItem("sp_nra_leads") || "[]")
    const today = new Date().toDateString()
    return leads.filter((l: { time?: string }) => {
      if (!l.time) return false
      return new Date(l.time).toDateString() === today
    }).length
  } catch {
    return 0
  }
}

function getDaysToShow(): number {
  const target = new Date("2026-05-16T09:30:00-05:00")
  const now = new Date()
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000))
}

export function Ticker() {
  const [todayInfo, setTodayInfo] = useState<ReturnType<typeof getTodayInfo>>(null)
  const [leadsToday, setLeadsToday] = useState(0)
  const [daysToShow, setDaysToShow] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTodayInfo(getTodayInfo())
    setLeadsToday(getLeadsToday())
    setDaysToShow(getDaysToShow())

    // Refresh lead count every 30 seconds
    const interval = setInterval(() => {
      setLeadsToday(getLeadsToday())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  const isDuringShow = todayInfo !== null

  return (
    <div
      className="fixed top-14 left-0 right-0 z-[99] py-2 px-4 overflow-hidden whitespace-nowrap text-xs font-bold"
      style={{
        background: "linear-gradient(90deg, var(--accent), #006d78)",
        borderBottom: "1px solid var(--border)",
        color: "#ffffff",
      }}
    >
      <div className="ticker-animate inline-flex items-center gap-8">
        <TickerContent isDuringShow={isDuringShow} todayInfo={todayInfo} leadsToday={leadsToday} daysToShow={daysToShow} />
        <TickerContent isDuringShow={isDuringShow} todayInfo={todayInfo} leadsToday={leadsToday} daysToShow={daysToShow} />
      </div>
    </div>
  )
}

function TickerContent({
  isDuringShow,
  todayInfo,
  leadsToday,
  daysToShow,
}: {
  isDuringShow: boolean
  todayInfo: ReturnType<typeof getTodayInfo>
  leadsToday: number
  daysToShow: number
}) {
  return (
    <span className="inline-flex items-center gap-8">

      {/* Day label — dynamic during show, countdown before */}
      {isDuringShow && todayInfo ? (
        <span className="inline-flex items-center gap-1.5">
          <Zap size={12} /> {todayInfo.label}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Zap size={12} /> {daysToShow} DAYS TO SHOWTIME
        </span>
      )}

      {/* Show hours — dynamic */}
      {isDuringShow && todayInfo ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} /> {todayInfo.hours}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Clock size={12} /> SHOW HOURS: 9:30AM–5PM SAT–MON · 3PM CLOSE TUE
        </span>
      )}

      {/* Booth */}
      <span className="inline-flex items-center gap-1.5">
        <MapPin size={12} /> BOOTH #7365 &middot; NORTH BUILDING
      </span>

      {/* Podcast */}
      <span className="inline-flex items-center gap-1.5">
        <Mic size={12} /> JOY OF OPS &mdash; RECORDING LIVE AT BOOTH #7365
      </span>

      {/* Live lead count — only during show */}
      {isDuringShow ? (
        <span className="inline-flex items-center gap-1.5">
          <Users size={12} /> {leadsToday} LEAD{leadsToday !== 1 ? "S" : ""} CAPTURED TODAY
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Target size={12} /> GOAL: 50 QUALIFIED LEADS
        </span>
      )}

      {/* Attendees */}
      <span className="inline-flex items-center gap-1.5">
        <Flame size={12} /> 51,000+ ATTENDEES EXPECTED
      </span>

      {/* Warning */}
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle size={12} /> NO EARLY TEARDOWN &mdash; SHOW CLOSES 3PM TUE
      </span>

      {/* Daily joke — only during show */}
      {isDuringShow && todayInfo ? (
        <span className="inline-flex items-center gap-1.5">
          <Laugh size={12} /> {todayInfo.joke}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <Trophy size={12} /> LET&apos;S MAKE THIS THE BEST SHOW YET
        </span>
      )}

      <span className="ml-8" />
    </span>
  )
}
