// ---------------------------------------------------------------------------
// Server-side route: turns free-text into structured intent via Claude.
// Only reachable/used when NEXT_PUBLIC_USE_CLAUDE_PARSER=true on the client
// AND ANTHROPIC_API_KEY is set here (server env, never exposed to browser).
// The AI is advisory-only: it NEVER signs or executes anything — it only
// returns JSON that the client then builds a transaction preview from.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You convert a user's plain-language Stellar wallet command into strict JSON.
Output ONLY valid JSON matching this shape, nothing else:
{
  "operation": "send" | "swap" | "balance" | "unknown",
  "amount": number | null,
  "sourceAsset": string | null,
  "destAsset": string | null,
  "recipient": string | null,
  "confidence": number,
  "error": string | null
}
Rules:
- "send" needs amount, sourceAsset, recipient.
- "swap" needs amount, sourceAsset, destAsset.
- "balance" needs nothing else.
- If the command is unclear, set operation to "unknown" and put a helpful message in "error".
- Never include any text outside the JSON object.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Claude parsing is not configured on this server." },
      { status: 501 }
    );
  }

  const { command } = await request.json();
  if (!command || typeof command !== "string") {
    return NextResponse.json({ error: "Missing command." }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: command }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return NextResponse.json(
        { error: `Claude API error: ${errBody}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json({
      operation: parsed.operation ?? "unknown",
      amount: parsed.amount ?? undefined,
      sourceAsset: parsed.sourceAsset ?? undefined,
      destAsset: parsed.destAsset ?? undefined,
      recipient: parsed.recipient ?? undefined,
      raw: command,
      confidence: parsed.confidence ?? 0.5,
      error: parsed.error ?? undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to parse command: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
