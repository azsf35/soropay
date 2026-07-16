"use client";

import { MessageCircle, Wallet, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "chat" | "balances" | "contacts" | "history";

const TABS: { id: TabId; label: string; icon: typeof MessageCircle }[] = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "balances", label: "Balances", icon: Wallet },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "history", label: "History", icon: Clock },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 safe-bottom">
      <div className="glass flex w-full max-w-md items-stretch gap-1 rounded-[1.4rem] border border-border/80 p-1.5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all duration-300 ease-out",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_4px_18px_-4px_hsl(var(--primary)/0.55)]"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-300",
                  isActive && "scale-105"
                )}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={cn(
                  "text-[10.5px] font-medium leading-none tracking-tight",
                  isActive ? "font-semibold" : ""
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
