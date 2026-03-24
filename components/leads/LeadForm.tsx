"use client"

import { useState, useRef } from "react"
import { X, Flame, Sun, Snowflake, Camera, Image as ImageIcon, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HeatLevel } from "./useLeads"

interface LeadFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; company: string; role: string; contact: string; notes: string; heat: HeatLevel; badgePhoto?: string }) => void
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

export function LeadForm({ open, onClose, onSave }: LeadFormProps) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [contact, setContact] = useState("")
  const [notes, setNotes] = useState("")
  const [heat, setHeat] = useState<HeatLevel>("warm")
  const [nameError, setNameError] = useState(false)
  const [badgePhoto, setBadgePhoto] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  function handleSave() {
    if (!name.trim()) {
      setNameError(true)
      return
    }
    onSave({ name: name.trim(), company: company.trim(), role: role.trim(), contact: contact.trim(), notes: notes.trim(), heat, badgePhoto })
    setName(""); setCompany(""); setRole(""); setContact(""); setNotes(""); setHeat("warm"); setNameError(false); setBadgePhoto(undefined)
    onClose()
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const resized = await resizeImage(file, 800)
    setBadgePhoto(resized)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const inputCls = "w-full rounded-lg text-[15px] px-3.5 py-3 mb-2.5 outline-none transition-all duration-200"

  return (
    <div className="fixed inset-0 z-[200] p-5 overflow-y-auto flex flex-col justify-center"
      style={{ background: "rgba(28,52,64,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="rounded-2xl p-5 w-full max-w-[480px] mx-auto"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>New Lead</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>
        <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Fill in what you know - even just a name is fine.</p>

        {/* Badge Photo */}
        <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Badge Photo</div>
        {badgePhoto ? (
          <div className="relative mb-3 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <img src={badgePhoto} alt="Badge" className="w-full max-h-[200px] object-cover" />
            <button onClick={() => setBadgePhoto(undefined)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "none" }}
              aria-label="Remove photo">
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 rounded-lg py-4 mb-3 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            style={{ background: "var(--surface-alt)", border: "2px dashed var(--border-strong)", color: "var(--text-muted)" }}>
            <Camera size={18} />
            <span className="text-sm font-medium">Snap badge photo</span>
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhoto} className="hidden" aria-label="Capture badge photo" />

        <div className="text-[11px] font-bold tracking-widest uppercase mb-2 mt-1" style={{ color: "var(--text-muted)" }}>Details</div>
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

        <button onClick={handleSave}
          className="w-full rounded-lg text-[15px] font-bold py-3.5 cursor-pointer mb-2.5 transition-all duration-200 active:scale-[0.98]"
          style={{ background: "var(--accent)", color: "var(--accent-fg)", border: "none" }}>
          Save Lead
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
