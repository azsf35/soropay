"use client";

import { Button } from "@/components/ui/button";
import { useWallet } from "@/components/wallet-provider";
import { Loader2, LogOut, Sparkles } from "lucide-react";

function truncate(address: string): string {
  return `${address.slice(0, 4)}···${address.slice(-4)}`;
}

export function WalletConnectButton() {
  const { address, connecting, connect, disconnect } = useWallet();

  if (address) {
    return (
      <button
        onClick={disconnect}
        className="group flex items-center gap-2 rounded-full border border-border bg-muted/70 py-1.5 pl-1.5 pr-3 text-xs font-medium transition-colors hover:border-destructive/50 hover:bg-destructive/10"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
          <span className="h-2 w-2 rounded-full bg-success" />
        </span>
        <span className="tabular-nums text-foreground/90">{truncate(address)}</span>
        <LogOut className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-destructive" />
      </button>
    );
  }

  return (
    <Button
      onClick={connect}
      disabled={connecting}
      size="sm"
      className="gap-1.5 rounded-full bg-primary px-4 font-semibold text-primary-foreground shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.6)] hover:bg-primary/90"
    >
      {connecting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      Connect
    </Button>
  );
}
