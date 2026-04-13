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
              text: `Extract contact information from this business card. Return ONLY a JSON object with these fields (use empty string if not found):
{
  "name": "full name",
  "title": "job title",
  "company": "company name",
  "email": "email address",
  "phone": "phone number",
  "notes": "any other relevant info like website or address"
}
Return only the JSON, no other text.`,
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    // Strip markdown code blocks if Claude wrapped the JSON
    const cleaned = text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    const parsed = JSON.parse(cleaned)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("Card scan error:", err)
    return NextResponse.json({ error: "Failed to scan card" }, { status: 500 })
  }
}
