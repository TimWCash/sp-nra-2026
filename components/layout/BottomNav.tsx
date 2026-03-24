"use client"

import {
  Home, Calendar, Briefcase, Users, MessageSquare, UserPlus, MoreHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type PageId = "home" | "schedule" | "booth" | "team" | "talk" | "leads" | "more"

const tabs: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "booth", label: "Booth", icon: Briefcase },
  { id: "team", label: "Team", icon: Users },
  { id: "talk", label: "Talking", icon: MessageSquare },
  { id: "leads", label: "Leads", icon: UserPlus },
  { id: "more", label: "More", icon: MoreHorizontal },
]

interface BottomNavProps {
  active: PageId
  onChange: (id: PageId) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-sp-border flex pb-[env(safe-area-inset-bottom,0px)]"
      style={{ background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 bg-transparent border-none cursor-pointer transition-colors font-body text-[10px] font-medium",
              isActive ? "text-sp-teal" : "text-sp-muted"
            )}
          >
            <Icon size={20} className={isActive ? "drop-shadow-[0_0_4px_rgba(79,168,166,0.3)]" : ""} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
