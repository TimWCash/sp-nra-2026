"use client"

import { useState, useEffect } from "react"
import { X, Share, Bell, UserCheck, UserPlus } from "lucide-react"

const SEEN_KEY = "sp_onboarding_seen"

const steps = [
  {
    icon: "📲",
    title: "Add to Your Home Screen",
    body: "Tap the Share icon in Safari → 'Add to Home Screen' → Add. This installs the app so it works offline and feels native.",
    tip: "Do this first — everything else works better from the home screen.",
  },
  {
    icon: "🦇",
    title: "Enable Bat Signal Alerts",
    body: "Go to the Team tab → tap 'Enable push alerts for Bat Signal'. This lets you get a real popup on your locked screen when the booth needs backup.",
    tip: "Takes 2 seconds. You only do it once.",
  },
  {
    icon: "🟢",
    title: "Set Your Status",
    body: "Go to the Team tab and tap your card to set where you are: At Booth, Walking Floor, On Break, In Meeting. The whole team sees it.",
    tip: "Update it whenever you leave the booth.",
  },
  {
    icon: "👤",
    title: "Capture Leads",
    body: "Tap Leads in the bottom nav → tap + to log a new contact. Snap their badge photo, set the heat level, and save. It syncs to the team Google Sheet automatically.",
    tip: "Even just a name is worth logging.",
  },
]

export function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const seen = localStorage.getItem(SEEN_KEY)
    if (!seen) setVisible(true)
  }, [])

  function close() {
    localStorage.setItem(SEEN_KEY, "1")
    setVisible(false)
  }

  function next() {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      close()
    }
  }

  if (!visible) return null

  const current = steps[step]

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center p-4"
      style={{ background: "var(--overlay)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-[480px] rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
              Getting Started · {step + 1} of {steps.length}
            </div>
            <div className="text-lg font-extrabold mt-0.5" style={{ color: "var(--text)" }}>
              Welcome to the Show App
            </div>
          </div>
          <button onClick={close}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-0"
            style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex gap-1.5 px-5 mb-5">
          {steps.map((_, i) => (
            <div key={i} className="h-1 rounded-full flex-1 transition-all duration-300"
              style={{ background: i <= step ? "var(--accent)" : "var(--border)" }} />
          ))}
        </div>

        {/* Step content */}
        <div className="px-5 pb-5">
          <div className="rounded-2xl p-5 mb-4"
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
            <div className="text-4xl mb-3">{current.icon}</div>
            <div className="text-[16px] font-bold mb-2" style={{ color: "var(--text)" }}>{current.title}</div>
            <div className="text-[14px] leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>{current.body}</div>
            <div className="text-[12px] font-semibold px-3 py-2 rounded-lg"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
              💡 {current.tip}
            </div>
          </div>

          <button onClick={next}
            className="w-full rounded-xl py-3.5 text-[15px] font-bold cursor-pointer active:scale-[0.98] transition-all duration-150 border-0"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            {step < steps.length - 1 ? "Next →" : "Got it — let's go 🚀"}
          </button>

          {step < steps.length - 1 && (
            <button onClick={close}
              className="w-full text-center text-[12px] pt-3 pb-1 cursor-pointer bg-transparent border-0"
              style={{ color: "var(--text-muted)" }}>
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
