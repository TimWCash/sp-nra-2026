"use client"

import { useEffect, useState } from "react"
import { X, ArrowRight, Sparkles } from "lucide-react"
import { CHANGELOG, type ChangelogEntry } from "@/lib/changelog"
import type { PageId } from "@/components/layout/BottomNav"

/**
 * Shows the user any changelog entries they haven't seen yet, exactly once.
 *
 * "Seen" = the id stored in localStorage is >= the id of the entry. Since
 * entries use a date-prefixed kebab-case id, lexicographic comparison sorts
 * chronologically.
 *
 * Mounts at the app root via app/page.tsx. Renders nothing if there's
 * nothing new to show or if the user has dismissed the queue.
 */

const SEEN_KEY = "sp_changelog_last_seen_id"

interface WhatsNewModalProps {
  onNavigate?: (page: PageId) => void
}

export function WhatsNewModal({ onNavigate }: WhatsNewModalProps) {
  const [unseen, setUnseen] = useState<ChangelogEntry[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    // Wait a beat after mount so we don't fight other modals (Onboarding etc.)
    // for the user's attention on first load.
    const t = setTimeout(() => {
      const lastSeen = localStorage.getItem(SEEN_KEY) || ""
      const newer = CHANGELOG.filter((e) => e.id > lastSeen)
      if (newer.length > 0) {
        setUnseen(newer)
        setOpen(true)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    // Mark all currently-shown entries as seen by stamping the newest id.
    if (unseen.length > 0) {
      try { localStorage.setItem(SEEN_KEY, unseen[0].id) } catch { /* ignore */ }
    }
    setOpen(false)
  }

  function handleCta(entry: ChangelogEntry) {
    dismiss()
    if (entry.cta && onNavigate) {
      onNavigate(entry.cta.page as PageId)
    }
  }

  if (!open || unseen.length === 0) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4"
      style={{ background: "var(--overlay)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-[480px] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          maxHeight: "85vh",
        }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "var(--accent)" }} />
            <div>
              <div className="text-[11px] font-bold tracking-widest uppercase"
                style={{ color: "var(--accent)" }}>
                What's New
              </div>
              <div className="text-[14px] font-bold mt-0.5" style={{ color: "var(--text)" }}>
                {unseen.length === 1
                  ? "1 update since you last opened the app"
                  : `${unseen.length} updates since you last opened the app`}
              </div>
            </div>
          </div>
          <button onClick={dismiss}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-0"
            style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {unseen.map((entry) => (
            <div key={entry.id} className="rounded-xl p-3.5"
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
              <div className="flex items-start gap-3">
                {entry.emoji && (
                  <div className="text-[20px] flex-shrink-0 leading-none mt-0.5">{entry.emoji}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[14px]" style={{ color: "var(--text)" }}>
                    {entry.title}
                  </div>
                  <div className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {entry.body}
                  </div>
                  {entry.cta && (
                    <button onClick={() => handleCta(entry)}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold cursor-pointer bg-transparent border-0 p-0"
                      style={{ color: "var(--accent)" }}>
                      {entry.cta.label} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={dismiss}
            className="w-full rounded-xl py-2.5 text-[13px] font-bold cursor-pointer border-0 active:scale-[0.98] transition-all"
            style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
