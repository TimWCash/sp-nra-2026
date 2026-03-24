"use client"

import { useState } from "react"
import { MapPin, AlertTriangle, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { boothSetup, boothItems, showCosts, boothRules, boothIncluded } from "@/lib/data"

type BoothTab = "setup" | "items" | "rules" | "included"

export function BoothPage() {
  const [tab, setTab] = useState<BoothTab>("setup")

  const pills: { key: BoothTab; label: string }[] = [
    { key: "setup", label: "Setup" },
    { key: "items", label: "Items & Costs" },
    { key: "rules", label: "Rules" },
    { key: "included", label: "Included" },
  ]

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Booth #7365</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {[
          { val: "7365", label: "Booth Number" },
          { val: "20x10", label: "Dimensions" },
          { val: "200 sq ft", label: "Square Feet" },
          { val: "Inline", label: "Booth Type" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <div className="text-xl font-extrabold leading-none" style={{ color: "var(--accent)" }}>{s.val}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-3 mb-3 text-[13px]"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <MapPin size={14} className="inline mr-1.5" />
        <strong>North Building</strong> &middot; Booths 5500-9200 &middot; Max height 8&apos;3&quot;
      </div>

      <a href="https://maps.app.goo.gl/e62PNZ8xhfvpkFR99" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl py-3.5 w-full cursor-pointer mb-4 no-underline font-semibold text-sm transition-all duration-200 active:scale-[0.98]"
        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
        <ExternalLink size={16} /> Open in Google Maps
      </a>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {pills.map((p) => (
          <button key={p.key} onClick={() => setTab(p.key)}
            className={cn("flex-shrink-0 py-1.5 px-4 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200")}
            style={{
              background: tab === p.key ? "var(--accent)" : "var(--surface)",
              color: tab === p.key ? "var(--accent-fg)" : "var(--text-secondary)",
              border: `1px solid ${tab === p.key ? "var(--accent)" : "var(--border)"}`,
            }}>
            {p.label}
          </button>
        ))}
      </div>

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

      {tab === "items" && (
        <div>
          <div className="rounded-xl overflow-hidden mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {boothItems.map((item, i) => (
              <div key={i} className={`flex justify-between items-center px-4 py-2.5 text-sm ${i < boothItems.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{item.name}</span>
                <span className="font-semibold" style={{ color: "var(--accent)" }}>{item.amount}</span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 font-bold border-t" style={{ borderColor: "var(--border)" }}>
              <span>Total</span>
              <span style={{ color: "var(--accent)" }}>$2,637.25</span>
            </div>
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: "var(--text)" }}>2025 Reference Costs</h3>
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {showCosts.map((item, i) => (
              <div key={i} className={`flex justify-between items-center px-4 py-2.5 text-sm ${i < showCosts.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{item.name}</span>
                <span className="font-semibold" style={{ color: "var(--accent)" }}>{item.amount}</span>
              </div>
            ))}
            <div className="flex justify-between items-center px-4 py-3 font-bold border-t" style={{ borderColor: "var(--border)" }}>
              <span>Total (2025 ref)</span>
              <span style={{ color: "var(--accent)" }}>~$21,468</span>
            </div>
          </div>
        </div>
      )}

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

      {tab === "included" && (
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {boothIncluded.map((item, i) => (
            <div key={i} className={`px-4 py-3 text-sm ${i < boothIncluded.length - 1 ? "border-b" : ""}`}
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{item}</div>
          ))}
        </div>
      )}
    </div>
  )
}
