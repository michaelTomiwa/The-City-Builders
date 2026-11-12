"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * When a reader is most of the way through a post, a slim bar slides up from the
 * bottom offering the next one, so finishing a post leads straight into another.
 */
export function ReadNextBar({ href, title, label }: { href: string; title: string; label: string }) {
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const body = document.querySelector(".post-body");
    if (!body) return;
    const onScroll = () => {
      const rect = body.getBoundingClientRect();
      const read = (window.innerHeight - rect.top) / Math.max(rect.height, 1);
      setShow(read > 0.75);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (closed) return null;
  return (
    <div
      className={cn(
        "on-night fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-md bg-night text-starlight shadow-2xl ring-1 ring-white/10 transition-all duration-500 sm:bottom-6",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0"
      )}
      role="complementary"
      aria-label="Read next"
    >
      <div className="flex items-center gap-3 p-3 pl-4">
        <Link href={href} className="group min-w-0 flex-1">
          <span className="block text-xs uppercase tracking-wide text-lamp">{label}</span>
          <span className="block truncate font-display text-lg group-hover:text-lamp">{title} →</span>
        </Link>
        <button type="button" onClick={() => setClosed(true)} className="shrink-0 rounded-full px-2 text-xl leading-none text-starlight-dim hover:text-starlight" aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
}
