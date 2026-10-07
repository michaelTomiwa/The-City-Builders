"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { liveService } from "@/lib/schedule";

/** A small "Live now" pill that only appears while a scheduled service is on air. */
export function LiveBadge() {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setTitle(liveService(Date.now())?.title ?? null);
    const first = setTimeout(check, 0);
    const id = setInterval(check, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  if (!title) return null;

  return (
    <Link
      href="/live"
      className="inline-flex items-center gap-2 rounded-full border border-[#e55a3c]/60 bg-[#e55a3c]/10 px-3 py-1 text-xs text-starlight transition-colors hover:bg-[#e55a3c]/25"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e55a3c] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e55a3c]" />
      </span>
      {title} is live
    </Link>
  );
}
