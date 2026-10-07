"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

/** How many people have the watch room open right now (Supabase Realtime presence). */
export function usePrayingNow() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const key = crypto.randomUUID();
    const channel = supabase.channel("watch-room", { config: { presence: { key } } });

    channel
      .on("presence", { event: "sync" }, () => {
        setCount(Object.keys(channel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ at: Date.now() });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}

export function PrayingNow({ count }: { count: number | null }) {
  const shown = count ?? 1;
  const dots = Math.min(shown, 12);

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-lamp/30 animate-[breathe_4s_ease-in-out_infinite]" />
        <span className="relative h-3 w-3 rounded-full bg-lamp shadow-[0_0_18px_4px_rgba(240,180,76,0.6)]" />
      </div>
      <div>
        <p className="font-display text-3xl leading-none text-starlight tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={shown}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              className="inline-block"
            >
              {shown}
            </motion.span>
          </AnimatePresence>
        </p>
        <p className="mt-1 text-sm text-starlight-dim">
          {shown === 1 ? "person keeping watch here" : "people keeping watch here"}
        </p>
        <div className="mt-2 flex gap-1" aria-hidden="true">
          {Array.from({ length: dots }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-lamp/80 animate-[breathe_3s_ease-in-out_infinite]"
              style={{ animationDelay: `${(i * 0.37) % 3}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
