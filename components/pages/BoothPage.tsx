"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { boothSetup, boothItems, showCosts, boothRules, boothIncluded } from "@/lib/data"

type BoothTab = "setup" | "items" | "rules" | "included"

export function BoothPage() {
  const [tab, setTab] = useState<BoothTab>("setup")

  const pills: { key: BoothTab; label: string }[] = [
    { key: "setup", label: "Setup" },
    { key: "items", label: "Items & Costs" },
    { key: "rules", label: "Booth Rules" },
    { key: "included", label: "What's Included" },
  ]

  return (
    <div className="animate-fade-in">
      <div className="font-display text-[28px] tracking-wider text-sp-text mb-4">Booth #7365</div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { val: "7365", label: "Booth Number" },
          { val: "20\u00d710", label: "Dimensions" },
          { val: "200", label: "Square Feet" },
          { val: "Inline", label: "Booth Type" },
        ].map((s) => (
          <div key={s.label} className="bg-sp-surface border border-sp-border rounded-[10px] p-3">
            <div className="font-display text-[26px] text-sp-teal leading-none">{s.val}</div>
            <div className="text-[11px] text-sp-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-sp-teal/10 border border-sp-teal/20 rounded-[10px] p-2.5 px-3.5 text-[13px] mb-3">
        \ud83d\udccd <strong>North Building</strong> &middot; Booths 5500\u20139200 &middot; Max height 8&apos;3&quot; (inline booth)
      </div>

      <a href="https://maps.app.goo.gl/e62PNZ8xhfvpkFR99" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 bg-gradient-to-r from-sp-teal to-sp-teal-dim text-[#0b1a22] font-body font-semibold text-sm border-none rounded-sp py-3.5 w-full cursor-pointer mb-3 no-underline">
        \ud83d\uddfa\ufe0f Open in Google Maps
      </a>

      {/* Pill Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {pills.map((p) => (
          <button key={p.key} onClick={() => setTab(p.key)}
            className={cn(
              "flex-shrink-0 py-1.5 px-3.5 bg-sp-surface border border-sp-border rounded-full text-sp-muted font-body text-xs font-medium cursor-pointer transition-all",
              tab === p.key && "bg-[#0d2535] border-sp-teal-dim text-sp-teal"
            )}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Setup Tab */}
      {tab === "setup" && (
        <div>
          <div className="font-display text-xl tracking-wider text-sp-text mb-3">2026 Layout</div>
          {boothSetup.map((s, i) => (
            <div key={i} className="bg-sp-surface border-l-[3px] border-l-sp-teal rounded-r-sp p-3.5 px-4 mb-2.5">
              <div className="font-display text-[13px] text-sp-teal tracking-wider mb-1">{s.tag}</div>
              <div className="text-sm">{s.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Items & Costs Tab */}
      {tab === "items" && (
        <div>
          <div className="font-display text-xl tracking-wider text-sp-text mb-3">Approved Items</div>
          <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
            {boothItems.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 text-sm border-b border-sp-border last:border-b-0">
                <span>{item.name}</span>
                <span className="font-semibold text-sp-teal">{item.amount}</span>
              </div>
            ))}
            <hr className="border-sp-border my-4" />
            <div className="flex justify-between pt-0 text-base font-semibold">
              <span>Booth Items Total</span>
              <span className="text-sp-teal text-lg">$2,637.25</span>
            </div>
          </div>

          <div className="font-display text-xl tracking-wider text-sp-text mt-4 mb-3">2025 Total Show Cost</div>
          <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
            {showCosts.map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2.5 text-sm border-b border-sp-border last:border-b-0">
                <span>{item.name}</span>
                <span className="font-semibold text-sp-teal">{item.amount}</span>
              </div>
            ))}
            <hr className="border-sp-border my-4" />
            <div className="flex justify-between pt-0 text-base font-semibold">
              <span>Total (2025 ref)</span>
              <span className="text-sp-teal text-lg">~$21,468</span>
            </div>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {tab === "rules" && (
        <div>
          <div className="bg-sp-red/10 border border-sp-red/25 rounded-[10px] p-2.5 px-3.5 text-[13px] mb-3 flex gap-2 items-start">
            <span className="flex-shrink-0 mt-0.5">\u26a0\ufe0f</span>
            <span>Max height for inline booth: <strong>8&apos;3&quot;</strong>. Stay compliant \u2014 violations = fees.</span>
          </div>
          <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
            {boothRules.map((rule, i) => (
              <div key={i} className={`flex items-start gap-3 py-3 ${i < boothRules.length - 1 ? "border-b border-sp-border" : ""}`}>
                <div className="text-sm font-medium">{rule}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Included Tab */}
      {tab === "included" && (
        <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
          {boothIncluded.map((item, i) => (
            <div key={i} className={`flex items-start gap-3 py-3 ${i < boothIncluded.length - 1 ? "border-b border-sp-border" : ""}`}>
              <div className="text-sm font-medium">{item}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
