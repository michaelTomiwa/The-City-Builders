"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pop } from "./motion";

export type Wish = { id: string; name: string; message: string; created_at: string };

const field =
  "w-full border-0 border-b border-[var(--wed-indigo)]/25 bg-transparent px-0 py-2.5 text-lg text-[var(--wed-indigo)] placeholder:text-[var(--wed-indigo)]/40 focus:border-[var(--wed-coral)] focus:outline-none focus:ring-0";

/** Guests leave a prayer or a wish; it shows on the wall straight away. */
export function Wishes({ wedding, initial }: { wedding: string; initial: Wish[] }) {
  const [wishes, setWishes] = useState(initial);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const el = e.currentTarget;
    const form = new FormData(el);
    if ((form.get("website") as string)?.trim()) return;
    const name = String(form.get("name") ?? "").trim().slice(0, 120);
    const message = String(form.get("message") ?? "").trim().slice(0, 600);
    if (!name || !message) return;
    setStatus("sending");
    const { error } = await supabase.from("wedding_wishes").insert({ wedding, name, message });
    if (error) return setStatus("error");
    setWishes((w) => [{ id: `new-${Date.now()}`, name, message, created_at: new Date().toISOString() }, ...w]);
    el.reset();
    setStatus("idle");
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
      <form onSubmit={submit} className="space-y-6 lg:sticky lg:top-10 lg:self-start">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <label className="block">
          <span className="text-[var(--wed-indigo)]/70">Your name</span>
          <input name="name" required maxLength={120} className={field} />
        </label>
        <label className="block">
          <span className="text-[var(--wed-indigo)]/70">Your prayer or wish for them</span>
          <textarea name="message" required maxLength={600} rows={4} className={`${field} resize-none`} placeholder="May your home be…" />
        </label>
        {status === "error" && <p className="text-[var(--wed-coral)]">Your wish didn&apos;t go through. Check your connection and send it again.</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex h-12 items-center bg-[var(--wed-indigo)] px-8 font-medium text-[var(--wed-lace)] transition-colors hover:bg-[var(--wed-coral)] disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : "Add my wish"}
        </button>
      </form>

      {wishes.length ? (
        <ul className="columns-1 gap-6 sm:columns-2">
          {wishes.map((w, i) => (
            <Pop key={w.id} className="mb-6 break-inside-avoid border-l-2 pl-5" style={{ borderColor: i % 3 === 0 ? "var(--wed-coral)" : i % 3 === 1 ? "var(--wed-gold)" : "var(--wed-indigo)" }}>
              <p className="font-wed-display text-xl leading-snug text-[var(--wed-indigo)]">{w.message}</p>
              <p className="mt-2 text-[var(--wed-indigo)]/60">{w.name}</p>
            </Pop>
          ))}
        </ul>
      ) : (
        <p className="font-wed-display text-2xl italic text-[var(--wed-indigo)]/60">Be the first to write a prayer for the couple.</p>
      )}
    </div>
  );
}
