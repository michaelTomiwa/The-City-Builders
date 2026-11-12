"use client";

import { useEffect, useState } from "react";
import { NotifyMe } from "./notify-me";
import { cn } from "@/lib/utils";

const KEY = "cb-alerts-prompt-hidden-until";

/**
 * "Don't miss the next word": a small card that slides in once a visitor has
 * read part of a post (or after a little while on the page), offering phone
 * alerts in one tap. Never shown to phones that already have alerts on or have
 * blocked them, and kept away for two weeks after "Not now".
 */
export function AlertsPrompt({ watch = ".post-body", delayMs = 45_000 }: { watch?: string; delayMs?: number }) {
  const [eligible, setEligible] = useState(false);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  // Only for devices that can get alerts and don't have them yet.
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (Number(localStorage.getItem(KEY) ?? 0) > Date.now()) return;
      } catch {}
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (!("Notification" in window) && !ios) return;
      if ("Notification" in window && Notification.permission === "denied") return;
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (await reg?.pushManager?.getSubscription()) return;
      } catch {}
      setEligible(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Then wait until they have read part of the page, or spent a little while on it.
  useEffect(() => {
    if (!eligible) return;
    const reveal = () => setShow(true);
    const timer = setTimeout(reveal, delayMs);
    const target = document.querySelector(watch);
    const onScroll = () => {
      if (!target) return;
      const rect = target.getBoundingClientRect();
      if ((window.innerHeight - rect.top) / Math.max(rect.height, 1) > 0.4) reveal();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [eligible, watch, delayMs]);

  function later(days = 14) {
    try {
      localStorage.setItem(KEY, String(Date.now() + days * 86_400_000));
    } catch {}
    setShow(false);
    setEligible(false);
  }

  if (!eligible) return null;
  return (
    <div
      className={cn(
        "fixed inset-x-3 top-20 z-40 mx-auto max-w-md rounded-md border border-gold/50 bg-[#fffaf0] p-4 shadow-2xl transition-all duration-500 sm:left-auto sm:right-6 sm:mx-0",
        show ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-6 opacity-0"
      )}
      role="dialog"
      aria-label="Get alerts on your phone"
    >
      {done ? (
        <div className="flex items-start justify-between gap-3">
          <p className="text-paper">
            <span className="font-display text-xl">You&apos;re in. 🙏</span>
            <span className="mt-1 block text-sm text-paper-dim">We&apos;ll let you know when the next word is posted, and 5 minutes before Night Watch.</span>
          </p>
          <button type="button" onClick={() => later(365)} className="text-xl leading-none text-paper-dim hover:text-paper" aria-label="Close">
            ×
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-xl leading-snug text-paper">Don&apos;t miss the next word</p>
              <p className="mt-1 text-sm leading-relaxed text-paper-dim">
                Get a short alert on this phone when Pastor Michael&apos;s next word is posted, and 5 minutes before Night Watch. No spam, and you can turn it off any time.
              </p>
            </div>
            <button type="button" onClick={() => later()} className="text-xl leading-none text-paper-dim hover:text-paper" aria-label="Close">
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <NotifyMe
              tone="paper"
              label="Yes, alert me"
              onTurnedOn={() => {
                setDone(true);
                setTimeout(() => later(365), 6000);
              }}
            />
            <button type="button" onClick={() => later()} className="text-sm text-paper-dim hover:text-paper">
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
