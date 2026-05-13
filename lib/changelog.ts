/**
 * In-app changelog. Each entry surfaces in the "What's New" popup the next
 * time a teammate opens the app, exactly once. Devices remember the latest
 * version they've seen via localStorage (`sp_changelog_last_seen_id`); any
 * entry with an id newer than that gets shown.
 *
 * Convention: add new entries at the TOP of the array. Use a kebab-case
 * monotonically-increasing id (e.g. "2026-05-12-event-rsvp"). Keep `body`
 * to one or two short sentences — the popup is small.
 */
export type ChangelogEntry = {
  /** Unique kebab-case id. Used as the "last seen" marker. */
  id: string
  /** Short headline (under 50 chars). */
  title: string
  /** One or two sentences. */
  body: string
  /** Optional emoji prefix to make scanning easy. */
  emoji?: string
  /** Optional CTA: tapping the entry jumps to this in-app page. */
  cta?: { label: string; page: string }
}

/**
 * Newest first. ALWAYS add new entries at the top.
 *
 * The id is what dedupes — once a teammate has seen an id, they won't see
 * it again. Pick ids that monotonically sort, so "latest" is unambiguous.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-05-13-qualified-leads",
    emoji: "🎯",
    title: "New: Qualified Leads counter (replaces daily count)",
    body: "On Team Status — tracks hot + warm leads toward our 50-qualified show goal. Cool leads (met but not a fit) are recorded but don't count toward the metric.",
    cta: { label: "See it", page: "status" },
  },
  {
    id: "2026-05-13-backup",
    emoji: "💾",
    title: "Download all our data as a backup",
    body: "On the More page — one tap, get a JSON file with every lead (incl. badge photos), session note, and show photo. Re-runnable anytime. Worth doing right after the show.",
    cta: { label: "Open backup", page: "more" },
  },
  {
    id: "2026-05-12-booth-shifts",
    emoji: "🪑",
    title: "Booth shift schedule",
    body: "New section on Team Status — sign up for morning or afternoon shifts each day so we can see who's covering when.",
    cta: { label: "Pick my shifts", page: "status" },
  },
  {
    id: "2026-05-12-event-rsvp",
    emoji: "✋",
    title: "RSVP to after-hours events in-app",
    body: "Tap \"I'm going\" on any event card to claim it. The whole team can see who's covering what — split up across overlapping events without a Slack thread.",
    cta: { label: "Browse events", page: "schedule" },
  },
  {
    id: "2026-05-12-whatsnew",
    emoji: "📣",
    title: "What's New popups",
    body: "When we ship app updates, you'll see a short popup like this on your next app open so nothing slips by.",
  },
]
