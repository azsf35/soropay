"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Contact } from "@/types";
import { listContacts, addContact, deleteContact } from "@/lib/storage/contacts";
import { Trash2, Plus, Users, AlertCircle } from "lucide-react";

const AVATAR_HUES = ["bg-primary/15 text-primary", "bg-violet/15 text-violet", "bg-success/15 text-success"];

function hueFor(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_HUES[sum % AVATAR_HUES.length];
}

export function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setContacts(await listContacts());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    setError(null);
    if (!name.trim() || !address.trim()) {
      setError("Name and address are both required.");
      return;
    }
    if (!/^G[A-Z2-7]{55}$/.test(address.trim())) {
      setError("That doesn't look like a valid Stellar address (should start with G and be 56 characters).");
      return;
    }
    try {
      await addContact(name.trim(), address.trim());
      setName("");
      setAddress("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteContact(id);
    await load();
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact-name" className="text-[11px] text-muted-foreground">Name</Label>
            <Input
              id="contact-name"
              placeholder="Sara"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 rounded-xl"
            />
          </div>
          <div>
            <Label htmlFor="contact-address" className="text-[11px] text-muted-foreground">Stellar address</Label>
            <Input
              id="contact-address"
              placeholder="GABC...XYZ"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 rounded-xl font-mono text-xs"
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          className="w-full gap-1.5 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add contact
        </Button>
      </div>

      <div className="space-y-2.5">
        {contacts.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/80 py-8 text-center">
            <Users className="h-7 w-7 text-muted-foreground/60" />
            <p className="max-w-[220px] text-sm text-muted-foreground">
              No contacts yet — add one above, or just send using a raw address.
            </p>
          </div>
        )}
        {contacts.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3 transition-colors hover:border-primary/30"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${hueFor(c.id)}`}>
                {c.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium">{c.name}</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">{c.address}</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
