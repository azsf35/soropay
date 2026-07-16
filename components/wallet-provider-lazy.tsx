"use client";

// ---------------------------------------------------------------------------
// Loads WalletProvider client-side ONLY (ssr: false). WalletProvider pulls in
// the wallet-kit's Preact-based modal UI (for the "Connect Wallet" picker),
// which isn't SSR-safe. Deferring the import here means that code is never
// evaluated during server rendering / static generation of any page —
// including Next's own auto-generated 404/error pages.
// ---------------------------------------------------------------------------

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const WalletProviderInner = dynamic(
  () => import("@/components/wallet-provider").then((m) => m.WalletProvider),
  { ssr: false }
);

export function LazyWalletProvider({ children }: { children: ReactNode }) {
  return <WalletProviderInner>{children}</WalletProviderInner>;
}
