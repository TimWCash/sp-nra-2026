"use client"

import { useState } from "react"
import { Copy, Mail, Users, MessageCircle, Mic, Activity, Truck, ChevronRight, HelpCircle, ChevronDown } from "lucide-react"
import { keyDates, emailTemplate } from "@/lib/data"
import type { PageId } from "@/components/layout/BottomNav"

const badgeVariant: Record<string, string> = {
  teal: "bg-sp-accent-light text-sp-accent",
  green: "bg-sp-success-light text-sp-success",
  red: "bg-sp-danger-light text-sp-danger",
  muted: "bg-sp-surface-alt text-sp-muted",
}

interface MorePageProps {
  onNavigate?: (page: PageId) => void
}

const HOW_TO: { q: string; a: string }[] = [
  {
    q: "How do I capture a lead?",
    a: "Tap Leads in the bottom nav → tap the + button → scan their badge or business card to auto-fill the form → pick who's logging it → set the heat level → Save. Leads sync instantly to all team phones.",
  },
  {
    q: "How do I scan a badge or business card?",
    a: "In the lead form, tap 'Scan Badge or Business Card' — it opens your camera. Point it at their badge or business card and it auto-fills name, company, title, and contact info. The photo is saved with the lead too.",
  },
  {
    q: "How do I find someone on LinkedIn after scanning?",
    a: "After a successful scan, a blue 'Find on LinkedIn' button appears. Tap it to open a Google search scoped to LinkedIn using their name and company.",
  },
  {
    q: "Can the whole team see leads?",
    a: "Yes — leads sync in real-time across all team phones. When anyone logs a lead, everyone sees it instantly.",
  },
  {
    q: "How does the Bat Signal work?",
    a: "Go to Team (bottom nav) → tap the 🦇 BAT SIGNAL button. It instantly alerts everyone who has the app open. If they've enabled push notifications, it pops up on their locked screen too.",
  },
  {
    q: "How do I enable push notifications?",
    a: "Go to Team → tap 'Enable push alerts for Bat Signal' → allow when your phone asks. You only need to do this once. You'll see a green checkmark when it's on.",
  },
  {
    q: "How do I install this as an app?",
    a: "In Safari: tap the Share icon → 'Add to Home Screen' → Add. In Chrome: tap the 3-dot menu → 'Add to Home Screen'. Once installed, it works offline and push notifications work.",
  },
  {
    q: "How do I update my team status?",
    a: "Go to Team → tap your card to cycle through: At Booth → On Break → Walking Floor → In Meeting → Off. Everyone with the app open will see your status.",
  },
  {
    q: "How do I star NRA sessions I want to attend?",
    a: "Go to Schedule → NRA Sessions → tap the ☆ star on any session to save it. Then filter by '☆ My Sessions' to see just your picks. SP-recommended sessions are pre-marked with ⭐.",
  },
  {
    q: "How do I update flight info?",
    a: "Go to Team → find your card → tap Edit → add, change, or remove your flight details. Changes are saved on your device.",
  },
  {
    q: "How do I add a session to my calendar?",
    a: "Go to Schedule → NRA Sessions → tap any session → tap 'Add to Calendar'. Choose Google Calendar or download the .ics file for Outlook/Apple Calendar.",
  },
  {
    q: "Does it work without WiFi?",
    a: "Yes — once you've opened the app at least once, the core content (schedule, talking points, booth info, load-in guide) is cached and works offline. Lead scanning requires a connection to read the card.",
  },
]

export function MorePage({ onNavigate }: MorePageProps) {
  const [copyLabel, setCopyLabel] = useState("Copy to clipboard")
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function copyEmail() {
    navigator.clipboard.writeText(emailTemplate).then(() => {
      setCopyLabel("Copied!")
      setTimeout(() => setCopyLabel("Copy to clipboard"), 2000)
    })
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>More</h1>

      {/* How To Use */}
      <SectionLabel>How to Use This App</SectionLabel>
      <div className="rounded-xl overflow-hidden mb-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        {HOW_TO.map((item, i) => (
          <div key={i} style={{ borderBottom: i < HOW_TO.length - 1 ? "1px solid var(--border)" : "none" }}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left cursor-pointer bg-transparent border-0"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle size={14} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{item.q}</span>
              </div>
              <ChevronDown size={14} className="flex-shrink-0 transition-transform duration-200"
                style={{ color: "var(--text-muted)", transform: openIndex === i ? "rotate(180deg)" : "rotate(0deg)" }} />
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4 text-[13px] leading-relaxed"
                style={{ color: "var(--text-secondary)" }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Nav */}
      <div className="space-y-1.5 mb-6">
        {[
          { page: "team" as PageId, Icon: Users, label: "Team", sub: "Travel & contacts" },
          { page: "talk" as PageId, Icon: MessageCircle, label: "Talking Points", sub: "At the booth" },
          { page: "podcast" as PageId, Icon: Mic, label: "Podcast", sub: "Joy of Ops schedule" },
          { page: "status" as PageId, Icon: Activity, label: "Team Status", sub: "Who's where" },
          { page: "loadin" as PageId, Icon: Truck, label: "Load In / Out", sub: "Marshalling & teardown" },
        ].map((item) => (
          <button key={item.page} onClick={() => onNavigate?.(item.page)}
            className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left cursor-pointer transition-all duration-200 active:scale-[0.98]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--accent-light)" }}>
              <item.Icon size={16} style={{ color: "var(--accent)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.label}</div>
              <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.sub}</div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
          </button>
        ))}
      </div>

      {/* Key Dates */}
      <SectionLabel>Key Dates</SectionLabel>
      <div className="rounded-xl overflow-hidden mb-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        {keyDates.map((d, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-3 text-sm ${i < keyDates.length - 1 ? "border-b" : ""}`}
            style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-secondary)" }}>{d.label}</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeVariant[d.variant]}`}>{d.date}</span>
          </div>
        ))}
      </div>

      {/* Email Template */}
      <SectionLabel>Follow-Up Email Template</SectionLabel>
      <div className="rounded-xl p-3 mb-3 text-[13px]"
        style={{ background: "var(--amber-light)", color: "var(--amber-fg)" }}>
        <Mail size={14} className="inline mr-1.5" style={{ color: "var(--amber)" }} />
        Send within <strong>10 business days</strong> of show close. Personalize the [brackets].
      </div>
      <div className="rounded-xl p-4 text-[13px] leading-relaxed whitespace-pre-wrap mb-2"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
        {emailTemplate}
      </div>
      <button onClick={copyEmail}
        className="w-full rounded-lg py-2.5 text-[13px] font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.98]"
        style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }}>
        <Copy size={14} /> {copyLabel}
      </button>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold tracking-widest uppercase mb-2.5" style={{ color: "var(--text-muted)" }}>{children}</div>
}
