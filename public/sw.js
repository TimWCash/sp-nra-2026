const CACHE = "sp-nra-2026-v1"

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
  // Only handle GET requests for same-origin or CDN assets
  if (event.request.method !== "GET") return
  const url = new URL(event.request.url)
  // Skip Google Sheets sync calls — always go network
  if (url.hostname.includes("script.google.com")) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)

      // Network first, fall back to cache
      return networkFetch || cached
    })
  )
})
