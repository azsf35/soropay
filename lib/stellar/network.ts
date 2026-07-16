// ---------------------------------------------------------------------------
// Runtime-switchable network config. Unlike a build-time env var, this lets
// the user flip between Testnet and Mainnet live in the app (see
// components/network-provider.tsx for the UI + confirmation gate).
// ---------------------------------------------------------------------------

import { Networks } from "@creit.tech/stellar-wallets-kit";

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
