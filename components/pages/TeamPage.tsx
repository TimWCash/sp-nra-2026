"use client"

import { useState, useEffect } from "react"
import { Plane, Car, House, Pencil, Check, X, Plus, Trash2 } from "lucide-react"
import { team as defaultTeam } from "@/lib/data"

const FLIGHTS_KEY = "sp_flight_overrides"

interface FlightEntry { label: string; detail: string }
interface FlightOverrides { [name: string]: FlightEntry[] }

function loadOverrides(): FlightOverrides {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(FLIGHTS_KEY) || "{}") } catch { return {} }
}
function saveOverrides(o: FlightOverrides) {
  localStorage.setItem(FLIGHTS_KEY, JSON.stringify(o))
}

export function TeamPage() {
  const [overrides, setOverrides] = useState<FlightOverrides>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<FlightEntry[]>([])

  useEffect(() => { setOverrides(loadOverrides()) }, [])

  function startEdit(name: string, flights: FlightEntry[]) {
    setEditing(name)
    setDraft(flights.map((f) => ({ ...f })))
  }

  function saveDraft() {
    if (!editing) return
    const updated = { ...overrides, [editing]: draft.filter((f) => f.label.trim()) }
    setOverrides(updated)
    saveOverrides(updated)
    setEditing(null)
  }

  function cancelEdit() { setEditing(null) }

  function updateDraft(i: number, field: "label" | "detail", val: string) {
    const next = [...draft]
    next[i] = { ...next[i], [field]: val }
    setDraft(next)
  }

  function addFlight() { setDraft([...draft, { label: "✈️ ", detail: "" }]) }

  function removeFlight(i: number) { setDraft(draft.filter((_, idx) => idx !== i)) }

  const inputCls = "flex-1 rounded-lg text-[12px] px-2.5 py-1.5 outline-none min-w-0"
  const inputStyle = { background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Team</h1>

      {/* Airbnb Info */}
      <div className="rounded-xl p-3 mb-4 text-[13px]"
        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
        <House size={14} className="inline mr-1.5" />
        Airbnb: <strong>5-bed Pilsen Home</strong>, Chicago &middot; 5 beds &middot; 3.5 baths &middot; 10 guests &middot; &#11088; 4.61
      </div>

      <div className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
        Tap ✏️ to update your flight info. Changes save locally on your device.
      </div>

      {/* Person Cards */}
      <div className="space-y-2.5">
        {defaultTeam.map((person) => {
          const flights: FlightEntry[] = overrides[person.name] ?? person.flights ?? []
          const isEditing = editing === person.name

          return (
            <div key={person.name} className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-start gap-3.5">
                {person.photo ? (
                  <img src={person.photo} alt={person.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    style={{ border: "2px solid var(--border)" }} />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: "var(--accent-light)", color: "var(--accent)", border: "2px solid var(--accent)" }}>
                    {person.initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-[15px]" style={{ color: "var(--text)" }}>{person.name}</div>
                    {!isEditing ? (
                      <button onClick={() => startEdit(person.name, flights)}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg cursor-pointer border-0 transition-all active:scale-95"
                        style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
                        <Pencil size={11} /> Edit
                      </button>
                    ) : (
                      <div className="flex gap-1.5">
                        <button onClick={saveDraft}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg cursor-pointer border-0"
                          style={{ background: "var(--success-light)", color: "var(--success)" }}>
                          <Check size={11} /> Save
                        </button>
                        <button onClick={cancelEdit}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg cursor-pointer border-0"
                          style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* View mode */}
                  {!isEditing && (
                    <>
                      {flights.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
                          <Plane size={12} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                          <span className="font-medium">{f.label}</span>
                          <span style={{ color: "var(--text-muted)" }}>·</span>
                          <span className="truncate">{f.detail}</span>
                        </div>
                      ))}
                      {flights.length === 0 && (
                        <div className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>No flights added</div>
                      )}
                    </>
                  )}

                  {/* Edit mode */}
                  {isEditing && (
                    <div className="mt-2 space-y-2">
                      {draft.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <Plane size={12} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                          <input className={inputCls} style={inputStyle} placeholder="✈️ SFO → ORD"
                            value={f.label} onChange={(e) => updateDraft(i, "label", e.target.value)} />
                          <input className={inputCls} style={inputStyle} placeholder="May 15 · 9:30am"
                            value={f.detail} onChange={(e) => updateDraft(i, "detail", e.target.value)} />
                          <button onClick={() => removeFlight(i)}
                            className="cursor-pointer border-0 bg-transparent p-1 rounded"
                            style={{ color: "var(--danger)" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      <button onClick={addFlight}
                        className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer border-0 transition-all"
                        style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                        <Plus size={13} /> Add flight
                      </button>
                    </div>
                  )}

                  {/* Notes */}
                  {!isEditing && person.notes?.map((n, i) => (
                    <div key={i} className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {n.includes("Driving") ? <><Car size={12} className="inline mr-1" />{n}</> : <><House size={12} className="inline mr-1" />{n}</>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
