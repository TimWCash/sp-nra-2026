/**
 * Booth shift sign-ups — small, shared, realtime.
 *
 * Each row says "teammate X is covering this day+shift slot." Two slots
 * per show day (morning + afternoon) so people who prefer mornings or who
 * were out late can self-assign accordingly.
 *
 * Day codes match the rest of the app (`sat`, `sun`, `mon`, `tue`).
 * Shift codes are `morning` (9:30–1pm) and `afternoon` (1pm–close).
 */
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export type ShiftDay = "sat" | "sun" | "mon" | "tue"
export type ShiftSlot = "morning" | "afternoon"

export type BoothShiftRow = {
  id: string
  day: ShiftDay
  shift: ShiftSlot
  team_member: string
  created_at: string
}

/** Composite key for indexing — "sat:morning", "mon:afternoon", etc. */
export function shiftKey(day: ShiftDay, slot: ShiftSlot): string {
  return `${day}:${slot}`
}

/**
 * Realtime map of shift-key → list of teammate names covering that slot.
 * Names ordered by sign-up time.
 */
export function useBoothShifts(): Map<string, string[]> {
  const [byShift, setByShift] = useState<Map<string, string[]>>(new Map())

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from("booth_shifts")
        .select("day, shift, team_member, created_at")
        .order("created_at", { ascending: true })
      if (cancelled || error || !data) return
      const next = new Map<string, string[]>()
      for (const row of data as Array<{ day: string; shift: string; team_member: string }>) {
        const name = (row.team_member || "").trim()
        if (!name) continue
        const key = `${row.day}:${row.shift}`
        const arr = next.get(key) || []
        if (!arr.includes(name)) arr.push(name)
        next.set(key, arr)
      }
      setByShift(next)
    }

    load()
    const channel = supabase
      .channel("booth_shifts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booth_shifts" },
        load,
      )
      .subscribe()
    return () => { cancelled = true; channel.unsubscribe() }
  }, [])

  return byShift
}

export async function addBoothShift(
  day: ShiftDay,
  slot: ShiftSlot,
  teamMember: string,
): Promise<boolean> {
  const name = teamMember.trim()
  if (!name) return false
  const { error } = await supabase
    .from("booth_shifts")
    .upsert({ day, shift: slot, team_member: name }, {
      onConflict: "day,shift,team_member",
      ignoreDuplicates: true,
    })
  return !error
}

export async function removeBoothShift(
  day: ShiftDay,
  slot: ShiftSlot,
  teamMember: string,
): Promise<boolean> {
  const name = teamMember.trim()
  if (!name) return false
  const { error } = await supabase
    .from("booth_shifts")
    .delete()
    .eq("day", day)
    .eq("shift", slot)
    .eq("team_member", name)
  return !error
}
