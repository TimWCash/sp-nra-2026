import { NextResponse } from "next/server"
import { SERVICE_PHYSICS_LINKEDIN_STYLE } from "@/lib/linkedinStyle"

/**
 * Turns session notes into a LinkedIn post draft via Claude.
 * Uses Haiku (cheapest tier) — this is a short-form generation task.
 * Configure by dropping ANTHROPIC_API_KEY into Vercel env vars.
 *
 * Voice + structure is controlled by lib/linkedinStyle.ts — edit that file
 * to tune how drafts sound without touching this logic.
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
  stat: `HOOK STYLE: lead with a specific number or data point lifted from the notes. No throat-clearing. Just the number and the tension inside it.
Example flavor (don't copy — ground yours in the actual notes):
"60% of operators are raising prices again in 2026. Most still can't tell you where the margin went."`,

  scene: `HOOK STYLE: open with a concrete moment from the room — sensory, specific, physical. Then pivot to what it means.
Example flavor:
"Room was packed. Standing-room only. That tells you everything about where operators' heads are right now."`,

  contrarian: `HOOK STYLE: challenge a conventional assumption. State the popular view in one line, then push back using what the notes say.
Example flavor:
"Everyone says cross-training solves retention. Today made me think we've been solving the wrong problem."`,

  question: `HOOK STYLE: open with a pointed, specific question a real operator would chew on. Not rhetorical fluff, not "what do you think?"
Example flavor:
"If your labor model breaks when one shift leader calls out, is it actually a model?"`,

  observation: `HOOK STYLE: open with an unexpected pattern or tension nobody's saying out loud. Specific, not generic.
Example flavor:
"Three sessions today. Zero mention of the guest. That's its own data point."`,
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

  const length = body.length || "medium"
  const openerStyle = pickStyle(body.openerStyle)

  const lengthGuide =
    length === "short"
      ? "Target length: 60-100 words. 1-2 short paragraphs plus hashtags."
      : "Target length: 120-180 words. 2-3 short paragraphs plus hashtags."

  const notesBlock = cleaned
    .map((n) => `- ${n.author ? `[${n.author}] ` : ""}${n.content}`)
    .join("\n")

  const system = `You are drafting a LinkedIn post for Service Physics, a restaurant-operations consulting firm, based on raw notes from a team member who attended a session at NRA Show 2026. Write from that attendee's first-person perspective, in Service Physics' proven voice.

Follow this style guide EXACTLY:

${SERVICE_PHYSICS_LINKEDIN_STYLE}

Additional rules specific to session-notes drafts:
- Ground EVERYTHING in the notes. Do NOT invent stats, quotes, speaker names, or details that aren't in the notes.
- If the notes are thin, lean into the ONE specific thing that stood out. Don't pad with generic industry commentary.
- The post is a DRAFT — someone will edit it before publishing. But hand them something strong, not a scaffold.
- Do NOT wrap the output in quotes. Do NOT say "Here's a draft:". Output ONLY the post body (including hashtags at the end).`

  const user = `Session: ${body.sessionTitle || "(unknown)"}
${body.sessionCategory ? `Category: ${body.sessionCategory}\n` : ""}${body.sessionLocation ? `Location: ${body.sessionLocation}\n` : ""}${body.sessionDay ? `Day: ${body.sessionDay}\n` : ""}
Notes from the team member(s) who attended:
${notesBlock}

${lengthGuide}

For THIS draft, use this opening style: ${openerStyle.toUpperCase()}
${OPENER_GUIDES[openerStyle]}

Now write the LinkedIn post. Follow the Hook → Story → Insight → Ending structure. Sound like Steve. Ground every detail in the notes. End with a line that sticks — not a question, not a pitch. Finish with 3-5 relevant hashtags.`

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
