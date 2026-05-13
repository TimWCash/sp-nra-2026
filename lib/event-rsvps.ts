/**
 * After-hours event RSVPs — small, shared, realtime.
 *
 * Lets a teammate tap "I'm going" on any event card. The whole team sees
 * who's going to what, so for overlapping events on the same night you can
 * divide-and-conquer without a Slack thread.
 *
 * One row per (event_id, team_member). Unique constraint enforces idempotency
 * (taps after the first do nothing). Anon can SELECT/INSERT/DELETE on this
 * table — it's intentionally low-stakes, recoverable inconvenience if
 * someone deletes a row.
 */
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export type EventRsvp = {
  event_id: string
  team_member: string
  created_at: string
}

/**
 * Realtime map from event id → list of teammate names who've RSVP'd.
 * Names are in the order rows were inserted.
 */
export function useEventRsvps(): Map<string, string[]> {
  const [byEvent, setByEvent] = useState<Map<string, string[]>>(new Map())

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase
        .from("event_rsvps")
        .select("event_id, team_member, created_at")
        .order("created_at", { ascending: true })
      if (cancelled || error || !data) return
      const next = new Map<string, string[]>()
      for (const row of data as EventRsvp[]) {
        const name = (row.team_member || "").trim()
        if (!name) continue
        const arr = next.get(row.event_id) || []
        if (!arr.includes(name)) arr.push(name)
        next.set(row.event_id, arr)
      }
      setByEvent(next)
    }

    load()
    const channel = supabase
      .channel("event_rsvps_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_rsvps" },
        load,
      )
      .subscribe()
    return () => { cancelled = true; channel.unsubscribe() }
  }, [])

  return byEvent
}

export async function addRsvp(eventId: string, teamMember: string): Promise<boolean> {
  const name = teamMember.trim()
  if (!name) return false
  // ignoreDuplicates so a double-tap doesn't error; RLS handles auth side.
  const { error } = await supabase
    .from("event_rsvps")
    .upsert({ event_id: eventId, team_member: name }, {
      onConflict: "event_id,team_member",
      ignoreDuplicates: true,
    })
  return !error
}

export async function removeRsvp(eventId: string, teamMember: string): Promise<boolean> {
  const name = teamMember.trim()
  if (!name) return false
  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("team_member", name)
  return !error
}
