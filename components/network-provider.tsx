"use client";

// ---------------------------------------------------------------------------
// App-wide network selection (Testnet <-> Mainnet), persisted locally.
// Switching TO mainnet requires an explicit confirmation (real funds, no
// undo) — this is a deliberate safety gate, not just a toggle.
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { NetworkId, DEFAULT_NETWORK, getNetworkConfig } from "@/lib/stellar/network";

interface NetworkContextValue {
  network: NetworkId;
  /** Attempts to switch network. Returns true if it needs confirmation first
   *  (caller should show the confirm dialog) — the actual switch happens via
   *  confirmSwitchToMainnet() once the user agrees. */
  requestNetworkChange: (target: NetworkId) => void;
  pendingConfirmation: boolean;
  confirmSwitchToMainnet: () => void;
  cancelSwitch: () => void;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);
const STORAGE_KEY = "soropay_network";

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<NetworkId>(DEFAULT_NETWORK);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as NetworkId | null;
    if (saved === "testnet" || saved === "mainnet") {
      setNetworkState(saved);
    }
  }, []);

  const setNetwork = useCallback((n: NetworkId) => {
    setNetworkState(n);
    window.localStorage.setItem(STORAGE_KEY, n);
  }, []);

  const requestNetworkChange = useCallback(
    (target: NetworkId) => {
      if (target === network) return;
      if (target === "mainnet") {
        // Real funds — require explicit confirmation before switching.
        setPendingConfirmation(true);
        return;
      }
      setNetwork(target);
    },
    [network, setNetwork]
  );

  const confirmSwitchToMainnet = useCallback(() => {
    setNetwork("mainnet");
    setPendingConfirmation(false);
  }, [setNetwork]);

  const cancelSwitch = useCallback(() => {
    setPendingConfirmation(false);
  }, []);

  return (
    <NetworkContext.Provider
      value={{ network, requestNetworkChange, pendingConfirmation, confirmSwitchToMainnet, cancelSwitch }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}

export function useNetworkConfig() {
  const { network } = useNetwork();
  return getNetworkConfig(network);
}
