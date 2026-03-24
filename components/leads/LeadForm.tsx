"use client"

import { useState } from "react"
import { X, Flame, Sun, Snowflake } from "lucide-react"
import { cn } from "@/lib/utils"
import type { HeatLevel } from "./useLeads"

interface LeadFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; company: string; role: string; contact: string; notes: string; heat: HeatLevel }) => void
}

export function LeadForm({ open, onClose, onSave }: LeadFormProps) {
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [contact, setContact] = useState("")
  const [notes, setNotes] = useState("")
  const [heat, setHeat] = useState<HeatLevel>("warm")
  const [nameError, setNameError] = useState(false)

  if (!open) return null

  function handleSave() {
    if (!name.trim()) {
      setNameError(true)
      return
    }
    onSave({ name: name.trim(), company: company.trim(), role: role.trim(), contact: contact.trim(), notes: notes.trim(), heat })
    setName(""); setCompany(""); setRole(""); setContact(""); setNotes(""); setHeat("warm"); setNameError(false)
    onClose()
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

        <input className={cn(inputCls, nameError && "ring-2 ring-[var(--danger)]")} placeholder="Name *" value={name}
          onChange={(e) => { setName(e.target.value); setNameError(false) }} autoFocus
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
