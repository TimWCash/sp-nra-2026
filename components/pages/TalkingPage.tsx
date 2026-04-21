"use client"

import { MessageCircle, Target, Shield, ArrowRight } from "lucide-react"
import { openers, coreMessages, objections } from "@/lib/data"
import type { TalkingPoint } from "@/lib/data"

function TalkCard({ point }: { point: TalkingPoint }) {
  return (
    <div className="rounded-xl p-3.5 border-l-[3px] mb-2.5"
      style={{ background: "var(--surface)", borderLeftColor: "var(--accent)", borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--accent)" }}>{point.tag}</div>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{point.text}</div>
    </div>
  )
}

function Section({ icon, title, className = "" }: { icon: React.ReactNode; title: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 mb-2.5 ${className}`}>
      <span style={{ color: "var(--accent)" }}>{icon}</span>
      <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{title}</h2>
    </div>
  )
}

export function TalkingPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>At the Booth</h1>

      <div className="rounded-xl p-3 mb-5 text-[13px]"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <Target size={14} className="inline mr-1.5" />
        Use these to open conversations. Keep it natural &mdash; you know this stuff. &#127919;
      </div>

      <Section icon={<MessageCircle size={16} />} title="Opening Lines" />
      {openers.map((p, i) => <TalkCard key={i} point={p} />)}

      <Section icon={<Target size={16} />} title="Core Message" className="mt-6" />
      {coreMessages.map((p, i) => <TalkCard key={i} point={p} />)}

      <Section icon={<Shield size={16} />} title="Objection Handling" className="mt-6" />
      {objections.map((p, i) => <TalkCard key={i} point={p} />)}

      <Section icon={<ArrowRight size={16} />} title="Closing the Conversation" className="mt-6" />
      <TalkCard point={{ tag: "NEXT STEP", text: "Always end with a clear action: send a case study, book a follow-up call, or invite them to be a podcast guest. Scan their badge with lead retrieval and add a note immediately." }} />
    </div>
  )
}
