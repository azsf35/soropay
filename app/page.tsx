"use client";

import { useState, useCallback } from "react";
import { WalletConnectButton } from "@/components/wallet-connect-button";
import { NetworkSwitcher } from "@/components/network-switcher";
import { ChatInterface } from "@/components/chat-interface";
import { BalancePanel } from "@/components/balance-panel";
import { ContactsPanel } from "@/components/contacts-panel";
import { HistoryPanel } from "@/components/history-panel";
import { BottomNav, TabId } from "@/components/bottom-nav";
import { useNetwork } from "@/components/network-provider";
import { AlertTriangle } from "lucide-react";

const TITLES: Record<TabId, { title: string; subtitle: string }> = {
  chat: { title: "Chat", subtitle: "Type it like you'd text a friend" },
  balances: { title: "Balances", subtitle: "What you're holding, right now" },
  contacts: { title: "Contacts", subtitle: "Names instead of long addresses" },
  history: { title: "History", subtitle: "Every send and swap, labeled" },
};

export default function HomePage() {
  const [tab, setTab] = useState<TabId>("chat");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const bumpHistory = useCallback(() => setHistoryRefreshKey((k) => k + 1), []);
  const { network } = useNetwork();

  return (
    <div className="relative z-10 min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-border/70 glass">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.6)]">
              <span className="font-display text-base font-bold">S</span>
            </div>
            <div className="leading-none">
              <p className="font-display text-lg font-bold">SoroPay</p>
              <p className="text-[11px] text-muted-foreground">Talk to your wallet</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NetworkSwitcher />
            <WalletConnectButton />
          </div>
        </div>

        {network === "mainnet" && (
          <div className="flex items-center gap-2 border-t border-destructive/30 bg-destructive/10 px-5 py-1.5 text-[11px] font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            You&apos;re on Mainnet — real funds, no undo.
          </div>
        )}
      </header>

      <main className="mx-auto max-w-md px-4 pb-32 pt-5">
        <div key={tab} className="animate-fade-slide-up">
          <div className="mb-4 px-1">
            <h1 className="font-display text-2xl font-bold">{TITLES[tab].title}</h1>
            <p className="text-sm text-muted-foreground">{TITLES[tab].subtitle}</p>
          </div>

          {tab === "chat" && <ChatInterface onTransactionSettled={bumpHistory} />}
          {tab === "balances" && <BalancePanel />}
          {tab === "contacts" && <ContactsPanel />}
          {tab === "history" && <HistoryPanel refreshKey={historyRefreshKey} />}
        </div>
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
