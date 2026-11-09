"use client";

import { useEffect, useState } from "react";
import { NotifyMe } from "@/components/site/notify-me";

const KEY = "cb-alerts-nudge-hidden-until";

/** A gentle card on the dashboard for members whose phone doesn't have alerts on yet. */
export function AlertsNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (Number(localStorage.getItem(KEY) ?? 0) > Date.now()) return;
      } catch {}
      if (!("Notification" in window) && !/iphone|ipad|ipod/i.test(navigator.userAgent)) return;
      if ("Notification" in window && Notification.permission === "denied") return;
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        const sub = await reg?.pushManager?.getSubscription();
        if (!sub) setShow(true);
      } catch {
        setShow(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  function later() {
    try {
      localStorage.setItem(KEY, String(Date.now() + 7 * 86_400_000));
    } catch {}
    setShow(false);
  }

  return (
    <section className="rounded-md border border-gold/50 bg-[#fdf7ea] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-xl text-paper">Turn on alerts on this phone</p>
        <button type="button" onClick={later} className="shrink-0 text-xs text-paper-dim hover:text-paper">
          Not now
        </button>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-paper-dim">
        <li>🔔 5 minutes before Night Watch and Morning Prayers</li>
        <li>🍽️ 6 AM on fast days, and your week every Monday</li>
        <li>📝 Before assignments are due, and when the pastor replies</li>
      </ul>
      <NotifyMe tone="paper" label="Turn on alerts" className="mt-4" />
    </section>
  );
}
