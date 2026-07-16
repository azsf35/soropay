// ---------------------------------------------------------------------------
// OPTIONAL upgrade path: fuzzier natural-language parsing via Claude.
// Only activates when NEXT_PUBLIC_USE_CLAUDE_PARSER=true AND the server route
// below has ANTHROPIC_API_KEY configured. Until then, parse-command.ts uses
// the free rule-based parser and this file is inert.
//
// This calls OUR OWN /api/parse route (server-side), never the Anthropic API
// directly from the browser — so the API key never reaches the client.
// ---------------------------------------------------------------------------

import { ParsedIntent } from "@/types";

export async function parseCommandViaClaude(input: string): Promise<ParsedIntent> {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command: input }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Claude parsing failed.");
  }

  return (await res.json()) as ParsedIntent;
}
