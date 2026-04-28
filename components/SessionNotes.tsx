"use client"

import { useCallback, useEffect, useState } from "react"
import { Sparkles, Send, Trash2, Loader2, User, Copy, CheckCircle2, X, RefreshCw, CloudOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { team as teamData } from "@/lib/data"
import {
  loadCachedNotes,
  mergeAndCacheNotes,
  queueNote,
  dequeueNote,
  insertNote,
  flushPending,
  getPendingCountForSession,
  type Note as OfflineNote,
} from "@/lib/notes-offline"

const USER_NAME_KEY = "sp_user_name"

type OpenerStyle = "stat" | "scene" | "contrarian" | "question" | "observation"
const STYLE_CYCLE: OpenerStyle[] = ["stat", "scene", "contrarian", "question", "observation"]
const STYLE_LABEL: Record<OpenerStyle, string> = {
  stat: "Lead with a stat",
  scene: "Paint the scene",
  contrarian: "Contrarian take",
  question: "Open with a question",
  observation: "Unexpected observation",
}

type Note = OfflineNote

type Props = {
  sessionTitle: string
  sessionDay: string
  sessionCategory?: string
  sessionLocation?: string
}

function loadUserName(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(USER_NAME_KEY) || ""
}

function saveUserName(name: string) {
  localStorage.setItem(USER_NAME_KEY, name)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function SessionNotes({ sessionTitle, sessionDay, sessionCategory, sessionLocation }: Props) {
  // Hydrate from the local cache so the list renders immediately, even offline.
  const [notes, setNotes] = useState<Note[]>(() =>
    loadCachedNotes().filter((n) => n.session_day === sessionDay && n.session_title === sessionTitle)
  )
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")
  const [askingName, setAskingName] = useState(false)
  const [draft, setDraft] = useState("")
  const [saving, setSaving] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(() => {
    setPendingCount(getPendingCountForSession(sessionDay, sessionTitle))
  }, [sessionDay, sessionTitle])

  // LinkedIn draft modal state
  const [showDraft, setShowDraft] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedPost, setGeneratedPost] = useState<string | null>(null)
  const [genError, setGenError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // Rotating index into STYLE_CYCLE — each regen steps forward so the user
  // sees a genuinely different angle instead of the same draft twice.
  const [styleIndex, setStyleIndex] = useState(0)
  const [lastStyle, setLastStyle] = useState<OpenerStyle | null>(null)

  useEffect(() => {
    setUserName(loadUserName())
  }, [])

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("session_notes")
      .select("*")
      .order("created_at", { ascending: false })
    if (!error && data) {
      // Merge fresh server rows with locally-pending notes (so a still-queued
      // offline note doesn't vanish from the UI on a fetch refresh).
      const merged = mergeAndCacheNotes(data as Note[])
      setNotes(merged.filter((n) => n.session_day === sessionDay && n.session_title === sessionTitle))
    }
    setLoading(false)
  }, [sessionDay, sessionTitle])

  // Load + live-sync notes for this session.
  useEffect(() => {
    fetchNotes()
    refreshPendingCount()
    const channel = supabase
      .channel(`notes-${sessionDay}-${sessionTitle}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_notes" },
        (payload) => {
          const row = (payload.new || payload.old) as Note | undefined
          if (!row) return
          // Only react to changes for this session
          if (row.session_day !== sessionDay || row.session_title !== sessionTitle) return
          fetchNotes()
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionDay, sessionTitle, fetchNotes, refreshPendingCount])

  // On mount + reconnect: flush any queued offline notes for ANY session,
  // then refresh this session's view if anything landed.
  useEffect(() => {
    const flush = async () => {
      const n = await flushPending(supabase)
      if (n > 0) await fetchNotes()
      refreshPendingCount()
    }
    flush()
    window.addEventListener("online", flush)
    return () => window.removeEventListener("online", flush)
  }, [fetchNotes, refreshPendingCount])

  async function saveNote() {
    const content = draft.trim()
    if (!content) return
    if (!userName) { setAskingName(true); return }
    setSaving(true)

    // Client-side id + timestamp so the note is durable from the moment Save
    // is tapped, regardless of connectivity. Idempotent retries via upsert by id.
    const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const note: Note = {
      id,
      session_title: sessionTitle,
      session_day: sessionDay,
      author: userName,
      content,
      created_at: new Date().toISOString(),
    }

    // 1. Optimistic local state — note appears immediately even offline.
    setNotes((prev) => [note, ...prev.filter((n) => n.id !== note.id)])
    setDraft("")

    // 2. Queue the Supabase write before attempting it. Dequeue on success.
    queueNote(note)
    refreshPendingCount()

    const ok = await insertNote(supabase, note)
    if (ok) {
      dequeueNote(note.id)
      refreshPendingCount()
    }
    // If insert failed, the note stays in the pending queue and will be
    // retried on the next "online" event or component mount.
    setSaving(false)
  }

  async function deleteNote(id: string) {
    if (!confirm("Delete this note? (Can't undo.)")) return
    // Optimistic
    setNotes((prev) => prev.filter((n) => n.id !== id))
    // Pull from the pending queue too — otherwise a deleted-while-offline note
    // would reappear once the queue flushed on reconnect.
    dequeueNote(id)
    refreshPendingCount()
    await supabase.from("session_notes").delete().eq("id", id)
  }

  function pickName(name: string) {
    saveUserName(name)
    setUserName(name)
    setAskingName(false)
    // If they had text queued up, save it now
    if (draft.trim()) saveNote()
  }

  async function generatePost(isRegen = false) {
    setGenerating(true)
    setGenError(null)
    setGeneratedPost(null)
    setShowDraft(true)
    // Rotate to the next opener style on regen; use the current index on first call.
    const idx = isRegen ? (styleIndex + 1) % STYLE_CYCLE.length : styleIndex
    setStyleIndex(idx)
    const openerStyle = STYLE_CYCLE[idx]
    try {
      const res = await fetch("/api/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionTitle,
          sessionCategory,
          sessionLocation,
          sessionDay,
          notes: notes.map((n) => ({ author: n.author, content: n.content })),
          openerStyle,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setGenError(json.error || `Request failed (${res.status})`)
      } else {
        setGeneratedPost(json.post)
        setLastStyle((json.openerStyle as OpenerStyle) || openerStyle)
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setGenerating(false)
    }
  }

  async function copyPost() {
    if (!generatedPost) return
    try {
      await navigator.clipboard.writeText(generatedPost)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
          Team Notes
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "var(--amber-light)", color: "var(--amber)", border: "1px solid var(--amber)" }}
            title="Saved on your phone, will sync when you're back online">
            <CloudOff size={10} />
            {pendingCount} offline
          </div>
        )}
      </div>

      {/* New-note input */}
      <div className="rounded-xl p-3 mb-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {userName && (
          <div className="text-[11px] mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <User size={11} />
            Signed in as <b style={{ color: "var(--text-secondary)" }}>{userName}</b>
            <button
              onClick={() => { saveUserName(""); setUserName(""); setAskingName(true) }}
              className="ml-auto text-[10px] cursor-pointer bg-transparent border-0 underline"
              style={{ color: "var(--text-muted)" }}>
              change
            </button>
          </div>
        )}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What did this session cover? Quotes, stats, takeaways…"
          rows={3}
          className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none"
          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
        <button
          onClick={saveNote}
          disabled={saving || !draft.trim()}
          className="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {saving ? "Saving…" : userName ? `Save as ${userName}` : "Save note"}
        </button>
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="text-center py-6 text-[12px]" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={16} className="inline animate-spin mr-1.5" /> Loading notes…
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-6 rounded-xl text-[12px]"
          style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
          No notes yet. Be the first.
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl p-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-[11px] font-bold" style={{ color: "var(--accent)" }}>
                  {n.author}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(n.created_at)}
                  </span>
                  <button
                    onClick={() => deleteNote(n.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer active:scale-90 bg-transparent border-0"
                    title="Delete note">
                    <Trash2 size={11} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                  </button>
                </div>
              </div>
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
                {n.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate LinkedIn post */}
      {notes.length > 0 && (
        <button
          onClick={() => generatePost(false)}
          disabled={generating}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-[13px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait border-0"
          style={{
            background: "linear-gradient(135deg, #008493, #00a5b8)",
            color: "#fff",
            boxShadow: "0 4px 16px rgba(0,132,147,0.25)",
          }}>
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? "Drafting…" : "Draft LinkedIn post from notes"}
        </button>
      )}

      {/* ── "Who are you?" picker ── */}
      {askingName && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center p-4"
          style={{ background: "var(--overlay)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-[480px] rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)" }}>
            <div className="p-5">
              <div className="text-lg font-extrabold mb-1" style={{ color: "var(--text)" }}>
                Who are you?
              </div>
              <div className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>
                We tag notes with your name so the team knows who wrote what.
              </div>
              <div className="grid grid-cols-2 gap-2">
                {teamData.map((m) => (
                  <button key={m.name} onClick={() => pickName(m.name)}
                    className="flex items-center gap-2 rounded-xl py-3 px-3 cursor-pointer active:scale-[0.98] transition-all text-left"
                    style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                      {m.initials}
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{m.name}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setAskingName(false)}
                className="w-full text-center text-[12px] pt-4 pb-1 cursor-pointer bg-transparent border-0"
                style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LinkedIn draft modal ── */}
      {showDraft && (
        <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-4"
          style={{ background: "var(--overlay)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-[520px] rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-lg)", maxHeight: "85vh" }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="text-[11px] font-bold tracking-widest uppercase" style={{ color: "var(--accent)" }}>
                  LinkedIn Draft
                </div>
                <div className="text-[14px] font-bold mt-0.5" style={{ color: "var(--text)" }}>
                  Edit before publishing
                </div>
              </div>
              <button onClick={() => setShowDraft(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer border-0"
                style={{ background: "var(--surface-alt)", color: "var(--text-muted)" }}>
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {generating && (
                <div className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={22} className="mx-auto animate-spin mb-2" />
                  <div className="text-[13px]">
                    Drafting with a <b>{STYLE_LABEL[STYLE_CYCLE[styleIndex]].toLowerCase()}</b> angle…
                  </div>
                </div>
              )}
              {genError && (
                <div className="rounded-xl p-4 text-[13px]"
                  style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                  {genError}
                </div>
              )}
              {generatedPost && (
                <>
                  {lastStyle && (
                    <div className="text-[11px] font-semibold mb-2 flex items-center gap-1.5"
                      style={{ color: "var(--text-muted)" }}>
                      <Sparkles size={11} style={{ color: "var(--accent)" }} />
                      Angle: <span style={{ color: "var(--accent)" }}>{STYLE_LABEL[lastStyle]}</span>
                      <span className="ml-auto text-[10px]">Regenerate to try a different one.</span>
                    </div>
                  )}
                  <textarea
                    value={generatedPost}
                    onChange={(e) => setGeneratedPost(e.target.value)}
                    className="w-full text-[13px] leading-relaxed px-3 py-3 rounded-xl outline-none resize-none"
                    rows={14}
                    style={{ background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                </>
              )}
            </div>

            {generatedPost && (
              <div className="px-5 pb-4 pt-2 border-t flex gap-2" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => generatePost(true)} disabled={generating}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-[12px] font-bold cursor-pointer active:scale-[0.98] transition-all border"
                  style={{ background: "var(--surface)", color: "var(--text-secondary)", borderColor: "var(--border)" }}>
                  <RefreshCw size={13} /> New angle
                </button>
                <button onClick={copyPost}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold cursor-pointer active:scale-[0.98] transition-all border-0"
                  style={{ background: copied ? "var(--success)" : "var(--accent)", color: "var(--accent-fg)" }}>
                  {copied ? <><CheckCircle2 size={14} /> Copied</> : <><Copy size={14} /> Copy to clipboard</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
