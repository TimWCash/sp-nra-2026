/**
 * Cross-tab mutex via the Web Locks API.
 *
 * Round 2's flush mutex was a localStorage CAS (read-then-write) which both
 * reviewers correctly flagged as non-atomic: two tabs waking up at the same
 * millisecond could both see "no lock", both write the lock, both flush.
 *
 * Web Locks (navigator.locks) is the right tool — the browser serializes
 * lock requests across same-origin tabs/workers atomically. When the holder
 * finishes (or its tab closes), the next waiter acquires automatically. No
 * stale-lock risk.
 *
 * Browser support is universal among targets we care about (iOS 15.4+,
 * Chrome 69+, Safari 15.4+, Firefox 96+). For anything older we fall back
 * to running the function unguarded — better to ship the work in a single
 * tab than to refuse it entirely.
 */

type WithLockOptions = {
  /**
   * If true, skip the work when the lock is held elsewhere (return null).
   * If false (default), wait until the lock is available.
   *
   * Use ifAvailable=true for FLUSH — we don't want concurrent flushes
   * stacking up; a missed flush is fine because the next online event will
   * try again. Use ifAvailable=false for ENQUEUE — we MUST persist the
   * user's lead/note even if it means waiting on a flush.
   */
  ifAvailable?: boolean
}

export async function withLock<T>(
  name: string,
  fn: () => T | Promise<T>,
  opts: WithLockOptions = {},
): Promise<T | null> {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    type LockManager = {
      request: (
        name: string,
        opts: { mode: "exclusive"; ifAvailable: boolean },
        cb: (lock: unknown | null) => Promise<T | null>,
      ) => Promise<T | null>
    }
    const locks = (navigator as unknown as { locks: LockManager }).locks
    return await locks.request(
      name,
      { mode: "exclusive", ifAvailable: !!opts.ifAvailable },
      async (lock) => {
        if (!lock) return null  // ifAvailable=true and lock held elsewhere
        return await fn()
      },
    )
  }
  // No Web Locks support — accept the imperfection rather than blocking
  // the work entirely. Older browsers don't reach trade-show users.
  return await fn()
}
