import { NextResponse } from "next/server"

/**
 * Turns session notes into a LinkedIn post draft via Claude.
 * Uses Haiku (cheapest tier) — this is a short-form generation task.
 * Configure by dropping ANTHROPIC_API_KEY into Vercel env vars.
 */

type Note = { author: string; content: string }

type OpenerStyle = "stat" | "scene" | "contrarian" | "question" | "observation"

type Body = {
  sessionTitle?: string
  sessionCategory?: string
  sessionLocation?: string
  sessionDay?: string
  notes?: Note[]
  tone?: "professional" | "casual" | "punchy"
  length?: "short" | "medium"
  // When the UI hits "Regenerate" it cycles through opener styles so drafts
  // don't all start the same boring way.
  openerStyle?: OpenerStyle
}

// Model defaults to Haiku (cheapest). Override via ANTHROPIC_MODEL if you
// ever want to try a bigger model without a code change.
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5"

const OPENER_GUIDES: Record<OpenerStyle, string> = {
  stat: `Open by leading with a specific number or data point lifted from the notes. No throat-clearing, no "I attended…". Just the number and what it means.
EXAMPLE OPENING (don't copy — use one FROM THE NOTES):
"60% of operators are raising prices again in 2026. Most still can't tell you where the margin went."`,

  scene: `Open by painting a short concrete scene from the room or the moment — something sensory or specific. Then pivot to the idea.
EXAMPLE OPENING:
"Room was packed. Standing room only. That tells you everything about where operators' heads are right now."`,

  contrarian: `Open by challenging a conventional assumption the session touched on. State the popular view, then push back on it using what you heard.
EXAMPLE OPENING:
"Everyone says cross-training solves retention. The speakers today made me wonder if we've been solving the wrong problem."`,

  question: `Open with a pointed, specific question the session forced you to sit with. Not rhetorical fluff — a real question an operator would actually chew on.
EXAMPLE OPENING:
"If your labor model breaks when one shift leader calls out, is it actually a model?"`,

  observation: `Open with an unexpected thing you noticed — a pattern, a tension, a thing nobody else seems to be saying out loud. Specific, not generic.
EXAMPLE OPENING:
"Three different sessions today. Zero mention of the guest. That's its own data point."`,
}

const STYLE_CYCLE: OpenerStyle[] = ["stat", "scene", "contrarian", "question", "observation"]

function pickStyle(requested?: OpenerStyle): OpenerStyle {
  if (requested && STYLE_CYCLE.includes(requested)) return requested
  // Deterministic-ish rotation when caller doesn't specify
  return STYLE_CYCLE[Math.floor(Math.random() * STYLE_CYCLE.length)]
}

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
  const openerStyle = pickStyle(body.openerStyle)

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

  const system = `You are a writing assistant for a restaurant-operations consulting firm called Service Physics. Your job is to turn raw notes from a team member attending an NRA Show 2026 session into a LinkedIn post draft written from that attendee's first-person perspective.

Hard rules:
- The post is a DRAFT. Someone will edit it before publishing.
- Ground EVERYTHING in the notes. Do NOT invent stats, quotes, speaker names, or session details that aren't in the notes.
- If the notes are thin, lean into the one specific thing that stood out. Don't pad with generic industry commentary.
- Pull out 1-2 concrete takeaways a restaurant operator would actually care about (labor, ops, guest experience, speed of service, margin).
- End with ONE soft, specific question inviting a real reply. Not "drop a 🚀", not "what do you think?" — something pointed.
- Do NOT use hashtags.
- Do NOT wrap the output in quotes or say "Here's a draft". Output only the post body.

BANNED opening patterns — these are LinkedIn clichés, do NOT use any variation of them:
- "Just sat through…"
- "Just wrapped up…"
- "Just attended…"
- "Had the pleasure of attending…"
- "Key takeaway from…"
- "Three takeaways from today's session on…"
- "Attended a great session today on…"
- "What a session!"
- Any opener that names the conference/session in the first sentence.

The first 10 words of your post are the most important thing in the whole piece. Make them stop the scroll.`

  const user = `Session: ${body.sessionTitle || "(unknown)"}
${body.sessionCategory ? `Category: ${body.sessionCategory}\n` : ""}${body.sessionLocation ? `Location: ${body.sessionLocation}\n` : ""}${body.sessionDay ? `Day: ${body.sessionDay}\n` : ""}
Notes from the team member(s) who attended:
${notesBlock}

${toneGuide}
${lengthGuide}

OPENING STYLE for this draft: ${openerStyle.toUpperCase()}
${OPENER_GUIDES[openerStyle]}

Now write the LinkedIn post. Grounded in the notes. No clichés. Make the first line earn attention.`

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
        // Push variety: default is 1.0 but we set it explicitly so we know.
        temperature: 1.0,
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

    return NextResponse.json({ post, openerStyle })
  } catch (err) {
    console.error("generate-post error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
