"use client"

import { useState, useEffect, useCallback } from "react"
import { Plane, Car, House, Hotel, Pencil, Check, X, Plus, Trash2, Loader2 } from "lucide-react"
import { team as defaultTeam } from "@/lib/data"
import { supabase } from "@/lib/supabase"

// Legacy localStorage keys. We migrate them up to Supabase on first load, then
// drop them so the same client doesn't keep pushing stale state back.
const FLIGHTS_KEY = "sp_flight_overrides"
const ACCOMMODATION_KEY = "sp_accommodation_overrides"
const MIGRATED_KEY = "sp_travel_migrated_to_supabase"

interface FlightEntry { label: string; detail: string }
interface FlightOverrides { [name: string]: FlightEntry[] }
interface AccommodationOverrides { [name: string]: string }

interface TravelRow {
  name: string
  flights: FlightEntry[]
  accommodation: string
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

function normalizeFlights(raw: unknown): FlightEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((f): f is FlightEntry =>
      typeof f === "object" && f !== null &&
      typeof (f as FlightEntry).label === "string" &&
      typeof (f as FlightEntry).detail === "string"
    )
    .map((f) => ({ label: f.label, detail: f.detail }))
}

export function TeamPage() {
  const [flightOverrides, setFlightOverrides] = useState<FlightOverrides>({})
  const [accommodationOverrides, setAccommodationOverrides] = useState<AccommodationOverrides>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [draftFlights, setDraftFlights] = useState<FlightEntry[]>([])
  const [draftAccommodation, setDraftAccommodation] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const applyRows = useCallback((rows: TravelRow[]) => {
    const nextFlights: FlightOverrides = {}
    const nextAccommodation: AccommodationOverrides = {}
    for (const row of rows) {
      nextFlights[row.name] = row.flights
      nextAccommodation[row.name] = row.accommodation
    }
    setFlightOverrides(nextFlights)
    setAccommodationOverrides(nextAccommodation)
  }, [])

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase.from("team_travel").select("name, flights, accommodation")
    if (error || !data) return
    applyRows(data.map((r) => ({
      name: r.name as string,
      flights: normalizeFlights(r.flights),
      accommodation: (r.accommodation as string) ?? "",
    })))
  }, [applyRows])

  // One-time migration: push any localStorage overrides up to Supabase.
  useEffect(() => {
    const migrate = async () => {
      if (typeof window === "undefined") return
      if (localStorage.getItem(MIGRATED_KEY) === "1") return

      let flights: FlightOverrides = {}
      let accommodation: AccommodationOverrides = {}
      try { flights = JSON.parse(localStorage.getItem(FLIGHTS_KEY) || "{}") } catch { /* ignore */ }
      try { accommodation = JSON.parse(localStorage.getItem(ACCOMMODATION_KEY) || "{}") } catch { /* ignore */ }

      const names = new Set([...Object.keys(flights), ...Object.keys(accommodation)])
      if (names.size > 0) {
        const rows = Array.from(names).map((name) => ({
          name,
          flights: flights[name] ?? [],
          accommodation: accommodation[name] ?? "",
        }))
        // Upsert so we don't clobber edits another device already pushed.
        await supabase.from("team_travel").upsert(rows, { onConflict: "name", ignoreDuplicates: false })
      }

      localStorage.setItem(MIGRATED_KEY, "1")
      // Keep the old keys around as a backup — readable via devtools if needed.
    }
    migrate().then(fetchAll)
  }, [fetchAll])

  // Subscribe to realtime updates so other devices' edits flow in.
  useEffect(() => {
    const channel = supabase
      .channel("team_travel_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_travel" }, fetchAll)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  function startEdit(name: string, flights: FlightEntry[], accommodation: string) {
    setEditing(name)
    setDraftFlights(flights.map((f) => ({ ...f })))
    setDraftAccommodation(accommodation)
  }

  async function saveDraft() {
    if (!editing || saving) return
    setSaving(true)
    const cleanedFlights = draftFlights.filter((f) => f.label.trim())
    const cleanedAccommodation = draftAccommodation.trim()

    // Optimistic update — flip local state now, realtime will reconcile.
    setFlightOverrides((prev) => ({ ...prev, [editing]: cleanedFlights }))
    setAccommodationOverrides((prev) => ({ ...prev, [editing]: cleanedAccommodation }))

    try {
      await supabase.from("team_travel").upsert(
        {
          name: editing,
          flights: cleanedFlights,
          accommodation: cleanedAccommodation,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "name" }
      )
      setEditing(null)
    } catch (err) {
      console.error("Save travel error:", err)
      alert("Could not save — check your connection and try again.")
    } finally {
      setSaving(false)
    }
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
        Tap ✏️ to update flights or accommodation. Changes sync to the whole team in real time.
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
                        <button onClick={saveDraft} disabled={saving}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg cursor-pointer border-0 disabled:opacity-60 disabled:cursor-wait"
                          style={{ background: "var(--success-light)", color: "var(--success)" }}>
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                          {saving ? "Saving" : "Save"}
                        </button>
                        <button onClick={cancelEdit} disabled={saving}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg cursor-pointer border-0 disabled:opacity-60"
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
