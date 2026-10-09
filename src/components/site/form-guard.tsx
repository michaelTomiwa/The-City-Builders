"use client";

import { useEffect } from "react";

/*
  Stops a form from being sent twice when someone taps "Save" again while the
  first save is still on its way (which created duplicate assignments). A form
  locks on submit and unlocks as soon as the server action it started has
  finished, or after 20 seconds at most. Search forms (GET) are never locked.
*/

const MAX_LOCK_MS = 20_000;

export function FormGuard() {
  useEffect(() => {
    const locked = new Map<HTMLFormElement, ReturnType<typeof setTimeout>>();
    let inFlight = 0;

    const release = (form: HTMLFormElement) => {
      clearTimeout(locked.get(form));
      locked.delete(form);
      delete form.dataset.sending;
    };
    const releaseAll = () => [...locked.keys()].forEach(release);

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() === "get") return;
      if (locked.has(form)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      form.dataset.sending = "1";
      locked.set(form, setTimeout(() => release(form), MAX_LOCK_MS));
      // A form that doesn't call the server unlocks right away.
      setTimeout(() => {
        if (inFlight === 0) release(form);
      }, 500);
    };

    // Server actions are POSTs carrying a "Next-Action" header; when none are
    // left in flight, every form is free again.
    const originalFetch = window.fetch;
    const isAction = (init?: RequestInit) => {
      const h = init?.headers;
      if (!h) return false;
      if (h instanceof Headers) return h.has("Next-Action");
      if (Array.isArray(h)) return h.some(([k]) => k.toLowerCase() === "next-action");
      return Object.keys(h).some((k) => k.toLowerCase() === "next-action");
    };
    window.fetch = async (input, init) => {
      if (!isAction(init)) return originalFetch(input, init);
      inFlight++;
      try {
        return await originalFetch(input, init);
      } finally {
        inFlight--;
        if (inFlight === 0) setTimeout(releaseAll, 50);
      }
    };

    window.addEventListener("submit", onSubmit, true);
    return () => {
      window.removeEventListener("submit", onSubmit, true);
      window.fetch = originalFetch;
      releaseAll();
    };
  }, []);

  return null;
}
