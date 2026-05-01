/**
 * Offline durability for session notes — same pattern as lib/leads-offline.ts.
 *
 * Without this, a teammate jotting down a quote from a session at McCormick
 * could lose it: the existing flow inserts straight into Supabase and the
 * insert silently no-ops when the device has no service.
 *
 * This module gives us:
 *   - A local cache of all notes the device has seen, so the list still
 *     renders offline.
 *   - A pending-writes queue (localStorage) for notes captured offline,
 *     keyed by client-generated UUID so retries are idempotent.
 *   - A flush routine that drains the queue when the device reconnects.
 *
 * The cache is global (all sessions), filtered per-session on read by the
 * SessionNotes component.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

const CACHE_KEY = "sp_notes_cache"
const PENDING_KEY = "sp_notes_pending"
const SYNC_LOCK_KEY = "sp_notes_sync_lock"
const SYNC_LOCK_TTL_MS = 30_000

export type Result<T = void> = { ok: true; value?: T } | { ok: false; error: string }

export type Note = {
  id: string
  session_title: string
  session_day: string
  author: string
  content: string
  created_at: string
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

// ── Local cache of last-known server state ────────────────────────────────

export function cacheNotes(notes: Note[]): Result {
  if (typeof window === "undefined") return { ok: false, error: "SSR" }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(notes))
    return { ok: true }
  } catch {
    return { ok: false, error: "Local cache full." }
  }
}

export function loadCachedNotes(): Note[] {
  if (typeof window === "undefined") return []
  return safeParse<Note[]>(localStorage.getItem(CACHE_KEY), [])
}

// ── Flush lock ────────────────────────────────────────────────────────────

function acquireLock(): boolean {
  if (typeof window === "undefined") return false
  const raw = localStorage.getItem(SYNC_LOCK_KEY)
  if (raw) {
    const heldAt = parseInt(raw, 10)
    if (!Number.isNaN(heldAt) && Date.now() - heldAt < SYNC_LOCK_TTL_MS) return false
  }
  try { localStorage.setItem(SYNC_LOCK_KEY, String(Date.now())); return true } catch { return false }
}

function releaseLock(): void {
  try { localStorage.removeItem(SYNC_LOCK_KEY) } catch { /* ignore */ }
}

/**
 * Merge fresh server rows into the cache without dropping any cache-only
 * (still-pending) notes, then save and return the merged set.
 */
export function mergeAndCacheNotes(serverRows: Note[]): Note[] {
  const serverIds = new Set(serverRows.map((n) => n.id))
  const cacheOnly = loadCachedNotes().filter((n) => !serverIds.has(n.id))
  const pendingIds = new Set(getPendingNotes().map((p) => p.id))
  // Keep cache-only notes that are still in the pending queue. (Cache-only
  // notes that were never queued are stale orphans — drop them.)
  const stillRelevant = cacheOnly.filter((n) => pendingIds.has(n.id))
  const merged = [...stillRelevant, ...serverRows]
  cacheNotes(merged)
  return merged
}

// ── Pending Supabase writes ───────────────────────────────────────────────

export function getPendingNotes(): Note[] {
  if (typeof window === "undefined") return []
  return safeParse<Note[]>(localStorage.getItem(PENDING_KEY), [])
}

export function getPendingCount(): number {
  return getPendingNotes().length
}

/**
 * Pending count scoped to one session — drives the "saved offline" pill in
 * the SessionNotes component without leaking other sessions' state.
 */
export function getPendingCountForSession(sessionDay: string, sessionTitle: string): number {
  return getPendingNotes().filter(
    (n) => n.session_day === sessionDay && n.session_title === sessionTitle
  ).length
}

function savePending(notes: Note[]): Result {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(notes))
    return { ok: true }
  } catch {
    return { ok: false, error: "Storage full — could not save note offline." }
  }
}

export function queueNote(note: Note): Result {
  const pending = getPendingNotes()
  if (pending.some((p) => p.id === note.id)) return { ok: true }
  return savePending([...pending, note])
}

export function dequeueNote(id: string): void {
  // Re-read fresh; never write back a stale snapshot.
  const next = getPendingNotes().filter((p) => p.id !== id)
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(next)) } catch { /* ignore */ }
}

// ── Insert + flush ────────────────────────────────────────────────────────

interface NoteInsertRow {
  id: string
  session_title: string
  session_day: string
  author: string
  content: string
  created_at: string
}

function toRow(n: Note): NoteInsertRow {
  return {
    id: n.id,
    session_title: n.session_title,
    session_day: n.session_day,
    author: n.author,
    content: n.content,
    created_at: n.created_at,
  }
}

/**
 * Try to insert a single note into Supabase. Returns true on success.
 *
 * Uses upsert with ignoreDuplicates so a retried offline insert is idempotent
 * — if the row already exists (e.g. a previous retry actually got through but
 * the response never came back), the conflict is silently ignored rather than
 * triggering a row UPDATE. This also works under RLS policies that allow
 * INSERT but not UPDATE.
 */
export async function insertNote(
  supabase: SupabaseClient,
  note: Note,
): Promise<boolean> {
  const { error } = await supabase
    .from("session_notes")
    .upsert(toRow(note), { onConflict: "id", ignoreDuplicates: true })
  return !error
}

/**
 * Drain the pending queue into Supabase. Returns the count of successful
 * inserts. Lock + per-id remove pattern: never replaces the full queue
 * with a stale snapshot, never loses a note added during a flush.
 */
export async function flushPending(supabase: SupabaseClient): Promise<number> {
  if (!acquireLock()) return 0
  try {
    const snapshot = getPendingNotes()
    if (snapshot.length === 0) return 0

    let synced = 0
    for (const note of snapshot) {
      const ok = await insertNote(supabase, note)
      if (ok) {
        const next = getPendingNotes().filter((p) => p.id !== note.id)
        try { localStorage.setItem(PENDING_KEY, JSON.stringify(next)) } catch { /* keep going */ }
        synced++
      }
    }
    return synced
  } finally {
    releaseLock()
  }
}
