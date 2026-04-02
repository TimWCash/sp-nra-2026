"use client"

import { useState, useEffect } from "react"
import { Mic, X, Clock, User, Building2, MessageSquare, Phone, Trash2 } from "lucide-react"

interface PodcastSlot {
  id: string
  day: string
  time: string
  guestName: string
  company: string
  topic: string
  contact: string
}

const STORAGE_KEY = "sp_podcast_slots"

const days = [
  { key: "sat", label: "Sat May 16" },
  { key: "sun", label: "Sun May 17" },
  { key: "mon", label: "Mon May 18" },
  { key: "tue", label: "Tue May 19" },
]

const morningSlots = ["10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45"]
const afternoonSlots = ["1:00", "1:15", "1:30", "1:45", "2:00", "2:15", "2:30", "2:45", "3:00", "3:15", "3:30", "3:45", "4:00", "4:15", "4:30"]
const tuesdayAfternoonSlots = ["1:00", "1:15", "1:30", "1:45", "2:00", "2:15", "2:30"]

function getSlotsForDay(dayKey: string) {
  const afternoon = dayKey === "tue" ? tuesdayAfternoonSlots : afternoonSlots
  return [...morningSlots, ...afternoon]
}

function loadSlots(): PodcastSlot[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch { return [] }
}

function saveSlots(slots: PodcastSlot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots))
}

