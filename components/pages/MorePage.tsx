"use client"

import { useState } from "react"
import { Copy, Mail, Users, MessageCircle, Mic, Activity, Truck, ChevronRight } from "lucide-react"
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

export function MorePage({ onNavigate }: MorePageProps) {
  const [copyLabel, setCopyLabel] = useState("Copy to clipboard")

  function copyEmail() {
    navigator.clipboard.writeText(emailTemplate).then(() => {
      setCopyLabel("Copied!")
      setTimeout(() => setCopyLabel("Copy to clipboard"), 2000)
    })
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>More</h1>

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
