"use client"

import { MapPin, Calendar, Clock, Building2, CalendarDays, Store, Users, MessageCircle, Wifi, Hash, AlertTriangle } from "lucide-react"
import { useCountdown } from "@/hooks/useCountdown"
import { keyDates } from "@/lib/data"
import type { PageId } from "@/components/layout/BottomNav"

interface HomePageProps {
  onNavigate?: (page: PageId) => void
}

const badgeVariant: Record<string, string> = {
  teal: "bg-sp-accent-light text-sp-accent",
  green: "bg-sp-success-light text-sp-success",
  red: "bg-sp-danger-light text-sp-danger",
  muted: "bg-sp-surface-alt text-sp-muted",
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { days, hours, mins, secs, isLive } = useCountdown()

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight" style={{ color: "var(--text)" }}>
          Service Physics
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: "var(--text-muted)" }}>
          NRA Show 2026 &middot; Booth #7365 &middot; Chicago
        </p>
      </div>

      {/* Countdown */}
      {isLive ? (
        <div className="rounded-xl p-4 mb-5 text-center font-bold text-lg"
          style={{ background: "var(--success-light)", color: "var(--success)" }}>
          Show is Live
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { val: days, label: "Days" },
            { val: hours, label: "Hrs" },
            { val: mins, label: "Min" },
            { val: secs, label: "Sec" },
          ].map((b) => (
            <div key={b.label} className="rounded-xl text-center py-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <div className="text-[28px] font-extrabold tabular-nums leading-none" style={{ color: "var(--accent)" }}>{b.val}</div>
              <div className="text-[11px] font-medium mt-1" style={{ color: "var(--text-muted)" }}>{b.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Show Info Card */}
      <div className="rounded-xl p-4 mb-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Show Details</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>2026</span>
        </div>
        <div className="space-y-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <div className="flex items-center gap-2.5"><MapPin size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} /> <span><strong style={{ color: "var(--text)" }}>McCormick Place</strong>, Chicago IL</span></div>
          <div className="flex items-center gap-2.5"><CalendarDays size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} /> <span><strong style={{ color: "var(--text)" }}>May 16-19, 2026</strong></span></div>
          <div className="flex items-center gap-2.5"><Clock size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} /> <span><strong style={{ color: "var(--text)" }}>Opens 9:30am</strong> daily (3pm close Tue)</span></div>
          <div className="flex items-center gap-2.5"><Building2 size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} /> <span><strong style={{ color: "var(--text)" }}>North Building</strong>, Booths 5500-9200</span></div>
        </div>
      </div>

      {/* Quick Access */}
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>Quick Access</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {[
          { page: "schedule" as PageId, Icon: Calendar, label: "Schedule", sub: "Daily timeline" },
          { page: "booth" as PageId, Icon: Store, label: "Booth Info", sub: "#7365 / 20x10" },
          { page: "team" as PageId, Icon: Users, label: "Team", sub: "Travel & contacts" },
          { page: "talk" as PageId, Icon: MessageCircle, label: "Talking Points", sub: "At the booth" },
        ].map((q) => (
          <button key={q.page} onClick={() => onNavigate?.(q.page)}
            className="rounded-xl p-4 text-left cursor-pointer transition-all duration-200 active:scale-[0.98]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <q.Icon size={22} className="mb-2" style={{ color: "var(--accent)" }} />
            <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{q.label}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{q.sub}</div>
          </button>
        ))}
      </div>

      {/* Key Dates */}
      <h2 className="text-lg font-bold mb-3" style={{ color: "var(--text)" }}>Key Dates</h2>
      <div className="rounded-xl overflow-hidden mb-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        {keyDates.map((d, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-3 text-sm ${i < keyDates.length - 1 ? "border-b" : ""}`}
            style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-secondary)" }}>{d.label}</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeVariant[d.variant]}`}>{d.date}</span>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="rounded-xl p-3.5 mb-3 flex gap-2.5 items-start text-[13px]"
        style={{ background: "var(--amber-light)", border: "1px solid var(--amber)", color: "var(--amber-fg)" }}>
        <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
        <span>No Wi-Fi on show floor and limited cell service. Order Internet via Freeman by Apr 26.</span>
      </div>
      <div className="rounded-xl p-3.5 mb-3 flex gap-2.5 items-start text-[13px]"
        style={{ background: "var(--success-light)", color: "var(--success)" }}>
        <Hash size={16} className="flex-shrink-0 mt-0.5" />
        <span>Hashtag for social: <strong>#2026RestaurantShow</strong></span>
      </div>
    </div>
  )
}
