"use client"

import { useState } from "react"
import { Truck, MapPin, ChevronRight, AlertTriangle, Clock, Package, CheckSquare, ExternalLink } from "lucide-react"

const materialChecklist = {
  furniture: [
    { id: "f1", label: "Cabinet (×3)" },
    { id: "f2", label: "Stools (×4)" },
    { id: "f3", label: "IKEA Table" },
    { id: "f4", label: "Tabletop Butcher Paper" },
    { id: "f5", label: "Tabletop Butcher Paper Dispenser" },
  ],
  booth: [
    { id: "b1", label: '32" TV' },
    { id: "b2", label: "Vice Grip for TV" },
    { id: "b3", label: "Mr. Potato Head" },
    { id: "b4", label: "Mugs (×10)" },
    { id: "b5", label: "Ring Light and Stand" },
    { id: "b6", label: "Nomono Podcast Equipment Kit" },
    { id: "b7", label: "Joy of Ops Neon Sign" },
  ],
  handheld: [
    { id: "h1", label: "Order confirmation for Freeman" },
    { id: "h2", label: "List of everything you're bringing in" },
    { id: "h3", label: "Exhibit floor map" },
    { id: "h4", label: "Map to Marshalling Yard" },
    { id: "h5", label: "Exhibitor badges for all team members" },
  ],
}

const STORAGE_KEY = "sp_load_checks"

function loadChecks(): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") } catch { return {} }
}

