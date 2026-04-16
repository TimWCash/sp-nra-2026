"use client"

import { useState, useEffect, useCallback } from "react"
import { MapPin, Calendar, Clock, Building2, Store, Users, MessageCircle, ExternalLink, Wifi, Mic, UserPlus, Zap, Target, Trophy, ArrowRight, Camera, Plus, Minus, RotateCcw, ChevronDown, Plane, Hotel, House, Car, StickyNote } from "lucide-react"
import { useCountdown } from "@/hooks/useCountdown"
import { team as teamMembers } from "@/lib/data"
import { supabase } from "@/lib/supabase"

import type { PageId } from "@/components/layout/BottomNav"

const FLIGHTS_KEY = "sp_flight_overrides"
const ACCOMMODATION_KEY = "sp_accommodation_overrides"

interface FlightEntry { label: string; detail: string }

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback } catch { return fallback }
}

const BAT_SIGNAL_KEY = "sp_bat_signal"

interface HomePageProps {
  onNavigate?: (page: PageId) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { days, hours, mins, secs, isLive } = useCountdown()
  const [batActive, setBatActive] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [visitorCount, setVisitorCount] = useState(0)
  const [tapping, setTapping] = useState(false)
  const [travelOpen, setTravelOpen] = useState(false)
  const [flightOverrides, setFlightOverrides] = useState<Record<string, FlightEntry[]>>({})
  const [accommodationOverrides, setAccommodationOverrides] = useState<Record<string, string>>({})

  useEffect(() => {
    setFlightOverrides(readLocal(FLIGHTS_KEY, {}))
    setAccommodationOverrides(readLocal(ACCOMMODATION_KEY, {}))
  }, [])

