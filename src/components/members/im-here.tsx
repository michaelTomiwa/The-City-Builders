"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase-browser";
import { markAttendance } from "@/app/me/actions";
import { liveService } from "@/lib/schedule";
import { cn } from "@/lib/utils";

/** "I'm here": during a service, signed-in members mark themselves present. It counts toward their growth. */
export function ImHere({ tone = "night", className }: { tone?: "night" | "paper"; className?: string }) {
  const [live, setLive] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [state, setState] = useState<"idle" | "done" | "closed">("idle");
  const [pending, start] = useTransition();

  useEffect(() => {
    const check = () => setLive(liveService(Date.now())?.title ?? null);
    const first = setTimeout(check, 0);
    const id = setInterval(check, 30_000);
    createClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)));
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (!live || !signedIn) return null;

  const night = tone === "night";
  if (state === "done") {
    return (
      <p className={cn("inline-flex items-center gap-2 text-sm", night ? "text-lamp" : "text-[#24613a]", className)} role="status">
        <span aria-hidden="true">✓</span> You&rsquo;re marked present at {live}. Glad you&rsquo;re here.
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await markAttendance();
          setState(r.ok ? "done" : "closed");
        })
      }
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-sm px-5 font-medium transition-colors disabled:opacity-60",
        night ? "bg-lamp text-ink hover:bg-gold-soft" : "bg-[#3d9a6a] text-white hover:bg-[#33845a]",
        className
      )}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e55a3c] opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#e55a3c]" />
      </span>
      {state === "closed" ? "Check-in has closed for this service" : `I'm here at ${live}`}
    </button>
  );
}
