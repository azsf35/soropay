// ---------------------------------------------------------------------------
// Transaction history: human-readable labels + status, persisted locally.
// ---------------------------------------------------------------------------

import { HistoryItem } from "@/types";

const STORAGE_KEY = "soropay_history";

function readAll(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: HistoryItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listHistory(): HistoryItem[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addHistoryItem(item: Omit<HistoryItem, "id" | "createdAt">): HistoryItem {
  const full: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const items = readAll();
  items.push(full);
  writeAll(items);
  return full;
}

export function updateHistoryStatus(
  id: string,
  status: HistoryItem["status"],
  hash?: string
): void {
  const items = readAll().map((h) =>
    h.id === id ? { ...h, status, hash: hash ?? h.hash } : h
  );
  writeAll(items);
}
