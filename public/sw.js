const CACHE = "sp-nra-2026-v3"
// Network requests that hang longer than this fall back to cache.
// Trade-show wifi often "looks connected" but stalls — without a timeout
// the app would hang for 30-60s before browsers give up.
const NETWORK_TIMEOUT_MS = 3000

const PRECACHE = [
  "/",
  "/manifest.json",
  "/icon-192.svg",
  "/icon-512.svg",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  const url = new URL(event.request.url)
  if (url.hostname.includes("script.google.com")) return
  // Don't intercept API/data calls — those have their own offline queues
  // and we don't want stale responses served from cache.
  if (url.pathname.startsWith("/api/")) return
  if (url.hostname.endsWith(".supabase.co")) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Race the network fetch against a timeout. If network wins within the
      // budget, we update the cache and return the fresh response. If it
      // doesn't, we serve cache (or surface the timeout if there's no cache).
      const networkFetch = fetch(event.request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, clone))
        }
        return response
      })

      const timeoutFetch = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("network timeout")), NETWORK_TIMEOUT_MS)
      })

      return Promise.race([networkFetch, timeoutFetch]).catch(() => {
        if (cached) return cached
        // No cache, no network. Tailor the fallback to the request type —
        // returning text/plain for an asset (CSS/JS/font/image) would cause
        // parse errors and broken UI; only navigation gets the friendly HTML.
        if (event.request.mode === "navigate") {
          return new Response(
            "<!doctype html><html><head><meta charset=\"utf-8\"><title>Offline</title>" +
            "<style>body{font:15px/1.4 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;margin:0;padding:48px 24px;background:#0b0d12;color:#e5e7eb;text-align:center}h1{font-size:18px;margin:0 0 8px}p{color:#9ca3af;margin:0 0 24px}</style>" +
            "</head><body><h1>You're offline</h1>" +
            "<p>Open this app once on wifi before the show so the device can cache it.</p>" +
            "</body></html>",
            { status: 503, statusText: "Offline", headers: { "Content-Type": "text/html; charset=utf-8" } },
          )
        }
        // For assets, let the browser handle the failure naturally — no
        // fake 200 with text/plain pretending to be a CSS file.
        return Response.error()
      })
    })
  )
})

// ── PUSH NOTIFICATIONS ──
self.addEventListener("push", (event) => {
  let data = { title: "🦇 BAT SIGNAL", body: "Booth #7365 needs backup — get there now!" }
  try {
    if (event.data) data = event.data.json()
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      tag: "bat-signal",
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { url: "/?page=status" },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow("/")
    })
  )
})
