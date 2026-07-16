// ---------------------------------------------------------------------------
// Single entry point the UI calls. Routes to the free rule-based parser by
// default, or to Claude if explicitly enabled + reachable. Always falls back
// to rule-based on any Claude error so the app never hard-fails.
// ---------------------------------------------------------------------------

import { ParsedIntent } from "@/types";
import { parseCommandRuleBased } from "./rule-based-parser";
import { parseCommandViaClaude } from "./claude-parser";
import { USE_CLAUDE_PARSER } from "@/lib/stellar/config";

export async function parseCommand(input: string): Promise<ParsedIntent> {
  if (USE_CLAUDE_PARSER) {
    try {
      return await parseCommandViaClaude(input);
    } catch {
      // Fall through to local parser — never block the user because the
      // optional AI upgrade path is unavailable.
    }
  }
  return parseCommandRuleBased(input);
}
