"use client"

import { useCountdown } from "@/hooks/useCountdown"
import { keyDates } from "@/lib/data"
import type { PageId } from "@/components/layout/BottomNav"

interface HomePageProps {
  onNavigate?: (page: PageId) => void
}

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const cls =
    variant === "teal" ? "bg-sp-teal/10 text-sp-teal border-sp-teal/25" :
    variant === "green" ? "bg-sp-green/10 text-sp-green border-sp-green/20" :
    variant === "red" ? "bg-sp-red/10 text-sp-red border-sp-red/20" :
    "bg-white/5 text-sp-muted border-sp-border"
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>{children}</span>
}

export function HomePage({ onNavigate }: HomePageProps) {
  const { days, hours, mins, secs, isLive } = useCountdown()

  return (
    <div className="animate-fade-in">
      <div className="font-display text-[42px] tracking-wider leading-none text-sp-text">
        WE&apos;RE AT<br /><span className="text-sp-teal">NRA &apos;26</span>
      </div>
      <p className="text-sp-muted mt-2 text-[13px] tracking-wider uppercase font-semibold">
        Service Physics &middot; Booth #7365 &middot; Chicago
      </p>

      {/* Countdown */}
      {isLive ? (
        <div className="my-5 text-center font-display text-[28px] text-sp-green">\ud83d\udfe2 SHOW IS LIVE</div>
      ) : (
        <div className="grid grid-cols-4 gap-2 my-5">
          {[
            { val: days, label: "DAYS" },
            { val: hours, label: "HRS" },
            { val: mins, label: "MIN" },
            { val: secs, label: "SEC" },
          ].map((b) => (
            <div key={b.label} className="bg-sp-surface2 border border-sp-teal/10 rounded-[10px] text-center py-3 px-1.5">
              <div className="font-display text-4xl text-sp-teal leading-none">{b.val}</div>
              <div className="text-[10px] text-sp-muted mt-0.5">{b.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Show Status Card */}
      <div className="bg-gradient-to-br from-[#0d2535] to-[#091c2b] border border-sp-teal-dim rounded-sp p-4 mb-3">
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-sp-muted">Show Status</div>
          <Badge variant="teal">2026</Badge>
        </div>
        <div className="mt-2 text-sm leading-relaxed">
          \ud83d\udccd <strong>McCormick Place</strong>, Chicago IL<br />
          \ud83d\udcc5 <strong>May 16\u201319, 2026</strong><br />
          \ud83d\udd50 <strong>Opens 9:30am</strong> daily (3pm close Tue)<br />
          \ud83c\udfe2 <strong>North Building</strong>, Booths 5500\u20139200
        </div>
      </div>

      {/* Quick Access */}
      <div className="font-display text-[28px] tracking-wider text-sp-text mt-5 mb-4">Quick Access</div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { page: "schedule" as PageId, icon: "\ud83d\udcc5", label: "Schedule", sub: "Daily timeline" },
          { page: "booth" as PageId, icon: "\ud83c\udfea", label: "Booth Info", sub: "#7365 \u00b7 20\u00d710" },
          { page: "team" as PageId, icon: "\ud83d\udc65", label: "Team", sub: "Travel & contacts" },
          { page: "talk" as PageId, icon: "\ud83c\udfaf", label: "Talking Points", sub: "At the booth" },
        ].map((q) => (
          <button key={q.page} onClick={() => onNavigate?.(q.page)} className="bg-sp-surface border border-sp-border rounded-sp p-4 text-left cursor-pointer text-sp-text font-body">
            <div className="text-[22px] mb-1.5">{q.icon}</div>
            <div className="font-semibold text-sm">{q.label}</div>
            <div className="text-[11px] text-sp-muted mt-0.5">{q.sub}</div>
          </button>
        ))}
      </div>

      {/* Key Dates */}
      <div className="font-display text-[28px] tracking-wider text-sp-text mt-6 mb-4">Key Dates</div>
      <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
        {keyDates.map((d, i) => (
          <div key={i} className={`flex justify-between items-center py-2.5 text-sm ${i < keyDates.length - 1 ? "border-b border-sp-border" : ""}`}>
            <span>{d.label}</span>
            <Badge variant={d.variant}>{d.date}</Badge>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="bg-sp-red/10 border border-sp-red/25 rounded-[10px] p-2.5 px-3.5 text-[13px] mt-3 flex gap-2 items-start">
        <span className="flex-shrink-0 mt-0.5">\u26a0\ufe0f</span>
        <span>No Wi-Fi on show floor and limited cell service. Order Internet via Freeman by Apr 26 if needed.</span>
      </div>
      <div className="bg-sp-green/5 border border-sp-green/20 rounded-[10px] p-2.5 px-3.5 text-[13px] mt-3 flex gap-2 items-start">
        <span className="flex-shrink-0 mt-0.5">\u2705</span>
        <span>Hashtag for social: <strong>#2026RestaurantShow</strong></span>
      </div>
    </div>
  )
}
