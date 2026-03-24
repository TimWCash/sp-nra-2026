"use client"

import { useState, useEffect, useCallback } from "react"
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
    <div className="flex items-start gap-3 py-3 border-b border-sp-border last:border-b-0">
      <button onClick={toggle}
        className={`w-5 h-5 rounded-md border-[1.5px] flex-shrink-0 cursor-pointer flex items-center justify-center transition-all mt-0.5 ${
          checked ? "bg-sp-green border-sp-green" : "bg-transparent border-sp-border"
        }`}>
        {checked && <span className="text-[#0b1a22] text-xs font-bold">\u2713</span>}
      </button>
      <div className={`text-sm font-medium ${checked ? "line-through opacity-40" : ""}`}>{label}</div>
    </div>
  )
}

export function MorePage() {
  const [copyLabel, setCopyLabel] = useState("\ud83d\udccb Copy to clipboard")

  function copyEmail() {
    navigator.clipboard.writeText(emailTemplate).then(() => {
      setCopyLabel("\u2705 Copied!")
      setTimeout(() => setCopyLabel("\ud83d\udccb Copy to clipboard"), 2000)
    })
  }

  return (
    <div className="animate-fade-in">
      <div className="font-display text-[28px] tracking-wider text-sp-text mb-4">More</div>

      {/* What to Bring */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-sp-muted mb-2.5">What to Bring</div>
        <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
          {packingList.map((section, si) => (
            <div key={si} className={si < packingList.length - 1 ? "mb-5" : ""}>
              <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-sp-muted mb-2">
                {section.icon} {section.title}
              </div>
              {section.items.map((item, ii) => (
                <CheckItem key={`${si}-${ii}`} id={`wi_${si}_${ii}`} label={item} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Email Template */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-sp-muted mb-2.5">Post-Show Follow-Up Email</div>
        <div className="bg-sp-teal/10 border border-sp-teal/20 rounded-[10px] p-2.5 px-3.5 text-[13px] mb-3">
          \ud83d\udce7 Send within <strong>10 business days</strong> of show close. Personalize the [brackets].
        </div>
        <div className="bg-sp-surface border border-sp-border rounded-sp p-4 text-[13px] leading-relaxed whitespace-pre-wrap">
          {emailTemplate}
        </div>
        <button onClick={copyEmail}
          className="bg-sp-surface2 border border-sp-border rounded-lg text-sp-text font-body text-[13px] font-medium py-2.5 px-4 cursor-pointer mt-2.5 w-full transition-colors active:border-sp-teal active:bg-sp-teal/10">
          {copyLabel}
        </button>
      </div>

      {/* Load In Instructions */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-sp-muted mb-2.5">Load In Instructions</div>
        <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
          {[
            { title: "1. Head to Marshalling Yard first", sub: "Do not drive directly to McCormick Place loading dock" },
            { title: "2. Check in at Freeman desk", sub: "Bring Freeman confirmation + booth number" },
            { title: "3. Follow floor markings to Booth #7365", sub: "North Building \u00b7 Booths 5500\u20139200" },
            { title: "4. Booth must be set by May 15, 4:00pm" },
          ].map((item, i) => (
            <div key={i} className={`py-3 ${i < 3 ? "border-b border-sp-border" : ""}`}>
              <div className="text-sm font-medium">{item.title}</div>
              {item.sub && <div className="text-xs text-sp-muted mt-0.5">{item.sub}</div>}
            </div>
          ))}
        </div>
        <a href="https://maps.app.goo.gl/Ppvt3b72V9VGT1jc9" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-3.5 px-4 bg-sp-surface border border-sp-border rounded-sp mt-2 no-underline text-sp-text">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sp-surface2 flex items-center justify-center text-lg">\ud83d\ude9b</div>
            <div><div className="text-sm font-medium">Marshalling Yard</div><div className="text-xs text-sp-muted">Open in Maps</div></div>
          </div>
          <span className="text-sp-muted text-lg">\u2192</span>
        </a>

        <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-sp-muted mt-4 mb-2.5">Load Out</div>
        <div className="bg-sp-surface border border-sp-border rounded-sp p-4">
          {[
            { title: "Do NOT pack up before 3pm Tuesday", sub: "Early teardown = risk losing future show rights" },
            { title: "Move-out window: May 19, 3:01pm \u2013 7:30pm" },
            { title: "Continue May 20\u201321: 7:30am \u2013 4:30pm" },
            { title: "All items cleared by May 21\u201322 noon" },
          ].map((item, i) => (
            <div key={i} className={`py-3 ${i < 3 ? "border-b border-sp-border" : ""}`}>
              <div className="text-sm font-medium">{item.title}</div>
              {item.sub && <div className="text-xs text-sp-muted mt-0.5">{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Key Links */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-sp-muted mb-2.5">Key Links</div>
        {moreLinks.map((link, i) => (
          <a key={i} href={link.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 px-4 bg-sp-surface border border-sp-border rounded-sp mb-2 no-underline text-sp-text transition-colors active:border-sp-teal-dim">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sp-surface2 flex items-center justify-center text-lg">{link.icon}</div>
              <div><div className="text-sm font-medium">{link.label}</div><div className="text-xs text-sp-muted">{link.sub}</div></div>
            </div>
            <span className="text-sp-muted text-lg">\u2192</span>
          </a>
        ))}
      </div>

      {/* Badge Pickup */}
      <div className="mb-6">
        <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-sp-muted mb-2.5">Badge Pickup</div>
        <div className="bg-sp-surface border border-sp-border rounded-sp p-4 text-sm leading-relaxed">
          <p>Badges are picked up on-site at McCormick Place registration.</p>
          <p className="mt-2 text-sp-muted">Bring your exhibitor confirmation email. Each person picks up their own badge. 5 complimentary badges included for the first 100 sq ft + 3 per additional 100 sq ft.</p>
        </div>
      </div>
    </div>
  )
}
