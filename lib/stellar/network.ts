// ---------------------------------------------------------------------------
// Runtime-switchable network config. Unlike a build-time env var, this lets
// the user flip between Testnet and Mainnet live in the app (see
// components/network-provider.tsx for the UI + confirmation gate).
//
// NOTE: Networks is imported from the /types subpath (not the package root)
// so this plain-data module never pulls in the wallet-kit's Preact-based
// modal UI code — that UI is only needed by lib/stellar/wallet-kit.ts, which
// is loaded lazily client-side only (see components/wallet-provider.tsx).
// ---------------------------------------------------------------------------

import { Networks } from "@creit.tech/stellar-wallets-kit/types";

export type NetworkId = "testnet" | "mainnet";

export interface NetworkConfig {
  id: NetworkId;
  label: string;
  horizonUrl: string;
  networkPassphrase: string;
  walletNetwork: Networks;
  friendbotUrl: string | null; // null on mainnet — no faucet for real funds
}

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  testnet: {
    id: "testnet",
    label: "Testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    walletNetwork: Networks.TESTNET,
    friendbotUrl: "https://friendbot.stellar.org",
  },
  mainnet: {
    id: "mainnet",
    label: "Mainnet",
    horizonUrl: "https://horizon.stellar.org",
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    walletNetwork: Networks.PUBLIC,
    friendbotUrl: null,
  },
};

export const DEFAULT_NETWORK: NetworkId =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK as NetworkId) === "mainnet"
    ? "mainnet"
    : "testnet";

export function getNetworkConfig(id: NetworkId): NetworkConfig {
  return NETWORKS[id];
}
