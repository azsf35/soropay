// ---------------------------------------------------------------------------
// Unified wallet connection: Freighter (desktop extension) AND WalletConnect
// (mobile wallets like Lobstr) AND Albedo/xBull, all through one kit so the
// same "Connect Wallet" button works whether the user is on desktop or
// mobile, and on either Testnet or Mainnet.
//
// Uses @creit.tech/stellar-wallets-kit v2.x static API (StellarWalletsKit.*).
// ---------------------------------------------------------------------------

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { WalletConnectModule } from "@creit.tech/stellar-wallets-kit/modules/wallet-connect";
import { NetworkId, getNetworkConfig } from "./network";

/**
 * WalletConnect requires a project ID from https://cloud.reown.com (free tier).
 * Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in .env.local. Until then, the
 * WalletConnect module is skipped and Freighter/Albedo/xBull still work.
 */
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

let initialized = false;
let currentNetwork: NetworkId | null = null;

/** Must run once, client-side only, before any other kit call. */
export function initWalletKit(network: NetworkId): void {
  if (typeof window === "undefined") return;

  if (!initialized) {
    const modules = [new FreighterModule(), new AlbedoModule(), new xBullModule()];

    if (WC_PROJECT_ID) {
      modules.push(
        new WalletConnectModule({
          projectId: WC_PROJECT_ID,
          metadata: {
            name: "SoroPay",
            description: "SoroPay — talk to your Stellar wallet",
            url: window.location.origin,
            icons: [],
          },
        })
      );
    }

    StellarWalletsKit.init({ modules, network: getNetworkConfig(network).walletNetwork });
    initialized = true;
    currentNetwork = network;
    return;
  }

  // Kit already initialized — just switch the active network in place
  // (e.g. user flips the Testnet/Mainnet toggle after already connecting).
  if (currentNetwork !== network) {
    StellarWalletsKit.setNetwork(getNetworkConfig(network).walletNetwork);
    currentNetwork = network;
  }
}

export interface ConnectResult {
  address: string;
  walletId: string;
  walletName: string;
}

/** Opens the kit's built-in wallet picker modal (shows Freighter, WalletConnect, etc.) */
export async function openWalletSelector(
  network: NetworkId,
  onConnected: (result: ConnectResult) => void,
  onError: (err: Error) => void
): Promise<void> {
  initWalletKit(network);
  try {
    const { address } = await StellarWalletsKit.authModal();
    let walletId = "";
    let walletName = "Wallet";
    try {
      const mod = StellarWalletsKit.selectedModule;
      walletId = mod.productId;
      walletName = mod.productName;
    } catch {
      // selection info unavailable — address is still valid
    }
    onConnected({ address, walletId, walletName });
  } catch (err) {
    const message =
      (err as { message?: string })?.message || "Failed to connect wallet.";
    onError(new Error(message));
  }
}

/** Signs a transaction XDR with the currently-selected wallet. */
export async function signTransactionXdr(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase,
  });
  return signedTxXdr;
}

export async function disconnectWallet(): Promise<void> {
  try {
    await StellarWalletsKit.disconnect();
  } catch {
    // already disconnected — ignore
  }
}
