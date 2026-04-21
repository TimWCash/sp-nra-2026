"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2, Circle, Share, Bell, Zap, Loader2,
  AlertCircle, Smartphone, Plus,
} from "lucide-react"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

type Platform = "ios" | "android" | "desktop" | "unknown"
type TestState = "idle" | "sending" | "sent" | "error"
type NotifState = NotificationPermission | "unsupported"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown"
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return "ios"
  if (/android/.test(ua)) return "android"
  if (/mac|win|linux/.test(ua)) return "desktop"
  return "unknown"
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false
  // iOS Safari exposes navigator.standalone; Android/Chrome use display-mode media query.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  const mediaStandalone = window.matchMedia?.("(display-mode: standalone)").matches === true
  return iosStandalone || mediaStandalone
}

async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) return null
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

export function SetupPage() {
  const [platform, setPlatform] = useState<Platform>("unknown")
  const [standalone, setStandalone] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotifState>("default")
  const [hasPushSub, setHasPushSub] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [testState, setTestState] = useState<TestState>("idle")
  const [testError, setTestError] = useState<string | null>(null)

  const detect = useCallback(async () => {
    setPlatform(detectPlatform())
    setStandalone(detectStandalone())

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setNotifPermission("unsupported")
      setHasPushSub(false)
      return
    }
    setNotifPermission(Notification.permission)

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setHasPushSub(!!sub)
    } catch {
      setHasPushSub(false)
    }
  }, [])

  useEffect(() => {
    detect()
    // Re-check when user returns to tab (e.g. after installing the PWA in Safari)
    const onFocus = () => detect()
    window.addEventListener("focus", onFocus)
    window.addEventListener("visibilitychange", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("visibilitychange", onFocus)
    }
  }, [detect])

  async function enableNotifications() {
    if (enabling) return
    setEnabling(true)
    try {
      const result = await Notification.requestPermission()
      setNotifPermission(result)
      if (result === "granted") {
        const sub = await subscribeToPush()
        setHasPushSub(!!sub)
      }
    } catch (err) {
      console.error("Enable notifications error:", err)
    } finally {
      setEnabling(false)
    }
  }

  async function sendTestSignal() {
    setTestState("sending")
    setTestError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setTestState("error")
        setTestError("No push subscription — enable notifications first.")
        return
      }
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setTestState("error")
        setTestError(json.error || `Push failed (${res.status})`)
        return
      }
      setTestState("sent")
      // Reset after a bit so the user can resend
      setTimeout(() => setTestState("idle"), 8000)
    } catch (err) {
      console.error("Test signal error:", err)
      setTestState("error")
      setTestError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  // Overall readiness — PWA install isn't strictly required on Android, so we
  // scope the "ready" calculation per-platform.
  const installRequired = platform === "ios"
  const installOk = !installRequired || standalone
  const notifOk = notifPermission === "granted"
  const pushOk = hasPushSub
  const allReady = installOk && notifOk && pushOk

  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>Bat Signal Setup</h1>
      <p className="text-[13px] mb-4" style={{ color: "var(--text-muted)" }}>
        Run this once before the show so your phone buzzes when the booth needs backup.
      </p>

      {allReady && (
        <div className="rounded-xl p-4 mb-4 flex items-center gap-2.5"
          style={{ background: "var(--success-light)", color: "var(--success)" }}>
          <CheckCircle2 size={18} />
          <div>
            <div className="font-bold text-[14px]">You&apos;re all set</div>
            <div className="text-[12px] opacity-80">Send a test below to feel how it&apos;ll go off.</div>
          </div>
        </div>
      )}

      {notifPermission === "unsupported" && (
        <div className="rounded-xl p-4 mb-4 flex items-start gap-2.5"
          style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div className="text-[13px]">
            <div className="font-bold mb-0.5">This browser can&apos;t receive push alerts.</div>
            Open the app in Safari (iOS) or Chrome (Android) and try again.
          </div>
        </div>
      )}

      {notifPermission === "denied" && (
        <div className="rounded-xl p-4 mb-4 flex items-start gap-2.5"
          style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div className="text-[13px]">
            <div className="font-bold mb-0.5">Notifications are blocked.</div>
            Open iPhone Settings → Notifications → find this app → allow notifications. Then come back and hit refresh.
          </div>
        </div>
      )}

      {/* STEP 1: Install as PWA */}
      <Step
        n={1}
        done={installOk}
        icon={<Smartphone size={18} />}
        title={installRequired ? "Install to your home screen" : "Install to your home screen (optional)"}
      >
        {platform === "ios" && !standalone && (
          <>
            <p className="mb-3">
              On iPhone, push alerts <b>only work</b> when this app is installed as an icon on your home screen.
            </p>
            <ol className="list-decimal ml-5 space-y-1.5 mb-2">
              <li>Tap the <b>Share</b> button in Safari <Share size={13} className="inline mx-1" /></li>
              <li>Scroll down → tap <b>Add to Home Screen</b> <Plus size={13} className="inline mx-1" /></li>
              <li>Tap <b>Add</b>, then open the app from the new icon</li>
              <li>Come back to this page and pull down to refresh — this step will turn green</li>
            </ol>
          </>
        )}
        {platform === "ios" && standalone && (
          <p>App is installed. Nice. ✅</p>
        )}
        {platform === "android" && !standalone && (
          <>
            <p className="mb-2">
              Not required on Android, but installing makes it feel like a real app and keeps it ready.
            </p>
            <p className="text-[12px] opacity-80">
              Chrome menu (⋮) → <b>Install app</b> or <b>Add to Home Screen</b>.
            </p>
          </>
        )}
        {platform === "android" && standalone && (
          <p>Installed. ✅</p>
        )}
        {platform === "desktop" && (
          <p>You&apos;re on desktop. Do this step on your phone — that&apos;s where bat signal alerts need to fire.</p>
        )}
      </Step>

      {/* STEP 2: Notification permission */}
      <Step
        n={2}
        done={notifOk}
        icon={<Bell size={18} />}
        title="Allow notifications"
        locked={installRequired && !standalone}
      >
        {installRequired && !standalone ? (
          <p>Finish Step 1 first — iOS won&apos;t let you grant permission until the app is on your home screen.</p>
        ) : notifPermission === "granted" ? (
          <p>Permission granted. ✅</p>
        ) : notifPermission === "denied" ? (
          <p>Blocked in system settings. See the warning above.</p>
        ) : notifPermission === "unsupported" ? (
          <p>This browser doesn&apos;t support push.</p>
        ) : (
          <>
            <p className="mb-3">
              We&apos;ll ask for permission to send notifications. Say yes — this is the whole point.
            </p>
            <button
              onClick={enableNotifications}
              disabled={enabling}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait"
              style={{ background: "var(--accent)", color: "var(--accent-fg)", border: "none" }}>
              {enabling ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
              {enabling ? "Asking…" : "Enable notifications"}
            </button>
          </>
        )}
      </Step>

      {/* STEP 3: Push subscription */}
      <Step
        n={3}
        done={pushOk}
        icon={<Zap size={18} />}
        title="Register with the team server"
        locked={!notifOk}
      >
        {!notifOk ? (
          <p>Finish Step 2 first.</p>
        ) : pushOk ? (
          <p>Subscribed. ✅ The server knows how to reach your phone.</p>
        ) : (
          <>
            <p className="mb-3">
              Permission is granted but your phone isn&apos;t registered with the server yet.
            </p>
            <button
              onClick={async () => {
                const sub = await subscribeToPush()
                setHasPushSub(!!sub)
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold cursor-pointer active:scale-[0.98] transition-all"
              style={{ background: "var(--accent)", color: "var(--accent-fg)", border: "none" }}>
              <Zap size={16} /> Register now
            </button>
          </>
        )}
      </Step>

      {/* STEP 4: Test */}
      <Step
        n={4}
        done={testState === "sent"}
        icon={<Zap size={18} />}
        title="Send yourself a test signal"
        locked={!pushOk}
      >
        {!pushOk ? (
          <p>Finish the steps above first.</p>
        ) : (
          <>
            <p className="mb-3">
              Hit the button, then lock your phone or switch apps for a second.
              You should feel a buzz and see a notification within ~5 seconds.
            </p>
            <button
              onClick={sendTestSignal}
              disabled={testState === "sending"}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold cursor-pointer active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait"
              style={{
                background: testState === "sent" ? "var(--success)" : "var(--accent)",
                color: "var(--accent-fg)",
                border: "none",
              }}>
              {testState === "sending" && <><Loader2 size={16} className="animate-spin" /> Sending…</>}
              {testState === "sent" && <><CheckCircle2 size={16} /> Sent — check your phone</>}
              {(testState === "idle" || testState === "error") && <><Zap size={16} /> Send test signal</>}
            </button>

            {testState === "sent" && (
              <div className="mt-3 text-[12px] rounded-lg px-3 py-2"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                If you didn&apos;t feel a buzz: check that Do Not Disturb / Focus is off, and
                iPhone Settings → Notifications → this app → Allow Notifications + Sounds + Haptics.
              </div>
            )}

            {testState === "error" && testError && (
              <div className="mt-3 text-[12px] rounded-lg px-3 py-2 flex items-start gap-1.5"
                style={{ background: "var(--danger-light)", color: "var(--danger)" }}>
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                <span>{testError}</span>
              </div>
            )}
          </>
        )}
      </Step>
    </div>
  )
}

function Step({
  n, done, icon, title, locked = false, children,
}: {
  n: number
  done: boolean
  icon: React.ReactNode
  title: string
  locked?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-4 mb-3"
      style={{
        background: done ? "var(--success-light)" : "var(--surface)",
        border: `1px solid ${done ? "var(--success)" : "var(--border)"}`,
        opacity: locked && !done ? 0.65 : 1,
      }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: done ? "var(--success)" : "var(--surface-alt)",
            color: done ? "#fff" : "var(--text-muted)",
          }}>
          {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-widest uppercase mb-0.5"
            style={{ color: done ? "var(--success)" : "var(--text-muted)" }}>
            Step {n}
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <span style={{ color: done ? "var(--success)" : "var(--accent)" }}>{icon}</span>
            <h3 className="text-[15px] font-bold" style={{ color: "var(--text)" }}>{title}</h3>
          </div>
          <div className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
