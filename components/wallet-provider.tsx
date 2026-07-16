"use client";

// ---------------------------------------------------------------------------
// App-wide wallet connection context. Wraps the wallets-kit so any component
// can read the connected address and trigger connect/disconnect/sign.
// Network-aware: reconnecting after a network switch re-opens the wallet
// picker against the new network rather than silently reusing a stale
// testnet/mainnet session.
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  openWalletSelector,
  signTransactionXdr,
  disconnectWallet as disconnectKit,
} from "@/lib/stellar/wallet-kit";
import { useNetwork } from "@/components/network-provider";

interface WalletContextValue {
  address: string | null;
  walletName: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  signXdr: (xdr: string, networkPassphrase: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const LAST_WALLET_KEY = "soropay_last_wallet";

export function WalletProvider({ children }: { children: ReactNode }) {
  const { network } = useNetwork();
  const [address, setAddress] = useState<string | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Best-effort restore of address label from a previous session so the UI
    // doesn't flash "disconnected" on refresh. Re-signing still requires the
    // wallet extension/app to be present, unlocked, and reselected.
    const saved = window.localStorage.getItem(LAST_WALLET_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { address: string; walletName: string };
        setAddress(parsed.address);
        setWalletName(parsed.walletName);
      } catch {
        // ignore corrupt cache
      }
    }
  }, []);

  // If the network changes while a wallet is connected, force a fresh
  // reconnect — signatures must always match the network the user actually
  // intends, especially when that's mainnet.
  useEffect(() => {
    if (address) {
      setAddress(null);
      setWalletName(null);
      window.localStorage.removeItem(LAST_WALLET_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  const connect = useCallback(() => {
    setConnecting(true);
    setError(null);
    openWalletSelector(
      network,
      (result) => {
        setAddress(result.address);
        setWalletName(result.walletName);
        setConnecting(false);
        window.localStorage.setItem(
          LAST_WALLET_KEY,
          JSON.stringify({ address: result.address, walletName: result.walletName })
        );
      },
      (err) => {
        setError(err.message || "Failed to connect wallet.");
        setConnecting(false);
      }
    );
  }, [network]);

  const disconnect = useCallback(() => {
    disconnectKit().finally(() => {
      setAddress(null);
      setWalletName(null);
      window.localStorage.removeItem(LAST_WALLET_KEY);
    });
  }, []);

  const signXdr = useCallback(async (xdr: string, networkPassphrase: string) => {
    return signTransactionXdr(xdr, networkPassphrase);
  }, []);

  return (
    <WalletContext.Provider
      value={{ address, walletName, connecting, error, connect, disconnect, signXdr }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
