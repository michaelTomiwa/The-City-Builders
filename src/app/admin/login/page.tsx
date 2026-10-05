"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/site/logo-mark";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "check-email">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const supabase = createClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("error");
        setError(error.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setStatus("error");
        setError(error.message);
        return;
      }
      setStatus("check-email");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <LogoMark className="h-10 w-10 text-gold" />
      <h1 className="mt-6 font-display text-3xl text-paper">Admin access</h1>
      <p className="mt-2 text-sm text-paper-dim">
        {mode === "sign-in"
          ? "Sign in to manage blog posts."
          : "Create an account, then ask the site owner to grant admin access."}
      </p>

      {status === "check-email" ? (
        <div className="mt-8 border-l-2 border-gold pl-4">
          <p className="text-paper">Check your email to confirm your account.</p>
          <button
            onClick={() => {
              setMode("sign-in");
              setStatus("idle");
            }}
            className="mt-3 text-sm text-gold-text hover:text-ink"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm text-paper-dim">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-paper-dim">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
            />
          </div>

          {status === "error" && <p className="text-sm text-violet">{error}</p>}

          <Button type="submit" disabled={status === "loading"} className="w-full">
            {status === "loading"
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            className="w-full text-center text-sm text-paper-dim hover:text-gold-text"
          >
            {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      )}
    </div>
  );
}
