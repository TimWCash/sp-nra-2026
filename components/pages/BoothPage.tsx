"use client"

import { useState } from "react"
import { MapPin, AlertTriangle, Phone } from "lucide-react"
import { boothSetup, boothRules } from "@/lib/data"

// Our floor manager. Booth #7365 is in North Hall aisle 73, which falls in
// the 6800-8200 / 8800-9200 range per the NRA 2026 floor-manager directory.
// Phones are landlines (no SMS) and only go live Wed May 13.
const FLOOR_MANAGER = {
  name: "Gayle Alldredge",
  zone: "North Hall · Aisles 6800-8200 & 8800-9200",
  desk: "Across from booth 8901",
  phone: "312-808-2102",
  // tel: links work everywhere on iPhone; strip non-digits for the href
  phoneTel: "+13128082102",
  active: "Phones live Wed May 13 · Landlines only — no texts",
}

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

      {/* Booth render — hero reference image of the finished build. */}
      <div className="rounded-2xl mb-4 overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <img
          src="/booth-render.png"
          alt="Service Physics booth #7365 — NRA Show 2026 final layout"
          className="w-full block"
          style={{ aspectRatio: "1028 / 396", objectFit: "cover" }}
          loading="lazy"
        />
      </div>

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
      <div className="rounded-xl p-3 mb-3 text-[13px]"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <MapPin size={14} className="inline mr-1.5" />
        <strong>North Building</strong> &middot; Booths 5500-9200 &middot; Max height 8&apos;3&quot;
      </div>

      {/* Floor manager — first call when something goes wrong on-floor.
          Tappable phone link (works on iOS/Android — opens dialer). */}
      <div className="rounded-xl p-3.5 mb-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: "var(--text-muted)" }}>
          Floor Manager
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold" style={{ color: "var(--text)" }}>{FLOOR_MANAGER.name}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{FLOOR_MANAGER.zone}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              <MapPin size={11} className="inline mr-1 -mt-0.5" />
              {FLOOR_MANAGER.desk}
            </div>
          </div>
          <a href={`tel:${FLOOR_MANAGER.phoneTel}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-bold no-underline active:scale-[0.97] transition-all flex-shrink-0"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            <Phone size={13} />
            {FLOOR_MANAGER.phone}
          </a>
        </div>
        <div className="text-[10px] mt-2 leading-snug" style={{ color: "var(--amber)" }}>
          ⚠ {FLOOR_MANAGER.active}
        </div>
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
