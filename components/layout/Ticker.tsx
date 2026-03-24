"use client"

import { MapPin, Radio, Clock } from "lucide-react"

export function Ticker() {
  return (
    <div className="fixed top-14 left-0 right-0 z-[99] py-2 px-4 overflow-hidden whitespace-nowrap text-xs font-medium"
      style={{ background: "var(--accent-light)", borderBottom: "1px solid var(--border)", color: "var(--accent)" }}>
      <div className="ticker-animate inline-flex items-center gap-6">
        <TickerContent />
        <TickerContent />
      </div>
    </div>
  )
}

function TickerContent() {
  return (
    <span className="inline-flex items-center gap-6">
      <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> Booth #7365 &middot; North Building &middot; 20&times;10 Inline</span>
      <span className="inline-flex items-center gap-1.5"><Radio size={12} /> Podcast recording live during show hours</span>
      <span className="inline-flex items-center gap-1.5"><Clock size={12} /> Show closes 3pm Tuesday &mdash; no early teardown</span>
      <span className="ml-8" />
    </span>
  )
}
