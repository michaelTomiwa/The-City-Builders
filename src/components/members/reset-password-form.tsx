"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    if (password !== String(fd.get("confirm") ?? "")) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(error.message.includes("session") ? "This link has expired. Ask for a new one from the sign-in page." : error.message);
      return;
    }
    router.push("/me");
    router.refresh();
  }

  const field = "mt-1.5 h-11 w-full rounded-sm border border-night-3 bg-night/60 px-3 text-starlight outline-none focus:border-lamp";
  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm text-starlight-dim">
        New password
        <input name="password" type="password" required minLength={6} autoComplete="new-password" className={field} />
      </label>
      <label className="block text-sm text-starlight-dim">
        Type it again
        <input name="confirm" type="password" required minLength={6} autoComplete="new-password" className={field} />
      </label>
      {error && (
        <p className="text-sm text-[#ff9b85]" role="alert">
          {error}
        </p>
      )}
      <button disabled={busy} className="h-12 w-full bg-gold font-medium text-ink hover:bg-gold-soft disabled:opacity-60">
        {busy ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}
