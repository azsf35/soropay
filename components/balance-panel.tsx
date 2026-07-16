"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWallet } from "@/components/wallet-provider";
import { useNetwork } from "@/components/network-provider";
import { fetchAccountInfo, fundTestnetAccount } from "@/lib/stellar/horizon";
import { AssetBalance } from "@/types";
import { AlertCircle, RefreshCw, Loader2, Wallet } from "lucide-react";

const ASSET_ACCENTS: Record<string, string> = {
  XLM: "bg-primary/15 text-primary",
  USDC: "bg-violet/15 text-violet",
  EURC: "bg-success/15 text-success",
};

export function BalancePanel() {
  const { address } = useWallet();
  const { network } = useNetwork();
  const [balances, setBalances] = useState<AssetBalance[] | null>(null);
  const [accountExists, setAccountExists] = useState(true);
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const info = await fetchAccountInfo(address, network);
      setBalances(info.balances);
      setAccountExists(info.exists);
    } catch (err) {
      setError((err as Error).message || "Failed to load balances.");
    } finally {
      setLoading(false);
    }
  }, [address, network]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFund = async () => {
    if (!address) return;
    setFunding(true);
    try {
      await fundTestnetAccount(address, network);
      await load();
    } catch (err) {
      setError((err as Error).message || "Friendbot funding failed.");
    } finally {
      setFunding(false);
    }
  };

  if (!address) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 bg-card/40 py-10 text-center">
        <Wallet className="h-8 w-8 text-muted-foreground/60" />
        <p className="max-w-[220px] text-sm text-muted-foreground">
          Connect a wallet to see your balances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={loading}
          className="h-8 gap-1.5 rounded-full text-xs text-muted-foreground"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!accountExists && network === "testnet" && (
        <Alert className="rounded-2xl border-primary/30 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle>Account not funded yet</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>This testnet account doesn&apos;t exist on-chain yet.</span>
            <Button
              size="sm"
              onClick={handleFund}
              disabled={funding}
              className="w-fit rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {funding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fund with Friendbot"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!accountExists && network === "mainnet" && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Account not funded yet</AlertTitle>
          <AlertDescription>
            This mainnet account doesn&apos;t exist on-chain yet. Send it at least 1 real XLM
            from an exchange or another wallet to activate it — there is no faucet on mainnet.
          </AlertDescription>
        </Alert>
      )}

      {loading && !balances && (
        <div className="space-y-2">
          <div className="h-16 animate-pulse rounded-2xl bg-muted/50" />
          <div className="h-16 animate-pulse rounded-2xl bg-muted/50" />
        </div>
      )}

      {balances && balances.length === 0 && accountExists && (
        <p className="text-sm text-muted-foreground">No balances found.</p>
      )}

      {balances && balances.length > 0 && (
        <div className="space-y-2.5">
          {balances.map((b) => (
            <div
              key={b.asset + (b.issuer ?? "")}
              className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3.5 transition-colors hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-xs font-bold ${
                    ASSET_ACCENTS[b.code] ?? "bg-muted text-muted-foreground"
                  }`}
                >
                  {b.code.slice(0, 1)}
                </div>
                <span className="font-medium">{b.code}</span>
              </div>
              <span className="font-display text-base tabular-nums">
                {parseFloat(b.balance).toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
