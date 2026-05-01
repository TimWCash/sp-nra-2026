#!/usr/bin/env bash
# Build a single-file code review bundle for sp-nra-2026.
# Output: code-review-bundle.md (gitignored — regenerate any time).
#
# Excludes: .env*, node_modules, .next, lockfiles, build output.
# Includes: source, config, schema, project docs.

set -euo pipefail
cd "$(dirname "$0")/.."

OUT="code-review-bundle.md"

# Header
cat > "$OUT" <<'HEADER'
# sp-nra-2026 — code review bundle

A trade-show booth lead-capture PWA built for Service Physics' booth at the
National Restaurant Association Show 2026 (May 16-19, McCormick Place, Chicago).

## Stack

- Next.js 16 (App Router, Turbopack)
- React 18
- Supabase (Postgres + Realtime + the new `sb_publishable_*` keys)
- TypeScript strict
- Tailwind CSS
- web-push (VAPID) for the "Bat Signal" push notifications
- Anthropic Claude Sonnet 4.5 for AI badge scan + LinkedIn post drafting
- Google Sheets API (service account) for sales-team-facing mirror of leads

## Things a reviewer should specifically look at

- **Offline durability** for leads (`lib/leads-offline.ts`), session notes
  (`lib/notes-offline.ts`) — localStorage queues + flush on reconnect. Look
  for race conditions, double-writes, lost data on reconnect.
- **Push notifications** (`app/api/push/*`, `app/api/bat-signal/route.ts`,
  `components/pages/SetupPage.tsx`) — VAPID drift auto-heal, sub pruning on
  400/403/404/410, auto-recover retry. Look for cases where a teammate could
  silently fail to receive a bat signal during the show.
- **Service worker** (`public/sw.js`) — network-first cache fallback. Look
  for offline edge cases, stale-bundle issues, and what happens if a teammate
  has never opened the app online before arriving at the venue.
- **Supabase schema** (`supabase/init.sql`) — all 6 tables, RLS policies.
  RLS is permissive by design; want a sanity check that nothing sensitive is
  exposed. (No PII beyond names/emails the team chooses to capture.)
- **TypeScript safety** — anywhere `as` casts, `any`, or `unknown` are doing
  load-bearing work.

## What is NOT included

- `.env.local` (contains live VAPID + Anthropic + Supabase secrets)
- `node_modules`, `.next`, lockfiles
- Static assets (icons, images)
- Generated build output

---

HEADER

# Project docs first — orient the reviewer
for f in AGENTS.md CLAUDE.md package.json tsconfig.json next.config.* postcss.config.* tailwind.config.* eslint.config.*; do
  if [ -f "$f" ]; then
    echo "" >> "$OUT"
    echo "## \`$f\`" >> "$OUT"
    echo "" >> "$OUT"
    echo '```'"${f##*.}" >> "$OUT"
    cat "$f" >> "$OUT"
    echo '```' >> "$OUT"
  fi
done

# Schema
echo "" >> "$OUT"
echo "## \`supabase/init.sql\`" >> "$OUT"
echo "" >> "$OUT"
echo '```sql' >> "$OUT"
cat supabase/init.sql >> "$OUT"
echo '```' >> "$OUT"

# Service worker
echo "" >> "$OUT"
echo "## \`public/sw.js\`" >> "$OUT"
echo "" >> "$OUT"
echo '```js' >> "$OUT"
cat public/sw.js >> "$OUT"
echo '```' >> "$OUT"

# All app source — alphabetical for stability
find app components lib hooks \
  -type f \( -name "*.ts" -o -name "*.tsx" \) \
  ! -path "*/node_modules/*" \
  | sort | while read -r f; do
    echo "" >> "$OUT"
    echo "## \`$f\`" >> "$OUT"
    echo "" >> "$OUT"
    case "$f" in
      *.tsx) lang=tsx ;;
      *.ts)  lang=ts ;;
      *)     lang= ;;
    esac
    echo '```'"$lang" >> "$OUT"
    cat "$f" >> "$OUT"
    echo '```' >> "$OUT"
  done

# Footer with stats
files=$(find app components lib hooks -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l | tr -d ' ')
lines=$(find app components lib hooks -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
out_lines=$(wc -l < "$OUT" | tr -d ' ')
out_size=$(wc -c < "$OUT" | awk '{printf "%.0f KB", $1/1024}')

echo "" >> "$OUT"
echo "---" >> "$OUT"
echo "" >> "$OUT"
echo "_Bundle generated $(date '+%Y-%m-%d %H:%M %Z') — $files source files, $lines source lines, $out_lines bundle lines, $out_size._" >> "$OUT"

echo "✅ Wrote $OUT ($files files, $lines source lines, $out_size)"
