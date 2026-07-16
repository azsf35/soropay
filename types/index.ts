// ---------------------------------------------------------------------------
// SoroPay shared type definitions
// ---------------------------------------------------------------------------

import { NetworkId } from "@/lib/stellar/network";

export type OperationType = "send" | "swap" | "balance" | "unknown";

/** Structured intent produced by the command parser (rule-based or LLM). */
export interface ParsedIntent {
  operation: OperationType;
  amount?: number;
  sourceAsset?: string; // e.g. "XLM", "USDC"
  destAsset?: string; // only for swap
  recipient?: string; // raw name or address as typed by the user
  raw: string; // original command text
  confidence: number; // 0-1, how sure the parser is
  error?: string; // set when parsing failed / operation is unclear
}

/** A resolved recipient — either from the contact book or a raw G... address. */
export interface ResolvedRecipient {
  name?: string;
  address: string;
  fromContacts: boolean;
}

/** Saved contact: friendly name -> Stellar address. */
export interface Contact {
  id: string;
  name: string;
  address: string;
  createdAt: string;
}

/** One asset balance line, as read from Horizon. */
export interface AssetBalance {
  asset: string; // "XLM" or asset code e.g. "USDC"
  code: string;
  issuer?: string;
  balance: string;
  limit?: string;
}

/** A built-but-unsigned transaction preview shown to the user before signing. */
export interface TransactionPreview {
  operation: OperationType;
  summary: string; // plain-language one-liner
  details: PreviewDetail[];
  xdr: string; // unsigned transaction envelope XDR
  networkPassphrase: string;
  estimatedFeeXlm: string;
  estimatedTimeSeconds: number;
  warnings: string[];
}

export interface PreviewDetail {
  label: string;
  value: string;
}

/** Local transaction history record, stored client-side. Tagged with the
 *  network it happened on so testnet/mainnet history never gets mixed up. */
export interface HistoryItem {
  id: string;
  label: string; // human-readable label, e.g. "Sent 20 USDC to Sara"
  hash?: string;
  status: "pending" | "success" | "failed";
  createdAt: string;
  operation: OperationType;
  network: NetworkId;
}

/** Chat message shown in the conversation UI. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  preview?: TransactionPreview;
}

/** Supported wallet connection kinds (mirrors the wallets-kit modules used). */
export type WalletId = "freighter" | "walletconnect" | "albedo" | "xbull";

export interface WalletConnection {
  id: WalletId;
  address: string;
  name: string;
}
