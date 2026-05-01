"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2, Circle, Share, Bell, Zap, Loader2,
  AlertCircle, Smartphone, Plus, User as UserIcon,
} from "lucide-react"
import { team as teamData } from "@/lib/data"

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

// Same key SessionNotes uses, so identifying yourself anywhere identifies
// you everywhere.
const USER_NAME_KEY = "sp_user_name"

function loadUserName(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(USER_NAME_KEY) || ""
}

function saveUserName(name: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USER_NAME_KEY, name)
}

// Stored client-side the moment a subscription is created. If the public key
// in the env changes (e.g. Tim rotates VAPID keys in Vercel), every teammate's
// existing subscription becomes cryptographically mismatched with the server's
// private key — pushes to them will return 403 forever. We detect the drift on
// the next app open and silently re-subscribe.
const VAPID_KEY_STAMP_KEY = "sp_vapid_public_key"

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

/** True if we got a 2xx confirming the row landed on the server. */
async function registerOnServer(sub: PushSubscription, teamMember: string): Promise<boolean> {
  try {
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), teamMember }),
    })
    return res.ok
  } catch {
    return false
  }
}

async function subscribeToPush(opts: { forceFresh?: boolean } = {}): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) return null
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const teamMember = loadUserName()
  if (existing && !opts.forceFresh) {
    // Verify the server actually has us. If registration fails, do NOT swallow —
    // return null so the UI can reflect the real state instead of a phantom ✅.
    const ok = await registerOnServer(existing, teamMember)
    if (!ok) return null
    try { localStorage.setItem(VAPID_KEY_STAMP_KEY, VAPID_PUBLIC_KEY) } catch {}
    return existing
  }
  // forceFresh: drop the dead local sub first, then create a new one. Tell
  // the server about the removal too so it doesn't keep pushing to a dead endpoint.
  if (existing && opts.forceFresh) {
    const deadEndpoint = existing.endpoint
    try { await existing.unsubscribe() } catch {}
    try {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: deadEndpoint }),
      })
    } catch {}
  }
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })
  const ok = await registerOnServer(sub, teamMember)
  if (!ok) return null
  try { localStorage.setItem(VAPID_KEY_STAMP_KEY, VAPID_PUBLIC_KEY) } catch {}
  return sub
}

/**
 * VAPID drift check. If the public key this device subscribed with isn't the
 * same as the one the server is now signing against, the subscription will
 * 403 on every push. Silently refresh it before that happens.
 *
 * Runs at most once per app open, early — before a bat signal could fire.
 * No user prompt, no permission dance — the browser reuses the already-granted
 * Notification permission to mint a fresh subscription.
 */
async function healVapidDrift(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!("serviceWorker" in navigator) || !VAPID_PUBLIC_KEY) return false
  if (Notification.permission !== "granted") return false
  try {
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (!existing) return false
    const stamped = localStorage.getItem(VAPID_KEY_STAMP_KEY)
    if (stamped && stamped === VAPID_PUBLIC_KEY) return false // already current
    // Either we've never stamped (legacy sub from before this code shipped) or
    // the key rotated. Refresh silently.
    await subscribeToPush({ forceFresh: true })
    return true
  } catch (err) {
    console.warn("VAPID drift heal failed:", err)
    return false
  }
}

