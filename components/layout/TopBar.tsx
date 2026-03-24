"use client"

import { useChicagoTime } from "@/hooks/useChicagoTime"
import { useTheme } from "@/hooks/useTheme"

export function TopBar() {
  const time = useChicagoTime()
  const { theme, toggle } = useTheme()

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-[#0f0f0fdd] [data-theme='light']_&:bg-[#ffffffee] backdrop-blur-xl border-b border-sp-border flex items-center justify-between px-4 h-14"
      style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
      <div className="font-display text-[22px] tracking-wider text-sp-text">
        SP <span className="text-sp-teal">&times;</span> NRA &apos;26
      </div>
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-sp-surface2 border border-sp-border text-sp-text flex items-center justify-center text-base cursor-pointer transition-all active:scale-[0.92] active:border-sp-teal"
        >
          {theme === "dark" ? "\u2600\ufe0f" : "\ud83c\udf19"}
        </button>
        <div className="text-right leading-tight">
          <div className="text-[13px] font-semibold text-sp-text">{time}</div>
          <div className="text-[11px] text-sp-muted">May 16\u201319 \u00b7 Chicago</div>
        </div>
      </div>
    </div>
  )
}
