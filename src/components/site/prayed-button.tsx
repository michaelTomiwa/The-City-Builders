"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/** "I prayed" on the prayer wall: once per browser, shown as a running count. */
export function PrayedButton({ id, initial }: { id: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setDone(window.localStorage.getItem(`cb-prayed-${id}`) === "1");
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [id]);

  async function pray() {
    if (done) return;
    setDone(true);
    setCount((c) => c + 1);
    try {
      window.localStorage.setItem(`cb-prayed-${id}`, "1");
    } catch {}
    const { data } = await supabase.rpc("pray_for", { request_id: id });
    if (typeof data === "number") setCount(data);
  }

  return (
    <button
      type="button"
      onClick={pray}
      aria-pressed={done}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        done ? "border-gold bg-gold/15 text-gold-text" : "border-steel text-paper-dim hover:border-gold hover:text-paper"
      )}
    >
      {done ? "You prayed" : "I prayed"}
      {count > 0 && <span className="ml-1.5 tabular-nums">{count}</span>}
    </button>
  );
}
