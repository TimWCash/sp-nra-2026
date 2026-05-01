import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const { imageBase64, mediaType } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Extract contact information from this image. It may be a business card or a conference/event badge. Return ONLY a JSON object with these exact fields (use empty string if not found):
{
  "name": "full name",
  "title": "job title",
  "company": "company or organization name",
  "email": "email address",
  "phone": "phone number",
  "notes": "any other relevant info like website, address, or badge/event details"
}
Return only valid JSON, no markdown, no explanation.`,
            },
          ],
        },
      ],
    })

    // Defensive read — Claude can occasionally return an empty content array
    // or a non-text first block. Treat any of those as "scan didn't find
    // anything" rather than crashing into the catch block.
    const firstBlock = response.content?.[0]
    const text = firstBlock && firstBlock.type === "text" ? firstBlock.text : ""

    // Strip markdown code blocks if present
    const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")

    let parsed: Record<string, string> = {}
    if (cleaned) {
      try {
        const raw = JSON.parse(cleaned)
        if (raw && typeof raw === "object") {
          // Coerce every field to string so downstream callers don't get null/undefined.
          for (const k of ["name", "title", "company", "email", "phone", "notes"]) {
            parsed[k] = typeof raw[k] === "string" ? raw[k] : ""
          }
        }
      } catch {
        // Not valid JSON — fall through with empty parsed; user fills in manually.
      }
    }

    // Build a LinkedIn Google search URL from name + company
    const query = [parsed.name, parsed.company].filter(Boolean).join(" ")
    parsed.linkedinSearchUrl = query
      ? `https://www.google.com/search?q=site:linkedin.com/in+${encodeURIComponent(query)}`
      : ""

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Card scan error:", err)
    return NextResponse.json({ error: "Failed to scan card" }, { status: 500 })
  }
}