  const fetchVisitors = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0]
    const { count } = await supabase
      .from("booth_traffic")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today + "T00:00:00")
    setVisitorCount(count ?? 0)
  }, [])

  useEffect(() => { fetchVisitors() }, [fetchVisitors])

  async function addVisitor() {
    setTapping(true)
    setVisitorCount((c) => c + 1)
    await supabase.from("booth_traffic").insert({})
    setTimeout(() => setTapping(false), 200)
  }

  async function removeVisitor() {
    if (visitorCount <= 0) return
    setVisitorCount((c) => Math.max(0, c - 1))
    const today = new Date().toISOString().split("T")[0]
    const { data } = await supabase
      .from("booth_traffic")
      .select("id")
      .gte("created_at", today + "T00:00:00")
      .order("created_at", { ascending: false })
      .limit(1)
    if (data?.[0]) await supabase.from("booth_traffic").delete().eq("id", data[0].id)
  }

  async function resetVisitors() {
    if (!confirm(`Reset booth visitor count to 0?`)) return
    setVisitorCount(0)
    const today = new Date().toISOString().split("T")[0]
    await supabase.from("booth_traffic").delete().gte("created_at", today + "T00:00:00")
  }

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/bat-signal", { cache: "no-store" })
        const s = await res.json()
        setBatActive(!!s.active)
      } catch {
        // fallback to localStorage
        try {
          const s = JSON.parse(localStorage.getItem(BAT_SIGNAL_KEY) || '{"active":false}')
          setBatActive(!!s.active)
        } catch { setBatActive(false) }
      }
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!batActive) return
    const interval = setInterval(() => setPulse((p) => !p), 800)
    return () => clearInterval(interval)
  }, [batActive])

  return (
    <div className="animate-fade-in">

      {/* Bat Signal Banner */}
      {batActive && (
        <button
          onClick={() => onNavigate?.("status")}
          className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all duration-300 border-0"
          style={{
            background: pulse ? "var(--danger)" : "#c0392b",
            boxShadow: pulse ? "0 0 28px rgba(220,53,69,0.5)" : "0 0 12px rgba(220,53,69,0.25)",
          }}
        >
          <span className="text-3xl">🦇</span>
          <div className="flex-1 text-left">
            <div className="font-extrabold text-white text-[15px]">BAT SIGNAL ACTIVE</div>
            <div className="text-white/70 text-[12px]">Booth needs backup — tap to respond</div>
          </div>
          <ArrowRight size={18} color="white" />
        </button>
      )}

      {/* Hero */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={20} style={{ color: "var(--accent)" }} />
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>NRA Show 2026</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-none tracking-tight" style={{ color: "var(--text)" }}>
          Service Physics
        </h1>
        <p className="text-sm font-semibold mt-1.5" style={{ color: "var(--text-muted)" }}>
          Booth #7365 &middot; McCormick Place &middot; Chicago
        </p>
      </div>

      {/* Travel + Hotel Dropdown */}
      <div className="rounded-xl mb-5 overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={() => setTravelOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 cursor-pointer bg-transparent border-0 text-left">
          <div className="flex items-center gap-2.5">
            <Plane size={15} style={{ color: "var(--accent)" }} />
            <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Everyone's Travel & Hotel</span>
          </div>
          <ChevronDown size={15} className="transition-transform duration-200"
            style={{ color: "var(--text-muted)", transform: travelOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
        </button>
        {travelOpen && (
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {teamMembers.map((person, idx) => {
              const flights: FlightEntry[] = flightOverrides[person.name] ?? person.flights ?? []
              const accommodation = person.name in accommodationOverrides
                ? accommodationOverrides[person.name]
                : person.accommodation ?? ""
              const notes = person.notes ?? []
              const hasAny = flights.length > 0 || accommodation || notes.length > 0
              return (
                <div key={person.name} className="px-4 py-3"
                  style={{ borderBottom: idx < teamMembers.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {person.photo ? (
                      <img src={person.photo} alt={person.name}
                        className="w-7 h-7 rounded-full object-cover"
                        style={{ border: "1.5px solid var(--border)" }} />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1.5px solid var(--accent)" }}>
                        {person.initials}
                      </div>
                    )}
                    <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>{person.name}</span>
                  </div>
                  {!hasAny && (
                    <div className="text-[11px] ml-[38px]" style={{ color: "var(--text-muted)" }}>No travel logged yet</div>
                  )}
                  <div className="ml-[38px] space-y-1">
                    {flights.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        <Plane size={11} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                        <span className="font-medium">{f.label}</span>
                        <span style={{ color: "var(--text-muted)" }}>·</span>
                        <span>{f.detail}</span>
                      </div>
                    ))}
                    {accommodation && (
                      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {/airbnb|house|home/i.test(accommodation)
                          ? <House size={11} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                          : <Hotel size={11} className="flex-shrink-0" style={{ color: "var(--accent)" }} />}
                        <span>{accommodation}</span>
                      </div>
                    )}
                    {notes.map((n, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
                        {n.includes("Driving")
                          ? <Car size={11} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                          : <StickyNote size={11} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
                        <span>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            <button onClick={() => onNavigate?.("team")}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold cursor-pointer bg-transparent border-0"
              style={{ background: "var(--surface-alt)", color: "var(--accent)", borderTop: "1px solid var(--border)" }}>
              Edit my flights / hotel <ArrowRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Countdown */}
      {isLive ? (
        <div className="rounded-2xl p-5 mb-5 text-center"
          style={{ background: "linear-gradient(135deg, var(--accent), #006d78)", color: "#ffffff", boxShadow: "0 8px 32px rgba(0,132,147,0.3)" }}>
          <div className="text-3xl font-extrabold tracking-tight">WE&apos;RE LIVE</div>
          <div className="text-sm opacity-80 mt-1">Show floor is open &mdash; let&apos;s go!</div>
        </div>
      ) : (
        <div className="rounded-2xl p-4 mb-5"
          style={{ background: "linear-gradient(135deg, var(--accent), #006d78)", boxShadow: "0 8px 32px rgba(0,132,147,0.25)" }}>
          <div className="text-[11px] font-bold tracking-widest uppercase text-center mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
            Countdown to Showtime
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { val: days, label: "Days" },
              { val: hours, label: "Hrs" },
              { val: mins, label: "Min" },
              { val: secs, label: "Sec" },
            ].map((b) => (
              <div key={b.label} className="rounded-xl text-center py-3"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                <div className="text-[32px] font-extrabold tabular-nums leading-none" style={{ color: "#ffffff" }}>{b.val}</div>
                <div className="text-[10px] font-bold mt-1 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mission Card */}
      <div className="rounded-2xl p-4 mb-4 flex items-start gap-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-light)" }}>
          <Target size={20} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <div className="font-bold text-[15px]" style={{ color: "var(--text)" }}>Show Goal: 50 Qualified Leads</div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>Scan badges, capture notes, book podcast guests. Every conversation counts.</div>
        </div>
      </div>

      {/* Show Info Card */}
      <div className="rounded-xl p-4 mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Show Details</span>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>2026</span>
        </div>
        <div className="space-y-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <div className="flex items-center gap-2.5"><MapPin size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} /> <span><strong style={{ color: "var(--text)" }}>McCormick Place</strong>, Chicago IL</span></div>
          <div className="flex items-center gap-2.5"><Calendar size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} /> <span><strong style={{ color: "var(--text)" }}>May 16-19, 2026</strong></span></div>
          <div className="flex items-center gap-2.5"><Clock size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} /> <span><strong style={{ color: "var(--text)" }}>Opens 9:30am</strong> daily (3pm close Tue)</span></div>
          <div className="flex items-center gap-2.5"><Building2 size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} /> <span><strong style={{ color: "var(--text)" }}>North Building</strong>, Booths 5500-9200</span></div>
        </div>
      </div>

      {/* Google Maps */}
      <a href="https://maps.app.goo.gl/e62PNZ8xhfvpkFR99" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl py-3.5 w-full cursor-pointer mb-4 no-underline font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
        <ExternalLink size={16} /> McCormick Place &mdash; Google Maps
      </a>

      {/* Quick Access */}
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text)" }}>
        Quick Access
      </h2>
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {[
          { page: "schedule" as PageId, Icon: Calendar, label: "Schedule", sub: "Daily timeline", accent: "#008493" },
          { page: "booth" as PageId, Icon: Store, label: "Booth Info", sub: "#7365 · 20×10", accent: "#008493" },
          { page: "team" as PageId, Icon: Users, label: "Team", sub: "Travel & contacts", accent: "#008493" },
          { page: "talk" as PageId, Icon: MessageCircle, label: "Talk Track", sub: "At the booth", accent: "#008493" },
          { page: "podcast" as PageId, Icon: Mic, label: "Podcast", sub: "Joy of Ops", accent: "#008493" },
          { page: "leads" as PageId, Icon: UserPlus, label: "Leads", sub: "Capture contacts", accent: "#008493" },
          { page: "photos" as PageId, Icon: Camera, label: "Photos", sub: "Shared album", accent: "#008493" },
        ].map((q) => (
          <button key={q.page + q.label} onClick={() => onNavigate?.(q.page)}
            className="rounded-xl p-3 text-left cursor-pointer transition-all duration-200 active:scale-[0.97]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <q.Icon size={20} className="mb-1.5" style={{ color: "var(--accent)" }} />
            <div className="font-semibold text-[13px] leading-tight" style={{ color: "var(--text)" }}>{q.label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{q.sub}</div>
          </button>
        ))}
      </div>

      {/* Team Status */}
      <div className="rounded-xl p-4 mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Team Status</span>
          <button onClick={() => onNavigate?.("status")}
            className="text-[11px] font-semibold cursor-pointer bg-transparent border-0 p-0 flex items-center gap-1"
            style={{ color: "var(--accent)" }}>
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="flex gap-3">
          {teamMembers.map((m) => (
            <div key={m.name} className="flex flex-col items-center gap-1">
              {m.photo ? (
                <img src={m.photo} alt={m.name} className="w-10 h-10 rounded-full object-cover"
                  style={{ border: "2px solid var(--accent)" }} />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "var(--accent-light)", color: "var(--accent)", border: "2px solid var(--accent)" }}>
                  {m.initials}
                </div>
              )}
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Booth Traffic Counter */}
      <div className="rounded-xl p-4 mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Booth Visitors Today</span>
          <button onClick={resetVisitors}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg cursor-pointer border-0 active:scale-95 transition-all"
            style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
            <RotateCcw size={10} /> Reset
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[48px] font-extrabold tabular-nums leading-none" style={{ color: "var(--accent)" }}>{visitorCount}</div>
          <button
            onClick={removeVisitor}
            className="w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.93] flex-shrink-0"
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <Minus size={18} />
          </button>
          <button
            onClick={addVisitor}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-[16px] cursor-pointer transition-all duration-200 active:scale-[0.93]"
            style={{
              background: tapping ? "var(--accent)" : "var(--accent-light)",
              color: tapping ? "var(--accent-fg)" : "var(--accent)",
              border: "none",
              transform: tapping ? "scale(0.93)" : "scale(1)",
            }}>
            <Plus size={20} /> Visitor
          </button>
        </div>
      </div>

      {/* Wi-Fi Warning */}
      <div className="rounded-xl p-3 mb-4 flex gap-2.5 items-start text-[13px]"
        style={{ background: "var(--amber-light)", border: "1px solid var(--amber)", color: "var(--amber-fg)" }}>
        <Wifi size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
        <span>No Wi-Fi on show floor &amp; limited cell service. Download offline content before arriving.</span>
      </div>

      {/* Social + Hype */}
      <div className="rounded-xl p-4 mb-2 text-center"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <Trophy size={24} className="mx-auto mb-2" style={{ color: "var(--accent)" }} />
        <div className="font-bold text-sm" style={{ color: "var(--text)" }}>Let&apos;s make this the best show yet.</div>
        <div className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
          Tag <strong style={{ color: "var(--accent)" }}>#2026RestaurantShow</strong> on socials
        </div>
      </div>
    </div>
  )
}
