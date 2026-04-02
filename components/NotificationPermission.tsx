"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Check } from "lucide-react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existing.toJSON()),
    })
    return existing
  }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  })
  return sub
}

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported")
      return
    }
    setPermission(Notification.permission)

    // Re-subscribe silently if already granted — keeps server subscriptions fresh
    if (Notification.permission === "granted") {
      subscribeToPush().catch(() => {})
    }
  }, [])

  async function enable() {
    if (loading) return
    setLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === "granted") await subscribeToPush()
    } catch {}
    setLoading(false)
  }

  if (permission === "unsupported" || permission === "denied") return null

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold mb-3"
        style={{ background: "var(--success-light)", color: "var(--success)" }}>
        <Check size={13} />
        Bat signal alerts ON
      </div>
    )
  }

  return (
    <button
      onClick={enable}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 mb-3 text-[13px] font-bold cursor-pointer active:scale-[0.98] transition-all border-0"
      style={{ background: "var(--surface-alt)", border: "1.5px dashed var(--border-strong)", color: "var(--text-muted)" }}>
      {loading ? <BellOff size={15} /> : <Bell size={15} />}
      {loading ? "Enabling…" : "Enable push alerts for Bat Signal"}
    </button>
  )
}
