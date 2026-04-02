"use client"

import {
  Home, Calendar, Briefcase, UserPlus, MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type PageId = "home" | "schedule" | "booth" | "team" | "talk" | "leads" | "podcast" | "status" | "loadin" | "more"

const tabs: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "leads", label: "Leads", icon: UserPlus },
  { id: "booth", label: "Booth", icon: Briefcase },
  { id: "more", label: "More", icon: MoreHorizontal },
]

interface BottomNavProps {
  active: PageId
  onChange: (id: PageId) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t flex pb-[env(safe-area-inset-bottom,0px)]"
      style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 -1px 8px rgba(0,0,0,0.04)" }}
      aria-label="Main navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-3 min-h-[56px] bg-transparent border-none cursor-pointer transition-colors duration-200 text-[11px] font-semibold relative"
            )}
            style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: "var(--accent)" }} />
            )}
            <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
