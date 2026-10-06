"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { compact } from "@/lib/blog";
import { MetaIcon } from "./post-meta";
import { cn } from "@/lib/utils";

function readStore(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string, session = false) {
  try {
    (session ? window.sessionStorage : window.localStorage).setItem(key, value);
  } catch {
    // storage unavailable; counts still work, just without de-duplication
  }
}

/** Counts this visit once per browser session and shows the running total. */
export function ViewCounter({ slug, initial }: { slug: string; initial: number }) {
  const [views, setViews] = useState(initial);

  useEffect(() => {
    const key = `cb-read-${slug}`;
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(key) === "1";
    } catch {}
    if (seen) return;
    writeStore(key, "1", true);
    supabase.rpc("increment_post_view", { post_slug: slug }).then(({ data }) => {
      if (typeof data === "number") setViews(data);
    });
  }, [slug]);

  return (
    <span className="inline-flex items-center gap-1.5">
      <MetaIcon name="eye" />
      {compact(views)} {views === 1 ? "read" : "reads"}
    </span>
  );
}

/** The blog's "like": an Amen, once per browser. */
export function AmenButton({ slug, initial }: { slug: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const [said, setSaid] = useState(false);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setSaid(readStore(`cb-amen-${slug}`) === "1"), 0);
    return () => clearTimeout(id);
  }, [slug]);

  async function sayAmen() {
    if (said) return;
    setSaid(true);
    setCount((c) => c + 1);
    setBurst((b) => b + 1);
    writeStore(`cb-amen-${slug}`, "1");
    const { data } = await supabase.rpc("like_post", { post_slug: slug });
    if (typeof data === "number") setCount(data);
  }

  return (
    <button
      type="button"
      onClick={sayAmen}
      aria-pressed={said}
      className={cn(
        "relative inline-flex h-11 items-center gap-2 rounded-full border px-5 transition-colors",
        said ? "border-gold bg-gold/15 text-gold-text" : "border-steel text-paper hover:border-gold"
      )}
    >
      <motion.span animate={said ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.4 }} className={said ? "text-[#c2412a]" : ""}>
        <MetaIcon name="heart" />
      </motion.span>
      {said ? "Amen" : "Say Amen"}
      <span className="tabular-nums text-paper-dim">{compact(count)}</span>
      <AnimatePresence>
        {burst > 0 && (
          <motion.span
            key={burst}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -28 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-medium text-gold-text"
            aria-hidden="true"
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/** Share to WhatsApp, X and Facebook, or copy the link. */
export function ShareBar({ title, path }: { title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(path);

  useEffect(() => {
    const id = setTimeout(() => setUrl(window.location.origin + path), 0);
    return () => clearTimeout(id);
  }, [path]);

  const text = encodeURIComponent(`${title} — The City Builders`);
  const link = encodeURIComponent(url);
  const targets = [
    { label: "WhatsApp", href: `https://wa.me/?text=${text}%20${link}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${text}&url=${link}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${link}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-paper-dim">Share</span>
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-steel px-4 py-1.5 text-sm text-paper transition-colors hover:border-gold hover:text-gold-text"
        >
          {t.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="rounded-full border border-steel px-4 py-1.5 text-sm text-paper transition-colors hover:border-gold hover:text-gold-text"
        aria-live="polite"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
