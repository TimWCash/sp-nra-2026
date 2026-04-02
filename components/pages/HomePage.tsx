"use client"

import { useState, useEffect } from "react"
import { MapPin, Calendar, Clock, Building2, Store, Users, MessageCircle, ExternalLink, Wifi, Mic, UserPlus, Zap, Target, Trophy, ArrowRight } from "lucide-react"
import { useCountdown } from "@/hooks/useCountdown"
import { team as teamMembers } from "@/lib/data"

import type { PageId } from "@/components/layout/BottomNav"

const BAT_SIGNAL_KEY = "sp_bat_signal"

interface HomePageProps {
  onNavigate?: (page: PageId) => void
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { days, hours, mins, secs, isLive } = useCountdown()
  const [batActive, setBatActive] = useState(false)
  const [pulse, setPulse] = useState(false)

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
