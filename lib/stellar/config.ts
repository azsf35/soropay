// ---------------------------------------------------------------------------
// Non-network app configuration. Network selection (testnet/mainnet) now
// lives in lib/stellar/network.ts + components/network-provider.tsx since
// it's runtime-switchable, not a fixed build-time value.
// ---------------------------------------------------------------------------

// Soroswap aggregator API — used opportunistically for swap routing when
// NEXT_PUBLIC_SOROSWAP_API_KEY is configured. Falls back to the native
// Stellar DEX (path payment strict send) when it is not, so swaps still
// work with zero external accounts required.
export const SOROSWAP_API_URL =
  process.env.NEXT_PUBLIC_SOROSWAP_API_URL || "https://api.soroswap.finance";
export const SOROSWAP_API_KEY = process.env.NEXT_PUBLIC_SOROSWAP_API_KEY || "";

// Claude API — optional. When NEXT_PUBLIC_USE_CLAUDE_PARSER is not "true"
// (or no key/route is configured), SoroPay uses the local rule-based parser
// in lib/parser/rule-based-parser.ts at zero API cost.
export const USE_CLAUDE_PARSER =
  process.env.NEXT_PUBLIC_USE_CLAUDE_PARSER === "true";

// Supabase — optional. When these are unset, contacts/history persist to
// localStorage instead, so the app is fully usable with no backend account.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
