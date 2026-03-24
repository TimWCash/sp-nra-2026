"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, Mail, Truck, MapPin, ChevronRight, ExternalLink, Copy } from "lucide-react"
import { packingList, moreLinks, emailTemplate } from "@/lib/data"

function CheckItem({ id, label }: { id: string; label: string }) {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    setChecked(localStorage.getItem("sp_check_" + id) === "1")
  }, [id])

  const toggle = useCallback(() => {
    setChecked((prev) => {
      const next = !prev
      localStorage.setItem("sp_check_" + id, next ? "1" : "0")
      return next
    })
  }, [id])

  return (
    <button onClick={toggle} className="flex items-start gap-3 py-3 w-full text-left cursor-pointer bg-transparent border-none border-b"
      style={{ borderColor: "var(--border)" }}>
      <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all duration-150 mt-0.5"
        style={{
          background: checked ? "var(--success)" : "var(--surface)",
          border: checked ? "none" : "1.5px solid var(--border-strong)",
        }}>
        {checked && <Check size={12} strokeWidth={3} color="white" />}
      </div>
      <span className={`text-sm font-medium ${checked ? "line-through opacity-40" : ""}`}
        style={{ color: checked ? "var(--text-muted)" : "var(--text-secondary)" }}>{label}</span>
    </button>
  )
}

export function MorePage() {
  const [copyLabel, setCopyLabel] = useState("Copy to clipboard")

  function copyEmail() {
    navigator.clipboard.writeText(emailTemplate).then(() => {
      setCopyLabel("Copied!")
      setTimeout(() => setCopyLabel("Copy to clipboard"), 2000)
    })
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-5" style={{ color: "var(--text)" }}>More</h1>

      {/* Packing List */}
      <SectionLabel>What to Bring</SectionLabel>
      <div className="rounded-xl p-4 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        {packingList.map((section, si) => (
          <div key={si} className={si < packingList.length - 1 ? "mb-5" : ""}>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-1"
              style={{ color: "var(--accent)" }}>{section.title}</div>
            {section.items.map((item, ii) => (
              <CheckItem key={`${si}-${ii}`} id={`wi_${si}_${ii}`} label={item} />
            ))}
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

      {/* Load In */}
      <SectionLabel className="mt-6">Load In</SectionLabel>
      <div className="rounded-xl overflow-hidden mb-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {[
          { title: "1. Head to Marshalling Yard first", sub: "Do not drive directly to loading dock" },
          { title: "2. Check in at Freeman desk", sub: "Bring confirmation + booth number" },
          { title: "3. Follow floor markings to #7365", sub: "North Building" },
          { title: "4. Set up by May 15, 4:00pm" },
        ].map((item, i) => (
          <div key={i} className={`px-4 py-3 ${i < 3 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.title}</div>
            {item.sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.sub}</div>}
          </div>
        ))}
      </div>
      <a href="https://maps.app.goo.gl/Ppvt3b72V9VGT1jc9" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-between p-3.5 rounded-xl no-underline transition-all duration-200 mb-3 active:scale-[0.98]"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
            <Truck size={16} style={{ color: "var(--accent)" }} />
          </div>
          <div><div className="text-sm font-medium">Marshalling Yard</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Open in Maps</div></div>
        </div>
        <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
      </a>

      <SectionLabel>Load Out</SectionLabel>
      <div className="rounded-xl overflow-hidden mb-6"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {[
          { title: "Do NOT pack up before 3pm Tuesday", sub: "Risk losing future show rights" },
          { title: "Move-out: May 19, 3:01pm - 7:30pm" },
          { title: "Continue May 20-21: 7:30am - 4:30pm" },
          { title: "All items cleared by May 22 noon" },
        ].map((item, i) => (
          <div key={i} className={`px-4 py-3 ${i < 3 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{item.title}</div>
            {item.sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* Links */}
      <SectionLabel>Key Links</SectionLabel>
      <div className="space-y-2 mb-6">
        {moreLinks.map((link, i) => (
          <a key={i} href={link.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl no-underline transition-all duration-200 active:scale-[0.98]"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-light)" }}>
                <ExternalLink size={16} style={{ color: "var(--accent)" }} />
              </div>
              <div><div className="text-sm font-medium">{link.label}</div><div className="text-xs" style={{ color: "var(--text-muted)" }}>{link.sub}</div></div>
            </div>
            <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
          </a>
        ))}
      </div>

      {/* Badge Pickup */}
      <SectionLabel>Badge Pickup</SectionLabel>
      <div className="rounded-xl p-4 text-sm leading-relaxed"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
        <p>Badges picked up on-site at McCormick Place registration.</p>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>Bring exhibitor confirmation email. 5 complimentary badges included for first 100 sq ft + 3 per additional 100 sq ft.</p>
      </div>
    </div>
  )
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-[11px] font-bold tracking-widest uppercase mb-2.5 ${className}`} style={{ color: "var(--text-muted)" }}>{children}</div>
}
