"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { HistoryItem } from "@/types";
import { listHistory } from "@/lib/storage/history";
import { useNetwork } from "@/components/network-provider";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<HistoryItem["status"], string> = {
  success: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
  pending: "bg-muted text-muted-foreground",
};

const STATUS_ICON: Record<HistoryItem["status"], React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
  pending: <Loader2 className="h-4 w-4 animate-spin" />,
};

export function HistoryPanel({ refreshKey }: { refreshKey?: number }) {
  const { network } = useNetwork();
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // Only show history for the currently active network — testnet and
    // mainnet transactions are never mixed in the same list.
    setItems(listHistory().filter((h) => h.network === network));
  }, [refreshKey, network]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 py-10 text-center">
        <Clock className="h-8 w-8 text-muted-foreground/60" />
        <p className="max-w-[220px] text-sm text-muted-foreground">
          No {network} transactions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", STATUS_STYLE[item.status])}>
              {STATUS_ICON[item.status]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Badge className={cn("shrink-0 rounded-full border-0 capitalize", STATUS_STYLE[item.status])}>
            {item.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
