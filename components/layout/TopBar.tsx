"use client"

import { Moon, Sun } from "lucide-react"
import { useChicagoTime } from "@/hooks/useChicagoTime"
import { useTheme } from "@/hooks/useTheme"

export function TopBar() {
  const time = useChicagoTime()
  const { theme, toggle } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-md border-b"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            SP
          </div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>
              NRA 2026
            </div>
            <div className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
              Booth #7365
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200"
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="text-right">
            <div className="text-sm font-semibold tabular-nums" style={{ color: "var(--text)" }}>{time}</div>
            <div className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>May 16-19 Chicago</div>
          </div>
        </div>
      </div>
    </header>
  )
}
