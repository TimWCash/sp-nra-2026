"use client"

import { useState } from "react"
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

  const inputCls = "w-full bg-sp-surface2 border border-sp-border rounded-[10px] text-sp-text font-body text-[15px] px-3.5 py-3 mb-2.5 outline-none transition-colors focus:border-sp-teal placeholder:text-sp-muted"

  return (
    <div className="fixed inset-0 z-[200] bg-[#0b1a22ee] backdrop-blur-lg p-5 overflow-y-auto flex flex-col justify-center">
      <div className="bg-sp-surface border border-sp-border rounded-2xl p-5 w-full max-w-[480px] mx-auto">
        <div className="font-display text-[28px] tracking-wider mb-1">New Lead</div>
        <div className="text-sp-muted text-[13px] mb-4">Fill in what you know — even just a name is fine.</div>

        <input className={cn(inputCls, nameError && "border-sp-red")} placeholder="Name *" value={name} onChange={(e) => { setName(e.target.value); setNameError(false) }} autoFocus />
        <input className={inputCls} placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input className={inputCls} placeholder="Role / Title" value={role} onChange={(e) => setRole(e.target.value)} />
        <input className={inputCls} placeholder="Email or Phone" value={contact} onChange={(e) => setContact(e.target.value)} inputMode="email" />
        <textarea className={cn(inputCls, "min-h-[72px] resize-none")} placeholder="Quick notes \u2014 what did you talk about?" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-sp-muted mb-2">Interest Level</div>
        <div className="flex gap-2 mb-3.5">
          {(["hot", "warm", "cool"] as const).map((h) => (
            <button
              key={h}
              onClick={() => setHeat(h)}
              className={cn(
                "flex-1 py-2.5 px-1.5 bg-sp-surface2 border-[1.5px] border-sp-border rounded-[10px] text-sp-muted font-body text-[13px] font-semibold cursor-pointer text-center transition-all",
                heat === h && h === "hot" && "bg-sp-red/10 border-sp-red text-sp-red",
                heat === h && h === "warm" && "bg-sp-amber/10 border-sp-amber text-sp-amber",
                heat === h && h === "cool" && "bg-sp-teal/10 border-sp-teal text-sp-teal",
              )}
            >
              {h === "hot" ? "Hot" : h === "warm" ? "Warm" : "Cool"}
            </button>
          ))}
        </div>

        <button onClick={handleSave} className="w-full bg-gradient-to-r from-sp-teal to-sp-teal-dim border-none rounded-[10px] text-[#0b1a22] font-body text-[15px] font-bold py-3.5 cursor-pointer mb-2.5 transition-opacity active:opacity-85">
          Save Lead
        </button>
        <button onClick={onClose} className="w-full bg-transparent border border-sp-border rounded-[10px] text-sp-muted font-body text-sm py-3 cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  )
}
