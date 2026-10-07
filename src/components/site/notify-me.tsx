"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

/*
  "Notify me when we go live": subscribes this phone or laptop to web push,
  so it gets an alert 5 minutes before Night Watch and Morning Prayers.
  iPhones can only receive alerts once the site is added to the Home Screen.
*/

type State = "loading" | "unsupported" | "ios-install" | "off" | "on" | "blocked" | "busy";

const PUBLIC_KEY = VAPID_PUBLIC_KEY;

function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export function NotifyMe({ tone = "night", className }: { tone?: "night" | "paper"; className?: string }) {
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const settle = (s: State) => {
      if (!cancelled) setState(s);
    };

    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    const t = setTimeout(async () => {
      if (!supported) return settle(isIos && !standalone ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return settle("blocked");
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        settle(sub ? "on" : "off");
      } catch {
        settle("off");
      }
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  async function turnOn() {
    setState("busy");
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "blocked" : "off");
        return;
      }
      const reg = await registration();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) }));
      const json = sub.toJSON();
      const { error } = await supabase.rpc("save_push_subscription", {
        p_endpoint: sub.endpoint,
        p_p256dh: json.keys?.p256dh ?? "",
        p_auth: json.keys?.auth ?? "",
      });
      if (error) throw error;
      setState("on");
      setMessage("You're on the list. We'll alert you 5 minutes before we go live.");
    } catch {
      setState("off");
      setMessage("Couldn't turn on alerts. Please try again.");
    }
  }

  async function turnOff() {
    setState("busy");
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await supabase.rpc("remove_push_subscription", { p_endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setState("off");
      setMessage("Alerts are off on this device.");
    } catch {
      setState("on");
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  const night = tone === "night";
  const dim = night ? "text-starlight-dim" : "text-paper-dim";

  if (state === "ios-install") {
    return (
      <p className={cn("text-sm", dim, className)}>
        <BellIcon className="mr-1.5 inline h-4 w-4 align-[-3px] text-lamp" />
        Want an alert when we go live? On iPhone, add this site to your Home Screen first (Share, then
        &ldquo;Add to Home Screen&rdquo;), then open it from there.
      </p>
    );
  }

  if (state === "blocked") {
    return (
      <p className={cn("text-sm", dim, className)}>
        <BellIcon className="mr-1.5 inline h-4 w-4 align-[-3px]" />
        Alerts are blocked for this site. Allow notifications in your browser settings to get them.
      </p>
    );
  }

  const on = state === "on";

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <button
        type="button"
        onClick={on ? turnOff : turnOn}
        disabled={state === "busy"}
        aria-pressed={on}
        className={cn(
          "group inline-flex h-11 items-center gap-2.5 rounded-sm border px-5 text-[0.95rem] transition-colors disabled:opacity-60",
          on
            ? "border-lamp bg-lamp/15 text-lamp hover:bg-lamp/25"
            : night
              ? "border-lamp/60 text-starlight hover:border-lamp hover:bg-lamp hover:text-ink"
              : "border-gold text-paper hover:bg-gold hover:text-ink"
        )}
      >
        <BellIcon className={cn("h-[18px] w-[18px]", !on && "group-hover:animate-[ring_0.6s_ease-in-out]")} filled={on} />
        {state === "busy" ? "One moment…" : on ? "Alerts on. Tap to turn off" : "Notify me when we go live"}
      </button>
      {message && (
        <p className={cn("text-sm", dim)} role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function BellIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" strokeLinejoin="round" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  );
}
