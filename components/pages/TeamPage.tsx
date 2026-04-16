"use client"

import { useState, useEffect } from "react"
import { Plane, Car, House, Hotel, Pencil, Check, X, Plus, Trash2 } from "lucide-react"
import { team as defaultTeam } from "@/lib/data"

const FLIGHTS_KEY = "sp_flight_overrides"
const ACCOMMODATION_KEY = "sp_accommodation_overrides"

interface FlightEntry { label: string; detail: string }
interface FlightOverrides { [name: string]: FlightEntry[] }
interface AccommodationOverrides { [name: string]: string }

function loadFlightOverrides(): FlightOverrides {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(FLIGHTS_KEY) || "{}") } catch { return {} }
}
function saveFlightOverrides(o: FlightOverrides) {
  localStorage.setItem(FLIGHTS_KEY, JSON.stringify(o))
}
function loadAccommodationOverrides(): AccommodationOverrides {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(ACCOMMODATION_KEY) || "{}") } catch { return {} }
}
function saveAccommodationOverrides(o: AccommodationOverrides) {
  localStorage.setItem(ACCOMMODATION_KEY, JSON.stringify(o))
}

// Quick-pick presets for the accommodation field
const ACCOMMODATION_PRESETS = [
  "🏨 Hilton Garden Inn Chicago Downtown/Magnificent Mile",
  "🏠 Airbnb — Pilsen Home",
]

function accommodationIcon(value: string) {
  if (/airbnb|house|home/i.test(value)) return <House size={12} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
  return <Hotel size={12} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
}

export function TeamPage() {
  const [flightOverrides, setFlightOverrides] = useState<FlightOverrides>({})
  const [accommodationOverrides, setAccommodationOverrides] = useState<AccommodationOverrides>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [draftFlights, setDraftFlights] = useState<FlightEntry[]>([])
  const [draftAccommodation, setDraftAccommodation] = useState<string>("")

  useEffect(() => {
    setFlightOverrides(loadFlightOverrides())
    setAccommodationOverrides(loadAccommodationOverrides())
  }, [])

  function startEdit(name: string, flights: FlightEntry[], accommodation: string) {
    setEditing(name)
    setDraftFlights(flights.map((f) => ({ ...f })))
    setDraftAccommodation(accommodation)
  }

  function saveDraft() {
    if (!editing) return
    const updatedFlights = { ...flightOverrides, [editing]: draftFlights.filter((f) => f.label.trim()) }
    setFlightOverrides(updatedFlights)
    saveFlightOverrides(updatedFlights)

    const updatedAccommodation = { ...accommodationOverrides, [editing]: draftAccommodation.trim() }
    setAccommodationOverrides(updatedAccommodation)
    saveAccommodationOverrides(updatedAccommodation)

    setEditing(null)
  }

  function cancelEdit() { setEditing(null) }

  function updateDraft(i: number, field: "label" | "detail", val: string) {
    const next = [...draftFlights]
    next[i] = { ...next[i], [field]: val }
    setDraftFlights(next)
  }

  function addFlight() { setDraftFlights([...draftFlights, { label: "✈️ ", detail: "" }]) }

  function removeFlight(i: number) { setDraftFlights(draftFlights.filter((_, idx) => idx !== i)) }

  const inputCls = "flex-1 rounded-lg text-[12px] px-2.5 py-1.5 outline-none min-w-0"
  const inputStyle = { background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Team</h1>

      <div className="text-[11px] mb-3" style={{ color: "var(--text-muted)" }}>
        Tap ✏️ to update your flights or accommodation. Changes save locally on your device.
      </div>

      {/* Person Cards */}
      <div className="space-y-2.5">
        {defaultTeam.map((person) => {
          const flights: FlightEntry[] = flightOverrides[person.name] ?? person.flights ?? []
          const accommodation: string =
            person.name in accommodationOverrides
              ? accommodationOverrides[person.name]
              : person.accommodation ?? ""
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
                      <button onClick={() => startEdit(person.name, flights, accommodation)}
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
                      {accommodation && (
                        <div className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
                          {accommodationIcon(accommodation)}
                          <span className="truncate">{accommodation}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Edit mode */}
                  {isEditing && (
                    <div className="mt-2 space-y-2">
                      {draftFlights.map((f, i) => (
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

                      {/* Accommodation editor */}
                      <div className="pt-2 mt-1" style={{ borderTop: "1px dashed var(--border)" }}>
                        <div className="flex items-center gap-1.5">
                          <Hotel size={12} className="flex-shrink-0" style={{ color: "var(--accent)" }} />
                          <input className={inputCls} style={inputStyle}
                            placeholder="🏨 Hotel or 🏠 Airbnb"
                            value={draftAccommodation}
                            onChange={(e) => setDraftAccommodation(e.target.value)} />
                          {draftAccommodation && (
                            <button onClick={() => setDraftAccommodation("")}
                              className="cursor-pointer border-0 bg-transparent p-1 rounded"
                              style={{ color: "var(--danger)" }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {ACCOMMODATION_PRESETS.map((preset) => (
                            <button key={preset} onClick={() => setDraftAccommodation(preset)}
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg cursor-pointer border-0 transition-all active:scale-95"
                              style={{ background: "var(--surface-alt)", color: "var(--text-secondary)" }}>
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes (non-accommodation, e.g. transport) */}
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
