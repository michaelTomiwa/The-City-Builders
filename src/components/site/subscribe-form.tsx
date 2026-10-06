"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/** Adds an email to the subscribers list the admin can export. */
export function SubscribeForm({ tone = "light" }: { tone?: "light" | "night" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "already" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    setStatus("saving");
    const { error } = await supabase.from("subscribers").insert({ email: value });
    if (!error) setStatus("done");
    else if (error.code === "23505") setStatus("already");
    else setStatus("error");
  }

  if (status === "done" || status === "already") {
    return (
      <p className={cn("border-l-2 border-gold pl-4", tone === "night" ? "text-starlight" : "text-paper")} role="status">
        {status === "done" ? "You're on the list. Watch your inbox for the next word." : "You're already on the list. Thank you."}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <label className="sr-only" htmlFor={`subscribe-${tone}`}>
        Email address
      </label>
      <input
        id={`subscribe-${tone}`}
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(
          "h-11 min-w-0 flex-1 rounded-sm border px-4 focus:border-gold",
          tone === "night"
            ? "border-night-3 bg-night-2 text-starlight placeholder:text-starlight-dim/70"
            : "border-steel bg-white/70 text-paper placeholder:text-paper-dim/60"
        )}
      />
      <button
        type="submit"
        disabled={status === "saving"}
        className="h-11 shrink-0 rounded-sm bg-gold px-5 font-medium text-ink transition-colors hover:bg-gold-soft disabled:opacity-60"
      >
        {status === "saving" ? "Subscribing" : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="text-sm text-violet sm:basis-full" role="alert">
          That didn&apos;t go through. Check the address and try again.
        </p>
      )}
    </form>
  );
}
