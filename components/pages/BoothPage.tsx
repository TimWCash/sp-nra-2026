"use client"

import { useState } from "react"
import { MapPin, AlertTriangle } from "lucide-react"
import { boothSetup, boothRules } from "@/lib/data"

type BoothTab = "setup" | "rules"

export function BoothPage() {
  const [tab, setTab] = useState<BoothTab>("setup")

  const pills: { key: BoothTab; label: string }[] = [
    { key: "setup", label: "Setup" },
    { key: "rules", label: "Rules" },
  ]

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Booth #7365</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { val: "7365", label: "Booth #" },
          { val: "20×10", label: "Dimensions" },
          { val: "200", label: "Sq Ft" },
          { val: "Inline", label: "Type" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div className="text-lg font-extrabold leading-none" style={{ color: "var(--accent)" }}>{s.val}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Location Info */}
      <div className="rounded-xl p-3 mb-4 text-[13px]"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <MapPin size={14} className="inline mr-1.5" />
        <strong>North Building</strong> &middot; Booths 5500-9200 &middot; Max height 8&apos;3&quot;
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4">
        {pills.map((p) => (
          <button key={p.key} onClick={() => setTab(p.key)}
            className="flex-shrink-0 py-1.5 px-4 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200"
            style={{
              background: tab === p.key ? "var(--accent)" : "var(--surface)",
              color: tab === p.key ? "var(--accent-fg)" : "var(--text-secondary)",
              border: `1px solid ${tab === p.key ? "var(--accent)" : "var(--border)"}`,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Setup Tab */}
      {tab === "setup" && (
        <div className="space-y-2.5">
          {boothSetup.map((s, i) => (
            <div key={i} className="rounded-xl p-3.5 border-l-[3px]"
              style={{ background: "var(--surface)", borderLeftColor: "var(--accent)", borderTop: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
              <div className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--accent)" }}>{s.tag}</div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{s.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rules Tab */}
      {tab === "rules" && (
        <div>
          <div className="rounded-xl p-3 mb-3 flex gap-2.5 items-start text-[13px]" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>Max height for inline booth: <strong>8&apos;3&quot;</strong>. Violations = fees.</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {boothRules.map((rule, i) => (
              <div key={i} className={`px-4 py-3 text-sm ${i < boothRules.length - 1 ? "border-b" : ""}`}
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{rule}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
