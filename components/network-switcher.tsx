"use client";

import { useNetwork } from "@/components/network-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function NetworkSwitcher() {
  const { network, requestNetworkChange, pendingConfirmation, confirmSwitchToMainnet, cancelSwitch } =
    useNetwork();

  return (
    <>
      <div className="flex items-center rounded-full border border-border bg-muted/60 p-0.5 text-[10px] font-semibold uppercase tracking-wide">
        <button
          onClick={() => requestNetworkChange("testnet")}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            network === "testnet"
              ? "bg-foreground text-background"
              : "text-muted-foreground"
          }`}
        >
          Testnet
        </button>
        <button
          onClick={() => requestNetworkChange("mainnet")}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            network === "mainnet"
              ? "bg-destructive text-destructive-foreground"
              : "text-muted-foreground"
          }`}
        >
          Mainnet
        </button>
      </div>

      <Dialog open={pendingConfirmation} onOpenChange={(open) => !open && cancelSwitch()}>
        <DialogContent className="rounded-3xl border-destructive/40 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/15">
                <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
              </span>
              Switch to Mainnet?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>You&apos;re about to switch SoroPay to Stellar <strong className="text-foreground">Mainnet</strong>.</p>
            <p>
              Every send/swap from here on uses <strong className="text-foreground">real XLM, USDC, or EURC</strong> —
              there is no faucet, no undo, and no test money. Any connected wallet will be
              disconnected so you can reconnect against the correct network.
            </p>
            <p>Only continue if you mean to move real funds.</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={cancelSwitch} className="rounded-full">
              Stay on Testnet
            </Button>
            <Button
              onClick={confirmSwitchToMainnet}
              className="rounded-full bg-destructive font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              I understand, switch to Mainnet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