export function SetupPage() {
  const [platform, setPlatform] = useState<Platform>("unknown")
  const [standalone, setStandalone] = useState(false)
  const [notifPermission, setNotifPermission] = useState<NotifState>("default")
  const [hasPushSub, setHasPushSub] = useState(false)
  const [enabling, setEnabling] = useState(false)
  const [testState, setTestState] = useState<TestState>("idle")
  const [testError, setTestError] = useState<string | null>(null)
  // Who is this device. Loaded from localStorage on mount; required before
  // we'll let the user finish Step 3 so the registered-devices list is useful.
  const [userName, setUserName] = useState("")

  const detect = useCallback(async () => {
    const plat = detectPlatform()
    const standaloneNow = detectStandalone()
    setPlatform(plat)
    setStandalone(standaloneNow)

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setNotifPermission("unsupported")
      setHasPushSub(false)
      return
    }
    setNotifPermission(Notification.permission)

    // iOS install gate: don't try to verify or heal a sub on a Safari tab —
    // iOS only fires push when the app is added to the home screen, and
    // attempting subscribe before that gives confusing errors.
    if (plat === "ios" && !standaloneNow) {
      setHasPushSub(false)
      return
    }

    try {
      // First heal any VAPID drift (server-rotated public key) silently.
      await healVapidDrift()
      const reg = await navigator.serviceWorker.ready
      const browserSub = await reg.pushManager.getSubscription()
      if (!browserSub) {
        setHasPushSub(false)
        return
      }
      // Browser has a sub — verify the SERVER also has it. If only the
      // browser knows about it (e.g. project migrated, server got wiped),
      // re-register silently. subscribeToPush() returns null if the server
      // refuses, in which case Step 3 turns red rather than showing a
      // phantom green check.
      const verified = await subscribeToPush()
      setHasPushSub(!!verified)
    } catch {
      setHasPushSub(false)
    }
  }, [])

  useEffect(() => {
    detect()
    setUserName(loadUserName())
    // Re-check when user returns to tab (e.g. after installing the PWA in Safari)
    const onFocus = () => detect()
    window.addEventListener("focus", onFocus)
    window.addEventListener("visibilitychange", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("visibilitychange", onFocus)
    }
  }, [detect])

  function pickName(name: string) {
    saveUserName(name)
    setUserName(name)
    // If they were already subscribed before identifying, push the name up to
    // the server immediately so they show up on the team list.
    if (hasPushSub) subscribeToPush().catch(() => {})
  }

  async function enableNotifications() {
    if (enabling) return
    // iOS gate at the function level too — even if Step 2's "locked" UI
    // were bypassed, this prevents the requestPermission call from firing
    // in a Safari tab where it can't actually deliver pushes.
    if (platform === "ios" && !standalone) {
      window.alert("Install the app to your home screen first (Step 1) — iOS only delivers push to standalone PWAs.")
      return
    }
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

  async function pingTest(endpoint: string): Promise<{
    ok: boolean
    expired?: boolean
    error?: string
    status: number
    upstreamStatus?: number
  }> {
    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    })
    const json = await res.json().catch(() => ({}))
    return {
      ok: res.ok,
      expired: !!json.expired,
      error: json.error,
      status: res.status,
      upstreamStatus: typeof json.upstreamStatus === "number" ? json.upstreamStatus : undefined,
    }
  }

  async function sendTestSignal() {
    setTestState("sending")
    setTestError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        setTestState("error")
        setTestError("No push subscription — enable notifications first.")
        return
      }

      let result = await pingTest(sub.endpoint)

      // Auto-recover: if the server says the subscription expired, refresh the
      // local sub (unsubscribe + re-subscribe + re-register) and retry once.
      if (!result.ok && result.expired) {
        const fresh = await subscribeToPush({ forceFresh: true })
        if (!fresh) {
          setTestState("error")
          setTestError("Couldn't refresh your subscription. Toggle notifications off and on in Settings, then retry.")
          return
        }
        sub = fresh
        setHasPushSub(true)
        result = await pingTest(sub.endpoint)

        // If the fresh subscription ALSO gets rejected with the same expired
        // flag, we're not looking at a stale sub — the VAPID keypair on the
        // server is busted. No amount of re-subscribing will fix that. Tell
        // the user something actionable.
        if (!result.ok && result.expired) {
          setTestState("error")
          setTestError(
            `Server is rejecting every push subscription (${result.upstreamStatus ?? "???"}). ` +
            `This is almost always a VAPID key mismatch — flag Tim to check NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY on Vercel.`
          )
          return
        }
      }

      if (!result.ok) {
        setTestState("error")
        setTestError(result.error || `Push failed (${result.status})`)
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
  const identityOk = !!userName
  const allReady = installOk && notifOk && pushOk && identityOk

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

      {/* Identify yourself — required before registering, so the team list
          on Team Status can show who's still missing setup. */}
      <div className="rounded-2xl p-4 mb-3"
        style={{
          background: userName ? "var(--surface)" : "var(--accent-light)",
          border: `1px solid ${userName ? "var(--border)" : "var(--accent)"}`,
        }}>
        {userName ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <UserIcon size={14} style={{ color: "var(--accent)" }} className="flex-shrink-0" />
              <span className="text-[13px] truncate" style={{ color: "var(--text-secondary)" }}>
                You&apos;re registering as <b style={{ color: "var(--text)" }}>{userName}</b>
              </span>
            </div>
            <button
              onClick={() => { saveUserName(""); setUserName("") }}
              className="text-[11px] font-semibold cursor-pointer bg-transparent border-0 underline flex-shrink-0"
              style={{ color: "var(--text-muted)" }}>
              change
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <UserIcon size={14} style={{ color: "var(--accent)" }} />
              <span className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>
                Who are you?
              </span>
            </div>
            <p className="text-[12px] mb-3" style={{ color: "var(--text-secondary)" }}>
              Pick your name so the team can see you&apos;re ready.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {teamData.map((m) => (
                <button key={m.name} onClick={() => pickName(m.name)}
                  className="flex items-center gap-2 rounded-xl py-2.5 px-3 cursor-pointer active:scale-[0.97] transition-all text-left border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                    {m.initials}
                  </div>
                  <span className="text-[13px] font-semibold truncate" style={{ color: "var(--text)" }}>{m.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

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
        done={pushOk && identityOk}
        icon={<Zap size={18} />}
        title="Register with the team server"
        locked={!notifOk || !identityOk}
      >
        {!notifOk ? (
          <p>Finish Step 2 first.</p>
        ) : !identityOk ? (
          <p>Pick your name above first — the server stores it so the team can see you&apos;re ready.</p>
        ) : pushOk ? (
          <p>Subscribed as <b>{userName}</b>. ✅ The server knows how to reach your phone.</p>
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
