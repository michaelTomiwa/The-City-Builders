"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

const field =
  "w-full rounded-none border-0 border-b border-[var(--wed-mist)]/50 bg-transparent px-0 py-2.5 text-lg text-[var(--wed-lace)] placeholder:text-[var(--wed-mist)]/60 focus:border-[var(--wed-gold)] focus:outline-none focus:ring-0";

export function RsvpForm({ wedding, events, couple }: { wedding: string; events: Option[]; couple: string }) {
  const [attending, setAttending] = useState<boolean | null>(null);
  const [chosen, setChosen] = useState<string[]>(events.map((e) => e.id));
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [sentName, setSentName] = useState("");
  const [answer, setAnswer] = useState(true);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if ((form.get("website") as string)?.trim()) return; // bots fill the hidden field
    const name = String(form.get("name") ?? "").trim();
    if (!name || attending === null) return;
    setStatus("sending");
    const { error } = await supabase.from("wedding_rsvps").insert({
      wedding,
      name: name.slice(0, 120),
      phone: String(form.get("phone") ?? "").trim().slice(0, 40) || null,
      attending,
      guests: attending ? Number(form.get("guests") ?? 1) : 0,
      events: attending ? chosen : [],
      note: String(form.get("note") ?? "").trim().slice(0, 1000) || null,
    });
    if (error) return setStatus("error");
    setSentName(name.split(" ")[0]);
    setAnswer(attending);
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div className="py-6" role="status">
        <p className="font-wed-display text-4xl italic text-[var(--wed-gold)]">Thank you, {sentName}.</p>
        <p className="mt-3 max-w-md text-lg leading-relaxed text-[var(--wed-lace)]">
          {answer ? `${couple} can't wait to celebrate with you. Save the dates in your calendar below.` : `We'll miss you, and we're grateful for your prayers.`}
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-6 text-[var(--wed-mist)] underline decoration-[var(--wed-gold)] underline-offset-4 hover:text-[var(--wed-lace)]">
          Reply for someone else
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <fieldset>
        <legend className="mb-3 text-[var(--wed-mist)]">Will you be there?</legend>
        <div className="grid grid-cols-2 gap-3">
          {[
            [true, "Joyfully, yes"],
            [false, "Sadly, no"],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={attending === value}
              onClick={() => setAttending(value as boolean)}
              className={cn(
                "border px-4 py-4 text-left font-wed-display text-xl transition-colors",
                attending === value ? "border-[var(--wed-gold)] bg-[var(--wed-gold)] text-[var(--wed-indigo)]" : "border-[var(--wed-mist)]/40 text-[var(--wed-lace)] hover:border-[var(--wed-gold)]"
              )}
            >
              {label as string}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-8 sm:grid-cols-2">
        <label className="block">
          <span className="text-[var(--wed-mist)]">Your name</span>
          <input name="name" required maxLength={120} autoComplete="name" className={field} placeholder="As on your invitation" />
        </label>
        <label className="block">
          <span className="text-[var(--wed-mist)]">Phone or WhatsApp</span>
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={field} placeholder="So the family can reach you" />
        </label>
      </div>

      {attending && (
        <>
          <label className="block max-w-[12rem]">
            <span className="text-[var(--wed-mist)]">How many of you, including you?</span>
            <select name="guests" defaultValue="1" className={cn(field, "[&>option]:text-black")}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="mb-3 text-[var(--wed-mist)]">Which will you attend?</legend>
            <div className="flex flex-wrap gap-3">
              {events.map((e) => {
                const on = chosen.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChosen((c) => (on ? c.filter((x) => x !== e.id) : [...c, e.id]))}
                    className={cn(
                      "border px-4 py-2 transition-colors",
                      on ? "border-[var(--wed-gold)] text-[var(--wed-gold)]" : "border-[var(--wed-mist)]/40 text-[var(--wed-mist)] line-through decoration-1 hover:border-[var(--wed-gold)]"
                    )}
                  >
                    {e.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </>
      )}

      <label className="block">
        <span className="text-[var(--wed-mist)]">Anything we should know? (optional)</span>
        <textarea name="note" rows={2} maxLength={1000} className={cn(field, "resize-none")} placeholder="Dietary needs, a song request, a word for the couple" />
      </label>

      {status === "error" && <p className="text-[#ffb4a8]">Your reply didn&apos;t go through. Check your connection and send it again.</p>}

      <button
        type="submit"
        disabled={attending === null || status === "sending"}
        className="inline-flex h-14 items-center bg-[var(--wed-lace)] px-10 text-lg font-medium text-[var(--wed-indigo)] transition-colors hover:bg-[var(--wed-gold)] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "sending" ? "Sending…" : "Send my reply"}
      </button>
    </form>
  );
}
