"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";

const field =
  "mt-1.5 h-11 w-full rounded-sm border border-night-3 bg-night/60 px-3 text-starlight outline-none placeholder:text-starlight-dim/60 focus:border-lamp";

/** Sign in, or create a member account (the pastor approves new members). */
export function JoinForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "join">("join");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function forgot(form: HTMLFormElement | null) {
    const email = String(new FormData(form ?? undefined).get("email") ?? "").trim();
    if (!email) {
      setError("Type your email above first, then tap “Forgot password?”.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setResetSent(true);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    const supabase = createClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message === "Invalid login credentials" ? "That email and password don't match." : error.message);
        setBusy(false);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: String(form.get("full_name") ?? "").trim(), phone: String(form.get("phone") ?? "").trim() },
          emailRedirectTo: `${window.location.origin}${next}`,
        },
      });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      if (!data.session) {
        setCheckEmail(true);
        setBusy(false);
        return;
      }
    }
    router.push(next);
    router.refresh();
  }

  if (resetSent) {
    return (
      <div className="border border-night-3 bg-night-2/80 p-7 backdrop-blur-sm">
        <h2 className="font-display text-3xl">Check your email</h2>
        <p className="mt-3 leading-relaxed text-starlight-dim">
          If there&rsquo;s an account for that email, we&rsquo;ve sent a link to set a new password. It can take a minute or two.
        </p>
        <button type="button" onClick={() => setResetSent(false)} className="mt-5 text-lamp underline-offset-4 hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  if (checkEmail) {
    return (
      <div className="border border-night-3 bg-night-2/80 p-7 backdrop-blur-sm">
        <h2 className="font-display text-3xl">Check your email</h2>
        <p className="mt-3 leading-relaxed text-starlight-dim">
          We sent you a link to confirm your account. Open it on this device, then come back and sign in.
        </p>
        <button type="button" onClick={() => { setCheckEmail(false); setMode("sign-in"); }} className="mt-5 text-lamp underline-offset-4 hover:underline">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="border border-night-3 bg-night-2/80 p-7 shadow-[0_0_80px_-30px_rgba(240,180,76,0.5)] backdrop-blur-sm">
      <div className="grid grid-cols-2 rounded-sm bg-night/70 p-1 text-sm" role="tablist">
        {(["join", "sign-in"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setError(null); }}
            className={cn("rounded-sm py-2 transition-colors", mode === m ? "bg-lamp text-ink" : "text-starlight-dim hover:text-starlight")}
          >
            {m === "join" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "join" && (
          <>
            <label className="block text-sm text-starlight-dim">
              Full name
              <input name="full_name" required autoComplete="name" className={field} placeholder="Adaeze Okafor" />
            </label>
            <label className="block text-sm text-starlight-dim">
              Phone (optional)
              <input name="phone" type="tel" autoComplete="tel" className={field} placeholder="+234" />
            </label>
          </>
        )}
        <label className="block text-sm text-starlight-dim">
          Email
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="block text-sm text-starlight-dim">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "join" ? "new-password" : "current-password"}
            className={field}
          />
        </label>
        {mode === "sign-in" && (
          <button
            type="button"
            onClick={(e) => forgot(e.currentTarget.form)}
            className="-mt-2 text-sm text-starlight-dim underline-offset-4 hover:text-lamp hover:underline"
          >
            Forgot password?
          </button>
        )}
        {error && (
          <p className="text-sm text-[#ff9b85]" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="h-12 w-full bg-gold font-medium text-ink transition-colors hover:bg-gold-soft disabled:opacity-60"
        >
          {busy ? "One moment…" : mode === "join" ? "Create my account" : "Sign in"}
        </button>
        {mode === "join" && (
          <p className="text-xs leading-relaxed text-starlight-dim">
            Pastor Michael&apos;s team will confirm you&apos;re part of the house, then your dashboard opens.
          </p>
        )}
      </form>
    </div>
  );
}
