// Shared in-memory push subscription store
// Uses globalThis so it's shared across route handlers on the same server instance
const g = globalThis as typeof globalThis & {
  _pushSubscriptions?: Map<string, object>
}
if (!g._pushSubscriptions) g._pushSubscriptions = new Map()

export const pushStore = g._pushSubscriptions
