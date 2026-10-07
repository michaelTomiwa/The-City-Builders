"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Registers the service worker and offers "Install the app".
 * Android and desktop Chrome get the real install prompt; iPhones get the
 * two-step Share → Add to Home Screen instructions, since Safari has no prompt.
 */
export function InstallApp() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const t = setTimeout(() => {
      setInstalled(standalone);
      setIos(isIos && !standalone);
    }, 0);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!deferred && !ios)) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else {
      setShowHelp((v) => !v);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-sm border border-lamp/60 px-4 py-2 text-sm text-lamp transition-colors hover:bg-lamp hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Install the app
      </button>
      {showHelp && (
        <p className="text-sm text-starlight-dim" role="status">
          On iPhone: tap the Share button <span aria-hidden="true">(□↑)</span>, then &ldquo;Add to Home Screen&rdquo;.
        </p>
      )}
    </div>
  );
}
