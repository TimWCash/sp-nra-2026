"use client"

import { useState, useRef, useEffect } from "react"
import { X, Flame, Sun, Snowflake, Camera, Trash2, User, ScanLine, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HeatLevel } from "./useLeads"

const TEAM_MEMBERS = ["Brian", "Rebecca", "Maria", "Steve", "Kelly", "Emily", "Ellis"] as const
// Primary: unified per-device user identity (SetupPage/SessionNotes also use this).
const USER_NAME_KEY = "sp_user_name"
// Legacy: older per-form storage. Kept as fallback for devices that picked
// here before SetupPage existed.
const CAPTURED_BY_KEY = "sp_nra_captured_by"

function getSavedCapturedBy(): string {
  if (typeof window === "undefined") return ""
  // Prefer the unified identity set by Setup/Notes so "who's logging this?"
  // auto-fills the moment the user opens the form. Removes the silent-fail
  // bug Brian hit during NRA 2026: tapping Save with capturedBy empty did
  // nothing visible because the validation indicator was at the top of
  // the form, well above the user's tap point.
  const unified = (localStorage.getItem(USER_NAME_KEY) || "").trim()
  if (unified && (TEAM_MEMBERS as readonly string[]).includes(unified)) return unified
  const legacy = (localStorage.getItem(CAPTURED_BY_KEY) || "").trim()
  return legacy
}

import type { Lead } from "./useLeads"

interface LeadFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; company: string; role: string; contact: string; notes: string; heat: HeatLevel; badgePhoto?: string; capturedBy: string }) => void
  existingLeads?: Lead[]
  /**
   * If provided, the form opens in EDIT mode — pre-fills every field from
   * the lead, changes the title + Save button label, and the caller's
   * onSave is treated as an update rather than a create.
   */
  editLead?: Lead | null
}

function resizeImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function LeadForm({ open, onClose, onSave, existingLeads = [], editLead }: LeadFormProps) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [contact, setContact] = useState("")
  const [notes, setNotes] = useState("")
  const [heat, setHeat] = useState<HeatLevel>("warm")
  const [nameError, setNameError] = useState(false)
  const [capturedByError, setCapturedByError] = useState(false)
  const [badgePhoto, setBadgePhoto] = useState<string | undefined>()
  const [capturedBy, setCapturedBy] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState("")
  const [scanSuccess, setScanSuccess] = useState(false)
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const detailsRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cardInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Hydrate state when the form opens. In CREATE mode: blank fields with
  // capturedBy auto-defaulted from sp_user_name. In EDIT mode: every field
  // populated from editLead so the user sees their existing values.
  useEffect(() => {
    if (!open) return
    if (editLead) {
      setName(editLead.name || "")
      setCompany(editLead.company || "")
      setRole(editLead.role || "")
      setContact(editLead.contact || "")
      setNotes(editLead.notes || "")
      setHeat(editLead.heat)
      setBadgePhoto(editLead.badgePhoto)
      // Pre-fill with the original capturer, but fall back to the device's
      // identity if the row was created before that field existed.
      setCapturedBy(editLead.capturedBy || getSavedCapturedBy())
    } else {
      setCapturedBy(getSavedCapturedBy())
    }
  }, [open, editLead])

  if (!open) return null

  function handleCapturedByChange(value: string) {
    setCapturedBy(value)
    localStorage.setItem(CAPTURED_BY_KEY, value)
  }

  function handleSave() {
    // Validate name first.
    if (!name.trim()) {
      setNameError(true)
      // Scroll the user back up so they SEE the name field highlighted.
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    // Validate capturedBy. Previously this set an error indicator at the top
    // of the form but the Save button is at the bottom — user tapped Save,
    // nothing visibly happened. Now we ALSO scroll to top so the highlighted
    // capturedBy row + "Required" label is in view.
    if (!capturedBy) {
      setCapturedByError(true)
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    onSave({ name: name.trim(), company: company.trim(), role: role.trim(), contact: contact.trim(), notes: notes.trim(), heat, badgePhoto, capturedBy })
    setName(""); setCompany(""); setRole(""); setContact(""); setNotes(""); setHeat("warm"); setNameError(false); setCapturedByError(false); setBadgePhoto(undefined); setScanError(""); setScanSuccess(false); setLinkedinUrl("")
    onClose()
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const resized = await resizeImage(file, 800)
    setBadgePhoto(resized)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleCardScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (cardInputRef.current) cardInputRef.current.value = ""

    setScanning(true)
    setScanError("")

    try {
      const resized = await resizeImage(file, 1200)
      // Save photo to display in the form
      setBadgePhoto(resized)
      // Strip the data:image/jpeg;base64, prefix
      const base64 = resized.split(",")[1]
      const mediaType = resized.split(";")[0].replace("data:", "")

      const res = await fetch("/api/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      })

      if (!res.ok) throw new Error("Scan failed")
      const data = await res.json()

      if (data.name) { setName(data.name); setNameError(false) }
      if (data.company) setCompany(data.company)
      if (data.title) setRole(data.title)
      if (data.email) setContact(data.email)
      else if (data.phone) setContact(data.phone)
      if (data.notes) setNotes(data.notes)
      if (data.linkedinSearchUrl) setLinkedinUrl(data.linkedinSearchUrl)
      setScanSuccess(true)
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch (err) {
      console.error("Scan error:", err)
      setScanError("Couldn't read card — try again or fill in manually")
    } finally {
      setScanning(false)
    }
  }

  const inputCls = "w-full rounded-lg text-[15px] px-3.5 py-3 mb-2.5 outline-none transition-all duration-200"

  return (
    <div ref={scrollContainerRef} className="fixed inset-0 z-[200] p-5 overflow-y-auto flex flex-col justify-center"
      style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-2xl p-5 w-full max-w-[480px] mx-auto"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
            {editLead ? "Edit Lead" : "New Lead"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>
          {editLead ? "Update any field and Save Changes." : "Scan a badge or card to auto-fill, or enter manually."}
        </p>

        {/* Captured By */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: capturedByError ? "var(--danger)" : "var(--text-muted)" }}>
            <User size={12} className="inline mr-1 -mt-0.5" />Who&apos;s logging this?
          </div>
          {capturedByError && <span className="text-[11px] font-semibold" style={{ color: "var(--danger)" }}>Required</span>}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {TEAM_MEMBERS.map((member) => (
            <button key={member} onClick={() => { handleCapturedByChange(member); setCapturedByError(false) }}
              className="px-3 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all duration-200"
              style={{
                background: capturedBy === member ? "var(--accent)" : "var(--surface-alt)",
                border: `1.5px solid ${capturedBy === member ? "var(--accent)" : "var(--border)"}`,
                color: capturedBy === member ? "var(--accent-fg)" : "var(--text-muted)",
              }}>
              {member}
            </button>
          ))}
        </div>

        {/* Scan Badge / Business Card */}
        <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Scan Badge or Card</div>
        {badgePhoto ? (
          <div className="relative mb-3 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <img src={badgePhoto} alt="Badge" className="w-full max-h-[200px] object-cover" />
            <button onClick={() => { setBadgePhoto(undefined); setScanSuccess(false); setLinkedinUrl("") }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "none" }}
              aria-label="Remove photo">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => cardInputRef.current?.click()}
            disabled={scanning}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 mb-3 font-bold text-[14px] cursor-pointer transition-all duration-200 active:scale-[0.98]"
            style={{
              background: "var(--accent)",
              color: "var(--accent-fg)",
              border: "none",
              opacity: scanning ? 0.7 : 1,
            }}>
            {scanning ? <Loader2 size={17} className="animate-spin" /> : <ScanLine size={17} />}
            {scanning ? "Reading..." : "Scan Badge or Business Card"}
          </button>
        )}
        <input ref={cardInputRef} type="file" accept="image/*" capture="environment"
          onChange={handleCardScan} className="hidden" aria-label="Scan badge or business card" />
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhoto} className="hidden" aria-label="Capture badge photo" />
        {scanError && (
          <p className="text-[12px] mb-2 text-center font-medium" style={{ color: "var(--danger)" }}>{scanError}</p>
        )}
        {scanSuccess && !scanError && (
          <p className="text-[12px] mb-1 text-center font-medium" style={{ color: "var(--success)" }}>✓ Scanned — review fields below</p>
        )}
        {linkedinUrl && (
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 mb-3 font-semibold text-[13px] no-underline transition-all duration-200 active:scale-[0.98]"
            style={{ background: "#0a66c2", color: "#fff", border: "none" }}>
            <span>🔗</span> Find on LinkedIn
          </a>
        )}

        <div ref={detailsRef} className="text-[11px] font-bold tracking-widest uppercase mb-2 mt-1" style={{ color: "var(--text-muted)" }}>Details</div>
        <input className={cn(inputCls, nameError && "ring-2 ring-[var(--danger)]")} placeholder="Name *" value={name}
          onChange={(e) => { setName(e.target.value); setNameError(false) }}
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
        <input className={inputCls} placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)}
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
        <input className={inputCls} placeholder="Role / Title" value={role} onChange={(e) => setRole(e.target.value)}
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
        <input className={inputCls} placeholder="Email or Phone" value={contact} onChange={(e) => setContact(e.target.value)} inputMode="email"
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
        <textarea className={cn(inputCls, "min-h-[72px] resize-none")} placeholder="Quick notes" value={notes} onChange={(e) => setNotes(e.target.value)}
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />

        <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Interest Level</div>
        <div className="flex gap-2 mb-4">
          {([
            { key: "hot" as const, label: "Hot", Icon: Flame, activeColor: "var(--danger)", activeBg: "var(--danger-light)" },
            { key: "warm" as const, label: "Warm", Icon: Sun, activeColor: "var(--amber)", activeBg: "var(--amber-light)" },
            { key: "cool" as const, label: "Cool", Icon: Snowflake, activeColor: "var(--accent)", activeBg: "var(--accent-light)" },
          ]).map((h) => (
            <button key={h.key} onClick={() => setHeat(h.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-all duration-200"
              style={{
                background: heat === h.key ? h.activeBg : "var(--surface-alt)",
                border: `1.5px solid ${heat === h.key ? h.activeColor : "var(--border)"}`,
                color: heat === h.key ? h.activeColor : "var(--text-muted)",
              }}>
              <h.Icon size={14} /> {h.label}
            </button>
          ))}
        </div>

        {/* Inline validation feedback at the user's tap location. The
            field-level errors above (red labels + "Required") were getting
            missed because they're at the TOP of the form and the user is
            looking at the Save button at the BOTTOM. This makes the missing
            field impossible to ignore. */}
        {(nameError || capturedByError) && (
          <div className="rounded-lg p-3 mb-2.5 text-[12px] font-semibold flex items-start gap-2"
            style={{ background: "var(--danger-light)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
            <span>⚠</span>
            <span>
              {nameError && capturedByError
                ? "Add the lead's name AND pick who's logging this (highlighted at the top)."
                : nameError
                  ? "Add the lead's name first (highlighted at the top)."
                  : "Pick who's logging this lead — at the top of the form."}
            </span>
          </div>
        )}
        <button onClick={handleSave}
          className="w-full rounded-lg text-[15px] font-bold py-3.5 cursor-pointer mb-2.5 transition-all duration-200 active:scale-[0.98]"
          style={{ background: "var(--accent)", color: "var(--accent-fg)", border: "none" }}>
          {editLead ? "Save Changes" : "Save Lead"}
        </button>
        <button onClick={onClose}
          className="w-full rounded-lg text-sm py-3 cursor-pointer"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
