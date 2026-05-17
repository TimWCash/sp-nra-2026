"use client"

/**
 * BadgeGallery — fullscreen modal that shows every lead's saved badge
 * photo as a tappable thumbnail grid, with a lightbox on tap.
 *
 * Source: a one-shot read from Supabase nra_leads (id, name, company,
 * captured_by, badge_photo). Filters to rows with a non-empty
 * badge_photo. Sorted by most recent first.
 *
 * Loads on open, NOT on every MorePage render — base64 photos can be
 * 50-100KB each, so a 30-lead gallery is 1.5-3MB of payload. Keep it
 * lazy.
 */

import { useEffect, useState } from "react"
import { X, Camera, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase"

type BadgeRow = {
  id: string
  name: string
  company: string
  captured_by: string | null
  badge_photo: string
  created_at: string
}

interface BadgeGalleryProps {
  open: boolean
  onClose: () => void
}

export function BadgeGallery({ open, onClose }: BadgeGalleryProps) {
  const [rows, setRows] = useState<BadgeRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  // Fetch on open. Re-fetch every open so newly-captured leads appear
  // without needing a remount.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setRows(null)
    setError(null)
    setLightboxIdx(null)

    supabase
      .from("nra_leads")
      .select("id, name, company, captured_by, badge_photo, created_at")
      .neq("badge_photo", "")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
          setRows([])
        } else {
          // Defense: badge_photo column has default '' but a NULL could slip
          // through if a migration ran. Filter to truthy data-URLs only.
          const valid = (data ?? []).filter((r): r is BadgeRow =>
            typeof r.badge_photo === "string" && r.badge_photo.startsWith("data:image"),
          )
          setRows(valid)
        }
      })

    return () => { cancelled = true }
  }, [open])

  // Keyboard navigation when the lightbox is open. Esc closes, arrows
  // move between photos.
  useEffect(() => {
    if (lightboxIdx === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIdx(null)
      if (e.key === "ArrowRight" && rows) {
        setLightboxIdx((i) => (i === null ? null : Math.min(rows.length - 1, i + 1)))
      }
      if (e.key === "ArrowLeft") {
        setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxIdx, rows])

  if (!open) return null

  const active = lightboxIdx !== null && rows ? rows[lightboxIdx] : null

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto"
      style={{ background: "var(--bg)" }}
    >
      {/* Header — sticky so it doesn't disappear when scrolling the grid */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <Camera size={16} style={{ color: "var(--accent)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
            Badge Gallery
            {rows && rows.length > 0 && (
              <span className="ml-2 text-[12px] font-medium" style={{ color: "var(--text-muted)" }}>
                ({rows.length})
              </span>
            )}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close gallery"
          className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200 active:scale-[0.93]"
          style={{
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {rows === null && (
          <div className="flex items-center justify-center py-16" style={{ color: "var(--text-muted)" }}>
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Loading badge photos…</span>
          </div>
        )}

        {error && (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger)" }}
          >
            Couldn&apos;t load badges: {error}
          </div>
        )}

        {rows !== null && rows.length === 0 && !error && (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            <Camera size={48} className="mx-auto mb-3 opacity-40" />
            <div className="font-semibold text-base mb-1">No badge photos yet</div>
            <div className="text-sm">
              Scan a badge from the lead form to start the collection.
            </div>
          </div>
        )}

        {rows !== null && rows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {rows.map((r, i) => (
              <button
                key={r.id}
                onClick={() => setLightboxIdx(i)}
                className="rounded-xl overflow-hidden text-left cursor-pointer transition-all duration-200 active:scale-[0.97]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  padding: 0,
                }}
              >
                <div className="relative" style={{ background: "var(--surface-alt)" }}>
                  <img
                    src={r.badge_photo}
                    alt={`${r.name} badge`}
                    loading="lazy"
                    className="w-full h-32 object-cover"
                  />
                </div>
                <div className="px-2.5 py-2">
                  <div className="text-[12px] font-bold truncate" style={{ color: "var(--text)" }}>
                    {r.name}
                  </div>
                  {r.company && (
                    <div className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                      {r.company}
                    </div>
                  )}
                  {r.captured_by && (
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--accent)" }}>
                      {r.captured_by}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox overlay — full-screen single photo with prev/next */}
      {active && lightboxIdx !== null && rows && (
        <div
          className="fixed inset-0 z-[300] flex flex-col"
          style={{ background: "rgba(0,0,0,0.92)" }}
          onClick={() => setLightboxIdx(null)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3" style={{ color: "white" }}>
            <div className="text-[12px] opacity-80">
              {lightboxIdx + 1} / {rows.length}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIdx(null)
              }}
              aria-label="Close photo"
              className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Image — clicking outside the image (but inside the overlay) closes */}
          <div
            className="flex-1 flex items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active.badge_photo}
              alt={`${active.name} badge full size`}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
            />
          </div>

          {/* Caption */}
          <div className="px-6 pt-3 pb-2 text-center" style={{ color: "white" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-bold">{active.name}</div>
            {active.company && <div className="text-[13px] opacity-80 mt-0.5">{active.company}</div>}
            {active.captured_by && (
              <div className="text-[11px] opacity-60 mt-1">Captured by {active.captured_by}</div>
            )}
          </div>

          {/* Prev / next controls */}
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIdx((i) => (i === null ? null : Math.max(0, i - 1)))
              }}
              disabled={lightboxIdx === 0}
              aria-label="Previous badge"
              className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white" }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIdx((i) => (i === null ? null : Math.min(rows.length - 1, i + 1)))
              }}
              disabled={lightboxIdx === rows.length - 1}
              aria-label="Next badge"
              className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white" }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