export function PodcastPage() {
  const [slots, setSlots] = useState<PodcastSlot[]>([])
  const [activeDay, setActiveDay] = useState("sat")
  const [formOpen, setFormOpen] = useState(false)
  const [formTime, setFormTime] = useState("")
  const [detailSlot, setDetailSlot] = useState<PodcastSlot | null>(null)

  // form fields
  const [guestName, setGuestName] = useState("")
  const [company, setCompany] = useState("")
  const [topic, setTopic] = useState("")
  const [contact, setContact] = useState("")
  const [nameError, setNameError] = useState(false)

  useEffect(() => { setSlots(loadSlots()) }, [])

  function getBooking(day: string, time: string) {
    return slots.find((s) => s.day === day && s.time === time)
  }

  function openBookingForm(time: string) {
    setFormTime(time)
    setGuestName("")
    setCompany("")
    setTopic("")
    setContact("")
    setNameError(false)
    setFormOpen(true)
  }

  function handleSave() {
    if (!guestName.trim()) { setNameError(true); return }
    const newSlot: PodcastSlot = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      day: activeDay,
      time: formTime,
      guestName: guestName.trim(),
      company: company.trim(),
      topic: topic.trim(),
      contact: contact.trim(),
    }
    const updated = [...slots, newSlot]
    setSlots(updated)
    saveSlots(updated)
    setFormOpen(false)
  }

  function handleCancel(id: string) {
    if (!confirm("Cancel this podcast booking?")) return
    const updated = slots.filter((s) => s.id !== id)
    setSlots(updated)
    saveSlots(updated)
    setDetailSlot(null)
  }

  const daySlots = getSlotsForDay(activeDay)
  const inputCls = "w-full rounded-lg text-[15px] px-3.5 py-3 mb-2.5 outline-none transition-all duration-200"

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Podcast Schedule</h1>

      {/* Info alert */}
      <div className="rounded-xl p-3 mb-5 flex gap-2.5 items-start text-[13px]"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <Mic size={15} className="flex-shrink-0 mt-0.5" />
        <span>Joy of Ops is recording live at Booth #7365. Book guests for 15-minute sessions.</span>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {days.map((d) => (
          <button key={d.key} onClick={() => setActiveDay(d.key)}
            className="flex-1 min-w-0 rounded-lg text-[13px] font-semibold py-2.5 px-2 cursor-pointer transition-all duration-200 text-center whitespace-nowrap"
            style={{
              background: activeDay === d.key ? "var(--accent)" : "var(--surface)",
              color: activeDay === d.key ? "var(--accent-fg)" : "var(--text-muted)",
              border: activeDay === d.key ? "1px solid var(--accent)" : "1px solid var(--border)",
            }}>
            {d.label}
          </button>
        ))}
      </div>

      {/* Time slot grid */}
      <SectionLabel>Morning</SectionLabel>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {morningSlots.map((time) => {
          const booking = getBooking(activeDay, time)
          return (
            <SlotButton key={time} time={time} booking={booking}
              onBook={() => openBookingForm(time)} onTap={() => booking && setDetailSlot(booking)} />
          )
        })}
      </div>

      <SectionLabel>Afternoon</SectionLabel>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(activeDay === "tue" ? tuesdayAfternoonSlots : afternoonSlots).map((time) => {
          const booking = getBooking(activeDay, time)
          return (
            <SlotButton key={time} time={time} booking={booking}
              onBook={() => openBookingForm(time)} onTap={() => booking && setDetailSlot(booking)} />
          )
        })}
      </div>

      {/* Booking form overlay */}
      {formOpen && (
        <div className="fixed inset-0 z-[200] p-5 overflow-y-auto flex flex-col justify-center"
          style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-2xl p-5 w-full max-w-[480px] mx-auto"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Book Guest</h2>
              <button onClick={() => setFormOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>
              {days.find((d) => d.key === activeDay)?.label} at {formTime} &middot; 15 min session
            </p>

            <input className={`${inputCls} ${nameError ? "ring-2 ring-[var(--danger)]" : ""}`}
              placeholder="Guest Name *" value={guestName}
              onChange={(e) => { setGuestName(e.target.value); setNameError(false) }}
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <input className={inputCls} placeholder="Company" value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <input className={inputCls} placeholder="Topic / Talking Points" value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />
            <input className={inputCls} placeholder="Email or Phone" value={contact}
              onChange={(e) => setContact(e.target.value)} inputMode="email"
              style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }} />

            <button onClick={handleSave}
              className="w-full rounded-lg text-[15px] font-bold py-3.5 cursor-pointer mb-2.5 transition-all duration-200 active:scale-[0.98]"
              style={{ background: "var(--accent)", color: "var(--accent-fg)", border: "none" }}>
              Book Slot
            </button>
            <button onClick={() => setFormOpen(false)}
              className="w-full rounded-lg text-sm py-3 cursor-pointer"
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Detail overlay */}
      {detailSlot && (
        <div className="fixed inset-0 z-[200] p-5 overflow-y-auto flex flex-col justify-center"
          style={{ background: "var(--overlay)", backdropFilter: "blur(8px)" }}
          onClick={() => setDetailSlot(null)}>
          <div className="rounded-2xl p-5 w-full max-w-[480px] mx-auto"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Guest Details</h2>
              <button onClick={() => setDetailSlot(null)} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
              <div className="flex items-center gap-2.5">
                <Clock size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                <span><strong style={{ color: "var(--text)" }}>{days.find((d) => d.key === detailSlot.day)?.label}</strong> at {detailSlot.time}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <User size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                <span style={{ color: "var(--text)" }}>{detailSlot.guestName}</span>
              </div>
              {detailSlot.company && (
                <div className="flex items-center gap-2.5">
                  <Building2 size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span>{detailSlot.company}</span>
                </div>
              )}
              {detailSlot.topic && (
                <div className="flex items-center gap-2.5">
                  <MessageSquare size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span>{detailSlot.topic}</span>
                </div>
              )}
              {detailSlot.contact && (
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                  <span>{detailSlot.contact}</span>
                </div>
              )}
            </div>

            <button onClick={() => handleCancel(detailSlot.id)}
              className="w-full rounded-lg text-sm font-semibold py-3 cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.98]"
              style={{ background: "var(--danger-light)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
              <Trash2 size={14} /> Cancel Booking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SlotButton({ time, booking, onBook, onTap }: {
  time: string
  booking?: PodcastSlot
  onBook: () => void
  onTap: () => void
}) {
  if (booking) {
    return (
      <button onClick={onTap}
        className="rounded-xl p-3 text-left cursor-pointer transition-all duration-200 active:scale-[0.98]"
        style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
        <div className="text-[11px] font-bold mb-1" style={{ color: "var(--accent)" }}>{time}</div>
        <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{booking.guestName}</div>
        {booking.company && <div className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{booking.company}</div>}
      </button>
    )
  }
  return (
    <button onClick={onBook}
      className="rounded-xl p-3 text-left cursor-pointer transition-all duration-200 active:scale-[0.98]"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="text-[11px] font-bold mb-1" style={{ color: "var(--text-muted)" }}>{time}</div>
      <div className="text-sm font-medium" style={{ color: "var(--accent)" }}>Available</div>
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>{children}</div>
}
