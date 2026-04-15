"use client"

import { useState, useEffect } from "react"
import { Mic, Clock, Check, ChevronLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"

const days = [
  { key: "sat", label: "Sat", full: "Saturday, May 16" },
  { key: "sun", label: "Sun", full: "Sunday, May 17" },
  { key: "mon", label: "Mon", full: "Monday, May 18" },
  { key: "tue", label: "Tue", full: "Tuesday, May 19" },
]

const morningSlots = ["10:00", "10:15", "10:30", "10:45", "11:00", "11:15", "11:30", "11:45"]
const afternoonSlots = ["1:00", "1:15", "1:30", "1:45", "2:00", "2:15", "2:30", "2:45", "3:00", "3:15", "3:30", "3:45", "4:00", "4:15", "4:30"]
const tuesdaySlots = ["1:00", "1:15", "1:30", "1:45", "2:00", "2:15", "2:30"]

const totalSlotsPerDay: Record<string, number> = {
  sat: morningSlots.length + afternoonSlots.length,   // 23
  sun: morningSlots.length + afternoonSlots.length,   // 23
  mon: morningSlots.length + afternoonSlots.length,   // 23
  tue: morningSlots.length + tuesdaySlots.length,     // 15
}
const grandTotal = Object.values(totalSlotsPerDay).reduce((a, b) => a + b, 0) // 84

function getSlotsForDay(dayKey: string) {
  return [...morningSlots, ...(dayKey === "tue" ? tuesdaySlots : afternoonSlots)]
}

interface Booking {
  day: string
  time: string
  guest_name: string
  company: string
}

type Screen = "pick-slot" | "fill-form" | "success"

export default function BookPage() {
  const [activeDay, setActiveDay] = useState("sat")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [screen, setScreen] = useState<Screen>("pick-slot")
  const [selectedTime, setSelectedTime] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // form
  const [name, setName] = useState("")
  const [company, setCompany] = useState("")
  const [topic, setTopic] = useState("")
  const [contact, setContact] = useState("")
  const [nameError, setNameError] = useState(false)

  useEffect(() => {
    supabase.from("podcast_bookings").select("day,time,guest_name,company")
      .then(({ data }) => { if (data) setBookings(data) })

    const channel = supabase.channel("podcast_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "podcast_bookings" }, () => {
        supabase.from("podcast_bookings").select("day,time,guest_name,company")
          .then(({ data }) => { if (data) setBookings(data) })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  function isBooked(day: string, time: string) {
    return bookings.some((b) => b.day === day && b.time === time)
  }

  function pickSlot(time: string) {
    setSelectedTime(time)
    setName("")
    setCompany("")
    setTopic("")
    setContact("")
    setNameError(false)
    setScreen("fill-form")
  }

  async function handleSubmit() {
    if (!name.trim()) { setNameError(true); return }
    setSubmitting(true)
    const { error } = await supabase.from("podcast_bookings").insert({
      day: activeDay,
      time: selectedTime,
      guest_name: name.trim(),
      company: company.trim(),
      topic: topic.trim(),
      contact: contact.trim(),
    })
    setSubmitting(false)
    if (error) {
      if (error.code === "23505") {
        alert("That slot was just taken — pick another time.")
        setScreen("pick-slot")
        supabase.from("podcast_bookings").select("day,time,guest_name,company")
          .then(({ data }) => { if (data) setBookings(data) })
      } else {
        alert("Something went wrong. Try again.")
      }
      return
    }
    setScreen("success")
  }

  const inputCls = "w-full rounded-xl text-[15px] px-4 py-3.5 outline-none"
  const inputStyle = { background: "#f4f6f8", border: "1.5px solid #e2e8f0", color: "#1a2332" }

  // ── SUCCESS ──
  if (screen === "success") {
    const dayLabel = days.find((d) => d.key === activeDay)?.full
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12" style={{ background: "#f8fafb" }}>
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#e6f7f8" }}>
            <Check size={36} strokeWidth={2.5} color="#008493" />
          </div>
          <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#1a2332" }}>You&apos;re booked!</h1>
          <p className="text-[15px] mb-1" style={{ color: "#64748b" }}>
            <strong style={{ color: "#1a2332" }}>{dayLabel}</strong> at <strong style={{ color: "#1a2332" }}>{selectedTime}</strong>
          </p>
          <p className="text-[14px] mb-8" style={{ color: "#64748b" }}>
            Joy of Ops Podcast · Booth #7365 · McCormick Place
          </p>
          <div className="rounded-2xl p-4 text-left mb-6" style={{ background: "#fff", border: "1.5px solid #e2e8f0" }}>
            <div className="text-[12px] font-bold tracking-widest uppercase mb-3" style={{ color: "#94a3b8" }}>What to expect</div>
            <div className="space-y-2 text-[13px]" style={{ color: "#475569" }}>
              <p>🎙️ 15-minute recorded conversation at our booth</p>
              <p>📍 Swing by Booth #7365 right at your time slot</p>
              <p>🎧 Joy of Ops is a podcast for restaurant operators</p>
            </div>
          </div>
          <button
            onClick={() => { setScreen("pick-slot") }}
            className="text-[13px] font-semibold"
            style={{ color: "#008493", background: "transparent", border: "none", cursor: "pointer" }}>
            ← Book another slot
          </button>
        </div>
      </div>
    )
  }

  // ── FILL FORM ──
  if (screen === "fill-form") {
    const dayLabel = days.find((d) => d.key === activeDay)?.full
    return (
      <div className="min-h-screen px-5 py-8 max-w-sm mx-auto" style={{ background: "#f8fafb" }}>
        <button onClick={() => setScreen("pick-slot")}
          className="flex items-center gap-1 text-[13px] font-semibold mb-6 cursor-pointer border-0 bg-transparent"
          style={{ color: "#008493" }}>
          <ChevronLeft size={16} /> Back
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Mic size={18} color="#008493" />
          <span className="text-[12px] font-bold tracking-widest uppercase" style={{ color: "#008493" }}>Joy of Ops Podcast</span>
        </div>
        <h1 className="text-[22px] font-extrabold mb-1" style={{ color: "#1a2332" }}>Almost there</h1>
        <p className="text-[14px] mb-6" style={{ color: "#64748b" }}>
          {dayLabel} · {selectedTime} · 15 min · Booth #7365
        </p>

        <div className="space-y-3 mb-6">
          <div>
            <input
              className={inputCls}
              style={{ ...inputStyle, ...(nameError ? { borderColor: "#ef4444" } : {}) }}
              placeholder="Your name *"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(false) }}
              autoFocus
            />
            {nameError && <p className="text-[12px] mt-1 ml-1" style={{ color: "#ef4444" }}>Name is required</p>}
          </div>
          <input className={inputCls} style={inputStyle}
            placeholder="Company / restaurant"
            value={company} onChange={(e) => setCompany(e.target.value)} />
          <textarea
            className={inputCls}
            style={{ ...inputStyle, resize: "none", minHeight: "90px" }}
            placeholder="What do you want to talk about? (optional)"
            value={topic} onChange={(e) => setTopic(e.target.value)}
          />
          <input className={inputCls} style={inputStyle}
            placeholder="Email or phone (optional)"
            value={contact} onChange={(e) => setContact(e.target.value)}
            inputMode="email" />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-xl text-[16px] font-bold py-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
          style={{ background: submitting ? "#94a3b8" : "#008493", color: "#fff", border: "none" }}>
          {submitting ? "Booking…" : "Confirm Booking"}
        </button>
      </div>
    )
  }

  // ── PICK SLOT ──
  const afternoonList = activeDay === "tue" ? tuesdaySlots : afternoonSlots

  const bookedCount = bookings.length
  const remaining = grandTotal - bookedCount
  const pct = Math.round((bookedCount / grandTotal) * 100)

  function dayRemaining(dayKey: string) {
    const taken = bookings.filter((b) => b.day === dayKey).length
    return totalSlotsPerDay[dayKey] - taken
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-sm mx-auto" style={{ background: "#f8fafb" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Mic size={18} color="#008493" />
        <span className="text-[12px] font-bold tracking-widest uppercase" style={{ color: "#008493" }}>Joy of Ops Podcast</span>
      </div>
      <h1 className="text-[22px] font-extrabold mb-1" style={{ color: "#1a2332" }}>Book a Podcast Slot</h1>
      <p className="text-[14px] mb-4" style={{ color: "#64748b" }}>
        NRA Show 2026 · Booth #7365 · McCormick Place · 15 min sessions
      </p>

      {/* Slots remaining counter */}
      <div className="rounded-2xl p-4 mb-5" style={{ background: "#fff", border: "1.5px solid #e2e8f0" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-bold" style={{ color: "#1a2332" }}>
            {remaining} of {grandTotal} slots available
          </span>
          <span className="text-[12px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: remaining < 20 ? "#fef3c7" : "#e6f7f8", color: remaining < 20 ? "#d97706" : "#008493" }}>
            {pct}% booked
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: remaining < 20 ? "#f59e0b" : "#008493" }} />
        </div>
      </div>

      {/* Day tabs with per-day remaining */}
      <div className="flex gap-2 mb-6">
        {days.map((d) => {
          const left = dayRemaining(d.key)
          return (
            <button key={d.key} onClick={() => setActiveDay(d.key)}
              className="flex-1 rounded-xl py-2 text-center cursor-pointer transition-all duration-200"
              style={{
                background: activeDay === d.key ? "#008493" : "#fff",
                border: activeDay === d.key ? "1.5px solid #008493" : "1.5px solid #e2e8f0",
              }}>
              <div className="text-[13px] font-bold" style={{ color: activeDay === d.key ? "#fff" : "#64748b" }}>{d.label}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: activeDay === d.key ? "rgba(255,255,255,0.75)" : "#94a3b8" }}>
                {left} left
              </div>
            </button>
          )
        })}
      </div>

      {/* Morning */}
      <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>Morning</div>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {morningSlots.map((time) => {
          const booked = isBooked(activeDay, time)
          return (
            <button key={time} onClick={() => !booked && pickSlot(time)}
              disabled={booked}
              className="rounded-xl p-3.5 text-left transition-all duration-200"
              style={{
                background: booked ? "#f1f5f9" : "#fff",
                border: booked ? "1.5px solid #e2e8f0" : "1.5px solid #008493",
                cursor: booked ? "not-allowed" : "pointer",
                opacity: booked ? 0.5 : 1,
              }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={11} color={booked ? "#94a3b8" : "#008493"} />
                <span className="text-[12px] font-bold" style={{ color: booked ? "#94a3b8" : "#008493" }}>{time}</span>
              </div>
              <div className="text-[13px] font-semibold" style={{ color: booked ? "#94a3b8" : "#1a2332" }}>
                {booked ? "Taken" : "Available"}
              </div>
            </button>
          )
        })}
      </div>

      {/* Afternoon */}
      <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>Afternoon</div>
      <div className="grid grid-cols-2 gap-2">
        {afternoonList.map((time) => {
          const booked = isBooked(activeDay, time)
          return (
            <button key={time} onClick={() => !booked && pickSlot(time)}
              disabled={booked}
              className="rounded-xl p-3.5 text-left transition-all duration-200"
              style={{
                background: booked ? "#f1f5f9" : "#fff",
                border: booked ? "1.5px solid #e2e8f0" : "1.5px solid #008493",
                cursor: booked ? "not-allowed" : "pointer",
                opacity: booked ? 0.5 : 1,
              }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <Clock size={11} color={booked ? "#94a3b8" : "#008493"} />
                <span className="text-[12px] font-bold" style={{ color: booked ? "#94a3b8" : "#008493" }}>{time}</span>
              </div>
              <div className="text-[13px] font-semibold" style={{ color: booked ? "#94a3b8" : "#1a2332" }}>
                {booked ? "Taken" : "Available"}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
