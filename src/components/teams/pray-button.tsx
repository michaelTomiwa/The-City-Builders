"use client";

import { useOptimistic, useTransition } from "react";
import { prayForPost } from "@/app/me/team-actions";
import { cn } from "@/lib/utils";

export function PrayButton({ postId, slug, count, mine }: { postId: string; slug: string; count: number; mine: boolean }) {
  const [state, set] = useOptimistic({ count, mine });
  const [, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          set({ count: state.count + (state.mine ? -1 : 1), mine: !state.mine });
          await prayForPost(postId, !state.mine, slug);
        })
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
        state.mine ? "border-gold bg-gold/15 text-gold-text" : "border-steel text-paper-dim hover:border-gold hover:text-paper"
      )}
    >
      🙏 {state.mine ? "Praying" : "I'm praying"}
      {state.count > 0 && <span className="tabular-nums">· {state.count}</span>}
    </button>
  );
}
