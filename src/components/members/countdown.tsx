"use client";

import { useEffect, useState } from "react";
import { timeLeft } from "@/lib/accountability";
import { cn } from "@/lib/utils";

/** "1d 4h left", counting down every minute; red on the last day. */
export function Countdown({ due, className }: { due: string; className?: string }) {
  const [left, setLeft] = useState<ReturnType<typeof timeLeft>>(null);
  useEffect(() => {
    const tick = () => setLeft(timeLeft(due));
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [due]);
  if (!left) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums",
        left.urgent ? "bg-[#f6e1dc] text-[#8a2f1e]" : "bg-dusk text-paper-dim",
        className
      )}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M10 2h4" strokeLinecap="round" />
      </svg>
      {left.text}
    </span>
  );
}
