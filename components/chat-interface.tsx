"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ConfirmTransactionDialog } from "@/components/confirm-transaction-dialog";
import { useWallet } from "@/components/wallet-provider";
import { useNetwork } from "@/components/network-provider";
import { parseCommand } from "@/lib/parser/parse-command";
import { resolveRecipient } from "@/lib/storage/contacts";
import {
  buildSendPreview,
  buildSwapPreview,
  submitSignedTransaction,
  TransactionBuildError,
} from "@/lib/stellar/transactions";
import { fetchAccountInfo } from "@/lib/stellar/horizon";
import { addHistoryItem, updateHistoryStatus } from "@/lib/storage/history";
import { ChatMessage, TransactionPreview } from "@/types";
import { ArrowUp, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = ["send 20 USDC to Sara", "swap 50 XLM to USDC", "balance"];

function newMessage(role: ChatMessage["role"], text: string, preview?: TransactionPreview): ChatMessage {
  return { id: crypto.randomUUID(), role, text, createdAt: new Date().toISOString(), preview };
}

export function ChatInterface({ onTransactionSettled }: { onTransactionSettled: () => void }) {
  const { address, signXdr } = useWallet();
  const { network } = useNetwork();
  const [messages, setMessages] = useState<ChatMessage[]>([
    newMessage(
      "assistant",
      "Hi! I'm SoroPay. Try “send 20 USDC to Sara”, “swap 50 XLM to USDC”, or “balance”."
    ),
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activePreview, setActivePreview] = useState<TransactionPreview | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingHistoryLabel, setPendingHistoryLabel] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  const pushAssistant = (text: string, preview?: TransactionPreview) => {
    setMessages((m) => [...m, newMessage("assistant", text, preview)]);
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text) return;
    setMessages((m) => [...m, newMessage("user", text)]);
    setInput("");

    if (!address) {
      pushAssistant("Connect your wallet first so I know which account to use.");
      return;
    }

    setThinking(true);
    try {
      const intent = await parseCommand(text);

      if (intent.operation === "unknown" || !intent.operation) {
        pushAssistant(intent.error || "Sorry, I didn't understand that.");
        return;
      }

      if (intent.operation === "balance") {
        const info = await fetchAccountInfo(address, network);
        if (!info.exists) {
          pushAssistant(
            network === "testnet"
              ? "This account doesn't exist on-chain yet — fund it first from the Balances tab."
              : "This account doesn't exist on mainnet yet — send it real XLM from an exchange or another wallet first."
          );
          return;
        }
        const lines = info.balances.map((b) => `${parseFloat(b.balance).toFixed(4)} ${b.code}`);
        pushAssistant(`Your ${network} balances: ${lines.join(", ") || "none"}.`);
        return;
      }

      if (intent.operation === "send") {
        if (!intent.amount || !intent.sourceAsset || !intent.recipient) {
          pushAssistant("I need an amount, an asset, and a recipient — e.g. \"send 20 USDC to Sara\".");
          return;
        }
        const resolved = await resolveRecipient(intent.recipient);
        if (!resolved) {
          pushAssistant(
            `I don't recognize "${intent.recipient}" as a saved contact or a valid Stellar address. Add them in Contacts first, or use their full G... address.`
          );
          return;
        }
        const preview = await buildSendPreview({
          sourceAddress: address,
          destAddress: resolved.address,
          destLabel: resolved.name || `${resolved.address.slice(0, 6)}...`,
          assetCode: intent.sourceAsset,
          amount: intent.amount,
          network,
        });
        setPendingHistoryLabel(preview.summary);
        setActivePreview(preview);
        setDialogOpen(true);
        pushAssistant(`Here's what I'll do: ${preview.summary}. Review and confirm below.`, preview);
        return;
      }

      if (intent.operation === "swap") {
        if (!intent.amount || !intent.sourceAsset || !intent.destAsset) {
          pushAssistant("I need an amount and both assets — e.g. \"swap 50 XLM to USDC\".");
          return;
        }
        const preview = await buildSwapPreview({
          sourceAddress: address,
          sourceAssetCode: intent.sourceAsset,
          destAssetCode: intent.destAsset,
          amount: intent.amount,
          network,
        });
        setPendingHistoryLabel(preview.summary);
        setActivePreview(preview);
        setDialogOpen(true);
        pushAssistant(`Here's what I'll do: ${preview.summary}. Review and confirm below.`, preview);
        return;
      }
    } catch (err) {
      const message =
        err instanceof TransactionBuildError
          ? err.message
          : (err as Error).message || "Something went wrong building that transaction.";
      pushAssistant(message);
    } finally {
      setThinking(false);
    }
  };

  const handleConfirm = async () => {
    if (!activePreview) return;
    const historyItem = addHistoryItem({
      label: pendingHistoryLabel,
      status: "pending",
      operation: activePreview.operation,
      network,
    });
    try {
      const signedXdr = await signXdr(activePreview.xdr, activePreview.networkPassphrase);
      const result = await submitSignedTransaction(signedXdr, network);
      updateHistoryStatus(historyItem.id, result.successful ? "success" : "failed", result.hash);
      pushAssistant(
        result.successful
          ? `Done — ${pendingHistoryLabel}. Transaction hash: ${result.hash.slice(0, 10)}...`
          : `The transaction was submitted but failed on-chain.`
      );
    } catch (err) {
      updateHistoryStatus(historyItem.id, "failed");
      pushAssistant(`Signing/submission failed: ${(err as Error).message || "unknown error"}`);
    } finally {
      setDialogOpen(false);
      setActivePreview(null);
      onTransactionSettled();
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 pb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex animate-pop-in gap-2.5",
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {m.role === "assistant" && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet/20">
                <Sparkles className="h-3.5 w-3.5 text-violet" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[82%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
                m.role === "user"
                  ? "rounded-tr-md bg-primary font-medium text-primary-foreground"
                  : "rounded-tl-md border border-border/70 bg-card text-card-foreground"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex animate-pop-in items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet/20">
              <Sparkles className="h-3.5 w-3.5 text-violet" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-border/70 bg-card px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2 pb-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSend(s)}
            disabled={thinking}
            className="rounded-full border border-border/80 bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground active:scale-95 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="sticky bottom-[6.5rem] flex items-center gap-2 rounded-full border border-border/80 bg-card/90 p-1.5 pl-4 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)] backdrop-blur">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder='Try "send 20 USDC to Sara"'
          disabled={thinking}
          className="flex-1 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
        />
        <button
          onClick={() => handleSend()}
          disabled={thinking || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.6)] transition-transform active:scale-90 disabled:opacity-40"
        >
          {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>

      <ConfirmTransactionDialog
        preview={activePreview}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