export function LoadInOutPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks)
  const [activeTab, setActiveTab] = useState<"checkin" | "materials" | "rules" | "loadout">("checkin")

  const toggle = (id: string) => {
    const updated = { ...checks, [id]: !checks[id] }
    setChecks(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const tabs = [
    { key: "checkin", label: "Check-In" },
    { key: "materials", label: "Materials" },
    { key: "rules", label: "ASUV Rules" },
    { key: "loadout", label: "Load Out" },
  ] as const

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Load In / Out</h1>
      <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Target move-in: <strong style={{ color: "var(--accent)" }}>May 14, 2026 · 7:00am CT</strong></p>

      {/* Event Details Banner */}
      <div className="rounded-xl p-3.5 mb-4 flex gap-3 items-start"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <MapPin size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
        <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text)" }}>McCormick Place</strong> · 2301 S Martin Luther King Drive, Chicago IL 60616 · Booth #7365
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex-shrink-0 px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-all duration-200"
            style={{
              background: activeTab === t.key ? "var(--accent)" : "var(--surface)",
              color: activeTab === t.key ? "var(--accent-fg)" : "var(--text-secondary)",
              border: `1px solid ${activeTab === t.key ? "var(--accent)" : "var(--border)"}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CHECK-IN TAB */}
      {activeTab === "checkin" && (
        <>
          <SectionLabel>Arrive at Marshalling Yard</SectionLabel>
          <div className="rounded-xl overflow-hidden mb-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {[
              { icon: "📍", title: "Marshalling Yard Address", sub: "3050 S. Moe Drive, Chicago, IL 60616 · Just west of Lake Shore Drive, ~6 blocks south of McCormick Place" },
              { icon: "💵", title: "$25.00 fee to enter", sub: "Credit cards accepted · Say you are a Show exhibitor here for SELF UNLOADING via ASUV" },
              { icon: "🪪", title: "Obtain a Dock Pass", sub: "Required — you will NOT be allowed dock access without an ASUV Dock Pass. No additional fee." },
              { icon: "🕑", title: "Marshalling Yard closes at 2:30pm", sub: "Plan your arrival accordingly" },
            ].map((item, i, arr) => (
              <div key={i} className={`px-4 py-3 flex gap-3 items-start ${i < arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                <span className="text-base mt-0.5">{item.icon}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <a href="https://maps.app.goo.gl/Ppvt3b72V9VGT1jc9" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl no-underline transition-all mb-4 active:scale-[0.98]"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            <div className="flex items-center gap-2.5">
              <Truck size={16} />
              <div>
                <div className="text-sm font-semibold">Marshalling Yard — Google Maps</div>
                <div className="text-xs opacity-80">3050 S. Moe Drive, Chicago</div>
              </div>
            </div>
            <ExternalLink size={14} />
          </a>

          <SectionLabel>Find Your Booth</SectionLabel>
          <div className="rounded-xl overflow-hidden mb-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {[
              { title: "Check in at Exhibit Service Center", sub: "Required upon arrival to claim the booth" },
              { title: "Confirm booth is 10\'×20\'", sub: "North Building · Booths 5500–9200" },
              { title: "Confirm electrical drop is done", sub: "120V outlet ordered via Freeman" },
              { title: "Check backdrop is set up correctly", sub: "Graphics should be correct — verify before unpacking" },
            ].map((item, i, arr) => (
              <div key={i} className={`px-4 py-3 ${i < arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>✓ {item.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-3 flex gap-2 items-start text-[13px]"
            style={{ background: "var(--amber-light)", color: "var(--amber-fg)", border: "1px solid var(--amber)" }}>
            <Clock size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
            <span>Display must be <strong>fully installed by May 15, 4:00pm</strong>. Arrive May 14 to give ample setup time.</span>
          </div>
        </>
      )}

      {/* MATERIALS TAB */}
      {activeTab === "materials" && (
        <>
          <SectionLabel>Furniture</SectionLabel>
          <CheckList items={materialChecklist.furniture} checks={checks} toggle={toggle} />

          <SectionLabel>Booth Elements</SectionLabel>
          <CheckList items={materialChecklist.booth} checks={checks} toggle={toggle} />

          <SectionLabel>Have On Hand</SectionLabel>
          <CheckList items={materialChecklist.handheld} checks={checks} toggle={toggle} />

          <button
            onClick={() => {
              const allIds = [...materialChecklist.furniture, ...materialChecklist.booth, ...materialChecklist.handheld].map(i => i.id)
              const allChecked = allIds.every(id => checks[id])
              const updated: Record<string, boolean> = { ...checks }
              allIds.forEach(id => { updated[id] = !allChecked })
              setChecks(updated)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
            }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all mt-2"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Toggle All
          </button>
        </>
      )}

      {/* ASUV RULES TAB */}
      {activeTab === "rules" && (
        <>
          <div className="rounded-xl p-3.5 mb-4 text-[13px]"
            style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
            <strong>ASUV = Automobile &amp; Small Utility Vehicle</strong><br />
            <span className="text-[12px] opacity-80">For exhibitors who hand carry or use a hand truck/dolly in under 20 minutes.</span>
          </div>

          <SectionLabel>When Available</SectionLabel>
          <div className="rounded-xl p-3.5 mb-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>Thursday May 14 &amp; Friday May 15</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>8:00am – 4:30pm CT both days</div>
            <div className="text-xs mt-2 font-semibold" style={{ color: "var(--accent)" }}>🎯 Target: Thursday May 14 at 7:00am — arrive early for ample setup time</div>
          </div>

          <SectionLabel>Rules</SectionLabel>
          <div className="rounded-xl overflow-hidden mb-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {[
              { icon: "⏱️", rule: "20 minutes max to unload/load" },
              { icon: "👥", rule: "Team of 2+ required — driver must always stay with vehicle" },
              { icon: "🛒", rule: "Hand carry or manual cart/dolly only — no forklifts, pallet jacks, or motorized equipment" },
              { icon: "🪪", rule: "Must have Show 2026 Exhibitor Badge to transport materials" },
              { icon: "👔", rule: "Only full-time company employees may unload" },
              { icon: "🚗", rule: "Cars, pickups, minivans, full-size vans, SUVs OK — no flatbeds, box vans, trailers, or commercial vehicles" },
            ].map((item, i, arr) => (
              <div key={i} className={`px-4 py-3 flex gap-3 items-start ${i < arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                <span className="text-base">{item.icon}</span>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.rule}</div>
              </div>
            ))}
          </div>

          <SectionLabel>Vehicle Traffic — North Building</SectionLabel>
          <div className="rounded-xl p-3.5 text-[13px]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            Proceed north out of Marshalling Yard on Moe Drive to the stop sign (Frontage Road, west of Lake Shore Drive). Follow <strong style={{ color: "var(--text)" }}>N1 &amp; N3</strong> directional signs. A traffic coordinator will direct you to the proper loading area.
          </div>
        </>
      )}

      {/* LOAD OUT TAB */}
      {activeTab === "loadout" && (
        <>
          <div className="rounded-xl p-3 mb-4 flex gap-2.5 items-start text-[13px]"
            style={{ background: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span><strong>NO early teardown before 3:00pm Tuesday.</strong> Violators risk losing future show participation rights.</span>
          </div>

          <SectionLabel>Steps</SectionLabel>
          <div className="rounded-xl overflow-hidden mb-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {[
              { title: "Notify Exhibit Service Center", sub: "Let them know you are clear of the booth before leaving" },
              { title: "Fold up backdrop", sub: "Into the included bag — don't leave it behind" },
              { title: "Pack in / Pack out", sub: "Anything left behind after check-out will be considered trash" },
            ].map((item, i, arr) => (
              <div key={i} className={`px-4 py-3 ${i < arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.sub}</div>
              </div>
            ))}
          </div>

          <SectionLabel>Move-Out Schedule</SectionLabel>
          <div className="rounded-xl overflow-hidden mb-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {[
              { label: "Show closes / Move-out begins", date: "Tue May 19, 3:01pm" },
              { label: "Move-out window Day 1", date: "May 19 · 3:01pm – 7:30pm" },
              { label: "Continue move-out", date: "May 20–21 · 7:30am – 4:30pm" },
              { label: "All items must be cleared", date: "May 21–22 noon" },
            ].map((item, i, arr) => (
              <div key={i} className={`flex justify-between items-center px-4 py-3 ${i < arr.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>{item.date}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-3 flex gap-2 items-start text-[13px]"
            style={{ background: "var(--amber-light)", color: "var(--amber-fg)", border: "1px solid var(--amber)" }}>
            <Package size={15} className="flex-shrink-0 mt-0.5" style={{ color: "var(--amber)" }} />
            <span>Kelly departs <strong>ORD → DFW at 8:35pm Tuesday</strong> — plan load-out accordingly.</span>
          </div>
        </>
      )}
    </div>
  )
}

function CheckList({ items, checks, toggle }: {
  items: { id: string; label: string }[]
  checks: Record<string, boolean>
  toggle: (id: string) => void
}) {
  return (
    <div className="rounded-xl overflow-hidden mb-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      {items.map((item, i) => (
        <button key={item.id} onClick={() => toggle(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-all duration-150 ${i < items.length - 1 ? "border-b" : ""}`}
          style={{ borderColor: "var(--border)", background: "transparent" }}>
          <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-150"
            style={{
              background: checks[item.id] ? "var(--success)" : "transparent",
              border: `1.5px solid ${checks[item.id] ? "var(--success)" : "var(--border-strong)"}`,
            }}>
            {checks[item.id] && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
          </div>
          <span className="text-sm" style={{
            color: checks[item.id] ? "var(--text-muted)" : "var(--text)",
            textDecoration: checks[item.id] ? "line-through" : "none",
          }}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold tracking-widest uppercase mb-2.5" style={{ color: "var(--text-muted)" }}>{children}</div>
}
