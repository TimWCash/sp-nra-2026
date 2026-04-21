import { NextResponse } from "next/server"

/**
 * Turns session notes into a LinkedIn post draft via Claude.
 * Uses Haiku (cheapest tier) — this is a short-form generation task.
 * Configure by dropping ANTHROPIC_API_KEY into Vercel env vars.
 */

type Note = { author: string; content: string }

type Body = {
  sessionTitle?: string
  sessionCategory?: string
  sessionLocation?: string
  sessionDay?: string
  notes?: Note[]
  tone?: "professional" | "casual" | "punchy"
  length?: "short" | "medium"
}

// Model defaults to Haiku (cheapest). Override via ANTHROPIC_MODEL if you
// ever want to try a bigger model without a code change.
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5"

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured on the server." },
      { status: 500 }
    )
  }

  const body = (await req.json().catch(() => ({}))) as Body
  const notes = Array.isArray(body.notes) ? body.notes : []
  const cleaned = notes
    .map((n) => ({ author: (n?.author || "").trim(), content: (n?.content || "").trim() }))
    .filter((n) => n.content.length > 0)

  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "No notes to draft from — add at least one note first." },
      { status: 400 }
    )
  }

  const tone = body.tone || "professional"
  const length = body.length || "medium"
  const lengthGuide =
    length === "short"
      ? "Keep it tight — 60-100 words. 1-2 short paragraphs."
      : "Aim for 120-180 words. 2-3 short paragraphs."

  const toneGuide =
    tone === "casual"
      ? "Write in a casual, conversational tone. First person. No corporate speak."
      : tone === "punchy"
        ? "Write punchy and direct. Short sentences. Confident. A little opinionated is fine."
        : "Write in a professional but human tone. First person. No jargon, no hashtag soup."

  const notesBlock = cleaned
    .map((n) => `- ${n.author ? `[${n.author}] ` : ""}${n.content}`)
    .join("\n")

  const system = `You are a writing assistant for a restaurant-tech consulting firm called Service Physics. Your job is to turn raw notes from a team member attending an NRA Show 2026 session into a LinkedIn post draft written from that attendee's perspective.

Rules:
- The post is a DRAFT. Someone will edit it before publishing.
- Do NOT fabricate stats, quotes, or speaker names that aren't in the notes.
- If the notes are thin, be honest about what stood out — don't pad.
- Pull out 1-2 concrete takeaways a restaurant operator would care about.
- Tag Service Physics work naturally if relevant (ops, labor, guest experience, speed of service) — don't force it.
- End with a soft question or invitation to respond. No "drop a 🚀 in the comments" cringe.
- Do NOT use hashtags unless the notes request them.
- Do NOT wrap in quotes or say "Here's a draft:" — output only the post body.`

  const user = `Session: ${body.sessionTitle || "(unknown)"}
${body.sessionCategory ? `Category: ${body.sessionCategory}\n` : ""}${body.sessionLocation ? `Location: ${body.sessionLocation}\n` : ""}${body.sessionDay ? `Day: ${body.sessionDay}\n` : ""}
Notes from the team member(s) who attended:
${notesBlock}

${toneGuide}
${lengthGuide}

Write the LinkedIn post now.`

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        max_tokens: 600,
        system,
        messages: [{ role: "user", content: user }],
      }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      const errMsg = json?.error?.message || `Anthropic API error (${res.status})`
      console.error("Anthropic error:", json)
      return NextResponse.json({ error: errMsg }, { status: 502 })
    }

    // Claude responses: { content: [{ type: "text", text: "..." }], ... }
    const post = Array.isArray(json?.content)
      ? json.content
          .filter((c: { type: string }) => c.type === "text")
          .map((c: { text: string }) => c.text)
          .join("\n")
          .trim()
      : ""

    if (!post) {
      return NextResponse.json({ error: "Claude returned an empty response." }, { status: 502 })
    }

    return NextResponse.json({ post })
  } catch (err) {
    console.error("generate-post error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
