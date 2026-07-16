// ---------------------------------------------------------------------------
// Zero-cost local command parser. Handles the three MVP intents:
//   "send 20 USDC to Sara"
//   "swap 50 XLM to USDC"
//   "balance" / "what's my balance" / "show my balances"
// This is what runs by default (no API key, no cost). If you later add a
// Claude API key, flip NEXT_PUBLIC_USE_CLAUDE_PARSER=true and wire
// lib/parser/claude-parser.ts — parse-command.ts already routes for you.
// ---------------------------------------------------------------------------

import { ParsedIntent } from "@/types";

const SEND_RE =
  /^\s*send\s+([\d.]+)\s*([a-zA-Z]+)\s+to\s+(.+?)\s*$/i;

const SWAP_RE =
  /^\s*swap\s+([\d.]+)\s*([a-zA-Z]+)\s+(?:to|for|into)\s+([a-zA-Z]+)\s*$/i;

const BALANCE_RE = /balance|how much (do i have|do i own)/i;

export function parseCommandRuleBased(input: string): ParsedIntent {
  const raw = input.trim();

  const sendMatch = raw.match(SEND_RE);
  if (sendMatch) {
    const [, amountStr, asset, recipient] = sendMatch;
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      return {
        operation: "unknown",
        raw,
        confidence: 0,
        error: "I couldn't understand the amount. Try: \"send 20 USDC to Sara\"",
      };
    }
    return {
      operation: "send",
      amount,
      sourceAsset: asset.toUpperCase(),
      recipient: recipient.trim(),
      raw,
      confidence: 0.9,
    };
  }

  const swapMatch = raw.match(SWAP_RE);
  if (swapMatch) {
    const [, amountStr, fromAsset, toAsset] = swapMatch;
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      return {
        operation: "unknown",
        raw,
        confidence: 0,
        error: "I couldn't understand the amount. Try: \"swap 50 XLM to USDC\"",
      };
    }
    return {
      operation: "swap",
      amount,
      sourceAsset: fromAsset.toUpperCase(),
      destAsset: toAsset.toUpperCase(),
      raw,
      confidence: 0.9,
    };
  }

  if (BALANCE_RE.test(raw)) {
    return { operation: "balance", raw, confidence: 0.95 };
  }

  return {
    operation: "unknown",
    raw,
    confidence: 0,
    error:
      'I didn\'t understand that. Try things like "send 20 USDC to Sara", "swap 50 XLM to USDC", or "balance".',
  };
}
