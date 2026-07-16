// ---------------------------------------------------------------------------
// Contact book: name -> Stellar address. Persists to localStorage by default
// (works offline, zero backend needed). If USE_SUPABASE is true and you've
// wired lib/storage/supabase.ts, swap these calls for Supabase queries —
// every UI component only talks to this file, not to storage directly.
// ---------------------------------------------------------------------------

import { Contact } from "@/types";
import { USE_SUPABASE } from "@/lib/stellar/config";

const STORAGE_KEY = "soropay_contacts";

function readAll(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Contact[]) : [];
  } catch {
    return [];
  }
}

function writeAll(contacts: Contact[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

export async function listContacts(): Promise<Contact[]> {
  if (USE_SUPABASE) {
    // TODO once Supabase is configured: replace with a `select * from contacts`
    // query scoped to the connected wallet address.
    return readAll();
  }
  return readAll();
}

export async function addContact(name: string, address: string): Promise<Contact> {
  const contacts = readAll();
  const existing = contacts.find(
    (c) => c.name.toLowerCase() === name.toLowerCase()
  );
  if (existing) {
    throw new Error(`A contact named "${name}" already exists.`);
  }
  const contact: Contact = {
    id: crypto.randomUUID(),
    name,
    address,
    createdAt: new Date().toISOString(),
  };
  contacts.push(contact);
  writeAll(contacts);
  return contact;
}

export async function deleteContact(id: string): Promise<void> {
  const contacts = readAll().filter((c) => c.id !== id);
  writeAll(contacts);
}

/** Resolve a recipient string typed by the user: either a saved contact name
 *  or a raw Stellar G... address. Returns null if it matches neither. */
export async function resolveRecipient(
  input: string
): Promise<{ name?: string; address: string } | null> {
  const trimmed = input.trim();
  if (/^G[A-Z2-7]{55}$/.test(trimmed)) {
    return { address: trimmed };
  }
  const contacts = readAll();
  const match = contacts.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  return match ? { name: match.name, address: match.address } : null;
}
