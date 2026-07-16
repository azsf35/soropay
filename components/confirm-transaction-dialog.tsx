"use client";

// ---------------------------------------------------------------------------
// The in-app human-readable confirmation shown BEFORE any wallet signature.
// This is the "popup on the website" step: full plain-language preview +
// explicit Confirm button. Only after Confirm does the wallet (Freighter /
// WalletConnect / etc.) get asked for a single signature.
// ---------------------------------------------------------------------------

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { TransactionPreview } from "@/types";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  preview: TransactionPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmTransactionDialog({ preview, open, onOpenChange, onConfirm }: Props) {
  const [submitting, setSubmitting] = useState(false);

  if (!preview) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <DialogContent className="rounded-3xl border-border/70 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
              <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            </span>
            Confirm transaction
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">{preview.summary}</p>

        <Separator />

        <div className="space-y-2.5 rounded-2xl bg-muted/40 p-3.5">
          {preview.details.map((d) => (
            <div key={d.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{d.label}</span>
              <span className="font-medium">{d.value}</span>
            </div>
          ))}
        </div>

        {preview.warnings.length > 0 && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1">
                {preview.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <p className="text-xs text-muted-foreground">
          Confirming will ask your wallet for one signature. SoroPay never sees or stores your
          private key.
        </p>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm & Sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
