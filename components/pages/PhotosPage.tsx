"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Camera, Trash2, X, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

const TEAM_MEMBERS = ["Brian", "Rebecca", "Maria", "Steve", "Kelly", "Emily", "Ellis"] as const
const TAKEN_BY_KEY = "sp_nra_captured_by"

interface Photo {
  id: string
  url: string
  caption: string
  takenBy: string
  createdAt: string
}

function resizeImage(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [takenBy, setTakenBy] = useState("")
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase.from("show_photos").select("*").order("created_at", { ascending: false })
    if (data) {
      setPhotos(data.map((r) => ({
        id: r.id,
        url: r.url,
        caption: r.caption || "",
        takenBy: r.taken_by || "",
        createdAt: new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
      })))
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem(TAKEN_BY_KEY)
    if (saved) setTakenBy(saved)
    fetchPhotos()

    const channel = supabase
      .channel("show_photos_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "show_photos" }, fetchPhotos)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchPhotos])

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileInputRef.current) fileInputRef.current.value = ""

    setUploading(true)
    try {
      const resized = await resizeImage(file, 1200)
      await supabase.from("show_photos").insert({
        url: resized,
        caption: "",
        taken_by: takenBy,
      })
    } catch (err) {
      console.error("Photo upload error:", err)
    } finally {
      setUploading(false)
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm("Delete this photo?")) return
    await supabase.from("show_photos").delete().eq("id", id)
    setSelectedPhoto(null)
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>Show Photos</h1>
      <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>Shared album — everyone on the team sees these.</p>

      {/* Who's taking */}
      <div className="text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: "var(--text-muted)" }}>Who's shooting?</div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TEAM_MEMBERS.map((m) => (
          <button key={m} onClick={() => { setTakenBy(m); localStorage.setItem(TAKEN_BY_KEY, m) }}
            className="px-3 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer transition-all duration-200"
            style={{
              background: takenBy === m ? "var(--accent)" : "var(--surface-alt)",
              border: `1.5px solid ${takenBy === m ? "var(--accent)" : "var(--border)"}`,
              color: takenBy === m ? "var(--accent-fg)" : "var(--text-muted)",
            }}>
            {m}
          </button>
        ))}
      </div>

      {/* Camera button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-4 mb-5 font-bold text-[15px] cursor-pointer transition-all duration-200 active:scale-[0.98]"
        style={{ background: "var(--accent)", color: "var(--accent-fg)", border: "none", opacity: uploading ? 0.7 : 1 }}>
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
        {uploading ? "Uploading..." : "Take a Photo"}
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
        onChange={handlePhoto} className="hidden" />

      {/* Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
          <Camera size={48} className="mx-auto mb-3 opacity-30" />
          <div className="font-semibold text-base mb-1">No photos yet</div>
          <div className="text-sm">Capture the show — booth, team, cool products.</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <button key={photo.id} onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer active:scale-[0.97] transition-all duration-200"
              style={{ border: "1px solid var(--border)" }}>
              <img src={photo.url} alt="" className="w-full h-full object-cover" />
              {photo.takenBy && (
                <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[9px] font-bold text-white truncate"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}>
                  {photo.takenBy}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Full screen photo viewer */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "#000" }}>
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSelectedPhoto(null)}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff" }}>
              <X size={18} />
            </button>
            <div className="text-[12px] font-semibold text-white/70">
              {selectedPhoto.takenBy && `📸 ${selectedPhoto.takenBy} · `}{selectedPhoto.createdAt}
            </div>
            <button onClick={() => deletePhoto(selectedPhoto.id)}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff" }}>
              <Trash2 size={16} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={selectedPhoto.url} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}
