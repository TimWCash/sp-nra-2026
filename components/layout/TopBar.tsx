"use client"

import { Moon, Sun } from "lucide-react"
import { useChicagoTime } from "@/hooks/useChicagoTime"
import { useTheme } from "@/hooks/useTheme"

// Service Physics logomark — extracted from the horizontal SVG
function SPMark({ color }: { color: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 108" width="26" height="26" fill={color}>
      <path d="M35.71,25.84v21.92l12.8,13.9c.33.35.31.9-.03,1.24L14.63,96.08c-.21.2-.21.54-.01.75l10.1,10.53c.21.22.55.22.76,0l33.12-32.9c3.26-3.24,5.29-7.59,5.4-12.18,0-.26,0-.53,0-.81-.09-4.57-2.04-8.91-5.2-12.21l-22.61-23.62c-.17-.18-.48-.06-.48.19Z"/>
      <path d="M28.29,81.69v-21.92s-12.8-13.9-12.8-13.9c-.33-.35-.31-.9.03-1.24L49.38,11.45c.21-.2.21-.54.01-.75L39.28.16c-.21-.22-.55-.22-.76,0L5.4,33.06C2.14,36.3.11,40.64,0,45.24c0,.26,0,.53,0,.81.09,4.57,2.04,8.91,5.2,12.21l22.61,23.62c.17.18.48.06.48-.19Z"/>
    </svg>
  )
}

export function TopBar() {
  const time = useChicagoTime()
  const { theme, toggle } = useTheme()

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-md border-b"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent)" }}>
            <SPMark color="#ffffff" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: "var(--text)" }}>
              NRA 2026
            </div>
            <div className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
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
            <div className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>May 16-19 Chicago</div>
          </div>
        </div>
      </div>
    </header>
  )
}
